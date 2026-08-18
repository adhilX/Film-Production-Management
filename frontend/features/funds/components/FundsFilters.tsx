import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FundsFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  categories: string[];
}

export const FundsFilters: React.FC<FundsFiltersProps> = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  categories,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
        Fund Request History
      </h3>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests or users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl py-2 px-3 pr-8 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 shadow-sm cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <Filter className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Category Dropdown */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl py-2 px-3 pr-8 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 shadow-sm cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default FundsFilters;
