import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const MobileNav: React.FC = () => {
  const navItems = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/categories", icon: Grid, label: "Categories" },
    { to: "/search", icon: Search, label: "Search", isSpecial: true },
    { to: "/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/account", icon: User, label: "Account" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-around h-20 pointer-events-auto relative">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative",
              item.isSpecial ? "z-20" : "z-10",
              isActive && !item.isSpecial ? "text-emerald-600" : "text-slate-400"
            )}
          >
            {({ isActive }) => (
              <>
                {item.isSpecial ? (
                  <div className="relative -top-6">
                    <div className={cn(
                      "h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 border-4 border-white",
                      isActive 
                        ? "bg-emerald-600 shadow-emerald-200 scale-110" 
                        : "bg-slate-900 shadow-slate-200"
                    )}>
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                    >
                      <item.icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                    </motion.div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest leading-none",
                      isActive ? "opacity-100" : "opacity-60"
                    )}>
                      {item.label}
                    </span>
                  </div>
                )}
                
                {isActive && !item.isSpecial && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 h-1 w-6 bg-emerald-600 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
