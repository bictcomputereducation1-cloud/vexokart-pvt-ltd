import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';
import { Search, ChevronRight, Clock, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group products by category for sections
  const productsByCategory = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category_id === cat.id).slice(0, 6)
  })).filter(cat => cat.products.length > 0);

  const trendingProducts = products.slice(0, 8);

  return (
    <div className="bg-white">
      {/* Mobile Search Bar - Sticky on top just below the main nav if scroll */}
      <div className="md:hidden sticky top-16 z-40 bg-white px-4 py-3 border-b border-slate-100">
        <div 
          onClick={() => navigate('/search')}
          className="flex items-center gap-3 w-full h-12 px-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400"
        >
          <Search className="h-5 w-5" />
          <span className="text-sm font-medium italic">Search for butter, bread, milk...</span>
        </div>
      </div>

      <div className="space-y-4 pb-12">
        {/* Promotional Banner */}
        <section className="px-4 pt-4">
          <div className="relative h-44 md:h-64 rounded-3xl overflow-hidden bg-emerald-900 group">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
              alt="Promotion"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/60 to-transparent flex flex-col justify-center px-8 text-white">
              <div className="inline-flex items-center gap-2 bg-yellow-400 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded mb-3 w-fit tracking-wider">
                <Zap className="h-3 w-3 fill-current" />
                Super Sale
              </div>
              <h1 className="text-2xl md:text-5xl font-black italic tracking-tighter mb-1">GET 25% OFF</h1>
              <p className="text-sm md:text-lg text-emerald-100/90 font-medium max-w-xs md:max-w-md mb-4">On your first grocery order. Use code: FIRST25</p>
              <button className="bg-white text-emerald-900 px-6 py-2 rounded-xl font-bold w-fit active:scale-95 transition-all text-sm md:text-base shadow-lg">
                Shop Now
              </button>
            </div>
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="px-4">
          <div className="grid grid-cols-3 gap-2 bg-slate-50 py-3 px-4 rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center justify-center text-center">
              <Clock className="h-5 w-5 text-emerald-600 mb-1" />
              <span className="text-[10px] font-bold uppercase leading-tight">15 Min<br/>Delivery</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-x border-slate-200">
              <ShieldCheck className="h-5 w-5 text-primary mb-1" />
              <span className="text-[10px] font-bold uppercase leading-tight">Safe &<br/>Secure</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <Zap className="h-5 w-5 text-yellow-500 mb-1" />
              <span className="text-[10px] font-bold uppercase leading-tight">Lightning<br/>Fast</span>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="px-4 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight italic uppercase">Shop by Category</h2>
            <button 
              onClick={() => navigate('/categories')}
              className="text-primary text-xs font-black uppercase flex items-center"
            >
              See All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {categories.slice(0, 8).map((cat) => (
              <div 
                key={cat.id} 
                className="category-card"
                onClick={() => navigate(`/categories?category=${cat.id}`)}
              >
                <div className="bg-white p-2 rounded-xl border border-slate-100 aspect-square flex items-center justify-center mb-2 shadow-sm group">
                   <img 
                    src={cat.image_url || `https://picsum.photos/seed/${cat.name}/100/100`} 
                    alt={cat.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-700 text-center uppercase tracking-tighter leading-tight line-clamp-1">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Section */}
        <section className="pt-4 bg-slate-50/50 pb-8">
          <div className="px-4 flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight italic uppercase">Popular Picks</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 no-scrollbar pb-4">
            {trendingProducts.map((p) => (
              <div key={p.id} className="min-w-[160px] md:min-w-[200px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>

        {/* Category Sections */}
        {productsByCategory.map((section, idx) => (
          <section key={section.id} className={idx % 2 === 0 ? "" : "bg-slate-50/30 py-6"}>
            <div className="px-4 flex items-center justify-between mb-4">
              <h2 className="text-xl font-black tracking-tight italic uppercase">{section.name}</h2>
              <button 
                onClick={() => navigate(`/categories?category=${section.id}`)}
                className="text-primary text-xs font-black uppercase flex items-center"
              >
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex overflow-x-auto gap-4 px-4 no-scrollbar pb-4">
              {section.products.map((p) => (
                <div key={p.id} className="min-w-[160px] md:min-w-[200px]">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

