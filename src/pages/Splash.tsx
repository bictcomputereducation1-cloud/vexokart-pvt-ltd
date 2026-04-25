import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Apple,
  Milk,
  Leaf,
  Coffee
} from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only start timer once auth is determined or after a short delay
    const timer = setTimeout(() => {
      if (!authLoading) {
        if (user) {
          navigate('/home', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, authLoading, navigate]);

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* 🔹 FLOATING BACKGROUND ITEMS */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <motion.div variants={floatingVariants} animate="animate" className="absolute top-20 left-10 text-emerald-600"><Apple className="h-12 w-12" /></motion.div>
        <motion.div variants={floatingVariants} animate="animate" style={{ animationDelay: '1s' }} className="absolute top-40 right-20 text-emerald-600"><Milk className="h-10 w-10" /></motion.div>
        <motion.div variants={floatingVariants} animate="animate" style={{ animationDelay: '0.5s' }} className="absolute bottom-60 left-24 text-emerald-600"><Leaf className="h-8 w-8" /></motion.div>
        <motion.div variants={floatingVariants} animate="animate" style={{ animationDelay: '1.5s' }} className="absolute top-1/2 right-12 text-emerald-600"><Coffee className="h-10 w-10" /></motion.div>
      </div>

      {/* 🔹 CENTER LOGO SECTION */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="bg-emerald-50 p-8 rounded-[3rem] shadow-2xl shadow-emerald-100 border border-emerald-100 relative">
          <ShoppingBag className="h-20 w-20 text-emerald-600 drop-shadow-xl" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 h-6 w-6 bg-emerald-500 rounded-full border-4 border-white"
          />
        </div>
        
        <div className="text-center">
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
            VEXO<span className="text-emerald-500">KART</span>
          </h1>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 mt-6">
            Daily Needs, <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-8">Delivered!</span>
          </p>
        </div>
      </motion.div>

      {/* 🔹 BOTTOM GROCERY VISUAL */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute bottom-20 w-full max-w-xs px-10"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-100/50 blur-3xl rounded-full translate-y-10" />
          <img 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
            alt="Fresh Groceries" 
            className="w-full h-auto object-contain rounded-[2rem] drop-shadow-2xl grayscale-[0.2] contrast-125"
          />
        </div>
      </motion.div>

      {/* Loading Indicator */}
      <div className="absolute bottom-10 flex gap-2">
         {[0, 1, 2].map(i => (
           <motion.div 
             key={i}
             animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
             transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
             className="h-1.5 w-1.5 bg-emerald-500 rounded-full"
           />
         ))}
      </div>
    </motion.div>
  );
}
