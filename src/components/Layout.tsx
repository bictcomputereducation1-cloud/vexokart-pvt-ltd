import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';
import { MapPin } from 'lucide-react';
import { useLocation as useRouteLocation } from 'react-router-dom';
import { useDeliveryLocation } from '../LocationContext';
import { LocationModal } from './LocationModal';
import { cn } from '../lib/utils';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const routeLocation = useRouteLocation();
  const { isModalOpen, setIsModalOpen, isServiceable, pincode } = useDeliveryLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!isSplash && !isCheckoutPage && !isCartPage && !isOrderSuccessPage && !isOnboardingPage && !isCategories && !isProductPage && !isCategoryListing && (
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className={cn(
        "flex-grow relative",
        isAdminRoute || isOnboardingPage || isSplash ? "pb-0" : "pb-32",
        isAdminRoute ? "w-full" : "w-full"
      )}>
        <div className={cn(
          isAdminRoute || isOnboardingPage || isSplash ? "" : "max-w-screen-xl mx-auto"
        )}>
          {children}
        </div>
      </main>
      <LocationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {!isAdminRoute && !isOnboardingPage && !isSplash && (
        <>
          <footer className="hidden md:block bg-slate-50 border-t py-12 mt-auto">
            <div className="container mx-auto px-4 text-center">
              <p className="text-slate-400 font-medium text-sm">© 2026 VEXOKART. Groceries delivered in minutes.</p>
            </div>
          </footer>
          {!isProductPage && !isCheckoutPage && !isOrderSuccessPage && <MobileNav />}
        </>
      )}
      <Toaster position="top-center" richColors />
    </div>
  );
};
