import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, CreditCard, ShieldCheck, Package, ShoppingBag, MapPin, ChevronRight } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | null>(null);
  const navigate = useNavigate();

  const isCodAllowed = items.every((item) => item.cod_available !== false);
  const isOnlineAllowed = items.every((item) => item.online_payment !== false);

  React.useEffect(() => {
    if (!paymentMethod) {
      if (isOnlineAllowed) setPaymentMethod('online');
      else if (isCodAllowed) setPaymentMethod('cod');
    }
  }, [isOnlineAllowed, isCodAllowed]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOnlinePayment = async () => {
    setLoading(true);
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      const { data: orderData } = await axios.post('/api/payment/order', {
        amount: totalPrice,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'VEXOKART',
        description: 'Grocery Purchase',
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            const { data: verifyData } = await axios.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user?.id,
              amount: totalPrice,
              items: items
            });

            if (verifyData.success) {
              toast.success('Order Confirmed!');
              clearCart();
              navigate('/orders');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: profile?.name || '',
          email: user?.email || '',
          contact: phone,
        },
        theme: {
          color: '#FFD700',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCodPayment = async () => {
    setLoading(true);
    try {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id,
          total_amount: totalPrice,
          status: 'pending',
          payment_method: 'cod',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: newOrder.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      toast.success('Order Placed! (COD)');
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      console.error('COD placement error:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (!address || !phone) {
      toast.error('Please fill in all delivery details');
      return;
    }

    if (paymentMethod === 'online') {
      await handleOnlinePayment();
    } else if (paymentMethod === 'cod') {
      await handleCodPayment();
    } else {
      toast.error('Please select a payment method');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-40">
      <div className="bg-white px-4 py-6 mb-4 border-b border-slate-100">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Checkout</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Final step to your order</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl">
                <MapPin className="h-5 w-5 text-black" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Delivery Address</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient Name</label>
                <div className="font-bold text-slate-800 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">{profile?.name || 'Guest User'}</div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Contact Number</label>
                <Input 
                  placeholder="Enter 10-digit phone number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl h-12 bg-white border-slate-200 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Full Address</label>
                <textarea 
                  className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  placeholder="Street, House No., Area, Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl">
                <CreditCard className="h-5 w-5 text-black" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Payment Method</h2>
            </div>

            <div className="grid gap-3">
              <button
                disabled={!isOnlineAllowed}
                onClick={() => setPaymentMethod('online')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'online' 
                    ? 'border-primary bg-primary/5 shadow-inner' 
                    : 'border-slate-100 bg-white'
                } ${!isOnlineAllowed ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                     <CreditCard className="h-5 w-5" />
                   </div>
                   <div className="text-left leading-tight">
                     <p className="text-sm font-black uppercase tracking-tighter italic">Online Payment</p>
                     <p className="text-[10px] font-bold text-slate-400">UPI, Card, Wallets</p>
                   </div>
                </div>
                {paymentMethod === 'online' && <div className="h-4 w-4 bg-primary rounded-full" />}
              </button>

              <button
                disabled={!isCodAllowed}
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'cod' 
                    ? 'border-primary bg-primary/5 shadow-inner' 
                    : 'border-slate-100 bg-white'
                } ${!isCodAllowed ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                     <Package className="h-5 w-5" />
                   </div>
                   <div className="text-left leading-tight">
                     <p className="text-sm font-black uppercase tracking-tighter italic">Cash on Delivery</p>
                     <p className="text-[10px] font-bold text-slate-400">Pay at the doorstep</p>
                   </div>
                </div>
                {paymentMethod === 'cod' && <div className="h-4 w-4 bg-primary rounded-full" />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
           {/* Summary Mini Card */}
           <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <ShoppingBag className="h-5 w-5 text-black" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Order Summary</h2>
             </div>
             
             <div className="max-h-40 overflow-auto divide-y divide-slate-50 mb-6">
               {items.map(item => (
                 <div key={item.id} className="py-2 flex justify-between items-center text-xs font-bold uppercase tracking-tighter">
                   <span className="text-slate-500">{item.name} x {item.quantity}</span>
                   <span className="text-slate-900 italic">₹{item.price * item.quantity}</span>
                 </div>
               ))}
             </div>

             <div className="space-y-2 border-t border-dashed border-slate-200 pt-4">
               <div className="flex justify-between text-xs font-bold uppercase text-slate-400">
                 <span>Items Total</span>
                 <span>₹{totalPrice}</span>
               </div>
               <div className="flex justify-between text-xs font-bold uppercase text-emerald-600">
                 <span>Delivery Fee</span>
                 <span>FREE</span>
               </div>
               <div className="flex justify-between text-lg font-black uppercase italic tracking-tighter pt-2 border-t border-slate-50 mt-2">
                 <span>Grand Total</span>
                 <span>₹{totalPrice + (paymentMethod === 'cod' ? 2 : 2)}</span>
               </div>
             </div>
           </div>

           {/* Security Badge */}
           <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">
                Your payment and data are secured with enterprise-grade encryption.
              </p>
           </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-50 md:static">
        <button 
          disabled={loading}
          onClick={handlePayment}
          className="w-full bg-primary text-black h-16 rounded-3xl shadow-2xl flex items-center justify-between px-8 active:scale-95 transition-all group"
        >
          <div className="flex flex-col items-start leading-none">
            <span className="text-lg font-black italic tracking-tighter">₹{totalPrice + 2}</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Bill</span>
          </div>
          <div className="flex items-center gap-2 font-black italic text-lg tracking-tighter">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <>PLACE ORDER <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" /></>}
          </div>
        </button>
      </div>
    </div>
  );
}

