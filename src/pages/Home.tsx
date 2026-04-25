import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { 
  ChevronRight, 
  Menu, 
  Bell, 
  ShoppingCart, 
  ChevronDown, 
  Search, 
  QrCode, 
  Zap, 
  ShieldCheck, 
  Star, 
  Headphones,
  ArrowRight
} from 'lucide-react';
import { useDeliveryLocation } from '../LocationContext';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { motion } from 'motion/react';

export default function Home() {
  const navigate = useNavigate();
  const { pincode, city, isLoading, setIsModalOpen } = useDeliveryLocation();
  const { user } = useAuth();
  const { totalItems } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading && user && !pincode) {
      setIsModalOpen(true);
    }
  }, [isLoading, user, pincode]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ]);

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const shouldBlockProducts = !user || !pincode;

  const bestSellers = products.slice(0, 8);
  
  const offers = [
    { title: "UP TO 30% OFF", sub: "Daily Essentials", color: "bg-orange-50", text: "text-orange-600", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200" },
    { title: "UP TO 25% OFF", sub: "Fresh Fruits", color: "bg-emerald-50", text: "text-emerald-600", img: "https://images.unsplash.com/photo-1610832958506-aa56338406cd?auto=format&fit=crop&q=80&w=200" },
    { title: "UP TO 20% OFF", sub: "Beverages", color: "bg-blue-50", text: "text-blue-600", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Vexokart...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* 🔹 CUSTOM HEADER (Blinkit Style) */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-50 px-4 py-3 space-y-3 shadow-sm">
        <div className="flex items-center justify-between font-sans">
          <button className="p-2 -ml-2 text-slate-700">
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xl font-black italic tracking-tighter leading-none text-emerald-600">
              VEXO<span className="text-slate-900">KART</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-700 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button onClick={() => navigate('/cart')} className="p-2 text-slate-700 relative">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Delivery Location */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 cursor-pointer group"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Deliver to</span>
              <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1">
              {pincode ? `${city || 'Sector'}, ${pincode}` : 'Select Delivery Location'}
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex items-center gap-2">
          <div 
            onClick={() => navigate('/search')}
            className="flex-grow flex items-center gap-3 h-12 px-4 bg-slate-100 rounded-2xl border border-slate-100 cursor-pointer group"
          >
            <Search className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Search for products...</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-100">
              <QrCode className="h-5 w-5" />
            </button>
            <button 
              onClick={() => navigate('/search')}
              className="h-12 px-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 MAIN BANNER */}
      <div className="px-4 py-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-44 rounded-[2.5rem] bg-emerald-900 overflow-hidden group shadow-xl shadow-emerald-900/10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-900/80 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
            alt="Grocery" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="relative z-20 h-full p-8 flex flex-col justify-center max-w-[65%]">
            <h1 className="text-2xl font-black text-white leading-tight tracking-tighter italic">
              Daily Needs,<br />Delivered Fresh!
            </h1>
            <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest mt-2">Get up to 40% Off on Fruits</p>
            <button className="mt-4 bg-primary text-black w-fit px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] hover:shadow-lg transition-all active:scale-95">
              Shop Now
            </button>
          </div>
          
          {/* Slider Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            <div className="w-4 h-1.5 bg-primary rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* 🔹 CATEGORIES SECTION */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black italic tracking-tighter text-slate-900">Categories</h2>
          <button 
            onClick={() => navigate('/categories')}
            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {categories.slice(0, 8).map(cat => (
            <motion.div
              whileTap={{ scale: 0.95 }}
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-full aspect-square bg-white border border-slate-100 rounded-[1.5rem] p-3 flex shadow-sm group-hover:shadow-md transition-all">
                <img 
                  src={cat.image_url} 
                  alt={cat.name} 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
                />
              </div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter text-center leading-tight line-clamp-2">
                {cat.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🔹 TOP OFFERS SECTION */}
      <div className="px-4 py-6 bg-slate-50/50">
        <h2 className="text-lg font-black italic tracking-tighter text-slate-900 mb-4">Top Offers</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {offers.map((offer, idx) => (
            <div 
              key={idx}
              className={`min-w-[280px] p-6 rounded-[2rem] ${offer.color} border border-white flex justify-between items-center group cursor-pointer shadow-sm`}
            >
              <div className="space-y-1">
                <p className={`text-sm font-black italic tracking-tighter ${offer.text}`}>{offer.title}</p>
                <p className="text-slate-900 font-black uppercase text-[12px] tracking-widest">{offer.sub}</p>
                <button className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-white px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                  Shop Now <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <img src={offer.img} alt="" className="w-20 h-20 object-cover rounded-2xl rotate-3 group-hover:rotate-0 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 BEST SELLING PRODUCTS */}
      <div className="px-4 py-8 relative">
        {shouldBlockProducts && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-md shadow-2xl p-8 rounded-[2.5rem] text-center w-[280px] border border-white pointer-events-auto">
              <h2 className="text-lg font-black italic tracking-tighter text-slate-900 mb-2">
                {!user ? "Login Required" : "Set Location First"}
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 leading-relaxed px-4">
                {!user ? "Join the Vexokart family to start shopping" : "Tell us where to deliver your fresh produce"}
              </p>
              <button
                onClick={() => !user ? navigate('/login') : setIsModalOpen(true)}
                className="bg-primary text-black w-full py-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                {!user ? "Get Started" : "Set Location"}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black italic tracking-tighter text-slate-900">Best Sellers</h2>
          <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 hover:gap-2 transition-all">
            Explore All <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-700 ${shouldBlockProducts ? 'blur-xl grayscale opacity-30 select-none' : ''}`}>
          {bestSellers.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* 🔹 BOTTOM FEATURES */}
      <div className="px-4 py-8 border-t border-slate-50">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-3xl flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Zap className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Fast Delivery</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">In 14 Minutes</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-3xl flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Best Quality</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Purely Organic</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-3xl flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
              <Star className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Hot Offers</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Daily Discounts</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-3xl flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <Headphones className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">24/7 Support</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Always active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
