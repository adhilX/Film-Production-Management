import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

interface ApprovalsFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onboardingStatus: string;
  setOnboardingStatus: (val: string) => void;
  contractorType: string;
  setContractorType: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortOrder: () => void;
}

export const ApprovalsFilters: React.FC<ApprovalsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  onboardingStatus,
  setOnboardingStatus,
  contractorType,
  setContractorType,
  sortBy,
  setSortBy,
  sortOrder,
  onToggleSortOrder,
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search applicants by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-955 focus:outline-none focus:border-indigo-600 transition"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div className="flex flex-col">
          <select
            value={onboardingStatus}
            onChange={(e) => setOnboardingStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 transition cursor-pointer"
          >
            <option value="pending-review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="changes-requested">Changes Requested</option>
            <option value="in-progress">In Progress</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        {/* Contractor Type Filter */}
        <div className="flex flex-col">
          <select
            value={contractorType}
            onChange={(e) => setContractorType(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 transition cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Cast">Cast</option>
            <option value="Crew">Crew</option>
            <option value="Supplier">Supplier</option>
            <option value="Agent">Agent</option>
            <option value="Production Company">Company</option>
          </select>
        </div>

        {/* Sort By Filter */}
        <div className="flex flex-col">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 transition cursor-pointer"
          >
            <option value="submittedDate">Sort: Submitted Date</option>
            <option value="name">Sort: Name</option>
            <option value="contractorType">Sort: Type</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={onToggleSortOrder}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-705 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
        </button>
      </div>
    </div>
  );
};

export default ApprovalsFilters;
