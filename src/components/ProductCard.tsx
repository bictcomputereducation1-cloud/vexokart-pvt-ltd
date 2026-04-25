import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Clock, MapPinOff } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion } from 'motion/react';
import { useDeliveryLocation } from '../LocationContext';
import { useAuth } from '../AuthContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isServiceable, pincode, setIsModalOpen } = useDeliveryLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  return (
    <motion.div
      whileHover={user ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden blinkit-shadow flex flex-col h-full group transition-all duration-500"
    >
      <Link 
        to={user ? `/product/${product.id}` : '#'} 
        onClick={(e) => !user && handleAddClick(e)}
        className={`block relative aspect-square overflow-hidden bg-white px-2 pt-2 ${!user ? 'cursor-default' : ''}`}
      >
        <img
          src={product.image_url || `https://picsum.photos/seed/${product.name}/400/400`}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 p-2 mix-blend-multiply"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <div className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
            Fresh
          </div>
        </div>

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center p-4 text-center">
            <span className="text-red-600 font-black text-[10px] uppercase tracking-widest border border-red-200 px-2 py-1 rounded-lg bg-white shadow-xl">Out of Stock</span>
          </div>
        )}

        {pincode && !isServiceable && (
          <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[1px] flex items-center justify-center p-3">
            <div className="bg-white/90 border border-slate-200 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1.5 overflow-hidden">
              <MapPinOff className="h-3 w-3 text-slate-400" />
              <span className="text-slate-400 font-bold text-[8px] uppercase tracking-wider whitespace-nowrap">Unavailable</span>
            </div>
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block flex-grow">
          <div className="flex items-center gap-1 mb-1">
             <Clock className="h-2.5 w-2.5 text-primary" />
             <span className="text-[9px] font-black tracking-tighter text-slate-400 uppercase">
               {isServiceable ? '14 MINS' : (pincode ? 'Unavailable' : 'Set Location')}
             </span>
          </div>
          <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight min-h-[2rem] mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mb-2">500 g</p>
        </Link>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 line-through leading-none font-bold">₹{Math.round(product.price * 1.2)}</span>
            <span className="text-sm font-black text-slate-900 tracking-tight leading-none">₹{product.price}</span>
          </div>
          
          <button
            onClick={handleAddClick}
            disabled={product.stock <= 0 || (!!pincode && !isServiceable)}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
