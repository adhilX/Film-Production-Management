import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { Location } from '@/app/types';

interface LocationsTableProps {
  locations: Location[];
  selectedLocation: Location | null;
  onSelectLocation: (loc: Location) => void;
  getLocationStatus: (id: string) => string;
  getFallbackImage: (name: string, type?: string) => string;
  onOpenEdit: (loc: Location) => void;
  onDeleteLocation: (id: string, name: string) => void;
  hasPermission: (perm: string) => boolean;
}

export const LocationsTable: React.FC<LocationsTableProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  getLocationStatus,
  getFallbackImage,
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
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-150">
      {locations.map((loc) => {
        const status = getLocationStatus(loc._id);
        const statusColors: Record<string, string> = {
          Available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          Pending: 'bg-orange-50 text-orange-700 border-orange-100',
          Booked: 'bg-blue-50 text-blue-700 border-blue-100',
        };
        const fallbackImg = getFallbackImage(loc.name, loc.locationType);

        return (
          <div
            key={loc._id}
            onClick={() => onSelectLocation(loc)}
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
              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg ${statusColors[status] || 'bg-slate-50 text-slate-655'}`}>
                {status}
              </span>
              {(hasPermission('locations.update') || hasPermission('locations.delete')) && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === loc._id ? null : loc._id);
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-450 transition cursor-pointer"
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
                            onOpenEdit(loc);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      )}
                      {hasPermission('locations.delete') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                            onDeleteLocation(loc._id, loc.name);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition flex items-center gap-1.5 cursor-pointer"
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
  );
};

export default LocationsTable;
