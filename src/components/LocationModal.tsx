import React, { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Home, Briefcase, Plus } from 'lucide-react';
import { useDeliveryLocation } from '../LocationContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { Address } from '../types';

export const LocationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { setLocation, pincode: currentPincode } = useDeliveryLocation();
  const { user, profile } = useAuth();
  const [pincode, setPincode] = useState('');
  const [validating, setValidating] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [phone, setPhone] = useState('');
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

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length < 6) return toast.error('Enter a valid 6-digit pincode');
    
    if (user) {
      if (!fullAddress.trim()) return toast.error('Please enter your full address');
      if (phone.length < 10) return toast.error('Please enter a valid 10-digit phone number');
    }

    setValidating(true);
    try {
      // No longer validating with DB, allowed everywhere
      const determinedCity = 'My Location';
      
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
           is_default: true
         }, { onConflict: 'user_id' });
      }

      toast.success(`Success! Delivering to ${pincode}`);
      setLocation(pincode, determinedCity, true);
      onClose();
    } catch (err) {
      console.error('Address save error:', err);
      toast.error('Failed to save location. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const selectAddress = async (addr: Address) => {
    setValidating(true);
    try {
      if (user) {
        // Update DB default
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
        
        await supabase
          .from('user_addresses')
          .update({ is_default: true })
          .eq('id', addr.id);
      }
      
      setLocation(addr.pincode, addr.city, true);
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
      <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden border border-slate-100">
        <div className="p-8 space-y-7">
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
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-inner group-hover:bg-primary transition-colors">
                        <MapPin className="h-4 w-4 text-slate-400 group-hover:text-black transition-colors" />
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

          <form onSubmit={handleValidate} className="space-y-4 pt-2">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search New Address</p>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  autoFocus
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit pincode"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-5 pl-12 rounded-3xl font-black focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-300 text-lg shadow-inner"
                />
              </div>
              
              {user && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <input 
                    type="text" 
                    required
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="House No, Street Name, Famous Landmark"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-300 text-xs shadow-inner"
                  />
                  <input 
                    type="tel" 
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit Phone Number"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-primary focus:bg-white outline-none transition-all placeholder:text-slate-300 text-xs shadow-inner"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={validating}
              className="w-full bg-primary text-black p-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black hover:text-primary transition-all active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Location'}
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
