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

  const [isCheckPerformed, setIsCheckPerformed] = useState(false);
  const [isServiceableInModal, setIsServiceableInModal] = useState(false);

  const handleLocationSelected = (data: { lat: number, lng: number, address: string, city: string, pincode: string }) => {
    setPincode(data.pincode);
    setCity(data.city);
    setFullAddress(data.address);
    setLat(data.lat);
    setLng(data.lng);
    setIsCheckPerformed(false); // Reset check if location moves
  };

  const handleServiceCheck = async () => {
    if (!lat || !lng) return toast.error('Please select location on map');
    setValidating(true);
    try {
      // Direct check against Supabase
      const { data: areaByPincode } = await supabase
        .from('serviceable_areas')
        .select('*')
        .eq('pincode', pincode)
        .eq('is_active', true)
        .maybeSingle();

      let serviceable = false;
      if (areaByPincode) {
        serviceable = true;
      } else {
        const { data: allAreas } = await supabase
          .from('serviceable_areas')
          .select('*')
          .eq('is_active', true);
        
        if (allAreas) {
          for (const area of allAreas) {
            if (area.latitude && area.longitude && area.radius_km) {
              const R = 6371;
              const dLat = (area.latitude - lat) * Math.PI / 180;
              const dLon = (area.longitude - lng) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(lat * Math.PI / 180) * Math.cos(area.latitude * Math.PI / 180) * 
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              if (R * c <= area.radius_km) {
                serviceable = true;
                break;
              }
            }
          }
        }
      }

      setIsServiceableInModal(serviceable);
      setIsCheckPerformed(true);
      if (serviceable) {
        toast.success(`Great news! We deliver to ${city || pincode}`);
      } else {
        toast.error('Not serviceable in your area', {
            description: "We are currently only serving select areas of Sopore."
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Service check failed');
    } finally {
      setValidating(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCheckPerformed || !isServiceableInModal) {
        handleServiceCheck();
        return;
    }
    
    if (user) {
      if (!fullAddress.trim()) return toast.error('Please enter your full address');
      if (phone.length < 10) return toast.error('Enter a valid 10-digit phone number');
    }

    setValidating(true);
    try {
      const determinedCity = city || 'My Location';
      
      if (user && fullAddress.trim()) {
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

      await setLocation(pincode, determinedCity, fullAddress, lat, lng);
      toast.success('Location set successfully!');
      onClose();
    } catch (err: any) {
      console.error('Address save error:', err);
      toast.error('Failed to save location');
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
      
      const serviceable = await setLocation(addr.pincode, addr.city, addr.full_address, addr.latitude, addr.longitude);
      if (serviceable) {
        toast.success(`Delivery set to ${addr.city}`);
      } else {
        toast.error(`Vexokart is not yet serviceable in ${addr.pincode}`);
      }
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
                      <div className="bg-white p-4 rounded-2xl border-2 border-primary/20 flex flex-col gap-1 shadow-sm">
                          <p className="text-[9px] font-black uppercase tracking-widest text-primary">Pincode</p>
                          <input 
                            readOnly
                            value={pincode}
                            className="w-full bg-transparent font-black focus:outline-none transition-all text-sm"
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

              {isCheckPerformed && (
                <div className={`p-4 rounded-2xl animate-in zoom-in-95 duration-300 border-2 ${isServiceableInModal ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isServiceableInModal ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isServiceableInModal ? 'Serviceable Area' : 'Not Serviceable'}
                    </p>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                        {isServiceableInModal 
                            ? "We deliver here! Proceed to confirm." 
                            : "Sorry, Vexokart doesn't serve this point yet."}
                    </p>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={validating || !lat}
              className={`w-full h-16 rounded-[2rem] font-black uppercase tracking-tighter transition-all active:scale-95 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm ${
                isCheckPerformed && isServiceableInModal 
                ? 'bg-black text-primary shadow-primary/10' 
                : 'bg-primary text-black shadow-primary/20'
              }`}
            >
              {validating ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                      {isCheckPerformed && isServiceableInModal 
                        ? 'Confirm & Proceed' 
                        : isCheckPerformed && !isServiceableInModal
                        ? 'Try Another Area'
                        : 'Check Serviceability'}
                      <CheckCircle2 className="h-5 w-5" />
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
