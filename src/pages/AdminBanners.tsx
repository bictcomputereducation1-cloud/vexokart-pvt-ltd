import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Banner } from '../types';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  X, 
  Image as ImageIcon, 
  ExternalLink, 
  Video, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

// Helper for local storage extra fields fallback if DB columns don't exist
const getStoredBannersExtra = () => {
  try {
    const data = localStorage.getItem('vexo_banners_extra');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

const saveStoredBannersExtra = (extra: any) => {
  try {
    localStorage.setItem('vexo_banners_extra', JSON.stringify(extra));
  } catch (e) {
    console.error(e);
  }
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    video_url: '',
    link_url: '',
    display_order: 0,
    is_active: true,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase.from('banners').select('*').order('display_order');
      if (error) throw error;
      
      const dbBanners = data || [];
      const extra = getStoredBannersExtra();
      
      // Merge with stored extra fields
      const merged: Banner[] = dbBanners.map(b => ({
        ...b,
        video_url: b.video_url || extra[b.id]?.video_url || '',
        start_date: (b as any).start_date || extra[b.id]?.start_date || '',
        end_date: (b as any).end_date || extra[b.id]?.end_date || ''
      }));

      setBanners(Array.from(new Map(merged.map(b => [b.id, b])).values()));
    } catch (err: any) {
      console.error('Fetch Banners Error:', err);
      toast.error(err?.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // First try inserting with all fields
      const { data, error } = await supabase.from('banners').insert([{
        title: formData.title,
        image_url: formData.image_url,
        video_url: formData.video_url || null,
        link_url: formData.link_url || null,
        display_order: formData.display_order,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      }]).select();

      if (error) {
        // If DB column doesn't exist, we fallback
        if (error.message.includes('column') || error.code === 'PGRST102' || error.message.includes('not exist')) {
          console.log("DB missing custom columns. Saving extra attributes to LocalStorage fallback...");
          
          const basePayload = {
            title: formData.title,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            display_order: formData.display_order,
            is_active: formData.is_active
          };
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('banners')
            .insert([basePayload])
            .select();

          if (fallbackError) throw fallbackError;

          if (fallbackData && fallbackData[0]) {
            const newId = fallbackData[0].id;
            const extra = getStoredBannersExtra();
            extra[newId] = {
              video_url: formData.video_url,
              start_date: formData.start_date,
              end_date: formData.end_date
            };
            saveStoredBannersExtra(extra);
          }
        } else {
          throw error;
        }
      } else if (data && data[0]) {
        // DB call succeeded directly
        const newId = data[0].id;
        const extra = getStoredBannersExtra();
        extra[newId] = {
          video_url: formData.video_url,
          start_date: formData.start_date,
          end_date: formData.end_date
        };
        saveStoredBannersExtra(extra);
      }

      toast.success('Promotional Banner created successfully!');
      setIsAdding(false);
      fetchBanners();
      setFormData({ 
        title: '', 
        image_url: '', 
        video_url: '',
        link_url: '', 
        display_order: 0, 
        is_active: true,
        start_date: '',
        end_date: ''
      });
    } catch (err: any) {
      console.error('Add Banner Error:', err);
      toast.error(err?.message || 'Add failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to remove this promotional banner?')) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      
      // Remove from fallback storage as well
      const extra = getStoredBannersExtra();
      delete extra[id];
      saveStoredBannersExtra(extra);

      setBanners(banners.filter(b => b.id !== id));
      toast.success('Banner removed from database');
    } catch (err: any) {
      console.error('Delete Banner Error:', err);
      toast.error(err?.message || 'Delete failed');
    }
  };

  const toggleBannerStatus = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);
      
      if (error) throw error;
      
      setBanners(banners.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
      toast.success(`Banner is now ${!banner.is_active ? 'Enabled' : 'Disabled'}`);
    } catch (err: any) {
      console.error('Toggle status error:', err);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="animate-spin text-[#C49B3B] h-10 w-10" />
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Banners...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Banner & Campaign Studio</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wide mt-1">
            Publish, schedule, and preview ultra-premium image & video campaigns
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#C49B3B] hover:bg-[#A8802C] text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-amber-900/10 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Add Premium Banner
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar border border-slate-100">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">New Campaign Banner</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Configure high-quality assets</p>
              </div>
              <button 
                onClick={() => setIsAdding(false)} 
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Campaign Title</label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-2xl p-4 font-bold text-xs outline-none transition-all"
                  placeholder="e.g. Mega Flash Sale"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Image Poster URL (Fallback)</label>
                <input 
                  required
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-2xl p-4 font-bold text-xs outline-none transition-all"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 ml-1">
                  <Video className="h-3 w-3 text-emerald-600" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Video URL (Optional MP4/WebM)</label>
                </div>
                <input 
                  value={formData.video_url}
                  onChange={e => setFormData({...formData, video_url: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-emerald-500 rounded-2xl p-4 font-bold text-xs outline-none transition-all"
                  placeholder="e.g. https://player.vimeo.com/external/..."
                />
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider ml-1">
                  For background video looping. Uses poster fallback if empty or slow.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Link URL / Path (Optional)</label>
                <input 
                  value={formData.link_url}
                  onChange={e => setFormData({...formData, link_url: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-2xl p-4 font-bold text-xs outline-none transition-all"
                  placeholder="/category/vegetables-fruits"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Display Order</label>
                  <input 
                    type="number"
                    value={formData.display_order}
                    onChange={e => setFormData({...formData, display_order: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-2xl p-4 font-bold text-xs outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status</label>
                  <select 
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}
                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-amber-500 rounded-2xl p-4 font-bold text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="true">Active & Visible</option>
                    <option value="false">Disabled / Hidden</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#C49B3B]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#C49B3B]">Campaign Scheduling (Optional)</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Start Date</label>
                    <input 
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                      className="w-full bg-white border border-slate-100 focus:border-amber-500 rounded-xl p-3 font-bold text-xs outline-none transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">End Date</label>
                    <input 
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={e => setFormData({...formData, end_date: e.target.value})}
                      className="w-full bg-white border border-slate-100 focus:border-amber-500 rounded-xl p-3 font-bold text-xs outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-medium leading-normal">
                  If set, the banner will automatically hide outside this date range based on local time.
                </p>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-[#C49B3B] hover:bg-[#A8802C] text-white h-14 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-4.5 w-4.5" /> Save Campaign Banner</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map(banner => {
          const hasVideo = !!banner.video_url;
          const isScheduled = !!((banner as any).start_date || (banner as any).end_date);
          
          return (
            <div key={banner.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100/80 shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div className="aspect-[21/10] relative overflow-hidden bg-slate-50 border-b border-slate-50">
                {hasVideo ? (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
                    <video 
                      src={banner.video_url || undefined} 
                      className="w-full h-full object-cover brightness-95"
                      muted 
                      loop 
                      autoPlay 
                      playsInline
                    />
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-sm">
                      <Video className="h-3 w-3" /> Live Video
                    </div>
                  </div>
                ) : (
                  <img 
                    src={banner.image_url} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" 
                  />
                )}

                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <button 
                    onClick={() => toggleBannerStatus(banner)}
                    className={`h-9 px-3 backdrop-blur shadow-md rounded-xl flex items-center justify-center font-black text-[9px] uppercase tracking-wider transition-all active:scale-95 border ${
                      banner.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}
                  >
                    {banner.is_active ? 'Active' : 'Disabled'}
                  </button>
                  
                  <button 
                    onClick={() => deleteBanner(banner.id)} 
                    className="h-9 w-9 bg-white hover:bg-rose-50 border border-slate-100 shadow-md rounded-xl flex items-center justify-center text-red-600 active:scale-90 transition-all"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-black text-slate-800 text-sm tracking-tight leading-snug">
                      {banner.title || 'Untitled Campaign'}
                    </h3>
                    <span className="text-[10px] font-black uppercase text-[#C49B3B] bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                      Order: {banner.display_order}
                    </span>
                  </div>

                  {banner.link_url && (
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 tracking-tight">
                        Destination: <strong className="text-blue-600 font-extrabold">{banner.link_url}</strong>
                      </span>
                    </div>
                  )}

                  {isScheduled && (
                    <div className="bg-slate-50 border border-slate-100/50 rounded-xl p-3 mt-4 flex items-start gap-2 text-[10px] font-bold text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Active Schedule</span>
                        { (banner as any).start_date && (
                          <span>Start: <strong className="text-slate-700">{new Date((banner as any).start_date).toLocaleString()}</strong></span>
                        )}
                        { (banner as any).end_date && (
                          <span>End: <strong className="text-slate-700">{new Date((banner as any).end_date).toLocaleString()}</strong></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {banners.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-white">
            <ImageIcon className="h-12 w-12 text-slate-200 mb-4 animate-pulse" />
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No Promotional Banners Found</p>
            <p className="text-slate-300 font-medium text-[10px] uppercase mt-1">Create your first video or image campaign above</p>
          </div>
        )}
      </div>
    </div>
  );
}
