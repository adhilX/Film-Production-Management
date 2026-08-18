'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  Calendar,
  MapPin,
  Plus,
  Loader2,
  X,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { PermissionGuard } from '@/app/components/permission-guard';

// Hook & Subcomponents
import { useLocations } from '@/features/locations/hooks/useLocations';
import { LocationsStats } from '@/features/locations/components/LocationsStats';
import { LocationsFilters } from '@/features/locations/components/LocationsFilters';
import { LocationsGrid } from '@/features/locations/components/LocationsGrid';
import { LocationsTable } from '@/features/locations/components/LocationsTable';
import { LocationsBookingsTable } from '@/features/locations/components/LocationsBookingsTable';
import { LocationAddBookingModal } from '@/features/locations/components/LocationAddBookingModal';
import { LocationRejectModal } from '@/features/locations/components/LocationRejectModal';
import { LocationImportModal } from '@/features/locations/components/LocationImportModal';
import { LocationEditModal } from '@/features/locations/components/LocationEditModal';
import type { Location } from '@/app/types';

// Load Leaflet Map only on client-side
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
  const {
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
    rejectionReason,
    setRejectionReason,
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
  } = useLocations();

  // Selected location for editing
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);

  const hasPermission = (perm: string): boolean => {
    return user?.permissions?.includes(perm) || false;
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLocation(loc);
    setIsEditLocationOpen(true);
  };

  if (!selectedProduction) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-sm font-semibold text-slate-400">Please select a project to manage locations.</span>
      </div>
    );
  }

  // Dynamic real-time metrics calculations
  const totalLocations = locations.length;
  const currentlyBookedCount = locations.filter(loc =>
    bookings.some(b => {
      const id = typeof b.locationId === 'object' ? b.locationId?._id : b.locationId;
      const now = new Date();
      return id === loc._id && b.status === 'Approved' && new Date(b.startDate) <= now && new Date(b.endDate) >= now;
    })
  ).length;
  const availableLocations = totalLocations - currentlyBookedCount;
  const approvedBookingsCount = bookings.filter((b) => b.status === 'Approved').length;
  const pendingRequests = bookings.filter((b) => b.status === 'Pending').length;

  return (
    <div className="w-full px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Alert Notices */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold leading-relaxed flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="hover:text-red-900 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="hover:text-emerald-900 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* Navigation Tabs & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-px">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('locations')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'locations'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-450 hover:text-slate-750'
            }`}
          >
            Locations
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition -mb-px cursor-pointer ${
              activeTab === 'bookings'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-450 hover:text-slate-750'
            }`}
          >
            Booking Requests
          </button>
        </div>

        <div className="flex items-center gap-2.5 pb-2 sm:pb-0">
          <PermissionGuard permission="locations.create">
            <button
              onClick={() => setIsImportOpen(true)}
              className="py-1.5 px-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload size={14} className="text-slate-455" /> Import Locations
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

      {/* Metrics Cards */}
      <LocationsStats
        totalLocations={totalLocations}
        availableLocations={availableLocations}
        approvedBookingsCount={approvedBookingsCount}
        pendingRequests={pendingRequests}
      />

      {/* Toolbar & Filters */}
      {activeTab === 'locations' && (
        <LocationsFilters
          listSearch={listSearch}
          setListSearch={setListSearch}
          filterType={filterType}
          setFilterType={setFilterType}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
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
                <LocationsGrid
                  locations={filteredLocations}
                  selectedLocation={selectedLocation}
                  onSelectLocation={setSelectedLocation}
                  getLocationStatus={getLocationStatus}
                  getFallbackImage={getFallbackImage}
                  getBookingSummary={getBookingSummary}
                  onOpenEdit={handleOpenEdit}
                  onDeleteLocation={handleDeleteLocation}
                  hasPermission={hasPermission}
                />
              ) : (
                <LocationsTable
                  locations={filteredLocations}
                  selectedLocation={selectedLocation}
                  onSelectLocation={setSelectedLocation}
                  getLocationStatus={getLocationStatus}
                  getFallbackImage={getFallbackImage}
                  onOpenEdit={handleOpenEdit}
                  onDeleteLocation={handleDeleteLocation}
                  hasPermission={hasPermission}
                />
              )
            ) : (
              <div className="text-xs text-slate-405 text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs font-medium">
                No physical locations found matching your search.
              </div>
            )}
          </div>

          {/* Interactive Map & Details Sidebar (1/3 width) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-max">
            {/* Leaflet Map Visualizer */}
            <div className="h-[220px] w-full relative z-0 border-b border-slate-200">
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
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition cursor-pointer"
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
                      className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                          
                          const statusColors: Record<string, string> = {
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
        <LocationsBookingsTable
          bookings={bookings}
          handleUpdateBookingStatus={handleUpdateBookingStatus}
          handleOpenReject={handleOpenReject}
          canCancelBooking={canCancelBooking}
        />
      )}

      {/* Modal - Edit Physical Location */}
      <LocationEditModal
        isOpen={isEditLocationOpen}
        onClose={() => setIsEditLocationOpen(false)}
        location={editingLocation}
        productionId={selectedProduction._id}
        onSave={fetchData}
      />

      {/* Modal - Request Location Booking */}
      <LocationAddBookingModal
        isOpen={isAddBookingOpen}
        onClose={() => setIsAddBookingOpen(false)}
        locations={locations}
        bookingLocationId={bookingLocationId}
        setBookingLocationId={setBookingLocationId}
        bookingStart={bookingStart}
        setBookingStart={setBookingStart}
        bookingEnd={bookingEnd}
        setBookingEnd={setBookingEnd}
        onSubmit={handleRequestBooking}
      />

      {/* Modal - Rejection Reason */}
      <LocationRejectModal
        isOpen={isRejectOpen}
        onClose={() => {
          setIsRejectOpen(false);
          setRejectionReason('');
        }}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onSubmit={handleConfirmReject}
      />

      {/* Modal - Import Locations */}
      <LocationImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSubmit={handleImportLocations}
      />

    </div>
  );
}
