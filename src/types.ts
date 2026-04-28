export type Role = 'user' | 'admin' | 'vendor';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number;
  category_id: string | null;
  subcategory_id?: string | null;
  image_url: string | null;
  stock: number;
  cod_available: boolean;
  online_payment: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  vendor_id: string | null;
  service_area_id: string | null;
  delivery_boy_id?: string | null;
  status: string;
  payment_method: 'cod' | 'online' | null;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_id: string | null;
  razorpay_order_id: string | null;
  address: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  invoice_url: string | null;
  created_at: string;
  users?: Profile;
  order_items?: OrderItem[];
  vendors?: Vendor;
}

export interface Vendor {
  id: string;
  user_id?: string;
  store_name: string;
  email: string;
  phone: string;
  service_area_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  full_address: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
}

export interface ServiceableArea {
  id: string;
  pincode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number | null;
  is_active: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  products?: Product;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_amount: number;
  is_active: boolean;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  image_url: string | null;
  slug: string;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}
