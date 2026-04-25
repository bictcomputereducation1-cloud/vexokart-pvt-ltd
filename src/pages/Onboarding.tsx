import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Apple,
  Milk,
  Leaf,
  Coffee
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();

  // Floating items animation variants
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

  const featureIcons = [
    { icon: <CheckCircle2 className="h-5 w-5" />, label: "Quality Products" },
    { icon: <Truck className="h-5 w-5" />, label: "Fast Delivery" },
    { icon: <ShieldCheck className="h-5 w-5" />, label: "Secure Payments" },
  ];

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden select-none">
      {/* 🔹 FLOATING BACKGROUND ITEMS */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <motion.div variants={floatingVariants} animate="animate" className="absolute top-20 left-10 text-emerald-600"><Apple className="h-12 w-12" /></motion.div>
        <motion.div variants={floatingVariants} animate="animate" style={{ animationDelay: '1s' }} className="absolute top-40 right-20 text-emerald-600"><Milk className="h-10 w-10" /></motion.div>
        <motion.div variants={floatingVariants} animate="animate" style={{ animationDelay: '0.5s' }} className="absolute top-[60%] left-24 text-emerald-600"><Leaf className="h-8 w-8" /></motion.div>
        <motion.div variants={floatingVariants} animate="animate" style={{ animationDelay: '1.5s' }} className="absolute top-[45%] right-12 text-emerald-600"><Coffee className="h-10 w-10" /></motion.div>
        <motion.div variants={floatingVariants} animate="animate" style={{ animationDelay: '2s' }} className="absolute bottom-40 left-16 text-emerald-600"><ShoppingBag className="h-12 w-12" /></motion.div>
      </div>

      {/* 🔹 CENTER CONTENT */}
      <div className="flex-grow flex flex-col items-center justify-center px-6 pt-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 mb-8"
        >
          <div className="bg-emerald-50 p-6 rounded-[2.5rem] shadow-2xl shadow-emerald-100 border border-emerald-100">
             <ShoppingBag className="h-16 w-16 text-emerald-600 drop-shadow-lg" />
          </div>
          
          <div className="text-center">
            <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
              VEXO<span className="text-emerald-500">KART</span>
            </h1>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mt-4">
              Daily Needs, <span className="text-emerald-500">Delivered!</span>
            </p>
          </div>
        </motion.div>

        {/* 🔹 FEATURE ICONS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center gap-8 mb-12"
        >
          {featureIcons.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                 {feature.icon}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center w-16">
                {feature.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* 🔹 HERO IMAGE BAG */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 1, type: "spring" }}
          className="relative w-full max-w-sm"
        >
           {/* Mock Grocery Bag using multiple icons or stacked effect */}
           <div className="relative h-64 w-full flex items-center justify-center">
             <div className="absolute inset-x-12 bottom-0 h-40 bg-slate-200 rounded-[3rem] blur-3xl opacity-20" />
             <img 
               src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
               alt="Grocery Bag" 
               className="h-full object-contain drop-shadow-2xl rounded-[3rem]"
             />
           </div>
        </motion.div>
      </div>

      {/* 🔹 BOTTOM SECTION */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "circOut" }}
        className="bg-white rounded-t-[3.5rem] px-8 pt-10 pb-12 shadow-[0_-20px_60px_rgba(0,0,0,0.05)] border-t border-slate-50"
      >
        <div className="space-y-8 max-w-lg mx-auto">
          <div className="space-y-2 text-center px-4">
            <h2 className="text-lg font-black tracking-tight text-slate-900 leading-tight">
              One-stop shop for all <span className="text-emerald-500">daily needs</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Fresh Groceries Delivered in Minutes
            </p>
          </div>

          <button 
            onClick={() => {
              localStorage.setItem('onboarded', 'true');
              navigate('/home');
            }}
            className="w-full bg-emerald-600 text-white h-16 rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all group"
          >
            Enter VEXOKART 
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
