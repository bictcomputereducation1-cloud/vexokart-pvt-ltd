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
  setLocation: (pincode: string, city: string, address: string, latitude?: number | null, longitude?: number | null) => Promise<boolean>;
  isLoading: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Helper for distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [pincode, setPincode] = useState<string | null>(localStorage.getItem('vexo_pincode'));
  const [city, setCity] = useState<string | null>(localStorage.getItem('vexo_city'));
  const [address, setAddress] = useState<string | null>(localStorage.getItem('vexo_address'));
  const [latitude, setLatitude] = useState<number | null>(localStorage.getItem('vexo_lat') ? Number(localStorage.getItem('vexo_lat')) : null);
  const [longitude, setLongitude] = useState<number | null>(localStorage.getItem('vexo_lng') ? Number(localStorage.getItem('vexo_lng')) : null);
  const [isServiceable, setIsServiceable] = useState<boolean>(localStorage.getItem('vexo_serviceable') !== 'false');
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
          await setLocation(addr.pincode, addr.city, addr.full_address, addr.latitude, addr.longitude);
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
        setIsServiceable(true); 
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const setLocation = async (newPincode: string, newCity: string, newAddress: string, lat?: number | null, lng?: number | null) => {
    // Check serviceability
    let serviceable = false;
    try {
      // 1. Try pincode match first
      const { data: areaByPincode } = await supabase
        .from('serviceable_areas')
        .select('*')
        .eq('pincode', newPincode)
        .eq('is_active', true)
        .maybeSingle();

      if (areaByPincode) {
        serviceable = true;
      } else if (lat && lng) {
        // 2. Try nearby check if we have lat/lng
        const { data: allAreas } = await supabase
          .from('serviceable_areas')
          .select('*')
          .eq('is_active', true);
        
        if (allAreas) {
          // Check if user is within radius of any area with coordinates
          for (const area of allAreas) {
            if (area.latitude && area.longitude && area.radius_km) {
              const dist = calculateDistance(lat, lng, area.latitude, area.longitude);
              if (dist <= area.radius_km) {
                serviceable = true;
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Serviceability check failed:', err);
      // Fallback: allow if check fails (optimistic)
      serviceable = true;
    }

    setPincode(newPincode);
    setCity(newCity);
    setAddress(newAddress);
    setLatitude(lat || null);
    setLongitude(lng || null);
    setIsServiceable(serviceable);

    localStorage.setItem('vexo_pincode', newPincode);
    localStorage.setItem('vexo_city', newCity);
    localStorage.setItem('vexo_address', newAddress);
    if (lat) localStorage.setItem('vexo_lat', lat.toString());
    if (lng) localStorage.setItem('vexo_lng', lng.toString());
    localStorage.setItem('vexo_serviceable', serviceable.toString());

    return serviceable;
  };

  return (
    <LocationContext.Provider value={{ 
      pincode, 
      city, 
      address, 
      latitude, 
      longitude, 
      isServiceable, 
      setLocation, 
      isLoading, 
      isModalOpen, 
      setIsModalOpen 
    }}>
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
