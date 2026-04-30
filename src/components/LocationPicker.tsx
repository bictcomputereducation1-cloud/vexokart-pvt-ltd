import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Loader2, Check, Target } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  onLocationSelected: (data: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    pincode: string;
  }) => void;
  initialLocation?: { lat: number; lng: number };
}

function CenterPinHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    },
  });

  return null;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelected, initialLocation }) => {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [34.1691, 74.4556]
  );
  const [address, setAddress] = useState('');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isManualMoving, setIsManualMoving] = useState(false);
  const lastUpdateRef = useRef<number>(0);

  const fetchAddress = async (lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 500) return; 
    lastUpdateRef.current = now;

    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      
      const text = await response.text();
      console.log("Raw reverse geocoding response:", text);

      if (!response.ok) {
        console.error("Reverse geocoding API Error:", text);
        throw new Error("Reverse geocoding API failed");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON from reverse geocoding:", text);
        throw new Error("Reverse geocoding returned non-JSON response");
      }
      
      if (data && data.address) {
        const addr = data.display_name;
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
        const pincode = data.address.postcode || '';
        
        setAddress(addr);
        onLocationSelected({ lat, lng, address: addr, city, pincode });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  useEffect(() => {
    if (initialLocation) {
      setPosition([initialLocation.lat, initialLocation.lng]);
      fetchAddress(initialLocation.lat, initialLocation.lng);
    }
  }, [initialLocation?.lat, initialLocation?.lng]);

  useEffect(() => {
    if (!initialLocation) {
       fetchAddress(position[0], position[1]);
    }
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');

    setIsManualMoving(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchAddress(latitude, longitude);
        setIsManualMoving(false);
      },
      () => {
        toast.error('Could not get accurate location');
        setIsManualMoving(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="h-full w-full">
      <div className="relative h-full w-full group">
        <MapContainer 
          center={position} 
          zoom={16} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CenterPinHandler onMove={(lat, lng) => fetchAddress(lat, lng)} />
          <MapController center={position} />
        </MapContainer>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none mb-6">
          <div className="relative flex flex-col items-center">
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest mb-1 shadow-xl animate-bounce whitespace-nowrap">
               Deliver Here
            </div>
            <div className="relative">
                <MapPin className="h-10 w-10 text-emerald-600 fill-emerald-600/30 drop-shadow-2xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black/20 rounded-full blur-[1px]" />
            </div>
          </div>
        </div>

        <button 
          onClick={handleGetCurrentLocation}
          className="absolute bottom-40 right-6 z-[1000] bg-white h-12 w-12 flex items-center justify-center rounded-2xl shadow-2xl active:scale-90 transition-all border border-slate-100"
        >
          <Target className="h-5 w-5 text-emerald-600" />
        </button>
      </div>
    </div>
  );
};
