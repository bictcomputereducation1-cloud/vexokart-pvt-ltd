import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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

// Helper component to handle map movement
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelected, initialLocation }) => {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [34.1691, 74.4556] // Default to Sopore, Kashmir
  );
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Reverse Geocoding using Nominatim
  const fetchAddress = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
            headers: {
                'Accept-Language': 'en'
            }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.display_name;
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
        const pincode = data.address.postcode || '';
        
        setAddress(addr);
        onLocationSelected({
          lat,
          lng,
          address: addr,
          city,
          pincode
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast.error('Failed to fetch address details');
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchAddress(latitude, longitude);
        setIsLoading(false);
        toast.success('Location detected!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not get your location. Please select it manually on the map.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Map Events component
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        fetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });

    return (
      <Marker 
        position={position} 
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const pos = marker.getLatLng();
            setPosition([pos.lat, pos.lng]);
            fetchAddress(pos.lat, pos.lng);
          },
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[300px] rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner">
        <MapContainer 
          center={position} 
          zoom={16} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
          <MapController center={position} />
        </MapContainer>

        <button 
          onClick={handleGetCurrentLocation}
          disabled={isLoading}
          className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-2xl active:scale-90 transition-all border border-slate-100 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Navigation className="h-5 w-5 text-primary" />}
        </button>

        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-slate-100 shadow-xl flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-xl shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-grow min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Move marker to confirm location</p>
                    <p className="text-[11px] font-bold text-slate-900 truncate">
                        {isReverseGeocoding ? 'Detecting address...' : address || 'Tap map to select location'}
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selected Address</h3>
            {address && !isReverseGeocoding && <Check className="h-4 w-4 text-emerald-500" />}
        </div>
        <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
            {isReverseGeocoding ? (
                <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Finding details...
                </span>
            ) : address || 'Pick a point on the map to get started'}
        </p>
      </div>
    </div>
  );
};
