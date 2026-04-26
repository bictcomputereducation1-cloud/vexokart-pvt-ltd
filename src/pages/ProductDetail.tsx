import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Star, 
  Search, 
  Heart, 
  ShoppingCart, 
  ChevronRight, 
  MapPin, 
  Clock, 
  CheckCircle2,
  Share2,
  ShieldCheck,
  Zap,
  PackageCheck,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeliveryLocation } from '../LocationContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const { items, addToCart, totalItems, finalTotal } = useCart();
  const { pincode, city, setIsModalOpen } = useDeliveryLocation();
  const navigate = useNavigate();

  const isInCart = items.some(item => item.id === id);

  const sizes = ['500g', '1kg', '2kg', '5kg'];

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);

      // Fetch recommended
      const { data: recs } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', data.category_id)
        .neq('id', data.id)
        .limit(6);
      
      if (recs) setRecommended(recs);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading item details...</p>
    </div>
  );
  if (!product) return null;

  const oldPrice = product.original_price || product.price;
  const savings = Math.max(0, oldPrice - product.price);
  const discountPercent = oldPrice > product.price ? Math.round((savings / oldPrice) * 100) : 0;

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/checkout');
  };

  return (
    <div className="bg-white min-h-screen pb-40">
      {/* 🔹 PREMIUM HEADER REMOVED - NOW USING GLOBAL NAVBAR */}
      
      <div className="max-w-2xl mx-auto">
        {/* 🔹 BREADCRUMB */}
        <div className="px-4 py-3 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <span>Home</span>
           <ChevronRight className="h-3 w-3" />
           <span className="line-clamp-1">{(product as any).categories?.name || 'Category'}</span>
           <ChevronRight className="h-3 w-3" />
           <span className="text-slate-900 truncate">{product.name}</span>
        </div>

        {/* 🔹 MAIN PRODUCT SECTION */}
        <div className="px-4 pb-8">
          <div className="relative bg-slate-50 rounded-[2.5rem] p-10 flex flex-col items-center mb-6">
            <div className="absolute top-6 left-6 z-10 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-red-100 uppercase tracking-widest">
              {discountPercent}% OFF
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full aspect-square flex items-center justify-center"
            >
              <img 
                src={product.image_url} 
                alt={product.name}
                className="max-w-full max-h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
              />
            </motion.div>

            {/* Thumbnail Scroll */}
            <div className="flex gap-3 mt-8 overflow-x-auto pb-2 no-scrollbar px-4 w-full justify-center">
              {[1,2,3].map(i => (
                <div key={i} className={cn(
                  "h-14 w-14 shrink-0 rounded-2xl border-2 flex items-center justify-center bg-white p-2 transition-all cursor-pointer",
                  i === 1 ? "border-green-500 shadow-lg shadow-green-100" : "border-slate-100 hover:border-slate-200"
                )}>
                  <img src={product.image_url} alt="" className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Header Info */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600">Coca Cola</p>
              <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-green-600">2.25L</span>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black">
                  <Star className="h-3.5 w-3.5 fill-current" /> 4.6 (12,345 ratings)
                </div>
              </div>
            </div>

            {/* 🔹 FEATURE BOXES */}
            <div className="grid grid-cols-3 gap-3 py-2">
              {[
                { icon: ShieldCheck, title: "100% Original", sub: "Best Quality" },
                { icon: Zap, title: "Fast Delivery", sub: "30-45 mins" },
                { icon: PackageCheck, title: "Secure Pack", sub: "Safe Delivery" }
              ].map((f, i) => (
                <div key={i} className="bg-green-50 rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 border border-green-100">
                  <f.icon className="h-5 w-5 text-green-600" />
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-900 leading-none">{f.title}</p>
                    <p className="text-[7px] font-bold text-green-700 uppercase tracking-tighter leading-none">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 🔹 PRICE & QUANTITY */}
            <div className="flex items-center justify-between py-6 border-y border-slate-100">
              <div className="flex flex-col">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-green-600 leading-none tracking-tighter">₹{product.price}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-lg text-slate-400 line-through font-bold leading-none">₹{product.original_price}</span>
                  )}
                </div>
                {product.original_price && product.original_price > product.price && (
                  <div className="mt-2 inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    You Save ₹{savings} ({discountPercent}% OFF)
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-900 shadow-sm active:scale-90"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-lg font-black text-slate-900 w-4 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100 active:scale-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 🔹 DYNAMIC CART BUTTON */}
            <AnimatePresence mode="wait">
              {!isInCart ? (
                <motion.button 
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  onClick={() => {
                    addToCart(product);
                  }}
                  className="w-full h-16 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-2xl shadow-green-900/20 active:scale-[0.98] transition-all"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </motion.button>
              ) : (
                <motion.button 
                  key="go-btn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  onClick={() => navigate('/cart')}
                  className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-xs flex flex-col items-center justify-center gap-0.5 shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>Go to Cart</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 tracking-widest">
                    <span>{totalItems} items</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>Total ₹{finalTotal}</span>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            {/* 🔹 DESCRIPTION */}
            <div className="space-y-3 pt-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Product Description</h3>
              <div className="relative">
                <p className={cn(
                  "text-xs font-bold text-slate-500 leading-relaxed transition-all duration-300",
                  !isDescExpanded && "line-clamp-3"
                )}>
                  {product.description || "Experience the refreshingly original taste of Coca-Cola, the world's most popular sparkling drink. Perfectly balanced with its signature flavor, it's the ultimate thirst quencher for any occasion. Made with high-quality ingredients, it deliver a consistently crisp and clean taste that has been loved for generations. Best served chilled for the maximum refreshing experience. Open a bottle and share the happiness with your friends and family."}
                </p>
                <button 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-green-600 text-[10px] font-black uppercase tracking-widest mt-2 hover:underline"
                >
                  {isDescExpanded ? 'Read Less' : 'Read More'}
                </button>
              </div>
            </div>

            {/* 🔹 RECOMMENDED PRODUCTS */}
            {recommended.length > 0 && (
              <div className="space-y-6 pt-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">You may also like</h3>
                  <button className="text-green-600 text-[10px] font-black uppercase tracking-widest">View All</button>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                  {recommended.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="min-w-[160px] bg-slate-50 rounded-[2rem] p-4 relative group cursor-pointer"
                    >
                      <button className="absolute top-3 right-3 z-10 h-8 w-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" />
                      </button>
                      <div className="w-full aspect-square mb-3 flex items-center justify-center p-2">
                        <img src={item.image_url} alt="" className="max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
                      </div>
                      <h4 className="text-[11px] font-black text-slate-800 truncate mb-1">{item.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 mb-2">2.25L</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900 italic">₹{item.price}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                          className="h-8 w-8 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🔹 BOTTOM INFO STRIP */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-10 py-12">
               {[
                 { icon: ShieldCheck, text: "Best Quality", sub: "100% Assurance" },
                 { icon: Clock, text: "Fast Delivery", sub: "30-45 Mins" },
                 { icon: ArrowLeft, text: "Easy Returns", sub: "No Questions Asked" },
                 { icon: PackageCheck, text: "Secure Payment", sub: "PCI-DSS Compliant" }
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                     <item.icon className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-900 leading-none">{item.text}</p>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{item.sub}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 STICKY FOOTER REMOVED FOR CLEAN SINGLE BUTTON UI */}
    </div>
  );
}


