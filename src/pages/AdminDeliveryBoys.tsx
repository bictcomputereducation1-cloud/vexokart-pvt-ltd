import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceableArea } from '../types';
import { Truck, UserPlus, MapPin, CheckCircle, XCircle, Loader2, X, Bike, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDeliveryBoys() {
  const [boys, setBoys] = useState<any[]>([]);
  const [areas, setAreas] = useState<ServiceableArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    vehicle_type: 'BIKE',
    service_area_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [boysResText, areasRes] = await Promise.all([
        fetch('/api/admin/delivery-boys').then(res => res.text()),
        supabase.from('service_areas').select('*').eq('is_active', true).order('name')
      ]);
      
      let boysRes;
      try {
        boysRes = JSON.parse(boysResText);
      } catch (e) {
        console.error("Invalid JSON from delivery boys API:", boysResText);
        boysRes = { error: "Invalid JSON response" };
      }

      if (Array.isArray(boysRes)) {
        setBoys(boysRes);
      } else {
        console.error('Delivery boys fetch error:', boysRes);
        toast.error('Failed to load partners');
      }

      if (areasRes.error) {
        console.error('Areas fetch error:', areasRes.error);
      } else {
        setAreas(areasRes.data || []);
      }
    } catch (err: any) {
      console.error('FetchData catch error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBoy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/delivery-boys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: 'TemporaryPassword123!', 
          name: formData.full_name,
          phone: formData.phone,
          service_area_id: formData.service_area_id,
          vehicle_type: formData.vehicle_type
        })
      });

      const text = await response.text();
      console.log("Raw delivery boy creation response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON response from server:", text);
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok) throw new Error(result.error || 'Registration failed');

      toast.success('Delivery partner registered and account created');
      setIsAddModalOpen(false);
      fetchData();
      setFormData({ email: '', full_name: '', phone: '', vehicle_type: 'BIKE', service_area_id: '', is_active: true });
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setSaving(false);
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
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle</label>
                  <select 
                    value={formData.vehicle_type}
                    onChange={e => setFormData({...formData, vehicle_type: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none"
                  >
                    <option value="BIKE">BIKE</option>
                    <option value="SCOOTER">SCOOTER</option>
                    <option value="CYCLE">CYCLE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Delivery Zone</label>
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
    </div>
  );
}
