import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceableArea } from '../types';
import { Store, UserPlus, MapPin, CheckCircle, XCircle, Loader2, X, Search, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [areas, setAreas] = useState<ServiceableArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    store_name: '',
    phone: '',
    service_area_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vendorsRes, areasRes] = await Promise.all([
        supabase.from('vendors').select('*, service_area:serviceable_areas(city, pincode)').order('created_at', { ascending: false }),
        supabase.from('serviceable_areas').select('*').eq('is_active', true).order('city')
      ]);
      
      setVendors(vendorsRes.data || []);
      setAreas(areasRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password || 'TemporaryPassword123!', // Standard temp pass if not provided
          storeName: formData.store_name,
          phone: formData.phone,
          service_area_id: formData.service_area_id
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add vendor');

      toast.success('Vendor added and account created successfully');
      setIsAddModalOpen(false);
      fetchData();
      setFormData({ email: '', password: '', store_name: '', phone: '', service_area_id: '', is_active: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add vendor');
    } finally {
      setSaving(false);
    }
  };

  const toggleVendorStatus = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('vendors')
      .update({ is_active: !currentStatus })
      .eq('id', vendorId);
      
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Vendor status updated');
      setVendors(vendors.map(v => v.id === vendorId ? { ...v, is_active: !currentStatus } : v));
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic">VENDORS</h1>
          <p className="text-slate-500 font-medium">Assign partners to serviceable regions</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-black px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black hover:text-primary transition-all shadow-xl shadow-primary/20"
        >
          <UserPlus className="h-5 w-5" /> Add New Vendor
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="p-6">Business Details</th>
                <th className="p-6">Contact Info</th>
                <th className="p-6">Assigned Region</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-black transition-colors">
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{vendor.store_name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">ID: {vendor.id?.slice(0,8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-sm text-slate-600">{vendor.email}</p>
                    <p className="text-[10px] font-black text-slate-400 mt-1">{vendor.phone}</p>
                  </td>
                  <td className="p-6">
                    {vendor.service_area ? (
                      <div>
                        <div className="flex items-center gap-1 font-black text-sm text-slate-700">
                          <MapPin className="h-3 w-3 text-primary" /> {vendor.service_area.city}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 ml-4">{vendor.service_area.pincode}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-red-400 bg-red-50 px-2 py-1 rounded-lg">Unassigned</span>
                    )}
                  </td>
                  <td className="p-6">
                    {vendor.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-400">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => toggleVendorStatus(vendor.id, vendor.is_active)}
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${vendor.is_active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                    >
                      {vendor.is_active ? 'Deactivate' : 'Activate'}
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
              <h2 className="text-2xl font-black tracking-tight">New Partner</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-50 rounded-xl"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Store / Business Name</label>
                <input 
                  required
                  value={formData.store_name}
                  onChange={e => setFormData({...formData, store_name: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                  placeholder="e.g. Fresh Mart Sopore"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Service Region</label>
                <select 
                  required
                  value={formData.service_area_id}
                  onChange={e => setFormData({...formData, service_area_id: e.target.value})}
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                >
                  <option value="">Select Target Area</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.city} ({area.pincode})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-black text-primary h-14 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Register Vendor</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
