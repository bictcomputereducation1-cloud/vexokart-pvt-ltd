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
      {!isSplash && !isCheckoutPage && !isCartPage && !isOrderSuccessPage && !isOnboardingPage && !isCategories && !isProductPage && !isCategoryListing && !isDeliveryRoute && !isVendorRoute && (
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
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-28 left-6 right-6 z-40 max-w-md mx-auto pointer-events-auto"
          >
            <div 
              onClick={() => navigate('/cart')}
              className="bg-[#16A34A] text-white rounded-[2rem] p-4 shadow-[0_15px_35px_rgba(22,163,74,0.35)] flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform duration-200 border border-green-500"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 h-10 w-10 rounded-xl flex items-center justify-center text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black tracking-tight uppercase text-green-100">
                    {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                  </span>
                  <span className="text-lg font-black leading-none italic">
                    ₹{totalPrice}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-full transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  View Cart
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-center" richColors />
    </div>
  );
};
