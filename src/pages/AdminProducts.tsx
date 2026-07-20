import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category, Subcategory } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Package, CheckCircle2, XCircle } from 'lucide-react';
import { apiCache } from '../lib/apiCache';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [step, setStep] = useState<1 | 2>(1);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [specifications, setSpecifications] = useState<{key: string, value: string}[]>([]);
  const [adminComments, setAdminComments] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async (forceRefetch = false, signal?: AbortSignal) => {
    setLoading(true);
    try {
      console.log("[DEBUG] Fetching products data from: /api/admin/products");
      const [productsRes, categoriesRes] = await Promise.all([
        apiCache.fetchOnce<Product[]>('admin_products', async (fetchSignal) => {
          const res = await fetch('/api/admin/products', {
            headers: { 
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            cache: 'no-store',
            signal: fetchSignal
          });
          const contentType = res.headers.get("content-type");
          if (!res.ok) throw new Error(`API Error`);
          if (!contentType || !contentType.includes("application/json")) throw new Error(`Invalid format`);
          return await res.json();
        }, { forceRefetch, signal }),
        apiCache.fetchOnce<Category[]>('admin_categories', async () => {
          const { data, error } = await supabase.from('categories').select('*').order('name');
          if (error) throw error;
          return data as Category[];
        }, { forceRefetch })
      ]);

      setProducts(productsRes);
      setCategories(categoriesRes);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("[AdminProducts] Fetch aborted.");
        return;
      }
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubcategories = useCallback(async (catId: string) => {
    try {
      const data = await apiCache.fetchOnce<Subcategory[]>(`subcategories_by_cat_${catId}`, async () => {
        const { data: res, error } = await supabase.from('subcategories').select('*').eq('category_id', catId).order('name');
        if (error) throw error;
        return res as Subcategory[];
      });
      setSubcategories(data || []);
    } catch (error) {
      console.error('Failed to fetch subcategories:', error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId, fetchSubcategories]);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected', comments?: string) => {
    try {
      const payload: Partial<Product> = {
        verification_status: newStatus,
      };
      
      if (newStatus === 'approved') payload.published_at = new Date().toISOString();
      if (comments) payload.admin_comments = comments;

      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) throw error;
      
      apiCache.invalidate('admin_products');
      toast.success(`Product ${newStatus}`);
      fetchData(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const subId = formData.get('subcategory_id') as string;
    
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      original_price: parseFloat(formData.get('original_price') as string),
      stock: parseInt(formData.get('stock') as string),
      selling_price: parseFloat(formData.get('price') as string),
      mrp: parseFloat(formData.get('original_price') as string),
      stock_units: parseInt(formData.get('stock') as string),
      category_id: formData.get('category_id') as string,
      subcategory_id: (subId && subId !== 'none') ? subId : null,
      image_url: formData.get('image_url') as string,
      cod_available: formData.get('cod_available') === 'on',
      online_payment: formData.get('online_payment') === 'on',
      brand: formData.get('brand') as string || null,
      product_type: formData.get('product_type') as string || null,
      weight: formData.get('weight') as string || null,
      speciality: formData.get('speciality') as string || null,
      shelf_life: formData.get('shelf_life') as string || null,
      highlights: highlights.filter(Boolean),
      specifications: specifications.filter(s => s.key && s.value).reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}),
    };

    try {
      if (editingProduct?.id) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated');
        setIsDialogOpen(false);
        setEditingProduct(null);
        setSelectedCategoryId('');
        fetchData();
      } else {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        const user = authData?.user;
        console.log("auth user id:", user?.id);

        if (authErr || !user) {
          toast.error("Not authenticated");
          return;
        }

        const { data: vendor, error: vendorErr } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log("fetched vendor:", vendor);

        if (vendorErr || !vendor) {
          toast.error("Vendor profile missing");
          return;
        }

        const insertPayload = {
          ...productData,
          vendor_id: vendor.id,
        };
        console.log("insert payload:", insertPayload);

        const { data: insertedData, error: insertErr } = await supabase
          .from('products')
          .insert([insertPayload])
          .select();
        
        console.log("Supabase insert response:", { data: insertedData, error: insertErr });

        if (insertErr) {
          toast.error(insertErr.message);
          return;
        }

        toast.success('Product added');
        setIsDialogOpen(false);
        setEditingProduct(null);
        setSelectedCategoryId('');
        apiCache.invalidate('admin_products');
        fetchData(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      apiCache.invalidate('admin_products');
      toast.success('Product deleted');
      fetchData(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'live') return matchesSearch && (p.verification_status === 'approved' || !p.verification_status);
    return matchesSearch && p.verification_status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
          <Package className="h-6 w-6 text-primary" />
          Manage Products
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 px-6 h-12" onClick={() => {
              setEditingProduct(null);
              setSelectedCategoryId('');
              setHighlights([]);
              setSpecifications([]);
              setStep(1);
            }} />}>
              <Plus className="mr-2 h-5 w-5" /> Add Product
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] gap-0 p-0 overflow-hidden max-h-[90vh] overflow-y-auto w-[95vw] mt-4 rounded-[2rem] mx-auto border-0 shadow-2xl">
            <DialogHeader className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    {editingProduct ? 'Update product details and configuration.' : 'Create a new product listing.'}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                  <span className={step === 1 ? "text-primary transition-colors" : ""}>Step 1</span>
                  <span className="text-slate-300">/</span>
                  <span className={step === 2 ? "text-primary transition-colors" : ""}>Step 2</span>
                </div>
              </div>
              <div className="w-full bg-slate-200/60 h-1.5 rounded-full mt-6 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500 ease-out" style={{ width: step === 1 ? '50%' : '100%' }} />
              </div>
            </DialogHeader>

            <form key={editingProduct?.id || 'new'} onSubmit={handleSave} className="p-6">
              {/* STEP 1: Basic Info */}
              <div className={step === 1 ? "space-y-6 animate-in slide-in-from-right-4 duration-300" : "hidden"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Name</label>
                    <Input 
                      name="name" 
                      defaultValue={editingProduct?.name || ''} 
                      required={step === 1}
                      className="h-12 shadow-sm rounded-xl font-medium"
                      placeholder="e.g. Organic Bananas"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">MRP (₹)</label>
                    <Input 
                      name="original_price" 
                      type="number" 
                      step="0.01" 
                      defaultValue={editingProduct?.original_price || ''} 
                      required={step === 1}
                      className="h-12 shadow-sm rounded-xl font-medium"
                      placeholder="Original price"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Selling Price (₹)</label>
                    <Input 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      defaultValue={editingProduct?.price || ''} 
                      required={step === 1}
                      className="h-12 shadow-sm rounded-xl font-bold text-green-600"
                      placeholder="Discounted price"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stock Units</label>
                    <Input 
                      name="stock" 
                      type="number" 
                      defaultValue={editingProduct?.stock || ''} 
                      required={step === 1}
                      className="h-12 shadow-sm rounded-xl font-medium"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" key={editingProduct?.id || 'new'}>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                    <Select 
                      name="category_id" 
                      defaultValue={editingProduct?.category_id || ''}
                      onValueChange={(val) => setSelectedCategoryId(val)}
                      required={step === 1}
                    >
                      <SelectTrigger className="h-12 shadow-sm rounded-xl bg-white">
                        <SelectValue placeholder="Identify category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subcategory (Optional)</label>
                    <Select name="subcategory_id" defaultValue={editingProduct?.subcategory_id || ''}>
                      <SelectTrigger className="h-12 shadow-sm rounded-xl bg-white">
                        <SelectValue placeholder="Pick subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {subcategories.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Image URL</label>
                    <Input 
                      name="image_url" 
                      defaultValue={editingProduct?.image_url || ''} 
                      placeholder="https://images.unsplash.com/..." 
                      className="h-12 shadow-sm rounded-xl font-medium"
                    />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Description</label>
                  <textarea 
                    name="description"
                    className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-3 text-sm shadow-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary placeholder:text-slate-400"
                    defaultValue={editingProduct?.description || ''}
                    placeholder="Brief description of the product..."
                  />
                </div>

                <div className="flex items-center gap-6 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="cod_available" 
                      id="cod_available"
                      defaultChecked={editingProduct ? editingProduct.cod_available : true}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer accent-primary"
                    />
                    <label htmlFor="cod_available" className="text-[11px] font-black uppercase tracking-widest text-slate-500 cursor-pointer pt-0.5">Allow COD</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="online_payment" 
                      id="online_payment"
                      defaultChecked={editingProduct ? editingProduct.online_payment : true}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer accent-primary"
                    />
                    <label htmlFor="online_payment" className="text-[11px] font-black uppercase tracking-widest text-slate-500 cursor-pointer pt-0.5">Allow Online</label>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1 bg-primary h-12 rounded-xl shadow-lg shadow-primary/25 font-bold hover:bg-primary/90"
                    onClick={() => setStep(2)}
                  >
                    Save & Next
                  </Button>
                </div>
              </div>

              {/* STEP 2: Advanced Info */}
              <div className={step === 2 ? "space-y-6 animate-in slide-in-from-right-4 duration-300" : "hidden"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand</label>
                    <Input name="brand" defaultValue={editingProduct?.brand || ''} className="h-12 shadow-sm rounded-xl font-medium" placeholder="e.g. Amul" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Type</label>
                    <Input name="product_type" defaultValue={editingProduct?.product_type || ''} className="h-12 shadow-sm rounded-xl font-medium" placeholder="e.g. Dairy" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight / Quantity</label>
                    <Input name="weight" defaultValue={editingProduct?.weight || ''} className="h-12 shadow-sm rounded-xl font-medium" placeholder="e.g. 500g, 1L" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Speciality</label>
                    <Input name="speciality" defaultValue={editingProduct?.speciality || ''} className="h-12 shadow-sm rounded-xl font-medium" placeholder="e.g. Organic, Eggless" />
                  </div>
                  <div className="space-y-1.5 col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Shelf Life</label>
                    <Input name="shelf_life" defaultValue={editingProduct?.shelf_life || ''} className="h-12 shadow-sm rounded-xl font-medium" placeholder="e.g. 12 Months, 3 Days" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50/80 p-3 px-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pt-0.5">Product Highlights</label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setHighlights([...highlights, ''])} className="h-8 rounded-lg text-xs font-bold border-slate-200">
                      <Plus className="h-3 w-3 mr-1" /> Add Highlight
                    </Button>
                  </div>
                  {highlights.map((h, i) => (
                    <div key={i} className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex-1">
                        <Input 
                          value={h} 
                          onChange={(e) => {
                            const newH = [...highlights];
                            newH[i] = e.target.value;
                            setHighlights(newH);
                          }}
                          placeholder={`Enter highlight point ${i + 1}`}
                          className="h-11 rounded-xl shadow-sm text-sm"
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50" onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {highlights.length === 0 && (
                     <div className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                       No highlights added
                     </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50/80 p-3 px-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pt-0.5">Specifications</label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSpecifications([...specifications, { key: '', value: '' }])} className="h-8 rounded-lg text-xs font-bold border-slate-200">
                      <Plus className="h-3 w-3 mr-1" /> Add Spec
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {specifications.map((s, i) => (
                      <div key={i} className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                        <Input 
                          value={s.key} 
                          placeholder="Name (e.g. Storage)"
                          className="h-11 rounded-xl shadow-sm text-sm"
                          onChange={(e) => {
                            const newS = [...specifications];
                            newS[i].key = e.target.value;
                            setSpecifications(newS);
                          }}
                        />
                        <Input 
                          value={s.value} 
                          placeholder="Value (e.g. Cool & Dry)"
                          className="h-11 rounded-xl shadow-sm text-sm"
                          onChange={(e) => {
                            const newS = [...specifications];
                            newS[i].value = e.target.value;
                            setSpecifications(newS);
                          }}
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50" onClick={() => setSpecifications(specifications.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {specifications.length === 0 && (
                       <div className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                         No specifications added
                       </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary h-12 rounded-xl shadow-lg shadow-primary/25 font-bold hover:bg-primary/90">
                    {editingProduct ? 'Update Product' : 'Submit Product'}
                  </Button>
                </div>
              </div>

            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl shadow-sm border">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
          <TabsList className="bg-transparent border-0 h-10 w-full overflow-x-auto justify-start">
            <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none font-bold">All Products</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none font-bold">Pending Approval</TabsTrigger>
            <TabsTrigger value="live" className="rounded-xl data-[state=active]:bg-green-50 data-[state=active]:text-green-600 data-[state=active]:shadow-none font-bold">Live</TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-xl data-[state=active]:bg-red-50 data-[state=active]:text-red-600 data-[state=active]:shadow-none font-bold">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search products..." 
            className="pl-10 h-10 rounded-xl bg-slate-50/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>MRP</TableHead>
              <TableHead>Selling</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <img 
                      src={product.image_url || `https://placehold.co/100x100?text=${encodeURIComponent(product.name)}`} 
                      alt="" 
                      className="h-10 w-10 rounded-lg object-cover border bg-slate-50"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{product.name}</span>
                      <span className="text-xs text-slate-400 font-normal line-clamp-1 max-w-[200px]">
                        {product.brand || 'No Brand'}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {product.verification_status === 'pending' && <span className="bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-yellow-200">Pending</span>}
                  {product.verification_status === 'approved' && <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-green-200">Live</span>}
                  {product.verification_status === 'rejected' && <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-200">Rejected</span>}
                  {(!product.verification_status || product.verification_status === 'draft') && <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-200">Draft / Legacy</span>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{(product as any).categories?.name || 'N/A'}</span>
                    {(product as any).subcategories?.name && (
                      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                        {(product as any).subcategories.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-slate-400 line-through">₹{product.original_price}</TableCell>
                <TableCell className="font-bold text-green-600">₹{product.price}</TableCell>
                <TableCell>
                  {(() => {
                    const stock_val = typeof product.stock_units === 'number' ? product.stock_units : (product.stock !== undefined ? product.stock : 0);
                    return (
                      <span className={stock_val <= 0 ? 'text-red-600 font-black bg-red-50 px-2 py-1 rounded uppercase min-w-[max-content] inline-block text-[10px]' : stock_val < 5 ? 'text-orange-500 font-bold' : 'font-semibold text-slate-700'}>
                        {stock_val <= 0 ? 'Out of Stock' : stock_val}
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 items-center">
                    {product.verification_status === 'pending' && (
                       <>
                         <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(product.id, 'approved')} className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 font-bold border-green-200">
                           <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                         </Button>
                         <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(product.id, 'rejected', prompt('Enter rejection reason:') || undefined)} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 font-bold border-red-200">
                           <XCircle className="h-4 w-4 mr-1" /> Reject
                         </Button>
                         <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                       </>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingProduct(product);
                        if (product.category_id) {
                          setSelectedCategoryId(product.category_id);
                        }
                        
                        let parsedHighlights = [];
                        if (typeof product.highlights === 'string') {
                          try { parsedHighlights = JSON.parse(product.highlights); } catch { parsedHighlights = []; }
                        } else if (Array.isArray(product.highlights)) {
                          parsedHighlights = product.highlights;
                        }
                        setHighlights(parsedHighlights);

                        if (product.specifications) {
                          let specs = product.specifications;
                          if (typeof specs === 'string') {
                            try { specs = JSON.parse(specs); } catch { specs = {}; }
                          }
                          const specArray = typeof specs === 'object' && specs !== null ? Object.entries(specs).map(([key, value]) => ({ key, value: String(value) })) : [];
                          setSpecifications(specArray);
                        } else {
                          setSpecifications([]);
                        }
                        setStep(1);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                   <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                   <h3 className="font-bold text-slate-900 text-lg">No Products Found</h3>
                   <p className="text-slate-500 font-medium">No products match your current filters.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
