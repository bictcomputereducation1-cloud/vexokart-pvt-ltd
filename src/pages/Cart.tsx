import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { 
  Minus, 
  Plus, 
  Trash2, 
  Heart, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight,
  Clock,
  ShoppingCart,
  MapPin,
  ShieldCheck,
  PackageCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDeliveryLocation } from '../LocationContext';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function Cart() {
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    totalPrice, 
    totalItems, 
    totalMRP,
    totalDiscount,
    deliveryFee,
    finalTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponDiscountValue,
    freeDeliveryThreshold,
    clearCart, 
    addToCart 
  } = useCart();
  const { address, setIsModalOpen } = useDeliveryLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .limit(6);
      if (data) setRecommendations(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      toast.success('Cart cleared');
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    applyCoupon(couponCode);
    setCouponCode('');
  };

  const deliveryCharges = deliveryFee;
  const finalAmount = finalTotal;


  // DEBUG LOGGING
  useEffect(() => {
    console.log('Cart Calculation:', {
      totalMRP,
      totalSelling: totalPrice,
      totalDiscount,
      deliveryCharges,
      finalAmount,
      itemCount: totalItems
    });
  }, [totalMRP, totalPrice, totalDiscount, deliveryCharges, finalAmount, totalItems]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 text-center bg-white">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-50 p-12 rounded-full border border-slate-100"
        >
          <ShoppingCart className="h-20 w-20 text-slate-300" />
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">Your Cart is Empty</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-xs mx-auto">Freshness is just one click away! Start adding items now.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-green-600 text-white font-black italic px-12 py-4 rounded-3xl shadow-2xl shadow-green-100 active:scale-95 transition-all uppercase tracking-tighter text-sm"
        >
          Explore Products
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FBFFF9] min-h-screen pb-56">
      {/* 🔹 PREMIUM HEADER */}
      <div className="sticky top-0 z-[60] bg-white border-b border-slate-50 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tighter text-slate-900">
              VEXO<span className="text-green-600">KART</span>
            </span>
          </div>
          <span className="text-[9px] font-bold text-green-600 italic tracking-[0.2em] leading-none">
            - Cool Point -
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
            <Heart className="h-5.5 w-5.5" />
          </button>
          <div className="p-2 text-slate-900 relative active:scale-90 transition-transform">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute top-0 right-0 bg-green-500 text-white text-[8px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white">
              {totalItems}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 🔹 DELIVERY SECTION */}
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex items-center justify-between group cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                <MapPin className="h-5 w-5" />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-green-700/60 uppercase tracking-widest">Deliver to:</span>
                <span className="text-xs font-black text-slate-900 line-clamp-1">{address || 'Near HSS Sopore'}</span>
             </div>
          </div>
          <button className="text-[10px] font-black text-green-600 uppercase tracking-widest border border-green-200 px-3 py-1.5 rounded-lg bg-white shadow-sm active:scale-95">Change</button>
        </div>

        {/* 🔹 TITLE & ITEMS COUNT */}
        <div className="flex items-center justify-between">
           <div className="space-y-0.5">
             <h1 className="text-xl font-black text-slate-900 tracking-tight">
               My Cart <span className="text-slate-400 font-bold">({totalItems} Items)</span>
             </h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review your items and place the order</p>
           </div>
           <button 
             onClick={handleClearCart}
             className="h-10 w-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors"
           >
             <Trash2 className="h-5 w-5" />
           </button>
        </div>

        {/* 🔹 CART ITEMS LIST */}
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item) => {
              const oldPrice = item.original_price || Math.round(item.price * 1.25);
              const savings = oldPrice - item.price;
              const discountPercent = Math.round((savings / oldPrice) * 100);
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex gap-4 relative overflow-hidden"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 flex items-center justify-center shrink-0">
                    <img src={item.image_url} alt={item.name} className="max-h-full object-contain filter drop-shadow-sm" />
                  </div>

                  <div className="flex-grow min-w-0 pr-8">
                    <h3 className="font-black text-slate-900 leading-tight text-sm mb-1">{item.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2">Standard Unit</p>
                    
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-base font-black text-green-600">₹{item.price * item.quantity}</span>
                       {item.original_price && item.original_price > item.price && (
                         <span className="text-xs text-slate-300 line-through font-bold">₹{item.original_price * item.quantity}</span>
                       )}
                    </div>
                    
                    {item.original_price && item.original_price > item.price && (
                      <div className="inline-flex bg-green-50 text-green-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                         You save ₹{(item.original_price - item.price) * item.quantity} ({Math.round(((item.original_price - item.price) / item.original_price) * 100)}% OFF)
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-sm active:scale-90"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg active:scale-90"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 🔹 DELIVERY PROGRESS BAR */}
        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                deliveryFee === 0 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
              )}>
                <Zap className={cn("h-5 w-5", deliveryFee === 0 && "fill-current")} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Delivery Goal
                </p>
                <p className="text-xs font-black text-slate-900 tracking-tight">
                  {deliveryFee === 0 
                    ? "Yay! You have FREE delivery" 
                    : `Add ₹${Math.max(0, freeDeliveryThreshold - totalPrice)} more for FREE delivery`}
                </p>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-900 uppercase">
              ₹{totalPrice} / ₹{freeDeliveryThreshold}
            </p>
          </div>
          
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalPrice / freeDeliveryThreshold) * 100, 100)}%` }}
              className="h-full bg-green-600 rounded-full"
            />
          </div>
        </div>

        {/* 🔹 APPLIED COUPON / COUPON INPUT */}
        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm">
          {!appliedCoupon ? (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input 
                type="text"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-green-500 uppercase tracking-widest placeholder:text-slate-300"
              />
              <button 
                type="submit"
                className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl active:scale-95 transition-all shadow-lg shadow-slate-200"
              >
                Apply
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Coupon Applied</span>
                  <span className="text-xs font-black text-slate-900 uppercase">"{appliedCoupon.code}"</span>
                </div>
              </div>
              <button 
                onClick={removeCoupon}
                className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 px-2 py-1 rounded-lg"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* 🔹 PRICE DETAILS */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
           <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Price Details</h2>
           
           <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Total MRP</span>
                 <span className="text-slate-900 font-black">₹{totalMRP}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Discount</span>
                 <span className="text-green-600 font-black">-₹{totalDiscount}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <span>Coupon Discount ({appliedCoupon.code})</span>
                   <span className="text-green-600 font-black">-₹{couponDiscountValue}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Delivery Charges</span>
                 <span className={cn("font-black italic", deliveryCharges === 0 ? "text-green-600" : "text-slate-900")}>
                    {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}
                 </span>
              </div>
              
              <div className="pt-6 mt-2 border-t border-dashed border-slate-100 flex justify-between items-center">
                 <span className="text-base font-black text-slate-900 uppercase tracking-widest">To Pay</span>
                 <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{finalAmount}</span>
              </div>
           </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex flex-col items-center text-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-[10px] font-black text-green-800 leading-tight">You will save ₹{totalDiscount} on this order</p>
           </div>
           <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col items-center text-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <p className="text-[10px] font-black text-blue-800 leading-tight">Safe & Secure Payments</p>
           </div>
        </div>

        {/* 🔹 BOTTOM INFO STRIP */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-10 py-8 mb-20">
           {[
             { icon: Clock, text: "Fast Delivery", sub: "30-45 Mins" },
             { icon: PackageCheck, text: "Quality Check", sub: "100% Reliable" }
           ].map((item, i) => (
             <div key={i} className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                 <item.icon className="h-5 w-5" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-slate-900 leading-none">{item.text}</p>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{item.sub}</p>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* 🔹 STICKY FOOTER CHECKOUT */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-[100] rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto relative">
          {/* Floating Cart Indicator */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg border border-slate-800 pointer-events-none">
            <ShoppingCart className="h-3.5 w-3.5 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest">{totalItems} Items in cart</span>
          </div>

          <button 
            onClick={handleCheckout}
            className="w-full h-16 bg-gradient-to-r from-emerald-600 via-green-600 to-green-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.05em] text-xs flex items-center justify-between px-6 shadow-xl shadow-green-900/20 active:scale-[0.98] transition-all overflow-hidden relative group"
          >
            {/* Animated Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
            
            <div className="flex flex-col items-start leading-none relative z-10">
               <span className="text-[10px] font-bold text-green-100/80 uppercase tracking-widest mb-1.5">Total Amount</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-xl tracking-tight">₹{finalAmount}</span>
                 {totalMRP > totalPrice && (
                   <span className="text-[10px] font-bold text-green-200/50 line-through">₹{totalMRP}</span>
                 )}
               </div>
            </div>

            <div className="flex items-center gap-2 bg-white/20 h-10 px-4 rounded-xl backdrop-blur-sm relative z-10">
               <span className="text-[10px] font-black tracking-widest">PROCEED TO CHECKOUT</span>
               <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
