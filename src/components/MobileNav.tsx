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
      <div className="max-w-md mx-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] flex items-center h-20 pointer-events-auto relative px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative",
              isActive ? "text-green-500" : "text-slate-400"
            )}
          >
            {({ isActive }) => (
              <>
                {item.isCenter ? (
                  <div className="relative -top-8">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "h-16 w-16 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(22,163,74,0.3)] transition-all duration-300 border-[6px] border-white relative",
                        "bg-green-600"
                      )}
                    >
                      <item.icon className="h-7 w-7 text-white" />
                      {totalItems > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center border-2 border-white">
                          {totalItems}
                        </div>
                      )}
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <item.icon className={cn("h-6 w-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter",
                      isActive ? "opacity-100" : "opacity-60"
                    )}>
                      {item.label}
                    </span>
                  </div>
                )}
                
                {isActive && !item.isCenter && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-2 h-1 w-4 bg-green-500 rounded-full"
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
