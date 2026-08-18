import React from 'react';
import { Search, ChevronDown, Filter } from 'lucide-react';

interface LogsFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  moduleFilter: string;
  setModuleFilter: (val: string) => void;
  actionFilter: string;
  setActionFilter: (val: string) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

export const LogsFilters: React.FC<LogsFiltersProps> = ({
  search,
  setSearch,
  moduleFilter,
  setModuleFilter,
  actionFilter,
  setActionFilter,
  onClearFilters,
  onApplyFilters,
}) => {
  return (
    <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
        {/* Date Range Selector */}
        <div>
          <span className="block text-[9px] font-black text-slate-450 uppercase tracking-wider mb-1">Date Range</span>
          <div className="relative">
            <select
              disabled
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-500 font-bold focus:outline-none cursor-not-allowed appearance-none animate-none"
            >
              <option>May 15, 2024 - May 22, 2024</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Log Level Filter */}
        <div>
          <span className="block text-[9px] font-black text-slate-450 uppercase tracking-wider mb-1">Log Level</span>
          <div className="relative">
            <select
              disabled
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-505 font-bold focus:outline-none cursor-not-allowed appearance-none animate-none"
            >
              <option>All Levels</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Action Filter */}
        <div>
          <span className="block text-[9px] font-black text-slate-450 uppercase tracking-wider mb-1">Action</span>
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none truncate"
            >
              <option value="All">All Actions</option>
              <option value="BUDGET_UPDATED">BUDGET_UPDATED</option>
              <option value="FUND_REQUEST_CREATED">FUND_REQUEST_CREATED</option>
              <option value="FUND_REQUEST_APPROVED">FUND_REQUEST_APPROVED</option>
              <option value="FUND_REQUEST_REJECTED">FUND_REQUEST_REJECTED</option>
              <option value="LOCATION_CREATED">LOCATION_CREATED</option>
              <option value="LOCATION_BOOKING_APPROVED">LOCATION_BOOKING_APPROVED</option>
              <option value="COSTUME_CREATED">COSTUME_CREATED</option>
              <option value="PROJECT_CREATED">PROJECT_CREATED</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="SECURITY_DENIAL">SECURITY_DENIAL</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Module Filter */}
        <div>
          <span className="block text-[9px] font-black text-slate-450 uppercase tracking-wider mb-1">Module</span>
          <div className="relative">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-550 cursor-pointer appearance-none"
            >
              <option value="All">All Modules</option>
              <option value="FUNDS">Funds</option>
              <option value="USERS">Users</option>
              <option value="LOCATIONS">Locations</option>
              <option value="COSTUMES">Costumes</option>
              <option value="PRODUCTIONS">Projects</option>
              <option value="SECURITY">Security</option>
              <option value="SYSTEM">System</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* User Search Input */}
        <div>
          <span className="block text-[9px] font-black text-slate-450 uppercase tracking-wider mb-1">User</span>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-550 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-700 font-bold placeholder-slate-400 focus:outline-none transition"
            />
            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          More Filters
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onClearFilters}
            className="text-xs font-bold text-slate-500 hover:text-slate-705 cursor-pointer"
          >
            Clear all
          </button>
          <button
            onClick={onApplyFilters}
            className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogsFilters;
