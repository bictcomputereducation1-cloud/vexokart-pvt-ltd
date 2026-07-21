import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid, ShoppingBag, User, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useCart } from '../CartContext';

export const MobileNav: React.FC = () => {
  const { totalItems } = useCart();
  
  const navItems = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/categories", icon: LayoutGrid, label: "Categories" },
    { to: "/cart", icon: ShoppingBag, label: "Cart", isCenter: true },
    { to: "/orders", icon: Grid, label: "Orders" },
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 pointer-events-none">
      <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-[2.25rem] border border-slate-100/50 shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-center h-20 pointer-events-auto relative px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-grow flex-1 h-full transition-all duration-300 relative z-10",
              isActive ? "text-[#16A34A]" : "text-slate-400"
            )}
          >
            {({ isActive }) => (
              <motion.div 
                className="flex flex-col items-center justify-center h-full w-full relative"
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {/* Background highlighters for active tabs */}
                {isActive && !item.isCenter && (
                  <motion.div
                    layoutId="bubbleIndicator"
                    className="absolute inset-x-2.5 inset-y-2.5 bg-emerald-50 rounded-2xl -z-10 border border-emerald-500/10"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}

                {item.isCenter ? (
                  <div className="relative -top-6">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 border-white relative",
                        isActive 
                          ? "bg-emerald-600 shadow-emerald-500/30" 
                          : "bg-slate-900 shadow-slate-950/20"
                      )}
                    >
                      <item.icon className="h-5 w-5 text-white stroke-[2.5px]" />
                      {totalItems > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#C49B3B] text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                          {totalItems}
                        </span>
                      )}
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={isActive ? { scale: 1.12, y: -2 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <item.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px] text-emerald-600" : "stroke-[2px] text-slate-400")} />
                    </motion.div>
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase tracking-widest",
                      isActive ? "text-emerald-700 font-black scale-95" : "text-slate-400 font-bold"
                    )}>
                      {item.label}
                    </span>
                  </div>
                )}

                {isActive && !item.isCenter && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-1 h-1 w-2.5 bg-[#C49B3B] rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
