import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to clean environment variables (removes quotes and whitespace)
  const cleanEnvVar = (value: string | undefined) => {
    if (!value) return "";
    return value.trim().replace(/^["']|["']$/g, "").trim();
  };

  const razorpayKeyId = cleanEnvVar(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY);
  const razorpayKeySecret = cleanEnvVar(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET);

  // Helper function to safely get Razorpay instance
  let razorpayInstance: Razorpay | null = null;
  const getRazorpay = () => {
    if (!razorpayKeyId || !razorpayKeySecret) {
      return null;
    }
    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });
    }
    return razorpayInstance;
  };

  // Log status for debugging (SAFE: only shows masked values)
  console.log("--- Razorpay Config Check ---");
  console.log("Key ID present:", razorpayKeyId ? `✅ (${razorpayKeyId.substring(0, 6)}...)` : "❌ MISSING");
  console.log("Key Secret present:", razorpayKeySecret ? `✅ (${razorpayKeySecret.substring(0, 2)}...***)` : "❌ MISSING");
  if (razorpayKeyId && !razorpayKeyId.startsWith('rzp_')) {
    console.warn("⚠️ Warning: Razorpay Key ID looks unusual (usually starts with rzp_)");
  }
  console.log("----------------------------");

  // API Routes
  app.post("/api/payment/order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      const rzp = getRazorpay();
      if (!rzp) {
        return res.status(500).json({ 
          error: "Razorpay keys not configured on server",
          details: "Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in environment variables." 
        });
      }

      const options = {
        amount: Math.round(Number(amount) * 100),
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      };

      console.log("Creating Razorpay order...");
      const order = await rzp.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("Razorpay Order Error:", error);
      
      // Handle authentication specifically
      if (error.statusCode === 401 || (error.error && error.error.description === "Authentication failed")) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "The Razorpay Key ID or Secret is incorrect.",
          code: "AUTH_FAILED"
        });
      }

      const statusCode = error.statusCode || 500;
      const errorMsg = error.error?.description || "Failed to create Razorpay order";
      res.status(statusCode).json({ 
        error: errorMsg,
        code: error.error?.code,
        details: error.error
      });
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
        delivery_fee
      } = req.body;

      // 1. Verify signature
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }

      console.log("Payment verified, now creating order for user:", userId);

      // 2. Create order in Supabase
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: userId,
          total_amount: amount,
          discount_amount: discount_amount || 0,
          coupon_code: coupon_code || null,
          delivery_fee: delivery_fee || 0,
          status: 'confirmed',
          payment_method: 'online',
          payment_status: 'paid',
          payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          address: address,
          pincode: pincode
        }])
        .select()
        .single();

      if (orderError) {
        console.error("Order creation error:", orderError);
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
