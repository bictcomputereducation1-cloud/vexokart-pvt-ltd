import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Category, Subcategory } from '../types';
import { 
  ArrowLeft, 
  Search, 
  Star, 
  Plus, 
  Loader2,
  TrendingUp,
  Clock,
  ChevronDown,
  ShoppingBag
} from 'lucide-react';
import { useCart } from '../CartContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function CategoryProducts() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { addToCart, items, removeFromCart } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubId, setSelectedSubId] = useState<string | 'all'>('all');

  useEffect(() => {
    if (identifier) {
      fetchData();
    }
  }, [identifier]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let categoryData = null;
      
      // 1. Find Main Category
      const { data: catBySlug } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', identifier)
        .maybeSingle();
      
      if (catBySlug) {
        categoryData = catBySlug;
      } else {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(identifier!)) {
          const { data: catById } = await supabase
            .from('categories')
            .select('*')
            .eq('id', identifier)
            .maybeSingle();
          categoryData = catById;
        }
      }

      if (categoryData) {
        setCategory(categoryData);
        
        // 2. Fetch Subcategories
        const { data: subData } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryData.id)
          .order('name');
        
        if (subData) setSubcategories(subData);

        // 3. Fetch Products
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
    toast.success(`${product.name} added`, {
      position: 'bottom-center',
      duration: 1000,
    });
  };

  const filteredProducts = selectedSubId === 'all' 
    ? products 
    : products.filter(p => p.subcategory_id === selectedSubId);

  const getItemQuantity = (productId: string) => {
    return items.find(i => i.id === productId)?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading {category?.name || 'Freshness'}...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col h-screen overflow-hidden">
      {/* 🔹 STICKY HEADER */}
      <header className="flex-shrink-0 bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-900 active:scale-90 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {category?.name}
            </h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              {filteredProducts.length} Products
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/search')}
          className="h-10 w-10 flex items-center justify-center text-slate-400"
        >
          <Search className="h-5 w-5" />
        </button>
      </header>

      {/* 🔹 MAIN CONTENT AREA (SIDEBAR + GRID) */}
      <div className="flex flex-grow overflow-hidden">
        {/* LEFT SIDEBAR (Subcategories) */}
        <aside className="w-24 flex-shrink-0 bg-slate-50 border-r border-slate-100 overflow-y-auto no-scrollbar">
          <div className="flex flex-col">
            <button
              onClick={() => setSelectedSubId('all')}
              className={cn(
                "p-3 flex flex-col items-center gap-2 transition-all border-l-4",
                selectedSubId === 'all' 
                  ? "bg-white border-primary" 
                  : "border-transparent opacity-60 grayscale"
              )}
            >
              <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <span className="text-[9px] font-black uppercase text-center leading-tight tracking-tight">
                All
              </span>
            </button>

            {subcategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubId(sub.id)}
                className={cn(
                  "p-3 flex flex-col items-center gap-2 transition-all border-l-4",
                  selectedSubId === sub.id 
                    ? "bg-white border-primary" 
                    : "border-transparent opacity-60 grayscale"
                )}
              >
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                  {sub.image_url ? (
                    <img src={sub.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100" />
                  )}
                </div>
                <span className="text-[9px] font-black uppercase text-center leading-tight tracking-tight">
                  {sub.name}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT CONTENT (Product Grid) */}
        <main className="flex-grow overflow-y-auto p-4 bg-white scroll-smooth pb-32">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const quantity = getItemQuantity(product.id);
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="flex flex-col gap-2 group active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="relative aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 p-4 transition-all group-hover:shadow-lg group-hover:shadow-slate-100">
                      <img 
                        src={product.image_url || ''} 
                        alt={product.name} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                      />
                      
                      {/* Price Tag Overlay */}
                      <div className="absolute top-2 left-2 flex flex-col">
                        <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                           <p className="text-[10px] font-black text-slate-900 leading-none">₹{product.price}</p>
                        </div>
                      </div>

                      {/* Add Button Overlay */}
                      <div className="absolute bottom-2 right-2">
                        {quantity > 0 ? (
                          <div className="flex items-center bg-emerald-600 text-white rounded-xl shadow-lg border border-emerald-500 overflow-hidden h-8">
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFromCart(product.id); }}
                              className="w-7 h-full flex items-center justify-center active:bg-emerald-700 transition-colors"
                            >
                              -
                            </button>
                            <span className="px-1 text-[10px] font-black min-w-[1.25rem] text-center">{quantity}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                              className="w-7 h-full flex items-center justify-center active:bg-emerald-700 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.stock <= 0}
                            className="bg-white border-2 border-emerald-600 text-emerald-600 h-8 px-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-50/50 disabled:opacity-30 disabled:grayscale"
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="px-1">
                      <h3 className="font-bold text-[11px] text-slate-900 leading-tight mb-1 line-clamp-2 min-h-[2.2em]">{product.name}</h3>
                      <div className="flex items-center gap-1.5">
                         <span className="text-[9px] font-bold text-slate-400 line-through">₹{product.original_price || Math.round(product.price * 1.25)}</span>
                         <span className="text-[9px] font-black text-emerald-600">-{Math.round(((product.original_price || product.price*1.25) - product.price) / (product.original_price || product.price*1.25) * 100)}%</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-slate-200" />
               </div>
               <div>
                  <h3 className="text-base font-black text-slate-800">No products found</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">In this subcategory</p>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* 🔹 MINI CART BAR IF ITEMS EXIST */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-20"
          >
            <div 
              onClick={() => navigate('/cart')}
              className="bg-emerald-700 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                   <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{items.length} Item{items.length > 1 ? 's' : ''}</p>
                   <p className="text-sm font-black tracking-tight">₹{items.reduce((acc, i) => acc + (i.price * i.quantity), 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-black uppercase tracking-widest">View Cart</span>
                 <ChevronDown className="-rotate-90 h-4 w-4" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
