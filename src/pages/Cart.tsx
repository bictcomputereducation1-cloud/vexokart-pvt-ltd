import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { 
  ShoppingBag, 
  ArrowRight, 
  Minus, 
  Plus, 
  Trash2, 
  Heart, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDeliveryLocation } from '../LocationContext';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { toast } from 'sonner';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart, addToCart } = useCart();
  const { pincode, setIsModalOpen } = useDeliveryLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Product[]>([]);

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
    if (!pincode) {
      setIsModalOpen(true);
      return;
    }
    navigate('/checkout');
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to remove all items?')) {
      await clearCart();
      toast.success('Cart cleared');
    }
  };

  const savedAmount = Math.round(totalPrice * 0.15); // Mocked savings for UI

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 text-center bg-white">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-50 p-12 rounded-full border border-slate-100"
        >
          <ShoppingBag className="h-20 w-20 text-slate-300" />
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">Your Cart is Empty</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-xs mx-auto">Freshness is just one click away! Start adding items now.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-emerald-600 text-white font-black italic px-12 py-4 rounded-3xl shadow-2xl shadow-emerald-100 active:scale-95 transition-all uppercase tracking-tighter text-sm"
        >
          Explore Products
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-48">
      {/* 🔹 PREMIUM HEADER */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <span className="text-lg font-black italic tracking-tighter text-emerald-600 absolute left-1/2 -translate-x-1/2">
          VEXO<span className="text-slate-900">KART</span>
        </span>

        <div className="flex items-center gap-1">
          <button className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
            <Heart className="h-5 w-5" />
          </button>
          <div className="p-2 text-emerald-600 relative bg-emerald-50 rounded-full transition-colors">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
              {totalItems}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 🔹 TITLE & REMOVE ALL */}
        <div className="flex items-center justify-between">
           <h1 className="text-xl font-black italic tracking-tighter text-slate-900">
             My Cart <span className="text-slate-400">({totalItems} Items)</span>
           </h1>
           <button 
             onClick={handleClearCart}
             className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
           >
             Remove All
           </button>
        </div>

        {/* 🔹 SAVINGS BANNER */}
        <div className="bg-emerald-600 rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-emerald-100 border border-emerald-500 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
             <ShoppingBag className="h-24 w-24 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Awesome choice!</p>
            <h3 className="text-white text-lg font-black italic tracking-tighter leading-none">
              Saving ₹{savedAmount} on this order
            </h3>
          </div>
          <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center border border-white/20">
             <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* 🔹 PRODUCT LIST */}
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex gap-4 relative"
              >
                {/* Left: Aspect and Image */}
                <div className="flex items-center gap-3">
                   <div className="h-5 w-5 rounded border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center shrink-0">
                      <div className="h-2.5 w-2.5 bg-emerald-500 rounded-sm" />
                   </div>
                   <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 border border-slate-100 shrink-0">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                   </div>
                </div>

                {/* Center Content */}
                <div className="flex-grow min-w-0 pr-8">
                  <h3 className="font-bold text-slate-900 line-clamp-1 leading-tight text-sm">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">1kg</span>
                     <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">15% OFF</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                     <span className="text-base font-black italic tracking-tighter text-slate-900">₹{item.price * item.quantity}</span>
                     <span className="text-xs text-slate-300 line-through font-bold">₹{Math.round(item.price * 1.2 * item.quantity)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-3 text-emerald-600 opacity-60">
                     <Clock className="h-3 w-3" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Delivery by Tomorrow</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-6 h-full pb-4">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="mt-auto flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-full px-2 py-1 shadow-inner">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-slate-700 hover:bg-white rounded-full transition-all"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-slate-700 hover:bg-white rounded-full transition-all"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 🔹 RECOMMENDATIONS */}
        <div className="space-y-4 pt-4">
           <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">You may also like</h2>
              <button 
                onClick={() => navigate('/category/all')}
                className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1"
              >
                View All <ChevronRight className="h-3 w-3" />
              </button>
           </div>
           
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
             {recommendations.map(prod => (
               <div 
                 key={prod.id} 
                 onClick={() => navigate(`/product/${prod.id}`)}
                 className="min-w-[140px] bg-white p-3 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2 shrink-0 group active:scale-95 transition-all"
               >
                 <div className="aspect-square bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-50">
                    <img src={prod.image_url} alt={prod.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                 </div>
                 <div className="px-0.5">
                    <h4 className="text-[11px] font-bold text-slate-900 line-clamp-1 truncate">{prod.name}</h4>
                    <div className="flex items-center justify-between mt-1">
                       <span className="text-[12px] font-black italic tracking-tighter">₹{prod.price}</span>
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(prod);
                        }}
                        className="p-1.5 rounded-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50"
                       >
                          <Plus className="h-3.5 w-3.5" />
                       </button>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* 🔹 PRICE DETAILS */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-6">
           <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Price Details</h2>
           
           <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Item Total</span>
                 <span className="text-slate-900 font-black italic">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Delivery Fee</span>
                 <span className="text-emerald-600 font-black italic">FREE</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase tracking-widest">
                 <span>You Saved</span>
                 <span className="font-black italic">₹{savedAmount}</span>
              </div>
              
              <div className="pt-5 border-t border-dashed border-slate-100 flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">To Pay</p>
                   <p className="text-2xl font-black italic tracking-tighter text-slate-900">₹{totalPrice}</p>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                   <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest text-center">
                     Saved <span className="text-slate-900">₹{savedAmount}</span>
                   </p>
                </div>
              </div>
           </div>
        </div>

        {/* Security / Quality Badges */}
        <div className="flex items-center justify-between px-2 pt-4">
           <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                 <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide">Top Rated</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                 <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide">Quality Assured</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                 <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide">Fast Delivery</span>
           </div>
        </div>
      </div>

      {/* 🔹 STICKY PROCEED BUTTON */}
      <div className="fixed bottom-[110px] left-4 right-4 z-[60]">
        <div className="max-w-2xl mx-auto bg-white border border-slate-100 px-4 py-4 rounded-[2.5rem] shadow-[0_-15px_50px_rgba(0,0,0,0.12)] flex items-center justify-between gap-4">
           <div className="flex flex-col ml-2">
              <span className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">₹{totalPrice}</span>
              <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mt-1">View Full Bill</span>
           </div>

           <button 
            onClick={handleCheckout}
            className="flex-grow bg-emerald-600 text-white h-14 rounded-[2rem] shadow-2xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition-all group"
          >
            <span className="text-[12px] font-black uppercase tracking-widest italic leading-none">Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
