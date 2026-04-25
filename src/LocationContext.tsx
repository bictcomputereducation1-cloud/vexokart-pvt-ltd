import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './AuthContext';

interface LocationContextType {
  pincode: string | null;
  city: string | null;
  isServiceable: boolean;
  setLocation: (pincode: string, city: string, serviceable: boolean) => void;
  isLoading: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [pincode, setPincode] = useState<string | null>(localStorage.getItem('vexo_pincode'));
  const [city, setCity] = useState<string | null>(localStorage.getItem('vexo_city'));
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
          setLocation(addr.pincode, addr.city, true);
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
        localStorage.removeItem('vexo_serviceable');
        setPincode(null);
        setCity(null);
        setIsServiceable(true); // Default to true
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  const setLocation = (newPincode: string, newCity: string, _serviceable: boolean) => {
    setPincode(newPincode);
    setCity(newCity);
    setIsServiceable(true); // Always true
    localStorage.setItem('vexo_pincode', newPincode);
    localStorage.setItem('vexo_city', newCity);
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
