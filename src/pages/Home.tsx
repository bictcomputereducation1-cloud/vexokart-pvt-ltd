import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ShoppingCart, 
  ChevronDown, 
  Search as SearchIcon, 
  Mic,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Plus,
  Star,
  ChevronRight,
  CreditCard,
  Trash2,
  Briefcase,
  Building2,
  Heart
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useDeliveryLocation } from '../LocationContext';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { supabase } from '../lib/supabase';
import { Banner, Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { fetchLiveAndInStockProducts } from '../lib/productFetcher';
import { MOCK_CATEGORIES, MOCK_BANNERS } from '../lib/defaultData';
import { LocationPicker } from '../components/LocationPicker';
import { toast } from 'sonner';
import { PremiumVideoBanner } from '../components/PremiumVideoBanner';
import { SaleCampaigns } from '../components/SaleCampaigns';

const featureStrip = [
  { icon: Star, label: "Best Quality", sub: "Premium Products", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: Zap, label: "Fast Delivery", sub: "10 Minutes", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: CreditCard, label: "Best Prices", sub: "Great Offers", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: ShieldCheck, label: "Secure Payment", sub: "100% Safe", color: "text-emerald-500", bg: "bg-emerald-50" }
];

const fallbackBanners: Banner[] = [
  {
    id: 'cool-drinks',
    title: "Cool Drinks Beat the Heat!",
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
    link_url: "",
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'fresh-grocery',
    title: "Fresh Grocery Selection",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
    link_url: "",
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString()
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { address, setLocation, setIsModalOpen, pincode, isServiceable } = useDeliveryLocation();
  const { user, profile, isAdmin, isVendor, isDelivery, loading: authLoading } = useAuth();
  const { totalItems, addToCart, items } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return "Good Morning ☀️";
    if (hr >= 12 && hr < 17) return "Good Afternoon 🌤️";
    if (hr >= 17 && hr < 21) return "Good Evening 🌙";
    return "Good Night 🌙";
  };

  // Address System States
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addressForm, setAddressForm] = useState({
    title: 'Home',
    full_name: '',
    phone: '',
    full_address: '',
    city: '',
    pincode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    is_default: false
  });

  const getAddressLabelAndText = (fullAddress: string) => {
    const match = fullAddress.match(/^\[(Home|Work|Other)\]\s*(.*)/i);
    if (match) {
      return { label: match[1], text: match[2] };
    }
    return { label: 'Home', text: fullAddress };
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAddresses(data);
        
        // Find selected address based on localStorage or default
        const lastId = localStorage.getItem('vexo_last_address_id');
        let active = data.find(a => a.id === lastId);
        if (!active) {
          active = data.find(a => a.is_default) || data[0];
        }
        
        if (active) {
          setSelectedAddress(active);
          // Sync with LocationContext
          const parsed = getAddressLabelAndText(active.full_address);
          await setLocation(active.pincode, active.city, parsed.text, active.latitude, active.longitude);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses on Home:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const handleSelectAddress = async (addr: any) => {
    setSelectedAddress(addr);
    localStorage.setItem('vexo_last_address_id', addr.id);
    
    const parsed = getAddressLabelAndText(addr.full_address);
    await setLocation(addr.pincode, addr.city, parsed.text, addr.latitude, addr.longitude);
    setAddressModalOpen(false);
    toast.success(`Delivery address set to ${parsed.label}`);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const fullAddressString = `[${addressForm.title}] ${addressForm.full_address}`;
      const payload: any = {
        user_id: user.id,
        full_name: addressForm.full_name,
        phone: addressForm.phone,
        full_address: fullAddressString,
        city: addressForm.city,
        pincode: addressForm.pincode,
        latitude: addressForm.latitude,
        longitude: addressForm.longitude,
        is_default: addressForm.is_default
      };

      if (editingAddress) {
        const { error } = await supabase
          .from('user_addresses')
          .update(payload)
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success('Address updated successfully!');
      } else {
        if (addressForm.is_default || addresses.length === 0) {
          payload.is_default = true;
          await supabase
            .from('user_addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);
        }
        
        const { error } = await supabase
          .from('user_addresses')
          .insert(payload);

        if (error) throw error;
        toast.success('Address saved successfully!');
      }

      setAddressFormOpen(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (err) {
      console.error('Error saving address on Home:', err);
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Address deleted successfully');
      
      if (selectedAddress?.id === id) {
        setSelectedAddress(null);
        localStorage.removeItem('vexo_last_address_id');
      }
      
      await fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
      toast.error('Failed to delete address');
    }
  };

  const handleOpenEdit = (addr: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress(addr);
    const parsed = getAddressLabelAndText(addr.full_address);

    setAddressForm({
      title: parsed.label,
      full_name: addr.full_name,
      phone: addr.phone,
      full_address: parsed.text,
      city: addr.city,
      pincode: addr.pincode,
      latitude: addr.latitude,
      longitude: addr.longitude,
      is_default: addr.is_default
    });
    setAddressFormOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setAddressForm({
      title: 'Home',
      full_name: '',
      phone: '',
      full_address: '',
      city: '',
      pincode: '',
      latitude: null,
      longitude: null,
      is_default: addresses.length === 0
    });
    setAddressFormOpen(true);
  };

  const handleLocationSelected = (data: { lat: number, lng: number, address: string, city: string, pincode: string }) => {
    setAddressForm(prev => ({
      ...prev,
      full_address: data.address,
      city: data.city,
      pincode: data.pincode,
      latitude: data.lat,
      longitude: data.lng
    }));
  };

  useEffect(() => {
    if (!authLoading) {
      console.log("Auth User:", user);
      console.log("Database Profile:", profile);
      console.log("Database Role:", profile?.role || null);
    }

    if (!authLoading && user && profile) {
       if (profile.role === 'admin') {
          console.log("Navigation: /admin");
          navigate('/admin', { replace: true });
          return;
       } else if (profile.role === 'vendor') {
          console.log("Navigation: /vendor");
          navigate('/vendor', { replace: true });
          return;
       } else if (profile.role === 'delivery') {
          console.log("Navigation: /delivery");
          navigate('/delivery', { replace: true });
          return;
       }
    }
  }, [user, profile, authLoading, navigate]);

  // Load initial fallback/cache & setup Realtime changes
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('VEXO_HOME_CACHE');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache is valid for 5 minutes
        if (Date.now() - parsed.timestamp < 300000) {
          setBanners(parsed.banners || []);
          setCategories(parsed.categories || []);
          setBestSellers(parsed.bestSellers || []);
          setLoading(false);
        }
      }
    } catch (e) {
      // Ignore cache error
    }

    // Absolute fallback timer to prevent endless loading spinner if DB or API is extremely slow
    const absoluteFallback = setTimeout(() => {
      console.warn("[Home] Home screen took too long to load from DB. Forcing loading = false...");
      setLoading(false);
    }, 2800);

    fetchData().finally(() => {
      clearTimeout(absoluteFallback);
    });

    // 8. Ensure products inserted by vendors appear instantly in customer app.
    // 10. Add realtime refresh after product insert.
    console.log("[DEBUG] Registering realtime products listener for Home page...");
    const productsChannel = supabase
      .channel('products-realtime-home')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log("[DEBUG] Realtime product change detected on home page! Refetching products...", payload);
          fetchData();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      setCurrentSlide(curr => curr + 1);
    }, 5000);

    return () => {
      clearTimeout(absoluteFallback);
      clearInterval(interval);
      supabase.removeChannel(productsChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch Banners
      let currentBanners = fallbackBanners;
      try {
        const { data: bannerData, error: bError } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
        
        if (bError) {
          console.error("[API Fail] Error fetching banners:", bError);
          currentBanners = MOCK_BANNERS;
        } else if (!bannerData || bannerData.length === 0) {
          currentBanners = MOCK_BANNERS;
        } else {
          currentBanners = bannerData;
        }
      } catch (e) {
        console.error("[Home] Exception fetching banners, using mocks:", e);
        currentBanners = MOCK_BANNERS;
      }

      // Merge with stored extra fields and filter based on scheduling dates
      try {
        const extraDataRaw = localStorage.getItem('vexo_banners_extra');
        const extra = extraDataRaw ? JSON.parse(extraDataRaw) : {};
        const now = new Date();

        currentBanners = currentBanners.map(b => ({
          ...b,
          video_url: b.video_url || extra[b.id]?.video_url || '',
          start_date: (b as any).start_date || extra[b.id]?.start_date || '',
          end_date: (b as any).end_date || extra[b.id]?.end_date || ''
        })).filter(b => {
          const start = (b as any).start_date;
          const end = (b as any).end_date;
          if (start && new Date(start) > now) return false;
          if (end && new Date(end) < now) return false;
          return true;
        });
      } catch (e) {
        console.error("Error scheduling filters:", e);
      }

      setBanners(currentBanners);

      // 2. Fetch Categories
      let activeCategories: any[] = [];
      try {
        const { data: cats, error: catsError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (catsError) {
          console.error("[API Fail] Error fetching categories:", catsError);
          activeCategories = MOCK_CATEGORIES;
        } else if (!cats || cats.length === 0) {
          console.log("[Home] Categories table is empty, resorting to mock categories.");
          activeCategories = MOCK_CATEGORIES;
        } else {
          activeCategories = cats;
        }
      } catch (catErr) {
        console.error("[Home] Exception caught fetching categories, using fallback:", catErr);
        activeCategories = MOCK_CATEGORIES;
      }

      // 5. Fetch products safely using manual merge to handle loose joins and broken keys
      const prods = await fetchLiveAndInStockProducts();

      // Merge products with categories for section previews
      const finalCatsWithData = activeCategories.map(cat => {
        const catProds = prods.filter(p => p.category_id === cat.id || p.category_id === cat.slug);
        return {
          ...cat,
          previewProducts: catProds.slice(0, 4),
          totalCount: catProds.length
        };
      });

      setCategories(finalCatsWithData);
      setBestSellers(prods.slice(0, 8));

      // Write to SessionStorage Cache
      try {
        sessionStorage.setItem('VEXO_HOME_CACHE', JSON.stringify({
          banners: currentBanners,
          categories: finalCatsWithData,
          bestSellers: prods.slice(0, 8),
          timestamp: Date.now()
        }));
      } catch (err) {
        // Cache issue fallback
      }

    } catch (err) {
      // 3. If API fails: show error in console.
      console.error("[HOME PAGE PRODUCTS API FAILURE]:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!pincode) {
      setIsModalOpen(true);
      return;
    }
    
    if (isServiceable) {
      addToCart(product);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Vexokart Premium UI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-[#FAFAF8]">

      {/* 🔹 ADDRESS MANAGEMENT MODAL */}
      <AnimatePresence>
        {addressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#16A34A]" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Your Saved Addresses</h3>
                </div>
                <button 
                  onClick={() => setAddressModalOpen(false)}
                  className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
                >
                  Close
                </button>
              </div>

              {/* List */}
              <div className="p-6 overflow-y-auto space-y-3 flex-grow max-h-[50vh] no-scrollbar">
                {addresses.length > 0 ? (
                  addresses.map((addr) => {
                    const parsed = getAddressLabelAndText(addr.full_address);
                    const isSelected = selectedAddress?.id === addr.id;
                    return (
                      <div 
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                          isSelected 
                            ? 'border-[#16A34A] bg-emerald-50/30' 
                            : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-grow">
                            <div className="bg-slate-50 p-2 rounded-xl text-slate-500 mt-0.5">
                              <MapPin className="h-4 w-4 text-[#16A34A]" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">
                                  {parsed.label}
                                </span>
                                {addr.is_default && (
                                  <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-slate-500 leading-relaxed capitalize truncate">
                                {parsed.text}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                {addr.city} - {addr.pincode}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={(e) => handleOpenEdit(addr, e)}
                                className="p-1.5 text-xs font-black text-slate-400 hover:text-[#16A34A] hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={(e) => handleDeleteAddress(addr.id, e)}
                                className="p-1.5 text-xs font-black text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">No saved addresses found</p>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
                <button 
                  type="button"
                  onClick={handleOpenAdd}
                  className="w-full h-12 bg-[#16A34A] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-900/10 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add New Address
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔹 ADDRESS FORM OVERLAY */}
      <AnimatePresence>
        {addressFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button 
                  onClick={() => setAddressFormOpen(false)}
                  className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveAddress} className="p-6 overflow-y-auto space-y-4 flex-grow max-h-[70vh] no-scrollbar">
                {/* Home/Work/Other Selector */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Address Label</p>
                  <div className="flex gap-2">
                    {['Home', 'Work', 'Other'].map((lbl) => (
                      <button
                        type="button"
                        key={lbl}
                        onClick={() => setAddressForm(f => ({ ...f, title: lbl }))}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2 ${
                          addressForm.title === lbl 
                            ? 'bg-emerald-50 border-[#16A34A] text-[#16A34A]' 
                            : 'bg-white border-slate-100 text-slate-400'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Picker Map */}
                <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-100 relative shadow-inner">
                  <LocationPicker 
                    onLocationSelected={handleLocationSelected}
                    initialLocation={editingAddress ? { lat: editingAddress.latitude || 34.1691, lng: editingAddress.longitude || 74.4556 } : undefined}
                  />
                </div>

                {/* Text fields */}
                <div className="space-y-3">
                  <input 
                    required
                    placeholder="Receiver's Full Name"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:border-[#16A34A] outline-none transition-all"
                    value={addressForm.full_name}
                    onChange={e => setAddressForm(f => ({ ...f, full_name: e.target.value }))}
                  />
                  <input 
                    required
                    placeholder="Receiver's Phone Number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:border-[#16A34A] outline-none transition-all"
                    value={addressForm.phone}
                    onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                  />
                  <textarea 
                    required
                    placeholder="Flat, House No., Building, Area"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:border-[#16A34A] outline-none transition-all min-h-[60px]"
                    value={addressForm.full_address}
                    onChange={e => setAddressForm(f => ({ ...f, full_address: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                    required
                    placeholder="City"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:border-[#16A34A] outline-none transition-all"
                    value={addressForm.city}
                    onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                  />
                  <input 
                    required
                    placeholder="Pincode"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:border-[#16A34A] outline-none transition-all"
                    value={addressForm.pincode}
                    onChange={e => setAddressForm(f => ({ ...f, pincode: e.target.value }))}
                  />
                </div>
              </div>

              {/* Default address toggle */}
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="is_default"
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-200"
                  checked={addressForm.is_default}
                  onChange={e => setAddressForm(f => ({ ...f, is_default: e.target.checked }))}
                />
                <label htmlFor="is_default" className="text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none">
                  Set as default delivery address
                </label>
              </div>

              {/* Submit */}
              <button 
                type="submit"
                className="w-full h-12 bg-[#16A34A] text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-900/10 hover:bg-green-700 active:scale-95 transition-all mt-2"
              >
                Save and Deliver Here
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* 📍 PREMIUM STICKY HEADER */}
    <div className="sticky top-0 z-30 max-w-md mx-auto w-full px-4 pt-4 pb-3">
      <div className="bg-gradient-to-b from-white/95 to-slate-50/90 backdrop-blur-xl border border-white/45 rounded-[22px] shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-4 flex flex-col gap-3">
        {/* Top Row: Greeting & Profile Avatar */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black text-[#C49B3B] uppercase tracking-widest leading-none mb-1">
              {getGreeting()}
            </span>
            <span className="text-lg font-black text-slate-900 tracking-tight leading-none">
              {user ? (profile?.name || (profile as any)?.full_name || 'Guest') : 'Guest'}
            </span>
          </div>
          
          {/* Circular Profile Avatar */}
          <div 
            onClick={() => navigate('/account')}
            className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#C49B3B] to-amber-200 p-[2px] shadow-md shadow-amber-900/10 cursor-pointer active:scale-95 transition-all"
          >
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center font-black text-xs text-[#C49B3B]">
              {user ? ((profile?.name || (profile as any)?.full_name || 'Guest').substring(0, 2).toUpperCase()) : 'G'}
            </div>
          </div>
        </div>

        {/* Second Row: Delivery Location & Quick Action Icons */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100/50">
          {/* Large Delivery Location Card */}
          <div 
            onClick={() => setAddressModalOpen(true)}
            className="flex items-center gap-2 flex-grow min-w-0 bg-slate-50/80 hover:bg-slate-100/60 border border-slate-100/70 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 active:scale-98"
          >
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0 border border-emerald-500/10">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col text-left min-w-0 flex-grow">
              <span className="text-[8px] font-black uppercase text-emerald-700 tracking-wider leading-none mb-0.5">Deliver To</span>
              <span className="text-xs font-bold text-slate-700 truncate leading-tight flex items-center gap-1">
                {selectedAddress ? getAddressLabelAndText(selectedAddress.full_address).text : 'Set Delivery Location'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          </div>

          {/* Quick Actions: Wishlist and Notification */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Wishlist (Heart Icon) */}
            <button 
              onClick={() => navigate('/categories')} 
              className="relative h-9 w-9 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100/50 rounded-xl flex items-center justify-center text-slate-600 active:scale-90 transition-all"
            >
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500/10" />
            </button>

            {/* Notification */}
            <button className="relative h-9 w-9 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100/50 rounded-xl flex items-center justify-center text-slate-600 active:scale-90 transition-all">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* 🔹 PREMIUM FLOATING SEARCH BAR */}
    <div className="px-4 mt-2 mb-6">
      <div 
        onClick={() => navigate('/search')}
        className="relative max-w-md mx-auto group cursor-pointer"
      >
        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex items-center gap-4 h-14 px-5 bg-white rounded-[18px] border border-slate-100/80 shadow-[0_12px_30px_rgba(0,0,0,0.02)] group-hover:shadow-[0_16px_35px_rgba(196,155,59,0.05)] group-hover:border-[#C49B3B]/20 transition-all duration-300"
        >
          <SearchIcon className="h-4.5 w-4.5 text-[#C49B3B]" />
          <span className="text-xs text-slate-400 font-semibold tracking-tight flex-grow text-left">
            Search fresh grocery, drinks & more...
          </span>
          <div className="ml-auto h-5 w-[1px] bg-slate-100 mx-1" />
          <div className="h-8 w-8 rounded-xl bg-amber-50/50 flex items-center justify-center group-hover:bg-amber-100/50 transition-colors">
            <Mic className="h-4 w-4 text-[#C49B3B]" />
          </div>
        </motion.div>
      </div>
    </div>

    {/* 🔹 HERO BANNER SLIDESHOW */}
    <div className="px-4 mb-8">
      <div className="max-w-md mx-auto relative aspect-[335/205] w-full rounded-[28px] overflow-hidden border border-white shadow-[0_16px_40px_rgba(0,0,0,0.03)] bg-slate-50">
        <AnimatePresence mode="wait">
          {banners.length > 0 && banners.map((banner, index) => {
            const safeSlide = currentSlide % banners.length;
            if (index !== safeSlide) return null;
            
            // If the banner contains a valid video URL, load it using PremiumVideoBanner
            if (banner.video_url) {
              return (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22 }}
                  className="absolute inset-0"
                >
                  <PremiumVideoBanner banner={banner} />
                </motion.div>
              );
            }

            return (
              <motion.div 
                key={banner.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                className="absolute inset-0 cursor-pointer"
                onClick={() => {
                  if (banner.link_url) {
                    navigate(banner.link_url);
                  } else {
                    navigate('/categories');
                  }
                }}
              >
                <motion.div 
                  initial={{ scale: 1.12, y: 5 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ duration: 4.5, ease: "easeOut" }}
                  className="absolute inset-0 w-full h-full"
                >
                  <img 
                    src={banner.image_url} 
                    alt={banner.title} 
                    className="w-full h-full object-cover" 
                  />
                </motion.div>
                {/* Luxury soft gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end z-10 text-left">
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#C49B3B] bg-amber-500/10 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-2 border border-amber-500/10 shadow-sm animate-pulse">
                    Vexo Premium Selection
                  </span>
                  <h2 className="text-xl font-black text-white leading-tight tracking-tight mb-1 drop-shadow-md">
                    {banner.title || "Fresh Grocery Delivered Fast"}
                  </h2>
                  <p className="text-[9px] text-white/60 font-black tracking-widest uppercase mb-3.5">
                    Big Savings Every Day • Explore Now
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-fit bg-emerald-600 hover:bg-[#C49B3B] text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/20 active:scale-95 border border-emerald-500/20"
                  >
                    Shop Now <ArrowRight className="h-3 w-3 stroke-[2.5px]" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-20">
            {banners.map((_, idx) => {
              const safeSlide = currentSlide % banners.length;
              return (
                <div 
                  key={idx}
                  className={cn(
                    "h-1 transition-all duration-300",
                    idx === safeSlide ? "w-6 bg-[#C49B3B]" : "w-1.5 bg-white/40 rounded-full"
                  )}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>

    {/* 🔹 SALE CAMPAIGNS */}
    <SaleCampaigns />

    {/* 🔹 FEATURES STRIP */}
    <div className="px-4 mb-10 overflow-x-auto no-scrollbar">
      <div className="max-w-md mx-auto flex gap-4 min-w-max pb-2">
        {featureStrip.map((item, idx) => (
          <div key={idx} className="bg-white rounded-[1.5rem] p-4 flex items-center gap-3 border border-slate-100/50 shadow-[0_4px_15px_rgba(0,0,0,0.01)] min-w-[160px]">
            <div className={cn("h-11 w-11 rounded-full flex items-center justify-center border border-white shadow-inner", item.bg)}>
              <item.icon className={cn("h-4.5 w-4.5", item.color)} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black text-slate-800 leading-tight">{item.label}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* 🔹 CATEGORY GRID */}
    <div className="px-4 mb-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
            Curated Collections
          </h3>
          <button 
            onClick={() => navigate('/categories')} 
            className="text-xs font-black text-[#C49B3B] flex items-center gap-0.5 hover:opacity-85 transition-opacity"
          >
            See All <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {categories.slice(0, 8).map((cat: any) => (
            <motion.div
              key={cat.id}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group"
            >
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-[0_8px_20px_rgba(0,0,0,0.015)] border border-slate-100/80 group-hover:border-[#C49B3B]/30 group-hover:shadow-[0_12px_24px_rgba(196,155,59,0.06)] transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors duration-300" />
                <img 
                  src={cat.image_url || ''} 
                  alt={cat.name} 
                  className="w-full h-full object-contain filter group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <span className="text-[10px] font-black text-slate-600 text-center leading-tight group-hover:text-slate-900 group-hover:font-extrabold transition-colors">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>

    {/* 🔹 BEST SELLERS */}
    <div className="mb-10">
      <div className="max-w-md mx-auto">
        <div className="px-4 flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Best Sellers
          </h3>
          <button onClick={() => navigate('/categories')} className="text-xs font-black text-[#C49B3B] flex items-center gap-0.5">
            See All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto px-4 pb-6 no-scrollbar">
            {bestSellers.length > 0 ? (
              bestSellers.map(p => (
                <div key={p.id} className="min-w-[170px] max-w-[170px]">
                  <ProductCard product={p} />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8 bg-white/50 rounded-2xl border border-dashed border-slate-200 text-xs font-black uppercase text-slate-400 tracking-widest p-6 mx-4">
                No products available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 DEAL OF THE DAY */}
      <div className="mb-10">
        <div className="max-w-md mx-auto">
          <div className="px-4 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Top Deals for You
              </h3>
              <div className="flex items-center gap-1 bg-amber-500/10 text-[#C49B3B] px-2.5 py-1 rounded-full border border-amber-500/10 shadow-sm">
                <Clock className="h-3 w-3 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider">02:45:12 Left</span>
              </div>
            </div>
            <button onClick={() => navigate('/categories')} className="text-xs font-black text-[#C49B3B] flex items-center gap-0.5">
              See All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto px-4 pb-6 no-scrollbar">
            {bestSellers.length > 0 ? (
              bestSellers.slice().reverse().map(p => (
                <div key={p.id} className="min-w-[170px] max-w-[170px]">
                  <ProductCard product={p} />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8 bg-white/50 rounded-2xl border border-dashed border-slate-200 text-xs font-black uppercase text-slate-400 tracking-widest p-6 mx-4">
                No products available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 GOLD SAVINGS BANNER */}
      <div className="px-4 mb-8">
        <div className="max-w-md mx-auto relative h-[150px] rounded-[2rem] overflow-hidden shadow-[0_12px_35px_rgba(196,155,59,0.12)] border border-amber-200/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FCF7ED] via-[#FDF5E6] to-[#F3E5D0]" />
          
          {/* Decorative luxury shapes */}
          <div className="absolute -right-16 -top-16 h-48 w-48 bg-amber-400/20 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-36 w-36 bg-amber-600/10 rounded-full blur-xl" />
          
          <div className="relative h-full flex items-center px-6">
            <div className="flex flex-col items-center mr-6">
              <div className="h-11 w-11 rounded-full bg-[#C49B3B]/10 flex items-center justify-center border border-[#C49B3B]/20 mb-1">
                <Star className="h-5 w-5 text-[#C49B3B] fill-[#C49B3B]" />
              </div>
              <span className="text-xs font-black text-[#C49B3B] uppercase tracking-wider text-center leading-tight">Vexo<br/>Savings</span>
            </div>
            
            <div className="flex flex-col text-left">
              <h3 className="text-base font-extrabold text-slate-800 leading-tight mb-2">Exclusive Offers<br/>Designed For You</h3>
              <button className="bg-[#C49B3B] hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit shadow-md shadow-amber-900/10 transition-colors active:scale-95">
                View Offers
              </button>
            </div>

            <div className="ml-auto w-1/4 flex justify-end">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 bg-white rounded-2xl rotate-12 shadow-sm border border-slate-100/50" />
                <div className="absolute inset-0 bg-[#C49B3B] rounded-2xl -rotate-6 flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1549463591-24c1882bd396?auto=format&fit=crop&q=80&w=300"
                    alt="gift"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 PROMO BANNER 2 (Drinks) */}
      <div className="px-4 mb-4">
        <div className="max-w-md mx-auto relative h-[170px] rounded-[2rem] bg-gradient-to-br from-[#E8F5E9] via-[#F1F8F5] to-white border border-green-100 shadow-[0_12px_30px_rgba(22,163,74,0.03)] overflow-hidden group">
          <div className="absolute inset-0 p-6 flex flex-col justify-center text-left">
            <span className="text-emerald-700 text-[8px] font-black uppercase tracking-widest mb-1.5 bg-emerald-100/60 w-fit px-2.5 py-1 rounded-full border border-emerald-200/20">Summer Special</span>
            <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">Cool & Refreshing Drinks</h3>
            <p className="text-emerald-600 text-xs font-black uppercase tracking-wider mb-3">Up to 30% OFF</p>
            <button className="bg-[#16A34A] hover:bg-emerald-700 text-white w-fit px-5 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-green-900/10">
              Shop Now <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="absolute right-[-5%] top-0 bottom-0 w-1/2 flex items-center justify-center p-4 pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600" 
              alt="" 
              className="h-[110%] rotate-6 group-hover:rotate-3 transition-transform duration-700 object-contain filter drop-shadow-lg" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
