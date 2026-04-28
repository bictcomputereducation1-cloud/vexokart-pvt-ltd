import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './AuthContext';

interface LocationContextType {
  pincode: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isServiceable: boolean;
  setLocation: (pincode: string, city: string, address: string, latitude?: number | null, longitude?: number | null) => void;
  isLoading: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [pincode, setPincode] = useState<string | null>(localStorage.getItem('vexo_pincode'));
  const [city, setCity] = useState<string | null>(localStorage.getItem('vexo_city'));
  const [address, setAddress] = useState<string | null>(localStorage.getItem('vexo_address'));
  const [latitude, setLatitude] = useState<number | null>(localStorage.getItem('vexo_lat') ? Number(localStorage.getItem('vexo_lat')) : null);
  const [longitude, setLongitude] = useState<number | null>(localStorage.getItem('vexo_lng') ? Number(localStorage.getItem('vexo_lng')) : null);
  const [isServiceable, setIsServiceable] = useState<boolean>(localStorage.getItem('vexo_serviceable') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkSavedLocation = async () => {
      setIsLoading(true);
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const hasLocal = !!localStorage.getItem('vexo_pincode');

      try {
        const { data: addr } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();

        if (addr) {
          // No longer verifying serviceability, delivery allowed everywhere
          setLocation(addr.pincode, addr.city, addr.full_address, addr.latitude, addr.longitude);
        } else if (!hasLocal) {
          setTimeout(() => setIsModalOpen(true), 1000);
        }
      } catch (err) {
        console.error('Error fetching address:', err);
      }
      
      setIsLoading(false);
    };

    checkSavedLocation();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('vexo_pincode');
        localStorage.removeItem('vexo_city');
        localStorage.removeItem('vexo_address');
        localStorage.removeItem('vexo_lat');
        localStorage.removeItem('vexo_lng');
        localStorage.removeItem('vexo_serviceable');
        setPincode(null);
        setCity(null);
        setAddress(null);
        setLatitude(null);
        setLongitude(null);
        setIsServiceable(true); // Default to true
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const setLocation = (newPincode: string, newCity: string, newAddress: string, lat?: number | null, lng?: number | null) => {
    setPincode(newPincode);
    setCity(newCity);
    setAddress(newAddress);
    setLatitude(lat || null);
    setLongitude(lng || null);
    setIsServiceable(true); // Always true
    localStorage.setItem('vexo_pincode', newPincode);
    localStorage.setItem('vexo_city', newCity);
    localStorage.setItem('vexo_address', newAddress);
    if (lat) localStorage.setItem('vexo_lat', lat.toString());
    if (lng) localStorage.setItem('vexo_lng', lng.toString());
    localStorage.setItem('vexo_serviceable', 'true');
  };

  return (
    <LocationContext.Provider value={{ pincode, city, isServiceable, setLocation, isLoading, isModalOpen, setIsModalOpen }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useDeliveryLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useDeliveryLocation must be used within a LocationProvider');
  }
  return context;
};
