import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Check, Edit2, Film } from 'lucide-react';
import type { Production } from '@/app/types';

interface ProjectsTableProps {
  currentProjects: Production[];
  selectedProduction: Production | null;
  setSelectedProduction: (prod: Production) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  hasUpdatePermission: boolean;
  openEditModal: (prod: Production) => void;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  currentProjects,
  selectedProduction,
  setSelectedProduction,
  sortBy,
  sortOrder,
  handleSort,
  hasUpdatePermission,
  openEditModal,
}) => {
  const [activeRowActions, setActiveRowActions] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActiveRowActions(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const now = new Date();
    const updated = new Date(dateStr);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 60) return `${diffMins || 1}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Draft':
        return 'bg-blue-50 text-blue-750 border-blue-100';
      case 'On Hold':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Completed':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100 bg-slate-50/40">
            <th
              onClick={() => handleSort('title')}
              className="py-3.5 px-5 select-none cursor-pointer hover:bg-slate-100/50 transition duration-200 group"
            >
              <div className="flex items-center gap-1.5">
                <span>Project</span>
                <span
                  className={`text-[10px] transition-opacity duration-200 ${
                    sortBy === 'title'
                      ? 'text-indigo-655 opacity-100'
                      : 'text-slate-350 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {sortBy === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </span>
              </div>
            </th>
            <th
              onClick={() => handleSort('productionManager')}
              className="py-3.5 px-5 select-none cursor-pointer hover:bg-slate-100/50 transition duration-200 group"
            >
              <div className="flex items-center gap-1.5">
                <span>Project Manager</span>
                <span
                  className={`text-[10px] transition-opacity duration-200 ${
                    sortBy === 'productionManager'
                      ? 'text-indigo-655 opacity-100'
                      : 'text-slate-350 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {sortBy === 'productionManager' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </span>
              </div>
            </th>
            <th
              onClick={() => handleSort('status')}
              className="py-3.5 px-5 select-none cursor-pointer hover:bg-slate-100/50 transition duration-200 group"
            >
              <div className="flex items-center gap-1.5">
                <span>Status</span>
                <span
                  className={`text-[10px] transition-opacity duration-200 ${
                    sortBy === 'status'
                      ? 'text-indigo-655 opacity-100'
                      : 'text-slate-350 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </span>
              </div>
            </th>
            <th className="py-3.5 px-5 select-none">Budget</th>
            <th
              onClick={() => handleSort('startDate')}
              className="py-3.5 px-5 select-none cursor-pointer hover:bg-slate-100/50 transition duration-200 group"
            >
              <div className="flex items-center gap-1.5">
                <span>Timeline</span>
                <span
                  className={`text-[10px] transition-opacity duration-200 ${
                    sortBy === 'startDate'
                      ? 'text-indigo-655 opacity-100'
                      : 'text-slate-350 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {sortBy === 'startDate' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </span>
              </div>
            </th>
            <th
              onClick={() => handleSort('updatedAt')}
              className="py-3.5 px-5 select-none cursor-pointer hover:bg-slate-100/50 transition duration-200 group"
            >
              <div className="flex items-center gap-1.5">
                <span>Updated</span>
                <span
                  className={`text-[10px] transition-opacity duration-200 ${
                    sortBy === 'updatedAt'
                      ? 'text-indigo-655 opacity-100'
                      : 'text-slate-350 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {sortBy === 'updatedAt' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                </span>
              </div>
            </th>
            <th className="py-3.5 px-5 select-none text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {currentProjects.map((proj) => {
            const isCurrentActive = selectedProduction?._id === proj._id;
            const mgrName =
              typeof proj.productionManager === 'object' && proj.productionManager !== null
                ? (proj.productionManager as any).name
                : 'Unassigned';
            const mgrInitial = mgrName.charAt(0).toUpperCase();

            return (
              <tr
                key={proj._id}
                onClick={() => setSelectedProduction(proj)}
                className={`hover:bg-slate-50/50 transition cursor-pointer duration-150 ${
                  isCurrentActive ? 'bg-purple-50/100' : ''
                }`}
              >
                {/* Project Cover & Title */}
                <td className="py-4 px-5 font-bold text-slate-900">
                  <div className="flex items-center gap-3">
                    {/* Image Poster */}
                    {proj.imageUrl ? (
                      <img
                        src={proj.imageUrl}
                        alt={proj.title}
                        className="w-12 h-16 object-cover rounded-lg shrink-0 border border-slate-200/60 shadow-3xs"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center shrink-0 text-slate-400 text-xs">
                        <span>🎬</span>
                        <span className="text-[7px] text-slate-350 tracking-tighter mt-0.5 font-mono">
                          —
                        </span>
                      </div>
                    )}
                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="block text-slate-800 text-xs font-black">{proj.title}</span>
                        {isCurrentActive && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-450 font-semibold block mt-1">
                        {proj.format} · {proj.genre}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Project Manager */}
                <td className="py-4 px-5 text-slate-655 font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                      {mgrInitial}
                    </div>
                    <span className="truncate max-w-[130px]">{mgrName}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-5">
                  <span
                    className={`inline-block py-0.5 px-2.5 border rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getStatusColor(
                      proj.status
                    )}`}
                  >
                    {proj.status}
                  </span>
                </td>

                {/* Budget */}
                <td className="py-4 px-5 font-extrabold text-slate-700">
                  ${proj.budget?.toLocaleString() || '0'}
                </td>

                {/* Timeline */}
                <td className="py-4 px-5 text-slate-450 font-semibold leading-normal">
                  <div className="flex flex-col">
                    <span>
                      Start:{' '}
                      {proj.startDate
                        ? new Date(proj.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                    <span className="text-[10px] mt-0.5">
                      End:{' '}
                      {proj.endDate
                        ? new Date(proj.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </td>

                {/* Updated Relative */}
                <td className="py-4 px-5 text-slate-450 font-bold">
                  {getRelativeTime(proj.updatedAt || proj.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() =>
                        setActiveRowActions(activeRowActions === proj._id ? null : proj._id)
                      }
                      className="p-1.5 text-slate-455 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeRowActions === proj._id && (
                      <div
                        ref={actionsRef}
                        className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-1 duration-100"
                      >
                        <button
                          onClick={() => {
                            setSelectedProduction(proj);
                            setActiveRowActions(null);
                          }}
                          disabled={isCurrentActive}
                          className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition ${
                            isCurrentActive
                              ? 'text-slate-350 cursor-not-allowed bg-slate-50/30'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 text-slate-450" /> Set as Active
                        </button>

                        {hasUpdatePermission && (
                          <button
                            onClick={() => {
                              openEditModal(proj);
                              setActiveRowActions(null);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition border-t border-slate-50"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-450" /> Edit Project
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTable;
