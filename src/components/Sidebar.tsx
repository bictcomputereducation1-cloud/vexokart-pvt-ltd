import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Home, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Wallet, 
  Tag, 
  Layers, 
  Crown, 
  HelpCircle, 
  Info, 
  Settings, 
  LogOut,
  ChevronRight,
  ShoppingCart,
  Truck,
  X,
  Users,
  Gift,
  Headphones
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  name: string;
  phone: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut } = useAuth();
  const { totalItems, totalPrice, deliveryFee, freeDeliveryThreshold } = useCart();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  const remainingForFree = Math.max(0, freeDeliveryThreshold - totalPrice);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserData();
    }
  }, [user, isOpen]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: addressData } = await supabase
        .from('addresses')
        .select('full_name, phone')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (addressData) {
        setUserData({
          name: addressData.full_name,
          phone: addressData.phone
        });
      } else if (profile) {
        setUserData({
          name: profile.name || '',
          phone: user?.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching sidebar user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (path: string) => {
    navigate(path);
    onClose();
  };

  const menuItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: ShoppingBag, label: 'My Orders', path: '/orders' },
    { icon: ShoppingCart, label: 'My Cart', path: '/cart', badge: totalItems > 0 ? totalItems : null },
    { icon: Heart, label: 'My Wishlist', path: '/wishlist' },
    { icon: MapPin, label: 'My Addresses', path: '/profile' },
    { icon: Wallet, label: 'My Wallet', path: '/wallet' },
    { icon: Tag, label: 'Offers & Discounts', path: '/coupons' },
    { icon: Layers, label: 'Categories', path: '/categories' },
    { icon: Crown, label: 'VexoKart Premium', path: '/premium', isNew: true },
    { icon: Gift, label: 'Refer & Earn', path: '/refer' },
    { icon: Headphones, label: 'Help & Support', path: '/support' },
    { icon: Info, label: 'About Us', path: '/about' },
  ];


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />

          {/* Sidebar Drawer Container */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
            className="relative w-[85%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col overflow-hidden rounded-r-3xl"
          >
            {/* 1. Header Section (Green Gradient + Brand) */}
            <div className="relative pt-10 pb-8 px-6 bg-gradient-to-br from-[#E2F5E9] via-[#F8FFF9] to-white overflow-hidden">
               {/* Background image effect (simulating the basket/veg in image) */}
               <div className="absolute top-10 right-0 w-32 h-32 opacity-20 pointer-events-none">
                 <img 
                   src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=200" 
                   alt="Veg" 
                   className="w-full h-full object-contain"
                 />
               </div>

               {/* Logo Area */}
               <div className="flex flex-col mb-8">
                 <div className="flex items-center gap-1.5">
                   <div className="bg-green-600 p-1.5 rounded-lg">
                      <ShoppingCart className="h-4 w-4 text-white" />
                   </div>
                   <h2 className="text-2xl font-black tracking-tighter text-[#0F3D1F]">
                     Vexo<span className="text-green-600">Kart</span>
                   </h2>
                 </div>
                 <div className="flex items-center gap-1.5 mt-1">
                   <span className="text-[10px] font-black text-green-600/60 uppercase tracking-widest flex items-center gap-1">
                     <span className="h-0.5 w-3 bg-green-200" /> Cool Point <span className="h-0.5 w-3 bg-green-200" />
                   </span>
                 </div>
               </div>

               {/* User Profile Info */}
               <div className="flex items-center gap-4 relative z-10">
                 <div className="h-16 w-16 rounded-full bg-white shadow-xl shadow-green-900/10 border-4 border-white flex items-center justify-center overflow-hidden">
                   <img 
                     src={user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` : "https://api.dicebear.com/7.x/avataaars/svg?seed=guest"} 
                     alt="Profile"
                     className="h-full w-full object-cover"
                   />
                 </div>

                 <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-slate-900 leading-none">
                      {userData?.name || (user ? profile?.name || user.email?.split('@')[0] : 'Guest User')}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500">
                      {userData?.phone || (user ? user.email : '+91 6005 123 456')}
                    </p>
                    <div className="inline-flex items-center gap-1 bg-[#E8F5E9] text-[9px] font-black uppercase text-green-700 px-3 py-1 rounded-full mt-1.5">
                      <Crown className="h-2.5 w-2.5" />
                      Premium Member
                    </div>
                 </div>
               </div>
            </div>

            {/* 2. Menu Items Section */}
            <div className="flex-grow overflow-y-auto custom-scrollbar px-2 py-4">
               <div className="space-y-0.5">
                 {menuItems.map((item, idx) => {
                   const isActive = item.path === '/home'; // Mocking Home as active like in image
                   return (
                     <button
                       key={idx}
                       onClick={() => handleLinkClick(item.path)}
                       className={cn(
                         "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group",
                         isActive ? "bg-[#F1F9F4] text-green-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
                       )}
                     >
                       <div className="flex items-center gap-4">
                         <div className={cn(
                           "h-5 w-5 flex items-center justify-center transition-colors",
                           isActive ? "text-green-700" : "text-slate-500 group-hover:text-green-600"
                         )}>
                           <item.icon className="h-5 w-5" />
                         </div>
                         <span className="text-[13px] font-bold tracking-tight">
                           {item.label}
                         </span>
                         {item.isNew && (
                           <span className="bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ml-1">
                             New
                           </span>
                         )}
                       </div>
                       <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="bg-green-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-slate-300 transition-all opacity-60" />
                       </div>
                     </button>
                   );
                 })}
               </div>

               {/* 3. Promo Card (Free Delivery) */}
               <div className="mt-6 px-2">
                 <div className="bg-[#F0F5F2] rounded-[2rem] p-4 flex items-center gap-4 relative group cursor-pointer border border-green-50 shadow-sm" onClick={() => handleLinkClick('/cart')}>
                   <div className="h-16 w-16 flex-shrink-0 relative">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" 
                        alt="Scooter"
                        className="w-full h-full object-contain"
                      />
                   </div>
                   <div className="flex-grow">
                      <h4 className="text-sm font-black text-green-800 leading-tight">Free Delivery</h4>
                      <p className="text-[10px] font-bold text-slate-500 max-w-[140px] leading-tight mt-1">
                        {deliveryFee === 0 
                          ? <>Yay! You have unlocked <span className="uppercase text-green-700 font-black italic">FREE</span> delivery</>
                          : <>Add items worth <span className="text-slate-900 font-black">₹{remainingForFree}</span> for <span className="uppercase text-green-700 font-black italic">FREE</span> delivery</>
                        }
                      </p>
                   </div>
                   <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                   </div>
                 </div>
               </div>
            </div>

            {/* 4. Bottom Footer Section */}
            <div className="p-4 bg-white border-t border-slate-50 space-y-1">
               <button 
                 onClick={() => handleLinkClick('/profile')}
                 className="w-full flex items-center justify-between p-3.5 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all group"
               >
                 <div className="flex items-center gap-4">
                   <Settings className="h-5 w-5 text-slate-500" />
                   <span className="text-[13px] font-bold tracking-tight">Settings</span>
                 </div>
                 <ChevronRight className="h-4 w-4 text-slate-300 opacity-60" />
               </button>
               
               <button 
                 onClick={signOut}
                 className="w-full flex items-center justify-between p-3.5 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all group"
               >
                 <div className="flex items-center gap-4">
                   <LogOut className="h-5 w-5 text-slate-500" />
                   <span className="text-[13px] font-bold tracking-tight">Logout</span>
                 </div>
                 <ChevronRight className="h-4 w-4 text-slate-300 opacity-60" />
               </button>

               <div className="pt-4 pb-2 text-center">
                 <p className="text-[10px] font-bold text-slate-400/60 uppercase tracking-widest">
                   App Version 1.0.0
                 </p>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
