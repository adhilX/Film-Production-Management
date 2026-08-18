import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface UserFiltersProps {
  showFilters: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterDepartment: string;
  setFilterDepartment: (val: string) => void;
  filterContractorType: string;
  setFilterContractorType: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filterOnboardingStatus: string;
  setFilterOnboardingStatus: (val: string) => void;
  filterActive: string;
  setFilterActive: (val: string) => void;
  roles: any[];
  onResetFilters: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  showFilters,
  searchTerm,
  setSearchTerm,
  filterDepartment,
  setFilterDepartment,
  filterContractorType,
  setFilterContractorType,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  filterOnboardingStatus,
  setFilterOnboardingStatus,
  filterActive,
  setFilterActive,
  roles,
  onResetFilters,
}) => {
  if (!showFilters) return null;

  return (
    <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs space-y-4 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-650 transition"
          />
        </div>

        {/* Department Input */}
        <div>
          <input
            type="text"
            placeholder="Filter by Department..."
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-650 transition"
          />
        </div>

        {/* Contractor Type Filter */}
        <select
          value={filterContractorType}
          onChange={(e) => setFilterContractorType(e.target.value)}
          className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
        >
          <option value="all">All Contractor Types</option>
          <option value="Cast">Cast</option>
          <option value="Crew">Crew</option>
          <option value="Freelancer">Freelancer</option>
          <option value="None">None</option>
        </select>

        {/* System Role Filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
        >
          <option value="all">All System Roles</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Account Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
        >
          <option value="all">All Account Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="UnderReview">UnderReview</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Changes Requested">Changes Requested</option>
        </select>

        {/* Onboarding Status Filter */}
        <select
          value={filterOnboardingStatus}
          onChange={(e) => setFilterOnboardingStatus(e.target.value)}
          className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
        >
          <option value="all">All Onboarding Statuses</option>
          <option value="draft">draft</option>
          <option value="pending-review">pending-review</option>
          <option value="changes-requested">changes-requested</option>
          <option value="approved">approved</option>
        </select>

        {/* Active Status Filter */}
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
        >
          <option value="all">All Active States</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Reset / Actions */}
        <button
          onClick={onResetFilters}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-xl transition cursor-pointer text-xs w-full"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default UserFilters;
