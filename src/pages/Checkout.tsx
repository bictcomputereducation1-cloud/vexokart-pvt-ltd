import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { Address } from '../types';
import { AddressSelector } from '../components/AddressSelector';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Loader2, 
  CreditCard, 
  ShieldCheck, 
  Package, 
  ShoppingBag, 
  MapPin, 
  ChevronRight, 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Minus,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { items, totalPrice, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | null>(null);
  const navigate = useNavigate();

  const isCodAllowed = items.every((item) => item.cod_available !== false);
  const isOnlineAllowed = items.every((item) => item.online_payment !== false);

  useEffect(() => {
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
    if (!selectedAddress) return;
    setLoading(true);
    try {
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load');
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
            const fullAddressText = `${selectedAddress.full_address}, ${selectedAddress.city} - ${selectedAddress.pincode}`;
            
            const { data: verifyData } = await axios.post('/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user?.id,
              amount: totalPrice,
              items: items,
              address: fullAddressText,
              pincode: selectedAddress.pincode
            });

            if (verifyData.success) {
              toast.success('Order Confirmed!');
              clearCart();
              navigate(`/order-success/${orderData.id}`);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: selectedAddress.full_name,
          email: user?.email || '',
          contact: selectedAddress.phone,
        },
        theme: {
          color: '#10b981',
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
    if (!selectedAddress) return;
    setLoading(true);
    try {
      const fullAddressText = `${selectedAddress.full_address}, ${selectedAddress.city} - ${selectedAddress.pincode}`;
      
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id,
          total_amount: totalPrice,
          status: 'pending',
          payment_method: 'cod',
          payment_status: 'pending',
          address: fullAddressText,
          pincode: selectedAddress.pincode
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
      navigate(`/order-success/${newOrder.id}`);
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

    if (!selectedAddress) {
      toast.error('Please select a delivery address');
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

  const steps = [
    { name: 'Cart', status: 'complete' },
    { name: 'Address', status: 'complete' },
    { name: 'Payment', status: 'complete' },
    { name: 'Review', status: 'current' },
  ];

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-200">
          <ShoppingBag className="h-10 w-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-black italic tracking-tighter text-slate-900 mb-2">Your cart is empty!</h2>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-8">Add items to proceed to checkout</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  const savedAmount = Math.round(totalPrice * 0.15); // Mocked savings for UI

  return (
    <div className="bg-slate-50 min-h-screen pb-40">
      {/* 🔹 PREMIUM HEADER */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <span className="text-lg font-black italic tracking-tighter text-emerald-600 absolute left-1/2 -translate-x-1/2">
          VEXO<span className="text-slate-900">KART</span>
        </span>

        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-[9px] font-black uppercase tracking-widest leading-none">100% Secure</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 🔹 STEP PROGRESS BAR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-[18px] left-0 right-0 h-0.5 bg-slate-100 -z-0 mx-8" />
            <div className="absolute top-[18px] left-0 w-[80%] h-0.5 bg-emerald-500 -z-0 mx-8" />
            
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center border-4 transition-all ${
                  step.status === 'complete' 
                  ? 'bg-emerald-500 border-emerald-100 text-white' 
                  : step.status === 'current'
                  ? 'bg-white border-emerald-500 text-emerald-600'
                  : 'bg-white border-slate-100 text-slate-300'
                }`}>
                  {step.status === 'complete' ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-black">{idx + 1}</span>}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${
                  step.status === 'current' ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 🔹 DELIVERY ADDRESS CARD */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-emerald-50 p-2 rounded-xl">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                 </div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Deliver to</h2>
              </div>
              <button 
                onClick={() => navigate('/account')}
                className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full"
              >
                Change
              </button>
           </div>
           
           <AddressSelector 
              selectedId={selectedAddress?.id}
              onSelect={(addr) => setSelectedAddress(addr)}
            />

           <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100/50">
              <Package className="h-5 w-5 text-slate-400" />
              <p className="text-[11px] font-bold text-slate-500 leading-tight">
                Delivery by <span className="text-slate-900 font-black">Today, 2:00 PM</span> • <span className="text-emerald-600 font-black">FREE delivery</span> above ₹299
              </p>
           </div>
        </div>

        {/* 🔹 ORDER ITEMS SECTION */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-6">
           <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
             Order Items <span className="h-5 w-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] text-slate-500">{items.length}</span>
           </h2>
           
           <div className="space-y-4">
             {items.map(item => (
               <div key={item.id} className="flex items-center gap-4 group">
                 <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex-shrink-0">
                   <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                 </div>
                 
                 <div className="flex-grow min-w-0">
                   <h3 className="font-bold text-slate-900 truncate text-sm">{item.name}</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">500g • Standard</p>
                   
                   <div className="flex items-center gap-3 mt-3">
                     <div className="flex items-center bg-slate-100 rounded-full px-2 py-1 gap-4">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-white rounded-full transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-white rounded-full transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                     </div>
                     <button 
                       onClick={() => removeFromCart(item.id)}
                       className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 </div>

                 <div className="text-right flex flex-col items-end">
                    <p className="text-sm font-black text-slate-900 leading-none">₹{item.price * item.quantity}</p>
                    <p className="text-[10px] text-slate-300 line-through font-bold mt-1 leading-none">₹{Math.round(item.price * 1.2 * item.quantity)}</p>
                    <span className="text-[9px] font-black text-emerald-600 uppercase mt-1">20% OFF</span>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* 🔹 PAYMENT METHOD */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-6">
           <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Payment Method</h2>
           
           <div className="space-y-3">
              {[
                { id: 'online', name: 'PhonePe / GPay', icon: Smartphone, sub: 'Instant & Secure Payment' },
                { id: 'cod', name: 'Cash on Delivery', icon: Package, sub: 'Pay at your doorstep' }
              ].map(method => {
                const isAllowed = method.id === 'online' ? isOnlineAllowed : isCodAllowed;
                return (
                  <button
                    key={method.id}
                    disabled={!isAllowed}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      paymentMethod === method.id 
                        ? 'border-emerald-500 bg-emerald-50/50' 
                        : 'border-slate-50 bg-white hover:border-slate-200'
                    } ${!isAllowed ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox replacement with method icon */}
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${
                        paymentMethod === method.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <method.icon className="h-6 w-6" />
                      </div>
                      <div className="text-left leading-tight">
                        <p className="text-sm font-black text-slate-900 tracking-tight">{method.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{method.sub}</p>
                      </div>
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === method.id ? 'border-emerald-500' : 'border-slate-200'
                    }`}>
                      {paymentMethod === method.id && <div className="h-3 w-3 bg-emerald-500 rounded-full" />}
                    </div>
                  </button>
                )
              })}
           </div>
        </div>

        {/* 🔹 ORDER SUMMARY */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-6">
           <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Order Summary</h2>
           
           <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                 <span>Item Total</span>
                 <span className="text-slate-900 font-black italic">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                 <span>Delivery Fee</span>
                 <span className="text-emerald-600 font-black italic">FREE</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase tracking-widest">
                 <span>You Saved</span>
                 <span className="font-black italic">₹{savedAmount}</span>
              </div>
              
              <div className="pt-4 border-t border-dashed border-slate-100 flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">To Pay</p>
                   <p className="text-2xl font-black italic tracking-tighter text-slate-900">₹{totalPrice}</p>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                   <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest text-center">
                     Total Saving <span className="text-slate-900">₹{savedAmount}</span>
                   </p>
                </div>
              </div>
           </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 py-4 grayscale opacity-30">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">100% Safe & Secure Checkout</span>
        </div>
      </div>

      {/* 🔹 STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-6 z-50 shadow-[0_-15px_50px_rgba(0,0,0,0.12)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col group cursor-pointer" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
            <div className="flex items-center gap-1">
               <span className="text-xl font-black italic tracking-tighter text-slate-900">₹{totalPrice}</span>
               <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">View Details</span>
          </div>

          <button 
            disabled={loading || !selectedAddress}
            onClick={handlePayment}
            className="flex-grow bg-emerald-600 text-white h-16 rounded-[2rem] shadow-2xl shadow-emerald-100 flex flex-col items-center justify-center active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
          >
            <span className="text-[12px] font-black uppercase tracking-wider">Place Order</span>
            <span className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest mt-0.5">
              {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Secure Online Payment'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
