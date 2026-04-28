-- Supabase Schema for Vexokart

-- 1. Users table (linked to Auth)
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'vendor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.5 Vendors table
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  store_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_area_id UUID REFERENCES serviceable_areas(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1.6 Delivery Boys table
CREATE TABLE delivery_boys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  vehicle_type TEXT CHECK (vehicle_type IN ('BIKE', 'SCOOTER', 'CYCLE')),
  service_area_id UUID REFERENCES serviceable_areas(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for delivery_boys
ALTER TABLE delivery_boys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage delivery boys" ON delivery_boys FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Delivery boys can view own profile" ON delivery_boys FOR SELECT USING (
  auth.uid() = user_id
);

-- RLS for Vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active vendors" ON vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage vendors" ON vendors FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Vendors can view own details" ON vendors FOR SELECT USING (auth.uid() = user_id);

-- 2. Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.5 Subcategories table
CREATE TABLE subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.6 Banners table
CREATE TABLE banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  cod_available BOOLEAN DEFAULT true,
  online_payment BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  coupon_code TEXT,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_area_id UUID REFERENCES serviceable_areas(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'placed' CHECK (status IN ('placed', 'accepted', 'packed', 'ready_for_delivery', 'picked', 'out_for_delivery', 'delivered', 'cancelled', 'rejected')),
  payment_method TEXT CHECK (payment_method IN ('cod', 'online')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_id TEXT,
  razorpay_order_id TEXT,
  address TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Addresses table
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  full_address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for user_addresses
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own addresses" ON user_addresses FOR ALL USING (auth.uid() = user_id);

-- Serviceable Areas for delivery
CREATE TABLE serviceable_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pincode TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_km DECIMAL(5, 2) DEFAULT 10.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for serviceable_areas
ALTER TABLE serviceable_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view serviceable areas" ON serviceable_areas FOR SELECT USING (true);
CREATE POLICY "Admins can manage serviceable areas" ON serviceable_areas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Order Items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- 6. Cart table
CREATE TABLE cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- 8. Coupons table
CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security)

-- Users: Users can read their own profile, Admins can read all
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Categories: Everyone can read, Admins can manage
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Products: Everyone can read, Admins can manage
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Orders: Users can view/create own orders, Admins can manage all, Vendors can manage assigned orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Vendors can manage assigned orders" ON orders FOR ALL USING (
  vendor_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'vendor')
);

-- Order Items: Users can view own items, Admins can manage all
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Cart: Users can manage their own cart
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cart" ON cart FOR ALL USING (auth.uid() = user_id);

-- Coupons: Everyone can view active coupons, Admins can manage
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage coupons" ON coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Storage setup for invoices
-- Note: These typically go into the storage schema, but we can't easily do that here without standard Supabase storage setup.
-- We can however define the policies if the bucket exists.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view invoices"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');
