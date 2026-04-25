import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { useDeliveryLocation } from '../LocationContext';

export const Navbar: React.FC = () => {
  const { totalItems } = useCart();
  const { user, profile, isAdmin } = useAuth();
  const { pincode, city, isServiceable, setIsModalOpen } = useDeliveryLocation();
  const navigate = useNavigate();

  const handleLocationClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 pb-3">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Location Focus */}
        <div 
          onClick={handleLocationClick}
          className="flex items-center gap-3 cursor-pointer group bg-slate-50 hover:bg-slate-100 transition-all px-4 py-2 rounded-2xl border border-slate-100"
        >
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-all">
            <MapPin className={`h-5 w-5 ${!user ? 'text-slate-400' : 'text-black'}`} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-900 leading-none uppercase tracking-tighter italic">
                {!user ? 'Login required' : (isServiceable ? '14 minutes' : 'Set Location')}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 line-clamp-1 max-w-[120px] uppercase tracking-widest mt-0.5">
              {!user ? 'Login to set location' : (pincode ? `${city || 'Sector'}, ${pincode}` : 'Select Area')}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {isAdmin && (
             <Link to="/admin">
               <div className="h-10 px-4 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all">
                 Admin
               </div>
             </Link>
          )}
          {user ? (
            <Link to="/account">
              <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                <User className="h-5 w-5 text-slate-600" />
              </div>
            </Link>
          ) : (
            <button 
              onClick={() => {
                console.log('Login button clicked');
                navigate('/login');
              }}
              className="text-xs font-black uppercase tracking-widest text-slate-800 px-3 h-10 hover:text-primary transition-colors cursor-pointer relative z-[60]"
            >
              Login
            </button>
          )}
          
          <Link to="/cart">
            <div className="relative bg-emerald-600 text-white h-11 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-100 border-b-2 border-emerald-700 active:scale-95 transition-all">
              <ShoppingCart className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black italic leading-none">{totalItems} Items</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Global Search Bar (Full Width) */}
      <div className="container mx-auto px-4 mt-1">
        <div 
          onClick={() => navigate('/search')}
          className="flex items-center gap-3 w-full h-11 px-4 bg-slate-100/80 rounded-2xl border border-slate-200/50 text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors group"
        >
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <span className="text-xs font-medium">Search for "atta", "milk", "bread"...</span>
        </div>
      </div>
    </nav>
  );
};
