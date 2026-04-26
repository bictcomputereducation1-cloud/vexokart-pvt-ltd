import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Bell, 
  ShoppingCart, 
  ChevronDown, 
  Search as SearchIcon, 
  Mic,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Plus,
  Star,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useDeliveryLocation } from '../LocationContext';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../types';

const featureStrip = [
  { icon: ShieldCheck, label: "Secure Payments", sub: "100% Safe", color: "text-green-600", bg: "bg-green-50" },
  { icon: Clock, label: "Fast Delivery", sub: "30-45 mins", color: "text-green-600", bg: "bg-green-50" },
  { icon: Star, label: "Best Quality", sub: "Fresh & Pure", color: "text-green-600", bg: "bg-green-50" },
  { icon: CreditCard, label: "Best Prices", sub: "Great Offers", color: "text-green-600", bg: "bg-green-50" }
];

const bannerData = [
  {
    title: "Cool Drinks Beat the Heat!",
    sub: "Stay Cool, Stay Fresh",
    gradient: "from-[#4CAF50] to-[#8BC34A]",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Fresh Grocery Selection",
    sub: "Delivered in Minutes",
    gradient: "from-blue-600 to-indigo-400",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
  }
];

const categoryBackgrounds = [
  "bg-cyan-50",
  "bg-pink-50",
  "bg-amber-50",
  "bg-orange-50",
  "bg-indigo-50",
  "bg-slate-50",
  "bg-emerald-50",
  "bg-purple-50",
  "bg-rose-50",
  "bg-blue-50"
];

export default function Home() {
  const navigate = useNavigate();
  const { address, setIsModalOpen, pincode, isServiceable } = useDeliveryLocation();
  const { user } = useAuth();
  const { totalItems, addToCart, items } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchData();
    if (bannerData.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % bannerData.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').limit(6)
      ]);
      if (cats) setCategories(cats);
      if (prods) setBestSellers(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!pincode) {
      setIsModalOpen(true);
      return;
    }
    
    if (isServiceable) {
      addToCart(product);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Vexokart Premium UI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-[#F8FFF9]">
      {/* 🔹 HERO BANNER */}
      <div className="px-4 mb-8">
        <div className="relative h-[250px] rounded-[3rem] bg-[#E9FCE9] overflow-hidden group shadow-2xl shadow-green-900/5">
          <div className="absolute inset-0 p-8 flex flex-col justify-center max-w-[65%]">
            <h2 className="text-4xl font-black text-[#165E27] leading-[1.1] tracking-tighter mb-2">
              Fresh Groceries <br /> Delivered Fast!
            </h2>
            <p className="text-[#165E27]/70 text-sm font-bold mb-6">
              Get your daily essentials in 30–45 minutes
            </p>
            <button 
              onClick={() => navigate('/categories')}
              className="w-fit bg-[#16A34A] text-white px-8 py-3.5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-3 shadow-xl shadow-green-900/20 active:scale-95 transition-all"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none p-4">
             <div className="relative h-full w-full">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600" 
                  alt="" 
                  className="w-full h-full object-contain filter drop-shadow-2xl" 
                />
                <div className="absolute top-8 right-0 bg-white p-3 rounded-[1.5rem] shadow-xl flex flex-col items-center">
                   <span className="text-[14px] font-black text-green-700 leading-none">30-</span>
                   <span className="text-[8px] font-black text-green-700/60 uppercase tracking-tighter">45 MINS</span>
                   <span className="text-[7px] font-black text-green-700/40 uppercase">DELIVERY</span>
                </div>
             </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
             {[1,2,3,4,5].map((_, i) => (
               <div key={i} className={cn("h-2 rounded-full transition-all duration-300", i === 0 ? "w-6 bg-green-600" : "w-2 bg-green-200")} />
             ))}
          </div>
        </div>
      </div>

      {/* 🔹 FEATURES STRIP */}
      <div className="px-4 mb-10 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 min-w-max pb-2">
          {featureStrip.map((item, idx) => (
            <div key={idx} className="bg-white rounded-[1.5rem] p-4 flex items-center gap-3 border border-slate-50 shadow-sm min-w-[160px]">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border border-white shadow-sm", item.bg)}>
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-900 leading-tight">{item.label}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 CATEGORY GRID */}
      <div className="px-4 mb-10">
        <div className="grid grid-cols-5 gap-y-8 gap-x-4">
          {categories.slice(0, 10).map((cat, idx) => (
            <motion.div
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div className={cn(
                "w-full aspect-square rounded-[2rem] flex items-center justify-center p-3 shadow-sm border border-white/5 transition-transform group-hover:scale-105",
                categoryBackgrounds[idx % categoryBackgrounds.length]
              )}>
                <img src={cat.image_url} alt="" className="w-full h-full object-contain mix-blend-multiply filter drop-shadow-sm transition-transform group-hover:rotate-6" />
              </div>
              <span className="text-[10px] font-black text-slate-800 tracking-tight text-center leading-tight">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🔹 DEAL OF THE DAY */}
      <div className="mb-10">
        <div className="px-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <h3 className="text-xl font-black text-slate-900 tracking-tighter">Deal of the Day ⚡</h3>
             <div className="flex items-center gap-1.5 bg-[#E9FCE9] text-green-700 px-3 py-1.5 rounded-full border border-green-100">
               <Clock className="h-3 w-3" />
               <span className="text-[10px] font-black">08 : 45 : 32 Left</span>
             </div>
          </div>
          <button onClick={() => navigate('/categories')} className="text-xs font-black text-green-600 flex items-center gap-1.5 uppercase tracking-widest">
            View All <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto px-4 pb-6 no-scrollbar">
          {bestSellers.map(p => {
            const hasDiscount = p.original_price && p.original_price > p.price;
            const discountPercent = hasDiscount ? Math.round(((p.original_price! - p.price) / p.original_price!) * 100) : 0;
            
            return (
              <div 
                key={p.id} 
                className="bg-white rounded-[2.5rem] p-5 min-w-[180px] shadow-xl shadow-black/[0.03] border border-slate-50 relative group flex flex-col active:scale-95 transition-all cursor-pointer"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-[0.8rem] z-10 shadow-lg shadow-red-100">
                      {discountPercent}% OFF
                    </div>
                  )}
                  <div className="w-full aspect-square mb-4 flex items-center justify-center p-2">
                    <img src={p.image_url} alt="" className="max-h-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[12px] font-black text-slate-900 leading-tight line-clamp-2 min-h-[2.5rem]">{p.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">2.25L</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-lg font-black text-slate-900 leading-none">₹{p.price}</span>
                       {hasDiscount && (
                         <span className="text-[10px] text-slate-300 line-through mt-1">₹{p.original_price}</span>
                       )}
                    </div>
                    {items.some(item => item.id === p.id) ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate('/cart'); }}
                        className="h-10 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all"
                      >
                        In Cart
                      </button>
                    ) : (
                      <button 
                       onClick={(e) => handleAddToCart(e, p)}
                       className="h-10 w-10 bg-[#16A34A] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#16A34A]/20 active:scale-90 transition-all hover:bg-green-700"
                      >
                         <Plus className="h-6 w-6" />
                      </button>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔹 PROMO BANNER 2 (Drinks) */}
      <div className="px-4 mb-4">
        <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-br from-[#E6F8E9] to-[#F7FEF8] border border-white shadow-2xl shadow-green-900/5 overflow-hidden group">
          <div className="absolute inset-0 p-8 flex flex-col justify-center">
             <span className="text-[#16A34A] text-[10px] font-black uppercase tracking-widest mb-2 bg-white/60 w-fit px-3 py-1.5 rounded-full border border-green-50">Summer Special</span>
             <h3 className="text-2xl font-black text-slate-800 leading-tight mb-1">Cool & Refreshing Drinks</h3>
             <p className="text-green-600 text-sm font-bold mb-4">Up to 30% OFF</p>
             <button className="bg-[#16A34A] text-white w-fit px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-900/10">
                Shop Now <ArrowRight className="h-3 w-3" />
             </button>
          </div>
          <div className="absolute right-[-10%] top-0 bottom-0 w-1/2 flex items-center justify-center p-4">
             <img 
              src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600" 
              alt="" 
              className="h-[120%] rotate-6 group-hover:rotate-0 transition-transform duration-700 object-contain filter drop-shadow-2xl" 
             />
          </div>
        </div>
      </div>
    </div>
  );
}
