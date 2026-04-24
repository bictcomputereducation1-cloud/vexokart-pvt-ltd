import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Location */}
        <div className="flex items-center gap-6 overflow-hidden">
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-black italic tracking-tighter text-primary">VEXOKART</span>
          </Link>
          
          <div className="hidden sm:flex flex-col cursor-pointer hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-slate-900 line-clamp-1 uppercase tracking-tight">Delivery in 10-15 mins</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin className="h-3 w-3" />
              <span className="text-[10px] font-bold line-clamp-1 uppercase tracking-tighter">H-12, Sector 63, Noida</span>
            </div>
          </div>
        </div>

        {/* Middle: Search bar */}
        <div className="hidden md:flex flex-grow max-w-lg">
          <div 
            onClick={() => navigate('/search')}
            className="flex items-center gap-3 w-full h-11 px-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors group"
          >
            <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="text-sm font-bold italic tracking-tight">Search "milk, butter, bread"...</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden md:flex items-center">
            {user ? (
              <Link to="/profile">
                <button className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100">
                  <User className="h-5 w-5 text-slate-600" />
                </button>
              </Link>
            ) : (
              <Link to="/login">
                <button className="text-sm font-black uppercase tracking-widest text-slate-800 hover:text-primary transition-colors px-4">
                  Login
                </button>
              </Link>
            )}
          </div>

          <Link to="/cart" className="flex items-center">
            <button className="bg-primary hover:bg-primary/95 text-black font-black h-11 px-5 rounded-xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/10 border-b-2 border-primary/20">
              <ShoppingCart className="h-4 w-4" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] uppercase tracking-widest opacity-60">Cart</span>
                <span className="text-xs italic tracking-tighter">{totalItems} Items</span>
              </div>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
