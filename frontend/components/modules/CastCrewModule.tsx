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
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* My character roles */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Info size={14} className="text-indigo-650" /> My Characters
          </h3>

          {castCrewList.filter(cc => cc.userId?._id === user.id && cc.characterId).length > 0 ? (
            <div className="space-y-4">
              {castCrewList.filter(cc => cc.userId?._id === user.id && cc.characterId).map((cc) => (
                <div key={cc._id} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Character Name</span>
                  <h4 className="font-bold text-base text-indigo-650">{cc.characterId?.name}</h4>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block pt-2">Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{cc.characterId?.description || 'No script details provided.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-10 bg-slate-50 border border-slate-150 rounded-xl font-medium">
              You have not been mapped to any script characters yet. Ask the casting manager.
            </div>
          )}
        </div>

        {/* Schedule listing */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calendar size={14} className="text-indigo-650" /> Shoot Schedule Overview
          </h3>

          {locations.filter(l => l.status === 'Booked').length > 0 ? (
            <div className="space-y-3">
              {locations.filter(l => l.status === 'Booked').map((loc) => {
                const start = new Date(loc.startDate).toLocaleDateString();
                const end = new Date(loc.endDate).toLocaleDateString();
                return (
                  <div key={loc._id} className="p-4 bg-slate-50/50 border border-slate-150 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{loc.name}</span>
                      <span className="text-[10px] text-slate-450 block mt-0.5">{loc.address}</span>
                    </div>
                    <span className="text-indigo-650 font-bold bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">{start} — {end}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-10 bg-slate-50 border border-slate-150 rounded-xl font-medium">
              No booked shoot schedules on locations.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
