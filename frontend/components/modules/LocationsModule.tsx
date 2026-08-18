'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, Calendar } from 'lucide-react';
import { useAuth } from '@/app/components/auth-context';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import productionsService from '@/services/productionsService';

export default function LocationsModule() {
  const { token } = useAuth();
  const selectedProduction = useProductionStore(state => state.selectedProduction);

  const [locations, setLocations] = useState<any[]>([]);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocStart, setNewLocStart] = useState('');
  const [newLocEnd, setNewLocEnd] = useState('');
  const [newLocError, setNewLocError] = useState('');
  const [newLocSuccess, setNewLocSuccess] = useState('');

  useEffect(() => {
    if (selectedProduction && token) {
      fetchLocations();
    }
  }, [selectedProduction, token]);

  const fetchLocations = async () => {
    if (!selectedProduction) return;
    try {
      const data = await productionsService.getLocations(selectedProduction._id);
      setLocations(data);
    } catch (e) {
      console.error('Error fetching locations:', e);
    }
  };

  const handleBookLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewLocError('');
    setNewLocSuccess('');
    if (!selectedProduction) return;

    try {
      await productionsService.createLocation(selectedProduction._id, {
        productionId: selectedProduction._id,
        name: newLocName,
        address: newLocAddress,
        startDate: newLocStart,
        endDate: newLocEnd,
      });

      setNewLocSuccess(`Requested location booking for "${newLocName}" successfully.`);
      setNewLocName('');
      setNewLocAddress('');
      setNewLocStart('');
      setNewLocEnd('');
      fetchLocations();
    } catch (err: any) {
      setNewLocError(err.message || 'Failed to request location booking.');
    }
  };

  const handleUpdateLocationStatus = async (locId: string, status: string) => {
    if (!selectedProduction) return;
    setNewLocError('');
    setNewLocSuccess('');
    try {
      await productionsService.updateLocationStatus(selectedProduction._id, locId, status);
      setNewLocSuccess(`Location booking status successfully set to "${status}".`);
      fetchLocations();
    } catch (err: any) {
      setNewLocError(err.message || 'Failed to update location status.');
    }
  };

  if (!selectedProduction) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      {newLocError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold leading-relaxed">
          <AlertTriangle size={14} className="inline mr-2 text-red-650" />
          {newLocError}
        </div>
      )}

      {newLocSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-xl text-xs font-semibold">
          <Check size={14} className="inline mr-2 text-emerald-600" />
          {newLocSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Bookings List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Scheduled Locations</h3>
          
          {locations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => {
                const startStr = new Date(loc.startDate).toLocaleDateString();
                const endStr = new Date(loc.endDate).toLocaleDateString();
                
                const hasVisualOverlap = locations.some(other => 
                  other._id !== loc._id &&
                  other.name === loc.name &&
                  other.status === 'Booked' &&
                  new Date(other.startDate) < new Date(loc.endDate) &&
                  new Date(other.endDate) > new Date(loc.startDate)
                );

                return (
                  <div key={loc._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 relative shadow-xs">
                    {hasVisualOverlap && loc.status !== 'Booked' && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 py-0.5 px-2 bg-amber-50 border border-amber-100 text-amber-705 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                        <AlertTriangle size={10} /> Collision Warning
                      </div>
                    )}

                    <div>
                      <span className="font-bold text-slate-800 block text-sm">{loc.name}</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">{loc.address}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-150">
                      <Calendar size={12} className="text-indigo-650" />
                      <span className="font-medium">{startStr} — {endStr}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <span className={`py-0.5 px-2 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                        loc.status === 'Booked' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : loc.status === 'Completed' 
                          ? 'bg-blue-50 border-blue-100 text-blue-700' 
                          : 'bg-slate-50 border-slate-150 text-slate-500'
                      }`}>
                        {loc.status}
                      </span>

                      <PermissionGuard permission="locations.approve">
                        <div className="flex gap-1.5">
                          {loc.status !== 'Booked' && loc.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateLocationStatus(loc._id, 'Booked')}
                              className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 rounded-lg text-[10px] font-bold text-emerald-700 cursor-pointer transition"
                            >
                              Book
                            </button>
                          )}
                          {loc.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateLocationStatus(loc._id, 'Completed')}
                              className="py-1 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-250 rounded-lg text-[10px] font-bold text-indigo-700 cursor-pointer transition"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </PermissionGuard>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-12 bg-white border border-slate-200/80 rounded-2xl shadow-xs font-medium">
              No locations scheduled.
            </div>
          )}
        </div>

        {/* Book location form */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Request Booking</h3>
          
          <form onSubmit={handleBookLocation} className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Location Name</label>
              <input 
                type="text" 
                placeholder="e.g. Stage B"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                required
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Address / Set Description</label>
              <input 
                type="text" 
                placeholder="e.g. Studio Lot 4, Burbank"
                value={newLocAddress}
                onChange={(e) => setNewLocAddress(e.target.value)}
                required
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Filming Start Date</label>
              <input 
                type="date" 
                value={newLocStart}
                onChange={(e) => setNewLocStart(e.target.value)}
                required
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Filming End Date</label>
              <input 
                type="date" 
                value={newLocEnd}
                onChange={(e) => setNewLocEnd(e.target.value)}
                required
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 cursor-pointer"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Submit Booking Request
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
