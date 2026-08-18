"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Building,
  Phone,
  Globe,
  Upload,
  X,
  Loader2,
  Copy,
  Check,
  Search,
  Save,
  Film,
  FileText
} from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import locationsService from '@/services/locationsService';
import { authService } from '@/services/authService';

// Dynamically import LeafletMap to avoid SSR/window undefined issues
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false });

export default function AddLocationPage() {
  const router = useRouter();
  const selectedProduction = useProductionStore((state) => state.selectedProduction);

  // Form State
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locDescription, setLocDescription] = useState('');
  const [locLat, setLocLat] = useState<number | undefined>(34.1478); // default to Burbank coords
  const [locLng, setLocLng] = useState<number | undefined>(-118.3531);
  const [locContact, setLocContact] = useState('');
  const [locImage, setLocImage] = useState('');

  // UI / Logic States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // OSM Search Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Debounced address search using OpenStreetMap Nominatim API
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

  const triggerSearchAddress = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Tendagon-Film-Production-Management/1.0',
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        handleSelectSuggestion(data[0]);
      } else {
        setError('No locations found matching that query.');
      }
    } catch (err) {
      console.error('Address query error:', err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const formatError = (err: any, defaultMsg: string): string => {
    if (err.response?.status === 403) {
      return "You don't have permission to perform this action.";
    }
    const message = err.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message || err.message || defaultMsg;
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file exceeds the 5MB size limit.');
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const res = await authService.uploadOnboardingFile(file, 'location');
      setLocImage(res.fileUrl);
    } catch (err: any) {
      setError(formatError(err, 'Failed to upload location image.'));
    } finally {
      setIsUploading(false);
    }
  };

  // Clipboard Coordinates Copier
  const handleCopyCoords = () => {
    if (locLat !== undefined && locLng !== undefined) {
      navigator.clipboard.writeText(`${locLat}, ${locLng}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  // Locate Current Device Coords
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocLat(position.coords.latitude);
        setLocLng(position.coords.longitude);
        setLocAddress(`Coordinates: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        setError('Failed to retrieve current location.');
        console.error(err);
      }
    );
  };

  // Save/Submit Form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) {
      setError('Please select a project before creating a location.');
      return;
    }
    if (!locName.trim()) {
      setError('Location Name is required.');
      return;
    }
    if (!locAddress.trim()) {
      setError('Location Address is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await locationsService.createLocation(selectedProduction._id, {
        productionId: selectedProduction._id,
        name: locName,
        address: locAddress,
        description: locDescription,
        locationType: locType,
        contactInfo: locContact,
        imageUrl: locImage,
        latitude: locLat,
        longitude: locLng,
      });

      setSuccess('Physical location created successfully.');
      setTimeout(() => {
        router.push('/locations');
      }, 1000);
    } catch (err: any) {
      setError(formatError(err, 'Failed to create physical location.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGuard permission="locations.create">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumbs & Header Section */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Link href="/locations" className="hover:text-indigo-600 transition">Locations</Link>
            <ChevronRight size={10} className="text-slate-350" />
            <span className="text-slate-500">Add Location</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-800">Add New Location</h1>
              <p className="text-xs text-slate-450 mt-0.5">Add a physical location that can be used for your production</p>
            </div>
            
            <Link
              href="/locations"
              className="flex items-center gap-1.5 py-1.5 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer max-w-fit"
            >
              <ArrowLeft size={14} /> Back to Locations
            </Link>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3.5 text-xs font-bold leading-relaxed">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3.5 text-xs font-bold leading-relaxed">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-24">
          
          {/* Left Column: Form Details */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
              <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Location Information</h2>

              {/* Name & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Studio Lot 4"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location Type</label>
                  <select
                    value={locType}
                    onChange={(e) => setLocType(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 appearance-none cursor-pointer"
                  >
                    <option value="">Select type</option>
                    <option value="Studio">Studio</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Urban">Urban</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Address Autocomplete & Search */}
              <div className="space-y-1 relative">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Address *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Start typing address or search on map..."
                      value={searchQuery || locAddress}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setLocAddress(e.target.value);
                      }}
                      className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 pr-8"
                    />
                    {isSearchingAddress && (
                      <div className="absolute right-2.5 top-2.5">
                        <Loader2 className="animate-spin text-slate-400" size={14} />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={triggerSearchAddress}
                    className="py-2 px-4 bg-white border border-slate-250 text-indigo-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Search size={14} /> Search
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left p-2.5 hover:bg-slate-50 text-[11px] text-slate-600 font-medium block truncate"
                      >
                        {item.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Description</label>
                  <span className="text-[10px] font-bold text-slate-400">{locDescription.length}/500</span>
                </div>
                <textarea
                  placeholder="Describe the location, facilities, access, parking, etc..."
                  value={locDescription}
                  onChange={(e) => setLocDescription(e.target.value.slice(0, 500))}
                  rows={4}
                  maxLength={500}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
                />
              </div>

              {/* Latitude, Longitude, Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 34.1478"
                    value={locLat ?? ''}
                    onChange={(e) => setLocLat(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., -118.3531"
                    value={locLng ?? ''}
                    onChange={(e) => setLocLng(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Contact Info</label>
                  <input
                    type="text"
                    placeholder="e.g., +1 (818) 555-1234"
                    value={locContact}
                    onChange={(e) => setLocContact(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Image (Optional)</label>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <label className="flex-1 w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Drag and drop an image here, or <span className="text-indigo-600 underline">click to browse</span></span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">PNG, JPG up to 5MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  {locImage && (
                    <div className="relative w-full sm:w-36 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm group">
                      <img
                        src={locImage}
                        alt="Location Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setLocImage('')}
                        className="absolute top-1.5 right-1.5 bg-slate-900/60 hover:bg-red-600 text-white rounded-full p-1 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Interactive Map & Live Summary */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Map Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div>
                <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Select on Map</h2>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">Search for an address or click on the map to set the location.</p>
              </div>

              {/* Map embed */}
              <div className="h-[220px] rounded-xl overflow-hidden relative border border-slate-200">
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

              {/* Coordinates Preview */}
              <div className="bg-slate-50/50 border border-slate-150 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Selected Coordinates</span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Use Current Location
                  </button>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Latitude</span>
                      <span className="text-xs font-mono font-bold text-slate-800">{locLat ? locLat.toFixed(6) : 'Not Pinning'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Longitude</span>
                      <span className="text-xs font-mono font-bold text-slate-800">{locLng ? locLng.toFixed(6) : 'Not Pinning'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCoords}
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition"
                    title="Copy coordinates"
                  >
                    {copiedCoords ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Location Summary</h2>
              
              <div className="divide-y divide-slate-100 text-xs">
                
                {/* Name */}
                <div className="flex justify-between py-2.5 items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Film size={14} />
                    <span>Location Name</span>
                  </div>
                  <span className={`font-bold text-right break-all max-w-[180px] ${locName ? 'text-slate-850' : 'text-slate-400'}`}>
                    {locName || 'Not set'}
                  </span>
                </div>

                {/* Address */}
                <div className="flex justify-between py-2.5 items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <MapPin size={14} />
                    <span>Address</span>
                  </div>
                  <span className={`font-bold text-right truncate max-w-[180px] ${locAddress ? 'text-slate-850' : 'text-slate-400'}`} title={locAddress}>
                    {locAddress || 'Not set'}
                  </span>
                </div>

                {/* Type */}
                <div className="flex justify-between py-2.5 items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Building size={14} />
                    <span>Type</span>
                  </div>
                  <span className={`font-bold text-right ${locType ? 'text-slate-850' : 'text-slate-400'}`}>
                    {locType || 'Not set'}
                  </span>
                </div>

                {/* Coordinates */}
                <div className="flex justify-between py-2.5 items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Globe size={14} />
                    <span>Coordinates</span>
                  </div>
                  <span className={`font-bold font-mono text-right ${locLat && locLng ? 'text-slate-850' : 'text-slate-400'}`}>
                    {locLat && locLng ? `${locLat.toFixed(4)}, ${locLng.toFixed(4)}` : 'Not set'}
                  </span>
                </div>

                {/* Contact Info */}
                <div className="flex justify-between py-2.5 items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Phone size={14} />
                    <span>Contact Info</span>
                  </div>
                  <span className={`font-bold text-right break-all max-w-[180px] ${locContact ? 'text-slate-850' : 'text-slate-400'}`}>
                    {locContact || 'Not set'}
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Actions Row */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-40 shadow-lg md:left-64">
            <Link
              href="/locations"
              className="py-2 px-5 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer shadow-3xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Saving...
                </>
              ) : (
                <>
                  <Save size={14} /> Save Location
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </PermissionGuard>
  );
}
