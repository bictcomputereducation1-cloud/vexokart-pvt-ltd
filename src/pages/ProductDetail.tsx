import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from '../components/ProductCard';
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
  const [selectedSize, setSelectedSize] = useState('1 kg');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const { items, addToCart, removeFromCart, getItemQuantity } = useCart();
  const { address, city } = useDeliveryLocation();
  const navigate = useNavigate();

  const itemQty = getItemQuantity(id || '');

  const sizes = ['1 kg', '2 kg', '5 kg', '10 kg'];

  useEffect(() => {
    if (id) fetchProduct();
    window.scrollTo(0, 0);
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
      <div className="w-12 h-12 border-4 border-[#5E3192] border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading item details...</p>
    </div>
  );
  if (!product) return null;

  const oldPrice = product.original_price || Math.round(product.price * 1.25);
  const savings = Math.max(0, oldPrice - product.price);
  const discountPercent = Math.round((savings / oldPrice) * 100);

  return (
    <div className="bg-[#F8F9FB] min-h-screen pb-40 font-sans">
      {/* 🔹 STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-[#5E3192] text-white pt-2 pb-4">
        <div className="px-4 flex items-center h-14 gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-white/10 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex-grow flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/70 leading-none">Delivering in 10 mins</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tight line-clamp-1 max-w-[150px]">
                  {address || 'Set Location...'}
                </span>
                <ChevronRight className="h-3 w-3 rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 bg-white/10 rounded-full"><Share2 className="h-5 w-5" /></button>
            <button className="p-2 bg-white/10 rounded-full"><Heart className="h-5 w-5" /></button>
            <Link to="/cart" className="p-2 bg-white/10 rounded-full relative">
              <ShoppingCart className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 bg-white text-[#5E3192] text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#5E3192]">
                6
              </div>
            </Link>
          </div>
        </div>

        {/* Search Bar in Header */}
        <div className="px-4 mt-1">
           <div className="bg-white rounded-full h-12 flex items-center px-4 shadow-lg">
             <Search className="h-5 w-5 text-slate-400 mr-2" />
             <input 
               type="text" 
               placeholder="Search for atta, dal, rice, oil..." 
               className="bg-transparent flex-grow text-sm font-medium text-slate-700 outline-none"
             />
             <div className="h-8 w-8 rounded-full bg-[#5E3192] flex items-center justify-center text-white">
                <Search className="h-4 w-4" />
             </div>
           </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-3 p-3">
        {/* 🔹 MAIN PRODUCT CARD */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
          {/* Image Section */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 relative">
              <div className="absolute top-0 left-0 bg-[#5E3192] text-white text-[12px] font-black px-4 py-3 rounded-br-[1.5rem] rounded-tl-[1.5rem] z-10 flex flex-col items-center">
                <span>{discountPercent}%</span>
                <span className="text-[10px]">OFF</span>
              </div>
              
              <div className="aspect-square flex items-center justify-center p-4">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="max-h-full object-contain"
                />
              </div>
              
              {/* Carousel Dots */}
              <div className="flex justify-center gap-1.5 mt-2">
                <div className="w-6 h-1.5 rounded-full bg-[#5E3192]" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              </div>
            </div>

            {/* Info Section */}
            <div className="w-full md:w-1/2 space-y-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-1">{product.name}</h1>
                <p className="text-lg font-bold text-slate-400 mb-4">{selectedSize}</p>
                
                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-bold text-[13px] px-3 py-1 rounded-lg border border-amber-100">
                     <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                     <span>4.7</span>
                   </div>
                   <span className="text-[13px] font-bold text-slate-400">(12.5K reviews)</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">₹{product.price}</span>
                  <span className="text-xl font-bold text-slate-300 line-through">₹{oldPrice}</span>
                </div>
                <div className="bg-[#F3E8FF] text-[#5E3192] text-[11px] font-black px-3 py-1 rounded-lg uppercase">
                  {discountPercent}% OFF
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400">Inclusive of all taxes</p>

              {/* Free Delivery Banner */}
              <div className="bg-[#F5F1FF] rounded-2xl p-4 flex items-center gap-4 border border-[#5E3192]/10">
                <div className="h-10 w-10 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-[#5E3192] fill-[#5E3192]/10" />
                </div>
                <div>
                   <p className="text-[13px] font-black text-[#5E3192] uppercase tracking-wide">FREE Delivery</p>
                   <p className="text-[11px] font-medium text-slate-500">On orders above ₹299</p>
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="space-y-3">
                <p className="text-sm font-black text-slate-900">Select Quantity</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-6 py-3 rounded-xl text-xs font-bold transition-all border-2",
                        selectedSize === size 
                          ? "bg-[#5E3192] text-white border-[#5E3192] shadow-lg shadow-[#5E3192]/20" 
                          : "bg-white text-slate-600 border-slate-100 hover:border-slate-200"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 FEATURE BADGES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: ShieldCheck, title: "100% Original", sub: "Products", color: "text-purple-600", bg: "bg-purple-50" },
            { icon: Star, title: "Best Quality", sub: "You Can Trust", color: "text-indigo-600", bg: "bg-indigo-50" },
            { icon: Zap, title: "Fast Delivery", sub: "in 10 Minutes", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: PackageCheck, title: "Secure Packaging", sub: "& Safe Delivery", color: "text-pink-600", bg: "bg-pink-50" }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-slate-100 shadow-sm">
               <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                 <item.icon className={cn("h-6 w-6", item.color)} />
               </div>
               <div className="min-w-0">
                 <p className="text-[11px] font-black text-slate-900 leading-none truncate">{item.title}</p>
                 <p className="text-[9px] font-bold text-slate-400 mt-1 truncate">{item.sub}</p>
               </div>
            </div>
          ))}
        </div>

        {/* 🔹 PRODUCT DETAILS */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm space-y-8">
           <div className="space-y-4">
             <h3 className="text-lg font-black text-slate-900">Product Details</h3>
             <p className="text-sm font-medium text-slate-500 leading-relaxed">
               {product.description || "Aashirvaad Select Basmati Rice is the finest quality basmati rice known for its exquisite aroma, long grains and rich taste. Perfect for Biryani, Pulao and everyday meals."}
             </p>
             <ul className="space-y-2">
               {[
                 "Extra long grain",
                 "Aromatic & Flavourful",
                 "Perfect for Biryani, Pulao & Everyday Meals",
                 "Naturally Aged for Superior Taste"
               ].map((text, i) => (
                 <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-800">
                    <CheckCircle2 className="h-4 w-4 text-[#5E3192]" />
                    {text}
                 </li>
               ))}
             </ul>
           </div>

           {/* Table Specs */}
           <div className="bg-[#FAF9FF] rounded-[2rem] p-6 space-y-4 border border-[#5E3192]/5">
              <div className="space-y-4">
                {[
                  { label: "Brand", value: "Aashirvaad" },
                  { label: "Type", value: "Basmati Rice" },
                  { label: "Weight", value: "1 kg" },
                  { label: "Speciality", value: "Aromatic" },
                  { label: "Shelf Life", value: "12 Months" }
                ].map((spec, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-400">{spec.label}</span>
                    <span className="font-bold text-slate-900">{spec.value}</span>
                  </div>
                ))}
              </div>
              <button className="w-full flex items-center justify-center gap-2 text-[#5E3192] text-sm font-black uppercase tracking-widest pt-4 border-t border-[#5E3192]/10 mt-4">
                View More <ChevronRight className="h-4 w-4 rotate-90" />
              </button>
           </div>
        </div>

        {/* 🔹 RECOMMENDATIONS */}
        {recommended.length > 0 && (
          <div className="space-y-6 pt-10 px-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">You may also like</h3>
              <button className="text-[#C49B3B] text-sm font-black flex items-center gap-1">See All <ChevronRight className="h-4 w-4" /></button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
              {recommended.map(item => (
                <div key={item.id} className="min-w-[170px] max-w-[170px]">
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🔹 STICKY FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
               <span className="text-2xl font-black text-slate-900 leading-none">₹{product.price}</span>
               <span className="text-sm font-bold text-slate-300 line-through">₹{oldPrice}</span>
            </div>
            <p className="text-xs font-black text-emerald-600 mt-1">You save ₹{savings}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center bg-[#F8F9FB] rounded-2xl p-1 border border-slate-100 h-14">
              <button 
                onClick={() => removeFromCart(product.id)}
                className="h-12 w-12 flex items-center justify-center text-slate-400 active:scale-90 transition-all font-black text-xl"
              >
                −
              </button>
              <span className="w-8 text-center font-black text-lg text-slate-900">{itemQty || 1}</span>
              <button 
                onClick={() => addToCart(product)}
                className="h-12 w-12 flex items-center justify-center text-[#5E3192] active:scale-90 transition-all font-black text-xl"
              >
                +
              </button>
            </div>

            <button 
              onClick={() => {
                addToCart(product);
                toast.success('Added to Cart');
              }}
              className="flex-grow min-w-[160px] h-14 bg-[#5E3192] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-[#5E3192]/20 active:scale-95 transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}


