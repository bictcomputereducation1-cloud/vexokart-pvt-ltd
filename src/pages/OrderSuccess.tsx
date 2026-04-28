import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
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
  Share2,
  Sparkles,
  Zap,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [celebrated, setCelebrated] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  useEffect(() => {
    if (!loading && order && !celebrated) {
      triggerCelebration();
      setCelebrated(true);
    }
  }, [loading, order, celebrated]);

  const triggerCelebration = () => {
    console.log("Triggering celebration with sound and confetti");

    // 1. Play Success Sound with robust retry and error handling
    const playSuccessSound = () => {
      console.log("Attempting to play success sound from external URL");
      const audioUrl = 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      
      // Pre-silent play to unlock audio if needed (can be triggered by a click anywhere)
      const unlockAudio = () => {
        const silentAudio = new Audio(audioUrl);
        silentAudio.volume = 0;
        silentAudio.play().then(() => {
          console.log("Audio unlocked successfully");
          window.removeEventListener('click', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
        }).catch(e => console.warn("Audio unlock failed on first interaction", e));
      };
      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("Success sound played successfully");
        }).catch(error => {
          console.warn("Audio play blocked or failed:", error);
          // Browser most likely blocked autoplay. 
          // We can try to play it on the next user interaction (first click)
          const playOnInteraction = () => {
            console.log("Playing sound on first user interaction");
            audio.play().catch(e => console.error("Still failed to play sound:", e));
            window.removeEventListener('click', playOnInteraction);
            window.removeEventListener('touchstart', playOnInteraction);
          };
          window.addEventListener('click', playOnInteraction);
          window.addEventListener('touchstart', playOnInteraction);
          toast.info("Click anywhere to enable celebration sound!", { position: 'bottom-center' });
        });
      }
    };

    playSuccessSound();

    // 2. Confetti Animation
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    toast.success("🎉 Order Placed Successfully!", {
        position: 'top-center',
        duration: 5000,
        className: 'bg-emerald-600 text-white font-black uppercase tracking-widest text-xs py-4 px-6 rounded-2xl shadow-2xl border-none'
    });
  };

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (*),
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
    const orderId = `#VX${order?.id?.substring(0, 8).toUpperCase()}`;
    navigator.clipboard.writeText(orderId);
    toast.success('Order ID copied!', {
        position: 'bottom-center',
        className: 'bg-emerald-600 text-white font-black uppercase text-[10px]'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 border-4 border-[#5E3192] border-t-transparent rounded-full shadow-lg shadow-purple-100" 
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400"
        >
          Securing your shipment...
        </motion.p>
      </div>
    );
  }

  const itemTotal = order?.order_items?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;
  const totalMRP = order?.order_items?.reduce((sum: number, item: any) => sum + (item.products?.original_price || item.products?.price || item.price) * item.quantity, 0) || 0;
  const savedAmount = totalMRP - itemTotal;
  const orderIdLong = `#VX${order?.id?.substring(0, 8).toUpperCase()}`;
  const orderDateFormatted = order?.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';
  const orderTimeFormatted = order?.created_at ? new Date(order.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : '';

  const getStatusNumber = (status: string) => {
    switch (status.toLowerCase()) {
      case 'placed': return 1;
      case 'confirmed': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const currentStatusIndex = getStatusNumber(order?.status || 'placed');

  return (
    <div className="bg-[#F8F9FB] min-h-screen pb-40 overflow-x-hidden font-sans">
      {/* 🔹 PURPLE SUCCESS HEADER */}
      <div className="bg-[#5E3192] pt-8 pb-16 px-4 relative overflow-hidden">
        {/* Background Confetti SVG Pattern or simple circles */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           {[...Array(20)].map((_, i) => (
             <div 
               key={i} 
               className="absolute rounded-full bg-white" 
               style={{
                 width: Math.random() * 8 + 4 + 'px',
                 height: Math.random() * 8 + 4 + 'px',
                 top: Math.random() * 100 + '%',
                 left: Math.random() * 100 + '%',
                 opacity: Math.random() * 0.5 + 0.2
               }}
             />
           ))}
        </div>

        <button 
          onClick={() => navigate('/home')}
          className="absolute top-8 left-4 p-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center justify-center text-center space-y-6 pt-4">
           <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
           >
             <CheckCircle2 className="h-14 w-14 text-[#5E3192]" />
           </motion.div>

           <div className="space-y-2">
             <h1 className="text-2xl font-black text-white tracking-tight">Order Placed Successfully!</h1>
             <p className="text-white/70 text-sm font-medium">Thank you for shopping with us 💜</p>
           </div>

           <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
             <Share2 className="h-4 w-4" />
             Share Order Details
           </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 space-y-4">
        {/* 🔹 ORDER DETAILS CARD */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#5E3192]">
                    <ShoppingBag className="h-5 w-5" />
                 </div>
                 <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Order Details</h2>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[11px] font-bold text-slate-400">Order ID: {orderIdLong}</span>
                 <button onClick={copyOrderId} className="p-1 hover:bg-slate-50 rounded"><Copy className="h-3.5 w-3.5 text-slate-300" /></button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Order Date</p>
                 <p className="text-xs font-black text-slate-800">{orderDateFormatted}  •  {orderTimeFormatted}</p>
              </div>
              <div className="space-y-1 border-l border-slate-100 pl-8">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
                 <div className="flex items-center gap-2">
                    <div className="h-5 w-8 bg-slate-50 flex items-center justify-center rounded overflow-hidden">
                       <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="text-xs font-black text-slate-800">{order?.payment_method?.toUpperCase()} •••• 1234</p>
                 </div>
              </div>
           </div>
        </div>

        {/* 🔹 DELIVERY TRACKER CARD */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h2 className="text-sm font-black text-[#5E3192] tracking-tight">Delivery in Progress</h2>
                 <p className="text-[11px] font-bold text-slate-400 mt-1">We will deliver your order soon</p>
              </div>
              <div className="bg-[#FAF9FF] p-3 rounded-2xl border border-[#5E3192]/5 text-center">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Arriving in</p>
                 <p className="text-sm font-black text-[#5E3192]">10 mins</p>
              </div>
           </div>

           <div className="relative px-2">
              <div className="absolute top-5 left-8 right-8 h-[2px] bg-slate-100 -z-0" />
              <div 
                className="absolute top-5 left-8 h-[2px] bg-[#5E3192] transition-all duration-1000 -z-0" 
                style={{ width: `${(currentStatusIndex - 1) * 33}%` }}
              />

              <div className="flex justify-between items-start relative z-10 text-center">
                 {[
                   { id: 1, label: 'Placed', icon: ShoppingBag, time: orderTimeFormatted },
                   { id: 2, label: 'Confirmed', icon: Sparkles, time: 'Confirming...' },
                   { id: 3, label: 'Out for Delivery', icon: Zap, time: '' },
                   { id: 4, label: 'Delivered', icon: CheckCircle2, time: '' }
                 ].map((step, i) => {
                   const isActive = currentStatusIndex >= step.id;
                   return (
                     <div key={step.id} className="flex flex-col items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center border-4 transition-all",
                          isActive ? "bg-[#5E3192] border-white shadow-lg text-white" : "bg-white border-slate-50 text-slate-200"
                        )}>
                           <step.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                           <p className={cn("text-[10px] font-black uppercase tracking-tight", isActive ? "text-slate-900" : "text-slate-300")}>
                             {step.label}
                           </p>
                           {step.time && (
                             <p className="text-[9px] font-bold text-[#5E3192]">{step.time}</p>
                           )}
                        </div>
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>

        {/* 🔹 ORDER ITEMS CARD */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
           <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                 <Package className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Order Items ({order?.order_items?.length})</h2>
           </div>

           <div className="divide-y divide-slate-50">
              {order?.order_items?.map((item: any) => (
                <div key={item.id} className="py-4 flex items-center gap-4 px-2">
                   <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 p-1 flex-shrink-0">
                      <img src={item.products?.image_url} alt={item.products?.name} className="w-full h-full object-contain" />
                   </div>
                   <div className="flex-grow min-w-0">
                      <h3 className="text-[13px] font-black text-slate-800 leading-tight truncate">{item.products?.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-1">1 kg</p>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-slate-900">₹{item.price * item.quantity}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-1">Qty: {item.quantity}</p>
                   </div>
                </div>
              ))}
           </div>

           <div className="mt-4 pt-6 border-t border-slate-50 flex items-center justify-between">
              <button className="text-[11px] font-black text-[#5E3192] uppercase tracking-widest flex items-center gap-1">
                 View Bill Details <ChevronRight className="h-4 w-4" />
              </button>
              <div className="flex items-baseline gap-2">
                 <span className="text-[13px] font-bold text-slate-400 tracking-tight">Total Paid</span>
                 <span className="text-2xl font-black text-[#5E3192]">₹{order?.total_amount}</span>
              </div>
           </div>
        </div>

        {/* 🔹 DELIVERY ADDRESS CARD */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
           <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                 <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Delivery Address</h2>
           </div>

           <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-grow space-y-4">
                 <div className="space-y-1">
                    <p className="text-[13px] font-black text-slate-900">{order?.users?.name || 'Vexokart User'}</p>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[280px]">
                       {order?.address}
                    </p>
                 </div>
                 <p className="text-[13px] font-black text-[#5E3192]">+91 98765 43210</p>
              </div>

              <div className="shrink-0 flex flex-col justify-end">
                 <button className="bg-[#F5F1FF] text-[#5E3192] px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
                    <MapPin className="h-4 w-4" />
                    View on Map
                 </button>
              </div>
           </div>
        </div>

        {/* 🔹 SAVINGS BANNER */}
        <div className="bg-[#FAF7FF] rounded-[2rem] p-6 border border-[#5E3192]/5 flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center relative overflow-hidden">
                 {/* This would be an icon or gift box as shown in mockup */}
                 <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-amber-600" />
                 </div>
              </div>
              <div>
                 <p className="text-[13px] font-black text-slate-900">Yay! You saved ₹{savedAmount} on this order</p>
                 <p className="text-[11px] font-medium text-slate-500 mt-1">You saved with offers & free delivery 🎊</p>
              </div>
           </div>
           <ChevronRight className="h-5 w-5 text-[#5E3192]" />
        </div>
      </div>

      {/* 🔹 BOTTOM ACTION BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-6 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
           <button 
             onClick={() => navigate('/home')}
             className="flex-1 h-16 bg-white border-2 border-slate-100 text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
           >
             Continue Shopping
           </button>
           <button 
            onClick={() => navigate('/orders')}
            className="flex-1 h-16 bg-[#5E3192] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Track Order
            <ChevronRight className="h-4 w-4 rotate-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
