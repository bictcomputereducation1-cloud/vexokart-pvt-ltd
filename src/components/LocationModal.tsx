import React, { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Home, Briefcase, Plus, Navigation, CheckCircle2 } from 'lucide-react';
import { useDeliveryLocation } from '../LocationContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { Address } from '../types';
import { LocationPicker } from './LocationPicker';

export const LocationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { setLocation, pincode: currentPincode } = useDeliveryLocation();
  const { user, profile } = useAuth();
  const [pincode, setPincode] = useState('');
  const [validating, setValidating] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  const isForced = !currentPincode && user;

  useEffect(() => {
    if (user && isOpen) {
      fetchSavedAddresses();
    }
  }, [user, isOpen]);

  const fetchSavedAddresses = async () => {
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user?.id)
      .order('is_default', { ascending: false })
      .limit(3);
    if (data) setSavedAddresses(data);
  };

  const handleLocationSelected = (data: { lat: number, lng: number, address: string, city: string, pincode: string }) => {
    setPincode(data.pincode);
    setCity(data.city);
    setFullAddress(data.address);
    setLat(data.lat);
    setLng(data.lng);
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lng) return toast.error('Please select location on map');
    
    if (user) {
      if (!fullAddress.trim()) return toast.error('Please enter your full address');
      if (phone.length < 10) return toast.error('Please enter a valid 10-digit phone number');
    }

    setValidating(true);
    try {
      const determinedCity = city || 'My Location';
      
      if (user && fullAddress.trim()) {
         // Reset existing defaults first
         await supabase
           .from('user_addresses')
           .update({ is_default: false })
           .eq('user_id', user.id);

         await supabase.from('user_addresses').upsert({
           user_id: user.id,
           pincode,
           city: determinedCity,
           full_address: fullAddress,
           full_name: profile?.name || user.email?.split('@')[0] || 'Member',
           phone: phone,
           latitude: lat,
           longitude: lng,
           is_default: true
         }, { onConflict: 'user_id' });
      }

      toast.success(`Success! Delivering to ${pincode}`);
      setLocation(pincode, determinedCity, fullAddress, lat, lng);
      onClose();
    } catch (err: any) {
      console.error('Address save error:', err);
      if (err.message?.includes('latitude')) {
          // Fallback if columns missing
          setLocation(pincode, city || 'My Location', fullAddress);
          onClose();
      } else {
          toast.error('Failed to save location. Please try again.');
      }
    } finally {
      setValidating(false);
    }
  };

  const selectAddress = async (addr: Address) => {
    setValidating(true);
    try {
      if (user) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
        
        await supabase
          .from('user_addresses')
          .update({ is_default: true })
          .eq('id', addr.id);
      }
      
      setLocation(addr.pincode, addr.city, addr.full_address, addr.latitude, addr.longitude);
      toast.success(`Delivery set to ${addr.city}`);
      onClose();
    } catch (err) {
      toast.error('Failed to update delivery address');
    } finally {
      setValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500 ${isForced ? 'pointer-events-none' : ''}`}
        onClick={!isForced ? onClose : undefined}
      />
      <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-tight">Select Delivery<br/><span className="text-primary italic">Location</span></h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              Unlock 14 minutes delivery by picking your spot.
            </p>
          </div>

          {user && savedAddresses.length > 0 && (
            <div className="space-y-3">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Saved Places</p>
               <div className="space-y-2">
                  {savedAddresses.map(addr => (
                    <button 
                      key={addr.id}
                      onClick={() => selectAddress(addr)}
                      className="flex items-center gap-4 w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-primary/40 hover:bg-white transition-all text-left group shadow-sm"
                    >
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-inner group-hover:bg-primary transition-colors text-slate-400 group-hover:text-black">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col flex-grow">
                        <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">{addr.city} - {addr.pincode}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{addr.full_address}</span>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          )}

          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pick on Map</p>
             <LocationPicker onLocationSelected={handleLocationSelected} />
          </div>

          <form onSubmit={handleValidate} className="space-y-4 pt-2">
            <div className="space-y-3">
              {user && (
                <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex flex-col gap-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Address</p>
                      <textarea 
                        required
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        placeholder="House No, Street Name, Landmark"
                        className="w-full bg-transparent font-bold focus:outline-none transition-all placeholder:text-slate-200 text-xs shadow-none min-h-[60px]"
                      />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex flex-col gap-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pincode</p>
                          <input 
                            type="text" 
                            required
                            maxLength={6}
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                            placeholder="6-digit"
                            className="w-full bg-transparent font-bold focus:outline-none transition-all placeholder:text-slate-200 text-xs"
                          />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex flex-col gap-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                          <input 
                            type="tel" 
                            required
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="10-digit"
                            className="w-full bg-transparent font-bold focus:outline-none transition-all placeholder:text-slate-200 text-xs"
                          />
                      </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={validating || !lat}
              className="w-full bg-primary text-black h-16 rounded-[2rem] font-black uppercase tracking-tighter hover:bg-black hover:text-primary transition-all active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {validating ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                      Confirm & Set Location <CheckCircle2 className="h-5 w-5" />
                  </span>
              )}
            </button>
          </form>

          {!user && (
            <div className="text-center pt-2">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 border-t border-slate-50 pt-6">Login to sync your saved addresses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
