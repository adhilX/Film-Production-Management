import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, MapPin, Calendar } from 'lucide-react';
import type { Location } from '@/app/types';

interface LocationsGridProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
  getLocationStatus: (id: string) => string;
  getFallbackImage: (name: string, type?: string) => string;
  getBookingSummary: (id: string) => string;
  onOpenEdit: (loc: Location) => void;
  onDeleteLocation: (id: string, name: string) => void;
  hasPermission: (perm: string) => boolean;
}

export const LocationsGrid: React.FC<LocationsGridProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  getLocationStatus,
  getFallbackImage,
  getBookingSummary,
  onOpenEdit,
  onDeleteLocation,
  hasPermission,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  React.useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {locations.map((loc) => {
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
            onClick={() => onSelectLocation(loc)}
            className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition duration-200 cursor-pointer flex flex-col relative group ${
              selectedLocation?._id === loc._id
                ? 'border-indigo-600 ring-2 ring-indigo-50/70'
                : 'border-slate-205 hover:border-slate-350'
            }`}
          >
            {/* Image section with overlay status */}
            <div className="h-32 w-full relative overflow-hidden bg-slate-100">
              <img
                src={loc.imageUrl || fallbackImg}
                alt={loc.name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-300"
              />
              <span className={`absolute top-2.5 right-2.5 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs uppercase tracking-wider ${statusColors[status] || 'bg-slate-500 text-white'}`}>
                {status}
              </span>
            </div>

            {/* Content section */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex justify-between items-start gap-2 relative">
                  <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors duration-150">{loc.name}</h3>
                  
                  {/* Context Actions Dropdown menu */}
                  {(hasPermission('locations.update') || hasPermission('locations.delete')) && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === loc._id ? null : loc._id);
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === loc._id && (
                        <div className="absolute right-0 top-7 z-20 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 divide-y divide-slate-50">
                          {hasPermission('locations.update') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                onOpenEdit(loc);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-650 hover:bg-slate-50 transition flex items-center gap-1.5 font-semibold cursor-pointer"
                            >
                              <Edit2 size={11} /> Edit
                            </button>
                          )}
                          {hasPermission('locations.delete') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                onDeleteLocation(loc._id, loc.name);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition flex items-center gap-1.5 font-semibold cursor-pointer"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className={`py-0.5 px-1.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${typeStyle}`}>
                    {loc.locationType || 'Physical'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-450 mt-2">
                  <MapPin size={11} className="text-slate-350 shrink-0" />
                  <span className="truncate leading-relaxed">{loc.address}</span>
                </div>
              </div>

              <div className="border-t border-slate-105 pt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-slate-400" />
                  {getBookingSummary(loc._id)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LocationsGrid;
