import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { ShoppingBag, ArrowRight, Minus, Plus, Trash2, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 space-y-6 text-center">
        <div className="bg-slate-50 p-10 rounded-full border border-slate-100">
          <ShoppingBag className="h-16 w-16 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Cart is Empty!</h2>
          <p className="text-slate-400 font-medium max-w-xs mx-auto">Your cart is feeling a bit lonely. Let's add some fresh groceries!</p>
        </div>
        <Link to="/">
          <button className="bg-primary text-black font-black italic px-10 py-3 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-tighter">
            Start Shopping
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-40">
      <div className="bg-white px-4 py-6 border-b border-slate-100 mb-4">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Review Cart</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{totalItems} items in your list</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {/* Delivery Info Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 flex items-center gap-4 shadow-sm">
           <div className="bg-emerald-50 p-3 rounded-2xl">
             <Clock className="h-6 w-6 text-emerald-600" />
           </div>
           <div>
             <h3 className="text-sm font-black italic uppercase tracking-tight">Delivery in 10-15 mins</h3>
             <div className="flex items-center gap-1 text-slate-400 text-[11px] font-bold uppercase mt-0.5">
               <MapPin className="h-3 w-3" /> H-12, Sector 63, Noida
             </div>
           </div>
        </div>

        {/* Cart Items List */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Items List</h2>
          </div>
          <div className="divide-y divide-slate-50">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 flex gap-4 bg-white"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-50 p-2 flex-shrink-0">
                    <img 
                      src={item.image_url || `https://picsum.photos/seed/${item.name}/200/200`} 
                      alt={item.name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-grow space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">500 g</p>
                    
                    <div className="flex justify-between items-end mt-2">
                       <span className="font-black text-slate-900">₹{item.price * item.quantity}</span>
                       <div className="flex items-center gap-4 bg-slate-50 rounded-xl px-2 py-1 border border-slate-100">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-slate-400 active:text-slate-900 p-1"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-slate-400 active:text-slate-900 p-1"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Bill Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">Item Total</span>
              <span className="text-slate-900">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">Delivery Charge</span>
              <span className="text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">Handling Charges</span>
              <span className="text-slate-900">₹2</span>
            </div>
            <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
               <span className="text-base font-black uppercase tracking-tight italic">To Pay</span>
               <span className="text-xl font-black italic">₹{totalPrice + 2}</span>
            </div>
          </div>
        </div>

        {/* Safety Note */}
        <div className="flex items-center gap-3 px-2 py-4">
           <div className="bg-emerald-100 p-2 rounded-full">
             <ShoppingBag className="h-4 w-4 text-emerald-700" />
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
             Safe and hygienic delivery. Our delivery partners follow all safety protocols.
           </p>
        </div>
      </div>

      {/* Sticky Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-50 md:static">
        <button 
          onClick={() => navigate('/checkout')}
          className="w-full bg-primary text-black h-16 rounded-3xl shadow-2xl flex items-center justify-between px-8 active:scale-95 transition-all group"
        >
          <div className="flex flex-col items-start leading-none">
            <span className="text-lg font-black italic tracking-tighter">₹{totalPrice + 2}</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Proceed to Pay</span>
          </div>
          <div className="flex items-center gap-2 font-black italic text-lg tracking-tighter">
            CHECKOUT <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}

