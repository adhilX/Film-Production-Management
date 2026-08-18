'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  Check,
  Calendar,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Building,
  Phone,
  Info,
  User,
  Clock,
  XCircle,
  X,
  Map as MapIcon,
  ChevronRight,
  Filter,
  Grid,
  List,
  MoreVertical,
  Upload,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { useRouter } from 'next/navigation';
import { PermissionGuard } from '@/app/components/permission-guard';
import locationsService from '@/services/locationsService';
import type { Location, LocationBooking } from '@/app/types';

// Load Leaflet Map only on client-side (avoids SSR errors with 'window' object)
const LeafletMap = dynamic(() => import('../LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center flex-col gap-2">
      <Loader2 className="animate-spin text-indigo-600" size={24} />
      <span className="text-xs text-slate-400 font-medium">Loading interactive map...</span>
    </div>
  ),
});

export default function LocationsModule() {
  const router = useRouter();
  const { user } = useAuthStore();
  const selectedProduction = useProductionStore((state) => state.selectedProduction);

  const hasPermission = (perm: string): boolean => {
    return user?.permissions?.includes(perm) || false;
  };

  const formatError = (err: any, defaultMsg: string): string => {
    if (err.response?.status === 403) {
      return "You don't have permission to perform this action.";
    }
    return err.response?.data?.message || err.message || defaultMsg;
  };

  // Lists & Loading
  const [locations, setLocations] = useState<Location[]>([]);
  const [bookings, setBookings] = useState<LocationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tabs: 'locations' | 'bookings'
  const [activeTab, setActiveTab] = useState<'locations' | 'bookings'>('locations');

  // Selected Physical Location for centering on Map
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Form Modals states
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // UI state filters & viewmodes
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState('');

  // Form payloads - Location
  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locDescription, setLocDescription] = useState('');
  const [locType, setLocType] = useState('');
  const [locContact, setLocContact] = useState('');
  const [locImage, setLocImage] = useState('');
  const [locLat, setLocLat] = useState<number | undefined>(undefined);
  const [locLng, setLocLng] = useState<number | undefined>(undefined);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);

  // Form payloads - Booking
  const [bookingLocationId, setBookingLocationId] = useState('');
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');

  // Rejection logic
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Nominatim debounced Search
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Clear state when project switches
  useEffect(() => {
    setLocations([]);
    setBookings([]);
    setSelectedLocation(null);
    setLoading(true);
    setError('');
    setSuccess('');
    if (selectedProduction) {
      fetchData();
    }
  }, [selectedProduction]);

  // Close dropdown context menu when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const fetchData = async () => {
    if (!selectedProduction) return;
    try {
      setLoading(true);
      const [locsData, bookingsData] = await Promise.all([
        locationsService.getLocations(selectedProduction._id),
        locationsService.getBookings(selectedProduction._id),
      ]);
      setLocations(locsData);
      setBookings(bookingsData);
      if (locsData.length > 0 && !selectedLocation) {
        setSelectedLocation(locsData[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load locations data.');
    } finally {
      setLoading(false);
    }
  };

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


  const handleOpenEdit = (loc: Location) => {
    setEditingLocationId(loc._id);
    setLocName(loc.name);
    setLocAddress(loc.address);
    setLocDescription(loc.description || '');
    setLocType(loc.locationType || '');
    setLocContact(loc.contactInfo || '');
    setLocImage(loc.imageUrl || '');
    setLocLat(loc.latitude);
    setLocLng(loc.longitude);
    setIsEditLocationOpen(true);
  };

  const handleEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction || !editingLocationId) return;
    setError('');
    setSuccess('');
    try {
      await locationsService.updateLocation(selectedProduction._id, editingLocationId, {
        name: locName,
        address: locAddress,
        description: locDescription,
        locationType: locType,
        contactInfo: locContact,
        imageUrl: locImage,
        latitude: locLat,
        longitude: locLng,
      });
      setSuccess(`Physical location "${locName}" updated successfully.`);
      setIsEditLocationOpen(false);
      resetLocForm();
      fetchData();
    } catch (err: any) {
      setError(formatError(err, 'Failed to update physical location.'));
    }
  };

  const handleDeleteLocation = async (locId: string, name: string) => {
    if (!selectedProduction) return;
    if (!confirm(`Are you sure you want to delete the location "${name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await locationsService.deleteLocation(selectedProduction._id, locId);
      setSuccess(`Physical location "${name}" deleted successfully.`);
      if (selectedLocation?._id === locId) {
        setSelectedLocation(null);
      }
      fetchData();
    } catch (err: any) {
      setError(formatError(err, 'Failed to delete location.'));
    }
  };

  // Bookings submissions
  const handleRequestBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    setError('');
    setSuccess('');
    try {
      const start = new Date(bookingStart);
      const end = new Date(bookingEnd);
      if (start >= end) {
        setError('Start date must be before end date.');
        return;
      }

      await locationsService.createBooking(selectedProduction._id, {
        locationId: bookingLocationId,
        startDate: bookingStart,
        endDate: bookingEnd,
      });

      setSuccess('Location booking request submitted successfully.');
      setIsAddBookingOpen(false);
      resetBookingForm();
      fetchData();
      setActiveTab('bookings');
    } catch (err: any) {
      setError(formatError(err, 'Failed to submit booking request.'));
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string, reason?: string) => {
    if (!selectedProduction) return;
    setError('');
    setSuccess('');
    try {
      await locationsService.updateBookingStatus(selectedProduction._id, bookingId, {
        status,
        rejectionReason: reason,
      });
      setSuccess(`Booking status successfully transitioned to "${status}".`);
      fetchData();
    } catch (err: any) {
      setError(formatError(err, 'Failed to update booking status.'));
    }
  };

  const handleOpenReject = (bookingId: string) => {
    setRejectingBookingId(bookingId);
    setRejectionReason('');
    setIsRejectOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBookingId) return;
    setIsRejectOpen(false);
    await handleUpdateBookingStatus(rejectingBookingId, 'Rejected', rejectionReason);
    setRejectingBookingId(null);
  };

  const handleImportLocations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    try {
      const mockLocations = [
        {
          name: 'Studio Lot 4',
          locationType: 'Studio',
          address: '1234 W Alameda Ave, Burbank, CA 91505',
          description: 'Main indoor shooting stage with 20,000 sq ft of flexible space, soundproof walls and advanced lighting grid.',
          latitude: 34.1478,
          longitude: -118.3531,
          contactInfo: 'Manager: Jane Doe, 555-0199',
          imageUrl: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Forest Location',
          locationType: 'Outdoor',
          address: 'Sequoia National Park, CA',
          description: 'Dense redwood forest location with majestic scenery, perfect for adventure and outdoor sequences.',
          latitude: 36.4864,
          longitude: -118.5658,
          contactInfo: 'Ranger Office, 555-0210',
          imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Downtown Street',
          locationType: 'Urban',
          address: 'Downtown LA, Los Angeles, CA',
          description: 'Wide boulevard with modern skyscrapers and high foot traffic. Available for weekend filming.',
          latitude: 34.0407,
          longitude: -118.2468,
          contactInfo: 'LA Film Commission, 555-0320',
          imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Malibu Beach',
          locationType: 'Outdoor',
          address: 'Malibu, California',
          description: 'Scenic sandy beach coastline with cliffs and open ocean horizon views. Excellent for sunset shots.',
          latitude: 34.0259,
          longitude: -118.7798,
          contactInfo: 'State Park Service, 555-0450',
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Desert Location',
          locationType: 'Outdoor',
          address: 'Mojave Desert, California',
          description: 'Vast barren desert landscape with sand dunes and dry shrub vegetation. Perfect for post-apocalyptic settings.',
          latitude: 35.0110,
          longitude: -115.4734,
          contactInfo: 'Mojave Office, 555-0550',
          imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Stage B',
          locationType: 'Studio',
          address: 'Studio Center Drive, Burbank, CA',
          description: 'Medium shooting facility with green screen cyc wall, dedicated dressing rooms, and sound baffling.',
          latitude: 34.1500,
          longitude: -118.3600,
          contactInfo: 'Burbank Studio Rentals, 555-0670',
          imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
        }
      ];
      for (const loc of mockLocations) {
        await locationsService.createLocation(selectedProduction._id, {
          ...loc,
          productionId: selectedProduction._id,
        });
      }
      setSuccess('Successfully imported 6 demo locations.');
      setIsImportOpen(false);
      fetchData();
    } catch (err: any) {
      setError(formatError(err, 'Failed to import locations.'));
    }
  };

  const getFallbackImage = (name: string, type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('studio') || name.toLowerCase().includes('studio')) {
      return 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?auto=format&fit=crop&w=600&q=80';
    }
    if (t.includes('outdoor') || t.includes('beach') || name.toLowerCase().includes('beach') || name.toLowerCase().includes('forest')) {
      return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80';
    }
    if (t.includes('urban') || t.includes('street') || name.toLowerCase().includes('street') || name.toLowerCase().includes('downtown')) {
      return 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80';
  };

  const getLocationStatus = (locId: string) => {
    const now = new Date();
    const locBookings = bookings.filter(b => {
      const id = typeof b.locationId === 'object' ? b.locationId?._id : b.locationId;
      return id === locId;
    });
    const hasApprovedToday = locBookings.some(b => b.status === 'Approved' && new Date(b.startDate) <= now && new Date(b.endDate) >= now);
    if (hasApprovedToday) return 'Booked';
    
    const hasPending = locBookings.some(b => b.status === 'Pending');
    if (hasPending) return 'Pending';
    
    return 'Available';
  };

  const getBookingSummary = (locId: string) => {
    const locBookings = bookings.filter(b => {
      const id = typeof b.locationId === 'object' ? b.locationId?._id : b.locationId;
      return id === locId;
    });
    const pendingCount = locBookings.filter(b => b.status === 'Pending').length;
    const approvedCount = locBookings.filter(b => b.status === 'Approved').length;
    if (pendingCount > 0) {
      return `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}`;
    }
    if (approvedCount > 0) {
      return `${approvedCount} upcoming booking${approvedCount > 1 ? 's' : ''}`;
    }
    return 'No upcoming bookings';
  };

  const resetLocForm = () => {
    setLocName('');
    setLocAddress('');
    setLocDescription('');
    setLocType('');
    setLocContact('');
    setLocImage('');
    setLocLat(undefined);
    setLocLng(undefined);
    setEditingLocationId(null);
    setSearchQuery('');
    setSuggestions([]);
  };

  const resetBookingForm = () => {
    setBookingLocationId('');
    setBookingStart('');
    setBookingEnd('');
  };

  // Dynamic real-time metrics calculations
  const totalLocations = locations.length;
  const activeBookings = bookings.filter((b) => b.status === 'Approved').length;
  const pendingRequests = bookings.filter((b) => b.status === 'Pending').length;

  if (!selectedProduction) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-sm font-semibold text-slate-400">Please select a project to manage locations.</span>
      </div>
    );
  }

  // Check if logged-in user can cancel booking
  const canCancelBooking = (booking: LocationBooking) => {
    if (!user) return false;
    const isRequester = booking.requestedBy?._id === user.id;
    const isManager = selectedProduction.productionManager === user.id || 
                      (typeof selectedProduction.productionManager === 'object' && selectedProduction.productionManager?._id === user.id);
    const hasApprovePerm = user.permissions?.includes('locations.approve');
    const isSuperAdmin = user.permissions?.includes('roles.manage');
    return isRequester || isManager || hasApprovePerm || isSuperAdmin;
  };

  const currentlyBookedCount = locations.filter(loc =>
    bookings.some(b => {
      const id = typeof b.locationId === 'object' ? b.locationId?._id : b.locationId;
      const now = new Date();
      return id === loc._id && b.status === 'Approved' && new Date(b.startDate) <= now && new Date(b.endDate) >= now;
    })
  ).length;
  const availableLocations = totalLocations - currentlyBookedCount;
  const approvedBookingsCount = bookings.filter((b) => b.status === 'Approved').length;

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(listSearch.toLowerCase()) ||
                          loc.address.toLowerCase().includes(listSearch.toLowerCase());
    const matchesType = filterType === 'All' || !filterType || (loc.locationType && loc.locationType.toLowerCase() === filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Alert Notices */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold leading-relaxed flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="hover:text-red-900"><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="hover:text-emerald-900"><X size={14} /></button>
        </div>
      )}

      {/* Header View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Locations</h1>
          <p className="text-xs text-slate-450 mt-1 font-medium">Manage all production locations and booking requests</p>
        </div>
        <div className="flex items-center gap-2.5">
          <PermissionGuard permission="locations.create">
            <button
              onClick={() => setIsImportOpen(true)}
              className="py-1.5 px-3.5 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload size={14} className="text-slate-450" /> Import Locations
            </button>
          </PermissionGuard>

          <PermissionGuard permission="locations.create">
            <button
              onClick={() => router.push('/locations/add')}
              className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Add Location
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 pb-px gap-4">
        <button
          onClick={() => setActiveTab('locations')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'locations'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-750'
          }`}
        >
          Locations
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'bookings'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-450 hover:text-slate-750'
          }`}
        >
          Booking Requests
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <MapPin size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Locations</span>
            <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{totalLocations}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All locations added</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
            <Check size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Available</span>
            <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{availableLocations}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">No conflicts</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Booked</span>
            <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{approvedBookingsCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Approved bookings</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-orange-50 border border-orange-100 text-orange-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Pending Requests</span>
            <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{pendingRequests}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Awaiting approval</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      {activeTab === 'locations' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 p-4 border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search locations by name or address..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 shadow-xs"
              />
              <div className="absolute left-3 top-2.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-700 font-medium cursor-pointer shadow-xs"
            >
              <option value="All">All Types</option>
              <option value="Studio">Studio</option>
              <option value="Outdoor">Outdoor</option>
              <option value="Urban">Urban</option>
            </select>

            <button className="py-2 px-3.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-750 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs">
              <Filter size={14} className="text-slate-450" /> Filters
            </button>
          </div>

          <div className="flex items-center gap-1 border border-slate-250 rounded-xl p-1 bg-white shadow-xs shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Areas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={30} />
          <span className="text-xs text-slate-400 font-medium">Fetching locations data...</span>
        </div>
      ) : activeTab === 'locations' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Physical Locations List (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {filteredLocations.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredLocations.map((loc) => {
                    const status = getLocationStatus(loc._id);
                    const statusColors: Record<string, string> = {
                      Available: 'bg-emerald-500 text-white',
                      Pending: 'bg-orange-500 text-white',
                      Booked: 'bg-blue-600 text-white',
                    };
                    const typeBadgeColors: Record<string, string> = {
                      studio: 'bg-purple-50 text-purple-750 border border-purple-100',
                      outdoor: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                      urban: 'bg-blue-50 text-blue-700 border border-blue-100',
                    };
                    const typeNormalized = (loc.locationType || '').toLowerCase();
                    const typeStyle = typeBadgeColors[typeNormalized] || 'bg-slate-50 text-slate-600 border border-slate-200';
                    const fallbackImg = getFallbackImage(loc.name, loc.locationType);

                    return (
                      <div
                        key={loc._id}
                        onClick={() => setSelectedLocation(loc)}
                        className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col relative group ${
                          selectedLocation?._id === loc._id
                            ? 'border-indigo-600 ring-2 ring-indigo-50/70'
                            : 'border-slate-200 hover:border-slate-350'
                        }`}
                      >
                        {/* Image section with overlay status */}
                        <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                          <img
                            src={loc.imageUrl || fallbackImg}
                            alt={loc.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                          />
                          <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider ${statusColors[status] || 'bg-slate-500 text-white'}`}>
                            {status}
                          </span>
                        </div>

                        {/* Content section */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex justify-between items-start gap-2 relative">
                              <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{loc.name}</h3>
                              
                              {/* Context Actions Dropdown menu */}
                              {(hasPermission('locations.update') || hasPermission('locations.delete')) && (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === loc._id ? null : loc._id);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-700 transition"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  {activeMenuId === loc._id && (
                                    <div className="absolute right-0 top-7 z-20 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 divide-y divide-slate-50">
                                      {hasPermission('locations.update') && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(null);
                                            handleOpenEdit(loc);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
                                        >
                                          <Edit2 size={12} /> Edit
                                        </button>
                                      )}
                                      {hasPermission('locations.delete') && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(null);
                                            handleDeleteLocation(loc._id, loc.name);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition flex items-center gap-1.5"
                                        >
                                          <Trash2 size={12} /> Delete
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className={`py-0.5 px-2 rounded text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}>
                                {loc.locationType || 'Physical'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2.5">
                              <MapPin size={13} className="text-slate-350 shrink-0" />
                              <span className="truncate leading-relaxed">{loc.address}</span>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-450">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar size={12} className="text-slate-400" />
                              {getBookingSummary(loc._id)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-150">
                  {filteredLocations.map((loc) => {
                    const status = getLocationStatus(loc._id);
                    const statusColors = {
                      Available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      Pending: 'bg-orange-50 text-orange-700 border-orange-100',
                      Booked: 'bg-blue-50 text-blue-700 border-blue-100',
                    };
                    const fallbackImg = getFallbackImage(loc.name, loc.locationType);
                    return (
                      <div
                        key={loc._id}
                        onClick={() => setSelectedLocation(loc)}
                        className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/40 transition ${
                          selectedLocation?._id === loc._id ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={loc.imageUrl || fallbackImg}
                            alt={loc.name}
                            className="w-12 h-12 object-cover rounded-lg shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 text-sm block truncate">{loc.name}</span>
                            <span className="text-xs text-slate-400 truncate block mt-0.5">{loc.address}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg ${statusColors[status] || 'bg-slate-50 text-slate-600'}`}>
                            {status}
                          </span>
                          {(hasPermission('locations.update') || hasPermission('locations.delete')) && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === loc._id ? null : loc._id);
                                }}
                                className="p-1 hover:bg-slate-100 rounded-lg text-slate-450 transition"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeMenuId === loc._id && (
                                <div className="absolute right-0 top-7 z-20 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 divide-y divide-slate-50">
                                  {hasPermission('locations.update') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(null);
                                        handleOpenEdit(loc);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
                                    >
                                      <Edit2 size={12} /> Edit
                                    </button>
                                  )}
                                  {hasPermission('locations.delete') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(null);
                                        handleDeleteLocation(loc._id, loc.name);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition flex items-center gap-1.5"
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-xs text-slate-400 text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs font-medium">
                No physical locations found matching your search.
              </div>
            )}
          </div>

          {/* Interactive Map & Details Sidebar (1/3 width) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-max">
            {/* Leaflet Map Visualizer */}
            <div className="h-[220px] w-full relative border-b border-slate-200">
              <LeafletMap
                locations={locations}
                selectedLocation={selectedLocation}
                onSelectLocation={(id) => {
                  const target = locations.find((l) => l._id === id);
                  if (target) setSelectedLocation(target);
                }}
              />
            </div>

            {/* Selected Location Details Card */}
            {selectedLocation ? (
              <div className="p-5 space-y-4 relative flex-1">
                {/* Close/Deselect button */}
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
                >
                  <X size={16} />
                </button>

                {/* Details Header Row */}
                <div className="flex gap-3 pr-6">
                  <img
                    src={selectedLocation.imageUrl || getFallbackImage(selectedLocation.name, selectedLocation.locationType)}
                    alt={selectedLocation.name}
                    className="w-16 h-16 object-cover rounded-xl shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{selectedLocation.name}</h4>
                    <span className="py-0.5 px-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-bold uppercase tracking-wider block w-max my-1">
                      {selectedLocation.locationType || 'Physical'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin size={10} className="shrink-0" />
                      <span className="line-clamp-1">{selectedLocation.address}</span>
                    </div>
                    {selectedLocation.latitude && selectedLocation.longitude && (
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {selectedLocation.latitude.toFixed(4)}° N, {Math.abs(selectedLocation.longitude).toFixed(4)}° W
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedLocation.description && (
                  <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                    {selectedLocation.description}
                  </p>
                )}

                {/* Upcoming Bookings */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Upcoming Bookings</span>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      View All <ExternalLink size={10} />
                    </button>
                  </div>

                  {bookings.filter(b => (typeof b.locationId === 'object' ? b.locationId?._id : b.locationId) === selectedLocation._id).length > 0 ? (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {bookings
                        .filter(b => (typeof b.locationId === 'object' ? b.locationId?._id : b.locationId) === selectedLocation._id)
                        .map((b) => {
                          const startDateObj = new Date(b.startDate);
                          const month = startDateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                          const day = startDateObj.getDate();
                          const startStr = startDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                          const endStr = new Date(b.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                          
                          const statusColors = {
                            Approved: 'bg-blue-50 border-blue-150 text-blue-700',
                            Pending: 'bg-orange-50 border-orange-150 text-orange-700',
                            Rejected: 'bg-red-50 border-red-150 text-red-700',
                            Cancelled: 'bg-slate-50 border-slate-200 text-slate-500',
                          };

                          return (
                            <div key={b._id} className="flex items-center justify-between gap-3 p-2 bg-slate-50/50 border border-slate-150 rounded-xl hover:bg-slate-50 transition">
                              <div className="flex items-center gap-2.5">
                                {/* Date Block */}
                                <div className="flex flex-col items-center justify-center shrink-0 w-10 h-10 bg-white border border-slate-200 rounded-lg">
                                  <span className="text-[8px] font-bold text-indigo-600 tracking-wider leading-none">{month}</span>
                                  <span className="text-sm font-extrabold text-slate-800 leading-none mt-0.5">{day}</span>
                                </div>

                                <div>
                                  <span className="text-[11px] font-bold text-slate-700 block">{startStr} — {endStr}</span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5">Requested by {b.requestedBy?.name || 'Migration Fallback'}</span>
                                </div>
                              </div>

                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 border rounded-lg ${statusColors[b.status] || 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                {b.status}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 block italic py-1">No upcoming bookings scheduled</span>
                  )}
                </div>

                {/* Book This Location Button */}
                <PermissionGuard permission="locations.book">
                  <button
                    onClick={() => {
                      resetBookingForm();
                      setBookingLocationId(selectedLocation._id);
                      setIsAddBookingOpen(true);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-4"
                  >
                    <Calendar size={14} /> Book This Location
                  </button>
                </PermissionGuard>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                Select a physical location card to view schedule details.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Booking Requests Tab View */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-150">
                  <th className="p-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location</th>
                  <th className="p-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider">Scheduled Dates</th>
                  <th className="p-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider">Requested By</th>
                  <th className="p-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider">Details</th>
                  <th className="p-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {bookings.length > 0 ? (
                  bookings.map((booking) => {
                    const startStr = new Date(booking.startDate).toLocaleDateString();
                    const endStr = new Date(booking.endDate).toLocaleDateString();
                    
                    // Collision check on frontend for visual alert warnings
                    const isOverlapping = bookings.some(
                      (other) =>
                        other._id !== booking._id &&
                        other.locationId?._id === booking.locationId?._id &&
                        other.status === 'Approved' &&
                        new Date(other.startDate) < new Date(booking.endDate) &&
                        new Date(other.endDate) > new Date(booking.startDate)
                    );

                    return (
                      <tr key={booking._id} className="hover:bg-slate-50/30 transition">
                        <td className="p-4">
                          <span className="font-bold text-slate-700 block">{booking.locationId?.name || 'Deleted Location'}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{booking.locationId?.address}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-650 flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {startStr} — {endStr}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-600 block">{booking.requestedBy?.name || 'Migration Fallback'}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{booking.requestedBy?.email}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`py-0.5 px-2 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                                booking.status === 'Approved'
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                  : booking.status === 'Pending'
                                  ? 'bg-amber-50 border-amber-100 text-amber-700'
                                  : booking.status === 'Rejected'
                                  ? 'bg-red-50 border-red-100 text-red-700'
                                  : 'bg-slate-100 border-slate-200 text-slate-500'
                              }`}
                            >
                              {booking.status}
                            </span>
                            {isOverlapping && booking.status !== 'Approved' && (
                              <div className="flex items-center gap-1 py-0.5 px-1.5 bg-amber-50 border border-amber-150 text-amber-700 rounded-lg text-[9px] font-bold" title="Overlaps with an approved booking">
                                <AlertTriangle size={10} /> Collision Warn
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 max-w-[200px]">
                          {booking.status === 'Rejected' && booking.rejectionReason && (
                            <span className="text-[10px] text-slate-400 leading-normal block">
                              Reason: &quot;{booking.rejectionReason}&quot;
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {booking.status === 'Pending' && (
                              <PermissionGuard permission="locations.approve">
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking._id, 'Approved')}
                                  className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[10px] cursor-pointer transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleOpenReject(booking._id)}
                                  className="py-1 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg text-[10px] cursor-pointer transition"
                                >
                                  Reject
                                </button>
                              </PermissionGuard>
                            )}

                            {(booking.status === 'Approved' || booking.status === 'Pending') && canCancelBooking(booking) && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking._id, 'Cancelled')}
                                className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-600 font-bold rounded-lg text-[10px] cursor-pointer transition"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-slate-400 text-center font-medium">
                      No location bookings found for this project schedule.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Modal - Edit Physical Location */}
      {isEditLocationOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
              <span className="text-sm font-extrabold text-slate-800">Edit Physical Location</span>
              <button onClick={() => setIsEditLocationOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditLocation} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sound Stage A"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Location Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Studio, Desert, Mansion"
                    value={locType}
                    onChange={(e) => setLocType(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
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
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 pr-8"
                  />
                  {isSearchingAddress && (
                    <div className="absolute right-2.5 top-2.5">
                      <Loader2 className="animate-spin text-slate-400" size={14} />
                    </div>
                  )}
                </div>

                {suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left p-2.5 hover:bg-slate-50 text-[11px] text-slate-650 font-medium block truncate"
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
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Auto-filled via map or search"
                    value={locLat ?? ''}
                    onChange={(e) => setLocLat(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Auto-filled via map or search"
                    value={locLng ?? ''}
                    onChange={(e) => setLocLng(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-500"
                  />
                </div>
              </div>

              {/* Pin Map inside Edit Modal */}
              <div className="h-[180px] rounded-xl overflow-hidden relative border border-slate-200">
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
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Contact Info</label>
                  <input
                    type="text"
                    placeholder="Manager contact, phone, notes"
                    value={locContact}
                    onChange={(e) => setLocContact(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={locImage}
                    onChange={(e) => setLocImage(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Additional physical description..."
                  value={locDescription}
                  onChange={(e) => setLocDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditLocationOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
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
      )}

      {/* Modal - Request Location Booking */}
      {isAddBookingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
              <span className="text-sm font-extrabold text-slate-800">Submit Booking Request</span>
              <button onClick={() => setIsAddBookingOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestBooking} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Select Location *</label>
                <select
                  value={bookingLocationId}
                  onChange={(e) => setBookingLocationId(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer"
                >
                  {locations.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.address})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={bookingStart}
                  onChange={(e) => setBookingStart(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={bookingEnd}
                  onChange={(e) => setBookingEnd(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddBookingOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Rejection Reason */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
              <span className="text-sm font-extrabold text-slate-800">Reject Booking Request</span>
              <button onClick={() => setIsRejectOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Reason for Rejection (Optional)</label>
                <textarea
                  placeholder="Provide a reason for rejecting this booking request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRejectOpen(false);
                    setRejectingBookingId(null);
                  }}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal - Import Locations */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Upload size={16} className="text-indigo-600" /> Import Production Locations
              </span>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleImportLocations} className="p-6 space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                <Upload size={32} className="text-slate-350" />
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Select CSV or JSON file</span>
                  <span className="text-[10px] text-slate-450 mt-1 block">Max file size: 5MB</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                <span className="text-[10px] text-slate-450 leading-relaxed block">
                  Clicking &quot;Simulate Import&quot; will automatically load 6 high-quality movie production locations (Studio Lot 4, Forest Location, Downtown Street, Malibu Beach, Desert Location, Stage B) into your database.
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Simulate Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
