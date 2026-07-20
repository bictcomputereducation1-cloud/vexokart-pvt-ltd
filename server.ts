import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import axios from "axios";

dotenv.config();

const FIN_FILE = path.join(process.cwd(), "vendor_finances.json");

function getFinData() {
  if (!fs.existsSync(FIN_FILE)) {
    const initial = {
      wallets: {},
      payouts: [],
      earnings_ledger: []
    };
    fs.writeFileSync(FIN_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(FIN_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading fin file, returning empty structure", err);
    return { wallets: {}, payouts: [], earnings_ledger: [] };
  }
}

function saveFinData(data: any) {
  try {
    fs.writeFileSync(FIN_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing fin file", err);
  }
}

// Helper to clean environment variables (removes quotes and whitespace)
const cleanEnvVar = (value: string | undefined) => {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "").trim();
};

// Initialize Supabase Client
const supabaseUrl = cleanEnvVar(process.env.VITE_SUPABASE_URL);
const supabaseKey = cleanEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase environment variables are missing!");
}

let supabase: any;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (err) {
  console.error("FATAL: Failed to initialize Supabase client:", err);
}

// Helper to resolve service area and vendor from pincode
async function resolveOrderAssignment(pincode: string, lat?: number, lng?: number) {
  try {
    // 1. Resolve serviceable area
    const { data: area } = await supabase
      .from('service_areas')
      .select('id, latitude, longitude')
      .eq('pincode', pincode)
      .eq('is_active', true)
      .maybeSingle();

    if (!area) return { service_area_id: null, vendor_id: null };

    // 2. Find vendors for this area
    const { data: vendors } = await supabase
      .from('vendors')
      .select('user_id, latitude, longitude')
      .eq('service_area_id', area.id)
      .eq('is_active', true);

    if (!vendors || vendors.length === 0) {
      return { service_area_id: area.id, vendor_id: null };
    }

    // 3. Simple assignment: Nearest if coords available, else first
    let assignedVendorId = vendors[0].user_id;

    if (lat && lng) {
      let minDistance = Infinity;
      vendors.forEach(v => {
        if (v.latitude && v.longitude) {
          const dist = Math.sqrt(Math.pow(Number(v.latitude) - lat, 2) + Math.pow(Number(v.longitude) - lng, 2));
          if (dist < minDistance) {
            minDistance = dist;
            assignedVendorId = v.user_id;
          }
        }
      });
    }

    return { service_area_id: area.id, vendor_id: assignedVendorId };
  } catch (error) {
    console.error("Assignment resolution error:", error);
    return { service_area_id: null, vendor_id: null };
  }
}

async function startServer() {
  console.log("[SERVER] Starting server initialization...");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Disable development request logging unless process.env.VEXO_VERBOSE is set
  app.use((req, res, next) => {
    if (process.env.VEXO_VERBOSE) {
      console.log(`[REQUEST] ${new Date().toISOString()} ${req.method} ${req.url}`);
    }
    next();
  });

  // API Debug Logger
  app.all("/api/*", (req, res, next) => {
    if (process.env.VEXO_VERBOSE) {
      console.log(`[API-DEBUG] ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  // Test route for user verification
  app.get("/api/test-json", (req, res) => {
    res.json({ success: true, message: "Server is responding with JSON" });
  });

  app.post("/api/payment/order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      const razorpayKeyId = cleanEnvVar(process.env.RAZORPAY_KEY_ID);
      const razorpayKeySecret = cleanEnvVar(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET);

      console.log(`[DEBUG] Razorpay Key ID loaded: ${razorpayKeyId ? 'YES (' + razorpayKeyId.slice(0, 4) + '...)' : 'MISSING'}`);
      console.log(`[DEBUG] Razorpay Key Secret loaded: ${razorpayKeySecret ? 'YES (' + razorpayKeySecret.slice(0, 2) + '...)' : 'MISSING'}`);

      if (!razorpayKeyId || !razorpayKeySecret) {
        console.error("Razorpay keys missing in environment variables!");
        return res.status(500).json({ 
          error: "Razorpay server configuration error",
        });
      }

      // Create Basic Authentication header
      const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

      console.log(`Initiating Razorpay order for ${amount} INR...`);

      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authHeader}`
        },
        body: JSON.stringify({
          amount: Math.round(Number(amount) * 100),
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
        })
      });

      const text = await response.text();
      console.log("Raw Razorpay order response:", text);

      let order;
      try {
        order = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON response from Razorpay:", text);
        return res.status(500).json({ error: "Razorpay returned non-JSON response" });
      }

      if (response.status !== 200 && response.status !== 201) {
        console.error("Razorpay API order creation failed:", JSON.stringify(order, null, 2));
        return res.status(response.status).json({
          error: "Razorpay order creation failed",
          details: order
        });
      }

      console.log("Razorpay order created successfully:", order.id);
      res.json(order);
    } catch (error: any) {
      console.error("Razorpay Order Server Error:", error);
      res.status(500).json({ error: "Internal server error during payment initiation" });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        userId,
        amount,
        items,
        address,
        pincode,
        discount_amount,
        coupon_code,
        delivery_fee,
        vendor_id, 
        service_area_id,
        latitude,
        longitude
      } = req.body;
 
      const razorpayKeySecret = cleanEnvVar(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET);
 
      // 1. Verify signature
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(sign.toString())
        .digest("hex");
 
      if (razorpay_signature !== expectedSign) {
        console.error("Razorpay signature verification failed");
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }
 
      console.log("Payment verified for area:", service_area_id);
 
      // Auto-resolve assignment if missing or as primary source of truth
      const assignment = await resolveOrderAssignment(pincode, latitude, longitude);
      
      if (!assignment.service_area_id) {
        console.error(`[ERROR] Pincode ${pincode} is not linked to any serviceable area. Blocking order.`);
        return res.status(400).json({ 
          success: false, 
          message: "Sorry, we do not provide service in this area (invalid pincode)." 
        });
      }

      const finalVendorId = vendor_id || assignment.vendor_id;
      const finalAreaId = assignment.service_area_id;

      // 2. Create order in Supabase
      const orderEntry: any = {
        user_id: userId,
        total_amount: amount,
        vendor_id: finalVendorId,
        service_area_id: finalAreaId,
        pincode: pincode,
        discount_amount: discount_amount || 0,
        coupon_code: coupon_code || null,
        delivery_fee: delivery_fee || 0,
        status: 'placed',
        payment_method: 'online',
        payment_status: 'paid',
        payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        address: address,
        latitude: latitude || null,
        longitude: longitude || null
      };
 
      let { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderEntry])
        .select()
        .single();
 
      if (orderError && (orderError.message?.includes('latitude') || orderError.message?.includes('longitude'))) {
        console.warn("Retrying order creation without GPS coordinates due to schema mismatch");
        const { latitude: _, longitude: __, ...fallbackEntry } = orderEntry;
        const retryResult = await supabase
          .from('orders')
          .insert([fallbackEntry])
          .select()
          .single();
        newOrder = retryResult.data;
        orderError = retryResult.error;
      }
 
      if (orderError) {
        console.error("Order creation error:", JSON.stringify(orderError, null, 2));
        throw orderError;
      }

      // 3. Create order items
      const orderItems = items.map((item: any) => ({
        order_id: newOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error("Items insertion error:", itemsError);
        throw itemsError;
      }

      for (const item of items) {
        const { data: prod } = await supabase.from('products').select('stock, stock_units').eq('id', item.id).single();
        if (prod) {
          const currentStock = typeof prod.stock === 'number' ? prod.stock : 0;
          const currentStockUnits = typeof prod.stock_units === 'number' ? prod.stock_units : currentStock;
          const newStock = Math.max(0, currentStock - item.quantity);
          const newStockUnits = Math.max(0, currentStockUnits - item.quantity);
          await supabase.from('products').update({ 
            stock: newStock,
            stock_units: newStockUnits
          }).eq('id', item.id);
        }
      }

      return res.json({ success: true, message: "Order confirmed successfully", orderId: newOrder.id });
    } catch (error) {
      console.error("Verification Error:", error);
      res.status(500).json({ error: "Order placement failed after payment" });
    }
  });

  // GET vendors
  app.get("/api/admin/vendors", async (req, res) => {
    console.log("[SERVER] Hit /api/admin/vendors");
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are missing on the server");
      }

      console.log(`Fetching vendors... (URL: ${supabaseUrl ? 'SET' : 'MISSING'}, KEY: ${supabaseKey ? 'SET' : 'MISSING'})`);
      
      const { data: vendors, error: vError } = await supabase
        .from("vendors")
        .select("*")
        .order('created_at', { ascending: false });
        
      if (vError) {
        console.error("Vendors base fetch error:", vError);
        return res.status(500).json({ error: vError.message, details: vError });
      }

      console.log(`Found ${vendors?.length || 0} vendors in database.`);

      const vendorsList = vendors || [];
      if (vendorsList.length === 0) {
        return res.json([]);
      }

      // Fetch users and areas separately to merge
      const userIds = vendorsList.map(v => v.user_id).filter(Boolean);
      const areaIds = vendorsList.map(v => v.service_area_id).filter(Boolean);

      const [usersRes, areasRes] = await Promise.all([
        userIds.length > 0 ? supabase.from('users').select('id, name, email').in('id', userIds) : Promise.resolve({ data: [] }),
        areaIds.length > 0 ? supabase.from('service_areas').select('*').in('id', areaIds) : Promise.resolve({ data: [] })
      ]);

      const users = usersRes.data || [];
      const areas = areasRes.data || [];

      const flattened = vendorsList.map((v: any) => {
        const user = users.find(u => u.id === v.user_id);
        const area = areas.find(a => a.id === v.service_area_id);
        
        return {
          ...v,
          name: user?.name || v.store_name,
          email: user?.email || "",
          service_area: area,
          service_areas: area, // Compatibility
          user: user,
          users: user // Compatibility
        };
      });

      res.json(flattened);
    } catch (error: any) {
      console.error("Critical vendors fetch error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch vendors",
        details: error 
      });
    }
  });

  // POST vendor
  app.post("/api/admin/vendors", async (req, res) => {
    try {
      const body = req.body;
      const { email, phone, service_area_id, latitude, longitude, password } = body;
      const name = body.name || body.storeName;

      if (!email || !name) {
        return res.status(400).json({ error: "Missing required fields (email and name/storeName)" });
      }
      let userId = null;
      if (password) {
        // Try to handle existing user
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create user with admin API to avoid email verification step in dev/admin contexts
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
          });

          if (authError) {
            // If user already exists in Auth but not in users table (unlikely but possible)
            if (authError.message.includes("already registered") || authError.status === 422) {
              // Try to find the user in Auth or users
              const { data: usersData } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
              if (usersData) {
                 userId = usersData.id;
              } else {
                 return res.status(400).json({ error: "User already exists in authentication but not in profile database. Manual sync required." });
              }
            } else {
              console.error("Auth creation error:", authError);
              return res.status(400).json({ error: authError.message || "Failed to create user" });
            }
          } else if (authData.user) {
            userId = authData.user.id;
          }
        }

        if (userId) {
          // Sync to users table
          await supabase.from("users").upsert({
            id: userId,
            email: email,
            name: name,
            role: "vendor",
          });
        }
      }

      // Check for user_id to satisfy foreign key if it was existing
      if (!userId) {
         const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
         userId = existingUser?.id;
      }

      const { data, error } = await supabase.from("vendors").insert([
        { 
          phone, 
          service_area_id, 
          latitude, 
          longitude,
          user_id: userId,
          store_name: name,
          is_active: true
        },
      ]).select();

      if (error) {
        console.error("Vendor insert error:", JSON.stringify(error, null, 2));
        return res.status(500).json({ error: error.message, details: error });
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      console.error("Vendor creation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST order (General)
  app.post("/api/orders", async (req, res) => {
    try {
      const body = req.body;
      const { items, address, pincode, userId } = body;

      // find service area
      const { data: area } = await supabase
        .from("service_areas")
        .select("id")
        .eq("pincode", pincode)
        .single();

      if (!area) {
        return res.status(400).json({ error: "No service area" });
      }

      // find vendor
      const { data: vendor } = await supabase
        .from("vendors")
        .select("user_id")
        .eq("service_area_id", area.id)
        .maybeSingle();

      if (!vendor) {
        return res.status(400).json({ error: "No vendor found" });
      }

      const { data, error } = await supabase.from("orders").insert([
        {
          items,
          address,
          pincode,
          vendor_id: vendor.user_id,
          service_area_id: area.id,
          user_id: userId || null,
          total_amount: items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0),
          status: 'placed',
          payment_method: 'cod', // Default for this generic route
          payment_status: 'pending'
        },
      ]).select();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/delivery-boys", async (req, res) => {
    try {
      const { email, password, name, phone, service_area_id } = req.body;

      if (!email || !password || !name || !phone || !service_area_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1. Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      let userId = existingUser?.id;

      if (!userId) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (authError) {
          if (authError.message.includes("already registered") || authError.status === 422) {
             // Fallback to finding existing user
             const { data: authUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
             if (authUser) {
               userId = authUser.id;
             } else {
               return res.status(400).json({ error: "User exists in Auth but has no profile. Please contact support." });
             }
          } else {
            console.error("Auth creation error:", authError);
            return res.status(400).json({ error: authError.message || "Failed to create user" });
          }
        } else if (authData.user) {
          userId = authData.user.id;
        }
      } else {
        const { data: existingBoy } = await supabase
          .from("delivery_boys")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingBoy) {
          return res.status(400).json({ error: "User is already a delivery partner" });
        }
      }

      // 2. Update users table role
      await supabase
        .from("users")
        .upsert({
          id: userId,
          email: email,
          name: name,
          role: "delivery", 
        });

      // 3. Create delivery boy record
      const { error: dboyError } = await supabase
        .from("delivery_boys")
        .insert({
          user_id: userId,
          full_name: name,
          email: email,
          phone: phone,
          service_area_id: service_area_id,
          is_active: true,
        });

      if (dboyError) {
        console.error("Delivery boy insert error:", JSON.stringify(dboyError, null, 2));
        return res.status(500).json({ 
          error: "Failed to create delivery partner details",
          details: dboyError
        });
      }

      res.status(201).json({ success: true, message: "Delivery partner created successfully" });
    } catch (error: any) {
      console.error("Delivery boy creation server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/delivery-boys", async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are missing on the server");
      }

      console.log("Fetching delivery boys...");
      const { data: boys, error: bError } = await supabase
        .from('delivery_boys')
        .select('*')
        .order('created_at', { ascending: false });

      if (bError) {
        console.error("Delivery boys base fetch error:", bError);
        return res.status(500).json({ error: bError.message });
      }

      const boysList = boys || [];
      if (boysList.length === 0) {
        return res.json([]);
      }

      const userIds = boysList.map(b => b.user_id).filter(Boolean);
      const areaIds = boysList.map(b => b.service_area_id).filter(Boolean);

      const [usersRes, areasRes] = await Promise.all([
        userIds.length > 0 ? supabase.from('users').select('id, name, email').in('id', userIds) : Promise.resolve({ data: [] }),
        areaIds.length > 0 ? supabase.from('service_areas').select('*').in('id', areaIds) : Promise.resolve({ data: [] })
      ]);

      const users = usersRes.data || [];
      const areas = areasRes.data || [];

      const flattened = boysList.map((db: any) => {
        const user = users.find(u => u.id === db.user_id);
        const area = areas.find(a => a.id === db.service_area_id);
        
        return {
          ...db,
          name: user?.name || db.full_name,
          email: (user?.email || db.email) || "",
          service_area: area,
          service_areas: area,
          user: user,
          users: user
        };
      });

      res.json(flattened);
    } catch (error: any) {
      console.error("Critical delivery boys fetch error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch delivery partners",
        details: error 
      });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      console.log("Fetching orders with manual merge...");
      const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (oError) throw oError;

      const orderList = orders || [];
      if (orderList.length === 0) return res.json([]);

      const userIds = orderList.map(o => o.user_id).filter(Boolean);
      const orderIds = orderList.map(o => o.id);

      const [usersRes, itemsRes] = await Promise.all([
        supabase.from('users').select('id, name, email').in('id', userIds),
        supabase.from('order_items').select('*').in('order_id', orderIds)
      ]);

      const users = usersRes.data || [];
      const items = itemsRes.data || [];

      // Fetch products for all items
      const productIds = items.map(i => i.product_id).filter(Boolean);
      const { data: products } = await supabase.from('products').select('*').in('id', productIds);

      const itemsWithProducts = items.map(item => ({
        ...item,
        products: (products || []).find(p => p.id === item.product_id)
      }));

      const merged = orderList.map(order => ({
        ...order,
        users: users.find(u => u.id === order.user_id),
        order_items: itemsWithProducts.filter(i => i.order_id === order.id)
      }));

      res.json(merged);
    } catch (error: any) {
      console.error("Orders fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders/update", async (req, res) => {
    try {
      const { orderId, updateData } = req.body;
      
      if (!orderId || !updateData) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      console.log(`[SERVER] Updating order ${orderId} with data:`, updateData);
      
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error("[SERVER] Error updating order:", error);
        return res.status(500).json({ error: error.message });
      }

      // If status changed to delivered, update vendor wallet, ledger, and delivery boy commission
      if (updateData.status === 'delivered') {
        // 1. Process vendor wallet & earnings
        if (data.vendor_id) {
          try {
            const finData = getFinData();
            const vId = data.vendor_id;
            
            // Check if this order has already been processed for earnings to prevent duplicate credits
            const alreadyProcessed = finData.earnings_ledger.some((e: any) => e.order_id === orderId);
            if (!alreadyProcessed) {
              const deliveryFee = Number(data.delivery_fee || 0);
              const totalAmount = Number(data.total_amount || 0);
              const subtotal = Math.max(0, totalAmount - deliveryFee);
              const commissionPercent = 10; // 10% platform commission
              const commission = Math.round(subtotal * (commissionPercent / 100) * 100) / 100;
              const vendorEarnings = Math.round((subtotal - commission) * 100) / 100;

              // Initialize wallet if not present
              if (!finData.wallets[vId]) {
                finData.wallets[vId] = {
                  available_balance: 0,
                  pending_earnings: 0,
                  total_earnings: 0,
                  last_payout: 0,
                  settlement_status: "settled",
                  bank_name: "State Bank of India",
                  account_number: "******9281",
                  ifsc_code: "SBIN0001234",
                  holder_name: ""
                };
              }

              const wallet = finData.wallets[vId];
              wallet.available_balance = Math.round((wallet.available_balance + vendorEarnings) * 100) / 100;
              wallet.total_earnings = Math.round((wallet.total_earnings + vendorEarnings) * 100) / 100;
              wallet.settlement_status = "settled";

              // Add earnings ledger entry
              finData.earnings_ledger.push({
                id: `ERN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                vendor_id: vId,
                order_id: orderId,
                order_amount: totalAmount,
                commission: commission,
                profit: vendorEarnings,
                delivery_fee: deliveryFee,
                settlement_status: "credited",
                created_at: new Date().toISOString()
              });

              saveFinData(finData);
              console.log(`[FINANCE] Credited ₹${vendorEarnings} earnings to vendor ${vId} for order ${orderId}. Commission: ₹${commission}`);
            } else {
              console.log(`[FINANCE] Order ${orderId} already processed in ledger, skipping duplicate credit.`);
            }
          } catch (fErr) {
            console.error("Error crediting vendor wallet:", fErr);
          }
        }

        // 2. Process delivery boy commission
        if (data.delivery_boy_id) {
          try {
            const commission = data.delivery_fee || 50;
            const { data: dboy } = await supabase
              .from('delivery_boys')
              .select('commission_balance')
              .eq('id', data.delivery_boy_id)
              .single();
              
            if (dboy) {
              const newBalance = (dboy.commission_balance || 0) + commission;
              await supabase
                .from('delivery_boys')
                .update({ commission_balance: newBalance })
                .eq('id', data.delivery_boy_id);
                
              console.log(`[SERVER] Added ₹${commission} commission to driver. New balance: ₹${newBalance}`);
            }
          } catch (dboyErr) {
            console.error("Error crediting delivery boy commission:", dboyErr);
          }
        }
      }

      // If status changed to cancelled, restore stock
      if (updateData.status === 'cancelled') {
        const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
        if (items) {
          for (const item of items) {
            const { data: prod } = await supabase.from('products').select('stock, stock_units').eq('id', item.product_id).single();
            if (prod) {
              const currentStock = typeof prod.stock === 'number' ? prod.stock : 0;
              const currentStockUnits = typeof prod.stock_units === 'number' ? prod.stock_units : currentStock;
              const newStock = currentStock + item.quantity;
              const newStockUnits = currentStockUnits + item.quantity;
              await supabase.from('products').update({ 
                stock: newStock,
                stock_units: newStockUnits
              }).eq('id', item.product_id);
            }
          }
        }
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[SERVER] Order update error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/delivery/orders", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      console.log(`[SERVER] Fetching orders for delivery boy user: ${userId}`);
      
      const { data: dboy, error: dboyError } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      const deliveryBoyId = dboy?.id || userId;

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          users:user_id (name, email)
        `)
        .eq('delivery_boy_id', deliveryBoyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Orders fetch error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json(orders);
    } catch (error: any) {
      console.error("Delivery orders fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/vendor/orders", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
      console.log(`[SERVER] Fetching orders for vendor user: ${userId}`);

      // First, get the vendor profile to get the actual vendor.id
      const { data: vendorProfile } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      const vendorId = vendorProfile?.id;

      // Fetch orders where vendor_id is either the user_id (new) or the vendor_id (old)
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (vendorId) {
        query = query.or(`vendor_id.eq.${userId},vendor_id.eq.${vendorId}`);
      } else {
        query = query.eq('vendor_id', userId);
      }

      const { data: orders, error: oError } = await query;

      if (oError) throw oError;

      const orderList = orders || [];
      if (orderList.length === 0) return res.json([]);

      const customerIds = orderList.map(o => o.user_id).filter(Boolean);
      const orderIds = orderList.map(o => o.id);

      const [usersRes, itemsRes] = await Promise.all([
        supabase.from('users').select('id, name, email').in('id', customerIds),
        supabase.from('order_items').select('*').in('order_id', orderIds)
      ]);

      const users = usersRes.data || [];
      const items = itemsRes.data || [];

      // Fetch products for all items
      const productIds = items.map(i => i.product_id).filter(Boolean);
      const { data: products } = await supabase.from('products').select('*').in('id', productIds);

      const itemsWithProducts = items.map(item => ({
        ...item,
        products: (products || []).find(p => p.id === item.product_id)
      }));

      const merged = orderList.map(order => ({
        ...order,
        users: users.find(u => u.id === order.user_id),
        order_items: itemsWithProducts.filter(i => i.order_id === order.id)
      }));

      res.json(merged);
    } catch (error: any) {
      console.error("Vendor orders fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/products", async (req, res) => {
    try {
      console.log("Fetching products with manual merge...");
      const { data: products, error: pError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (pError) throw pError;

      const productList = products || [];
      if (productList.length === 0) return res.json([]);

      const catIds = productList.map(p => p.category_id).filter(Boolean);
      const { data: categories } = await supabase.from('categories').select('*').in('id', catIds);

      const merged = productList.map(p => ({
        ...p,
        categories: (categories || []).find(c => c.id === p.category_id)
      }));

      res.json(merged);
    } catch (error: any) {
      console.error("Products fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders/cod", async (req, res) => {
    try {
      const { 
        userId,
        amount,
        items,
        address,
        pincode,
        discount_amount,
        coupon_code,
        delivery_fee,
        latitude,
        longitude
      } = req.body;

      if (!userId || !items || !pincode) {
        return res.status(400).json({ error: "Missing required order data" });
      }

      // Auto-resolve assignment
      const assignment = await resolveOrderAssignment(pincode, latitude, longitude);
      
      if (!assignment.service_area_id) {
        console.error(`[ERROR] COD Pincode ${pincode} not serviceable.`);
        return res.status(400).json({ 
          error: "Pincode not serviceable", 
          message: "Sorry, we do not provide service in this area (invalid pincode)." 
        });
      }

      const orderEntry = {
        user_id: userId,
        total_amount: amount,
        vendor_id: assignment.vendor_id,
        service_area_id: assignment.service_area_id,
        pincode: pincode,
        discount_amount: discount_amount || 0,
        coupon_code: coupon_code || null,
        delivery_fee: delivery_fee || 0,
        status: 'placed',
        payment_method: 'cod',
        payment_status: 'pending',
        address: address,
        latitude: latitude || null,
        longitude: longitude || null
      };

      let { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderEntry])
        .select()
        .single();

      if (orderError) {
        console.error("COD Order creation error:", orderError);
        return res.status(500).json({ error: "Failed to create order", details: orderError });
      }

      const orderItems = items.map((item: any) => ({
        order_id: newOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error("COD Items insertion error:", itemsError);
        throw itemsError;
      }

      for (const item of items) {
        const { data: prod } = await supabase.from('products').select('stock, stock_units').eq('id', item.id).single();
        if (prod) {
          const currentStock = typeof prod.stock === 'number' ? prod.stock : 0;
          const currentStockUnits = typeof prod.stock_units === 'number' ? prod.stock_units : currentStock;
          const newStock = Math.max(0, currentStock - item.quantity);
          const newStockUnits = Math.max(0, currentStockUnits - item.quantity);
          await supabase.from('products').update({ 
            stock: newStock,
            stock_units: newStockUnits
          }).eq('id', item.id);
        }
      }

      res.status(201).json({ success: true, message: "Order placed successfully (COD)", orderId: newOrder.id });
    } catch (error) {
      console.error("COD Order Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 1. GET Vendor Wallet
  app.get("/api/vendor/wallet", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    try {
      const finData = getFinData();
      const vId = userId as string;

      // Ensure wallet entry exists
      if (!finData.wallets[vId]) {
        finData.wallets[vId] = {
          available_balance: 0,
          pending_earnings: 0,
          total_earnings: 0,
          last_payout: 0,
          settlement_status: "settled",
          bank_name: "State Bank of India",
          account_number: "******9281",
          ifsc_code: "SBIN0001234",
          holder_name: ""
        };
        saveFinData(finData);
      }

      const wallet = { ...finData.wallets[vId] };

      // Dynamically calculate pending earnings based on orders assigned to this vendor that are not yet delivered/cancelled/rejected
      const { data: activeOrders, error: activeOrdersError } = await supabase
        .from('orders')
        .select('total_amount, delivery_fee')
        .eq('vendor_id', vId)
        .not('status', 'is', null)
        .not('status', 'in', '("delivered", "cancelled", "rejected")');

      let dynamicPending = 0;
      if (!activeOrdersError && activeOrders) {
        activeOrders.forEach((o: any) => {
          const total = Number(o.total_amount || 0);
          const deliveryFee = Number(o.delivery_fee || 0);
          const subtotal = Math.max(0, total - deliveryFee);
          const commission = subtotal * 0.10; // 10%
          dynamicPending += (subtotal - commission);
        });
      }

      wallet.pending_earnings = Math.round(dynamicPending * 100) / 100;

      res.json(wallet);
    } catch (error: any) {
      console.error("Error fetching vendor wallet:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 2. POST Update Bank Account details
  app.post("/api/vendor/wallet/bank", async (req, res) => {
    const { userId, bank_name, account_number, ifsc_code, holder_name } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    try {
      const finData = getFinData();
      const vId = userId;

      if (!finData.wallets[vId]) {
        finData.wallets[vId] = {
          available_balance: 0,
          pending_earnings: 0,
          total_earnings: 0,
          last_payout: 0,
          settlement_status: "settled",
          bank_name: "State Bank of India",
          account_number: "******9281",
          ifsc_code: "SBIN0001234",
          holder_name: ""
        };
      }

      const wallet = finData.wallets[vId];
      if (bank_name) wallet.bank_name = bank_name;
      if (account_number) wallet.account_number = account_number;
      if (ifsc_code) wallet.ifsc_code = ifsc_code;
      if (holder_name) wallet.holder_name = holder_name;

      saveFinData(finData);
      res.json({ success: true, message: "Bank details updated successfully", wallet });
    } catch (error) {
      console.error("Error updating bank details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 3. POST Payout Withdrawal Request
  app.post("/api/vendor/payout-request", async (req, res) => {
    const { userId, amount, bank_name, account_number } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 100) {
      return res.status(400).json({ error: "Minimum payout amount is ₹100" });
    }

    try {
      const finData = getFinData();
      const vId = userId;

      const wallet = finData.wallets[vId];
      if (!wallet || wallet.available_balance < withdrawAmount) {
        return res.status(400).json({ error: "Cannot withdraw more than your available wallet balance" });
      }

      // Prevent duplicate active payout requests (where status is 'pending' or 'approved')
      const hasActiveRequest = finData.payouts.some(
        (p: any) => p.vendor_id === vId && (p.status === "pending" || p.status === "approved")
      );
      if (hasActiveRequest) {
        return res.status(400).json({ error: "You already have an active payout request pending settlement." });
      }

      // Fetch official store name from database vendors catalog
      const { data: vendorProfile } = await supabase
        .from('vendors')
        .select('store_name')
        .eq('user_id', vId)
        .maybeSingle();

      const storeName = vendorProfile?.store_name || "Blinkit Merchant Partner";

      // Deduct immediately to hold funds and prevent duplicate spending
      wallet.available_balance = Math.round((wallet.available_balance - withdrawAmount) * 100) / 100;
      wallet.settlement_status = "pending_settlement";

      const payoutRequest = {
        id: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        vendor_id: vId,
        store_name: storeName,
        amount: withdrawAmount,
        bank_name: bank_name || wallet.bank_name || "State Bank of India",
        account_number: account_number || wallet.account_number || "******9281",
        status: "pending", // "pending", "approved", "paid", "rejected"
        requested_at: new Date().toISOString(),
        processed_at: null,
        transaction_id: null
      };

      finData.payouts.push(payoutRequest);
      saveFinData(finData);

      res.json({ success: true, message: "Payout request submitted successfully!", payout: payoutRequest, wallet });
    } catch (error) {
      console.error("Payout request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 4. GET Payout History for a Vendor
  app.get("/api/vendor/payout-history", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    try {
      const finData = getFinData();
      const list = finData.payouts.filter((p: any) => p.vendor_id === userId);
      // Sort newest requested_at first
      list.sort((a: any, b: any) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
      res.json(list);
    } catch (error) {
      console.error("Payout history fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 5. GET Earnings Ledger for a Vendor
  app.get("/api/vendor/earnings-ledger", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }
    try {
      const finData = getFinData();
      const list = finData.earnings_ledger.filter((e: any) => e.vendor_id === userId);
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.json(list);
    } catch (error) {
      console.error("Earnings ledger fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 6. GET All Payout Requests (Admin View)
  app.get("/api/admin/payouts", async (req, res) => {
    try {
      const finData = getFinData();
      // Sort newest requested first
      const sorted = [...finData.payouts].sort(
        (a: any, b: any) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      );
      res.json(sorted);
    } catch (error) {
      console.error("Admin payouts fetch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 7. POST Admin Action on Payouts (Approve / Reject / Mark As Paid)
  app.post("/api/admin/payouts/action", async (req, res) => {
    const { payoutId, action } = req.body;
    if (!payoutId || !action) {
      return res.status(400).json({ error: "Missing payoutId or action fields" });
    }

    try {
      const finData = getFinData();
      const payout = finData.payouts.find((p: any) => p.id === payoutId);
      if (!payout) {
        return res.status(404).json({ error: "Payout request not found" });
      }

      const vId = payout.vendor_id;
      const wallet = finData.wallets[vId];

      if (action === "approve") {
        payout.status = "approved";
        payout.processed_at = new Date().toISOString();
      } else if (action === "reject") {
        payout.status = "rejected";
        payout.processed_at = new Date().toISOString();
        // Return funds back to available wallet balance!
        if (wallet) {
          wallet.available_balance = Math.round((wallet.available_balance + payout.amount) * 100) / 100;
          wallet.settlement_status = "settled";
        }
      } else if (action === "pay") {
        payout.status = "paid";
        payout.processed_at = new Date().toISOString();
        payout.transaction_id = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        if (wallet) {
          wallet.last_payout = payout.amount;
          wallet.settlement_status = "settled";
        }
      } else {
        return res.status(400).json({ error: "Invalid payout action specified" });
      }

      saveFinData(finData);
      res.json({ success: true, message: `Payout request processed successfully with status ${payout.status}`, payout, wallet });
    } catch (error) {
      console.error("Admin payout action error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 8. Geocode Search Proxy (avoid client CORS and rate-limits)
  app.get("/api/geocode/search", async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          format: "json",
          q: q as string,
          limit: 1
        },
        headers: {
          "User-Agent": "BlinkitMerchantPartnerApp/1.0 (bictcomputereducation1@gmail.com)"
        }
      });
      res.json(response.data);
    } catch (err: any) {
      console.error("Geocode search error:", err.message);
      res.status(500).json({ error: "Geocoding lookup failed" });
    }
  });

  // 9. Geocode Reverse Proxy (avoid client CORS and rate-limits)
  app.get("/api/geocode/reverse", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Parameters 'lat' and 'lng' are required" });
    }
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: {
          format: "json",
          lat: lat as string,
          lon: lng as string,
          zoom: 18,
          addressdetails: 1
        },
        headers: {
          "User-Agent": "BlinkitMerchantPartnerApp/1.0 (bictcomputereducation1@gmail.com)"
        }
      });
      res.json(response.data);
    } catch (err: any) {
      console.error("Geocode reverse error:", err.message);
      res.status(500).json({ error: "Reverse geocoding lookup failed" });
    }
  });

  // Catch-all for undefined API routes
  app.use("/api/*", (req, res) => {
    console.log(`[SERVER-404] No match for ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log(`[SERVER] Attempting to listen on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Server running on http://localhost:${PORT}`);
  });
}

startServer();
