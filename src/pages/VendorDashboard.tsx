import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Package, Truck, CheckCircle2, MapPin, Printer, Bell, Volume2, X, Plus, Clock, XCircle, Pencil } from 'lucide-react';
import { Order, Product } from '../types';
import { useAuth } from '../AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { apiCache } from '../lib/apiCache';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<any>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [selectedDeliveryBoys, setSelectedDeliveryBoys] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    return tabParam === 'products' ? 'products' : 'orders';
  });

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam === 'products' || tabParam === 'orders') {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const { profile } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchVendorProducts = useCallback(async (forceRefetch = false, signal?: AbortSignal) => {
    try {
      setLoading(true);
      if (!profile?.id) return;

      const vendor = await apiCache.fetchOnce<any>(`vendor_data_${profile.id}`, async () => {
        const { data, error } = await supabase.from('vendors').select('*').eq('user_id', profile.id).single();
        if (error) throw error;
        return data;
      }, { forceRefetch, signal });

      if (!vendor) return;

      const productsData = await apiCache.fetchOnce<Product[]>(`vendor_products_${profile.id}`, async () => {
        const { data, error } = await supabase.from('products').select('*, categories(name)').eq('vendor_id', vendor.id).order('created_at', { ascending: false });
        if (error) throw error;
        return data as Product[];
      }, { forceRefetch, signal });

      setProducts(productsData || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const fetchVendorOrders = useCallback(async (forceRefetch = false, signal?: AbortSignal) => {
    try {
      setLoading(true);
      if (!profile?.id) return;

      const vendor = await apiCache.fetchOnce<any>(`vendor_data_${profile.id}`, async () => {
        const { data, error } = await supabase.from('vendors').select('*').eq('user_id', profile.id).single();
        if (error) throw error;
        return data;
      }, { forceRefetch, signal });

      if (!vendor) {
        setLoading(false);
        return;
      }
      setVendorData(vendor);
      
      if (!vendor.service_area_id || !vendor.id) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const ordersData = await apiCache.fetchOnce<Order[]>(`vendor_orders_${profile.id}`, async (fetchSignal) => {
        const response = await fetch(`/api/vendor/orders?userId=${profile.id}`, { 
          headers: { 'Accept': 'application/json' },
          signal: fetchSignal 
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
      }, { forceRefetch, signal });

      setOrders(ordersData || []);

      try {
        const allBoys = await apiCache.fetchOnce<any[]>('admin_delivery_boys', async (fetchSignal) => {
          const response = await fetch('/api/admin/delivery-boys', { signal: fetchSignal });
          if (!response.ok) throw new Error('Failed to load boys');
          return await response.json();
        }, { forceRefetch, signal });

        if (allBoys) {
          const dbBoys = allBoys.filter((boy: any) => boy.service_area_id === vendor.service_area_id && boy.is_active === true);
          setDeliveryBoys(dbBoys.length === 0 ? allBoys.filter((boy: any) => boy.is_active === true) : dbBoys);
        }
      } catch (err) {}
    } catch (error: any) {
      if (error.name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const unlockAudio = () => {
      const silentAudio = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
      silentAudio.volume = 0;
      silentAudio.play().then(() => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      }).catch(e => console.warn("Audio unlock failed on dashboard interaction", e));
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    const controller = new AbortController();

    if (activeTab === 'orders') {
       fetchVendorOrders(false, controller.signal);
    } else {
       fetchVendorProducts(false, controller.signal);
    }

    return () => {
      controller.abort();
    };
  }, [profile, activeTab, fetchVendorOrders, fetchVendorProducts]);

  useEffect(() => {
    if (!vendorData?.service_area_id) return;

    const channel = supabase
      .channel('vendor-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${profile?.id}` },
        (payload) => {
          handleNewOrder(payload.new as Order);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vendorData]);

  const handleNewOrder = (order: Order) => {
    if (activeTab === 'orders') fetchVendorOrders(true);
    setNewOrderAlert(order);
    
    const audioUrl = 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    
    audio.play().catch(err => {
      const playOnInteraction = () => {
        audio.play().catch(() => {});
        window.removeEventListener('click', playOnInteraction);
        window.removeEventListener('touchstart', playOnInteraction);
      };
      window.addEventListener('click', playOnInteraction);
      window.addEventListener('touchstart', playOnInteraction);
      toast.info('New Order Received! Sound blocked - click anywhere to enable alerts.', { duration: 5000, position: 'top-center' });
    });

    setTimeout(() => { setNewOrderAlert(null); }, 10000);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'accepted' && profile?.id) updateData.vendor_id = profile.id;
      if (newStatus === 'assigned_delivery') {
        const boyId = selectedDeliveryBoys[orderId];
        if (!boyId) { toast.error('Please select a delivery boy'); return; }
        updateData.delivery_boy_id = boyId;
        updateData.status = 'out_for_delivery';
        updateData.delivery_otp = Math.floor(1000 + Math.random() * 9000).toString();
      }

      const response = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, updateData })
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to update order');
      
      if (profile?.id) {
        apiCache.invalidate(`vendor_orders_${profile.id}`);
      }
      apiCache.invalidate('admin_orders');
      setOrders(orders.map(o => o.id === orderId ? { ...o, ...updateData } : o));
      toast.success(`Order ${newStatus}`);
    } catch (error) { toast.error('Failed to update status'); }
  };

  const pendingCount = orders.filter(o => o.status === 'placed').length;
  const activeCount = orders.filter(o => ['accepted', 'packed', 'ready_for_delivery'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="relative pb-24">
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div 
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            className="fixed bottom-0 inset-x-0 sm:bottom-6 sm:inset-x-auto sm:right-6 sm:left-auto z-[100] w-full sm:w-[400px] p-4"
          >
            <div className="bg-white rounded-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] sm:shadow-2xl overflow-hidden relative border border-slate-100 pt-6">
              <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                <span className="bg-white border border-slate-100 text-sm font-bold px-5 py-2.5 rounded-full shadow-sm text-slate-700 z-10">New order</span>
              </div>
              
              <div className="p-6 pt-4 pb-0">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5">
                  <div className="bg-emerald-100 text-emerald-600 rounded-xl p-2 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-800 text-lg">Order Assigned</div>
                </div>
                
                <div className="border border-slate-100 rounded-3xl p-5 mb-5 space-y-1 relative overflow-hidden">
                   <div className="absolute top-0 w-full h-1 bg-primary left-0"></div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">DELIVER TO</div>
                  <div className="font-bold text-slate-800 line-clamp-1">{newOrderAlert.address}</div>
                  <div className="text-sm text-slate-500 line-clamp-2 mt-1">{newOrderAlert.address}, PIN: {newOrderAlert.pincode}</div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateOrderStatus(newOrderAlert.id, 'accepted').then(() => setNewOrderAlert(null))}
                    className="flex-1 mb-6 flex items-center justify-between bg-emerald-500 text-white rounded-full p-2 pr-6 overflow-hidden active:scale-95 transition-transform"
                  >
                    <div className="bg-white text-emerald-500 h-12 w-16 rounded-full flex items-center justify-center">
                      <span className="font-black tracking-tighter text-xl">{">>"}</span>
                    </div>
                    <span className="font-bold text-lg">Accept order</span>
                    <div className="w-5"></div>
                  </button>
                  <button 
                    onClick={() => setNewOrderAlert(null)}
                    className="mb-6 h-[64px] w-[64px] rounded-full border-2 border-slate-200 text-slate-400 flex items-center justify-center bg-white hover:bg-slate-50 active:scale-95 transition-transform"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Vendor Dashboard</h1>
          <p className="text-slate-500">Manage your orders and products.</p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => navigate('/vendor/products/new')}
            className="bg-primary text-slate-900 font-bold py-2.5 px-5 rounded-xl shadow-md text-sm transition-transform active:scale-95 flex items-center justify-center h-10 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Product
          </button>
          {!audioRef.current && (
           <button 
            onClick={() => {
              audioRef.current = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
              audioRef.current.play().catch(() => {});
            }}
            className="text-xs font-bold text-slate-400 hover:text-primary underline"
           >
             Enable Sound Alerts
           </button>
        )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="bg-white border rounded-xl h-14 p-1 space-x-1 shadow-sm w-full md:w-auto inline-flex overflow-x-auto justify-start mb-6">
          <TabsTrigger value="orders" className="rounded-lg px-6 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none font-bold text-slate-500 min-w-[120px]">
            <ShoppingBag className="w-4 h-4 mr-2" /> Orders
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg px-6 h-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none font-bold text-slate-500 min-w-[120px]">
            <Package className="w-4 h-4 mr-2" /> My Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="m-0 border-none p-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
                <div className="text-sm font-medium text-slate-500">Pending Orders</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
                <div className="text-sm font-medium text-slate-500">Active (Processing)</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{deliveredCount}</div>
                <div className="text-sm font-medium text-slate-500">Delivered Orders</div>
              </div>
            </div>
          </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900">All Orders</h2>
        <div className="flex gap-4 text-xs font-bold items-center bg-white p-1 rounded-full border border-slate-100 shadow-sm">
          <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Pickup Request</span>
          <span className="text-slate-400 px-3 py-1.5">Delivery Request</span>
        </div>
      </div>
      
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
          <Truck className="h-12 w-12 mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No orders yet</h3>
          <p>When customers in your assigned area place orders, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-50/50 rounded-[2.5rem] p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col gap-6 relative transition-all hover:bg-slate-100/50">
              <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest px-2 pt-2">
                <span>Order ID:</span>
                <span className="text-slate-900 font-mono text-sm max-w-[150px] truncate">#{order.id.split('-')[0]}</span>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 relative shadow-sm">
                <div className="relative pl-10 space-y-10 before:absolute before:left-[21px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100 before:-z-0">
                  <div className="relative z-10">
                    <div className="absolute -left-[45px] top-0 w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center border-4 border-white">
                      <Package className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pick-up Order</div>
                    <div className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2">{vendorData?.store_name || 'Store'}</div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="absolute -left-[45px] top-0 w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-white">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Deliver Order</div>
                    <div className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2">{order.address}</div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-6 text-[15px] font-bold text-slate-600 px-2">
                  <div className="flex items-center gap-2 whitespace-nowrap"><span className="text-slate-300">🏷️</span> ₹{order.total_amount}</div>
                  <div className="flex items-center gap-2 whitespace-nowrap"><span className="text-slate-300">⏱️</span> {order.created_at ? format(new Date(order.created_at), 'HH:mm') : '--:--'}</div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-slate-300">📍</span> 
                    {(order.payment_method || 'COD').toUpperCase()}
                  </div>
                </div>

                {/* Additional Comment/Instructions could go here in future */}
              </div>

              {order.status === 'placed' && (
                <button 
                  onClick={() => updateOrderStatus(order.id, 'accepted')}
                  className="w-full py-5 bg-amber-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                >
                  Pick Order
                </button>
              )}

              {order.status === 'accepted' && (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => navigate(`/vendor/print/${order.id}`)}
                    className="py-4 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-bold uppercase tracking-wide hover:bg-slate-50 transition-colors"
                  >
                    Label
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'packed')}
                    className="py-4 bg-primary text-black rounded-[1.5rem] font-black uppercase tracking-wide hover:bg-yellow-400 active:scale-95 shadow-md shadow-primary/20 transition-all"
                  >
                    Pack
                  </button>
                </div>
              )}

              {order.status === 'packed' && (
                <button 
                  onClick={() => updateOrderStatus(order.id, 'ready_for_delivery')}
                  className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  Ready for Delivery
                </button>
              )}

              {order.status === 'ready_for_delivery' && !order.delivery_boy_id && (
                <div className="flex flex-col gap-3">
                  <select
                    className="w-full p-4 border border-slate-200 rounded-[1.5rem] bg-white font-bold text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={selectedDeliveryBoys[order.id] || ''}
                    onChange={(e) => setSelectedDeliveryBoys({ ...selectedDeliveryBoys, [order.id]: e.target.value })}
                  >
                    <option value="">Select Delivery Boy</option>
                    {deliveryBoys.map((boy: any) => (
                      <option key={boy.id} value={boy.id}>{boy.full_name || boy.email} ({boy.vehicle_type || 'BIKE'})</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'assigned_delivery')}
                    className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                  >
                    Assign Delivery Boy
                  </button>
                </div>
              )}

              {order.status === 'ready_for_delivery' && order.delivery_boy_id && (
                 <div className="w-full flex-col p-4 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black uppercase tracking-wide flex items-center justify-center gap-2 border border-slate-200 justify-self-end">
                    <div className="flex gap-2 items-center"><Truck className="w-5 h-5 text-sky-500" /> Waiting for delivery boy to accept...</div>
                 </div>
              )}

              {(order.status === 'picked' || order.status === 'out_for_delivery' || order.status === 'delivered') && (
                <div className="w-full flex-col p-4 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black uppercase tracking-wide flex items-center justify-center gap-2 border border-slate-200 justify-self-end">
                   {order.status === 'delivered' ? (
                     <div className="flex gap-2 items-center"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Delivered</div>
                   ) : (
                     <div className="flex flex-col items-center gap-2 w-full text-center text-sm">
                       <span className="flex gap-2 items-center"><Truck className="w-5 h-5 text-sky-500" /> Track: {order.status}</span>
                       {order.delivery_otp && (
                         <div className="mt-2 py-2 px-6 rounded-xl bg-sky-200 text-sky-800 tracking-[0.3em] font-mono text-xl w-full">
                           OTP: {order.delivery_otp}
                         </div>
                       )}
                     </div>
                   )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </TabsContent>

      <TabsContent value="products" className="m-0 border-none p-0 outline-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900">My Products</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Package className="h-12 w-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No products yet</h3>
            <p className="mb-4">You haven't uploaded any products.</p>
            <button
              onClick={() => navigate('/vendor/products/new')}
              className="bg-primary text-slate-900 font-bold py-2.5 px-5 rounded-xl text-sm"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.image_url || `https://placehold.co/100x100?text=${encodeURIComponent(product.name)}`} 
                          alt="" 
                          className="h-10 w-10 rounded-lg object-cover border bg-slate-50"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{product.name}</span>
                          <span className="text-xs text-slate-400 font-normal line-clamp-1 max-w-[200px]">
                            {product.brand || 'No Brand'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{(product as any).categories?.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">₹{product.price}</TableCell>
                    <TableCell>
                      {(() => {
                        const stock_val = typeof product.stock_units === 'number' ? product.stock_units : (product.stock !== undefined ? product.stock : 0);
                        return (
                          <span className={stock_val <= 0 ? 'text-red-600 font-black bg-red-50 px-2 py-1 rounded uppercase min-w-[max-content] inline-block text-[10px]' : stock_val < 5 ? 'text-orange-500 font-bold' : 'font-semibold text-slate-700'}>
                            {stock_val <= 0 ? 'Out of Stock' : stock_val}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {product.verification_status === 'pending' && <span className="bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-yellow-200">Pending Approval</span>}
                      {product.verification_status === 'approved' && <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-green-200">Live</span>}
                      {product.verification_status === 'rejected' && (
                        <div className="flex flex-col gap-1">
                           <span className="bg-red-50 text-red-700 w-fit px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-200">Rejected</span>
                           <span className="text-[10px] text-red-600 max-w-[150px] leading-tight font-medium" title={product.admin_comments || ''}>
                             {product.admin_comments ? `Reason: ${product.admin_comments}` : ''}
                           </span>
                        </div>
                      )}
                      {(!product.verification_status || product.verification_status === 'draft') && <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-200">Draft</span>}
                    </TableCell>
                    <TableCell className="text-right">
                       <button onClick={() => navigate(`/vendor/products/new?id=${product.id}`)} className="text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-slate-50"><Pencil className="h-4 w-4" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
}
