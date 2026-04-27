import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Truck, CheckCircle2, MapPin } from 'lucide-react';
import { Order } from '../types';
import { useAuth } from '../AuthContext';
import { format } from 'date-fns';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id) {
      fetchDeliveryOrders();
    }
  }, [profile]);

  const fetchDeliveryOrders = async () => {
    try {
      // 1. Fetch delivery boy record for the current user
      const { data: dboy, error: dboyError } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('user_id', profile?.id)
        .single();
        
      if (dboyError || !dboy) {
        // Fallback: perhaps delivery boy uses profile.id directly or doesn't have a separate table setup yet
        // If there's an error, maybe the table doesn't exist?
        // Let's still try to fetch from orders using profile.id as a fallback
      }

      const deliveryBoyId = dboy?.id || profile?.id;

      // 2. Fetch orders assigned to this delivery boy
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_boy_id', deliveryBoyId)
        .order('created_at', { ascending: false });

      if (error) {
         // Fallback if delivery_boy_id column doesn't exist yet, we can't do much.
         throw error;
      }
      
      setOrders(orders || []);
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
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
      case 'ready_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'picked': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const pendingCount = orders.filter(o => ['ready_for_delivery'].includes(o.status)).length;
  const activeCount = orders.filter(o => ['picked', 'out_for_delivery'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Delivery Partner Dashboard</h1>
        <p className="text-slate-500">Manage your assigned deliveries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
            <div className="text-sm font-medium text-slate-500">Ready to Pick</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
            <div className="text-sm font-medium text-slate-500">Active Deliveries</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{deliveredCount}</div>
            <div className="text-sm font-medium text-slate-500">Delivered</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">Your Deliveries</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading deliveries...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Truck className="h-12 w-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No deliveries assigned</h3>
            <p>You will see orders here once they are assigned to you.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4 py-3">Order ID</th>
                <th className="p-4 py-3">Delivery Address</th>
                <th className="p-4 py-3">Amount & Payment</th>
                <th className="p-4 py-3">Status</th>
                <th className="p-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono text-sm uppercase">#{order.id.split('-')[0]}</td>
                  <td className="p-4">
                    <div className="flex items-start gap-1 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-2">{order.address}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">₹{order.total_amount}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5 uppercase">
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid (Online)'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {order.status === 'ready_for_delivery' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'picked')}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded inline-flex items-center gap-1 text-sm font-medium hover:bg-blue-100"
                      >
                        Pick Order
                      </button>
                    )}
                    {order.status === 'picked' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded inline-flex items-center gap-1 text-sm font-medium hover:bg-indigo-100"
                      >
                        Out for Delivery
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded inline-flex items-center gap-1 text-sm font-medium hover:bg-emerald-100"
                      >
                        Mark Delivered
                      </button>
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
