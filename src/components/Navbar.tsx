import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  Search, 
  ChevronDown, 
  MapPin, 
  Bell, 
  Mic, 
  ArrowLeft,
  Menu
} from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { useDeliveryLocation } from '../LocationContext';
import { cn } from '../lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const { pincode, city, address, isServiceable, setIsModalOpen } = useDeliveryLocation();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/home';
  const isCategories = location.pathname === '/categories';
  const isProductOrCategoryDetail = location.pathname.startsWith('/product/') || location.pathname.startsWith('/category/');

  if (isHome) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* 🔹 Menu */}
            <button 
              onClick={onMenuClick}
              className="h-11 w-11 flex items-center justify-center bg-slate-50 rounded-xl active:scale-90 transition-all border border-slate-100"
            >
              <Menu className="h-6 w-6 text-slate-800" />
            </button>

            {/* 🔹 Location Selector */}
            <div 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-2 cursor-pointer flex-grow min-w-0 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-center text-[#C49B3B]">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5">Deliver to</span>
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-black text-slate-900 truncate tracking-tight">
                    {address || 'Set Location...'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* 🔹 Icons (Notif & Cart) */}
            <div className="flex items-center gap-2">
              <button className="relative h-11 w-11 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 active:scale-95 transition-all">
                <Bell className="h-5.5 w-5.5 text-slate-800" />
                <span className="absolute top-2 right-2 h-4 w-4 bg-orange-400 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  2
                </span>
              </button>
              <Link 
                to="/cart" 
                className="relative h-11 w-11 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 active:scale-95 transition-all"
              >
                <ShoppingCart className="h-5.5 w-5.5 text-slate-800" />
                {totalItems > 0 && (
                  <span className="absolute top-2 right-2 h-4 w-4 bg-orange-400 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-xl",
      isHome || isCategories ? "bg-white/70 border-none shadow-[0_2px_15px_rgba(0,0,0,0.02)]" : "bg-white border-b border-slate-100"
    )}>
      <div className="container mx-auto px-4 pt-4 pb-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-4">
          {/* Left: Menu & Location/Back */}
          <div className="flex items-center gap-2">
            {!isProductOrCategoryDetail && onMenuClick && (
              <button 
                onClick={onMenuClick}
                className="h-10 w-10 flex items-center justify-center text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            
            {isProductOrCategoryDetail ? (
              <button 
                onClick={() => navigate(-1)}
                className="h-10 w-10 flex items-center justify-center text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            ) : (
              <div 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-900 shadow-sm border border-white">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5">Deliver to</span>
                   <div className="flex items-center gap-1">
                     <span className="text-xs font-black text-slate-900 tracking-tight line-clamp-1 max-w-[80px]">
                       {address || 'Near HSS Sopore'}
                     </span>
                     <ChevronDown className="h-3 w-3 text-slate-900 group-hover:translate-y-0.5 transition-transform" />
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Center: Logo */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
               <div className="bg-green-600 p-1.5 rounded-xl shadow-lg shadow-green-200 rotate-[-4deg]">
                 <ShoppingCart className="h-4 w-4 text-white" />
               </div>
               <span className="text-2xl font-black tracking-tighter leading-none text-slate-900">
                Vexo<span className="text-green-600">Kart</span>
              </span>
            </div>
            <span className="text-[8px] font-black text-green-600/60 uppercase tracking-[0.2em] mt-1">
              - Cool Point -
            </span>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 flex items-center justify-center text-slate-900 hover:bg-slate-50 rounded-full transition-colors">
               <Bell className="h-5.5 w-5.5" />
            </button>
            <Link to="/cart" className="relative group active:scale-95 transition-transform">
              <div className="h-9 w-9 flex items-center justify-center text-slate-900 hover:bg-slate-50 rounded-full transition-colors">
                <ShoppingCart className="h-5.5 w-5.5" />
                {totalItems > 0 && (
                  <span className="absolute top-0 -right-0.5 bg-green-500 text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Global Search Bar */}
        <div 
          onClick={() => navigate('/search')}
          className="relative group cursor-pointer"
        >
          <div className="flex items-center gap-3 h-12 px-5 bg-white rounded-full shadow-lg shadow-slate-900/5 border border-slate-100 transition-all active:scale-[0.98]">
            <Search className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-400 font-medium tracking-tight">Search for products...</span>
            <div className="ml-auto h-9 w-9 bg-green-600 rounded-full flex items-center justify-center text-white">
              <Mic className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
