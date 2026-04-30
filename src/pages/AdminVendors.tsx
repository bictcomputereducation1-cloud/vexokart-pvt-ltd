import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceableArea } from '../types';
import { Store, UserPlus, MapPin, CheckCircle, XCircle, Loader2, X, Search, Save, LocateFixed } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [areas, setAreas] = useState<ServiceableArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    store_name: '',
    phone: '',
    service_area_id: '',
    address: '',
    latitude: 34.1983, // Default to Soporeish area
    longitude: 74.4644,
    is_active: true
  });

  const markerRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vendorsRes, areasRes] = await Promise.all([
        supabase.from('vendors').select(`
          *,
          service_areas (
            id,
            name,
            pincode
          )
        `).order('created_at', { ascending: false }),
        supabase.from('service_areas').select('*').eq('is_active', true).order('name')
      ]);
      
      if (vendorsRes.error) {
        console.error('Vendors fetch error:', vendorsRes.error);
        toast.error('Failed to load vendors: ' + vendorsRes.error.message);
      }
      if (areasRes.error) {
        console.error('Areas fetch error:', areasRes.error);
      }

      setVendors(vendorsRes.data || []);
      setAreas(areasRes.data || []);
    } catch (err: any) {
      console.error('FetchData catch error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    
    // Reverse Geocode
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name }));
      }

      // Auto-match Area
      if (areas.length > 0) {
        let bestMatch: any = null;
        let minDist = Infinity;
        
        areas.forEach(area => {
          if (area.latitude && area.longitude) {
            const dist = Math.sqrt(Math.pow(area.latitude - lat, 2) + Math.pow(area.longitude - lng, 2));
            if (dist < minDist) {
              minDist = dist;
              bestMatch = area;
            }
          }
        });
        
        if (bestMatch) {
          setFormData(prev => ({ ...prev, service_area_id: bestMatch.id }));
        }
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    } finally {
      setGeocoding(false);
    }
  };

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          handleLocationChange(latlng.lat, latlng.lng);
        }
      },
    }),
    [areas]
  );

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password || 'TemporaryPassword123!',
          storeName: formData.store_name,
          phone: formData.phone,
          service_area_id: formData.service_area_id,
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add vendor');

      toast.success('Vendor added and account created successfully');
      setIsAddModalOpen(false);
      fetchData();
      setFormData({ 
        email: '', 
        password: '', 
        store_name: '', 
        phone: '', 
        service_area_id: '', 
        address: '', 
        latitude: 34.1983, 
        longitude: 74.4644, 
        is_active: true 
      });
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
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Vendors</h1>
          <p className="text-slate-500 font-medium">Assign partners to serviceable regions and manage locations</p>
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
                <th className="p-6">Physical Address</th>
                <th className="p-6">Assigned Region</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Store className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No partners found in the system</p>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-primary text-[10px] font-black uppercase mt-4 hover:underline"
                    >
                      Register your first vendor
                    </button>
                  </td>
                </tr>
              ) : vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-black transition-colors">
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{vendor.store_name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{vendor.phone}</p>
                        <p className="text-[10px] font-medium text-slate-400">{vendor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 max-w-xs">
                    {vendor.address ? (
                      <div className="flex gap-2">
                        <MapPin className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed">{vendor.address}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No location set</span>
                    )}
                  </td>
                  <td className="p-6">
                    {vendor.service_areas ? (
                      <div>
                        <div className="flex items-center gap-1 font-black text-sm text-slate-700">
                           {vendor.service_areas.name}
                        </div>
                        <p className="text-[10px] font-black text-slate-400">{vendor.service_areas.pincode}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-red-400 bg-red-50 px-2 py-1 rounded-lg">Not Assigned</span>
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
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tight">Register Partner</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-slate-50 rounded-xl"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleAddVendor} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Region (Auto-Matched)</label>
                  <select 
                    required
                    value={formData.service_area_id}
                    onChange={e => setFormData({...formData, service_area_id: e.target.value})}
                    className="w-full bg-slate-50 rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                  >
                    <option value="">{areas.length > 0 ? 'Select Region' : 'No areas found - create one first'}</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name} ({area.pincode})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex justify-between">
                        <span>Physical Address</span>
                        {geocoding && <Loader2 className="h-3 w-3 animate-spin" />}
                    </label>
                    <textarea 
                      required
                      value={formData.address}
                      readOnly
                      className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-xs outline-none border-2 border-transparent focus:border-primary transition-all resize-none h-24"
                      placeholder="Drag the pin on the map to set address..."
                    />
                </div>

                <button 
                  type="submit"
                  disabled={saving}
                  className="w-full bg-black text-primary h-14 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <><Save className="h-5 w-5" /> Register Vendor</>}
                </button>
              </div>

              <div className="space-y-4">
                <div className="h-[400px] rounded-3xl overflow-hidden border-4 border-slate-50 bg-slate-100 relative group">
                  <div className="absolute top-4 left-4 z-[1000] bg-white px-3 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-2">
                    <LocateFixed className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Select Store Location</span>
                  </div>
                  <MapContainer 
                    center={[formData.latitude, formData.longitude]} 
                    zoom={13} 
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker 
                      position={[formData.latitude, formData.longitude]} 
                      draggable={true}
                      eventHandlers={eventHandlers}
                      ref={markerRef}
                    />
                    <MapEvents onMove={handleLocationChange} />
                  </MapContainer>
                </div>
                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="text-center">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Latitude</p>
                        <p className="font-mono text-xs font-bold">{formData.latitude.toFixed(6)}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-center">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Longitude</p>
                        <p className="font-mono text-xs font-bold">{formData.longitude.toFixed(6)}</p>
                    </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
