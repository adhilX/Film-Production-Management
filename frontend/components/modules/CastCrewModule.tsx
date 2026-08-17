'use client';

import React, { useState, useEffect } from 'react';
import { Info, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import productionsService from '@/services/productionsService';

export default function CastCrewModule() {
  const user = useAuthStore(state => state.user);
  const selectedProduction = useProductionStore(state => state.selectedProduction);

  const [castCrewList, setCastCrewList] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (selectedProduction) {
      fetchCastCrew();
      fetchLocations();
    }
  }, [selectedProduction]);

  const fetchCastCrew = async () => {
    if (!selectedProduction) return;
    try {
      const data = await productionsService.getCastCrew(selectedProduction._id);
      setCastCrewList(data);
    } catch (e) {
      console.error('Error fetching cast/crew:', e);
    }
  };

  const fetchLocations = async () => {
    if (!selectedProduction) return;
    try {
      const data = await productionsService.getLocations(selectedProduction._id);
      setLocations(data);
    } catch (e) {
      console.error('Error fetching locations:', e);
    }
  };

  if (!selectedProduction || !user) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Cast Roles & Assignments</h2>
        <p className="text-xs text-slate-400 mt-1">Review your assigned characters and production tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* My character roles */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info size={16} /> My Characters
          </h3>

          {castCrewList.filter(cc => cc.userId?._id === user.id && cc.characterId).length > 0 ? (
            <div className="space-y-4">
              {castCrewList.filter(cc => cc.userId?._id === user.id && cc.characterId).map((cc) => (
                <div key={cc._id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Character Name</span>
                  <h4 className="font-bold text-base text-purple-300">{cc.characterId?.name}</h4>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block pt-2">Description</span>
                  <p className="text-xs text-slate-355 leading-relaxed">{cc.characterId?.description || 'No script details provided.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-10 bg-slate-950/20 border border-slate-850 rounded-xl">
              You have not been mapped to any script characters yet. Ask the casting manager.
            </div>
          )}
        </div>

        {/* Schedule listing */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={16} /> Shoot Schedule Overview
          </h3>

          {locations.filter(l => l.status === 'Booked').length > 0 ? (
            <div className="space-y-3">
              {locations.filter(l => l.status === 'Booked').map((loc) => {
                const start = new Date(loc.startDate).toLocaleDateString();
                const end = new Date(loc.endDate).toLocaleDateString();
                return (
                  <div key={loc._id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-200 block">{loc.name}</span>
                      <span className="text-[10px] text-slate-500 block">{loc.address}</span>
                    </div>
                    <span className="text-purple-400 font-semibold">{start} — {end}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-10 bg-slate-950/20 border border-slate-850 rounded-xl">
              No booked shoot schedules on locations.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
