import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Heart, Star, MapPinOff, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion } from 'motion/react';
import { useDeliveryLocation } from '../LocationContext';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = React.memo<ProductCardProps>(({ product }) => {
  const { addToCart, items, updateQuantity, getItemQuantity } = useCart();
  const { isServiceable, pincode, setIsModalOpen } = useDeliveryLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock data for rating as it's not in the DB
  const rating = (4.5 + Math.random() * 0.4).toFixed(1);
  const reviews = Math.floor(Math.random() * 5000) + 1000;
  const reviewsFormatted = reviews >= 1000 ? `${(reviews / 1000).toFixed(1)}K` : reviews;

  const stock_units = typeof product.stock_units === 'number' ? product.stock_units : (product.stock !== undefined ? product.stock : 0);
  const selling_price = typeof product.selling_price === 'number' ? product.selling_price : product.price;
  const mrp = typeof product.mrp === 'number' ? product.mrp : product.original_price;

  const hasDiscount = mrp && mrp > selling_price && selling_price > 0;
  const discountPercent = hasDiscount ? Math.round(((mrp - selling_price) / mrp) * 100) : 0;
  const isOutOfStock = stock_units <= 0;
  const isPriceUnavailable = !selling_price || selling_price <= 0;

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock || isPriceUnavailable) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!pincode) {
      setIsModalOpen(true);
      return;
    }
    
    if (isServiceable) {
      addToCart(product);
    }
  };

  const currentQty = getItemQuantity(product.id);
  const isInCart = currentQty > 0;

  return (
    <motion.div
      whileHover={user && !isOutOfStock ? { y: -8, scale: 1.015, boxShadow: "0 20px 40px rgba(196,155,59,0.08)" } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "bg-white rounded-[1.75rem] border border-slate-100/80 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-col h-full group transition-all duration-300 relative", 
        isOutOfStock && "opacity-60 grayscale-[0.2]"
      )}
    >
      {/* 🔹 FLOATING GLASSMORPHISM DISCOUNT BADGE */}
      {hasDiscount && !isOutOfStock && (
        <div className="absolute top-3 left-3 bg-[#C49B3B] text-white text-[9px] font-black px-2.5 py-1.5 rounded-full z-10 flex items-center gap-1 shadow-md shadow-amber-900/10 border border-white/20">
          <span>{discountPercent}%</span>
          <span className="opacity-75 font-bold">OFF</span>
        </div>
      )}

      {/* 🔹 WISHLIST BUTTON */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsFavorite(!isFavorite);
        }}
        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 flex items-center justify-center shadow-sm active:scale-90 hover:bg-white transition-all"
      >
        <Heart className={cn("h-4 w-4 transition-colors", isFavorite ? "text-red-500 fill-red-500" : "text-slate-300")} />
      </button>

      {/* 🔹 PRODUCT IMAGE */}
      <Link 
        to={user && !isOutOfStock ? `/product/${product.id}` : '#'} 
        onClick={(e) => (!user || isOutOfStock) && handleAddClick(e)}
        className={`block relative aspect-square overflow-hidden bg-white p-4 ${!user || isOutOfStock ? 'cursor-default' : ''}`}
      >
        <img
          src={product.image_url || `https://picsum.photos/seed/${product.name}/400/400`}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
          referrerPolicy="no-referrer"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center p-4 text-center pointer-events-none">
            <span className="text-slate-700 font-black text-[9px] uppercase tracking-widest border border-slate-200/60 px-2.5 py-1.5 rounded-full bg-white shadow-lg">Out of Stock</span>
          </div>
        )}

        {pincode && !isServiceable && !isOutOfStock && (
          <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[1px] flex items-center justify-center p-3 pointer-events-none">
            <div className="bg-white/90 border border-slate-200 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1.5 overflow-hidden">
              <MapPinOff className="h-3 w-3 text-slate-400" />
              <span className="text-slate-400 font-bold text-[8px] uppercase tracking-wider whitespace-nowrap">Unavailable</span>
            </div>
          </div>
        )}
      </Link>

      <div className="px-4.5 pb-4.5 flex flex-col flex-grow">
        <Link to={isOutOfStock ? '#' : `/product/${product.id}`} onClick={(e) => isOutOfStock && e.preventDefault()} className="block flex-grow space-y-1">
          <h3 className="text-sm font-extrabold text-slate-800 line-clamp-2 leading-tight min-h-[2.5rem] tracking-tight hover:text-[#16A34A] transition-colors">
            {product.name}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{product.brand || 'Original'}</p>
          
          {/* 🔹 RATING */}
          <div className="flex items-center gap-1.5 py-1">
            <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black text-amber-700">{rating}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">({reviewsFormatted})</span>
          </div>
        </Link>
        
        {/* 🔹 PRICE & ADD BUTTON */}
        <div className="mt-3 flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5 min-h-[38px] justify-end">
            {!isOutOfStock && stock_units > 0 && stock_units < 5 && (
              <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">Only few left</span>
            )}
            {isPriceUnavailable ? (
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Price unavailable</span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-800 font-sans">₹{selling_price}</span>
                {hasDiscount && (
                  <span className="text-xs text-slate-300 line-through font-bold">₹{mrp}</span>
                )}
              </div>
            )}
          </div>
          
          {isInCart ? (
            <div className="w-full h-11 rounded-2xl bg-emerald-50 border border-emerald-500/20 flex items-center justify-between p-1 shadow-sm">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, currentQty - 1);
                }}
                className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-[#16A34A] shadow-sm active:scale-90 hover:bg-emerald-100/50 transition-all border border-slate-100"
              >
                <Minus className="h-4 w-4 stroke-[2.5px]" />
              </button>
              
              <div className="flex flex-col items-center justify-center flex-grow">
                <span className="text-xs font-black text-emerald-800 leading-none">{currentQty}</span>
                <span className="text-[7px] font-black uppercase text-emerald-600 tracking-widest mt-0.5 flex items-center gap-0.5">
                  <Check className="h-2 w-2 stroke-[3px]" /> Added
                </span>
              </div>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, currentQty + 1);
                }}
                className="h-9 w-9 bg-[#16A34A] rounded-xl flex items-center justify-center text-white shadow-sm active:scale-90 hover:bg-green-700 transition-all"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              disabled={isOutOfStock || isPriceUnavailable || (!!pincode && !isServiceable)}
              className={cn(
                "w-full h-11 rounded-full flex items-center group/btn transition-all active:scale-95 overflow-hidden border border-[#C49B3B]/20",
                isOutOfStock 
                  ? "bg-slate-100 cursor-not-allowed border-none" 
                  : "bg-white shadow-sm hover:bg-[#C49B3B] hover:text-white hover:shadow-lg hover:shadow-amber-900/10 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
              )}
            >
              <div className="flex-grow flex items-center justify-center pl-4">
                <span className={cn("text-[11px] font-black uppercase tracking-widest transition-colors", isOutOfStock ? "text-slate-400" : "text-[#C49B3B] group-hover/btn:text-white")}>
                  {isOutOfStock ? 'UNAVAILABLE' : 'ADD'}
                </span>
              </div>
              {!isOutOfStock && (
                <div className="h-9 w-9 bg-amber-50 group-hover/btn:bg-white/20 rounded-full flex items-center justify-center mr-1 text-[#C49B3B] group-hover/btn:text-white transition-colors">
                  <Plus className="h-4 w-4 stroke-[3px]" />
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
