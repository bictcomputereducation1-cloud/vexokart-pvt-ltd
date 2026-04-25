import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { Order } from '../types';
import { Package, Clock, CheckCircle2, Truck, XCircle, ShieldCheck, ChevronRight, ShoppingBag, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'confirmed': return <ShieldCheck className="h-3 w-3" />;
      case 'packed': return <Package className="h-3 w-3" />;
      case 'delivered': return <CheckCircle2 className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Truck className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'packed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) return (
    <div className="py-24 flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fetching your orders...</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-6 mb-4 border-b border-slate-100">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">My Orders</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Status of your groceries</p>
      </div>
      
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 space-y-6">
            <div className="bg-slate-50 p-8 rounded-full border border-slate-100 w-fit mx-auto">
              <ShoppingBag className="h-12 w-12 text-slate-200" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black italic tracking-tighter uppercase">No Orders Found</p>
              <p className="text-slate-400 text-sm font-medium">You haven't ordered anything yet.<br/>Start filling your cart!</p>
            </div>
            <Link to="/home">
              <button className="bg-primary px-8 py-3 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl active:scale-95 transition-all">
                Shop Now
              </button>
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order</span>
                    <span className="text-xs font-bold font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{new Date(order.created_at).toLocaleDateString(undefined, { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div className="flex items-center gap-2">
                  {order.invoice_url && (
                    <a 
                      href={order.invoice_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase flex items-center gap-1.5 bg-white hover:bg-emerald-100 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Invoice
                    </a>
                  )}
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="space-y-3">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-white border border-slate-50 p-2 flex-shrink-0">
                        <img 
                          src={item.products?.image_url || `https://picsum.photos/seed/${item.products?.name}/100/100`} 
                          alt={item.products?.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-1">{item.products?.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black italic tracking-tighter text-slate-900">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Bill</span>
                   <span className="text-base font-black italic tracking-tighter">₹{order.total_amount}</span>
                 </div>
                 <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80">
                   Order Details <ChevronRight className="h-4 w-4" />
                 </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

