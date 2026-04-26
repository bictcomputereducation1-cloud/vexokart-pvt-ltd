import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to home after 2.5 seconds as requested
      navigate('/home', { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-gradient-to-b from-[#F0FFF4] to-white z-[100] flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* 🔹 CENTER LOGO SECTION */}
      <div className="flex flex-col items-center gap-8 relative z-10">
        
        {/* Shopping Bag Icon with Scale & Bounce Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.8 
          }}
          className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-green-900/5 border border-green-50 relative"
        >
          <motion.div
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <ShoppingBag className="h-24 w-24 text-green-600" strokeWidth={1.5} />
          </motion.div>
          
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-green-500/10 blur-3xl -z-10 rounded-full" />
        </motion.div>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center"
        >
          <div className="space-y-1">
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
              VEXO<span className="text-green-600">KART</span>
            </h1>
            <p className="text-sm font-black uppercase tracking-[0.4em] text-green-600/80">
              Cool Point
            </p>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xs font-bold text-slate-400 mt-8 tracking-widest uppercase"
          >
            Daily Needs, <span className="text-slate-900">Delivered Fast</span>
          </motion.p>
        </motion.div>
      </div>

      {/* 🔹 LOADING INDICATOR (Bouncing Dots) */}
      <div className="absolute bottom-16 flex gap-2.5">
         {[0, 1, 2].map(i => (
           <motion.div 
             key={i}
             animate={{ 
               y: [0, -10, 0],
               opacity: [0.4, 1, 0.4]
             }}
             transition={{ 
               duration: 0.6, 
               repeat: Infinity, 
               delay: i * 0.15,
               ease: "easeInOut"
             }}
             className="h-2 w-2 bg-green-600 rounded-full"
           />
         ))}
      </div>
    </motion.div>
  );
}
