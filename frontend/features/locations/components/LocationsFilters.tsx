import React from 'react';
import { Filter, Grid, List } from 'lucide-react';

interface LocationsFiltersProps {
  listSearch: string;
  setListSearch: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const LocationsFilters: React.FC<LocationsFiltersProps> = ({
  listSearch,
  setListSearch,
  filterType,
  setFilterType,
  viewMode,
  setViewMode,
}) => {
  return (
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
          <Filter size={14} className="text-slate-455" /> Filters
        </button>
      </div>

      <div className="flex items-center gap-1 border border-slate-250 rounded-xl p-1 bg-white shadow-xs shrink-0 self-end md:self-auto">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            viewMode === 'grid'
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          <Grid size={16} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            viewMode === 'list'
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              : 'text-slate-400 hover:text-slate-655'
          }`}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
};

export default LocationsFilters;
