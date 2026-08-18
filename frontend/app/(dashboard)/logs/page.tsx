'use client';

import React from 'react';
import { PermissionGuard } from '@/app/components/permission-guard';
import { UnauthorizedFallback } from '@/components/common/UnauthorizedFallback';
import { PERMISSIONS } from '@/constants/permissions';
import {
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Settings,
  Briefcase,
  DollarSign,
  MapPin,
  Shirt,
  ShieldAlert,
  FolderSync,
  RefreshCw,
  ExternalLink,
  Users as UsersIcon
} from 'lucide-react';

// Central hook & subcomponents
import { useLogs } from '@/features/logs/hooks/useLogs';
import { LogsStats } from '@/features/logs/components/LogsStats';
import { LogsFilters } from '@/features/logs/components/LogsFilters';
import { LogsTable } from '@/features/logs/components/LogsTable';
import { LogDetailsPanel } from '@/features/logs/components/LogDetailsPanel';
import { RawLogModal } from '@/features/logs/components/RawLogModal';

// Pagination component
import Pagination from '@/app/components/Pagination';

export default function AuditLogsPage() {
  const {
    selectedProduction,
    user,
    isSuperAdmin,
    logs,
    total,
    totalPages,
    metrics,
    loading,
    error,
    search,
    setSearch,
    moduleFilter,
    setModuleFilter,
    actionFilter,
    setActionFilter,
    scopeAllProjects,
    setScopeAllProjects,
    page,
    setPage,
    limit,
    setLimit,
    sortBy,
    sortOrder,
    selectedLog,
    setSelectedLog,
    isRawModalOpen,
    setIsRawModalOpen,
    fetchLogs,
    handleSort,
  } = useLogs();

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 inline ml-1 text-indigo-650" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1 text-indigo-650" />
    );
  };

  // Convert DB action slug to clean sentence text
  const getFriendlyAction = (action: string) => {
    if (!action) return 'System Event';
    return action
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getModuleBadge = (mod: string) => {
    const normalized = (mod || 'SYSTEM').toUpperCase();
    let icon = <Settings size={10} />;
    let colorClass = 'text-slate-650 bg-slate-50 border-slate-200';
    let label = 'System';

    if (normalized.includes('PROD') || normalized.includes('PROJECT')) {
      icon = <Briefcase size={10} />;
      colorClass = 'text-amber-700 bg-amber-50 border-amber-100';
      label = 'Productions';
    } else if (normalized.includes('FUND') || normalized.includes('BUDGET')) {
      icon = <DollarSign size={10} />;
      colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-100';
      label = 'Funds';
    } else if (normalized.includes('USER')) {
      icon = <UsersIcon size={10} />;
      colorClass = 'text-blue-700 bg-blue-50 border-blue-100';
      label = 'Users';
    } else if (normalized.includes('LOC')) {
      icon = <MapPin size={10} />;
      colorClass = 'text-rose-700 bg-rose-50 border-rose-100';
      label = 'Locations';
    } else if (normalized.includes('COSTUME')) {
      icon = <Shirt size={10} />;
      colorClass = 'text-purple-700 bg-purple-50 border-purple-100';
      label = 'Costumes';
    } else if (normalized.includes('SEC')) {
      icon = <ShieldAlert size={10} />;
      colorClass = 'text-red-700 bg-red-50 border-red-100';
      label = 'Security';
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-md text-[9px] font-bold uppercase tracking-wider ${colorClass}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  const getLogStatus = (action: string) => {
    const norm = (action || '').toUpperCase();
    if (norm.includes('DENIAL') || norm.includes('FAIL')) {
      return { label: 'Failed', color: 'bg-rose-50 text-rose-700 border-rose-100' };
    }
    if (norm.includes('REJECTED') || norm.includes('CANCEL')) {
      return { label: 'Warning', color: 'bg-amber-50 text-amber-700 border-amber-100' };
    }
    return { label: 'Success', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  };

  const prettyPrintJson = (str: any) => {
    if (!str) return 'N/A';
    if (typeof str === 'object') return JSON.stringify(str, null, 2);
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return String(str);
    }
  };

  const uniqueUsersCount = new Set(logs.map((l) => l.userId?._id).filter(Boolean)).size || 1;

  return (
    <PermissionGuard
      permission={PERMISSIONS.AUDIT_LOGS_VIEW}
      fallback={<UnauthorizedFallback />}
    >
      <div className="w-full px-6 md:px-8 lg:px-10 py-6 space-y-5 animate-in fade-in duration-300">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-650 flex items-center justify-center text-white shrink-0 shadow-xs">
              <ShieldAlert size={18} className="fill-white/10 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight">Audit Logs</h1>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Track system activities, user actions and important changes across the platform.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isSuperAdmin && (
              <button
                onClick={() => setScopeAllProjects(!scopeAllProjects)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  scopeAllProjects
                    ? 'bg-indigo-55/70 border-indigo-200 text-indigo-705'
                    : 'bg-white border-slate-205 text-slate-650 hover:bg-slate-50'
                }`}
              >
                <FolderSync size={13} />
                {scopeAllProjects ? 'All Projects' : 'Current Project Only'}
              </button>
            )}
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            {/* Export Dropdown Button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer">
              <ExternalLink size={13} className="text-slate-500" />
              Export Logs
              <ChevronDown size={12} className="text-slate-505" />
            </button>
          </div>
        </div>

        {/* --- FILTERS PANEL --- */}
        <LogsFilters
          search={search}
          setSearch={setSearch}
          moduleFilter={moduleFilter}
          setModuleFilter={setModuleFilter}
          actionFilter={actionFilter}
          setActionFilter={setActionFilter}
          onClearFilters={() => {
            setSearch('');
            setModuleFilter('All');
            setActionFilter('All');
          }}
          onApplyFilters={fetchLogs}
        />

        {/* --- KPI CARDS --- */}
        <LogsStats metrics={metrics} uniqueUsersCount={uniqueUsersCount} />

        {/* --- ERROR PANEL --- */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-xs text-rose-800 font-bold">{error}</span>
            </div>
            <button
              onClick={fetchLogs}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 border border-rose-200 hover:bg-rose-100/50 rounded-lg px-2.5 py-1.5 transition cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* --- MAIN GRID --- */}
        {!error && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-start">
            
            {/* LEFT COLUMN: Data Table */}
            <div
              className={`${
                selectedLog ? 'xl:col-span-9' : 'xl:col-span-12'
              } bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-300`}
            >
              <div className="overflow-x-auto">
                <LogsTable
                  logs={logs}
                  loading={loading}
                  selectedLog={selectedLog}
                  onSelectLog={setSelectedLog}
                  onSort={handleSort}
                  renderSortIcon={renderSortIcon}
                  getFriendlyAction={getFriendlyAction}
                  getModuleBadge={getModuleBadge}
                  getLogStatus={getLogStatus}
                />
              </div>

              {/* Pagination Controls */}
              {!loading && total > 0 && (
                <div className="border-t border-slate-100 bg-white animate-none">
                  <Pagination
                    page={page}
                    pages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={setPage}
                    onLimitChange={(size) => {
                      setLimit(size);
                      setPage(1);
                    }}
                    itemName="results"
                  />
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Collapse Log Details Drawer */}
            {selectedLog && (
              <LogDetailsPanel
                selectedLog={selectedLog}
                onClose={() => setSelectedLog(null)}
                getFriendlyAction={getFriendlyAction}
                getLogStatus={getLogStatus}
                getModuleBadge={getModuleBadge}
                onOpenRawModal={() => setIsRawModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* --- FULL RAW DETAILS MODAL --- */}
        <RawLogModal
          isOpen={isRawModalOpen}
          onClose={() => setIsRawModalOpen(false)}
          selectedLog={selectedLog}
          prettyPrintJson={prettyPrintJson}
        />
      </div>
    </PermissionGuard>
  );
}
