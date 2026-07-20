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
  Building2
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
    <div className="min-h-screen pb-32 bg-[#FAF9F6]">
      {/* 📍 PREMIUM BLINKIT-STYLE ADDRESS HEADER */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-grow min-w-0">
            <div className="bg-emerald-50 p-2.5 rounded-xl text-[#16A34A] mt-0.5 flex-shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-[#16A34A] tracking-wider">
                  Deliver to
                </span>
                {selectedAddress && (
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-100">
                    {getAddressLabelAndText(selectedAddress.full_address).label}
                  </span>
                )}
                {selectedAddress?.is_default && (
                  <span className="bg-slate-100 text-slate-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">
                    Default
                  </span>
                )}
              </div>
              
              <span className="text-sm font-black text-slate-800 leading-tight mt-0.5 truncate">
                {selectedAddress ? getAddressLabelAndText(selectedAddress.full_address).text : (user ? 'Set delivery address' : 'Login to save addresses')}
              </span>
              <span className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                {selectedAddress ? `${selectedAddress.city} - ${selectedAddress.pincode}` : 'No address selected'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <button 
                onClick={() => setAddressModalOpen(true)}
                className="text-[10px] font-black uppercase tracking-widest text-[#16A34A] bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-all border border-emerald-100/50"
              >
                Change
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="text-[10px] font-black uppercase tracking-widest text-white bg-[#C49B3B] px-4 py-2.5 rounded-xl shadow-md transition-all"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

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

      {/* 🔹 LOGO & TAGLINE */}
      <div className="pt-6 pb-4 flex flex-col items-center">
         <div className="flex items-center gap-2">
            <div className="relative mr-2">
               <div className="absolute top-1/2 -left-4 -translate-y-1/2 flex flex-col gap-1.5 opacity-60">
                  <div className="h-1 w-3 bg-[#C49B3B] rounded-full" />
                  <div className="h-1 w-5 bg-[#C49B3B] rounded-full" />
                  <div className="h-1 w-2 bg-[#C49B3B] rounded-full" />
               </div>
               <ShoppingCart className="h-9 w-9 text-[#C49B3B] fill-[#C49B3B]/5" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 logo-font">
               Vexo<span className="text-[#C49B3B]">Kart</span>
            </h1>
         </div>
         <div className="flex items-center gap-2 mt-1">
            <div className="h-[1px] w-4 bg-[#C49B3B]/40" />
            <span className="text-[10px] font-black text-[#C49B3B] uppercase tracking-[0.2em]">Smart Shopping, Easy Living</span>
            <div className="h-[1px] w-4 bg-[#C49B3B]/40" />
         </div>
      </div>

      {/* 🔹 SEARCH BAR */}
      <div className="px-4 mb-8">
        <div 
          onClick={() => navigate('/search')}
          className="relative cursor-pointer group"
        >
          <div className="flex items-center gap-4 h-14 px-6 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 transition-all active:scale-[0.98]">
            <SearchIcon className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-400 font-bold tracking-tight">Search for products, brands and more...</span>
            <div className="ml-auto h-8 w-[1px] bg-slate-100 mx-1" />
            <Mic className="h-5 w-5 text-[#C49B3B]" />
          </div>
        </div>
      </div>

      {/* 🔹 HERO BANNER */}
      <div className="px-4 mb-8">
        <div 
          onClick={() => {
            if (banners.length === 0) return;
            const safeSlide = currentSlide % banners.length;
            const activeBanner = banners[safeSlide];
            if (activeBanner?.link_url) {
              navigate(activeBanner.link_url);
            } else {
              navigate('/categories');
            }
          }}
          className="relative aspect-[335/200] w-full rounded-[2.5rem] bg-amber-50 overflow-hidden border border-white shadow-xl shadow-amber-900/5 group cursor-pointer"
        >
          {banners.length > 0 && banners.map((banner, index) => {
            const safeSlide = currentSlide % banners.length;
            return (
              <div 
                key={banner.id}
                className={cn(
                  "absolute inset-0 transition-opacity duration-1000",
                  index === safeSlide ? "opacity-100" : "opacity-0"
                )}
              >
                {/* Image filling the container */}
                <img 
                  src={banner.image_url} 
                  alt={banner.title} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                
                {/* Gradient Overlay for text readability if needed */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-center z-10 w-[70%]">
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-[1.1] tracking-tighter mb-4">
                    {banner.title}
                  </h2>
                  <button 
                    className="w-fit bg-[#C49B3B] text-white px-5 py-2 md:px-6 md:py-2.5 rounded-full font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-900/20"
                  >
                    Shop Now <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {banners.map((_, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === (currentSlide % banners.length) ? "w-4 bg-[#C49B3B]" : "w-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🔹 FEATURES STRIP */}
      <div className="px-4 mb-10 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 min-w-max pb-2">
          {featureStrip.map((item, idx) => (
            <div key={idx} className="bg-white rounded-[1.5rem] p-4 flex items-center gap-3 border border-slate-50 shadow-sm min-w-[160px]">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border border-white shadow-sm", item.bg)}>
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-900 leading-tight">{item.label}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 CATEGORY GRID */}
      <div className="px-4 mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Shop by Category</h3>
          <button onClick={() => navigate('/categories')} className="text-xs font-bold text-[#C49B3B] flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {categories.slice(0, 8).map((cat: any) => (
            <motion.div
              key={cat.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center p-3 shadow-md border border-slate-100 transition-all group-hover:shadow-amber-100 group-hover:border-amber-100">
                <img 
                  src={cat.image_url || ''} 
                  alt={cat.name} 
                  className="w-full h-full object-contain filter group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                {cat.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🔹 BEST SELLERS */}
      <div className="mb-10">
        <div className="px-4 flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Best Sellers</h3>
          <button onClick={() => navigate('/categories')} className="text-xs font-bold text-[#C49B3B] flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
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

      {/* 🔹 DEAL OF THE DAY */}
      <div className="mb-10">
        <div className="px-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <h3 className="text-xl font-bold text-slate-800 tracking-tight">Top Deals for You</h3>
             <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100">
               <Clock className="h-3.5 w-3.5" />
               <span className="text-[11px] font-bold">02 : 45 : 12 Left</span>
             </div>
          </div>
          <button onClick={() => navigate('/categories')} className="text-xs font-bold text-[#C49B3B] flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
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

      {/* 🔹 GOLD SAVINGS BANNER */}
      <div className="px-4 mb-2">
        <div className="relative h-[160px] rounded-[2.5rem] overflow-hidden group shadow-xl">
           <div className="absolute inset-0 bg-[#FDF5E6]" />
           {/* Decorative shapes */}
           <div className="absolute -right-20 -top-20 h-60 w-60 bg-amber-200/40 rounded-full blur-3xl" />
           <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-amber-400/20 rounded-full blur-2xl" />
           
           <div className="relative h-full flex items-center px-8">
              <div className="flex flex-col items-center mr-8">
                 <Star className="h-6 w-6 text-[#C49B3B] mb-1" />
                 <span className="text-xl font-black text-[#C49B3B] leading-none mb-0.5 uppercase tracking-tighter text-center">Gold<br/>Savings</span>
              </div>
              
              <div className="flex flex-col">
                 <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2">Exclusive Offers<br/>For You</h3>
                 <button className="bg-[#C49B3B] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit shadow-lg shadow-amber-900/20 active:scale-95 transition-all">
                    View Offers
                 </button>
              </div>

              <div className="ml-auto w-1/3 flex justify-end">
                  <div className="relative h-24 w-24">
                     <div className="absolute inset-0 bg-white rounded-2xl rotate-12 shadow-md" />
                     <div className="absolute inset-0 bg-[#C49B3B] rounded-2xl -rotate-6 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
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
        <div className="relative h-[180px] rounded-[2.5rem] bg-gradient-to-br from-[#E6F8E9] to-[#F7FEF8] border border-white shadow-2xl shadow-green-900/5 overflow-hidden group">
          <div className="absolute inset-0 p-8 flex flex-col justify-center">
             <span className="text-[#16A34A] text-[10px] font-black uppercase tracking-widest mb-2 bg-white/60 w-fit px-3 py-1.5 rounded-full border border-green-50">Summer Special</span>
             <h3 className="text-2xl font-black text-slate-800 leading-tight mb-1">Cool & Refreshing Drinks</h3>
             <p className="text-green-600 text-sm font-bold mb-4">Up to 30% OFF</p>
             <button className="bg-[#16A34A] text-white w-fit px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-green-900/10">
                Shop Now <ArrowRight className="h-3 w-3" />
             </button>
          </div>
          <div className="absolute right-[-10%] top-0 bottom-0 w-1/2 flex items-center justify-center p-4">
             <img 
              src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600" 
              alt="" 
              className="h-[120%] rotate-6 group-hover:rotate-0 transition-transform duration-700 object-contain filter drop-shadow-2xl" 
             />
          </div>
        </div>
      </div>
    </div>
  );
}
