import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons using reliable CDN URLs to avoid bundler path errors
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface PhysicalLocation {
  _id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

interface MapProps {
  locations: PhysicalLocation[];
  selectedLocation?: PhysicalLocation | null;
  onSelectLocation?: (id: string) => void;
  isPinning?: boolean;
  pinningCoords?: { lat: number; lng: number } | null;
  onPinCoordsChange?: (coords: { lat: number; lng: number }) => void;
}

export default function LeafletMap({
  locations,
  selectedLocation,
  onSelectLocation,
  isPinning,
  pinningCoords,
  onPinCoordsChange,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const pinMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use selected location or fallback to Hollywood/Burbank area coordinates
    const initialLat = selectedLocation?.latitude || 34.1563;
    const initialLng = selectedLocation?.longitude || -118.3695;
    const initialZoom = selectedLocation ? 14 : 11;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLng], initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Markers for all locations
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Place new markers
    locations.forEach((loc) => {
      if (loc.latitude && loc.longitude) {
        const marker = L.marker([loc.latitude, loc.longitude])
          .addTo(map)
          .bindPopup(`<b>${loc.name}</b><br/><span style="font-size:11px;color:#64748b;">${loc.address}</span>`);

        if (onSelectLocation) {
          marker.on('click', () => {
            onSelectLocation(loc._id);
          });
        }

        markersRef.current[loc._id] = marker;
      }
    });
  }, [locations, onSelectLocation]);

  // Center Map when selectedLocation changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;

    if (selectedLocation.latitude && selectedLocation.longitude) {
      map.setView([selectedLocation.latitude, selectedLocation.longitude], 14);
      const marker = markersRef.current[selectedLocation._id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedLocation]);

  // Handle map click coordinates selection and draggable marker pinning
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up existing pin marker
    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }

    if (isPinning) {
      const handleMapClick = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (onPinCoordsChange) {
          onPinCoordsChange({ lat, lng });
        }
      };

      map.on('click', handleMapClick);

      // If coords exist, draw a green/standard pin
      if (pinningCoords) {
        const pin = L.marker([pinningCoords.lat, pinningCoords.lng], {
          draggable: true,
        }).addTo(map);

        pinMarkerRef.current = pin;

        pin.on('dragend', (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          if (onPinCoordsChange) {
            onPinCoordsChange({ lat: position.lat, lng: position.lng });
          }
        });

        // Center map on the pin
        map.setView([pinningCoords.lat, pinningCoords.lng], map.getZoom());
      }

      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [isPinning, pinningCoords, onPinCoordsChange]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[350px] shadow-sm rounded-2xl overflow-hidden" />;
}
