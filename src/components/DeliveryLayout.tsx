import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Package, User } from 'lucide-react';

export function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const location = useLocation();

  // For this context, allow either admin or a specific delivery role if we had one.
  // We'll let profile?.role run it.
  
  if (!profile) {
     return <Navigate to="/login" replace />;
  }

  // We don't have a strict "delivery" role mapped yet, so let any logged-in user with specific flag access, 
  // or just let them access it for now (in a real app, restrict by role).
  
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex">
      {/* Delivery Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight text-primary">Delivery Hub</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your routes</p>
        </div>
        
        <nav className="px-4 pb-6 space-y-1">
          <Link
            to="/delivery/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/delivery/dashboard'
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Package className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/profile'
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User className="h-5 w-5" />
            Profile
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children ? children : <Outlet />}
        </div>
      </main>
    </div>
  );
}
