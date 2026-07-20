import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiCache } from '../lib/apiCache';
import { 
  User, 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  Layers, 
  Boxes, 
  MapPin, 
  Users, 
  CreditCard, 
  Tag, 
  Image, 
  BarChart3, 
  History, 
  Bell, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Percent,
  CheckCircle,
  HelpCircle,
  Headphones,
  Save,
  Trash2,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Map,
  Truck,
  Edit,
  Power,
  ArrowUpRight,
  Wallet,
  Clock,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface VendorLayoutProps {
  children: React.ReactNode;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Navigation & UI States
  const searchParams = new URLSearchParams(location.search);
  const activeView = searchParams.get('view') || 'dashboard';
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [vendorDetails, setVendorDetails] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [serviceArea, setServiceArea] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Form states
  const [profileForm, setProfileForm] = useState({ store_name: '', phone: '', address: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [coupons, setCoupons] = useState<any[]>([
    { id: '1', code: 'FRESH15', discount_type: 'percent', discount_value: 15, min_purchase: 199, is_active: true },
    { id: '2', code: 'SUPERGROCER', discount_type: 'flat', discount_value: 50, min_purchase: 299, is_active: true },
    { id: '3', code: 'NEIGHBOR', discount_type: 'percent', discount_value: 10, min_purchase: 99, is_active: true }
  ]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_type: 'percent', discount_value: 10, min_purchase: 150 });
  
  const [banners, setBanners] = useState<any[]>([
    { id: '1', title: 'Summer Mango Extravaganza', url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=600', status: 'Approved' },
    { id: '2', title: 'Fresh Dairy 10% Bundle', url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=600', status: 'Pending Review' }
  ]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerUrl, setNewBannerUrl] = useState('');
  
  const [settingsForm, setSettingsForm] = useState({
    min_order_value: 99,
    open_time: '07:00',
    close_time: '23:00',
    vacation_mode: false
  });

  // Wallet & Payout States
  const [wallet, setWallet] = useState<any>({
    available_balance: 0,
    pending_earnings: 0,
    total_earnings: 0,
    last_payout: 0,
    settlement_status: 'settled',
    bank_name: 'State Bank of India',
    account_number: '******9281',
    ifsc_code: 'SBIN0001234',
    holder_name: ''
  });
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [earningsLedger, setEarningsLedger] = useState<any[]>([]);
  const [loadingFinance, setLoadingFinance] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [financeTab, setFinanceTab] = useState<'payouts' | 'ledger'>('payouts');
  
  // Bank Form State
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    holder_name: ''
  });

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
    if (!profile?.id) return;
    const controller = new AbortController();

    const loadVendor = async () => {
      try {
        const data = await apiCache.fetchOnce<any>(`vendor_data_${profile.id}`, async (signal) => {
          const { data: res, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', profile.id)
            .single();
          if (error) throw error;
          return res;
        }, { signal: controller.signal });

        if (data && !controller.signal.aborted) {
          setVendorDetails(data);
          setProfileForm({
            store_name: data.store_name || '',
            phone: data.phone || '',
            address: data.address || ''
          });
          fetchStatsAndInfo(data.id, data.service_area_id, false, controller.signal);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error("Error loading vendor profile in VendorLayout:", err);
      }
    };

    loadVendor();

    return () => {
      controller.abort();
    };
  }, [profile]);

  // Fetch standard data to keep counts and subpages dynamic
  const fetchStatsAndInfo = async (vendorId: string, serviceAreaId?: string, forceRefetch = false, signal?: AbortSignal) => {
    try {
      setLoadingStats(true);
      if (!profile?.id) return;

      // Products
      const prodData = await apiCache.fetchOnce<any[]>(`vendor_products_${profile.id}`, async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('vendor_id', vendorId);
        if (error) throw error;
        return data || [];
      }, { forceRefetch, signal });
      if (prodData && !signal?.aborted) setProducts(prodData);

      // Orders
      const orderData = await apiCache.fetchOnce<any[]>(`vendor_orders_${profile.id}`, async (fetchSignal) => {
        const response = await fetch(`/api/vendor/orders?userId=${profile.id}`, {
          headers: { 'Accept': 'application/json' },
          signal: fetchSignal
        });
        if (response.ok) {
          return await response.json();
        } else {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('vendor_id', profile.id);
          if (error) throw error;
          return data || [];
        }
      }, { forceRefetch, signal });
      if (orderData && !signal?.aborted) setOrders(orderData);

      // Service Area
      if (serviceAreaId) {
        const saData = await apiCache.fetchOnce<any>(`service_area_${serviceAreaId}`, async () => {
          const { data, error } = await supabase
            .from('service_areas')
            .select('*')
            .eq('id', serviceAreaId)
            .single();
          if (error) throw error;
          return data;
        }, { forceRefetch, signal });
        if (saData && !signal?.aborted) setServiceArea(saData);
      }

      // Categories
      const catData = await apiCache.fetchOnce<any[]>('admin_categories', async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (error) throw error;
        return data || [];
      }, { forceRefetch, signal });
      if (catData && !signal?.aborted) setCategories(catData);

      // Delivery Boys
      try {
        const allBoys = await apiCache.fetchOnce<any[]>('admin_delivery_boys', async (fetchSignal) => {
          const response = await fetch('/api/admin/delivery-boys', { signal: fetchSignal });
          if (!response.ok) throw new Error('Failed to load delivery boys');
          return await response.json();
        }, { forceRefetch, signal });

        if (allBoys && !signal?.aborted) {
          if (serviceAreaId) {
            const dbBoys = allBoys.filter((boy: any) => boy.service_area_id === serviceAreaId);
            setDeliveryBoys(dbBoys.length === 0 ? allBoys : dbBoys);
          } else {
            setDeliveryBoys(allBoys);
          }
        }
      } catch (err) {}

      // Fetch financial details
      await fetchFinanceDetails(profile.id, forceRefetch, signal);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Error setting up stats in VendorLayout:", err);
    } finally {
      if (!signal?.aborted) setLoadingStats(false);
    }
  };

  const fetchFinanceDetails = async (userId: string, forceRefetch = false, signal?: AbortSignal) => {
    try {
      setLoadingFinance(true);
      const [wData, pData, lData] = await Promise.all([
        apiCache.fetchOnce<any>(`vendor_wallet_${userId}`, async (fetchSignal) => {
          const res = await fetch(`/api/vendor/wallet?userId=${userId}`, { signal: fetchSignal });
          if (!res.ok) throw new Error('Wallet fetch failed');
          return await res.json();
        }, { forceRefetch, signal }),
        apiCache.fetchOnce<any[]>(`vendor_payout_history_${userId}`, async (fetchSignal) => {
          const res = await fetch(`/api/vendor/payout-history?userId=${userId}`, { signal: fetchSignal });
          if (!res.ok) throw new Error('Payout history fetch failed');
          return await res.json();
        }, { forceRefetch, signal }),
        apiCache.fetchOnce<any[]>(`vendor_earnings_ledger_${userId}`, async (fetchSignal) => {
          const res = await fetch(`/api/vendor/earnings-ledger?userId=${userId}`, { signal: fetchSignal });
          if (!res.ok) throw new Error('Earnings ledger fetch failed');
          return await res.json();
        }, { forceRefetch, signal })
      ]);

      if (signal?.aborted) return;

      if (wData) {
        setWallet(wData);
        setBankForm({
          bank_name: wData.bank_name || '',
          account_number: wData.account_number || '',
          ifsc_code: wData.ifsc_code || '',
          holder_name: wData.holder_name || ''
        });
      }
      if (pData) {
        setPayoutHistory(pData || []);
      }
      if (lData) {
        setEarningsLedger(lData || []);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Error fetching finance details:", err);
    } finally {
      if (!signal?.aborted) setLoadingFinance(false);
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const amountNum = Number(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 100) {
      toast.error("Minimum payout is ₹100");
      return;
    }

    if (amountNum > wallet.available_balance) {
      toast.error("Withdrawal amount cannot exceed available wallet balance");
      return;
    }

    try {
      setIsSubmittingWithdrawal(true);
      const res = await fetch('/api/vendor/payout-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          amount: amountNum,
          bank_name: wallet.bank_name,
          account_number: wallet.account_number
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to request payout');

      toast.success("Withdrawal request submitted for review successfully!");
      setWithdrawAmount('');
      fetchFinanceDetails(profile.id, true);
    } catch (err: any) {
      toast.error(err.message || "Payout request failed");
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleUpdateBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.ifsc_code) {
      toast.error("Please fill in all bank details fields");
      return;
    }

    try {
      const res = await fetch('/api/vendor/wallet/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          ...bankForm
        })
      });

      if (!res.ok) throw new Error('Failed to update bank account details');
      
      toast.success("Payout bank account changed successfully!");
      setIsEditingBank(false);
      fetchFinanceDetails(profile.id, true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update bank details");
    }
  };

  const toggleStoreStatus = async () => {
    if (!vendorDetails) return;
    try {
      const nextStatus = !vendorDetails.is_active;
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: nextStatus })
        .eq('id', vendorDetails.id);
      
      if (error) throw error;
      setVendorDetails({ ...vendorDetails, is_active: nextStatus });
      apiCache.invalidate(`vendor_data_${profile.id}`);
      toast.success(`Store is now ${nextStatus ? 'ONLINE' : 'OFFLINE'}`);
    } catch (err: any) {
      toast.error(`Failed to update store status: ${err.message}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!vendorDetails) return;
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          store_name: profileForm.store_name,
          phone: profileForm.phone,
          address: profileForm.address
        })
        .eq('id', vendorDetails.id);
      
      if (error) throw error;
      setVendorDetails({ ...vendorDetails, ...profileForm });
      apiCache.invalidate(`vendor_data_${profile.id}`);
      toast.success('Seller profile updated successfully!');
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    }
  };

  const handleStockChange = (productId: string, currentStock: number, change: number) => {
    const prev = editingStock[productId] !== undefined ? editingStock[productId] : currentStock;
    const next = Math.max(0, prev + change);
    setEditingStock({ ...editingStock, [productId]: next });
  };

  const handleSaveInventory = async () => {
    try {
      let failed = false;
      for (const [id, value] of Object.entries(editingStock)) {
         const { error } = await supabase
           .from('products')
           .update({ stock: value, stock_units: value })
           .eq('id', id);
         if (error) {
           failed = true;
           console.error(error);
         }
      }
      if (failed) {
        toast.error("Failed to update some fields");
      } else {
        toast.success("Inventory stock levels updated!");
        setEditingStock({});
        if (vendorDetails) fetchStatsAndInfo(vendorDetails.id, vendorDetails.service_area_id, true);
      }
    } catch (err) {
      toast.error("Failed to save updates");
    }
  };

  const handleAddCoupon = () => {
    if (!newCoupon.code) {
      toast.error("Please enter a coupon code");
      return;
    }
    const created = {
      id: Math.random().toString(),
      code: newCoupon.code.toUpperCase(),
      discount_type: newCoupon.discount_type,
      discount_value: Number(newCoupon.discount_value),
      min_purchase: Number(newCoupon.min_purchase),
      is_active: true
    };
    setCoupons([...coupons, created]);
    setNewCoupon({ code: '', discount_type: 'percent', discount_value: 10, min_purchase: 150 });
    toast.success(`Coupon ${created.code} activated successfully!`);
  };

  const handleAddBanner = () => {
    if (!newBannerTitle || !newBannerUrl) {
      toast.error("Please enter a title and banner image URL");
      return;
    }
    setBanners([...banners, {
      id: Math.random().toString(),
      title: newBannerTitle,
      url: newBannerUrl,
      status: 'Pending Review'
    }]);
    setNewBannerTitle('');
    setNewBannerUrl('');
    toast.success("Banner campaign request submitted for review!");
  };

  // Badge Counters
  const newOrdersCount = orders.filter(o => o.status === 'placed').length;
  const lowStockCount = products.filter(p => !p.stock || p.stock < 5).length;
  const pendingApprovalsCount = products.filter(p => p.verification_status === 'pending').length;

  // View Navigation mapping
  const menuSections = [
    {
      title: "Management",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/vendor?view=dashboard' },
        { id: 'orders', label: 'Orders', icon: ShoppingBag, path: '/vendor?view=orders&tab=orders', badge: newOrdersCount > 0 ? newOrdersCount : null, badgeColor: 'bg-yellow-400 text-emerald-950 font-bold' },
        { id: 'catalog', label: 'Catalog & Pricing', icon: Tags, path: '/vendor?view=catalog&tab=products' },
        { id: 'categories', label: 'Categories', icon: Layers, path: '/vendor?view=categories' },
        { id: 'inventory', label: 'Inventory', icon: Boxes, path: '/vendor?view=inventory', badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-amber-500 text-white' },
      ]
    },
    {
      title: "Operations",
      items: [
        { id: 'service-areas', label: 'Service Areas', icon: Map, path: '/vendor?view=service-areas' },
        { id: 'delivery-boys', label: 'Delivery Boys', icon: Truck, path: '/vendor?view=delivery-boys' },
        { id: 'activity', label: 'Activity Logs', icon: History, path: '/vendor?view=activity' },
      ]
    },
    {
      title: "Marketing",
      items: [
        { id: 'coupons', label: 'Coupons', icon: Tag, path: '/vendor?view=coupons' },
        { id: 'banners', label: 'Banners', icon: Image, path: '/vendor?view=banners' },
      ]
    },
    {
      title: "Finance & Reports",
      items: [
        { id: 'billing', label: 'Billing/Payouts', icon: CreditCard, path: '/vendor?view=billing' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/vendor?view=analytics' },
      ]
    },
    {
      title: "Profile & Account",
      items: [
        { id: 'profile', label: 'Seller Profile', icon: User, path: '/vendor?view=profile' },
        { id: 'notifications', label: 'Notifications', icon: Bell, path: '/vendor?view=notifications', badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null, badgeColor: 'bg-blue-500 text-white font-semibold animate-pulse' },
        { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/vendor?view=settings' },
      ]
    }
  ];

  const handleMenuItemClick = (item: any) => {
    navigate(item.path);
    setIsMobileOpen(false);
  };

  // View Subpage Renderers
  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-[#052b14] h-36 rounded-3xl relative overflow-hidden flex items-end p-6 border border-[#113d21]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 to-transparent z-10" />
        <div className="absolute right-0 top-0 opacity-15">
          <Layers className="h-44 w-44 rotate-12 text-white" />
        </div>
        <div className="relative z-20 flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-2xl border-2 border-yellow-400 flex items-center justify-center font-bold text-3xl text-emerald-800">
            🌳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{vendorDetails?.store_name}</h2>
              <span className="bg-yellow-400 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="h-3 w-3" /> Verified Partner
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">ID: #{vendorDetails?.id?.split('-')[0].toUpperCase()} • Seller Hub Merchant</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border shadow-sm md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Edit Merchant Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Store Name</label>
              <input 
                type="text" 
                value={profileForm.store_name}
                onChange={e => setProfileForm({ ...profileForm, store_name: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Phone Number</label>
              <input 
                type="text" 
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Store Address</label>
              <textarea 
                rows={3}
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-slate-800 text-sm"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm shadow-md shadow-emerald-600/10"
            >
              <Save className="h-4 w-4" /> Save Store Profile
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4 h-fit">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Status Overview</h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Tier</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md uppercase">Gold Tier (7.5%)</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">API Connection</span>
              <span className="text-xs font-black text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md uppercase">Live (gRPC-v2)</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Pincode</span>
              <span className="text-xs font-black text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">{serviceArea?.pincode || "302001"}</span>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Verification Level 3 Complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">Shop Categories Catalog</h2>
        <p className="text-slate-500 text-sm mb-6">List of active categories populated inside your store front.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => {
            const count = products.filter(p => p.category_id === cat.id).length;
            return (
              <div key={cat.id || i} className="bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl p-4 border border-slate-100 text-center flex flex-col items-center justify-center group cursor-pointer transition-all">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center p-1 font-bold text-2xl text-emerald-800 mb-3 border border-emerald-100">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover rounded-full" />
                  ) : "🥦"}
                </div>
                <h4 className="text-sm font-black text-slate-800 line-clamp-1">{cat.name}</h4>
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5">
                  {count} SKUs
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Real-time Stock Ledger</h2>
            <p className="text-slate-500 text-sm">Increment/decrement stock and save updates directly to client database.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 max-w-[200px]"
              />
            </div>
            {Object.keys(editingStock).length > 0 && (
              <button
                onClick={handleSaveInventory}
                className="bg-yellow-400 text-emerald-950 px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-yellow-400/20 hover:bg-yellow-500 flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" /> Save Changes ({Object.keys(editingStock).length})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                <th className="p-4">SKU / Product Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">Pricing</th>
                <th className="p-4 text-center">In Stock Units</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((prod, i) => {
                const currentStockVal = editingStock[prod.id] !== undefined ? editingStock[prod.id] : (prod.stock || 0);
                const isModified = editingStock[prod.id] !== undefined;
                return (
                  <tr key={prod.id || i} className={cn("hover:bg-slate-50/50 transition-all", isModified && "bg-amber-50/30")}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center font-bold text-xs">📦</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">#{prod.id?.split('-')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-500">
                      {prod.category_id ? categories.find(c => c.id === prod.category_id)?.name || "Groceries" : "Groceries"}
                    </td>
                    <td className="p-4 text-xs font-black text-slate-800">
                      ₹{prod.price || prod.selling_price} <span className="text-slate-400 line-through text-[10px] font-medium ml-1">₹{prod.original_price || prod.mrp}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2.5">
                        <button 
                          onClick={() => handleStockChange(prod.id, prod.stock || 0, -5)}
                          className="h-7 w-7 bg-slate-100 border rounded-lg text-xs font-black flex items-center justify-center hover:bg-slate-200"
                        >
                          -5
                        </button>
                        <button 
                          onClick={() => handleStockChange(prod.id, prod.stock || 0, -1)}
                          className="h-7 w-7 bg-white border rounded-lg text-xs font-black flex items-center justify-center hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className={cn("text-sm font-black min-w-[32px] text-center", isModified ? "text-amber-600 scale-110" : "text-slate-800")}>
                          {currentStockVal}
                        </span>
                        <button 
                          onClick={() => handleStockChange(prod.id, prod.stock || 0, 1)}
                          className="h-7 w-7 bg-white border rounded-lg text-xs font-black flex items-center justify-center hover:bg-slate-50"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => handleStockChange(prod.id, prod.stock || 0, 5)}
                          className="h-7 w-7 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-black flex items-center justify-center hover:bg-emerald-100"
                        >
                          +5
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {currentStockVal === 0 ? (
                        <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2.5 py-1 rounded-md">Out Of Stock</span>
                      ) : currentStockVal < 5 ? (
                        <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Low Stock</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Secure</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderServiceAreas = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">Delivery Service coverage</h2>
        <p className="text-slate-500 text-sm mb-6">Listed pincode segment of your store.</p>
        
        {serviceArea ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-2xl space-y-4">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Active Regional Center</span>
                <h3 className="text-lg font-black text-slate-800">{serviceArea.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 block uppercase">Pincode</span>
                  <span className="text-lg font-black text-slate-800">{serviceArea.pincode}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 block uppercase">Radius Range</span>
                  <span className="text-lg font-black text-slate-800">{serviceArea.radius_km || "10.0"} KM</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-emerald-800 text-xs font-bold leading-relaxed">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-emerald-950 mb-0.5">8-12 Mins Delivery SLA Activated</h4>
                  All orders in this area are prioritized for route optimization.
                </div>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-slate-50 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <MapPin className="h-12 w-12 text-emerald-600 mb-2 animate-bounce" />
              <div className="h-32 w-32 rounded-full border border-dashed border-emerald-300 animate-pulse absolute opacity-40" />
              <h4 className="font-black text-slate-800 relative z-10">Map Pin Synchronized</h4>
              <p className="text-slate-500 text-xs mt-1 relative z-10 max-w-[240px]">Latitude: {serviceArea.latitude || '26.9124'} • Longitude: {serviceArea.longitude || '75.7873'}</p>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">Loading service area info...</div>
        )}
      </div>
    </div>
  );

  const renderDeliveryBoys = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">Nearby Delivery Partners</h2>
        <p className="text-slate-500 text-sm mb-6">List of active riders who pick orders from your store.</p>
        
        {deliveryBoys.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No active delivery boys mapped to this area.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliveryBoys.map((boy, idx) => (
              <div key={boy.id || idx} className="bg-slate-50 border rounded-2xl p-4 hover:shadow-sm transition-all flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  🚴
                </div>
                <div>
                  <div className="text-sm font-black text-slate-800">{boy.full_name || boy.email?.split('@')[0]}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Vehicle: {boy.vehicle_type || 'BIKE'}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">On Duty</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBilling = () => {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Finance & Settled Earnings</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Blinkit instant split settlement dashboard</p>
          </div>
          <button 
            onClick={() => profile?.id && fetchFinanceDetails(profile.id)}
            className="bg-white border-2 border-slate-100 hover:border-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Refresh Finances
          </button>
        </div>

        {/* Finance Performance KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* AVAILABLE WALLET */}
          <div className="bg-[#052b14] rounded-[1.8rem] border border-[#103d20] shadow-md p-5 text-white relative overflow-hidden flex flex-col justify-between h-36">
            <div className="absolute right-0 top-0 opacity-10">
              <Wallet className="h-28 w-28 rotate-12 text-white" />
            </div>
            <div>
              <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest block mb-0.5">Available Balance</span>
              <h3 className="text-2xl font-black italic tracking-tighter leading-none">
                ₹{Number(wallet.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="flex justify-between items-center z-10">
              <span className="text-[10px] text-slate-300 font-bold">Instantly withdrawable</span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-950" />
            </div>
          </div>

          {/* PENDING EARNINGS */}
          <div className="bg-[#052b14] rounded-[1.8rem] border border-[#103d20] shadow-md p-5 text-white relative overflow-hidden flex flex-col justify-between h-36">
            <div className="absolute right-0 top-0 opacity-10">
              <Clock className="h-28 w-28 rotate-12 text-white" />
            </div>
            <div>
              <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest block mb-0.5">Pending Earnings</span>
              <h3 className="text-2xl font-black italic tracking-tighter leading-none">
                ₹{Number(wallet.pending_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="text-[10px] text-slate-300 font-bold">From active/transit orders</span>
          </div>

          {/* TOTAL EARNINGS */}
          <div className="bg-[#052b14] rounded-[1.8rem] border border-[#103d20] shadow-md p-5 text-white relative overflow-hidden flex flex-col justify-between h-36">
            <div className="absolute right-0 top-0 opacity-10">
              <ArrowUpRight className="h-28 w-28 rotate-12 text-white" />
            </div>
            <div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Total Revenue</span>
              <h3 className="text-2xl font-black italic tracking-tighter leading-none">
                ₹{Number(wallet.total_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="text-[10px] text-emerald-300 font-bold">Lifetime processed</span>
          </div>

          {/* LAST SETTLEMENT */}
          <div className="bg-[#052b14] rounded-[1.8rem] border border-[#103d20] shadow-md p-5 text-white relative overflow-hidden flex flex-col justify-between h-36">
            <div className="absolute right-2 top-2">
              {wallet.settlement_status === 'pending_settlement' ? (
                <span className="text-[8px] font-black bg-yellow-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">Awaiting Settlement</span>
              ) : (
                <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Settled</span>
              )}
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-0.5">Last Payout</span>
              <h3 className="text-2xl font-black italic tracking-tighter leading-none">
                ₹{Number(wallet.last_payout || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="text-[10px] text-slate-300 font-bold truncate">A/C: {wallet.account_number}</span>
          </div>
        </div>

        {/* Action Center Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Withdrawal and ledger area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* INITIATE PAYOUT REQUEST */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4 border-b pb-2">Request Cash Out</h3>
              
              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Drawn Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 ml-0.5 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="100"
                        placeholder="Min ₹100 required"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-extrabold text-slate-800 h-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Destination Gateway</label>
                    <input
                      type="text"
                      value={wallet.bank_name ? `${wallet.bank_name} (${wallet.account_number})` : "Please add bank account"}
                      disabled
                      className="w-full px-3.5 py-2 border bg-slate-50 text-slate-500 rounded-xl outline-none text-xs font-bold h-10 select-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex md:items-center justify-between flex-col md:flex-row gap-3 pt-2">
                  <div className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-sm">
                    ⚠️ Minimum payout threshold is ₹100. Payout gets submitted for review & scheduled instant bank credit.
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingWithdrawal || !wallet.available_balance || wallet.available_balance < 100}
                    className="bg-[#052b14] hover:bg-[#0b381c] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmittingWithdrawal ? "Submitting..." : "Initiate Transfer"}
                  </button>
                </div>
              </form>
            </div>

            {/* TAB PANELS: PAYOUT HISTORY vs LEDGER */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex gap-4">
                  <button
                    onClick={() => setFinanceTab('payouts')}
                    className={cn(
                      "text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all",
                      financeTab === 'payouts' ? "border-[#052b14] text-[#052b14]" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Payout History
                  </button>
                  <button
                    onClick={() => setFinanceTab('ledger')}
                    className={cn(
                      "text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all",
                      financeTab === 'ledger' ? "border-[#052b14] text-[#052b14]" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Earnings Ledger
                  </button>
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400">
                  {financeTab === 'payouts' ? `${payoutHistory?.length || 0} audits` : `${earningsLedger?.length || 0} commissions`}
                </span>
              </div>

              {/* RENDER FINANCES TAB DATA */}
              <div className="p-6">
                {financeTab === 'payouts' ? (
                  /* PAYOUT HISTORY LIST */
                  <div className="space-y-3.5">
                    {payoutHistory.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                        No previous payout records found.
                      </div>
                    ) : (
                      payoutHistory.map((item, i) => (
                        <div key={item.id || i} className="flex justify-between items-center bg-slate-50/50 p-4 border rounded-[1.2rem] hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-800">Withdrawal Transfer</p>
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">#{item.id}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold mt-1.5">
                              {new Date(item.requested_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                            {item.transaction_id && (
                              <p className="text-[8px] font-mono text-emerald-700 font-black mt-0.5 uppercase">TXN Reference: {item.transaction_id}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">₹{item.amount.toLocaleString('en-IN')}</p>
                            <span className={cn(
                              "text-[8px] uppercase font-black px-2 py-0.5 rounded-full mt-1.5 inline-block border",
                              item.status === 'paid' ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                              item.status === 'pending' ? "text-yellow-700 bg-yellow-50 border-yellow-100" :
                              item.status === 'approved' ? "text-indigo-700 bg-indigo-50 border-indigo-100" :
                              "text-red-700 bg-red-50 border-red-100"
                            )}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* EARNINGS LEDGER CREDITS BREAKDOWN */
                  <div className="space-y-3.5">
                    {earningsLedger.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                        No commissions processed yet. Complete orders to auto credit earnings.
                      </div>
                    ) : (
                      earningsLedger.map((item, i) => (
                        <div key={item.id || i} className="bg-slate-50/50 p-4 border rounded-[1.2rem] hover:bg-slate-50 transition-all space-y-2.5">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-black text-slate-800">Order Delivery Earning</p>
                              <p className="text-[9px] font-mono text-slate-400 mt-0.5">Order ID: {item.order_id}</p>
                            </div>
                            <div className="text-right">
                              <h4 className="text-xs font-mono font-black text-emerald-700 flex items-center justify-end">
                                +₹{Number(item.profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </h4>
                              <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">Credit Approved</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100/80 text-[9px] font-semibold text-slate-500">
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-black">Subtotal</span>
                              <span className="font-bold text-slate-700">₹{Math.max(0, item.order_amount - item.delivery_fee).toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-black">Commission (10%)</span>
                              <span className="font-bold text-slate-700">₹{item.commission.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-black">Delivery Fee</span>
                              <span className="font-bold text-slate-700">₹{item.delivery_fee.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-black">Timestamp</span>
                              <span className="font-semibold text-slate-600 truncate">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column details list: BANK SETTINGS */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 border shadow-sm h-fit space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Payout Gate Account</h3>
                <button
                  type="button"
                  onClick={() => setIsEditingBank(!isEditingBank)}
                  className="text-emerald-600 hover:text-emerald-700 font-black text-[10px] uppercase tracking-wider"
                >
                  {isEditingBank ? "Discard" : "Change A/C"}
                </button>
              </div>

              {!isEditingBank ? (
                /* Bank credentials display mode */
                <div className="space-y-4">
                  <div className="bg-slate-50/50 border rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center font-bold text-lg select-none">
                         🏦
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{wallet.bank_name || "State Bank of India"}</p>
                        <p className="text-[10px] font-mono text-slate-400">Account: {wallet.account_number || "******9281"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-100 text-[10px] font-bold">
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase">IFSC Code</span>
                        <span className="font-mono text-slate-700">{wallet.ifsc_code || "SBIN0001234"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase">Beneficiary Name</span>
                        <span className="text-slate-700">{wallet.holder_name || vendorDetails?.store_name || "Merchant Partner"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#052b14] font-bold leading-relaxed bg-[#f2f7f4] border border-dashed border-emerald-500/20 p-3 rounded-2xl">
                    ✅ Active settlement routing configured correctly. Withdrawals credits to this verified bank account.
                  </div>
                </div>
              ) : (
                /* Bank Change Form Edit mode */
                <form onSubmit={handleUpdateBankDetails} className="space-y-3.5">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block tracking-wider mb-1">Beneficiary Name</label>
                    <input
                      type="text"
                      value={bankForm.holder_name}
                      onChange={e => setBankForm({ ...bankForm, holder_name: e.target.value })}
                      placeholder="Account holder's official name"
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold h-9"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block tracking-wider mb-1">Settlement Bank Name</label>
                    <input
                      type="text"
                      value={bankForm.bank_name}
                      onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold h-9"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block tracking-wider mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankForm.account_number}
                      onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })}
                      placeholder="Complete account identifier"
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-mono font-bold h-9"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block tracking-wider mb-1">IFS Code</label>
                    <input
                      type="text"
                      value={bankForm.ifsc_code}
                      onChange={e => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase() })}
                      placeholder="11 Character IFS Code"
                      maxLength={11}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-mono font-bold h-9"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    <button
                      type="submit"
                      className="bg-[#052b14] hover:bg-[#0d3b1e] text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg"
                    >
                      Save Gateway
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBank(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCoupons = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border shadow-sm md:col-span-2 space-y-4">
          <h2 className="text-lg font-black text-slate-900">Active Promo Coupons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="border-2 border-dashed border-emerald-500/30 bg-emerald-50/20 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <Percent className="h-24 w-24 text-emerald-900 rotate-12" />
                </div>
                <div>
                  <span className="bg-emerald-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-md uppercase tracking-wider block w-fit mb-1.5">
                    {coupon.code}
                  </span>
                  <p className="text-xs font-black text-slate-800">
                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}% Off` : `₹${coupon.discount_value} Flat Off`}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">Min Order: ₹{coupon.min_purchase}</p>
                </div>
                <button 
                  onClick={() => {
                    setCoupons(coupons.filter(c => c.id !== coupon.id));
                    toast.success("Coupon deactivated");
                  }}
                  className="h-8 w-8 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border shadow-sm h-fit space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Generate Code</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Coupon Code</label>
              <input 
                type="text" 
                placeholder="E.G. FRESH30"
                value={newCoupon.code}
                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Discount Unit</label>
                <select 
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none focus:ring-2"
                  value={newCoupon.discount_type}
                  onChange={e => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                >
                  <option value="percent">Percentage</option>
                  <option value="flat">Flat Cash</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Discount Value</label>
                <input 
                  type="number" 
                  value={newCoupon.discount_value}
                  onChange={e => setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none focus:ring-2"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Min order constraint</label>
              <input 
                type="number" 
                value={newCoupon.min_purchase}
                onChange={e => setNewCoupon({ ...newCoupon, min_purchase: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none focus:ring-2"
              />
            </div>
            <button
              onClick={handleAddCoupon}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider mt-2.5 transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Activate Coupon
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBanners = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <h2 className="text-lg font-black text-slate-900 mb-2">Campaign Headers & Banners</h2>
        <p className="text-slate-500 text-sm mb-6">Manage high visual billboards displaying inside public home carousels.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((item) => (
            <div key={item.id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm relative group bg-slate-50 flex flex-col justify-between">
              <div className="h-36 w-full relative overflow-hidden bg-slate-200">
                <img src={item.url} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent flex items-end p-4">
                  <h4 className="text-sm font-black text-white">{item.title}</h4>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {item.status === 'Approved' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  <span className="text-[10px] font-black uppercase text-slate-500">{item.status}</span>
                </div>
                <button
                  onClick={() => {
                    setBanners(banners.filter(b => b.id !== item.id));
                    toast.success("Banner campaign removed");
                  }}
                  className="h-8 w-8 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-dashed border-slate-200 p-6 rounded-2xl max-w-[500px] mt-8 bg-slate-50/50 space-y-4">
          <h4 className="font-extrabold text-sm text-slate-800">Launch New Billboard Flyer</h4>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Campaign Banner Name"
              value={newBannerTitle}
              onChange={e => setNewBannerTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
            />
            <input 
              type="text" 
              placeholder="Thematic Image URL (https://unsplash.com/...)"
              value={newBannerUrl}
              onChange={e => setNewBannerUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none"
            />
            <button
              onClick={handleAddBanner}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider transition-all"
            >
              Request Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgOrderVal = orders.length ? (totalRevenue / orders.length) : 0;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">₹</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans">Gross Revenue</p>
              <p className="text-lg font-black text-slate-900">₹{totalRevenue.toFixed(1)}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">🛒</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Sales</p>
              <p className="text-lg font-black text-slate-900">{orders.length} orders</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">🛍️</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Average Ticket</p>
              <p className="text-lg font-black text-slate-900">₹{avgOrderVal.toFixed(1)}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">📦</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SKUs Listed</p>
              <p className="text-lg font-black text-slate-900">{products.length} live</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">Bi-Weekly Sales Distribution</h3>
            <span className="text-[10px] uppercase font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Live Merged Chart
            </span>
          </div>

          {/* Retro inline-block SVG Graph */}
          <div className="w-full h-48 bg-slate-50 rounded-2xl flex items-end justify-between p-4 relative pt-10 border border-slate-100">
            <span className="absolute top-3 left-4 text-[10px] font-black font-semibold text-slate-400">Order Totals Distribution (₹-Axis)</span>
            {orders.map((ord, idx) => {
              const maxAmt = Math.max(...orders.map(o => o.total_amount || 1), 100);
              const heightPct = Math.min(90, Math.max(15, ((ord.total_amount || 0) / maxAmt) * 100));
              return (
                <div key={ord.id || idx} className="flex-1 flex flex-col items-center group relative h-full justify-end px-1 sm:px-2">
                  <div className="text-[9px] font-mono font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 bg-white px-1.5 py-0.5 border rounded-md shadow-sm z-10 whitespace-nowrap">
                    ₹{ord.total_amount}
                  </div>
                  <div 
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-emerald-500 border border-emerald-600 rounded-t-lg group-hover:bg-yellow-400 group-hover:border-yellow-500 transition-all flex items-end justify-center pb-2 relative"
                  />
                  <span className="text-[8px] font-bold text-slate-400 mt-1.5 truncate max-w-[40px]">#{ord.id?.split('-')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border shadow-sm">
        <h2 className="text-lg font-black text-slate-900 mb-2">Merchant Audit Timeline</h2>
        <p className="text-slate-500 text-sm mb-6">Complete visual feeds ledger of store processes.</p>
        
        <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
          <div className="relative z-10">
            <div className="absolute -left-[30px] top-0 bg-emerald-100 text-emerald-700 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]" />
            <div className="text-[10px] font-bold text-slate-400">TODAY, 13:12</div>
            <p className="text-xs font-black text-slate-800">Store opened by credentials verification</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Marked store active for gRPC-SLA channels.</p>
          </div>

          <div className="relative z-10">
            <div className="absolute -left-[30px] top-0 bg-blue-100 text-blue-700 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]" />
            <div className="text-[10px] font-bold text-slate-400">TODAY, 11:24</div>
            <p className="text-xs font-black text-slate-800">Inventory Sync complete</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Updated stock records of fresh products.</p>
          </div>

          <div className="relative z-10">
            <div className="absolute -left-[30px] top-0 bg-amber-100 text-amber-700 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]" />
            <div className="text-[10px] font-bold text-slate-400">YESTERDAY, 18:45</div>
            <p className="text-xs font-black text-slate-800">Payout delivered successfully</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Transferred ₹12,400.00 directly to SBI linked account.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 border shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-2">Announcement Hub</h2>
          <p className="text-slate-500 text-sm mb-6">Real-time alerts and catalog status listings.</p>
          
          <div className="space-y-4">
            {lowStockCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-800 text-xs font-bold leading-relaxed">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-amber-950 mb-0.5">Low Stock Warnings</h4>
                  There are {lowStockCount} items listed below 5 threshold units in your inventory catalog. Please increase quantities immediately.
                </div>
              </div>
            )}

            {pendingApprovalsCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex gap-3 text-blue-800 text-xs font-bold leading-relaxed">
                <Bell className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-blue-950 mb-0.5">Announcements Pending Approval</h4>
                  There are {pendingApprovalsCount} new catalog additions awaiting Admin verification level checks.
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex gap-3 text-slate-700 text-xs font-bold leading-relaxed">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <h4 className="font-black text-slate-950 mb-0.5">All Systems Secure</h4>
                Database nodes and SSL links are running correctly. Keep uploading catalog inventory.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900 border-b pb-2">Merchant Control Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block tracking-wider mb-1">Minimum Checkout Value</label>
              <input 
                type="number" 
                value={settingsForm.min_order_value}
                onChange={e => setSettingsForm({ ...settingsForm, min_order_value: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none m-0 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Store Opens</label>
                <input 
                  type="time" 
                  value={settingsForm.open_time}
                  onChange={e => setSettingsForm({ ...settingsForm, open_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Store Closes</label>
                <input 
                  type="time" 
                  value={settingsForm.close_time}
                  onChange={e => setSettingsForm({ ...settingsForm, close_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                🌴 Vacation Mode
              </h4>
              <p className="text-slate-400 text-xs font-bold mt-1">
                Instantly closes down catalog ordering for public users while you're away.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800">Vacation Mode Status</span>
              <button
                onClick={() => {
                  setSettingsForm({ ...settingsForm, vacation_mode: !settingsForm.vacation_mode });
                  toast.success(`Vacation mode ${!settingsForm.vacation_mode ? 'activated' : 'deactivated'}`);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors tracking-widest",
                  settingsForm.vacation_mode ? "bg-red-600 text-white" : "bg-slate-200 text-slate-500"
                )}
              >
                {settingsForm.vacation_mode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={() => toast.success("Seller preferences updated!")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md shadow-emerald-600/10"
        >
          Update Settings
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F1F3F2] overflow-hidden">
      {/* ----------------- DESKTOP SIDEBAR ----------------- */}
      <aside 
        style={{ width: isCollapsed ? '72px' : '260px' }} 
        className={cn(
          "bg-[#042412] h-full shadow-2xl relative transition-all duration-300 hidden md:flex flex-col select-none z-[80] flex-shrink-0"
        )}
      >
        {/* Toggle Collapse handle at center edge */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-28 bg-[#FFF200] text-emerald-900 border-2 border-[#042412] h-6 w-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-yellow-400 shadow-lg"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Top Shop Profile and Logo Area */}
        <div className={cn("p-4 border-b border-[#0f341d]", isCollapsed ? "items-center" : "")}>
          {!isCollapsed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-[#FFF200] text-emerald-900 flex items-center justify-center font-black text-xs">🚀</span>
                <span className="font-black text-xs text-white uppercase tracking-wider">Blinkit Seller Hub</span>
              </div>

              {/* Shop Logo and Badge Status */}
              <div className="bg-[#031d0e] p-3 rounded-2xl border border-[#0f341d] relative space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-bold text-lg select-none">
                     🥦
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-white text-xs leading-tight truncate">{vendorDetails?.store_name || "Lending Fresh"}</h3>
                    <div className="inline-flex items-center gap-1 bg-[#FFF200] text-[#042412] text-[8px] font-black px-1.5 py-0.5 rounded-full mt-1 uppercase tracking-wider leading-none">
                      <CheckCircle2 className="h-2 w-2" /> Verified
                    </div>
                  </div>
                </div>

                {/* Status Toggle Block */}
                <div className="flex items-center justify-between pt-1 border-t border-[#0f341d]">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Store Status</span>
                  <button 
                    onClick={toggleStoreStatus}
                    className={cn(
                      "flex items-center gap-1 border-0 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider outline-none cursor-pointer text-white",
                      vendorDetails?.is_active ? "bg-emerald-600" : "bg-slate-600"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full inline-block", vendorDetails?.is_active ? "bg-white animate-ping" : "bg-slate-400")} />
                    {vendorDetails?.is_active ? "Online" : "Offline"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <span className="h-6 w-6 rounded-lg bg-[#FFF200] text-emerald-900 flex items-center justify-center font-black text-xs">🚀</span>
              <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center font-bold text-lg select-none relative">
                🥦
                <span className={cn("absolute bottom-0 right-0 h-3 w-3 border-2 border-[#042412] rounded-full", vendorDetails?.is_active ? "bg-emerald-500" : "bg-slate-400")} />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Side Nav List */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-4">
          {menuSections.map((sect, i) => (
            <div key={i} className="space-y-1">
              {!isCollapsed && (
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5">
                  {sect.title}
                </div>
              )}
              {sect.items.map((item, idx) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={idx}
                    onClick={() => handleMenuItemClick(item)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer relative group",
                      isActive 
                        ? "bg-[#FFF200] text-[#042412] font-black shadow-[0_0_12px_rgba(250,204,21,0.35)]" 
                        : "text-slate-300 hover:text-white hover:bg-[#07361b]"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#042412]" : "text-slate-300 group-hover:scale-105 transition-transform")}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {!isCollapsed && (
                        <span className="text-xs font-bold font-sans tracking-tight truncate">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={cn("text-[9px] font-black h-4 px-1.5 rounded-full flex items-center justify-center", item.badgeColor ? item.badgeColor : "bg-[#FFF200] text-[#042412]")}>
                        {item.badge}
                      </span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 shadow-md whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Support and footer */}
        <div className="mt-auto p-3 border-t border-[#0f341d] space-y-1">
          {!isCollapsed && (
            <div className="p-2.5 bg-[#031d0e] border border-[#0f341d] rounded-2xl mb-2 text-center text-[10px] font-semibold text-slate-400">
              <p>Need support? Call ONDC dispatch</p>
              <div className="mt-1 text-[#FFF200] hover:underline cursor-pointer flex items-center justify-center gap-1">
                <Headphones className="h-3 w-3" /> Help Center
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all cursor-pointer",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Logout Account</span>}
          </button>
        </div>
      </aside>

      {/* ----------------- MOBILE SLIDE-OUT DRAWER ----------------- */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-[100] flex md:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="relative w-[280px] bg-[#042412] h-full shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header inside mobile drawer */}
              <div className="p-4 border-b border-[#0f341d] flex justify-between items-center bg-[#031c0e]">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-[#FFF200] text-[#042412] flex items-center justify-center font-black text-xs">🚀</span>
                  <span className="font-extrabold text-[#FFF200] text-xs uppercase tracking-wider">Seller Hub</span>
                </div>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 text-slate-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Middle Profile in mobile drawer */}
              <div className="p-4 border-b border-[#0f341d] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-bold text-lg select-none">
                     🥦
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xs leading-none">{vendorDetails?.store_name}</h3>
                    <span className="text-[8px] font-black text-[#042412] bg-[#FFF200] px-1.5 py-0.5 rounded-full mt-1 inline-block uppercase">Verified Vendor</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Store Status</span>
                  <button 
                    onClick={toggleStoreStatus}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white",
                      vendorDetails?.is_active ? "bg-emerald-600" : "bg-slate-600"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full inline-block", vendorDetails?.is_active ? "bg-white animate-ping" : "bg-slate-400")} />
                    {vendorDetails?.is_active ? "Online" : "Offline"}
                  </button>
                </div>
              </div>

              {/* Side nav lists in mobile drawer */}
              <div className="flex-grow overflow-y-auto custom-scrollbar p-3 space-y-4">
                {menuSections.map((sect, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-1.5">
                      {sect.title}
                    </div>
                    {sect.items.map((item, idx) => {
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleMenuItemClick(item)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer relative group",
                            isActive 
                              ? "bg-[#FFF200] text-[#042412] font-black shadow-[0_0_12px_rgba(250,204,21,0.35)]" 
                              : "text-slate-300 hover:text-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span className="text-xs font-bold leading-none">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className={cn("text-[8px] font-black h-4 px-1.5 rounded-full flex items-center justify-center", item.badgeColor ? item.badgeColor : "bg-[#FFF200] text-[#042412]")}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Support inside mobile drawer */}
              <div className="p-3 border-t border-[#0f341d] space-y-1 bg-[#031d0e]">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout Account</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- CORE RIGHT VIEW CONTAINER ----------------- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Sticky Top Bar Panel */}
        <header className="bg-white h-16 border-b flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger for small devices */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors text-xs font-black uppercase tracking-wider">
              <ArrowLeft className="h-4 w-4" /> Back to Shop Front
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline-block border-r pr-3">
              Server Terminal Live: <span className="text-emerald-600 font-black">ACTIVE</span>
            </span>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm select-none">
                ⚙️
              </div>
              <span className="text-xs font-black text-slate-700">{profile?.email}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Right Side Content panel */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-[#F7F9F8]">
          <div className="max-w-6xl mx-auto w-full pb-16">
            {activeView === 'dashboard' || activeView === 'orders' || activeView === 'catalog' ? (
              // Original vendor subpage layout children
              children
            ) : (
              // Enhanced custom subpage renderers
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-0.5">Seller Hub Modules</span>
                    <h1 className="text-2xl font-black text-slate-900 capitalize">{activeView.replace('-', ' ')}</h1>
                  </div>
                  <button 
                    onClick={() => navigate('/vendor?view=dashboard')}
                    className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full flex items-center gap-1 border border-emerald-100"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                  </button>
                </div>

                {activeView === 'profile' && renderProfile()}
                {activeView === 'categories' && renderCategories()}
                {activeView === 'inventory' && renderInventory()}
                {activeView === 'service-areas' && renderServiceAreas()}
                {activeView === 'delivery-boys' && renderDeliveryBoys()}
                {activeView === 'billing' && renderBilling()}
                {activeView === 'coupons' && renderCoupons()}
                {activeView === 'banners' && renderBanners()}
                {activeView === 'analytics' && renderAnalytics()}
                {activeView === 'activity' && renderActivity()}
                {activeView === 'notifications' && renderNotifications()}
                {activeView === 'settings' && renderSettings()}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
