import React from 'react';
import { MapPin, Check, Calendar, Clock } from 'lucide-react';

interface LocationsStatsProps {
  totalLocations: number;
  availableLocations: number;
  approvedBookingsCount: number;
  pendingRequests: number;
}

export const LocationsStats: React.FC<LocationsStatsProps> = ({
  totalLocations,
  availableLocations,
  approvedBookingsCount,
  pendingRequests,
}) => {
  return (
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
          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Available</span>
          <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{availableLocations}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">No conflicts</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
          <Calendar size={20} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Booked</span>
          <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{approvedBookingsCount}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Approved bookings</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-orange-50 border border-orange-100 text-orange-600 rounded-xl">
          <Clock size={20} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Pending Requests</span>
          <span className="text-2xl font-extrabold text-slate-800 block mt-0.5">{pendingRequests}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Awaiting approval</span>
        </div>
      </div>
    </div>
  );
};

export default LocationsStats;
