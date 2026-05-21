import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ArrowLeft,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface VendorLayoutProps {
  children: React.ReactNode;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [vendorDetails, setVendorDetails] = useState<any>(null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  useEffect(() => {
    if (profile?.id) {
      supabase
        .from('vendors')
        .select('*')
        .eq('user_id', profile.id)
        .single()
        .then(({ data }) => setVendorDetails(data));
    }
  }, [profile]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/vendor' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <div className="mb-6 px-1">
            <h2 className="text-lg font-semibold text-slate-900">{vendorDetails?.store_name || 'Vendor Portal'}</h2>
            <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
          </div>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="mt-auto p-6 border-t">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50/50 p-4 md:p-10 flex flex-col h-screen md:h-auto overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <Link to="/home" className="p-2 bg-slate-50 rounded-lg text-slate-500">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="font-bold text-slate-800 tracking-tight">{vendorDetails?.store_name || 'Vendor'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="max-w-6xl mx-auto w-full pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};
