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
import { ProductCard } from '../components/ProductCard';

export default function CategoryProducts() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { addToCart, items, removeFromCart } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | 'all'>('all');

  useEffect(() => {
    if (identifier) {
      fetchCategory();
    }
  }, [identifier]);

  useEffect(() => {
    if (category?.id) {
      fetchProducts();
    }
  }, [category?.id, selectedSubId]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      let categoryData = null;
      
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
        
        // Fetch Subcategories once per category
        const { data: subData } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryData.id)
          .order('name');
        
        if (subData) setSubcategories(subData);
      } else {
        toast.error('Category not found');
      }
    } catch (err) {
      console.error('Error fetching category:', err);
      toast.error('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!category?.id) return;
    setProductsLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id);
      
      if (selectedSubId !== 'all') {
        query = query.eq('subcategory_id', selectedSubId);
      }

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      if (data) setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to update products');
    } finally {
      setProductsLoading(false);
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
              {products.length} Products
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {productsLoading && <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />}
          <button 
            onClick={() => navigate('/search')}
            className="h-10 w-10 flex items-center justify-center text-slate-400"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 🔹 MAIN CONTENT AREA (SIDEBAR + GRID) */}
      <div className="flex flex-grow overflow-hidden">
        {/* LEFT SIDEBAR (Subcategories) */}
        <aside className="w-[72px] flex-shrink-0 bg-slate-50 border-r border-slate-100 overflow-y-auto no-scrollbar py-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedSubId('all')}
              className="relative flex flex-col items-center gap-1.5 py-3 transition-all"
            >
              {selectedSubId === 'all' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-600 rounded-r-full" />
              )}
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                selectedSubId === 'all' 
                  ? "bg-emerald-100 text-emerald-600" 
                  : "bg-slate-100 text-slate-400 opacity-60"
              )}>
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[8px] font-black uppercase text-center leading-[1.1] tracking-tight px-1",
                selectedSubId === 'all' ? "text-slate-900" : "text-slate-500 font-bold"
              )}>
                All Items
              </span>
            </button>

            {subcategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubId(sub.id)}
                className="relative flex flex-col items-center gap-1.5 py-3 transition-all"
              >
                {selectedSubId === sub.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-600 rounded-r-full" />
                )}
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center overflow-hidden transition-all border",
                  selectedSubId === sub.id 
                    ? "bg-white border-emerald-100 shadow-sm" 
                    : "bg-white border-transparent opacity-60"
                )}>
                  {sub.image_url ? (
                    <img src={sub.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-full w-full bg-slate-50 flex items-center justify-center">
                       <ShoppingBag className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase text-center leading-[1.1] tracking-tight px-1",
                  selectedSubId === sub.id ? "text-slate-900" : "text-slate-500 font-bold"
                )}>
                  {sub.name}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT CONTENT (Product Grid) */}
        <main className="flex-grow overflow-y-auto bg-slate-50/30 scroll-smooth pb-32">
          {products.length > 0 ? (
            <div className={cn("grid grid-cols-2 gap-4 p-4 transition-opacity", productsLoading && "opacity-40")}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : productsLoading ? (
            <div className="grid grid-cols-2 gap-4 p-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="aspect-[3/4] bg-white border border-slate-100 animate-pulse rounded-3xl" />
               ))}
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
