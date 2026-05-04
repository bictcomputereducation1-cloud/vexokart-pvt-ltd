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
import { ProductCard } from '../components/ProductCard';

const featureStrip = [
  { icon: Star, label: "Best Quality", sub: "Premium Products", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: Zap, label: "Fast Delivery", sub: "10 Minutes", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: CreditCard, label: "Best Prices", sub: "Great Offers", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: ShieldCheck, label: "Secure Payment", sub: "100% Safe", color: "text-emerald-500", bg: "bg-emerald-50" }
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
      // 1. Get Categories
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      
      if (cats) {
        // 2. Get Products for previews
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, image_url, category_id')
          .in('category_id', cats.map(c => c.id));

        if (prods) {
          const uniqueProds = Array.from(new Map(prods.map(p => [p.id, p])).values());
          const catsWithData = cats.map(cat => {
            const catProds = uniqueProds.filter(p => p.category_id === cat.id);
            return {
              ...cat,
              previewProducts: catProds.slice(0, 4),
              totalCount: catProds.length
            };
          });
          setCategories(Array.from(new Map(catsWithData.map(c => [c.id, c])).values()) as any);
        } else {
          setCategories(Array.from(new Map(cats.map(c => [c.id, c])).values()));
        }
      }

      // 3. Best sellers
      const { data: bestProds } = await supabase.from('products').select('*').limit(6);
      if (bestProds) setBestSellers(Array.from(new Map(bestProds.map(p => [p.id, p])).values()));
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
    <div className="min-h-screen pb-32 bg-[#FAF9F6]">
      {/* 🔹 LOGO & TAGLINE */}
      <div className="pt-6 pb-4 flex flex-col items-center">
         <div className="flex items-center gap-2">
            <div className="relative mr-2">
               <div className="absolute top-1/2 -left-4 -translate-y-1/2 flex flex-col gap-1.5 opacity-60">
                  <div className="h-1 w-3 bg-[#C49B3B] rounded-full" />
                  <div className="h-1 w-5 bg-[#C49B3B] rounded-full" />
                  <div className="h-1 w-2 bg-[#C49B3B] rounded-full" />
               </div>
               <ShoppingCart className="h-9 w-9 text-[#C49B3B] fill-[#C49B3B]/5" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 logo-font">
               Vexo<span className="text-[#C49B3B]">Kart</span>
            </h1>
         </div>
         <div className="flex items-center gap-2 mt-1">
            <div className="h-[1px] w-4 bg-[#C49B3B]/40" />
            <span className="text-[10px] font-black text-[#C49B3B] uppercase tracking-[0.2em]">Smart Shopping, Easy Living</span>
            <div className="h-[1px] w-4 bg-[#C49B3B]/40" />
         </div>
      </div>

      {/* 🔹 SEARCH BAR */}
      <div className="px-4 mb-8">
        <div 
          onClick={() => navigate('/search')}
          className="relative cursor-pointer group"
        >
          <div className="flex items-center gap-4 h-14 px-6 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 transition-all active:scale-[0.98]">
            <SearchIcon className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-400 font-bold tracking-tight">Search for products, brands and more...</span>
            <div className="ml-auto h-8 w-[1px] bg-slate-100 mx-1" />
            <Mic className="h-5 w-5 text-[#C49B3B]" />
          </div>
        </div>
      </div>

      {/* 🔹 HERO BANNER */}
      <div className="px-4 mb-8">
        <div className="relative aspect-[335/200] w-full rounded-[2.5rem] bg-amber-50 overflow-hidden border border-white shadow-xl shadow-amber-900/5 group">
          {/* Background Texture/Shapes */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-100/30 skew-x-[-12deg] translate-x-12" />
          
          <div className="absolute inset-0 p-6 flex flex-col justify-center z-10 w-[60%]">
            <p className="text-slate-600 text-[10px] md:text-xs font-bold mb-1">Everything You Need,</p>
            <h2 className="text-2xl md:text-4xl font-black text-[#C49B3B] leading-[1.1] tracking-tighter mb-4">
              Delivered in <br /> 10 Minutes
            </h2>
            <p className="text-slate-400 text-[9px] md:text-[10px] font-bold mb-6">Fast. Reliable. Always.</p>
            <button 
              onClick={() => navigate('/categories')}
              className="w-fit bg-[#C49B3B] text-white px-5 py-2 md:px-6 md:py-2.5 rounded-full font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-900/20"
            >
              Shop Now <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          
          <div className="absolute right-0 top-0 bottom-0 w-[55%] flex items-center justify-end p-2 md:p-4">
             <img 
               src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600" 
               alt="" 
               className="h-full object-contain filter drop-shadow-2xl translate-x-4" 
             />
          </div>

          {/* 10 MINS Badge */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 z-[11]">
             <div className="bg-white rounded-full h-16 w-16 md:h-20 md:w-20 flex flex-col items-center justify-center border-2 border-amber-100 p-1 shadow-sm">
                <span className="text-xl md:text-2xl font-black text-amber-600 leading-none">10</span>
                <span className="text-[6px] md:text-[7px] font-black text-slate-400 uppercase tracking-tighter text-center">Minutes<br/>Delivery</span>
             </div>
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Shop by Category</h3>
          <button onClick={() => navigate('/categories')} className="text-xs font-bold text-[#C49B3B] flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat: any) => (
            <motion.div
              key={cat.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center p-3 shadow-md border border-slate-100 transition-all group-hover:shadow-amber-100 group-hover:border-amber-100">
                <img 
                  src={cat.image_url || ''} 
                  alt={cat.name} 
                  className="w-full h-full object-contain filter group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🔹 BEST SELLERS */}
      <div className="mb-10">
        <div className="px-4 flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Best Sellers</h3>
          <button onClick={() => navigate('/categories')} className="text-xs font-bold text-[#C49B3B] flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto px-4 pb-6 no-scrollbar">
          {bestSellers.map(p => (
            <div key={p.id} className="min-w-[170px] max-w-[170px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 DEAL OF THE DAY */}
      <div className="mb-10">
        <div className="px-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <h3 className="text-xl font-bold text-slate-800 tracking-tight">Top Deals for You</h3>
             <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100">
               <Clock className="h-3.5 w-3.5" />
               <span className="text-[11px] font-bold">02 : 45 : 12 Left</span>
             </div>
          </div>
          <button onClick={() => navigate('/categories')} className="text-xs font-bold text-[#C49B3B] flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto px-4 pb-6 no-scrollbar">
          {bestSellers.slice().reverse().map(p => (
            <div key={p.id} className="min-w-[170px] max-w-[170px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 GOLD SAVINGS BANNER */}
      <div className="px-4 mb-2">
        <div className="relative h-[160px] rounded-[2.5rem] overflow-hidden group shadow-xl">
           <div className="absolute inset-0 bg-[#FDF5E6]" />
           {/* Decorative shapes */}
           <div className="absolute -right-20 -top-20 h-60 w-60 bg-amber-200/40 rounded-full blur-3xl" />
           <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-amber-400/20 rounded-full blur-2xl" />
           
           <div className="relative h-full flex items-center px-8">
              <div className="flex flex-col items-center mr-8">
                 <Star className="h-6 w-6 text-[#C49B3B] mb-1" />
                 <span className="text-xl font-black text-[#C49B3B] leading-none mb-0.5 uppercase tracking-tighter text-center">Gold<br/>Savings</span>
              </div>
              
              <div className="flex flex-col">
                 <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2">Exclusive Offers<br/>For You</h3>
                 <button className="bg-[#C49B3B] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit shadow-lg shadow-amber-900/20 active:scale-95 transition-all">
                    View Offers
                 </button>
              </div>

              <div className="ml-auto w-1/3 flex justify-end">
                  <div className="relative h-24 w-24">
                     <div className="absolute inset-0 bg-white rounded-2xl rotate-12 shadow-md" />
                     <div className="absolute inset-0 bg-[#C49B3B] rounded-2xl -rotate-6 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1549463591-24c1882bd396?auto=format&fit=crop&q=80&w=300"
                          alt="gift"
                          className="w-full h-full object-cover"
                        />
                     </div>
                  </div>
              </div>
           </div>
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
