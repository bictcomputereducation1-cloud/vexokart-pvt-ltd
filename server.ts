import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const supabase = createClient(supabaseUrl, supabaseKey);

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
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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

      return res.json({ success: true, message: "Order confirmed successfully", orderId: newOrder.id });
    } catch (error) {
      console.error("Verification Error:", error);
      res.status(500).json({ error: "Order placement failed after payment" });
    }
  });

  // GET vendors
  app.get("/api/admin/vendors", async (req, res) => {
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are missing on the server");
      }

      console.log("Fetching vendors with service areas and users...");
      const { data, error } = await supabase
        .from("vendors")
        .select(`
          *,
          service_areas:service_area_id (*),
          users:user_id (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase vendors query error message:", error.message);
        console.error("Supabase vendors query error full:", JSON.stringify(error, null, 2));
        
        // Fallback for relationship issues
        const isRelationshipError = error.message?.toLowerCase().includes("relationship") || 
                                   error.message?.toLowerCase().includes("reference") ||
                                   error.code?.startsWith("PGRST");
                                   
        if (isRelationshipError) {
          console.log("Relationship issue with vendors, falling back to simple select...");
          const { data: simpleData, error: simpleError } = await supabase
            .from("vendors")
            .select("*")
            .order('created_at', { ascending: false });
            
          if (simpleError) {
            console.error("Simple vendors select also failed:", simpleError.message);
            throw simpleError;
          }
          return res.json(simpleData || []);
        }
        return res.status(500).json({ error: error.message, details: error });
      }

      // Flatten data for the frontend
      const flattenedData = data?.map(v => ({
        ...v,
        name: v.users?.name || v.store_name,
        email: v.users?.email || "",
        // Preserve the joined objects for components that use them
        service_areas: v.service_areas,
        users: v.users
      }));

      res.json(flattenedData || []);
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
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError || !authData.user) {
          console.error("Auth creation error:", authError);
          return res.status(400).json({ error: authError?.message || "Failed to create user" });
        }
        userId = authData.user.id;

        // Sync to users table
        await supabase.from("users").upsert({
          id: userId,
          email: email,
          name: name,
          role: "vendor",
        });
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
        .select("id")
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
          vendor_id: vendor.id,
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
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError || !authData.user) {
          console.error("Auth creation error:", authError);
          return res.status(400).json({ error: authError?.message || "Failed to create user" });
        }
        userId = authData.user.id;
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
      console.log("Fetching delivery boys with service areas and users...");
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables are missing on the server");
      }

      const { data, error } = await supabase
        .from('delivery_boys')
        .select(`
          *,
          service_areas:service_area_id (*),
          users:user_id (name, email)
        `);

      if (error) {
        console.error("Supabase delivery boys query error message:", error.message);
        console.error("Supabase delivery boys query error full:", JSON.stringify(error, null, 2));
        
        // Try fallback without join if it's a relationship error or similar
        const isRelationshipError = error.message?.toLowerCase().includes("relationship") || 
                                   error.message?.toLowerCase().includes("column") ||
                                   error.message?.toLowerCase().includes("reference") ||
                                   (error.code && typeof error.code === "string" && error.code.startsWith("PGRST"));
                                   
        if (isRelationshipError) {
          console.log("Possible relationship issue with delivery boys, falling back to simple select...");
          const { data: simpleData, error: simpleError } = await supabase
            .from('delivery_boys')
            .select('*');
          
          if (simpleError) {
            console.error("Simple delivery boys select also failed:", simpleError.message);
            throw simpleError;
          }
          return res.json(simpleData || []);
        }
        throw error;
      }
      
      const flattenedData = data?.map(db => ({
        ...db,
        name: db.users?.name || db.full_name,
        email: (db.users?.email || db.email) || "",
        // Preserve joined objects
        service_areas: db.service_areas,
        users: db.users
      }));

      res.json(flattenedData || []);
    } catch (error: any) {
      console.error("Critical delivery boys fetch error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to fetch delivery partners",
        details: error 
      });
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

      res.status(201).json({ success: true, message: "Order placed successfully (COD)", orderId: newOrder.id });
    } catch (error) {
      console.error("COD Order Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
