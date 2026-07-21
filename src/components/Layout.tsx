import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';
import { MapPin, ShoppingBag, ArrowRight } from 'lucide-react';
import { useLocation as useRouteLocation, useNavigate } from 'react-router-dom';
import { useDeliveryLocation } from '../LocationContext';
import { useCart } from '../CartContext';
import { LocationModal } from './LocationModal';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const routeLocation = useRouteLocation();
  const { isModalOpen, setIsModalOpen, isServiceable, pincode } = useDeliveryLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { totalItems, totalPrice } = useCart();
  const isAdminRoute = routeLocation.pathname.startsWith('/admin');
  const isSplash = routeLocation.pathname === '/';
  const isHome = routeLocation.pathname === '/home';
  const isCategories = routeLocation.pathname === '/categories';
  const isProductPage = routeLocation.pathname.startsWith('/product/');
  const isCategoryListing = routeLocation.pathname.startsWith('/category/');
  const isCheckoutPage = routeLocation.pathname === '/checkout';
  const isCartPage = routeLocation.pathname === '/cart';
  const isOrderSuccessPage = routeLocation.pathname.startsWith('/order-success/');
  const isOnboardingPage = routeLocation.pathname === '/onboarding';

  const isVendorRoute = routeLocation.pathname.startsWith('/vendor');
  const isDeliveryRoute = routeLocation.pathname.startsWith('/delivery');

  const showFloatingCart = totalItems > 0 && !isCartPage && !isCheckoutPage && !isOrderSuccessPage && !isSplash && !isOnboardingPage && !isAdminRoute && !isVendorRoute && !isDeliveryRoute;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!isSplash && !isCheckoutPage && !isCartPage && !isOrderSuccessPage && !isOnboardingPage && !isCategories && !isProductPage && !isCategoryListing && !isDeliveryRoute && !isVendorRoute && !isHome && (
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className={cn(
        "flex-grow relative",
        isAdminRoute || isOnboardingPage || isSplash || isDeliveryRoute || isVendorRoute ? "pb-0" : "pb-32",
        isAdminRoute ? "w-full" : "w-full"
      )}>
        <div className={cn(
          isAdminRoute || isOnboardingPage || isSplash || isDeliveryRoute || isVendorRoute ? "" : "max-w-screen-xl mx-auto"
        )}>
          {children}
        </div>
      </main>
      <LocationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {!isAdminRoute && !isOnboardingPage && !isSplash && !isDeliveryRoute && !isVendorRoute && (
        <>
          <footer className="hidden md:block bg-slate-50 border-t py-12 mt-auto">
            <div className="container mx-auto px-4 text-center">
              <p className="text-slate-400 font-medium text-sm">© 2026 VEXOKART. Groceries delivered in minutes.</p>
            </div>
          </footer>
          {!isProductPage && !isCheckoutPage && !isOrderSuccessPage && <MobileNav />}
        </>
      )}
      
      <AnimatePresence>
        {showFloatingCart && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            className="fixed bottom-28 left-0 right-0 z-40 flex justify-center pointer-events-none"
          >
            <div 
              onClick={() => navigate('/cart')}
              className="w-[82%] max-w-[340px] bg-emerald-950/90 hover:bg-emerald-900/95 text-white backdrop-blur-xl rounded-full px-4 shadow-[0_16px_40px_rgba(22,163,74,0.22)] flex items-center justify-between cursor-pointer active:scale-[0.97] transition-all duration-300 border border-emerald-500/20 h-13 pointer-events-auto"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm select-none">🛒</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-white tracking-tight">
                    {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                  </span>
                  <span className="text-emerald-500/40">|</span>
                  <span className="font-black text-emerald-400 font-mono">
                    ₹{totalPrice}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 bg-[#C49B3B] hover:bg-[#b58e32] px-3 h-8 w-[92px] rounded-full shadow-md shadow-amber-900/10 transition-all">
                <span className="text-[9px] font-black uppercase tracking-wider text-white">
                  View Cart
                </span>
                <ArrowRight className="h-2.5 w-2.5 stroke-[3px]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-center" richColors />
    </div>
  );
};
