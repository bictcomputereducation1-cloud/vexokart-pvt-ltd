import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import { motion } from 'motion/react';
import { ChevronRight, Grid } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 px-4 py-8">
      {[...Array(16)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-square bg-slate-100 animate-pulse rounded-2xl" />
          <div className="h-2 w-12 bg-slate-100 animate-pulse mx-auto" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-6 mb-4">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">All Categories</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Shop essentials by category</p>
      </div>
      
      <div className="px-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-full aspect-square bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-md transition-all">
                <img 
                  src={cat.image_url || `https://picsum.photos/seed/${cat.name}/200/200`} 
                  alt={cat.name}
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-black uppercase text-slate-800 text-center leading-tight tracking-tighter">{cat.name}</span>
                <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-12 px-4 pb-12">
        <div className="bg-emerald-900 rounded-3xl p-6 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-lg font-black italic uppercase tracking-tight mb-2">Missing something?</h3>
            <p className="text-sm text-emerald-100/80 font-medium mb-4">We're constantly adding new products every week.</p>
            <button className="bg-white text-emerald-900 px-6 py-2 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all">
              Request a Product
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-800/50 rounded-full blur-2xl" />
          <div className="absolute right-4 top-4 opacity-10">
             <Grid className="h-24 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

