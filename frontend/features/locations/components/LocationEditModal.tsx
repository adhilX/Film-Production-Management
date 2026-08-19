import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { locationService } from '../services/location.service';
import { locationSchema } from '../validations/location.validation';
import { formatError } from '@/utils/format-error';
import type { Location } from '@/features/locations/types';

// Load Leaflet Map only on client-side
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[150px] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center flex-col gap-2">
      <Loader2 className="animate-spin text-indigo-600" size={20} />
      <span className="text-[10px] text-slate-400 font-medium">Loading interactive map...</span>
    </div>
  ),
});

interface LocationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
  productionId: string;
  onSave: () => void;
}

export const LocationEditModal: React.FC<LocationEditModalProps> = ({
  isOpen,
  onClose,
  location,
  productionId,
  onSave,
}) => {
  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locDescription, setLocDescription] = useState('');
  const [locType, setLocType] = useState('');
  const [locContact, setLocContact] = useState('');
  const [locImage, setLocImage] = useState('');
  const [locLat, setLocLat] = useState<number | undefined>(undefined);
  const [locLng, setLocLng] = useState<number | undefined>(undefined);

  // Nominatim Search
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && location) {
      setLocName(location.name);
      setLocAddress(location.address);
      setLocDescription(location.description || '');
      setLocType(location.locationType || '');
      setLocContact(location.contactInfo || '');
      setLocImage(location.imageUrl || '');
      setLocLat(location.latitude);
      setLocLng(location.longitude);
      setSearchQuery('');
      setSuggestions([]);
      setError('');
      setFieldErrors({});
    }
  }, [isOpen, location]);

  // Debounced address lookup using Nominatim
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
          {
            headers: {
              'User-Agent': 'Tendagon-Film-Production-Management/1.0',
            },
          }
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Error querying Nominatim:', err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item: any) => {
    setLocAddress(item.display_name);
    setLocLat(parseFloat(item.lat));
    setLocLng(parseFloat(item.lon));
    setSuggestions([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;
    setError('');
    setFieldErrors({});

    const parseResult = locationSchema.safeParse({
      name: locName,
      address: locAddress,
      description: locDescription || undefined,
      latitude: (locLat === undefined || isNaN(locLat as any)) ? undefined : locLat,
      longitude: (locLng === undefined || isNaN(locLng as any)) ? undefined : locLng,
      locationType: locType || undefined,
      contactInfo: locContact || undefined,
      imageUrl: locImage || undefined,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      });
      setFieldErrors(errors);
      setError('Please fix the validation errors before submitting.');
      return;
    }

    try {
      await locationService.updateLocation(productionId, location._id, {
        name: locName,
        address: locAddress,
        description: locDescription,
        locationType: locType,
        contactInfo: locContact,
        imageUrl: locImage,
        latitude: locLat,
        longitude: locLng,
      });
      toast.success('Location updated successfully.');
      onSave();
      onClose();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to update location.');
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  if (!isOpen || !location) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
          <span className="text-sm font-extrabold text-slate-800">Edit Physical Location</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border-b border-red-100 text-red-800 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sound Stage A"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 font-semibold ${
                  fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              />
              {fieldErrors.name && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location Type</label>
              <input
                type="text"
                placeholder="e.g. Studio, Desert, Mansion"
                value={locType}
                onChange={(e) => setLocType(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Nominatim Search Wrapper */}
          <div className="space-y-1 relative">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Address Search *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search address using OpenStreetMap Nominatim..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setLocAddress(e.target.value);
                }}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 pr-8 font-semibold ${
                  fieldErrors.address ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              />
              {isSearchingAddress && (
                <div className="absolute right-2.5 top-2.5">
                  <Loader2 className="animate-spin text-slate-400" size={14} />
                </div>
              )}
            </div>
            {fieldErrors.address && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.address}</p>
            )}

            {suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left p-2.5 hover:bg-slate-50 text-[11px] text-slate-650 font-semibold block truncate cursor-pointer"
                  >
                    {item.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview Address */}
          <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl break-words leading-relaxed">
            Selected Address: {locAddress || 'None'}
          </div>

          {/* Pin Coordinates Visual Indicator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Latitude</label>
              <input
                type="number"
                step="any"
                placeholder="Auto-filled via map or search"
                value={locLat ?? ''}
                onChange={(e) => setLocLat(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Longitude</label>
              <input
                type="number"
                step="any"
                placeholder="Auto-filled via map or search"
                value={locLng ?? ''}
                onChange={(e) => setLocLng(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-500 font-semibold"
              />
            </div>
            {fieldErrors.latitude && (
              <p className="text-[10px] text-red-500 font-bold col-span-2">{fieldErrors.latitude}</p>
            )}
          </div>

          {/* Pin Map inside Edit Modal */}
          <div className="h-[180px] rounded-xl overflow-hidden relative border border-slate-200 z-0">
            <LeafletMap
              locations={[]}
              isPinning={true}
              pinningCoords={locLat && locLng ? { lat: locLat, lng: locLng } : null}
              onPinCoordsChange={(coords) => {
                setLocLat(coords.lat);
                setLocLng(coords.lng);
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Contact Info</label>
              <input
                type="text"
                placeholder="Manager contact, phone, notes"
                value={locContact}
                onChange={(e) => setLocContact(e.target.value)}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 font-semibold ${
                  fieldErrors.contactInfo ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              />
              {fieldErrors.contactInfo && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.contactInfo}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={locImage}
                onChange={(e) => setLocImage(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Additional physical description..."
              value={locDescription}
              onChange={(e) => setLocDescription(e.target.value)}
              rows={2}
              className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 font-semibold ${
                fieldErrors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
              }`}
            />
            {fieldErrors.description && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-655 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationEditModal;
