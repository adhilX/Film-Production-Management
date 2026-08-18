import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { locationService } from '../services/location.service';
import { formatError } from '@/utils/format-error';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import type { Location, LocationBooking } from '@/app/types';

export function useLocations() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const selectedProduction = useProductionStore((state) => state.selectedProduction);

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
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // UI state filters & viewmodes
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('All');
  const [listSearch, setListSearch] = useState('');

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

  const fetchData = async () => {
    if (!selectedProduction) return;
    try {
      setLoading(true);
      const [locsData, bookingsData] = await Promise.all([
        locationService.getLocations(selectedProduction._id),
        locationService.getBookings(selectedProduction._id),
      ]);
      setLocations(locsData);
      setBookings(bookingsData);
      if (locsData.length > 0 && !selectedLocation) {
        setSelectedLocation(locsData[0]);
      }
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to load locations data.');
      setError(errMsg);
      toast.error(errMsg);
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

  const handleDeleteLocation = async (locId: string, name: string) => {
    if (!selectedProduction) return;
    if (!confirm(`Are you sure you want to delete the location "${name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await locationService.deleteLocation(selectedProduction._id, locId);
      setSuccess(`Physical location "${name}" deleted successfully.`);
      toast.success(`Location "${name}" deleted.`);
      if (selectedLocation?._id === locId) {
        setSelectedLocation(null);
      }
      fetchData();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to delete location.');
      setError(errMsg);
      toast.error(errMsg);
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

      await locationService.createBooking(selectedProduction._id, {
        locationId: bookingLocationId,
        startDate: bookingStart,
        endDate: bookingEnd,
      });

      setSuccess('Location booking request submitted successfully.');
      toast.success('Booking request submitted.');
      setIsAddBookingOpen(false);
      resetBookingForm();
      fetchData();
      setActiveTab('bookings');
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to submit booking request.');
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string, reason?: string) => {
    if (!selectedProduction) return;
    setError('');
    setSuccess('');
    try {
      await locationService.updateBookingStatus(selectedProduction._id, bookingId, {
        status,
        rejectionReason: reason,
      });
      setSuccess(`Booking status successfully transitioned to "${status}".`);
      toast.success(`Booking ${status.toLowerCase()}.`);
      fetchData();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to update booking status.');
      setError(errMsg);
      toast.error(errMsg);
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
        await locationService.createLocation(selectedProduction._id, {
          ...loc,
          productionId: selectedProduction._id,
        });
      }
      setSuccess('Successfully imported 6 demo locations.');
      toast.success('Demo locations imported.');
      setIsImportOpen(false);
      fetchData();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to import locations.');
      setError(errMsg);
      toast.error(errMsg);
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

  const resetBookingForm = () => {
    setBookingLocationId('');
    setBookingStart('');
    setBookingEnd('');
  };

  const canCancelBooking = (booking: LocationBooking) => {
    if (!user || !selectedProduction) return false;
    const isRequester = booking.requestedBy?._id === user.id;
    const isManager = selectedProduction.productionManager === user.id || 
                      (typeof selectedProduction.productionManager === 'object' && selectedProduction.productionManager?._id === user.id);
    const hasApprovePerm = hasPermission(PERMISSIONS.LOCATIONS_APPROVE);
    const isSuperAdmin = hasPermission(PERMISSIONS.ROLES_MANAGE);
    return isRequester || isManager || hasApprovePerm || isSuperAdmin;
  };

  // Filter based on search and type
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(listSearch.toLowerCase()) ||
                          loc.address.toLowerCase().includes(listSearch.toLowerCase());
    const matchesType = filterType === 'All' || !filterType || (loc.locationType && loc.locationType.toLowerCase() === filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  return {
    user,
    selectedProduction,
    locations,
    bookings,
    loading,
    error,
    setError,
    success,
    setSuccess,
    activeTab,
    setActiveTab,
    selectedLocation,
    setSelectedLocation,
    isAddBookingOpen,
    setIsAddBookingOpen,
    isRejectOpen,
    setIsRejectOpen,
    isImportOpen,
    setIsImportOpen,
    viewMode,
    setViewMode,
    filterType,
    setFilterType,
    listSearch,
    setListSearch,
    bookingLocationId,
    setBookingLocationId,
    bookingStart,
    setBookingStart,
    bookingEnd,
    setBookingEnd,
    rejectingBookingId,
    rejectionReason,
    setRejectionReason,
    searchQuery,
    setSearchQuery,
    suggestions,
    isSearchingAddress,
    fetchData,
    handleDeleteLocation,
    handleRequestBooking,
    handleUpdateBookingStatus,
    handleOpenReject,
    handleConfirmReject,
    handleImportLocations,
    getFallbackImage,
    getLocationStatus,
    getBookingSummary,
    resetBookingForm,
    canCancelBooking,
    filteredLocations,
  };
}

export default useLocations;
