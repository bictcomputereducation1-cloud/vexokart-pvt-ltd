import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceableArea } from '../types';
import { Truck, UserPlus, MapPin, CheckCircle, XCircle, Loader2, X, Bike, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiCache } from '../lib/apiCache';

import { LocationPicker } from '../components/LocationPicker';

export default function AdminDeliveryBoys() {
  const [boys, setBoys] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [areas, setAreas] = useState<ServiceableArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    vehicle_type: 'BIKE',
    service_area_id: '',
    is_active: true
  });

  const fetchData = useCallback(async (forceRefetch = false, signal?: AbortSignal) => {
    try {
      const [boysRes, areasRes] = await Promise.all([
        apiCache.fetchOnce<any[]>('admin_delivery_boys', async (fetchSignal) => {
          const res = await fetch('/api/admin/delivery-boys', {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            cache: 'no-store',
            signal: fetchSignal
          });
          console.log(`Boys API status: ${res.status}`);
          if (!res.ok) {
            const text = await res.text();
            console.error(`Boys API Error Text: ${text}`);
            throw new Error(`API Error (${res.status}): ${text.slice(0, 100)}`);
          }
          const json = await res.json();
          console.log('Boys API JSON:', json);
          return json;
        }, { forceRefetch, signal }),
        apiCache.fetchOnce<any[]>('admin_service_areas_active', async () => {
          const { data, error } = await supabase.from('service_areas').select('*').eq('is_active', true).order('name');
          if (error) throw error;
          return data || [];
        }, { forceRefetch })
      ]);
      
      if (Array.isArray(boysRes)) {
        const uniqueBoys = Array.from(new Map(boysRes.filter(b => b && b.id).map((b: any) => [b.id, b])).values());
        setBoys(uniqueBoys);
      } else {
        console.error('Delivery boys fetch error: Invalid response format');
        toast.error('Failed to load partners: Invalid response format');
      }

      setAreas(areasRes);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("[AdminDeliveryBoys] Fetch aborted.");
        return;
      }
      console.error('FetchData catch error:', err);
      toast.error('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(false, controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchData]);

  const handleAddBoy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/delivery-boys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password || 'TemporaryPassword123!', 
          name: formData.full_name,
          phone: formData.phone,
          service_area_id: formData.service_area_id,
          vehicle_type: formData.vehicle_type
        })
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok) throw new Error(result.error || 'Registration failed');

      apiCache.invalidate('admin_delivery_boys');
      toast.success('Delivery partner registered and account created');
      setIsAddModalOpen(false);
      fetchData(true);
      setFormData({ email: '', password: '', full_name: '', phone: '', vehicle_type: 'BIKE', service_area_id: '', is_active: true });
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelected = (loc: any) => {
    // Auto match nearest service area based on pincode
    const matchedArea = areas.find(a => a.pincode === loc.pincode);
    if (matchedArea) {
      setFormData(prev => ({ ...prev, service_area_id: matchedArea.id }));
      toast.success(`Matched delivery area: ${matchedArea.name}`);
      setShowMap(false);
    } else {
      toast.error(`No service area found for pincode ${loc.pincode}`);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('delivery_boys')
      .update({ is_active: !currentStatus })
      .eq('id', id);
      
    if (error) {
      toast.error('Failed to update status');
    } else {
      apiCache.invalidate('admin_delivery_boys');
      toast.success('Status updated');
      setBoys(boys.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Fleet Management</h1>
          <p className="text-slate-500 font-medium">Control your delivery partners and zones</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-black px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black hover:text-primary transition-all shadow-xl shadow-primary/20"
        >
          <UserPlus className="h-5 w-5" /> Add Delivery Partner
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-6">Partner Name</th>
                <th className="p-6">Vehicle</th>
                <th className="p-6">Delivery Zone</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {boys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Truck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No delivery partners registered</p>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-primary text-[10px] font-black uppercase mt-4 hover:underline"
                    >
                      Onboard your first partner
                    </button>
                  </td>
                </tr>
              ) : boys.map((boy) => (
                <tr key={boy.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-black transition-colors">
                        <Truck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{boy.full_name}</p>
                        <p className="text-[10px] font-black text-slate-400 mt-1">{boy.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        {boy.vehicle_type}
                    </span>
                  </td>
                  <td className="p-6">
                    {boy.service_areas ? (
                      <div>
                        <div className="flex items-center gap-1 font-black text-sm text-slate-700">
                          <MapPin className="h-3 w-3 text-primary" /> {boy.service_areas.name}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 ml-4">{boy.service_areas.pincode}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-red-400 bg-red-50 px-2 py-1 rounded-lg">Not Assigned</span>
                    )}
                  </td>
                  <td className="p-6">
                    {boy.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600">
                        <CheckCircle className="h-3 w-3" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-400">
                        <XCircle className="h-3 w-3" /> Offline
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => toggleStatus(boy.id, boy.is_active)}
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${boy.is_active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                    >
                      {boy.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tight italic uppercase">New Fleet Entry</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-50 rounded-xl"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleAddBoy} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <input 
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                  placeholder="e.g. Rahul Kumar"
                />
              </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                    placeholder="e.g. rider@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone</label>
                  <input 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                  <input 
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                    placeholder="Secure password..."
                  />
                </div>
              </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle</label>
                  <select 
                    value={formData.vehicle_type}
                    onChange={e => setFormData({...formData, vehicle_type: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                  >
                    <option value="BIKE">BIKE</option>
                    <option value="SCOOTER">SCOOTER</option>
                    <option value="CYCLE">CYCLE</option>
                  </select>
                </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Delivery Zone</label>
                  <button 
                    type="button" 
                    onClick={() => setShowMap(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 hover:underline"
                  >
                    <MapPin className="h-3 w-3" /> Auto Detect
                  </button>
                </div>
                <select 
                  required
                  value={formData.service_area_id}
                  onChange={e => setFormData({...formData, service_area_id: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                >
                  <option value="">{areas.length > 0 ? 'Select Target Area' : 'No areas found - create one first'}</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name} ({area.pincode})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-black text-primary h-14 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Enroll Partner</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {showMap && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl h-[70vh] rounded-[2.5rem] p-4 flex flex-col shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
            <div className="flex justify-between items-center px-4 pb-4 border-b border-slate-100">
               <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Select Location</h2>
               <button onClick={() => setShowMap(false)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <X className="h-5 w-5 text-slate-600" />
               </button>
            </div>
            <div className="flex-1 relative mt-4 rounded-[1.5rem] overflow-hidden border-2 border-slate-100">
               <LocationPicker 
                  onLocationSelected={handleLocationSelected}
               />
            </div>
            <div className="p-4 flex justify-between items-center bg-emerald-50 rounded-2xl mt-4">
                <p className="text-xs font-bold text-emerald-800">Move the map to select the delivery zone.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
