import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import { motion } from 'motion/react';
import { 
  Menu, 
  ShoppingCart, 
  ChevronDown, 
  Search as SearchIcon, 
  ArrowRight,
  ChevronRight,
  Zap,
  Award,
  Truck,
  Tag,
  ShieldCheck,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useDeliveryLocation } from '../LocationContext';
import { useCart } from '../CartContext';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { address, setIsModalOpen } = useDeliveryLocation();
  const { totalItems } = useCart();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Categories...</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      {/* 🔹 1. SINGLE HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <button className="h-10 w-10 flex items-center justify-center text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
          <Menu className="h-6 w-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <div className="bg-emerald-600 p-1 rounded-lg">
              <ShoppingCart className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900 leading-none">
              Vexo<span className="text-emerald-600">Kart</span>
            </span>
          </div>
          <span className="text-[7px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mt-1 ml-4">
            - Cool Point -
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/search')}
            className="h-10 w-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate('/cart')}
            className="h-10 w-10 flex items-center justify-center text-slate-800 hover:bg-slate-50 rounded-xl transition-colors relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 🔹 2. TOP DELIVERY BAR */}
      <div className="px-4 py-3">
        <div 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 flex items-center justify-between cursor-pointer group hover:bg-emerald-100/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-white rounded-lg flex items-center justify-center shadow-sm text-emerald-600">
              <Zap className="h-3.5 w-3.5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Deliver to</span>
              <span className="text-xs font-black text-slate-800 leading-none truncate max-w-[200px]">
                {address || 'Near HSS haigam Sopore'}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-emerald-600 group-hover:translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* 🔹 3. PAGE TITLE */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">All Categories</h1>
          <div className="h-1 w-12 bg-emerald-500 rounded-full mt-1" />
        </div>
        <button className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
          See All <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 🔹 4-5. CATEGORY GRID */}
      <div className="px-4 pb-12">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="bg-[#f8f8f8] rounded-[20px] p-2.5 shadow-sm border border-slate-100 flex flex-col items-center gap-3 group cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="w-full aspect-square flex items-center justify-center bg-white rounded-2xl p-2 group-hover:scale-105 transition-transform duration-500">
                <img 
                  src={cat.image_url} 
                  alt={cat.name} 
                  className="w-full h-full object-contain filter drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center w-full min-h-[2rem] flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-800 tracking-tight leading-[1.1] uppercase px-1">
                  {cat.name}
                </p>
                <div className="h-0.5 w-4 bg-emerald-500/20 group-hover:w-8 group-hover:bg-emerald-500 rounded-full mt-1.5 mx-auto transition-all" />
              </div>
            </motion.div>
          ))}
          
          {/* Fallback mockup categories if database is empty for visual demo */}
          {categories.length === 0 && (
            [
              { name: 'Cold Drinks', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&h=400&auto=format&fit=crop' },
              { name: 'Ice Cream', img: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=400&h=400&auto=format&fit=crop' },
              { name: 'Grocery', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&auto=format&fit=crop' },
              { name: 'Snacks', img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bb087?q=80&w=400&h=400&auto=format&fit=crop' },
              { name: 'Chocolates', img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=400&h=400&auto=format&fit=crop' },
              { name: 'Personal Care', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=400&h=400&auto=format&fit=crop' },
              { name: 'Home Care', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&h=400&auto=format&fit=crop' },
              { name: 'Baby Care', img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=400&h=400&auto=format&fit=crop' },
              { name: 'Pet Care', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&h=400&auto=format&fit=crop' }
            ].map((cat, i) => (
              <div key={i} className="bg-[#f8f8f8] rounded-[20px] p-2.5 shadow-sm border border-slate-100 flex flex-col items-center gap-3">
                <div className="w-full aspect-square bg-white rounded-2xl p-2 overflow-hidden flex items-center justify-center">
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center w-full min-h-[2rem] flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-800 tracking-tight leading-[1.1] uppercase px-1">{cat.name}</p>
                  <p className="h-0.5 w-4 bg-emerald-500/20 rounded-full mt-1.5 mx-auto" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🔹 6. BANNER SECTION */}
      <div className="px-4 pb-8">
        <div className="bg-[#0b4b24] rounded-[1.5rem] p-6 text-white relative overflow-hidden shadow-xl min-h-[160px] flex flex-col justify-center">
          {/* Background Products (Mockup style using overlay) */}
          <div className="absolute right-0 top-0 h-full w-[60%] pointer-events-none z-0">
            <img 
              src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop" 
              className="absolute right-20 top-2 h-[80%] object-contain drop-shadow-2xl"
              alt="drinks"
            />
            <img 
              src="https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=400&auto=format&fit=crop" 
              className="absolute right-2 top-4 h-[90%] object-contain drop-shadow-2xl"
              alt="icecream"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
               <div className="h-10 w-10 border-2 border-yellow-400 rounded-full flex items-center justify-center p-1 bg-green-900/50">
                  <Award className="h-6 w-6 text-yellow-400" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[14px] font-black leading-none text-yellow-400">Best Quality,</span>
                  <span className="text-[18px] font-black leading-none mt-1">Best Life!</span>
               </div>
            </div>
            
            <button 
              onClick={() => navigate('/home')}
              className="bg-white text-emerald-900 px-5 py-2.5 rounded-xl font-black uppercase tracking-tight text-[11px] shadow-lg active:scale-95 transition-all flex items-center gap-2 mt-4"
            >
              Shop Now <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 7. FEATURES ROW */}
      <div className="px-4 pb-12">
        <div className="bg-[#f2f8f4] border border-emerald-50 rounded-3xl p-4 grid grid-cols-4 gap-1">
          {[
            { icon: ShieldCheck, title: "Quality Products", sub: "Best Guaranteed" },
            { icon: Truck, title: "Fast Delivery", sub: "On Time" },
            { icon: Tag, title: "Best Prices", sub: "Great Offers" },
            { icon: ShieldCheck, title: "Secure Payment", sub: "100% Safe" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-1">
              <item.icon className="h-5 w-5 text-emerald-700 mb-1" />
              <span className="text-[8px] font-black text-slate-800 leading-none">
                {item.title}
              </span>
              <span className="text-[6px] font-medium text-emerald-600/70 whitespace-nowrap">
                {item.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


