import React from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Toaster } from 'sonner';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className={cn(
        "flex-grow pb-24",
        isAdminRoute ? "w-full" : "w-full"
      )}>
        <div className={cn(
          isAdminRoute ? "" : "max-w-screen-xl mx-auto"
        )}>
          {children}
        </div>
      </main>
      {!isAdminRoute && (
        <>
          <footer className="hidden md:block bg-slate-50 border-t py-12 mt-auto">
            <div className="container mx-auto px-4 text-center">
              <p className="text-slate-400 font-medium text-sm">© 2026 VEXOKART. Groceries delivered in minutes.</p>
            </div>
          </footer>
          <MobileNav />
        </>
      )}
      <Toaster position="top-center" richColors />
    </div>
  );
};
