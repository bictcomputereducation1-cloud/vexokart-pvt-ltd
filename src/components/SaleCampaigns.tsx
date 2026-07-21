import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sparkles, Flame, ShoppingBag, Sun, Leaf, Gift, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CAMPAIGNS = [
  {
    id: 'mega',
    title: '⚡ Mega Sale',
    subtitle: 'Flat 50% Off On Essentials',
    tag: 'LIMITED TIME ONLY',
    bg: 'from-[#C49B3B] to-amber-900/40',
    border: 'border-[#C49B3B]/30',
    text: 'text-amber-100',
    icon: Zap,
    cta: 'Grab Offers'
  },
  {
    id: 'weekend',
    title: '🎉 Weekend Sale',
    subtitle: 'Up To 35% Savings on Fruit Baskets',
    tag: 'SAT & SUN SPECIAL',
    bg: 'from-emerald-800 to-slate-900',
    border: 'border-emerald-500/20',
    text: 'text-emerald-100',
    icon: Sparkles,
    cta: 'View Fresh Picks'
  },
  {
    id: 'flash',
    title: '🔥 Flash Sale',
    subtitle: 'Crazy Price Drops in Cold Juices',
    tag: 'ENDING IN 10 MINUTES',
    bg: 'from-rose-900 to-neutral-900',
    border: 'border-rose-500/20',
    text: 'text-rose-100',
    icon: Flame,
    cta: 'Shop Quickly'
  },
  {
    id: 'grocery',
    title: '🛒 Grocery Festival',
    subtitle: 'Extra 10% Cash Back on Grains & Atta',
    tag: 'SUPER BUDGET DEALS',
    bg: 'from-sky-900 to-indigo-950',
    border: 'border-sky-500/20',
    text: 'text-sky-100',
    icon: ShoppingBag,
    cta: 'Explore All'
  },
  {
    id: 'summer',
    title: '🥭 Summer Offers',
    subtitle: 'Juicy Alphonso Mangoes Sourced Fresh',
    tag: 'SEASON SELECTION',
    bg: 'from-amber-500/90 to-orange-700',
    border: 'border-amber-400/30',
    text: 'text-orange-50',
    icon: Sun,
    cta: 'Bite the Mango'
  },
  {
    id: 'green',
    title: '💚 Green Friday',
    subtitle: '100% Organic Pesticide-Free Greens',
    tag: '100% ORGANIC CERTIFIED',
    bg: 'from-[#16A34A] to-[#065F46]',
    border: 'border-green-400/20',
    text: 'text-green-50',
    icon: Leaf,
    cta: 'Eat Healthy'
  },
  {
    id: 'bogo',
    title: '🎁 Buy 1 Get 1',
    subtitle: 'Premium Chocolates & Dairy Desserts',
    tag: 'BOGO EXCLUSIVE',
    bg: 'from-purple-900 to-[#111827]',
    border: 'border-purple-500/20',
    text: 'text-purple-100',
    icon: Gift,
    cta: 'Claim Gift'
  }
];

export const SaleCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CAMPAIGNS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const active = CAMPAIGNS[activeIndex];

  return (
    <div className="max-w-md mx-auto w-full px-4 mb-8">
      {/* Horizontal mini scrolling indicator strip of all campaigns */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar mb-3.5 pb-1">
        {CAMPAIGNS.map((camp, idx) => {
          const CampIcon = camp.icon;
          const isSelected = idx === activeIndex;
          return (
            <button
              key={camp.id}
              onClick={() => setActiveIndex(idx)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-wider flex-shrink-0 whitespace-nowrap active:scale-95 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10'
                  : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <CampIcon className={`h-3 w-3 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
              {camp.title.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim()}
            </button>
          );
        })}
      </div>

      {/* Main Glassmorphic Campaign Slider with high quality CRED/Apple aesthetics */}
      <div className="relative aspect-[335/115] w-full rounded-[24px] overflow-hidden shadow-lg shadow-black/5 border border-white bg-slate-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className={`absolute inset-0 bg-gradient-to-tr ${active.bg} p-5 flex flex-col justify-between text-left`}
            onClick={() => navigate('/categories')}
          >
            {/* Top row */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col">
                <span className="text-[7.5px] font-black tracking-[0.25em] text-[#C49B3B] uppercase mb-1">
                  {active.tag}
                </span>
                <h4 className="text-sm font-black text-white uppercase tracking-wider leading-none">
                  {active.title}
                </h4>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-sm animate-pulse">
                <active.icon className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-end gap-4 mt-2">
              <div className="flex flex-col">
                <p className={`text-xs font-black ${active.text} tracking-tight leading-snug`}>
                  {active.subtitle}
                </p>
                <span className="text-[9px] font-medium text-white/50 uppercase tracking-widest mt-0.5">
                  Vexo Limited Edition Deals
                </span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-slate-950 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1 shadow-md hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                {active.cta} <ChevronRight className="h-3 w-3 stroke-[3px]" />
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
