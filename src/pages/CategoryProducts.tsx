import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { 
  ArrowLeft, 
  Search, 
  Star, 
  Plus, 
  Loader2,
  TrendingUp,
  Clock,
  ChevronDown
} from 'lucide-react';
import { useCart } from '../CartContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function CategoryProducts() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (identifier) {
      fetchData();
    }
  }, [identifier]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // First try to find category by slug, then fallback to ID if it looks like a UUID
      let categoryData = null;
      
      const { data: catBySlug } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', identifier)
        .single();
      
      if (catBySlug) {
        categoryData = catBySlug;
      } else {
        // Check if identifier is a valid UUID before trying to query by ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(identifier!)) {
          const { data: catById } = await supabase
            .from('categories')
            .select('*')
            .eq('id', identifier)
            .single();
          categoryData = catById;
        }
      }

      if (categoryData) {
        setCategory(categoryData);
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', categoryData.id);
        
        if (productsData) setProducts(productsData);
      } else {
        toast.error('Category not found');
      }
    } catch (err) {
      console.error('Error fetching category products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart`, {
      position: 'bottom-center',
      duration: 1500,
    });
  };

  const filteredProducts = [...products].sort((a, b) => {
    if (filter === 'Price Low-High') return a.price - b.price;
    if (filter === 'New') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const filterChips = ['All', 'Popular', 'New', 'Price Low-High'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading {category?.name || 'Freshness'}...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* 🔹 CATEGORY HEADER */}
      <div className="bg-white px-4 py-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
            {category?.name}
          </h1>
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {products.length} Items Available
          </p>
        </div>
        
        {category?.image_url && (
          <div className="h-16 w-16 bg-slate-50 rounded-2xl p-2 border border-slate-50 shadow-sm overflow-hidden">
            <img src={category.image_url} alt="" className="w-full h-full object-contain filter drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* 🔹 FILTER BAR */}
      <div className="bg-white border-b border-slate-100 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4">
          {filterChips.map(chip => (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                filter === chip 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100' 
                : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 🔹 PRODUCT LIST */}
      <div className="p-4 space-y-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group active:scale-[0.98] transition-all cursor-pointer"
            >
              {/* Image Left */}
              <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-50 p-2">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                />
              </div>

              {/* Content Center */}
              <div className="flex-grow min-w-0 py-1">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {product.stock < 10 && (
                     <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">Low Stock</span>
                  )}
                  <div className="flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    <span>4.5</span>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 leading-tight mb-0.5 truncate">{product.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Get in 10 mins
                </p>

                <div className="flex flex-wrap gap-1.5">
                   {idx % 2 === 0 && <span className="text-[9px] font-black uppercase text-emerald-600 tracking-tighter">⭐ Bestseller</span>}
                   <span className="text-[9px] font-black uppercase text-blue-500 tracking-tighter">Organic</span>
                </div>
              </div>

              {/* Price Right */}
              <div className="flex flex-col items-end gap-2 pr-1">
                <div className="text-right">
                  <p className="text-sm font-black text-[#10b981] leading-none">₹{product.price}</p>
                  <p className="text-[10px] text-slate-300 line-through font-bold mt-0.5 leading-none">₹{product.original_price || Math.round(product.price * 1.25)}</p>
                </div>
                
                {items.some(item => item.id === product.id) ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/cart'); }}
                    className="bg-slate-900 border-2 border-slate-900 text-white h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-100"
                  >
                    GO TO
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={product.stock <= 0}
                    className="bg-white border-2 border-emerald-600 text-emerald-600 h-9 px-6 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50/50 disabled:opacity-30 disabled:border-slate-200 disabled:text-slate-200"
                  >
                    ADD
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                <TrendingUp className="h-10 w-10 text-slate-300 rotate-45" />
             </div>
             <div>
                <h3 className="text-lg font-black italic tracking-tighter text-slate-800">No items found</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">We are restocking this section soon</p>
             </div>
             <button 
                onClick={() => navigate('/')}
                className="bg-primary text-black px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
             >
                Go Back Home
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
