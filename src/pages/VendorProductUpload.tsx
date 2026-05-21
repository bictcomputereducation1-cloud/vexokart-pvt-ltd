import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { 
  Save, X, Upload, CheckCircle2, ChevronRight, Eye, AlertCircle, Trash2, Plus, GripVertical, Info, LayoutTemplate, Star, Timer, ShoppingCart, ShoppingBag
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, Subcategory } from '../types';
import { cn } from '../lib/utils';

const STEPS = [
  { id: 1, title: 'Basic Details', subtitle: 'Brand, Name, Type' },
  { id: 2, title: 'Commercials', subtitle: 'Category, Taxes, Fees' },
  { id: 3, title: 'Attributes', subtitle: 'Category specific details' },
  { id: 4, title: 'Pricing', subtitle: 'MRP, Selling price, Stock' },
  { id: 5, title: 'Media', subtitle: 'Images & Video' },
  { id: 6, title: 'Review', subtitle: 'Verify & Submit' },
];

function ProductPreviewMobile({
  formData,
  categoryName
}: {
  formData: Partial<Product>;
  categoryName: string;
}) {
  const rawImages = typeof formData.images === 'string' 
    ? (() => { try { return JSON.parse(formData.images); } catch { return []; } })()
    : formData.images;
  const images = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [];
  const mainImage = formData.image_url || images[0] || 'https://via.placeholder.com/300x300?text=No+Image';
  const price = formData.price || 0;
  const originalPrice = formData.original_price || 0;
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100) || 0;

  return (
    <div className="w-[360px] h-[720px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-[8px] border-slate-900 shrink-0 mx-auto overflow-hidden flex flex-col">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50"></div>
      
      {/* Screen */}
      <div className="flex-1 bg-white rounded-[2rem] overflow-y-auto overflow-x-hidden hide-scrollbar relative">
        {/* Header App Style */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold">V</div>
             <span className="font-bold text-slate-900 text-sm tracking-tight">VexoKart</span>
           </div>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-50">
             <ShoppingBag className="h-4 w-4 text-slate-600" />
           </Button>
        </div>

        {/* Content */}
        <div className="pb-24">
          {/* Breadcrumb */}
          <div className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-slate-400">
            Home <span className="mx-1">›</span> {categoryName || 'Category'}
          </div>

          {/* Image Section */}
          <div className="w-full aspect-square bg-white relative p-6 flex flex-col">
            <div className="flex-1 relative mb-4">
              <motion.img 
                key={mainImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={mainImage} 
                alt="Main" 
                className="w-full h-full object-contain drop-shadow-sm" 
              />
              {discount > 0 && (
                <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md flex flex-col items-center leading-tight">
                  <span>{discount}%</span>
                  <span>OFF</span>
                </div>
              )}
            </div>
            
            {/* Carousel dots */}
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 w-full">
                {images.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === 0 ? 'w-4 bg-primary' : 'w-1.5 bg-slate-200'}`}></div>
                ))}
              </div>
            )}

            <div className="absolute bottom-4 right-4 bg-slate-100 text-[10px] font-bold px-2.5 py-1.5 rounded-full text-slate-600 backdrop-blur-md bg-white/80 border border-slate-200/50 shadow-sm flex items-center">
              <Timer className="h-3 w-3 mr-1 text-primary" /> 10 MINS
            </div>
          </div>

          {/* Basic Info */}
          <div className="px-4 space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{formData.brand || 'Brand Name'}</div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
               {formData.name || 'Product Name Preview'}
            </h1>
            <div className="flex items-center justify-between pt-1">
              <div className="text-sm font-semibold text-slate-500">
                 {formData.unit_value || '1'} {formData.unit_type || 'pc'}
              </div>
              <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-green-700 text-xs font-bold border border-green-100">
                <span>4.5</span>
                <Star className="h-3 w-3 fill-current" />
              </div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="px-4 py-5 space-y-4">
             <div className="flex items-center justify-between">
               <div className="flex flex-col">
                  {originalPrice > price && (
                    <span className="text-xs font-medium text-slate-400 line-through decoration-slate-300">MRP ₹{originalPrice}</span>
                  )}
                  <span className="text-2xl flex items-start gap-0.5 font-black text-slate-900 leading-none">
                    <span className="text-sm mt-1">₹</span>{price}
                  </span>
               </div>
               
               {/* Fake Add button */}
               <div className="h-10 w-24 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold flex items-center justify-center text-sm shadow-sm relative overflow-hidden group hover:opacity-80 transition cursor-default">
                  ADD
                  <div className="absolute top-0 right-0 w-4 h-4 bg-red-100 rounded-bl-xl flex items-center justify-center">
                    <Plus className="h-2.5 w-2.5 text-red-600" />
                  </div>
               </div>
             </div>

             {/* Stock & Delivery Badges */}
             <div className="flex gap-2">
               {formData.stock !== undefined && formData.stock > 0 ? (
                 <div className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100">
                   IN STOCK
                 </div>
               ) : (
                 <div className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold border border-red-100">
                   OUT OF STOCK
                 </div>
               )}
               {formData.cod_available !== false && (
                 <div className="px-2 py-1 bg-slate-50 text-slate-700 rounded text-[10px] font-bold border border-slate-200">
                   COD ELIGIBLE
                 </div>
               )}
             </div>
          </div>

          <div className="h-2 w-full bg-slate-50"></div>

          {/* Details Card */}
          <div className="px-4 py-4 space-y-5">
             <div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-3">Product Details</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                   <div>
                     <span className="block text-slate-500 mb-0.5 font-medium">Type</span>
                     <span className="font-semibold text-slate-900 capitalize">{formData.attributes?.dietary || formData.product_type || 'General'}</span>
                   </div>
                   <div>
                     <span className="block text-slate-500 mb-0.5 font-medium">Shelf Life</span>
                     <span className="font-semibold text-slate-900">{formData.shelf_life || '--'}</span>
                   </div>
                   {formData.speciality && (
                     <div>
                       <span className="block text-slate-500 mb-0.5 font-medium">Speciality</span>
                       <span className="font-semibold text-slate-900">{formData.speciality}</span>
                     </div>
                   )}
                   {formData.weight && (
                     <div>
                       <span className="block text-slate-500 mb-0.5 font-medium">Weight</span>
                       <span className="font-semibold text-slate-900">{formData.weight}</span>
                     </div>
                   )}
                   {formData.attributes?.flavor && (
                     <div>
                       <span className="block text-slate-500 mb-0.5 font-medium">Flavor</span>
                       <span className="font-semibold text-slate-900">{formData.attributes.flavor}</span>
                     </div>
                   )}
                </div>
             </div>

             {Array.isArray(formData.highlights) && formData.highlights.length > 0 && formData.highlights.some(Boolean) && (
               <div className="pt-4 border-t border-slate-100">
                 <h3 className="text-[15px] font-bold text-slate-900 mb-3">Key Highlights</h3>
                 <ul className="space-y-2 text-sm font-medium text-slate-600">
                   {formData.highlights.filter(Boolean).map((h, i) => (
                     <li key={i} className="flex gap-2 items-start">
                       <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0"></div>
                       <span className="flex-1 leading-snug">{h}</span>
                     </li>
                   ))}
                 </ul>
               </div>
             )}

             {formData.description && (
               <div className="pt-4 border-t border-slate-100 flex flex-col">
                 <h3 className="text-[15px] font-bold text-slate-900 mb-2">Description</h3>
                 <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-3 relative">
                   {formData.description}
                 </p>
                 <span className="text-xs font-bold text-primary mt-1 cursor-pointer">View More</span>
               </div>
             )}
          </div>

          <div className="h-2 w-full bg-slate-50"></div>

          {/* You might also like mock */}
          <div className="px-4 py-4">
             <h3 className="text-[15px] font-bold text-slate-900 mb-3">You might also like</h3>
             <div className="flex gap-3 overflow-x-hidden">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-[100px] shrink-0 space-y-2">
                     <div className="w-full aspect-square bg-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center">
                       <LayoutTemplate className="h-6 w-6 text-slate-300 opacity-50" />
                       <div className="absolute bottom-1 right-1 h-6 w-6 bg-white rounded-md shadow flex items-center justify-center">
                          <Plus className="h-4 w-4 text-primary" />
                       </div>
                     </div>
                     <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                     <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                  </div>
                ))}
             </div>
          </div>


        </div>
      </div>
    </div>
  );
}

export default function VendorProductUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isInitializing, setIsInitializing] = useState(!!productId);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [formData, setFormData] = useState<Partial<Product>>({
    verification_status: 'draft',
    images: [],
    highlights: [],
    specifications: {},
    attributes: {}
  });

  useEffect(() => {
    fetchCategories();
    if (productId && profile?.id) {
      fetchProduct();
    } else {
      setIsInitializing(false);
    }
  }, [productId, profile]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
      if (error) throw error;
      if (data) {
        // Parse JSON fields that might come as strings from DB depending on setup
        if (typeof data.images === 'string') {
          try { data.images = JSON.parse(data.images); } catch { data.images = []; }
        }
        if (typeof data.highlights === 'string') {
          try { data.highlights = JSON.parse(data.highlights); } catch { data.highlights = []; }
        }
        if (typeof data.attributes === 'string') {
          try { data.attributes = JSON.parse(data.attributes); } catch { data.attributes = {}; }
        }

        setFormData(data);
      }
    } catch (error) {
       toast.error("Failed to load product");
    } finally {
       setIsInitializing(false);
    }
  };

  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name && formData.verification_status === 'draft' && !isInitializing) {
        handleSaveDraft(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [formData, isInitializing]);

  const fetchCategories = async () => {
    const { data: cats } = await supabase.from('categories').select('*').order('name');
    if (cats) setCategories(cats);
    const { data: subcats } = await supabase.from('subcategories').select('*').order('name');
    if (subcats) setSubcategories(subcats);
  };

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(s => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const handleSaveDraft = async (silent = false) => {
    if (!profile?.id) return;
    try {
      if (!silent) setIsSaving(true);

      const { data: vendor, error: vendorErr } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (vendorErr || !vendor) {
        if (!silent) toast.error('Vendor profile not found');
        return;
      }
      
      const payload = {
        ...formData,
        vendor_id: vendor.id,
        verification_status: 'draft'
      };

      if (!payload.name) payload.name = 'Untitled Product';
      if (!payload.price) payload.price = 0;
      if (!payload.original_price) payload.original_price = 0;

      let res;
      if (formData.id) {
         res = await supabase.from('products').update(payload).eq('id', formData.id).select();
      } else {
         res = await supabase.from('products').insert([payload]).select();
      }

      if (res.error) throw res.error;
      
      if (res.data && res.data[0]) {
        setFormData(res.data[0] as Product);
      }
      setLastSaved(new Date());
      if (!silent) toast.success('Draft saved successfully');
    } catch (error: any) {
      if (!silent) toast.error('Failed to save draft');
      console.error(error);
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id) return;
    try {
      setIsSaving(true);
      
      const { data: vendor, error: vendorErr } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (vendorErr || !vendor) {
        toast.error('Vendor profile not found');
        return;
      }

      const payload = {
        ...formData,
        vendor_id: vendor.id,
        verification_status: 'pending', // Move to pending review
        admin_comments: null // Clear old feedback upon resubmission
      };

      const res = formData.id 
        ? await supabase.from('products').update(payload).eq('id', formData.id)
        : await supabase.from('products').insert([payload]);

      if (res.error) throw res.error;
      
      toast.success('Product submitted for review');
      navigate('/vendor/dashboard');
    } catch (error: any) {
      toast.error('Failed to submit product');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Stepper */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vendor/dashboard')} className="-ml-2 h-8 w-8 rounded-full">
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">Add New Product</h1>
            <p className="text-xs text-slate-500">Seller Hub</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all",
                  isActive ? "bg-primary/5 " : "hover:bg-slate-50",
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full shrink-0 font-bold text-sm",
                  isActive ? "bg-primary text-white shadow-md shadow-primary/20" : 
                  isCompleted ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.id}
                </div>
                <div className="flex-1 pt-1.5">
                  <p className={cn("text-sm font-bold leading-none", isActive ? "text-primary" : isCompleted ? "text-slate-900" : "text-slate-500")}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{step.subtitle}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round((currentStep / 6) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
          {lastSaved && (
            <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
              Draft autosaved {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-40">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vendor/dashboard')} className="-ml-2 h-8 w-8 rounded-full shrink-0">
            <X className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 text-sm truncate">Step {currentStep} of 6: {STEPS[currentStep-1].title}</h1>
            <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
               <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(currentStep / 6) * 100}%` }} />
            </div>
          </div>
          <Button 
            variant={showMobilePreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className={cn("h-8 rounded-full text-xs font-bold px-3 shrink-0", showMobilePreview && "bg-slate-900 text-white")}
          >
            <Eye className="h-3 w-3 mr-1.5" /> Preview
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Mobile Collapsible Preview */}
          <AnimatePresence>
            {showMobilePreview && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="lg:hidden absolute inset-0 z-30 bg-slate-100 flex flex-col pt-4 overflow-y-auto w-full pb-24"
              >
                <div className="text-center w-full max-w-[360px] mx-auto scale-90 md:scale-100 origin-top">
                   <h3 className="font-bold text-slate-700">Live Preview</h3>
                   <p className="text-xs text-slate-500 mb-4">Customer app view reflects changes in real-time</p>
                </div>
                <div className="scale-90 md:scale-100 origin-top transform">
                  <ProductPreviewMobile 
                    formData={formData} 
                    categoryName={categories.find(c => c.id === formData.category_id)?.name || ''} 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Container */}
          <div className="flex-1 overflow-y-auto flex flex-col z-10 bg-white lg:bg-transparent">
            <div className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-10"
                >
                {/* Step 1: Basic Details */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Basic Details</h2>
                      <p className="text-slate-500 font-medium mt-1">Provide clear, accurate details to help customers find your product.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Brand Name</label>
                        <Input 
                          value={formData.brand || ''} 
                          onChange={(e) => handleChange('brand', e.target.value)}
                          placeholder="e.g. Amul, Aashirvaad"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Product Name <span className="text-red-500">*</span></label>
                        <Input 
                          value={formData.name || ''} 
                          onChange={(e) => handleChange('name', e.target.value)}
                          placeholder="e.g. Fresh Toned Milk, Whole Wheat Atta"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium text-lg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">UPC / Barcode</label>
                        <Input 
                          value={formData.upc || ''} 
                          onChange={(e) => handleChange('upc', e.target.value)}
                          placeholder="890123456789"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Product Type</label>
                        <Input 
                          value={formData.product_type || ''} 
                          onChange={(e) => handleChange('product_type', e.target.value)}
                          placeholder="e.g. Dairy, Grocery"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Unit Value</label>
                        <Input 
                          value={formData.unit_value || ''} 
                          onChange={(e) => handleChange('unit_value', e.target.value)}
                          placeholder="e.g. 500, 1"
                          type="number"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Unit Type</label>
                        <Select value={formData.unit_type || ''} onValueChange={(v) => handleChange('unit_type', v)}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">Gram (g)</SelectItem>
                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                            <SelectItem value="ml">Milliliter (ml)</SelectItem>
                            <SelectItem value="l">Liter (L)</SelectItem>
                            <SelectItem value="pc">Piece (pc)</SelectItem>
                            <SelectItem value="pack">Pack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Product Description</label>
                        <textarea 
                          value={formData.description || ''} 
                          onChange={(e) => handleChange('description', e.target.value)}
                          placeholder="Detailed description of the product..."
                          className="w-full min-h-[120px] rounded-2xl bg-slate-50/50 border border-slate-200 font-medium resize-none p-4 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Commercials */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Category & Commercials</h2>
                      <p className="text-slate-500 font-medium mt-1">Classification and tax details.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Main Category <span className="text-red-500">*</span></label>
                        <Select value={formData.category_id || ''} onValueChange={(v) => handleChange('category_id', v)}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Subcategory</label>
                        <Select value={formData.subcategory_id || 'none'} onValueChange={(v) => handleChange('subcategory_id', v === 'none' ? null : v)}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium">
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {subcategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">HSN Code</label>
                        <Input 
                          value={formData.hsn_code || ''} 
                          onChange={(e) => handleChange('hsn_code', e.target.value)}
                          placeholder="e.g. 19059090"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">GST Percentage (%)</label>
                        <Select value={formData.gst_percentage?.toString() || '0'} onValueChange={(v) => handleChange('gst_percentage', parseFloat(v))}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium">
                            <SelectValue placeholder="Select GST %" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (Exempt)</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Vendor Margin (%)</label>
                        <Input 
                          value={formData.vendor_margin || ''} 
                          type="number"
                          onChange={(e) => handleChange('vendor_margin', parseFloat(e.target.value))}
                          placeholder="e.g. 15"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Delivery Charges (₹)</label>
                        <Input 
                          value={formData.delivery_charges || ''} 
                          type="number"
                          onChange={(e) => handleChange('delivery_charges', parseFloat(e.target.value))}
                          placeholder="e.g. 20"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Attributes */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Category Attributes</h2>
                      <p className="text-slate-500 font-medium mt-1">Specific details to help filtering.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Weight Display</label>
                        <Input 
                          value={formData.weight || ''} 
                          onChange={(e) => handleChange('weight', e.target.value)}
                          placeholder="e.g. 500g"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Shelf Life</label>
                        <Input 
                          value={formData.shelf_life || ''} 
                          onChange={(e) => handleChange('shelf_life', e.target.value)}
                          placeholder="e.g. 12 Months"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Speciality</label>
                        <Input 
                          value={formData.speciality || ''} 
                          onChange={(e) => handleChange('speciality', e.target.value)}
                          placeholder="e.g. Organic, Natural"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Dietary Preference</label>
                        <Select value={formData.attributes?.dietary || ''} onValueChange={(v) => handleChange('attributes', {...formData.attributes, dietary: v})}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Flavor</label>
                        <Input 
                          value={formData.attributes?.flavor || ''} 
                          onChange={(e) => handleChange('attributes', {...formData.attributes, flavor: e.target.value})}
                          placeholder="e.g. Chocolate, Vanilla"
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Product Highlights (Bullet points)</label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const parsed = Array.isArray(formData.highlights) ? formData.highlights : (typeof formData.highlights === 'string' ? (() => { try { return JSON.parse(formData.highlights); } catch { return []; } })() : []);
                            handleChange('highlights', [...parsed, '']);
                          }}
                          className="h-8 rounded-full text-xs font-bold"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add 
                        </Button>
                      </div>
                      
                      {(Array.isArray(formData.highlights) ? formData.highlights : (typeof formData.highlights === 'string' ? (() => { try { return JSON.parse(formData.highlights); } catch { return []; } })() : [])).map((h: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input 
                            value={h}
                            onChange={(e) => {
                              const parsed = Array.isArray(formData.highlights) ? formData.highlights : (typeof formData.highlights === 'string' ? (() => { try { return JSON.parse(formData.highlights); } catch { return []; } })() : []);
                              const newH = [...parsed];
                              newH[i] = e.target.value;
                              handleChange('highlights', newH);
                            }}
                            placeholder={`Point ${i+1}`}
                            className="h-12 rounded-xl bg-slate-50/50 border-slate-200"
                          />
                          <Button variant="ghost" size="icon" onClick={() => {
                             const parsed = Array.isArray(formData.highlights) ? formData.highlights : (typeof formData.highlights === 'string' ? (() => { try { return JSON.parse(formData.highlights); } catch { return []; } })() : []);
                             handleChange('highlights', parsed.filter((_, idx)=>idx!==i));
                          }} className="text-red-500 hover:bg-red-50 rounded-xl h-12 w-12">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Pricing */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Pricing & Inventory</h2>
                      <p className="text-slate-500 font-medium mt-1">Set prices correctly to appear in offers.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">MRP (₹) <span className="text-red-500">*</span></label>
                        <Input 
                          value={formData.original_price || ''} 
                          type="number"
                          onChange={(e) => handleChange('original_price', parseFloat(e.target.value))}
                          className="h-14 rounded-2xl bg-white border-slate-300 font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Selling Price (₹) <span className="text-red-500">*</span></label>
                        <Input 
                          value={formData.price || ''} 
                          type="number"
                          onChange={(e) => {
                             const p = parseFloat(e.target.value);
                             handleChange('price', p);
                             if (formData.original_price && p) {
                               handleChange('offer_percentage', Math.round(((formData.original_price - p) / formData.original_price) * 100));
                             }
                          }}
                          className="h-14 rounded-2xl bg-green-50 border-green-200 text-green-700 font-black text-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Offer Percentage (%)</label>
                        <Input 
                          value={formData.offer_percentage || ''} 
                          readOnly
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium text-slate-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Stock Units available <span className="text-red-500">*</span></label>
                         <Input 
                           value={formData.stock || ''} 
                           type="number"
                           onChange={(e) => handleChange('stock', parseInt(e.target.value))}
                           className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Min Order Quantity</label>
                         <Input 
                           value={formData.min_order_qty || 1} 
                           type="number"
                           onChange={(e) => handleChange('min_order_qty', parseInt(e.target.value))}
                           className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                         />
                      </div>
                      
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Max Order Quantity (Per User)</label>
                         <Input 
                           value={formData.max_order_qty || 10} 
                           type="number"
                           onChange={(e) => handleChange('max_order_qty', parseInt(e.target.value))}
                           className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                         />
                      </div>

                    </div>
                  </div>
                )}

                {/* Step 5: Media */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Images & Media</h2>
                      <p className="text-slate-500 font-medium mt-1">High-quality images increase sales conversion.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Main Image URL</label>
                      <Input 
                        value={formData.image_url || ''} 
                        onChange={(e) => handleChange('image_url', e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                      />
                      {formData.image_url && (
                        <div className="w-32 h-32 rounded-2xl border-2 border-primary/20 overflow-hidden bg-slate-50 relative group">
                          <img src={formData.image_url} className="w-full h-full object-contain p-2" alt="Main preview" />
                          <div className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Primary</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                         <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Additional Images</label>
                         <Button type="button" variant="outline" size="sm" onClick={() => {
                           const parsed = Array.isArray(formData.images) ? formData.images : (typeof formData.images === 'string' ? (() => { try { return JSON.parse(formData.images); } catch { return []; } })() : []);
                           handleChange('images', [...parsed, '']);
                         }} className="h-8 rounded-full text-xs font-bold">
                           <Plus className="h-3 w-3 mr-1" /> Add Image
                         </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(Array.isArray(formData.images) ? formData.images : (typeof formData.images === 'string' ? (() => { try { return JSON.parse(formData.images); } catch { return []; } })() : [])).map((img: string, i: number) => (
                           <div key={i} className="relative group rounded-2xl border border-slate-200 overflow-hidden aspect-square flex flex-col">
                              {img ? (
                                <img src={img} className="w-full h-full object-contain p-2 bg-slate-50" />
                              ) : (
                                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-2">
                                  <Upload className="h-6 w-6 text-slate-300 mb-2" />
                                  <Input 
                                    placeholder="Image URL" 
                                    className="h-8 text-xs px-2"
                                    onChange={(e) => {
                                      const parsed = Array.isArray(formData.images) ? formData.images : (typeof formData.images === 'string' ? (() => { try { return JSON.parse(formData.images); } catch { return []; } })() : []);
                                      const newI = [...parsed];
                                      newI[i] = e.target.value;
                                      handleChange('images', newI);
                                    }}
                                  />
                                </div>
                              )}
                              {img && (
                                <button
                                  onClick={() => {
                                    const parsed = Array.isArray(formData.images) ? formData.images : (typeof formData.images === 'string' ? (() => { try { return JSON.parse(formData.images); } catch { return []; } })() : []);
                                    handleChange('images', parsed.filter((_, idx)=>idx!==i));
                                  }}
                                  className="absolute top-2 right-2 h-6 w-6 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6: Review */}
                {currentStep === 6 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Review & Submit</h2>
                      <p className="text-slate-500 font-medium mt-1">Check all details before submitting for approval.</p>
                    </div>

                    <div className="bg-slate-50 rounded-[2rem] p-6 md:p-8 space-y-6 border border-slate-100">
                       <div className="flex gap-6">
                          <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 p-2 shrink-0">
                            {formData.image_url ? (
                              <img src={formData.image_url} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center"><AlertCircle className="text-slate-300" /></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-500 mb-1">{formData.brand || 'No Brand'}</div>
                            <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">{formData.name || 'Untitled Product'}</h3>
                            <div className="flex items-end gap-2">
                              <span className="text-xl font-black text-green-700">₹{formData.price || 0}</span>
                              <span className="text-sm font-medium text-slate-400 line-through mb-0.5">₹{formData.original_price || 0}</span>
                            </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200/60">
                          <div>
                            <p className="text-xs font-bold text-slate-500">Category / Sub</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {categories.find(c=>c.id===formData.category_id)?.name || 'Not set'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500">Stock</p>
                            <p className="text-sm font-semibold text-slate-900">{formData.stock || 0} Units</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500">GST / Margin</p>
                            <p className="text-sm font-semibold text-slate-900">{formData.gst_percentage || 0}% / {formData.vendor_margin || 0}%</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500">Weight Setup</p>
                            <p className="text-sm font-semibold text-slate-900">{formData.unit_value} {formData.unit_type}</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-2xl flex gap-3 border border-yellow-200/50">
                      <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
                      <p className="text-sm font-medium">By submitting, this product will be sent to the admin for review. Once approved, it will be live on the customer app.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="bg-white border-t border-slate-200 p-4 md:p-6 sticky bottom-0 z-20">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handlePrev} className="h-12 rounded-xl font-bold px-6">
                  Back
                </Button>
              ) : (
                <div /> // Placeholder to keep flex space-between
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => handleSaveDraft(false)} disabled={isSaving} className="h-12 rounded-xl font-bold px-6 text-slate-600 hidden sm:flex">
                  <Save className="mr-2 h-4 w-4" /> Save Draft
                </Button>
                
                {currentStep < 6 ? (
                  <Button onClick={handleNext} className="h-12 rounded-xl bg-primary text-white font-bold px-8 shadow-lg shadow-primary/20">
                    Save & Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSaving || !formData.name || !formData.price} className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-lg shadow-green-600/20">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Submit for Approval
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="hidden lg:flex w-[420px] xl:w-[480px] bg-[#f8f9fa] border-l border-slate-200 items-center justify-center p-8 overflow-y-auto h-full flex-col gap-6">
          <div className="text-center w-full max-w-[360px]">
            <h3 className="font-bold text-slate-700">Live Preview</h3>
            <p className="text-xs text-slate-500 mb-4">Customer app view reflects changes in real-time</p>
          </div>
          <ProductPreviewMobile 
            formData={formData} 
            categoryName={categories.find(c => c.id === formData.category_id)?.name || ''} 
          />
        </div>
      </div>
      
      {/* Mobile progress indicator bar (absolute bottom) */}
      <div className="md:hidden fixed bottom-16 w-full h-[2px] bg-slate-200 z-50">
        <div className="h-full bg-primary" style={{ width: `${(currentStep/6)*100}%`}} />
      </div>
      </div>
    </div>
  );
}
