import React from 'react';
import { SlidersHorizontal, Plus } from 'lucide-react';

interface ProjectsFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  managerFilter: string;
  setManagerFilter: (mgrId: string) => void;
  genreFilter: string;
  setGenreFilter: (genre: string) => void;
  uniqueGenres: string[];
  filterManagers: any[];
  openCreateModal: () => void;
  hasCreatePermission: boolean;
  setCurrentPage: (page: number) => void;
}

export const ProjectsFilters: React.FC<ProjectsFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  managerFilter,
  setManagerFilter,
  genreFilter,
  setGenreFilter,
  uniqueGenres,
  filterManagers,
  openCreateModal,
  hasCreatePermission,
  setCurrentPage,
}) => {
  return (
    <div className="p-5 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white">
      <div className="flex items-center gap-3">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 w-full lg:w-auto">
        {/* Search Input */}
        <div className="relative w-full lg:w-64">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-purple-500 text-slate-700"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs select-none">
            🔍
          </span>
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-655 font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Manager Dropdown */}
        <select
          value={managerFilter}
          onChange={(e) => {
            setManagerFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-655 font-bold focus:outline-none focus:border-purple-500 cursor-pointer max-w-xs"
        >
          <option value="All">All Managers</option>
          {filterManagers.map((mgr) => (
            <option key={mgr._id} value={mgr._id}>
              {mgr.name}
            </option>
          ))}
        </select>

        {/* Genre Dropdown */}
        <select
          value={genreFilter}
          onChange={(e) => {
            setGenreFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-655 font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="All">All Genres</option>
          {uniqueGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        {/* Create Project Button */}
        {hasCreatePermission && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs shrink-0 w-full lg:w-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Create Project
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectsFilters;
