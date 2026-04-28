import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  Sparkles
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full shadow-lg shadow-emerald-100" 
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
  const deliveryFee = Math.max(0, (order?.total_amount || 0) - itemTotal);
  const orderIdShort = `VEX${order?.id?.substring(0, 8).toUpperCase()}`;

  return (
    <div className="bg-slate-50 min-h-screen pb-32 overflow-x-hidden">
      {/* 🔹 PREMIUM HEADER */}
      <div className="sticky top-0 z-[60] bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
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
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-emerald-600 rounded-[2.5rem] p-10 text-white shadow-[0_30px_60px_-15px_rgba(5,150,105,0.3)] relative overflow-hidden"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -right-12 -top-12 opacity-5"
          >
             <Sparkles className="h-48 w-48" />
          </motion.div>
          
          <div className="flex flex-col items-center text-center gap-6 relative z-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="bg-white/20 p-6 rounded-full border border-white/20 shadow-inner"
            >
               <CheckCircle2 className="h-14 w-14 text-white" />
            </motion.div>
            <div className="space-y-3">
               <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black italic tracking-tighter leading-none"
               >
                 🎉 Order Placed Successfully!
               </motion.h1>
               <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-emerald-100 text-sm font-bold opacity-90 max-w-[280px] mx-auto leading-relaxed"
               >
                 Thank you for choosing Vexokart. We've started preparing your items with extra care!
               </motion.p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 bg-black/10 rounded-2xl p-5 border border-white/10 flex items-center justify-between"
          >
            <div>
               <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200 mb-1">Your Unique Order ID</p>
               <p className="text-base font-black tracking-[0.15em] font-mono italic">{orderIdShort}</p>
            </div>
            <button 
              onClick={copyOrderId}
              className="p-3.5 bg-white/20 rounded-xl hover:bg-white/30 transition-colors active:scale-90"
            >
               <Copy className="h-5 w-5" />
            </button>
          </motion.div>
        </motion.div>

        {/* 🔹 SHIPMENT STATUS (NEW FOR PREMIUM FEEL) */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                 <Package className="h-4 w-4 text-emerald-600" />
                 Shipment Progress
              </h2>
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Processing</span>
           </div>

           <div className="relative h-2 w-full bg-slate-50 rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "25%" }}
                transition={{ duration: 1.5, delay: 1 }}
                className="absolute h-full bg-emerald-600 rounded-full"
              />
           </div>

           <div className="grid grid-cols-4 gap-2">
              <div className="text-[8px] font-black uppercase tracking-tighter text-emerald-600">Placed</div>
              <div className="text-[8px] font-black uppercase tracking-tighter text-slate-300">Packed</div>
              <div className="text-[8px] font-black uppercase tracking-tighter text-slate-300">Transit</div>
              <div className="text-[8px] font-black uppercase tracking-tighter text-slate-300 text-right">Done</div>
           </div>
        </div>

        {/* 🔹 DELIVERY INFO CARD */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Estimated Arrival</p>
                 <p className="text-sm font-black text-slate-900 tracking-tight">Tomorrow, {new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                 <p className="text-[10px] font-bold text-slate-400 mt-0.5">Slots: 10:00 AM - 2:00 PM</p>
              </div>
           </div>
           <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Guaranteed</span>
              <p className="text-[8px] font-bold text-slate-300 text-right leading-tight max-w-[80px]">Freshness seal assured</p>
           </div>
        </div>

        {/* 🔹 ORDER DETAILS */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-6">
           <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Items Ordered</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{order?.order_items?.length} Items</span>
           </div>
           
           <div className="space-y-6">
             {order?.order_items?.map((item: any) => (
               <div key={item.id} className="flex items-center gap-4 group">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <img src={item.products?.image_url} alt={item.products?.name} className="w-full h-full object-contain" />
                 </div>
                 <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{item.products?.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                 </div>
                 <p className="text-sm font-black italic tracking-tighter text-slate-900">₹{item.price * item.quantity}</p>
               </div>
             ))}
           </div>
        </div>

        {/* 🔹 DELIVERY ADDRESS */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Shipping To</h2>
           </div>
           <div className="flex gap-4 items-start">
              <div className="bg-emerald-50 p-3 rounded-2xl shrink-0">
                 <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                 <p className="text-sm font-bold text-slate-900 leading-tight">{order?.address}</p>
                 <p className="text-[11px] font-bold text-slate-400 tracking-wider">ZIP: {order?.pincode}</p>
              </div>
           </div>
        </div>

        {/* 🔹 PAYMENT & SUMMARY */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
           <div className="space-y-4 border-b border-dashed border-slate-100 pb-8">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4" />
                    <span>Mode</span>
                 </div>
                 <span className="text-slate-900 italic tracking-tighter">{order?.payment_method?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <span>Subtotal</span>
                 <span className="text-slate-900 italic tracking-tighter">₹{itemTotal}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <span>Delivery Fee</span>
                 <span className={`${deliveryFee === 0 ? 'text-emerald-600 font-black' : 'text-slate-900'} italic tracking-tighter`}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                 </span>
              </div>
           </div>
           
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Final Amount</p>
                 <p className="text-4xl font-black italic tracking-tighter text-slate-900">₹{order?.total_amount}</p>
              </div>
              <div className="bg-emerald-600/5 px-6 py-4 rounded-[1.5rem] border border-emerald-600/10 backdrop-blur-sm">
                 <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest text-center leading-tight">
                   Total Savings <br/><span className="text-emerald-600 text-sm italic tracking-tighter">₹{savedAmount}</span>
                 </p>
              </div>
           </div>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-2 gap-4 pb-12">
           <motion.div 
            whileTap={{ scale: 0.95 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 cursor-pointer"
           >
              <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                 <Share2 className="h-6 w-6 text-slate-400" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-950 tracking-widest">Share Bill</span>
           </motion.div>
           <motion.div 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/orders')}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 cursor-pointer"
           >
              <div className="bg-emerald-50 p-4 rounded-2xl">
                 <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-950 tracking-widest">Track Now</span>
           </motion.div>
        </div>
      </div>

      {/* 🔹 BOTTOM ACTION BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-6 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
           <button 
             onClick={() => navigate('/orders')}
             className="flex-1 h-16 border-2 border-slate-900 text-slate-900 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
           >
             Order History
           </button>
           <button 
            onClick={() => navigate('/home')}
            className="flex-1 h-16 bg-emerald-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-[0_20px_40px_-5px_rgba(5,150,105,0.3)] active:scale-95 transition-all"
          >
            Go Back Home
          </button>
        </div>
      </div>
    </div>
  );
}
