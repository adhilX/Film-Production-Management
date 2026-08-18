import React from 'react';
import { Search, Filter } from 'lucide-react';

interface CastCrewFiltersProps {
  activeTab: 'characters' | 'cast' | 'crew';
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
}

export const CastCrewFilters: React.FC<CastCrewFiltersProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
}) => {
  return (
    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition text-slate-900"
        />
      </div>

      {activeTab === 'crew' && (
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Filter className="text-slate-400 w-4 h-4" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition cursor-pointer flex-1 sm:flex-none text-slate-700"
          >
            <option value="All">All Departments</option>
            <option value="Camera">Camera / G&E</option>
            <option value="Direction">Direction</option>
            <option value="Art">Art & Props</option>
            <option value="Production">Production Office</option>
            <option value="Sound">Sound</option>
            <option value="Makeup">Makeup & Hair</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default CastCrewFilters;
