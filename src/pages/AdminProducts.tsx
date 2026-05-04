import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category, Subcategory } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*, categories(*), subcategories(*)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const uniqueProducts = Array.from(new Map((productsRes.data || []).map((p: any) => [p.id, p])).values());
      setProducts(uniqueProducts as any);
      const uniqueCategories = Array.from(new Map((categoriesRes.data || []).map((c: any) => [c.id, c])).values());
      setCategories(uniqueCategories as any);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (catId: string) => {
    const { data } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', catId)
      .order('name');
    setSubcategories(data || []);
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
      category_id: formData.get('category_id') as string,
      subcategory_id: (subId && subId !== 'none') ? subId : null,
      image_url: formData.get('image_url') as string,
      cod_available: formData.get('cod_available') === 'on',
      online_payment: formData.get('online_payment') === 'on',
    };

    try {
      if (editingProduct?.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
        toast.success('Product added');
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      setSelectedCategoryId('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Manage Products
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary" onClick={() => setEditingProduct(null)} />}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] gap-0 p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-slate-50 border-b">
              <DialogTitle className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Product Name</label>
                  <Input 
                    name="name" 
                    defaultValue={editingProduct?.name || ''} 
                    required 
                    className="h-11 shadow-sm"
                    placeholder="e.g. Organic Bananas"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">MRP (₹)</label>
                  <Input 
                    name="original_price" 
                    type="number" 
                    step="0.01" 
                    defaultValue={editingProduct?.original_price || ''} 
                    required 
                    className="h-11 shadow-sm"
                    placeholder="Original price"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Selling Price (₹)</label>
                  <Input 
                    name="price" 
                    type="number" 
                    step="0.01" 
                                        defaultValue={editingProduct?.price || ''} 
                    required 
                    className="h-11 shadow-sm"
                    placeholder="Discounted price"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Stock Units</label>
                  <Input 
                    name="stock" 
                    type="number" 
                    defaultValue={editingProduct?.stock || ''} 
                    required 
                    className="h-11 shadow-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6" key={editingProduct?.id || 'new'}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Category</label>
                  <Select 
                    name="category_id" 
                    defaultValue={editingProduct?.category_id || ''}
                    onValueChange={(val) => setSelectedCategoryId(val)}
                  >
                    <SelectTrigger className="h-11 shadow-sm">
                      <SelectValue placeholder="Identify category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Subcategory (Optional)</label>
                  <Select name="subcategory_id" defaultValue={editingProduct?.subcategory_id || ''}>
                    <SelectTrigger className="h-11 shadow-sm">
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Image URL</label>
                  <Input 
                    name="image_url" 
                    defaultValue={editingProduct?.image_url || ''} 
                    placeholder="https://images.unsplash.com/..." 
                    className="h-11 shadow-sm"
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Product Description</label>
                <textarea 
                  name="description"
                  className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  defaultValue={editingProduct?.description || ''}
                  placeholder="Brief description of the product..."
                />
              </div>

              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="cod_available" 
                    id="cod_available"
                    defaultChecked={editingProduct ? editingProduct.cod_available : true}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer"
                  />
                  <label htmlFor="cod_available" className="text-sm font-medium text-slate-700 cursor-pointer">Allow COD</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="online_payment" 
                    id="online_payment"
                    defaultChecked={editingProduct ? editingProduct.online_payment : true}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer"
                  />
                  <label htmlFor="online_payment" className="text-sm font-medium text-slate-700 cursor-pointer">Allow Online</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-11"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-primary h-11 shadow-sm shadow-primary/20">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search products..." 
          className="pl-10 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
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
                      <span>{product.name}</span>
                      <span className="text-xs text-slate-400 font-normal line-clamp-1 max-w-[200px]">
                        {product.description || 'No description'}
                      </span>
                    </div>
                  </div>
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
                  <span className={product.stock < 10 ? 'text-red-500 font-bold' : ''}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingProduct(product);
                        if (product.category_id) {
                          setSelectedCategoryId(product.category_id);
                        }
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
