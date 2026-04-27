import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Package, Truck, CheckCircle2, MapPin, Printer, Bell, Volume2, X } from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function VendorDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<any>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchVendorOrders();
    }
  }, [profile]);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/sounds/alert.mp3');
    audioRef.current.volume = 1.0;

    if (!vendorData?.id) return;

    // Subscribe to new orders
    const channel = supabase
      .channel('vendor-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorData.id}`
        },
        (payload) => {
          console.log('New order received:', payload.new);
          handleNewOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorData]);

  const handleNewOrder = (order: Order) => {
    // Add to state if not already there
    setOrders(prev => [order, ...prev]);
    
    // Set alert
    setNewOrderAlert(order);
    
    // Play sound
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.warn('Audio playback failed (interaction required?):', err);
        toast.info('New Order Received! (Sound blocked by browser)');
      });
    }

    // Auto-dismiss alert after 10 seconds
    setTimeout(() => {
      setNewOrderAlert(null);
    }, 10000);
  };

  const fetchVendorOrders = async () => {
    try {
      // 1. Fetch vendor record for the current user
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', profile?.id)
        .single();
        
      if (vendorError || !vendor) {
        setLoading(false);
        return;
      }

      setVendorData(vendor);

      // 2. Fetch orders assigned to this vendor_id
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setOrders(orders || []);
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'placed':
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'accepted':
      case 'confirmed': 
      case 'packed': return 'bg-blue-100 text-blue-800';
      case 'ready_for_delivery':
      case 'picked': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'rejected':
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const pendingCount = orders.filter(o => ['pending', 'placed'].includes(o.status)).length;
  const activeCount = orders.filter(o => ['accepted', 'confirmed', 'packed', 'ready_for_delivery', 'picked', 'out_for_delivery'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="relative">
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
          >
            <div className="bg-primary text-white p-6 rounded-3xl shadow-2xl border-4 border-white flex items-center justify-between gap-6 overflow-hidden relative">
              {/* Background accent */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <Bell className="h-8 w-8 text-white fill-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">New Order Received!</h3>
                  <p className="text-primary-foreground/90 font-medium mt-0.5">Order ID: <span className="font-mono">#{newOrderAlert.id.split('-')[0].toUpperCase()}</span></p>
                  <p className="text-sm font-bold mt-1 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded">
                     <Volume2 className="h-3 w-3" /> Loud Alert Active
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setNewOrderAlert(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Vendor Dashboard</h1>
          <p className="text-slate-500">Manage incoming orders assigned to your area.</p>
        </div>
        {!audioRef.current && (
           <button 
            onClick={() => {
              audioRef.current = new Audio('/sounds/alert.mp3');
              audioRef.current.play().catch(() => {});
            }}
            className="text-xs font-bold text-slate-400 hover:text-primary underline"
           >
             Enable Sound Alerts
           </button>
        )}
      </div>

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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">Recent Assigned Orders</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Truck className="h-12 w-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No orders yet</h3>
            <p>When customers in your assigned pincodes place orders, they will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4 py-3">Order ID</th>
                <th className="p-4 py-3">Customer</th>
                <th className="p-4 py-3">Location</th>
                <th className="p-4 py-3">Amount</th>
                <th className="p-4 py-3">Status</th>
                <th className="p-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr 
                  key={order.id} 
                  className={`transition-colors ${
                    newOrderAlert?.id === order.id 
                    ? 'bg-primary/10 animate-pulse' 
                    : 'hover:bg-slate-50/50'
                  }`}
                >
                  <td className="p-4 font-mono text-sm uppercase">#{order.id.split('-')[0]}</td>
                  <td className="p-4 font-medium text-slate-900 text-xs font-mono">{order.user_id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="h-3 w-3" />
                      {order.pincode}
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-slate-900">₹{order.total_amount}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {(order.status === 'pending' || order.status === 'placed') && (
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'accepted')}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded flex items-center gap-1 text-sm font-medium hover:bg-blue-100"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'rejected')}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded flex items-center gap-1 text-sm font-medium hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {(order.status === 'accepted' || order.status === 'confirmed') && (
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => navigate(`/vendor/print/${order.id}`)}
                          className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded flex items-center gap-1 text-sm font-medium hover:bg-slate-100"
                        >
                          <Printer className="h-4 w-4" /> Print Label
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'packed')}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded flex items-center gap-1 text-sm font-medium hover:bg-indigo-100"
                        >
                          Mark Packed
                        </button>
                      </div>
                    )}
                    {order.status === 'packed' && (
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => navigate(`/vendor/print/${order.id}`)}
                          className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded flex items-center gap-1 text-sm font-medium hover:bg-slate-100"
                        >
                          <Printer className="h-4 w-4" /> Print Label
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'ready_for_delivery')}
                          className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded flex items-center gap-1 text-sm font-medium hover:bg-emerald-100"
                        >
                          Ready for Delivery
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
