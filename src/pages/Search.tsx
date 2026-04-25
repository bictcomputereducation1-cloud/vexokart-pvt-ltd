import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Search as SearchIcon, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

import { useAuth } from '../AuthContext';
import { useDeliveryLocation } from '../LocationContext';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const { user } = useAuth();
  const { pincode, isServiceable, setIsModalOpen } = useDeliveryLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestedTerms = ['Milk', 'Bread', 'Eggs', 'Banana', 'Onion', 'Tomato', 'Atta'];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        searchProducts();
      } else {
        setProducts([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="bg-white px-4 py-6 border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative group">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            <input 
              autoFocus
              placeholder="Search for atta, milk, snacks..." 
              className="w-full h-14 pl-14 pr-6 text-sm font-bold bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Searching the aisles...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {!query ? (
              <div className="space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-slate-800">
                     <TrendingUp className="h-4 w-4 text-emerald-500" />
                     <h2 className="text-sm font-black uppercase tracking-tighter italic">Popular Searches</h2>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {suggestedTerms.map((term) => (
                       <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-5 py-2.5 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-tighter hover:border-primary hover:bg-primary/5 transition-all shadow-sm active:scale-95"
                       >
                         {term}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="bg-primary/10 rounded-3xl p-6 flex items-center justify-between overflow-hidden relative group cursor-pointer">
                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center gap-2 text-primary font-black italic uppercase tracking-tighter text-sm">
                      <Sparkles className="h-4 w-4 fill-current" /> Lightning Fast Search
                    </div>
                    <p className="text-xs font-bold text-slate-600">Find exactly what you need in milliseconds.</p>
                  </div>
                  <SearchIcon className="h-20 w-20 text-primary opacity-20 absolute -right-4 -bottom-4 rotate-12 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Showing {products.length} results</h2>
                <div className="relative">
                  {(!user || !pincode) && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto">
                      <div className="bg-white shadow-xl p-6 rounded-2xl text-center w-[260px] border border-slate-100 animate-in zoom-in-95 duration-500">
                        <h2 className="font-bold text-lg mb-2">
                          {!user ? "Login Required" : "Set Location"}
                        </h2>
                        <p className="text-sm mb-4">
                          {!user ? "Login to view products" : "Set your delivery location"}
                        </p>
                        <button
                          onClick={() => !user ? navigate('/login') : setIsModalOpen(true)}
                          className="bg-yellow-400 px-4 py-2 rounded-lg font-bold w-full"
                        >
                          {!user ? "Login" : "Set Location"}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-12 transition-all duration-500 ${(!user || !pincode) ? 'opacity-40 grayscale blur-sm pointer-events-none select-none' : ''}`}>
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
                 <div className="bg-slate-50 p-10 rounded-full border border-slate-100">
                   <SearchIcon className="h-12 w-12 text-slate-200" />
                 </div>
                 <div className="space-y-1">
                   <p className="text-lg font-black italic tracking-tighter uppercase">No results found</p>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">We couldn't find anything for "{query}"</p>
                 </div>
                 <button 
                  onClick={() => setQuery('')}
                  className="bg-primary text-black px-8 py-3 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl active:scale-95 transition-all"
                 >
                   Clear Search
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

