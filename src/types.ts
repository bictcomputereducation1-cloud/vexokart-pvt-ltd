export type Role = 'user' | 'admin';

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
  category_id: string | null;
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
  status: 'pending' | 'confirmed' | 'packed' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'online' | null;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_id: string | null;
  razorpay_order_id: string | null;
  created_at: string;
  users?: Profile;
  order_items?: OrderItem[];
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
