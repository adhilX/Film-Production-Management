import React from 'react';
import { Search } from 'lucide-react';

interface CostumesFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  conditionFilter: string;
  setConditionFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  categories: string[];
}

export const CostumesFilters: React.FC<CostumesFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  conditionFilter,
  setConditionFilter,
  statusFilter,
  setStatusFilter,
  categories,
}) => {
  return (
    <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-2xs flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search costumes catalog by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
        />
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Category</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none cursor-pointer focus:border-indigo-655"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Condition Filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Condition</span>
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none cursor-pointer focus:border-indigo-655"
        >
          <option value="All">All Conditions</option>
          <option value="New">New</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Damaged">Damaged</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Status</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none cursor-pointer focus:border-indigo-655"
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Assigned">Assigned</option>
          <option value="Damaged">Damaged</option>
          <option value="Lost">Lost</option>
        </select>
      </div>
    </div>
  );
};

export default CostumesFilters;
