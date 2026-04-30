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
      .from('serviceable_areas')
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

      const order = await response.json();

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
      const finalVendorId = vendor_id || assignment.vendor_id;
      const finalAreaId = service_area_id || assignment.service_area_id;

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

  app.post("/api/admin/vendors", async (req, res) => {
    try {
      const { email, password, storeName, phone, service_area_id, latitude, longitude, address } = req.body;

      if (!email || !password || !storeName || !phone) {
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
        // Create auth user using standard signUp
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
        // Check if already a vendor
        const { data: existingVendor } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingVendor) {
          return res.status(400).json({ error: "User is already a vendor" });
        }
      }

      // Resolve Service Area if not provided but lat/lng is available
      let targetAreaId = service_area_id;
      if (!targetAreaId && latitude && longitude) {
        const { data: areas } = await supabase.from('serviceable_areas').select('*').eq('is_active', true);
        if (areas) {
          // Simplistic nearest match
          const nearest = areas.reduce((prev, curr) => {
            const distPrev = Math.sqrt(Math.pow(prev.latitude - latitude, 2) + Math.pow(prev.longitude - longitude, 2));
            const distCurr = Math.sqrt(Math.pow(curr.latitude - latitude, 2) + Math.pow(curr.longitude - longitude, 2));
            return distPrev < distCurr ? prev : curr;
          });
          targetAreaId = nearest.id;
        }
      }

      // 2. Insert/Update users table as vendor (handling potential trigger race conditions)
      const { error: userError } = await supabase
        .from("users")
        .upsert({
          id: userId,
          email: email,
          name: storeName,
          role: "vendor",
        });

      if (userError) {
        console.error("User table error:", JSON.stringify(userError, null, 2));
        return res.status(500).json({ 
          error: "Failed to create user record",
          details: userError
        });
      }

      // 3. Create vendor record
      const { error: vendorError } = await supabase
        .from("vendors")
        .insert({
          user_id: userId,
          store_name: storeName,
          phone: phone,
          service_area_id: targetAreaId,
          latitude: latitude,
          longitude: longitude,
          address: address,
          is_active: true,
        });

      if (vendorError) {
        console.error("Vendor insert error:", JSON.stringify(vendorError, null, 2));
        return res.status(500).json({ 
          error: "Failed to create vendor details",
          details: vendorError
        });
      }

      res.status(201).json({ success: true, message: "Vendor created successfully" });
    } catch (error: any) {
      console.error("Vendor creation server error:", error);
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
        return res.status(400).json({ error: "Pincode not serviceable" });
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
