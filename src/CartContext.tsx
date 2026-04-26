import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product, Coupon } from './types';
import { supabase } from './lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  totalMRP: number;
  totalDiscount: number;
  deliveryFee: number;
  finalTotal: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  couponDiscountValue: number;
  freeDeliveryThreshold: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [settings, setSettings] = useState({ delivery_charge: 0, free_delivery_min: 0 });
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const config: any = {};
        data.forEach(item => {
          config[item.key] = Number(item.value);
        });
        setSettings({
          delivery_charge: config.delivery_charge || 0,
          free_delivery_min: config.free_delivery_min || 0
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          quantity,
          products (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const cartItems: CartItem[] = data.map((item: any) => ({
        ...item.products,
        quantity: item.quantity
      }));

      setItems(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
    fetchSettings();
  }, [fetchCart, fetchSettings]);

  const addToCart = async (product: Product) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      const existingItem = items.find(item => item.id === product.id);

      if (existingItem) {
        const { error } = await supabase
          .from('cart')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1
          });

        if (error) throw error;
      }

      await fetchCart();
      toast.success('Added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Invalid or inactive coupon code');
        return;
      }

      const coupon = data as Coupon;
      if (totalPrice < coupon.min_order_amount) {
        toast.error(`Minimum order amount for this coupon is ₹${coupon.min_order_amount}`);
        return;
      }

      setAppliedCoupon(coupon);
      toast.success('Coupon applied successfully');
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.success('Coupon removed');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalMRP = items.reduce((sum, item) => sum + (item.original_price || item.price) * item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = totalMRP - totalPrice;

  const deliveryFee = totalItems > 0 
    ? (totalPrice >= settings.free_delivery_min ? 0 : settings.delivery_charge) 
    : 0;
  
  let couponDiscountValue = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      couponDiscountValue = (totalPrice * appliedCoupon.discount_value) / 100;
    } else {
      couponDiscountValue = appliedCoupon.discount_value;
    }
  }

  const finalTotal = totalPrice - couponDiscountValue + deliveryFee;
  const freeDeliveryThreshold = settings.free_delivery_min;

  // Auto-remove coupon if conditions are no longer met
  useEffect(() => {
    if (appliedCoupon && totalPrice < appliedCoupon.min_order_amount) {
      setAppliedCoupon(null);
      toast.info('Coupon removed as order amount decreased');
    }
  }, [totalPrice, appliedCoupon]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        totalMRP,
        totalDiscount,
        deliveryFee,
        finalTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        couponDiscountValue,
        freeDeliveryThreshold,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
