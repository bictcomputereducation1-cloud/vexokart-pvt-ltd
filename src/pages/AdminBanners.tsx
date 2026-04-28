import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Banner } from '../types';
import { Plus, Trash2, Edit2, Loader2, Save, X, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase.from('banners').select('*').order('display_order');
      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      toast.error('Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('banners').insert([formData]);
      if (error) throw error;
      toast.success('Banner added');
      setIsAdding(false);
      fetchBanners();
      setFormData({ title: '', image_url: '', link_url: '', display_order: 0, is_active: true });
    } catch (err) {
      toast.error('Add failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Remove this banner?')) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      setBanners(banners.filter(b => b.id !== id));
      toast.success('Banner removed');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Promotional Banners</h1>
          <p className="text-slate-500 font-medium">Manage home screen slider content</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-black px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black hover:text-primary transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="h-5 w-5" /> Add Banner
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tight">New Banner</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-50 rounded-xl"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Banner Title</label>
                <input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
                  placeholder="e.g. Summer Sale"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Image URL</label>
                <input 
                  required
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link URL (Optional)</label>
                <input 
                  value={formData.link_url}
                  onChange={e => setFormData({...formData, link_url: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
                  placeholder="/category/drinks"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Order</label>
                <input 
                  type="number"
                  value={formData.display_order}
                  onChange={e => setFormData({...formData, display_order: Number(e.target.value)})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-black text-primary h-14 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Create Banner</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm group">
            <div className="aspect-[21/9] relative overflow-hidden bg-slate-50">
               <img src={banner.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => deleteBanner(banner.id)} className="h-10 w-10 bg-white/90 backdrop-blur shadow-sm rounded-xl flex items-center justify-center text-red-600 active:scale-90 transition-all">
                    <Trash2 className="h-5 w-5" />
                  </button>
               </div>
               {!banner.is_active && (
                 <div className="absolute bottom-4 left-4 bg-red-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">Disabled</div>
               )}
            </div>
            <div className="p-6 flex items-center justify-between">
               <div>
                  <h3 className="font-black text-slate-900 group-hover:text-primary transition-colors">{banner.title || 'Untitled Banner'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] font-black uppercase text-slate-400">Order: {banner.display_order}</span>
                     {banner.link_url && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600">
                           <ExternalLink className="h-3 w-3" /> {banner.link_url}
                        </span>
                     )}
                  </div>
               </div>
               <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <ImageIcon className="h-6 w-6" />
               </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[3rem]">
             <ImageIcon className="h-12 w-12 text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">No banners added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
