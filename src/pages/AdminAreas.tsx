import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceableArea } from '../types';
import { MapPin, Plus, Trash2, Edit2, Loader2, Save, X, Navigation, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAreas() {
  const [areas, setAreas] = useState<ServiceableArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    city: '',
    pincode: '',
    latitude: 0,
    longitude: 0,
    radius_km: 10,
    is_active: true
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('serviceable_areas')
        .select('*')
        .order('city');
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      toast.error('Failed to fetch areas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('serviceable_areas')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Area updated');
      } else {
        const { error } = await supabase
          .from('serviceable_areas')
          .insert([formData]);
        if (error) throw error;
        toast.success('Area added');
      }
      setIsAdding(false);
      setEditingId(null);
      fetchAreas();
      setFormData({ city: '', pincode: '', latitude: 0, longitude: 0, radius_km: 10, is_active: true });
    } catch (err) {
      toast.error('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteArea = async (id: string) => {
    if (!confirm('Are you sure? This will affect vendors and delivery boys in this area.')) return;
    try {
      const { error } = await supabase.from('serviceable_areas').delete().eq('id', id);
      if (error) throw error;
      setAreas(areas.filter(a => a.id !== id));
      toast.success('Area removed');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Service Areas</h1>
          <p className="text-slate-500 font-medium">Manage delivery zones and radius</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-black px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black hover:text-primary transition-all shadow-xl shadow-primary/20"
        >
          <Plus className="h-5 w-5" /> Add New Area
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tight">{editingId ? 'Edit Area' : 'New Service Area'}</h2>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 bg-slate-50 rounded-xl"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">City / Region Name</label>
                <input 
                  required
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold border-2 border-transparent focus:border-primary outline-none transition-all"
                  placeholder="e.g. Sopore Cental"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pincode</label>
                  <input 
                    required
                    value={formData.pincode}
                    onChange={e => setFormData({...formData, pincode: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold border-2 border-transparent focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Radius (km)</label>
                  <input 
                    type="number"
                    required
                    value={formData.radius_km}
                    onChange={e => setFormData({...formData, radius_km: Number(e.target.value)})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold border-2 border-transparent focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Latitude</label>
                  <input 
                    type="number" step="any"
                    required
                    value={formData.latitude || ''}
                    onChange={e => setFormData({...formData, latitude: Number(e.target.value)})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold border-2 border-transparent focus:border-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Longitude</label>
                  <input 
                    type="number" step="any"
                    required
                    value={formData.longitude || ''}
                    onChange={e => setFormData({...formData, longitude: Number(e.target.value)})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold border-2 border-transparent focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-black text-primary h-14 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> {editingId ? 'Update Area' : 'Create Area'}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map(area => (
          <div key={area.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                <Navigation className="h-6 w-6" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingId(area.id);
                    setFormData({
                      city: area.city,
                      pincode: area.pincode,
                      latitude: area.latitude || 0,
                      longitude: area.longitude || 0,
                      radius_km: area.radius_km || 10,
                      is_active: area.is_active
                    });
                  }}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button onClick={() => deleteArea(area.id)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">{area.city}</h3>
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs mb-4">
              <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{area.pincode}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>{area.radius_km}km Radius</span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Coordinates</span>
                  <Globe className="h-3 w-3" />
               </div>
               <p className="text-xs font-bold text-slate-600 font-mono tracking-tighter">
                {area.latitude?.toFixed(4)}, {area.longitude?.toFixed(4)}
               </p>
            </div>

            {!area.is_active && (
              <div className="absolute top-4 right-4 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Inactive</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
