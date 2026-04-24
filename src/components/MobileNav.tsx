import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { cn } from '../lib/utils';

export const MobileNav: React.FC = () => {
  return (
    <div className="md:hidden fixed bottom-14 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <nav className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-2xl flex items-center justify-around h-16 pointer-events-auto overflow-hidden">
        <NavLink 
          to="/" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
            isActive ? "text-primary scale-110" : "text-slate-400"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-bold">Home</span>
        </NavLink>

        <NavLink 
          to="/categories" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
            isActive ? "text-primary scale-110" : "text-slate-400"
          )}
        >
          <Grid className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-bold">Categories</span>
        </NavLink>

        <NavLink 
          to="/search" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
            isActive ? "text-primary scale-110" : "text-slate-400"
          )}
        >
          <div className="bg-slate-100 p-2.5 rounded-full -mt-2 shadow-lg border border-white">
            <Search className="h-5 w-5 text-slate-900" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Search</span>
        </NavLink>

        <NavLink 
          to="/orders" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
            isActive ? "text-primary scale-110" : "text-slate-400"
          )}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-bold">Orders</span>
        </NavLink>

        <NavLink 
          to="/profile" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
            isActive ? "text-primary scale-110" : "text-slate-400"
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-bold">Account</span>
        </NavLink>
      </nav>
    </div>
  );
};
