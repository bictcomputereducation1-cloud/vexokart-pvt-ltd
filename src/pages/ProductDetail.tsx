import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion } from 'motion/react';
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
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeliveryLocation } from '../LocationContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('1kg');
  const { items, addToCart, totalItems } = useCart();
  const { pincode, city, setIsModalOpen } = useDeliveryLocation();
  const navigate = useNavigate();

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

  const discountPercent = 12; // Mocked for design
  const oldPrice = Math.round(product.price * (1 + discountPercent/100));
  const savings = oldPrice - product.price;

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/checkout');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-48">
      {/* 🔹 STICKY HEADER */}
      <div className="sticky top-0 z-[60] bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <span className="text-lg font-black italic tracking-tighter text-emerald-600">
          VEXO<span className="text-slate-900">KART</span>
        </span>

        <div className="flex items-center gap-1">
          <button className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
            <Heart className="h-5 w-5" />
          </button>
          <button onClick={() => navigate('/cart')} className="p-2 text-slate-700 relative hover:bg-slate-50 rounded-full transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 bg-emerald-600 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 🔹 PRODUCT IMAGE SECTION */}
        <div className="bg-white px-4 py-8 relative flex flex-col items-center">
          <div className="absolute top-4 left-4 z-10 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-emerald-100 uppercase tracking-widest">
            {discountPercent}% OFF
          </div>
          <button className="absolute top-4 right-4 z-10 bg-white p-2.5 rounded-full border border-slate-100 shadow-sm text-slate-400">
            <Share2 className="h-4 w-4" />
          </button>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm aspect-square bg-slate-50 rounded-[3rem] p-8 flex items-center justify-center border border-slate-100"
          >
            <img 
              src={product.image_url} 
              alt={product.name}
              className="max-w-full max-h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          {/* Slider Dots */}
          <div className="flex gap-1.5 mt-6">
            <div className="w-4 h-1.5 bg-emerald-600 rounded-full" />
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
          </div>
        </div>

        {/* 🔹 PRODUCT INFO */}
        <div className="bg-white px-4 py-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">
                <Star className="h-3.5 w-3.5 fill-current" /> 4.6 (12.4K)
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                10K+ Bought this month
              </span>
            </div>
          </div>

          <div className="flex items-end gap-3 pt-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">₹{product.price}</span>
                <span className="text-sm text-slate-400 line-through font-bold leading-none">₹{oldPrice}</span>
                <span className="text-sm text-emerald-600 font-black mb-0.5">({discountPercent}% OFF)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest leading-none">Inclusive of all taxes</p>
            </div>
          </div>

          {/* 🔹 SAVINGS BOX */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
            <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">
              You save <span className="text-slate-900">₹{savings}</span> on this product
            </p>
          </div>

          {/* 🔹 SIZE SELECTOR */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Select Weight</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                    selectedSize === size 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-100 bg-white text-slate-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 🔹 PRODUCT DETAILS LIST */}
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Product Details</h3>
            <ul className="space-y-3">
              {[
                "Source from 100% natural fields",
                "Pure organic process, No preservatives",
                "Packed with high nutritional value",
                "Soft and fresh texture in every bite"
              ].map((text, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-500 leading-tight">{text}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs font-bold text-slate-400 leading-relaxed pt-2">
              {product.description || "This premium quality product is carefully selected to offer the best taste and nutrition. Our rigorous quality standards ensure that you receive only the freshest items at your doorstep."}
            </p>
          </div>

          {/* 🔹 DELIVERY SECTION */}
          <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 border border-slate-100 shadow-inner">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-xl shadow-sm">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Deliver to</p>
                      <p className="text-xs font-black text-slate-900 tracking-tight">{pincode ? `${city}, ${pincode}` : 'Set Location'}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-white text-emerald-600 border border-emerald-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                >
                  Change
                </button>
             </div>
             
             <div className="flex items-center gap-3 px-1">
                <Clock className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-bold text-slate-500">Delivery in <span className="text-slate-900 font-black">10-14 mins</span> • FREE</p>
             </div>
          </div>
        </div>
      </div>

      {/* 🔹 STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-6 z-[70] shadow-[0_-15px_50px_rgba(0,0,0,0.12)]">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => addToCart(product)}
            className="flex-1 h-14 bg-white border-2 border-emerald-600 text-emerald-600 rounded-full font-black text-[12px] uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all shadow-lg shadow-emerald-50"
          >
            Add to Cart
          </button>
          <button 
            onClick={handleBuyNow}
            className="flex-[1.5] h-14 bg-emerald-600 text-white rounded-full font-black text-[12px] uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-100"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}


