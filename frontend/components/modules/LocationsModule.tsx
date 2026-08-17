'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, Calendar } from 'lucide-react';
import { useAuth } from '@/app/components/auth-context';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import type { LocationBooking } from '@/app/types'; // Need to make sure this type is exported
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
      setNewLocError(err.message);
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
      setNewLocError(err.message);
    }
  };

  if (!selectedProduction) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Location Booking Calendar</h2>
        <p className="text-xs text-slate-400 mt-1">Schedule conflicts are dynamically checked on booking state transitions.</p>
      </div>

      {newLocError && (
        <div className="p-3.5 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs font-semibold leading-relaxed">
          <AlertTriangle size={14} className="inline mr-2 text-red-500" />
          {newLocError}
        </div>
      )}

      {newLocSuccess && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-semibold">
          <Check size={14} className="inline mr-2 text-emerald-500" />
          {newLocSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Bookings List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Scheduled Locations</h3>
          
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
                  <div key={loc._id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3 relative">
                    {hasVisualOverlap && loc.status !== 'Booked' && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 py-0.5 px-2 bg-amber-950/40 border border-amber-900 text-amber-400 rounded text-[9px] font-semibold">
                        <AlertTriangle size={10} /> Schedule Collision Warning
                      </div>
                    )}

                    <div>
                      <span className="font-semibold text-slate-200 block text-sm">{loc.name}</span>
                      <span className="text-[10px] text-slate-500 block">{loc.address}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 py-1.5 px-3 rounded-lg border border-slate-850">
                      <Calendar size={12} className="text-purple-400" />
                      <span>{startStr} — {endStr}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                      <span className={`py-0.5 px-2 rounded text-[10px] font-semibold ${
                        loc.status === 'Booked' 
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' 
                          : loc.status === 'Completed' 
                          ? 'bg-indigo-950 border border-indigo-800 text-indigo-400' 
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}>
                        {loc.status}
                      </span>

                      <PermissionGuard permission="locations.approve">
                        <div className="flex gap-1.5">
                          {loc.status !== 'Booked' && loc.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateLocationStatus(loc._id, 'Booked')}
                              className="py-1 px-2.5 bg-emerald-700/20 hover:bg-emerald-700/30 border border-emerald-700/40 rounded text-[10px] font-semibold text-emerald-400 cursor-pointer"
                            >
                              Book
                            </button>
                          )}
                          {loc.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateLocationStatus(loc._id, 'Completed')}
                              className="py-1 px-2.5 bg-indigo-700/20 hover:bg-indigo-700/30 border border-indigo-700/40 rounded text-[10px] font-semibold text-indigo-400 cursor-pointer"
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
            <div className="text-xs text-slate-500 text-center py-12 bg-slate-900/20 border border-slate-800 rounded-xl">
              No locations scheduled.
            </div>
          )}
        </div>

        {/* Book location form */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Request Booking</h3>
          
          <form onSubmit={handleBookLocation} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location Name</label>
              <input 
                type="text" 
                placeholder="e.g. Stage B"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address / Set Description</label>
              <input 
                type="text" 
                placeholder="e.g. Studio Lot 4, Burbank"
                value={newLocAddress}
                onChange={(e) => setNewLocAddress(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filming Start Date</label>
              <input 
                type="date" 
                value={newLocStart}
                onChange={(e) => setNewLocStart(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filming End Date</label>
              <input 
                type="date" 
                value={newLocEnd}
                onChange={(e) => setNewLocEnd(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold transition-all cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.2)]"
            >
              Submit Booking Request
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
