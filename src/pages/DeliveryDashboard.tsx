import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Menu, Navigation, CheckCircle2, MapPin, Search, Tag, Clock, Send, ChevronRight, Check, Package, Home as HomeIcon, FileText, Briefcase, History, User, FileDigit, RefreshCw, ChevronDown, LogOut, Truck } from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { SwipeToAcceptButton } from '../components/SwipeToAcceptButton';
import { apiCache } from '../lib/apiCache';

type TabType = 'home' | 'orders' | 'available' | 'history' | 'profile';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'assigned' | 'accepted'>('all');
  
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const { profile, signOut } = useAuth();
  
  // Profile specific state
  const [isAvailable, setIsAvailable] = useState(true);
  const [deliveryBoyInfo, setDeliveryBoyInfo] = useState<any>(null);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const seenOrderAlerts = useRef<Set<string>>(new Set());

  const fetchDeliveryBoyInfo = useCallback(async (forceRefetch = false, signal?: AbortSignal) => {
    try {
      if (!profile?.id) return;

      const info = await apiCache.fetchOnce<any>(`delivery_boy_info_${profile.id}`, async () => {
        const { data, error } = await supabase
          .from('delivery_boys')
          .select('*')
          .eq('user_id', profile.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching delivery boy info:", error);
          throw error;
        }
        
        if (data) {
          let areaData = null;
          if (data.service_area_id) {
             const { data: area } = await supabase.from('service_areas').select('name').eq('id', data.service_area_id).single();
             if (area) areaData = area;
          }
          return {
             ...data,
             full_name: data.full_name || data.name || profile?.name || 'Delivery Boy',
             service_areas: areaData
          };
        } else {
           const dummyData = {
             user_id: profile.id,
             name: profile.name || 'New Delivery Boy',
             full_name: profile.name || 'New Delivery Boy',
             phone: '+91 9999999999',
             email: profile.email || '',
             vehicle_type: 'BIKE',
             is_active: true,
             created_at: new Date().toISOString()
           };
           
           const { data: newDbBoy, error: insertError } = await supabase
             .from('delivery_boys')
             .insert(dummyData)
             .select('*')
             .single();
              
           if (!insertError && newDbBoy) {
              return {...newDbBoy, full_name: newDbBoy.full_name || newDbBoy.name || profile.name };
           } else {
              return dummyData;
           }
        }
      }, { forceRefetch, signal });

      if (info) {
        setDeliveryBoyInfo(info);
        setIsAvailable(info.is_active ?? true);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error("Exception fetching delivery boy info:", e);
    }
  }, [profile]);

  const fetchDeliveryOrders = useCallback(async (forceRefetch = false, signal?: AbortSignal) => {
    try {
      setLoading(true);
      if (!profile?.id) return;
      
      const ordersData = await apiCache.fetchOnce<Order[]>(`delivery_orders_${profile.id}`, async (fetchSignal) => {
        const response = await fetch(`/api/delivery/orders?userId=${profile.id}`, { signal: fetchSignal });
        if (!response.ok) {
          throw new Error('Failed to fetch delivery orders');
        }
        return await response.json();
      }, { forceRefetch, signal });

      setOrders(ordersData || []);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching delivery orders:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.id) {
      const controller = new AbortController();
      fetchDeliveryOrders(false, controller.signal);
      fetchDeliveryBoyInfo(false, controller.signal);
      return () => {
        controller.abort();
      };
    }
  }, [profile, fetchDeliveryOrders, fetchDeliveryBoyInfo]);

  useEffect(() => {
    // Check for NEW available orders to show the alert automatically
    const availableOrders = orders.filter(o => o.status === 'ready_for_delivery');
    for (const order of availableOrders) {
      if (!seenOrderAlerts.current.has(order.id)) {
        seenOrderAlerts.current.add(order.id);
        if (!newOrderAlert) {
           setNewOrderAlert(order);
        }
      }
    }
  }, [orders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'out_for_delivery') {
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (orderToUpdate && !orderToUpdate.delivery_otp) {
           updateData.delivery_otp = Math.floor(1000 + Math.random() * 9000).toString();
        }
      }

      const response = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          updateData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      if (profile?.id) {
        apiCache.invalidate(`delivery_orders_${profile.id}`);
        apiCache.invalidate(`vendor_orders_${profile.id}`);
      }
      apiCache.invalidate('admin_orders');

      setOrders(orders.map(o => o.id === orderId ? { ...o, ...updateData } : o));
      if (newOrderAlert?.id === orderId) {
        setNewOrderAlert(null);
        setCurrentTab('orders'); // Jump to orders tab
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const verifyOtpAndDeliver = async (order: Order) => {
    const input = otpInputs[order.id];
    if (!input || input.length !== 4) {
      toast.error('Please enter a 4-digit OTP');
      return;
    }
    if (input !== order.delivery_otp) {
      toast.error('Invalid OTP');
      return;
    }

    try {
      const updateData = {
        status: 'delivered',
        delivered_at: new Date().toISOString()
      };
      
      const response = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          updateData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete delivery!');
      }
      
      if (profile?.id) {
        apiCache.invalidate(`delivery_orders_${profile.id}`);
        apiCache.invalidate(`vendor_orders_${profile.id}`);
      }
      apiCache.invalidate('admin_orders');

      toast.success('🎉 Delivery Successful!');
      
      // Update local state and trigger animation/rerender
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'delivered' } : o));
      setOtpInputs({ ...otpInputs, [order.id]: '' });
      setDeliveryBoyInfo((prev: any) => ({
        ...prev,
        commission_balance: (prev?.commission_balance || 0) + (order.delivery_fee || 50)
      }));
      
    } catch (err: any) {
       toast.error(err.message || 'Failed to complete delivery');
    }
  };

  const dashboardStats = {
    assigned: orders.filter(o => o.status === 'ready_for_delivery').length,
    pickedUp: orders.filter(o => ['picked', 'out_for_delivery'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    total: orders.length,
    earnings: deliveryBoyInfo?.commission_balance || 0
  };

  const availableOrders = orders.filter(o => o.status === 'ready_for_delivery');

  return (
    <div className="bg-[#EAF5F5] min-h-screen font-sans md:py-8 flex justify-center selection:bg-teal-200">
      {/* Mobile container - to make it look like the app on desktop too */}
      <div className="w-full max-w-md bg-[#F4F9F9] min-h-screen md:min-h-[850px] md:h-[850px] md:rounded-[40px] shadow-2xl overflow-x-hidden relative border border-slate-200">
        
        {/* Background gradient */}
        <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#e0f1f1] to-transparent pointer-events-none z-0"></div>

        <div className="relative z-10 pb-28 h-full overflow-y-auto custom-scrollbar">
          {/* TAB CONTENT */}

          {currentTab === 'home' && (
            <div className="px-6 pt-12 pb-6">
              <div className="mb-8 flex justify-between items-start">
                <div>
                  <p className="text-slate-500 font-medium mb-1">Hii, {profile?.name || 'delivery_boy'}</p>
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Home</h1>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                      Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-gradient-to-br from-[#c8e6e6] to-[#d6eeee] p-5 rounded-3xl shadow-[0_4px_20px_rgba(20,100,100,0.1)] mb-6 border border-teal-50">
                <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold bg-white/40 w-fit px-3 py-1.5 rounded-xl shadow-sm">
                  <FileDigit className="w-4 h-4" />
                  Your stats
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:bg-white transition-colors">
                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center"><FileText className="w-3 h-3 text-indigo-600"/></div>
                       Assigned
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{dashboardStats.assigned}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:bg-white transition-colors">
                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center"><Truck className="w-3 h-3 text-teal-600"/></div>
                       Picked up
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{dashboardStats.pickedUp}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:bg-white transition-colors">
                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-emerald-600"/></div>
                       Delivered
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{dashboardStats.delivered}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:bg-white transition-colors">
                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center"><Package className="w-3 h-3 text-cyan-600"/></div>
                       Total
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{dashboardStats.total}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:bg-white transition-colors">
                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center"><FileText className="w-3 h-3 text-violet-600"/></div>
                       Orders
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">{dashboardStats.total}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:bg-white transition-colors">
                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center"><span className="font-bold text-blue-600 text-xs">₹</span></div>
                       Earnings
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">₹{dashboardStats.earnings.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-2xl flex gap-3 text-emerald-800 text-[13px] font-semibold leading-relaxed shadow-sm mb-12">
                 <div className="mt-[3px] shrink-0"><div className="w-4 h-4 rounded-full border-2 border-emerald-500 relative"><div className="absolute inset-[2px] rounded-full bg-emerald-500"></div></div></div>
                 <div>
                   Live tracking activated for user order. Your location is being shared with user for live order tracking.
                 </div>
              </div>

              <div className="text-center text-slate-400 font-medium px-8 leading-relaxed text-sm">
                Order list moved to the Orders tab for cleaner navigation.
              </div>
            </div>
          )}

          {currentTab === 'orders' && (
            <div className="px-6 pt-12 pb-6">
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-teal-800 border border-teal-50">
                   <Truck className="w-6 h-6"/>
                 </div>
                 <div>
                   <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Orders</h1>
                   <p className="text-slate-500 text-[13px] font-medium">Manage delivery flow</p>
                 </div>
               </div>

               {/* Search */}
               <div className="mt-6 mb-5 relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Search orders, address, status..."
                   className="w-full bg-white border border-slate-100 focus:border-teal-200 py-3.5 pl-12 pr-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] outline-none font-medium text-slate-700 placeholder:text-slate-400 transition-all focus:shadow-md"
                 />
               </div>

               {/* Notice Banner */}
               <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-2xl flex gap-3 text-emerald-800 text-[12px] font-semibold leading-relaxed shadow-sm mb-6">
                 <div className="mt-0.5 shrink-0"><div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 relative"><div className="absolute inset-[2px] rounded-full bg-emerald-500"></div></div></div>
                 <div>
                   Live tracking activated for user order. Your location is being shared with user for live order tracking.
                 </div>
              </div>

              {/* Filters gap-3 */}
              <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 shrink-0 scrollbar-hide -mx-6 px-6">
                <button 
                  onClick={() => setOrdersFilter('all')}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${ordersFilter === 'all' ? 'bg-[#c8e6e6] text-teal-900 border border-teal-200' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                >
                  <FileText className="w-4 h-4"/> All Orders
                </button>
                <button 
                  onClick={() => setOrdersFilter('assigned')}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${ordersFilter === 'assigned' ? 'bg-[#c8e6e6] text-teal-900 border border-teal-200' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                >
                  <Package className="w-4 h-4 text-purple-500"/> Assigned
                </button>
                <button 
                  onClick={() => setOrdersFilter('accepted')}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${ordersFilter === 'accepted' ? 'bg-[#c8e6e6] text-teal-900 border border-teal-200' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-orange-500"/> Accepted
                </button>
              </div>

              {/* Order Count / Refresh */}
              <div className="flex justify-between items-center bg-white py-3.5 px-5 rounded-2xl shadow-sm mb-6 border border-slate-100">
                 <div className="flex items-center gap-2.5 font-extrabold text-slate-800 text-sm">
                   <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><FileText className="w-4 h-4"/></div>
                   {orders.filter(o => {
                    if (ordersFilter === 'all') return true;
                    if (ordersFilter === 'assigned') return ['ready_for_delivery', 'picked'].includes(o.status);
                    if (ordersFilter === 'accepted') return ['out_for_delivery', 'delivered'].includes(o.status);
                    return true;
                  }).length} order(s)
                 </div>
                 <button onClick={fetchDeliveryOrders} className="text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
                   Pull to refresh
                 </button>
              </div>

              {/* Orders List */}
              <div className="space-y-5">
                {orders.filter(o => {
                  if (ordersFilter === 'all') return true;
                  if (ordersFilter === 'assigned') return ['ready_for_delivery', 'picked'].includes(o.status);
                  if (ordersFilter === 'accepted') return ['out_for_delivery', 'delivered'].includes(o.status);
                  return true;
                }).map(order => {
                  const commission = order.total_amount * 0.1;
                  return (
                  <div key={order.id} className="bg-white rounded-3xl p-5 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-slate-50/50 rounded-bl-full pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Order</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">#{order.id.split('-')[0].toUpperCase()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Commission</div>
                        <div className="text-xl font-black text-teal-600">₹{commission.toFixed(2)}</div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-1">Order total ₹{order.total_amount.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-orange-800 font-bold mb-5 shadow-sm">
                       <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><span className="font-extrabold text-sm">₹</span></div> 
                       Collect (COD): ₹{order.total_amount.toFixed(2)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          <Package className="w-3.5 h-3.5"/> Payment
                        </div>
                        <div className="font-bold text-slate-700 leading-tight">
                           {order.payment_method === 'cod' ? 'CashOnDelivery' : 'Prepaid'}
                        </div>
                      </div>
                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          <Clock className="w-3.5 h-3.5"/> Delivery time
                        </div>
                        <div className="font-bold text-slate-700 leading-snug text-sm">
                           {new Date(order.created_at).toLocaleDateString([], {day: '2-digit', month: 'short', year: 'numeric'})},<br/>
                           {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-5">
                       <div className="flex items-center gap-2">
                         <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                            order.status === 'ready_for_delivery' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            order.status === 'picked' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            order.status === 'out_for_delivery' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                         }`}>
                           <span className="w-2 h-2 inline-block rounded-full bg-current mr-2 opacity-80"></span>
                           {order.status.replace(/_/g, ' ').toUpperCase()}
                         </div>
                       </div>
                       
                       {/* Dropdown for action */}
                       {order.status !== 'out_for_delivery' && (
                         <div className="relative group cursor-pointer">
                           <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                             <ChevronDown className="w-5 h-5 text-slate-400" />
                           </div>
                           <div className="absolute bottom-full right-0 mb-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 hidden group-hover:block z-20">
                              {order.status === 'ready_for_delivery' && (
                                <button onClick={() => updateOrderStatus(order.id, 'picked')} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl font-bold text-sm text-slate-700">Mark Picked</button>
                              )}
                              {order.status === 'picked' && (
                                <button onClick={() => updateOrderStatus(order.id, 'out_for_delivery')} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl font-bold text-sm text-slate-700">Start Delivery</button>
                              )}
                              {order.status === 'delivered' && (
                                <button className="w-full text-left px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm opacity-60 cursor-not-allowed">Already Delivered</button>
                              )}
                           </div>
                         </div>
                       )}
                    </div>
                    {order.status === 'out_for_delivery' && (
                      <div className="mt-4 flex items-center gap-3 bg-sky-50 p-3 rounded-[1.5rem] border border-sky-100">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Enter 4-digit OTP"
                          value={otpInputs[order.id] || ''}
                          onChange={(e) => setOtpInputs({ ...otpInputs, [order.id]: e.target.value.replace(/\D/g, '') })}
                          className="flex-1 bg-white font-mono text-center tracking-[0.5em] text-lg font-bold rounded-xl p-3 outline-none focus:ring-2 focus:ring-sky-200 border border-slate-200"
                        />
                        <button
                          onClick={() => verifyOtpAndDeliver(order)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3.5 rounded-xl uppercase tracking-widest active:scale-95 transition-all text-sm shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                        >
                          Verify & Deliver
                        </button>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          )}

          {currentTab === 'available' && (
            <div className="px-6 pt-12">
               <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-8">Available Orders</h1>
               <div className="space-y-4">
                  {availableOrders.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium text-lg">No new orders waiting</p>
                    </div>
                  ) : (
                    availableOrders.map(order => (
                      <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                           <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-blue-100">
                             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span> New
                           </div>
                           <div className="font-mono font-bold text-slate-500 text-sm">#{order.id.split('-')[0].toUpperCase()}</div>
                        </div>
                        <div className="font-bold text-lg mb-1 leading-tight">{order.address}</div>
                        <div className="text-slate-500 text-sm font-medium mb-6">Pincode: <span className="font-bold text-slate-700">{order.pincode}</span></div>
                        <SwipeToAcceptButton 
                          onAccept={() => updateOrderStatus(order.id, 'picked')}
                        />
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}

          {currentTab === 'profile' && (
            <div className="px-6 pt-12 pb-6">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-teal-800 border border-teal-50">
                   <User className="w-6 h-6"/>
                 </div>
                 <div>
                   <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profile</h1>
                   <p className="text-slate-500 text-[13px] font-medium">Account & preferences</p>
                 </div>
              </div>

              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col items-center mb-5 text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-bl-full pointer-events-none"></div>
                 <div className="w-24 h-24 rounded-full bg-[#Eaf5f5] text-teal-700 flex items-center justify-center text-3xl font-black mb-4 border-4 border-white shadow-md relative z-10">
                   {profile?.name?.charAt(0).toUpperCase() || 'D'}
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 mb-1 relative z-10">{deliveryBoyInfo?.full_name || profile?.name || 'Loading...'}</h2>
                 <div className="flex items-center gap-2 mb-6">
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">★ 4.8</span>
                    <p className="text-slate-500 font-medium text-[15px] relative z-10">{deliveryBoyInfo?.email || profile?.email || 'Loading...'}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 w-full relative z-10">
                   <div className="bg-[#Eaf5f5] text-teal-800 p-4 rounded-2xl flex flex-col items-center justify-center border border-teal-100 shadow-sm">
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Earnings</div>
                      <div className="font-extrabold text-xl">₹{dashboardStats.earnings.toFixed(2)}</div>
                   </div>
                   <div className="bg-[#Eaf5f5] text-teal-800 p-4 rounded-2xl flex flex-col items-center justify-center border border-teal-100 shadow-sm">
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Deliveries</div>
                      <div className="font-extrabold text-xl">{dashboardStats.delivered}</div>
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-[24px] px-6 py-5 shadow-sm border border-slate-100 flex items-center justify-between mb-5">
                 <div>
                   <div className="font-bold text-slate-900 mb-1 text-[15px]">Available for new orders</div>
                   <div className="text-slate-500 text-xs font-medium">You can receive assignments</div>
                 </div>
                 <button 
                  onClick={() => setIsAvailable(!isAvailable)} 
                   className={`w-14 h-[30px] rounded-full p-1 transition-colors ${isAvailable ? 'bg-teal-600' : 'bg-slate-200'}`}
                 >
                   <div className={`w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform ${isAvailable ? 'translate-x-[26px]' : 'translate-x-0'}`}></div>
                 </button>
              </div>

              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 relative overflow-hidden mb-5">
                 <div className="flex items-center gap-3 font-bold text-slate-800 mb-8 mt-2">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100"><Briefcase className="w-5 h-5"/></div>
                    <span className="text-lg">Work Details</span>
                 </div>

                 <div className="space-y-4">
                   <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                     <span className="text-slate-500 font-medium text-[13px]">Assigned Area</span>
                     <span className="font-bold text-slate-800">{deliveryBoyInfo?.service_areas?.name || 'Not assigned'}</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                     <span className="text-slate-500 font-medium text-[13px]">Vehicle Type</span>
                     <span className="font-bold text-slate-800 uppercase">{deliveryBoyInfo?.vehicle_type || 'N/A'}</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                     <span className="text-slate-500 font-medium text-[13px]">Commission Rate</span>
                     <span className="font-bold text-emerald-600">10% per order</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                     <span className="text-slate-500 font-medium text-[13px]">Joining Date</span>
                     <span className="font-bold text-slate-800">{deliveryBoyInfo?.created_at ? new Date(deliveryBoyInfo.created_at).toLocaleDateString() : 'N/A'}</span>
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 relative overflow-hidden mb-5">
                 <div className="flex items-center gap-3 font-bold text-slate-800 mb-8 mt-2">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100"><User className="w-5 h-5"/></div>
                    <span className="text-lg">Personal Info</span>
                 </div>

                 <div className="space-y-5">
                   <div>
                     <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Full Name</label>
                     <div className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl font-bold text-slate-700">
                       {deliveryBoyInfo?.full_name || profile?.name || 'Loading...'}
                     </div>
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Phone</label>
                     <div className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl font-bold text-slate-700">
                       {deliveryBoyInfo?.phone || 'N/A'}
                     </div>
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Email</label>
                     <div className="w-full bg-slate-50 border border-slate-100 py-4 px-5 rounded-2xl font-bold text-slate-700">
                       {profile?.email}
                     </div>
                   </div>
                 </div>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                <button
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-colors"
                  onClick={signOut}
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </div>
          )}

          {currentTab === 'history' && (
            <div className="px-6 pt-12 flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
               <History className="w-16 h-16 mb-4 opacity-20" />
               <h2 className="text-xl font-bold text-slate-600 mb-2">History empty</h2>
               <p className="text-sm font-medium text-center">Past deliveries will appear here once completed.</p>
            </div>
          )}
        </div>

        {/* Floating "Test Modal" Button for development */}
        {availableOrders.length > 0 && currentTab !== 'available' && (
           <button 
             onClick={() => setNewOrderAlert(availableOrders[0])}
             className="absolute top-4 right-4 z-50 bg-[#F0A500] text-white p-2 rounded-xl shadow-lg text-xs font-bold animate-bounce hidden md:block"
           >
             Trigger Alert
           </button>
        )}

        {/* Modal Overlay matching the requested design */}
        <AnimatePresence>
          {newOrderAlert && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-[#FFD12A] flex flex-col pt-[15%] items-center justify-between overflow-hidden"
            >
              {/* Subtle background blob */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFDE59] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

              <h1 className="text-[44px] leading-[1.05] font-extrabold text-slate-900 px-6 w-full text-left max-w-md relative z-10">
                Start delivering<br/>orders instantly
              </h1>

              {/* The "Greyed out App" background + Modal Container */}
              <div className="w-full flex-1 mt-16 bg-slate-900/10 backdrop-blur-sm flex flex-col justify-end relative shadow-inner">
                {/* The white bottom sheet */}
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full max-w-md mx-auto bg-white rounded-t-3xl pt-0 pb-10 relative shadow-[0_-20px_40px_rgba(0,0,0,0.15)]"
                >
                  
                  {/* Badge overriding border */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <div className="bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] relative overflow-hidden font-bold flex items-center justify-center h-[38px] px-6 text-slate-700">
                      {/* Top progress bar simulated */}
                      <div className="absolute top-0 left-0 h-[3px] bg-blue-100 w-full"></div>
                      <div className="absolute top-0 left-0 h-[3px] bg-blue-600 w-2/3"></div>
                      <span className="text-[15px] relative z-10 font-bold whitespace-nowrap pt-0.5 tracking-tight">New order</span>
                    </div>
                  </div>

                  <div className="px-5 pt-10 pb-4">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.04)] overflow-hidden relative">

                      <div className="p-4 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 relative border border-emerald-100">
                           <Check className="w-4 h-4 stroke-[3]" />
                           <div className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center"><Package className="w-2.5 h-2.5 text-slate-600" /></div>
                        </div>
                        <div className="font-bold text-slate-800 text-[17px] tracking-tight">Order already packed</div>
                      </div>

                      <div className="p-5 pb-6">
                        <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1.5">Pickup from</div>
                        <div className="font-bold text-slate-900 text-[18px] leading-tight mb-2">
                          Vendor Store ({newOrderAlert.service_area_id?.split('-')[0]?.toUpperCase()})
                        </div>
                        <div className="text-[14px] font-medium text-slate-600 leading-[1.6]">
                          Destination: <span className="font-semibold">{newOrderAlert.address}</span><br/>
                          Pincode: {newOrderAlert.pincode}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accept Button Swiper */}
                  <div className="px-5">
                    <SwipeToAcceptButton 
                      onAccept={() => updateOrderStatus(newOrderAlert.id, 'picked')}
                      onCancel={() => setNewOrderAlert(null)}
                    />
                  </div>

                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM NAVIGATION FIXED TO CONTAINER */}
        <div className="fixed md:absolute bottom-0 w-full max-w-md bg-white border-t border-slate-100 flex items-center justify-between px-6 py-[14px] z-[100] md:rounded-b-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
           <button 
            onClick={() => setCurrentTab('home')} 
             className={`flex flex-col items-center gap-1 transition-colors ${currentTab === 'home' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'home' ? 'bg-[#Eaf5f5] scale-110' : ''}`}>
               <HomeIcon className="w-[22px] h-[22px]" fill={currentTab === 'home' ? 'currentColor' : 'none'} strokeWidth={currentTab==='home' ? 0 : 2} />
             </div>
             <span className={`text-[10px] font-bold transition-all ${currentTab==='home' ? 'opacity-100' : 'opacity-70'}`}>Home</span>
           </button>
           
           <button 
             onClick={() => setCurrentTab('orders')} 
             className={`flex flex-col items-center gap-1 transition-colors ${currentTab === 'orders' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'orders' ? 'bg-[#Eaf5f5] scale-110' : ''}`}>
               <FileText className="w-[22px] h-[22px]" fill={currentTab === 'orders' ? 'currentColor' : 'none'} strokeWidth={currentTab==='orders' ? 0 : 2} />
             </div>
             <span className={`text-[10px] font-bold transition-all ${currentTab==='orders' ? 'opacity-100' : 'opacity-70'}`}>Orders</span>
           </button>

           <button 
             onClick={() => setCurrentTab('available')} 
             className={`flex flex-col items-center gap-1 transition-colors ${currentTab === 'available' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'} relative`}
           >
             <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'available' ? 'bg-[#Eaf5f5] scale-110' : ''}`}>
               <Briefcase className="w-[22px] h-[22px]" fill={currentTab === 'available' ? 'currentColor' : 'none'} strokeWidth={currentTab==='available' ? 0 : 2} />
               {availableOrders.length > 0 && (
                 <span className="absolute top-0 right-1 w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">{availableOrders.length}</span>
               )}
             </div>
             <span className={`text-[10px] font-bold transition-all ${currentTab==='available' ? 'opacity-100' : 'opacity-70'}`}>Available</span>
           </button>

           <button 
             onClick={() => setCurrentTab('history')} 
             className={`flex flex-col items-center gap-1 transition-colors ${currentTab === 'history' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'history' ? 'bg-[#Eaf5f5] scale-110' : ''}`}>
               <History className="w-[22px] h-[22px]" fill={currentTab === 'history' ? 'currentColor' : 'none'} strokeWidth={currentTab==='history' ? 0 : 2} />
             </div>
             <span className={`text-[10px] font-bold transition-all ${currentTab==='history' ? 'opacity-100' : 'opacity-70'}`}>History</span>
           </button>

           <button 
             onClick={() => setCurrentTab('profile')} 
             className={`flex flex-col items-center gap-1 transition-colors ${currentTab === 'profile' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <div className={`p-1.5 rounded-xl transition-all ${currentTab === 'profile' ? 'bg-[#Eaf5f5] scale-110' : ''}`}>
               <User className="w-[22px] h-[22px]" fill={currentTab === 'profile' ? 'currentColor' : 'none'} strokeWidth={currentTab==='profile' ? 0 : 2} />
             </div>
             <span className={`text-[10px] font-bold transition-all ${currentTab==='profile' ? 'opacity-100' : 'opacity-70'}`}>Profile</span>
           </button>
        </div>

      </div>
    </div>
  );
}
