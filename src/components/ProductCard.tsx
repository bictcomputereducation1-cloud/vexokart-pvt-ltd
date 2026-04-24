import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden blinkit-shadow flex flex-col h-full group"
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-white px-4 pt-4">
        <img
          src={product.image_url || `https://picsum.photos/seed/${product.name}/400/400`}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">
            Fresh
          </div>
          <div className="bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
            <Clock className="h-2 w-2" /> 10m
          </div>
        </div>

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-4">
            <span className="text-red-600 font-black text-xs uppercase tracking-widest border-2 border-red-600 px-3 py-1 rounded-lg bg-white shadow-xl">Out of Stock</span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block flex-grow">
          <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight min-h-[2.5rem] mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter mb-3">500 g</p>
        </Link>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 line-through leading-none font-bold">₹{Math.round(product.price * 1.2)}</span>
            <span className="text-base font-black text-slate-900 tracking-tight leading-none">₹{product.price}</span>
          </div>
          
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0}
            className="h-9 px-6 rounded-xl bg-primary hover:bg-primary/90 text-black font-black text-xs uppercase tracking-widest transition-all active:scale-90 disabled:bg-slate-100 disabled:text-slate-300 disabled:scale-100 shadow-sm border-b-2 border-primary/20"
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};
