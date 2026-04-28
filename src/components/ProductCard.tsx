import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Heart, Star, MapPinOff } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion } from 'motion/react';
import { useDeliveryLocation } from '../LocationContext';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, items } = useCart();
  const { isServiceable, pincode, setIsModalOpen } = useDeliveryLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock data for rating as it's not in the DB
  const rating = (4.5 + Math.random() * 0.4).toFixed(1);
  const reviews = Math.floor(Math.random() * 5000) + 1000;
  const reviewsFormatted = reviews >= 1000 ? `${(reviews / 1000).toFixed(1)}K` : reviews;

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100) : 0;

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  const isInCart = items.some(item => item.id === product.id);

  return (
    <motion.div
      whileHover={user ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full group transition-all duration-300 relative"
    >
      {/* 🔹 DISCOUNT BADGE */}
      {hasDiscount && (
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
        to={user ? `/product/${product.id}` : '#'} 
        onClick={(e) => !user && handleAddClick(e)}
        className={`block relative aspect-square overflow-hidden bg-white p-4 ${!user ? 'cursor-default' : ''}`}
      >
        <img
          src={product.image_url || `https://picsum.photos/seed/${product.name}/400/400`}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
          referrerPolicy="no-referrer"
        />

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center p-4 text-center pointer-events-none">
            <span className="text-red-600 font-black text-[10px] uppercase tracking-widest border border-red-200 px-2 py-1 rounded-lg bg-white shadow-xl">Out of Stock</span>
          </div>
        )}

        {pincode && !isServiceable && (
          <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[1px] flex items-center justify-center p-3 pointer-events-none">
            <div className="bg-white/90 border border-slate-200 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1.5 overflow-hidden">
              <MapPinOff className="h-3 w-3 text-slate-400" />
              <span className="text-slate-400 font-bold text-[8px] uppercase tracking-wider whitespace-nowrap">Unavailable</span>
            </div>
          </div>
        )}
      </Link>

      <div className="px-4 pb-4 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block flex-grow space-y-1">
          <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight min-h-[2.5rem]">
            {product.name}
          </h3>
          <p className="text-[10px] font-medium text-slate-400">Original 2.25L</p>
          
          {/* 🔹 RATING */}
          <div className="flex items-center gap-1 py-1">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-slate-600">{rating}</span>
            <span className="text-[11px] font-medium text-slate-400">({reviewsFormatted})</span>
          </div>
        </Link>
        
        {/* 🔹 PRICE & ADD BUTTON */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900 leading-none">₹{product.price}</span>
            {hasDiscount && (
              <span className="text-[11px] text-slate-300 line-through font-bold">₹{product.original_price}</span>
            )}
          </div>
          
          <button
            onClick={handleAddClick}
            disabled={product.stock <= 0 || (!!pincode && !isServiceable)}
            className="w-full h-11 bg-[#C49B3B] rounded-2xl flex items-center shadow-lg shadow-amber-900/10 hover:bg-slate-900 group/btn transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none overflow-hidden"
          >
            <div className="flex-grow flex items-center justify-center pl-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-white">{isInCart ? 'View Cart' : 'ADD'}</span>
            </div>
            <div className="h-9 w-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-1 text-white">
              <Plus className="h-5 w-5" />
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
