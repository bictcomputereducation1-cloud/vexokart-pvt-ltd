import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Category, Subcategory } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GitMerge, Loader2 } from 'lucide-react';

export default function AdminSubcategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: cats }, { data: subs }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('subcategories').select('*, category:categories(name)').order('name')
      ]);
      setCategories(Array.from(new Map((cats || []).map(c => [c.id, c])).values()));
      setSubcategories(Array.from(new Map((subs || []).map(s => [s.id, s])).values()));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const subData = {
      name: formData.get('name') as string,
      category_id: formData.get('category_id') as string,
      slug: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
      image_url: formData.get('image_url') as string,
    };

    try {
      if (editingSub?.id) {
        const { error } = await supabase
          .from('subcategories')
          .update(subData)
          .eq('id', editingSub.id);
        if (error) throw error;
        toast.success('Subcategory updated');
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert([subData]);
        if (error) throw error;
        toast.success('Subcategory added');
      }
      setIsDialogOpen(false);
      setEditingSub(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This may affect products linked to this subcategory.')) return;
    try {
      const { error } = await supabase.from('subcategories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Subcategory deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2 italic uppercase">
            <GitMerge className="h-8 w-8 text-primary" />
            Subcategories
          </h1>
          <p className="text-slate-500 font-medium">Secondary levels under main categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary text-black font-black" onClick={() => setEditingSub(null)} />}>
            <Plus className="mr-2 h-4 w-4" /> Add Subcategory
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{editingSub ? 'Edit Subcategory' : 'Add New Subcategory'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Parent Category</label>
                <select 
                  name="category_id" 
                  defaultValue={editingSub?.category_id || ''} 
                  required
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Subcategory Name</label>
                <Input name="name" defaultValue={editingSub?.name || ''} required className="bg-slate-50 rounded-2xl p-6 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Image URL</label>
                <Input name="image_url" defaultValue={editingSub?.image_url || ''} placeholder="https://..." className="bg-slate-50 rounded-2xl p-6 border-none font-bold" />
              </div>
              <Button type="submit" className="w-full bg-black text-primary font-black py-6 rounded-2xl">
                {editingSub ? 'Update Subcategory' : 'Create Subcategory'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Image</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Subcategory</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-6">Parent Category</TableHead>
              <TableHead className="font-black uppercase text-[10px] tracking-widest p-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subcategories.map((sub) => (
              <TableRow key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="p-6">
                  <img 
                    src={sub.image_url || 'https://picsum.photos/seed/sub/50/50'} 
                    alt="" 
                    className="h-10 w-10 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </TableCell>
                <TableCell className="p-6 font-black text-slate-900">{sub.name}</TableCell>
                <TableCell className="p-6">
                  <span className="bg-primary/10 text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight">
                    {sub.category?.name}
                  </span>
                </TableCell>
                <TableCell className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingSub(sub);
                        setIsDialogOpen(true);
                      }}
                      className="hover:bg-blue-50 hover:text-blue-600 rounded-xl"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl"
                      onClick={() => handleDelete(sub.id)}
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
