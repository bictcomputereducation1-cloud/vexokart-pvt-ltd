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
      whileHover={user ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
      className={cn("bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full group transition-all duration-300 relative", isOutOfStock && "opacity-60 grayscale-[0.2]")}
    >
      {/* 🔹 DISCOUNT BADGE */}
      {hasDiscount && !isOutOfStock && (
        <div className="absolute top-0 left-0 bg-[#C49B3B] text-white text-[9px] font-black px-2 py-3 rounded-br-[1.2rem] rounded-tl-[1.8rem] z-10 flex flex-col items-center">
          <span>{discountPercent}%</span>
          <span className="text-[7px]">OFF</span>
        </div>
      )}

      {/* 🔹 WISHLIST BUTTON */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsFavorite(!isFavorite);
        }}
        className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 flex items-center justify-center shadow-sm active:scale-90 transition-all"
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
            <span className="text-slate-700 font-black text-[10px] uppercase tracking-widest border border-slate-200 px-2 py-1 rounded-lg bg-white shadow-xl">Out of Stock</span>
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

      <div className="px-4 pb-4 flex flex-col flex-grow">
        <Link to={isOutOfStock ? '#' : `/product/${product.id}`} onClick={(e) => isOutOfStock && e.preventDefault()} className="block flex-grow space-y-1">
          <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-[10px] font-medium text-slate-400">{product.brand || 'Original 2.25L'}</p>
          
          {/* 🔹 RATING */}
          <div className="flex items-center gap-1 py-1">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-slate-600">{rating}</span>
            <span className="text-[11px] font-medium text-slate-400">({reviewsFormatted})</span>
          </div>
        </Link>
        
        {/* 🔹 PRICE & ADD BUTTON */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1 min-h-[40px] justify-end">
            {!isOutOfStock && stock_units > 0 && stock_units < 5 && (
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Only few left</span>
            )}
            {isPriceUnavailable ? (
              <span className="text-xs font-bold text-slate-500">Price unavailable</span>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900 leading-none">₹{selling_price}</span>
                {hasDiscount && (
                  <span className="text-[11px] text-slate-300 line-through font-bold">₹{mrp}</span>
                )}
              </div>
            )}
          </div>
          
          {isInCart ? (
            <div className="w-full h-11 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-between p-1 shadow-sm">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, currentQty - 1);
                }}
                className="h-9 w-9 bg-white rounded-xl flex items-center justify-center text-[#16A34A] shadow-sm active:scale-90 hover:bg-green-100 transition-all"
              >
                <Minus className="h-4 w-4" />
              </button>
              
              <div className="flex flex-col items-center justify-center flex-grow">
                <span className="text-xs font-black text-[#16A34A] leading-none">{currentQty}</span>
                <span className="text-[7px] font-black uppercase text-[#16A34A] tracking-wider mt-0.5 flex items-center gap-0.5">
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
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              disabled={isOutOfStock || isPriceUnavailable || (!!pincode && !isServiceable)}
              className={cn(
                "w-full h-11 rounded-2xl flex items-center group/btn transition-all active:scale-95 overflow-hidden",
                isOutOfStock 
                  ? "bg-slate-100 cursor-not-allowed" 
                  : "bg-[#C49B3B] shadow-lg shadow-amber-900/10 hover:bg-slate-900 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
              )}
            >
              <div className="flex-grow flex items-center justify-center pl-4">
                <span className={cn("text-[11px] font-black uppercase tracking-widest", isOutOfStock ? "text-slate-400" : "text-white")}>
                  {isOutOfStock ? 'UNAVAILABLE' : 'ADD'}
                </span>
              </div>
              {!isOutOfStock && (
                <div className="h-9 w-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-1 text-white">
                  <Plus className="h-5 w-5" />
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
