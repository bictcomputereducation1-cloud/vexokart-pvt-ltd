import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Clock, ShieldCheck, Zap, Info, Plus, Minus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, removeFromCart } = useCart();
  const navigate = useNavigate();

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
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const cartItem = cart.find(item => item.id === product?.id);

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading item details...</p>
    </div>
  );
  if (!product) return null;

  return (
    <div className="bg-white min-h-screen pb-32">
      <div className="relative">
        {/* Back Button Overlay */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-white active:scale-95 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </button>

        {/* Product Image Section */}
        <div className="bg-white px-4 pt-12 pb-8 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm aspect-square bg-white flex items-center justify-center px-8"
          >
            <img 
              src={product.image_url || `https://picsum.photos/seed/${product.name}/800/800`} 
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        {/* Product Content */}
        <div className="px-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                <Star className="h-3 w-3 fill-current" /> 4.5
              </div>
              <div className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
                12k Reviews
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-tighter">500 g</p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tighter italic">₹{product.price}</span>
              <span className="text-lg text-slate-300 line-through font-bold">₹{Math.round(product.price * 1.25)}</span>
              <div className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">
                25% OFF
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">(inclusive of all taxes)</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
             <div className="flex items-center gap-3">
               <div className="bg-white p-2 rounded-xl shadow-sm">
                 <Clock className="h-5 w-5 text-emerald-600" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-black uppercase tracking-tight">Delivery in 10-15 mins</span>
                 <span className="text-[10px] text-slate-400 font-bold uppercase">Superfast Service</span>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="bg-white p-2 rounded-xl shadow-sm">
                 <Zap className="h-5 w-5 text-yellow-500" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-black uppercase tracking-tight">Lightning Fast Refund</span>
                 <span className="text-[10px] text-slate-400 font-bold uppercase">Within 24 Hours</span>
               </div>
             </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Why buy from us?</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 leading-tight">Authentic &<br/>Fresh</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <Info className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 leading-tight">High Quality<br/>Check</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Product Details</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              {product.description || 'This premium quality product is sourced from the best farms to ensure you get the maximum nutrients and taste. Perfect for daily consumption and healthy lifestyle.'}
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Add to Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:static sm:bg-transparent sm:border-none sm:shadow-none sm:p-0 sm:max-w-screen-xl sm:mx-auto">
        {cartItem ? (
          <div className="bg-primary text-black h-14 md:h-16 rounded-2xl shadow-2xl flex items-center justify-between px-6 transition-all duration-300">
            <div className="flex flex-col">
               <span className="font-black italic text-lg leading-none">₹{product.price * cartItem.quantity}</span>
               <span className="text-[10px] font-bold uppercase opacity-60">Total Amount</span>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => removeFromCart(product.id)}
                className="bg-black/10 hover:bg-black/20 p-2 rounded-xl transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="text-xl font-bold">{cartItem.quantity}</span>
              <button 
                onClick={() => addToCart(product)}
                className="bg-black/10 hover:bg-black/20 p-2 rounded-xl transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            disabled={product.stock <= 0}
            onClick={() => {
              addToCart(product);
              toast.success('Excellent choice! Added to cart.');
            }}
            className="w-full h-14 md:h-16 bg-primary hover:bg-primary/95 text-black font-black italic text-lg rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:bg-slate-100 disabled:text-slate-300 disabled:scale-100"
          >
            {product.stock > 0 ? (
              <>ADD TO CART <ChevronRight className="h-6 w-6" /></>
            ) : (
              'OUT OF STOCK'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

