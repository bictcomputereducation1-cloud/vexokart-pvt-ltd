import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle2, 
  ArrowLeft, 
  HelpCircle, 
  Copy, 
  Clock, 
  Package, 
  MapPin, 
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
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
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyOrderId = () => {
    const orderId = `VEX${order?.id?.substring(0, 8).toUpperCase()}`;
    navigator.clipboard.writeText(orderId);
    toast.success('Order ID copied!', {
        position: 'bottom-center',
        className: 'bg-emerald-600 text-white font-black uppercase text-[10px]'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirming your order...</p>
      </div>
    );
  }

  const itemTotal = order?.order_items?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;
  const totalMRP = order?.order_items?.reduce((sum: number, item: any) => sum + (item.products?.original_price || item.products?.price || item.price) * item.quantity, 0) || 0;
  const savedAmount = totalMRP - itemTotal;
  const deliveryFee = Math.max(0, (order?.total_amount || 0) - itemTotal);
  const orderIdShort = `VEX${order?.id?.substring(0, 8).toUpperCase()}`;

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* 🔹 PREMIUM HEADER */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate('/home')}
          className="p-2 -ml-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <span className="text-lg font-black italic tracking-tighter text-emerald-600 absolute left-1/2 -translate-x-1/2">
          VEXO<span className="text-slate-900">KART</span>
        </span>

        <button className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
          <HelpCircle className="h-4 w-4" />
          <span className="text-[9px] font-black uppercase tracking-widest leading-none">Need Help?</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 🔹 SUCCESS CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-100 relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 opacity-10 rotate-12">
             <CheckCircle2 className="h-32 w-32" />
          </div>
          
          <div className="flex items-start gap-6 relative z-10">
            <div className="bg-white/20 p-4 rounded-[1.5rem] border border-white/20">
               <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <div className="flex-grow">
               <h1 className="text-2xl font-black italic tracking-tighter leading-none mb-2">Order Placed Successfully!</h1>
               <p className="text-emerald-100 text-xs font-bold leading-relaxed">Thank you for shopping with Vexokart. We are preparing your fresh items now.</p>
            </div>
          </div>

          <div className="mt-8 bg-black/10 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
               <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Your Order ID</p>
               <p className="text-sm font-black tracking-widest font-mono italic">{orderIdShort}</p>
            </div>
            <button 
              onClick={copyOrderId}
              className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
               <Copy className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* 🔹 DELIVERY INFO CARD */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Estimated Delivery</p>
                 <p className="text-sm font-black text-slate-900 tracking-tight">Tomorrow, {new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                 <p className="text-[10px] font-bold text-slate-400 mt-0.5">Between 10:00 AM - 2:00 PM</p>
              </div>
           </div>
           <div className="flex flex-col items-end gap-2">
              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">On Time</span>
              <p className="text-[8px] font-bold text-slate-300 text-right leading-tight max-w-[80px]">We'll notify you when items leave</p>
           </div>
        </div>

        {/* 🔹 ORDER DETAILS */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Order Details</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{order?.order_items?.length} Items</span>
           </div>
           
           <div className="space-y-6">
             {order?.order_items?.map((item: any) => (
               <div key={item.id} className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex-shrink-0">
                    <img src={item.products?.image_url} alt={item.products?.name} className="w-full h-full object-contain" />
                 </div>
                 <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{item.products?.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Quantity: {item.quantity}</p>
                 </div>
                 <p className="text-sm font-black italic tracking-tighter text-slate-900">₹{item.price * item.quantity}</p>
               </div>
             ))}
           </div>
        </div>

        {/* 🔹 DELIVERY ADDRESS */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Delivery Address</h2>
              <button 
                onClick={() => navigate('/account')}
                className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full"
              >
                Change
              </button>
           </div>
           <div className="flex gap-4 items-start">
              <div className="bg-emerald-50 p-2 rounded-xl shrink-0 mt-1">
                 <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                 <p className="text-sm font-bold text-slate-900 leading-tight">{order?.address}</p>
                 <p className="text-[11px] font-bold text-slate-400">Pincode: {order?.pincode}</p>
              </div>
           </div>
        </div>

        {/* 🔹 PAYMENT & SUMMARY TABLE */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-6">
           <div className="space-y-4 border-b border-dashed border-slate-100 pb-6">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                 <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment Method</span>
                 </div>
                 <span className="text-slate-900 italic tracking-tighter">{order?.payment_method?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                 <span>Item Total</span>
                 <span className="text-slate-900 italic tracking-tighter">₹{itemTotal}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400">
                 <span>Delivery Fee</span>
                 <span className={`${deliveryFee === 0 ? 'text-emerald-600' : 'text-slate-900'} italic tracking-tighter`}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                 </span>
              </div>
           </div>
           
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Paid</p>
                 <p className="text-3xl font-black italic tracking-tighter text-slate-900">₹{order?.total_amount}</p>
              </div>
              <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100">
                 <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest text-center leading-tight">
                   Yay! You saved <br/><span className="text-slate-900 text-xs italic tracking-tighter">₹{savedAmount}</span> on this order
                 </p>
              </div>
           </div>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all">
              <div className="bg-slate-50 p-3 rounded-2xl">
                 <Share2 className="h-5 w-5 text-slate-400" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Share Order</span>
           </div>
           <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all">
              <div className="bg-slate-50 p-3 rounded-2xl">
                 <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Track Status</span>
           </div>
        </div>
      </div>

      {/* 🔹 BOTTOM ACTION BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-6 z-50 shadow-[0_-15px_50px_rgba(0,0,0,0.12)]">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
           <button 
             onClick={() => navigate('/orders')}
             className="flex-1 h-16 border-2 border-emerald-600 text-emerald-600 rounded-[2rem] font-black text-[12px] uppercase tracking-widest hover:bg-emerald-50 active:scale-95 transition-all"
           >
             View Orders
           </button>
           <button 
            onClick={() => navigate('/home')}
            className="flex-1 h-16 bg-emerald-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-emerald-100 active:scale-95 transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
