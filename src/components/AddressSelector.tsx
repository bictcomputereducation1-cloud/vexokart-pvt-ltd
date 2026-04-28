import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Address } from '../types';
import { Plus, MapPin, CheckCircle2, Trash2, Home, Briefcase, Building2, Map, Navigation, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useDeliveryLocation } from '../LocationContext';
import { toast } from 'sonner';
import { LocationPicker } from './LocationPicker';

interface AddressSelectorProps {
  onSelect: (address: Address) => void;
  selectedId?: string;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({ onSelect, selectedId }) => {
  const { user } = useAuth();
  const { setLocation, isServiceable, pincode: currentPincode } = useDeliveryLocation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    full_address: '',
    city: '',
    pincode: '',
    latitude: null as number | null,
    longitude: null as number | null,
    is_default: false
  });

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      
      // Auto-select default or first address if nothing selected
      if (data && data.length > 0 && !selectedId) {
        const def = data.find(a => a.is_default) || data[0];
        handleSelect(def);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (addr: Address) => {
    onSelect(addr);
    const serviceable = await setLocation(addr.pincode, addr.city, addr.full_address, addr.latitude, addr.longitude);
    if (!serviceable) {
      toast.error(`Vexokart is not yet serviceable in ${addr.pincode}`);
    }
  };

  const handleLocationSelected = (data: { lat: number, lng: number, address: string, city: string, pincode: string }) => {
    setNewAddress(prev => ({
        ...prev,
        full_address: data.address,
        city: data.city,
        pincode: data.pincode,
        latitude: data.lat,
        longitude: data.lng
    }));
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newAddress.latitude || !newAddress.longitude) {
        return toast.error('Please select your location on the map');
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_addresses')
        .upsert({ 
          ...newAddress, 
          user_id: user.id 
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      toast.success('Address updated!');
      setIsAdding(false);
      setNewAddress({ 
        full_name: '', 
        phone: '', 
        full_address: '', 
        city: '', 
        pincode: '', 
        latitude: null, 
        longitude: null, 
        is_default: false 
      });
      await fetchAddresses();
    } catch (error: any) {
      console.error('Error saving address:', error);
      // Fallback if columns don't exist
      if (error.message?.includes('latitude') || error.message?.includes('longitude')) {
          console.warn('Latitude/Longitude columns missing in DB. Saving without them.');
          const { latitude, longitude, ...rest } = newAddress;
          const { error: retryError } = await supabase
            .from('user_addresses')
            .upsert({ ...rest, user_id: user.id }, { onConflict: 'user_id' });
          
          if (retryError) throw retryError;
          toast.success('Address saved (without coordinates)');
          setIsAdding(false);
          await fetchAddresses();
      } else {
          toast.error('Failed to save address');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('user_addresses').delete().eq('id', id);
      if (error) throw error;
      setAddresses(addresses.filter(a => a.id !== id));
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  if (loading && addresses.length === 0) {
    return <div className="h-40 flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {addresses.map((addr) => (
          <div 
            key={addr.id}
            onClick={() => handleSelect(addr)}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group ${
              selectedId === addr.id 
                ? 'border-primary bg-primary/5' 
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-white transition-colors">
                <MapPin className={`h-4 w-4 ${selectedId === addr.id ? 'text-primary' : 'text-slate-400'}`} />
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-tight text-slate-900 line-clamp-1">{addr.full_name}</span>
                  {addr.is_default && <span className="text-[8px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-widest">Default</span>}
                </div>
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed mb-1 capitalize line-clamp-2">
                  {addr.full_address}, {addr.city} - {addr.pincode}
                </p>
                <div className="flex items-center gap-2">
                   <p className="text-[9px] font-black italic tracking-tighter text-slate-400">PH: {addr.phone}</p>
                   {selectedId === addr.id && !isServiceable && (
                      <span className="flex items-center gap-1 text-[8px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                         <AlertCircle className="h-2 w-2" /> Out of Range
                      </span>
                   )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {selectedId === addr.id ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-slate-100" />
                )}
                <button onClick={(e) => deleteAddress(addr.id, e)} className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !isAdding && (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <Map className="h-8 w-8 text-slate-300 mx-auto mb-2" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No saved addresses</p>
          </div>
        )}

        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-primary hover:text-primary transition-all text-xs font-black uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" />
          {isAdding ? 'Cancel' : 'Add New Address'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddAddress} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 mb-2">
             <div className="bg-primary p-2 rounded-xl">
                 <Navigation className="h-4 w-4 text-black" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Set Delivery Location</h3>
          </div>

          <LocationPicker onLocationSelected={handleLocationSelected} />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <input 
              required
              placeholder="Full Name"
              className="bg-white border border-slate-100 rounded-2xl px-4 py-4 text-xs font-bold w-full shadow-sm focus:border-primary outline-none transition-all"
              value={newAddress.full_name}
              onChange={e => setNewAddress({...newAddress, full_name: e.target.value})}
            />
            <input 
              required
              placeholder="Phone Number"
              className="bg-white border border-slate-100 rounded-2xl px-4 py-4 text-xs font-bold w-full shadow-sm focus:border-primary outline-none transition-all"
              value={newAddress.phone}
              onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
            />
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Confirm Address Details</p>
                <textarea 
                    required
                    placeholder="House No., Building Name, Area"
                    className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none min-h-[60px]"
                    value={newAddress.full_address}
                    onChange={e => setNewAddress({...newAddress, full_address: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">City</p>
                    <input 
                        required
                        className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                        value={newAddress.city}
                        onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                    />
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pincode</p>
                    <input 
                        required
                        className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                        value={newAddress.pincode}
                        onChange={e => setNewAddress({...newAddress, pincode: e.target.value})}
                    />
                </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black h-14 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Confirm Delivery Location'}
          </button>
        </form>
      )}
    </div>
  );
};
