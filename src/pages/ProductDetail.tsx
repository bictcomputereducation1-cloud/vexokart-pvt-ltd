import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from '../components/ProductCard';
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  ShoppingCart, 
  ChevronRight, 
  MapPin, 
  Clock, 
  CheckCircle2,
  Share2,
  ShieldCheck,
  Zap,
  PackageCheck,
  Plus,
  Minus,
  Sparkles,
  Award,
  Video,
  Volume2,
  VolumeX,
  Rotate3d,
  ChevronDown,
  Lock,
  ThumbsUp,
  Flame,
  Info,
  ChevronLeft,
  X,
  CreditCard,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeliveryLocation } from '../LocationContext';

// Standard Premium Curated stock assets depending on category
const getSecondaryImagesForProduct = (product: Product): string[] => {
  const name = (product.name || '').toLowerCase();
  
  // Custom secondary closeups to make it feel rich and genuine
  if (name.includes('fruit') || name.includes('apple') || name.includes('mango') || name.includes('banana') || name.includes('berry')) {
    return [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1596362601603-b75f6feb1635?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1550258224-2ae914890652?auto=format&fit=crop&q=80&w=800"
    ];
  }
  if (name.includes('vegetable') || name.includes('veggie') || name.includes('onion') || name.includes('potato') || name.includes('tomato')) {
    return [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1574325131876-a7999dc77fc8?auto=format&fit=crop&q=80&w=800"
    ];
  }
  if (name.includes('milk') || name.includes('cheese') || name.includes('dairy') || name.includes('curd') || name.includes('butter')) {
    return [
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&q=80&w=800"
    ];
  }
  if (name.includes('drink') || name.includes('juice') || name.includes('soda') || name.includes('cola') || name.includes('beverage')) {
    return [
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800"
    ];
  }
  
  // Elegant default fallback images
  return [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1574325131876-a7999dc77fc8?auto=format&fit=crop&q=80&w=800"
  ];
};

const getDemoVideoForProduct = (product: Product): string => {
  const name = (product.name || '').toLowerCase();
  // Return curated high-quality vertical looping food clips
  if (name.includes('fruit') || name.includes('apple') || name.includes('mango') || name.includes('juice') || name.includes('drink')) {
    return "https://player.vimeo.com/external/435674703.sd.mp4?s=7fdfda4d6c109727192bc585973b069d519bfae9&profile_id=165&oauth2_token_id=57447761";
  }
  // Fresh harvest video
  return "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c02227d8743e05582b42d76db8cb5800&profile_id=165&oauth2_token_id=57447761";
};

// Mock specifications generation helper for realistic product data
const getFullSpecifications = (product: Product) => {
  return {
    description: product.description || "Indulge in our carefully handpicked, premium quality food. Sourced straight from local certified agricultural partners, ensuring pure nutrition, farm-fresh crispness, and zero contamination in every single pack. Packed under hygienic atmosphere and shipped at pristine state.",
    ingredients: product.attributes?.ingredients || "100% Naturally Grown Organic produce. Processed without synthetic pesticides, preservatives, coloring, or artificial ripening agents.",
    specifications: [
      { label: "Origin", value: product.brand || "Vexo Farm Direct" },
      { label: "Category", value: product.product_type || "Select Organics" },
      { label: "Net Weight", value: product.weight || "1 kg" },
      { label: "Shelf Life", value: product.shelf_life || "6-12 Months" },
      { label: "Storage Temp", value: "Cool & Dry place (12°C - 24°C)" },
      { label: "Grade", value: "Premium AAA export grade" }
    ],
    benefits: [
      "Abundant in dietary fiber, boosting daily digestive efficiency and metabolic rate.",
      "100% pesticide-free, protecting your family against harmful bio-accumulation.",
      "Enriched with vital micronutrients, active antioxidants, and natural minerals.",
      "Eco-conscious sustainable agriculture supporting local micro-farming collectives."
    ],
    howToUse: "Wash thoroughly with clean filtered water. Consume raw, steam slightly, or integrate as the centerpiece of your gourmet home-cooked healthy meals. Store any unused portion inside specialized vapor-sealed zip bags inside refrigerators.",
    storage: "Keep inside standard cold vegetable crispers or airtight solid glass storage vessels away from direct morning solar rays and ambient room moisture."
  };
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // 360 rotation states
  const [is360Active, setIs360Active] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const isDraggingRef = useRef(false);
  const startDragXRef = useRef(0);

  // Zoom states
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomCoords, setZoomCoords] = useState({ x: 0, y: 0 });

  // Video states
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Accordion active state
  const [activeAccordion, setActiveAccordion] = useState<string | null>('desc');

  // EMI modal
  const [showEMIModal, setShowEMIModal] = useState(false);

  const { items, addToCart, removeFromCart, getItemQuantity } = useCart();
  const { address } = useDeliveryLocation();
  const navigate = useNavigate();

  const itemQty = getItemQuantity(id || '');

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
    window.scrollTo(0, 0);
  }, [id]);

  // Load recently viewed & handle wishlist initial check
  useEffect(() => {
    if (id) {
      try {
        const wishlist = JSON.parse(localStorage.getItem('vexokart_wishlist') || '[]');
        setIsWishlisted(wishlist.includes(id));
      } catch (e) {
        console.error(e);
      }
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data: pData, error: pError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (pError) throw pError;
      if (!pData) throw new Error("Product not found");

      let catData = null;
      if (pData.category_id) {
        try {
          const { data: cData } = await supabase
            .from('categories')
            .select('*')
            .eq('id', pData.category_id)
            .maybeSingle();
          if (cData) catData = cData;
        } catch (catErr) {
          console.error("Non-fatal Category fetch failed:", catErr);
        }
      }

      const parsedProduct = {
        ...pData,
        categories: catData
      };

      setProduct(parsedProduct);

      // Track recently viewed
      saveToRecentlyViewed(parsedProduct);

      // Fetch recommended products
      const { data: recs } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', pData.category_id)
        .neq('id', pData.id);
      
      if (recs) {
        const liveRecs = recs.filter((p: any) => {
          const statusVal = p.status || p.verification_status || 'approved';
          const isLive = statusVal === 'live' || statusVal === 'approved';
          const stockUnits = typeof p.stock_units === 'number' ? p.stock_units : (typeof p.stock === 'number' ? p.stock : 0);
          return isLive && stockUnits > 0 && p.is_active !== false;
        });
        setRecommended(liveRecs.slice(0, 6));
      }
    } catch (error) {
      console.error('[ProductDetail Fetch Error]:', error);
      toast.error('Product detail retrieval failed');
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  const saveToRecentlyViewed = (prod: Product) => {
    try {
      const itemsRaw = localStorage.getItem('vexokart_recent');
      let itemsList: Product[] = itemsRaw ? JSON.parse(itemsRaw) : [];
      // Remove if already in list to put it at the front
      itemsList = itemsList.filter(item => item.id !== prod.id);
      itemsList.unshift(prod);
      // Keep max 8 items
      itemsList = itemsList.slice(0, 8);
      localStorage.setItem('vexokart_recent', JSON.stringify(itemsList));
      setRecentlyViewed(itemsList.filter(i => i.id !== prod.id));
    } catch (e) {
      console.error("Recent storage error:", e);
    }
  };

  const toggleWishlist = () => {
    if (!id) return;
    try {
      const wishlist = JSON.parse(localStorage.getItem('vexokart_wishlist') || '[]');
      let updated = [];
      if (isWishlisted) {
        updated = wishlist.filter((item: string) => item !== id);
        toast.success("Removed from wishlist");
      } else {
        updated = [...wishlist, id];
        toast.success("Saved to luxury wishlist");
      }
      localStorage.setItem('vexokart_wishlist', JSON.stringify(updated));
      setIsWishlisted(!isWishlisted);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = product?.name || "VexoKart Premium Choice";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out ${product?.name} at VexoKart! Premium quality selection, delivered in 10 minutes.`,
          url: shareUrl
        });
      } catch (e) {
        console.log("Web share canceled or unsupported", e);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Product URL copied to clipboard");
    }
  };

  // Double tap zoom handler
  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (is360Active || isVideoMode) return;
    
    if (zoomScale > 1) {
      setZoomScale(1);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomCoords({ x, y });
      setZoomScale(2.2);
    }
  };

  // Pinch/Wheel zoom helper
  const handleWheelZoom = (e: React.WheelEvent) => {
    if (is360Active || isVideoMode) return;
    e.preventDefault();
    const nextScale = Math.min(Math.max(1, zoomScale + e.deltaY * -0.01), 3);
    setZoomScale(nextScale);
  };

  // Drag logic for 360 view rotating effect
  const handleMouseDown360 = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startDragXRef.current = e.clientX;
  };

  const handleMouseMove360 = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startDragXRef.current;
    startDragXRef.current = e.clientX;
    // Rotate 3D angle based on swipe delta
    setRotationAngle((prev) => (prev + deltaX * 1.8) % 360);
  };

  const handleMouseUp360 = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart360 = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    if (e.touches[0]) {
      startDragXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove360 = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    if (e.touches[0]) {
      const deltaX = e.touches[0].clientX - startDragXRef.current;
      startDragXRef.current = e.touches[0].clientX;
      setRotationAngle((prev) => (prev + deltaX * 1.8) % 360);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FAFAF8] min-h-screen p-6 space-y-8 animate-pulse text-left">
        <div className="h-[45vh] rounded-[32px] bg-slate-200/60 w-full" />
        <div className="space-y-3 max-w-lg mx-auto">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          <div className="h-16 bg-slate-200 rounded w-full mt-4" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          <div className="h-12 bg-slate-200 rounded-[20px]" />
          <div className="h-12 bg-slate-200 rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const stock_units = typeof product.stock_units === 'number' ? product.stock_units : (product.stock !== undefined ? product.stock : 0);
  const selling_price = typeof product.selling_price === 'number' ? product.selling_price : product.price;
  const mrp = typeof product.mrp === 'number' ? product.mrp : product.original_price;

  const oldPrice = mrp || Math.round(selling_price * 1.25);
  const savings = Math.max(0, oldPrice - selling_price);
  const discountPercent = oldPrice ? Math.round((savings / oldPrice) * 100) : 0;
  const isOutOfStock = stock_units <= 0;

  // Build high-end multi-image gallery
  const secondary = getSecondaryImagesForProduct(product);
  const gallery = [product.image_url || '', ...secondary];
  const demoVideo = getDemoVideoForProduct(product);

  const specData = getFullSpecifications(product);

  return (
    <div className="bg-[#FAFAF8] min-h-screen pb-36 text-left font-sans select-none overflow-x-hidden">
      
      {/* 1. TOP FLOATING NAVIGATION & IMMERSIVE GALLERY SECTION (45% of screen height) */}
      <div className="relative w-full h-[45vh] min-h-[340px] max-h-[500px] bg-gradient-to-b from-amber-50/20 to-white/95 border-b border-slate-100 overflow-hidden">
        
        {/* Floating Headers */}
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="h-11 w-11 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center border border-slate-200/50 text-slate-800 shadow-md active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="h-11 w-11 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center border border-slate-200/50 text-slate-800 shadow-md active:scale-90 transition-all cursor-pointer"
            >
              <Share2 className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={toggleWishlist}
              className={cn(
                "h-11 w-11 rounded-full backdrop-blur-md flex items-center justify-center border text-slate-800 shadow-md active:scale-90 transition-all cursor-pointer",
                isWishlisted 
                  ? "bg-rose-50 border-rose-100 text-rose-500" 
                  : "bg-white/70 border-slate-200/50 text-slate-800"
              )}
            >
              <Heart className={cn("h-4.5 w-4.5", isWishlisted && "fill-rose-500")} />
            </button>
          </div>
        </div>

        {/* Gallery viewport */}
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Interactive Modes overlay buttons */}
          <div className="absolute bottom-16 right-4 z-20 flex flex-col gap-2">
            {/* 360 Degree View button */}
            <button 
              onClick={() => {
                setIs360Active(!is360Active);
                setIsVideoMode(false);
                setZoomScale(1);
              }}
              className={cn(
                "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md backdrop-blur-md border",
                is360Active 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white/90 text-slate-700 border-slate-200"
              )}
            >
              <Rotate3d className="h-3.5 w-3.5" /> 360° Rotate
            </button>

            {/* Video Play Mode */}
            <button 
              onClick={() => {
                setIsVideoMode(!isVideoMode);
                setIs360Active(false);
                setZoomScale(1);
              }}
              className={cn(
                "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md backdrop-blur-md border",
                isVideoMode 
                  ? "bg-emerald-600 text-white border-emerald-600" 
                  : "bg-white/90 text-slate-700 border-slate-200"
              )}
            >
              <Video className="h-3.5 w-3.5" /> Cinematic Clip
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Mode A: Cinematic looping video */}
            {isVideoMode ? (
              <motion.div 
                key="video-player"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center"
              >
                <video
                  ref={videoRef}
                  src={demoVideo}
                  autoPlay
                  loop
                  muted={isVideoMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                
                {/* Audio controls */}
                <button 
                  onClick={() => setIsVideoMuted(!isVideoMuted)}
                  className="absolute bottom-16 left-4 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white z-10 transition-all active:scale-95 border border-white/10"
                >
                  {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <div className="absolute bottom-16 inset-x-16 text-center text-[10px] font-black uppercase tracking-widest text-emerald-400 drop-shadow">
                  🎥 Sourced Pure Campaign Loop
                </div>
              </motion.div>
            ) : is360Active ? (
              /* Mode B: 360° interactive drag rotation */
              <motion.div 
                key="360-rotator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onMouseDown={handleMouseDown360}
                onMouseMove={handleMouseMove360}
                onMouseUp={handleMouseUp360}
                onMouseLeave={handleMouseUp360}
                onTouchStart={handleTouchStart360}
                onTouchMove={handleTouchMove360}
                onTouchEnd={handleMouseUp360}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center cursor-ew-resize bg-amber-50/5 p-4"
              >
                {/* 360 Interactive Container */}
                <div 
                  className="relative max-h-[80%] aspect-square flex items-center justify-center transition-all duration-150 select-none pointer-events-none"
                  style={{
                    transform: `rotateY(${rotationAngle}deg)`,
                    perspective: 800
                  }}
                >
                  <img 
                    src={gallery[galleryIndex]} 
                    alt="Rotate" 
                    className="max-h-full object-contain filter drop-shadow-2xl"
                  />
                  {/* Subtle luxury glow ring */}
                  <div className="absolute inset-0 rounded-full border border-emerald-500/10 scale-105 pointer-events-none" />
                </div>
                <div className="absolute bottom-16 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/90 bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
                    ↔ Swipe left/right to rotate
                  </p>
                </div>
              </motion.div>
            ) : (
              /* Mode C: Standard premium double tap zoom & swipe gallery */
              <motion.div 
                key="standard-gallery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDoubleClick={handleDoubleTap}
                onWheel={handleWheelZoom}
                className="w-full h-full relative flex items-center justify-center p-6"
              >
                <motion.div 
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  }}
                  animate={{ scale: zoomScale }}
                  transition={{ type: "spring", damping: 25, stiffness: 180 }}
                >
                  <img 
                    src={gallery[galleryIndex]} 
                    alt={product.name}
                    className="max-h-[90%] object-contain filter drop-shadow-xl"
                  />
                </motion.div>

                {/* Double tap to zoom hint */}
                {zoomScale === 1 && (
                  <div className="absolute bottom-16 text-[9px] font-bold text-slate-400 uppercase tracking-wider pointer-events-none">
                     Double tap or pinch to zoom
                  </div>
                )}
                {zoomScale > 1 && (
                  <button 
                    onClick={() => setZoomScale(1)}
                    className="absolute bottom-16 bg-slate-900/90 text-white border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow"
                  >
                    Reset Zoom
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gallery bottom pager dots */}
        {!is360Active && !isVideoMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-white/60 px-3 py-1.5 rounded-full border border-white/50 backdrop-blur-md">
            {gallery.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setGalleryIndex(idx)}
                className={cn(
                  "h-1.5 transition-all duration-300 rounded-full",
                  idx === galleryIndex ? "w-6 bg-emerald-600" : "w-1.5 bg-slate-400/50 hover:bg-slate-500"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. OVERLAPPING FLOATING PRODUCT INFO CARD */}
      <div className="max-w-xl mx-auto px-4 -mt-8 relative z-30">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white rounded-[28px] p-6 shadow-xl shadow-slate-950/5 border border-slate-100"
        >
          {/* Tags row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-[9px] font-black tracking-[0.25em] text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10 flex items-center gap-1.5">
              <Award className="h-3 w-3 text-emerald-600" />
              VEXO CERTIFIED PURE
            </span>
            
            {/* Animated discount badge */}
            {discountPercent > 0 && (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-amber-500 text-white font-black text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-xl flex items-center gap-1 shadow shadow-amber-500/10"
              >
                <Sparkles className="h-2.5 w-2.5 animate-pulse" /> SAVE {discountPercent}%
              </motion.div>
            )}
          </div>

          {/* Product titles */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">{product.brand || "Premium Reserve"}</span>
            <h1 className="text-2xl font-black text-slate-900 leading-snug tracking-tight font-display">{product.name}</h1>
          </div>

          {/* Rating, reviews, and sold metrics */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 border-b border-slate-50 pb-4">
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-lg text-amber-800 text-[11px] font-black">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>4.9</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">428 customer reviews</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="text-[11px] font-extrabold text-[#C49B3B] bg-amber-500/5 px-2 py-0.5 rounded">2.4K+ sold recently</span>
          </div>

          {/* Pricing grid & Savings & EMI */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-black text-slate-900">₹{selling_price}</span>
                {oldPrice > selling_price && (
                  <span className="text-lg font-bold text-slate-300 line-through">₹{oldPrice}</span>
                )}
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-1 leading-none">Inclusive of all duties & taxes</p>
            </div>

            {/* Micro EMI block in CRED / Airbnb style */}
            <div 
              onClick={() => setShowEMIModal(true)}
              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-4 cursor-pointer active:scale-98 transition-all md:max-w-[200px]"
            >
              <div className="text-left">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Credit Options</span>
                <span className="text-[11px] font-extrabold text-slate-700 block">EMI from ₹{Math.round(selling_price / 12)}/mo</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Stock, delivery ETA, & unit weight */}
          <div className="mt-6 pt-5 border-t border-slate-50 grid grid-cols-2 gap-4">
            {/* Delivery time */}
            <div className="flex items-start gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Clock className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Est Delivery</span>
                <span className="text-xs font-black text-slate-800 block">10-15 Minutes</span>
              </div>
            </div>

            {/* Stock or Unit status */}
            <div className="flex items-start gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <PackageCheck className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Net Weight</span>
                <span className="text-xs font-black text-slate-800 block">{product.weight || "1 kg"}</span>
              </div>
            </div>
          </div>

          {/* Out of stock warnings or fast selling */}
          {isOutOfStock ? (
            <div className="mt-5 bg-rose-50 border border-rose-100 text-rose-600 p-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
              <X className="h-4 w-4" /> This luxury product is currently sold out
            </div>
          ) : (
            stock_units < 5 && (
              <div className="mt-5 bg-amber-50 border border-amber-100 text-amber-700 p-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                <Flame className="h-4 w-4 text-amber-500 animate-bounce" /> ONLY {stock_units} ITEMS LEFT IN OUR LOCAL CRISPER
              </div>
            )
          )}
        </motion.div>
      </div>

      {/* 3. CORE QUANTITY & PURCHASE ENGINE (Tactile / Apple) */}
      {!isOutOfStock && (
        <div className="max-w-xl mx-auto px-4 mt-6">
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-md flex items-center justify-between gap-6">
            <div className="text-left">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Select Item Quantity</p>
              <p className="text-[10px] text-slate-400 font-medium">Add multiple packs for extra bank savings</p>
            </div>

            {/* Spring Animated Quantity Selector */}
            <div className="flex items-center bg-[#FAFAF8] rounded-2xl p-1 border border-slate-200/60 shadow-inner">
              <button 
                onClick={() => {
                  if (itemQty > 0) {
                    removeFromCart(product.id);
                  }
                }}
                className="h-11 w-11 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200/50 active:scale-90 transition-all font-black text-lg outline-none"
              >
                <Minus className="h-4 w-4 stroke-[2.5px]" />
              </button>
              
              <AnimatePresence mode="wait">
                <motion.span 
                  key={itemQty || 0}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="w-10 text-center font-black text-md text-slate-900"
                >
                  {itemQty || 0}
                </motion.span>
              </AnimatePresence>

              <button 
                onClick={() => addToCart(product)}
                className="h-11 w-11 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-slate-200/50 active:scale-90 transition-all font-black text-lg outline-none"
              >
                <Plus className="h-4 w-4 stroke-[2.5px]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PREMIUM CAMPAIGN OFFERS SECTION (micro animated icons) */}
      <div className="max-w-xl mx-auto px-4 mt-8">
        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3.5">Exclusive Brand Campaigns</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {[
            {
              id: 'off20',
              title: "Flat 20% OFF",
              code: "VEXOPREMIUM20",
              desc: "On first purchase with HDFC Cards",
              color: "from-amber-50 to-amber-100/50",
              text: "text-amber-800",
              border: "border-amber-200/30",
              iconColor: "text-amber-600"
            },
            {
              id: 'bogo',
              title: "Buy 2 Get 1 Free",
              code: "FREESELECTION",
              desc: "Automatically active at checkout",
              color: "from-emerald-50 to-emerald-100/50",
              text: "text-emerald-800",
              border: "border-emerald-200/30",
              iconColor: "text-emerald-600"
            },
            {
              id: 'free',
              title: "Free Air-Delivery",
              code: "AIRFAST",
              desc: "On any orders exceeding ₹299",
              color: "from-sky-50 to-sky-100/50",
              text: "text-sky-800",
              border: "border-sky-200/30",
              iconColor: "text-sky-600"
            }
          ].map((offer) => (
            <div 
              key={offer.id}
              className={cn(
                "min-w-[210px] max-w-[210px] rounded-[24px] p-4 border bg-gradient-to-tr text-left flex flex-col justify-between shadow-sm relative overflow-hidden group",
                offer.color,
                offer.border
              )}
            >
              {/* Gold coin shine animation effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
              
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Gift className={cn("h-4 w-4 animate-pulse", offer.iconColor)} />
                  <span className={cn("text-xs font-black uppercase tracking-wide", offer.text)}>{offer.title}</span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 leading-snug">{offer.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/30 flex items-center justify-between">
                <span className="text-[8px] font-mono font-black tracking-wider bg-white/65 border border-slate-200/30 px-2 py-1 rounded-lg text-slate-600">
                  {offer.code}
                </span>
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest cursor-pointer hover:underline">Apply</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. PREMIUM EXPANDABLE ACCORDIONS SECTION */}
      <div className="max-w-xl mx-auto px-4 mt-8">
        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3.5 font-sans">Campaign Story & Details</h3>
        
        <div className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-sm divide-y divide-slate-100">
          {[
            { id: 'desc', title: 'Product Story', content: specData.description, type: 'text' },
            { id: 'ingredients', title: 'Grown Composition & Ingredients', content: specData.ingredients, type: 'text' },
            { id: 'specs', title: 'Technical Specifications', content: specData.specifications, type: 'table' },
            { id: 'benefits', title: 'Health & Ecological Benefits', content: specData.benefits, type: 'list' },
            { id: 'usage', title: 'Curated Chef Usage Guide', content: specData.howToUse, type: 'text' },
            { id: 'storage', title: 'Optimum Flavor Storage Method', content: specData.storage, type: 'text' }
          ].map((section) => {
            const isOpen = activeAccordion === section.id;
            return (
              <div key={section.id} className="text-left">
                <button 
                  onClick={() => setActiveAccordion(isOpen ? null : section.id)}
                  className="w-full flex items-center justify-between p-5 text-left font-black text-slate-800 text-xs uppercase tracking-wider hover:bg-slate-50 transition-all outline-none"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    {section.title}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden bg-slate-50/50"
                    >
                      <div className="p-5 pt-0 border-t border-slate-50 text-xs font-bold text-slate-500 leading-relaxed font-sans space-y-3">
                        {section.type === 'text' && <p className="pt-4">{section.content as string}</p>}
                        
                        {section.type === 'list' && (
                          <ul className="pt-4 space-y-2">
                            {(section.content as string[]).map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-600">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {section.type === 'table' && (
                          <div className="pt-4 space-y-2">
                            {(section.content as any[]).map((spec, i) => (
                              <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs">
                                <span className="font-extrabold text-slate-400 uppercase tracking-wider">{spec.label}</span>
                                <span className="font-black text-slate-800 text-right">{spec.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. PREMIUM DELIVERY CARD WITH CURRENT ADDRESS */}
      <div className="max-w-xl mx-auto px-4 mt-8">
        <div className="bg-slate-900 text-white rounded-[28px] p-6 shadow-xl relative overflow-hidden text-left">
          {/* Accent decoration glow */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-tr from-transparent to-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="text-[9px] font-black tracking-[0.25em] text-emerald-400 uppercase flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                VEXO ULTRALIGHT EXPRESS
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none mb-1">Delivering To</span>
                <p className="text-sm font-black text-white line-clamp-2 leading-snug">{address || "Set Current Address inside Location Manager"}</p>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end">
              <Clock className="h-6 w-6 text-emerald-400" />
              <span className="text-[9px] font-black uppercase text-slate-400 mt-2">Time</span>
              <span className="text-xs font-black text-[#C49B3B] uppercase">10 MINS</span>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[9.5px] font-bold text-slate-400 block">Status:</span>
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">✓ FREE EXPRESS ACTIVE</span>
            </div>
            
            <button 
              onClick={() => {
                navigate('/home');
                toast.info("Manage active shipping credentials in the home banner picker.");
              }}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-colors"
            >
              Change Address
            </button>
          </div>
        </div>
      </div>

      {/* 7. HIGH-END REVIEWS SHOWCASE (User uploads, avatars, verified indicators) */}
      <div className="max-w-xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Verified Critic Reviews</h3>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">4.9 average index</span>
        </div>

        <div className="space-y-4">
          {[
            {
              id: 'rev1',
              user: "Arjun Mehta",
              avatar: "A",
              rating: 5,
              date: "3 days ago",
              comment: "Absolutely top tier packaging. Sourced vegetables are incredibly crisp with no wilt whatsoever. The interactive 360 rotation feature let me see the farm quality before ordering. Hand-delivered in exactly 9 minutes!",
              images: [
                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300",
                "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=300"
              ],
              helpfulCount: 34
            },
            {
              id: 'rev2',
              user: "Shreya Ghoshal",
              avatar: "S",
              rating: 5,
              date: "1 week ago",
              comment: "Amazing quality control. Usually grocery delivery apps give sub-par avocados and mangoes, but VexoReserve is incredibly luxurious and delicious. Sourced naturally and worth every single rupee.",
              images: [],
              helpfulCount: 18
            }
          ].map((review) => {
            return (
              <div key={review.id} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm text-left">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase">
                      {review.avatar}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                        {review.user}
                        <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border border-emerald-500/10 scale-90">
                          VERIFIED PURCHASE
                        </span>
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5 block">{review.date}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-600 mt-4 leading-relaxed">{review.comment}</p>

                {/* Review Images */}
                {review.images.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {review.images.map((img, idx) => (
                      <div key={idx} className="h-14 w-14 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Helpful buttons */}
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <button 
                    onClick={() => toast.success("Feedback saved. Thank you!")}
                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({review.helpfulCount})
                  </button>
                  <span className="text-[9px] font-bold text-slate-400">Was this review helpful?</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. RECENTLY VIEWED PRODUCTS (Fully animated storage hook) */}
      {recentlyViewed.length > 0 && (
        <div className="max-w-xl mx-auto px-4 mt-10">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4">Recently Viewed</h3>
          
          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
            {recentlyViewed.map((item) => (
              <div 
                key={item.id} 
                className="min-w-[155px] max-w-[155px] cursor-pointer"
                onClick={() => {
                  navigate(`/product/${item.id}`);
                  window.scrollTo(0, 0);
                }}
              >
                <div className="bg-white rounded-[24px] p-3 border border-slate-100 shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-all">
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 mb-2">
                    <img 
                      src={item.image_url || ''} 
                      alt={item.name} 
                      className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[11px] text-slate-800 line-clamp-2 leading-snug text-left h-8">
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50">
                      <span className="font-black text-xs text-slate-900">₹{item.selling_price || item.price}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. SIMILAR PREMIUM SELECTIONS (Horizontal premium carousel) */}
      {recommended.length > 0 && (
        <div className="max-w-xl mx-auto px-4 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">You may also like</h3>
            <button 
              onClick={() => navigate('/categories')}
              className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-0.5"
            >
              See All <ChevronRight className="h-3.5 w-3.5 stroke-[2.5px]" />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-4 px-4">
            {recommended.map(item => (
              <div key={item.id} className="min-w-[165px] max-w-[165px]">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. ELEGANT FLOATING PURCHASE BAR */}
      <footer className="fixed bottom-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 pb-8 shadow-[0_-15px_40px_rgba(0,0,0,0.06)]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          
          {/* Prices, total price dynamic change */}
          <div className="text-left flex flex-col justify-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Estimated Total</span>
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-2xl font-black text-slate-900 leading-none">
                ₹{(itemQty || 1) * selling_price}
              </span>
              {(itemQty || 1) > 1 && (
                <span className="text-[10px] text-slate-400 font-bold">({itemQty} items)</span>
              )}
            </div>
            {savings > 0 && (
              <p className="text-[10px] font-black text-emerald-600 mt-1 leading-none">You save ₹{(itemQty || 1) * savings} instantly</p>
            )}
          </div>

          {/* Action buttons (Not oversized, extremely sleek) */}
          <div className="flex items-center gap-2">
            
            {/* Elegant Add to Cart */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                addToCart(product);
                toast.success('Successfully added to Cart');
              }}
              disabled={isOutOfStock}
              className={cn(
                "h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all border outline-none",
                isOutOfStock
                  ? "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed"
                  : "bg-[#FAFAF8] text-slate-800 border-slate-200/80 hover:bg-slate-50 shadow-sm"
              )}
            >
              <ShoppingCart className="h-4 w-4" /> Add
            </motion.button>

            {/* Premium Buy Now */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Add to cart and immediately route to checkout
                addToCart(product);
                navigate('/cart');
              }}
              disabled={isOutOfStock}
              className={cn(
                "h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all outline-none",
                isOutOfStock
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/10"
              )}
            >
              <Zap className="h-4 w-4 fill-white text-emerald-300" /> Buy Now
            </motion.button>
          </div>
        </div>
      </footer>

      {/* 11. LUXURY NO-COST EMI DRAWER MODAL (Apple/CRED inspired) */}
      <AnimatePresence>
        {showEMIModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center p-0">
            {/* Tap backdrop to close */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setShowEMIModal(false)} />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white w-full max-w-xl rounded-t-[32px] p-6 shadow-2xl relative z-10 text-left border-t border-slate-100"
            >
              {/* Grab bar indicator */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowEMIModal(false)} />

              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                    <CreditCard className="h-5 w-5 text-[#C49B3B]" /> No-Cost Luxury EMI options
                  </h3>
                  <p className="text-slate-400 text-[10px] font-extrabold uppercase mt-1 tracking-wider">Available on leading Indian premium credit cards</p>
                </div>
                <button 
                  onClick={() => setShowEMIModal(false)}
                  className="h-9 w-9 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="h-4.5 w-4.5 text-slate-500" />
                </button>
              </div>

              <div className="mt-5 space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-6">
                {[
                  { bank: "HDFC Premium Cards", scheme: "No-Cost EMI for 3 Months", rate: "₹" + Math.round(selling_price / 3) + "/mo", interest: "0% Interest", note: "Processing fee: ₹199" },
                  { bank: "ICICI Emerald Select", scheme: "No-Cost EMI for 6 Months", rate: "₹" + Math.round(selling_price / 6) + "/mo", interest: "0% Interest", note: "Processing fee: ₹0 (Waived)" },
                  { bank: "SBI Prime Elite", scheme: "Standard EMI for 12 Months", rate: "₹" + Math.round((selling_price * 1.12) / 12) + "/mo", interest: "12% p.a. interest", note: "Processing fee: ₹99" },
                  { bank: "Vexo Exclusive Reserve Credit", scheme: "Premium 12-Month No-Cost Special", rate: "₹" + Math.round(selling_price / 12) + "/mo", interest: "0% Interest", note: "Reserved for high score cardholders" }
                ].map((plan, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 hover:border-amber-500/25 bg-slate-50/50 hover:bg-amber-500/5 transition-all flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-slate-800 block">{plan.bank}</span>
                      <span className="text-[10px] font-bold text-slate-400 block">{plan.scheme}</span>
                      <span className="text-[9px] text-amber-600 font-extrabold block">{plan.note}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 block">{plan.rate}</span>
                      <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/10 inline-block mt-0.5">
                        {plan.interest}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowEMIModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-13 rounded-2xl font-black text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
              >
                <Lock className="h-4 w-4 text-slate-400" /> Done & Return
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
