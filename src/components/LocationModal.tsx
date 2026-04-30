import React, { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Navigation, CheckCircle2, ArrowLeft, Check, ChevronRight, Plus } from 'lucide-react';
import { useDeliveryLocation } from '../LocationContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { Address } from '../types';
import { LocationPicker } from './LocationPicker';
import { cn } from '../lib/utils';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'selection' | 'map'>('selection');

  const isForced = !currentPincode && user;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setValidating(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      
      const text = await response.text();
      console.log("Raw location search response:", text);

      if (!response.ok) {
        console.error("Location search API Error:", text);
        throw new Error("Location search API failed");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON from location search:", text);
        throw new Error("Location search returned non-JSON response");
      }

      if (data && data.length > 0) {
        const result = data[0];
        setLat(parseFloat(result.lat));
        setLng(parseFloat(result.lon));
      } else {
        toast.error('Location not found');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setValidating(false);
    }
  };

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
        .from('service_areas')
        .select('*')
        .eq('pincode', pincode)
        .eq('is_active', true)
        .maybeSingle();

      let serviceable = false;
      if (areaByPincode) {
        serviceable = true;
      } else {
        const { data: allAreas } = await supabase
          .from('service_areas')
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

  if (view === 'selection') {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50 overflow-hidden animate-in fade-in transition-all">
        {/* HEADER SECTION */}
        <div className="bg-white px-4 pt-6 pb-4 space-y-4 shadow-sm z-10">
          <div className="flex items-center gap-4">
            {!isForced && (
              <button 
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl active:scale-95 transition-all"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
            )}
            {/* Search Bar Inline */}
            <form onSubmit={handleSearch} className="flex-grow relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Area, building, land..."
                className="w-full h-12 bg-slate-100 rounded-xl pl-4 pr-12 text-sm font-bold border-transparent focus:bg-white focus:border-slate-200 transition-all no-scrollbar"
              />
              <button 
                type="submit"
                className="absolute right-1 top-1 h-10 w-10 bg-transparent flex items-center justify-center text-emerald-600"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
          {/* Action Buttons */}
          <div className="space-y-4">
            <button 
              onClick={() => {
                // handle get current location logic could be here
                // for now fallback to map view or trigger picker location
                setView('map');
              }}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm group active:bg-slate-50 transition-all border border-slate-100"
            >
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Navigation className="h-5 w-5 rotate-45" />
                 </div>
                 <span className="text-sm font-black text-slate-800 tracking-tight">Use my current location</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <button 
              onClick={() => {
                setIsCheckPerformed(false);
                setIsServiceableInModal(false);
                setLat(null);
                setLng(null);
                setFullAddress('');
                setView('map');
              }}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm group active:bg-slate-50 transition-all border border-slate-100"
            >
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> {/* Actually a plus icon would be better but keeping theme */}
                    <div className="absolute flex items-center justify-center">
                       <Plus className="h-4 w-4" />
                    </div>
                 </div>
                 <span className="text-sm font-black text-slate-800 tracking-tight">Add new address</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Saved Addresses Section */}
          {user && savedAddresses.length > 0 && (
            <div className="space-y-4">
              <div className="px-1">
                <h3 className="text-base font-black text-slate-800 leading-tight">Saved addresses</h3>
                <p className="text-xs font-semibold text-slate-400">Tap to check availability and continue</p>
              </div>

              <div className="space-y-4">
                {savedAddresses.map(addr => (
                  <button 
                    key={addr.id}
                    onClick={() => selectAddress(addr)}
                    className="w-full relative flex items-start gap-4 p-5 bg-white rounded-[2rem] shadow-sm border border-slate-100 active:scale-[0.99] transition-all text-left"
                  >
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                       <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-grow min-w-0 pr-6">
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            {addr.city === 'My Location' ? 'Home' : 'Other'}
                          </span>
                          {addr.is_default && (
                            <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">
                              Default
                            </span>
                          )}
                       </div>
                       <p className="text-sm font-black text-slate-800 leading-tight mb-1 truncate">
                          {addr.pincode}, {addr.city}
                       </p>
                       <p className="text-[11px] font-semibold text-slate-400 leading-relaxed line-clamp-1">
                          {addr.full_address}
                       </p>
                    </div>
                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Select Location on Map Button */}
          <button 
            onClick={() => setView('map')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm group active:bg-slate-50 transition-all border border-slate-100"
          >
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <MapPin className="h-5 w-5" />
               </div>
               <span className="text-sm font-black text-slate-800 tracking-tight">Select location on map</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50 overflow-hidden animate-in fade-in transition-all">
      {/* HEADER SECTION */}
      <div className="bg-slate-50/80 backdrop-blur-md px-4 pt-6 pb-4 space-y-4 animate-in slide-in-from-top duration-500 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('selection')}
            className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 leading-tight">Select location</h2>
            <p className="text-xs font-semibold text-slate-400">Search or drag the map</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Area, building, landmark..."
            className="w-full h-14 bg-white rounded-2xl pl-6 pr-14 text-sm font-bold shadow-sm border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-focus-within:bg-emerald-600 group-focus-within:text-white transition-all shadow-sm"
          >
            <Search className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* MAP AREA */}
      <div className="flex-grow relative overflow-hidden">
         <LocationPicker 
           onLocationSelected={handleLocationSelected} 
           initialLocation={lat && lng ? { lat, lng } : undefined} 
         />
      </div>

      {/* BOTTOM OVERLAY CARDS */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 pointer-events-none z-[1000]">
        <div className="max-w-md mx-auto space-y-3 pointer-events-auto">
          {/* Card 1: Pin placed */}
          <div className="bg-blue-50/90 backdrop-blur-xl border border-blue-100 rounded-[1.5rem] p-4 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom duration-500 delay-100">
             <div className="h-11 w-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <div className="relative">
                  <Navigation className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full animate-ping" />
                </div>
             </div>
             <div className="flex-grow min-w-0">
                <h3 className="text-sm font-bold text-slate-800">Pin placed</h3>
                <p className="text-[11px] font-semibold text-slate-500 leading-tight">
                  Tap Check to verify delivery for this spot.
                </p>
             </div>
             <button 
               onClick={handleServiceCheck}
               disabled={validating}
               className="bg-emerald-800 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
             >
               {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check'}
             </button>
          </div>

          {/* Card 2: Selected address or verification status */}
          <div className="bg-white rounded-[1.5rem] p-5 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-500 delay-200">
             <div className="flex items-start gap-4 mb-6">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors",
                  isServiceableInModal ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                )}>
                   <MapPin className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected address</p>
                   <p className="text-[13px] font-bold text-slate-700 leading-tight">
                     {isCheckPerformed 
                       ? (isServiceableInModal ? (fullAddress || city || 'Verified Location') : 'Vexokart is not yet serviceable here')
                       : "Tap Check to resolve the address and verify delivery for this pin."}
                   </p>
                </div>
             </div>

             {/* Form fields for phone/address if verified and user logged in */}
             {isServiceableInModal && user && (
               <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Detail Address (House/Block)</p>
                      <input 
                        type="text"
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        placeholder="e.g. Flat 101, Galaxy Residency"
                        className="w-full bg-transparent font-bold focus:outline-none transition-all text-sm"
                      />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mobile Number</p>
                      <input 
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10 digit mobile number"
                        className="w-full bg-transparent font-bold focus:outline-none transition-all text-sm"
                      />
                  </div>
               </div>
             )}

             <button 
               onClick={handleValidate}
               disabled={validating || !lat || (!isServiceableInModal && isCheckPerformed)}
               className={cn(
                 "w-full h-14 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-2 text-sm shadow-xl",
                 isCheckPerformed && isServiceableInModal 
                   ? "bg-slate-900 text-white shadow-slate-900/20 active:scale-[0.98]" 
                   : "bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed"
               )}
             >
               Confirm & proceed
             </button>
          </div>
        </div>
      </div>

      {/* Saved Addresses Overlay (Slide up from side or bottom when needed) */}
      {user && savedAddresses.length > 0 && !isCheckPerformed && (
        <div className="absolute bottom-24 left-4 right-4 z-[1001] animate-in slide-in-from-right duration-500">
           {/* Option to toggle saved addresses */}
        </div>
      )}
    </div>
  );
};
