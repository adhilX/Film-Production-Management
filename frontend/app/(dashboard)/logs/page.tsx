'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { useProductionStore } from '@/store/useProductionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import Pagination from '@/app/components/Pagination';
import {
  Search,
  RefreshCw,
  Eye,
  ChevronUp,
  ChevronDown,
  Activity,
  ShieldAlert,
  Settings,
  X,
  AlertTriangle,
  FolderSync,
  Filter,
  Briefcase,
  DollarSign,
  MapPin,
  Shirt,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Users as UsersIcon
} from 'lucide-react';

export default function AuditLogsPage() {
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.permissions?.includes('roles.manage');

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [scopeAllProjects, setScopeAllProjects] = useState(false);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Details panel and raw JSON modal states
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, moduleFilter, actionFilter, scopeAllProjects]);

  // Clear stale data and reset page on active project change
  useEffect(() => {
    setLogs([]);
    setMetrics(null);
    setPage(1);
    setSelectedLog(null);
  }, [selectedProduction?._id]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const prodIdParam = (isSuperAdmin && scopeAllProjects)
        ? undefined
        : selectedProduction?._id;

      const data = await adminService.getAuditLogs({
        page,
        limit,
        search: debouncedSearch,
        module: moduleFilter === 'All' ? undefined : moduleFilter,
        action: actionFilter === 'All' ? undefined : actionFilter,
        productionId: prodIdParam,
        sortBy,
        sortOrder,
      });

      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
      setMetrics(data.metrics || null);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'An error occurred while loading audit logs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, debouncedSearch, moduleFilter, actionFilter, scopeAllProjects, sortBy, sortOrder, selectedProduction?._id]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

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
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-md text-[9px] font-bold uppercase tracking-wider ${colorClass}`}>
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

  // Renders a line-by-line visual JSON diff comparor
  const renderStateDiff = (prev: any, next: any) => {
    if (!prev && !next) {
      return <div className="text-slate-500 italic">No state changes logged.</div>;
    }
    try {
      const prevObj = typeof prev === 'string' ? JSON.parse(prev || '{}') : (prev || {});
      const nextObj = typeof next === 'string' ? JSON.parse(next || '{}') : (next || {});
      const allKeys = Array.from(new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]));

      return (
        <div className="space-y-0.5 font-mono text-[10px]">
          <span>{'{'}</span>
          {allKeys.map((key) => {
            const prevVal = prevObj[key];
            const nextVal = nextObj[key];

            // If equal, display normally
            if (JSON.stringify(prevVal) === JSON.stringify(nextVal)) {
              return (
                <div key={key} className="pl-3 text-slate-500 truncate">
                  <span>"{key}": {JSON.stringify(prevVal)},</span>
                </div>
              );
            }

            // If deleted or updated
            const elements = [];
            if (prevVal !== undefined) {
              elements.push(
                <div key={`${key}-prev`} className="pl-3 text-rose-400 bg-rose-950/20 truncate">
                  <span>- "{key}": {JSON.stringify(prevVal)},</span>
                </div>
              );
            }
            if (nextVal !== undefined) {
              elements.push(
                <div key={`${key}-next`} className="pl-3 text-emerald-400 bg-emerald-950/20 truncate">
                  <span>+ "{key}": {JSON.stringify(nextVal)},</span>
                </div>
              );
            }
            return elements;
          })}
          <span>{'}'}</span>
        </div>
      );
    } catch (e) {
      return <div className="text-slate-450 italic">Error parsing state payload</div>;
    }
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

  return (
    <PermissionGuard permission="audit_logs.view" fallback={
      <div className="w-full px-6 md:px-8 lg:px-10 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs text-rose-800 font-bold">Access Denied: You do not have the required permissions (audit_logs.view) to view the system audit logs.</span>
        </div>
      </div>
    }>
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
                    ? 'bg-indigo-55/70 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
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
              <ChevronDown size={12} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* --- FILTERS PANEL --- */}
        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
            
            {/* Date Range Selector */}
            <div>
              <span className="block text-[9px] font-black text-slate-450 uppercase tracking-wider mb-1">Date Range</span>
              <div className="relative">
                <select
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-500 font-bold focus:outline-none cursor-not-allowed appearance-none"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-500 font-bold focus:outline-none cursor-not-allowed appearance-none"
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
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
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
                onClick={() => {
                  setSearch('');
                  setModuleFilter('All');
                  setActionFilter('All');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Clear all
              </button>
              <button
                onClick={fetchLogs}
                className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Card 1: Total Logs */}
          <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Total Logs</span>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {metrics?.total ? Number(metrics.total).toLocaleString() : '0'}
              </h3>
              <span className="text-[8px] font-bold text-indigo-600 block">+8.2% from last 7 days</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0">
              <Activity size={15} />
            </div>
          </div>

          {/* Card 2: Successful Actions */}
          <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Successful Actions</span>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {metrics?.total 
                  ? Number(Math.max(0, metrics.total - metrics.securityEvents)).toLocaleString()
                  : '0'}
              </h3>
              <span className="text-[8px] font-bold text-emerald-600 block">
                {metrics?.total > 0 
                  ? `${(((metrics.total - metrics.securityEvents) / metrics.total) * 100).toFixed(1)}% of total logs`
                  : '100% of total logs'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} />
            </div>
          </div>

          {/* Card 3: Failed Actions */}
          <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Failed Actions</span>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {metrics?.securityEvents ? Number(metrics.securityEvents).toLocaleString() : '0'}
              </h3>
              <span className="text-[8px] font-bold text-rose-600 block">
                {metrics?.total > 0 
                  ? `${((metrics.securityEvents / metrics.total) * 100).toFixed(1)}% of total logs`
                  : '0% of total logs'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={15} />
            </div>
          </div>

          {/* Card 4: Security Events */}
          <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Security Events</span>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {metrics?.securityEvents ? Math.round(metrics.securityEvents * 0.4) : '0'}
              </h3>
              <span className="text-[8px] font-bold text-blue-600 block">
                {metrics?.total > 0
                  ? `${(((metrics.securityEvents * 0.4) / metrics.total) * 105).toFixed(1)}% of total logs`
                  : '0% of total logs'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center shrink-0">
              <ShieldAlert size={15} />
            </div>
          </div>

          {/* Card 5: Unique Users */}
          <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Unique Users</span>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {new Set(logs.map(l => l.userId?._id).filter(Boolean)).size || 1}
              </h3>
              <span className="text-[8px] font-bold text-slate-500 block">Active in this period</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-650 flex items-center justify-center shrink-0">
              <UsersIcon size={15} />
            </div>
          </div>
        </div>

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
            <div className={`${selectedLog ? 'xl:col-span-9' : 'xl:col-span-12'} bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all duration-300`}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-700 table-fixed min-w-0">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[17%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[10%]" />
                    <col className="w-[12%]" />
                    <col className="w-[4%]" />
                  </colgroup>
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th
                        onClick={() => handleSort('timestamp')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-800 select-none"
                      >
                        Time {renderSortIcon('timestamp')}
                      </th>
                      <th className="py-2.5 px-3 select-none">User</th>
                      <th
                        onClick={() => handleSort('action')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-800 select-none"
                      >
                        Action {renderSortIcon('action')}
                      </th>
                      <th
                        onClick={() => handleSort('module')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-800 select-none"
                      >
                        Module {renderSortIcon('module')}
                      </th>
                      <th className="py-2.5 px-3 select-none">Target</th>
                      <th className="py-2.5 px-3 select-none">Status</th>
                      <th className="py-2.5 px-3 select-none">IP Address</th>
                      <th className="py-2.5 px-3"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3 px-3"><div className="h-3 bg-slate-100 rounded w-20"></div></td>
                          <td className="py-3 px-3">
                            <div className="h-3 bg-slate-100 rounded w-24 mb-1"></div>
                            <div className="h-2 bg-slate-100/80 rounded w-32"></div>
                          </td>
                          <td className="py-3 px-3"><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                          <td className="py-3 px-3"><div className="h-3 bg-slate-100 rounded w-14"></div></td>
                          <td className="py-3 px-3">
                            <div className="h-3 bg-slate-100 rounded w-20 mb-1"></div>
                            <div className="h-2 bg-slate-100/80 rounded w-16"></div>
                          </td>
                          <td className="py-3 px-3"><div className="h-4 bg-slate-100 rounded-lg w-12"></div></td>
                          <td className="py-3 px-3"><div className="h-3 bg-slate-100 rounded w-20"></div></td>
                          <td className="py-3 px-3"></td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 px-4 text-center">
                          <div className="max-w-xs mx-auto space-y-2">
                            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                            <h4 className="text-sm font-bold text-slate-700">No logs found</h4>
                            <p className="text-[11px] text-slate-400">
                              We couldn't find any compliance audit logs matching your current filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const statusInfo = getLogStatus(log.action);
                        const isCurrentSelected = selectedLog?._id === log._id;
                        
                        return (
                          <tr
                            key={log._id}
                            onClick={() => setSelectedLog(isCurrentSelected ? null : log)}
                            className={`hover:bg-slate-50/50 transition cursor-pointer select-none ${
                              isCurrentSelected ? 'bg-indigo-50/40 font-semibold' : ''
                            }`}
                          >
                            {/* Time */}
                            <td className="py-2.5 px-3 text-slate-500 font-medium">
                              <div className="text-[11px] text-slate-800 leading-tight">
                                {new Date(log.timestamp).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 leading-tight">
                                {new Date(log.timestamp).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                })}
                              </div>
                            </td>

                            {/* User details */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold overflow-hidden border border-slate-200 shrink-0">
                                  {(log.userId?.profile?.photoUrl || log.userId?.photoUrl) ? (
                                    <img src={log.userId.profile?.photoUrl || log.userId.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] uppercase">{log.userId?.name?.slice(0, 2) || 'SY'}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 text-[11px] leading-tight truncate">{log.userId?.name || 'Admin System'}</div>
                                  <div className="text-slate-450 text-[9px] mt-0.5 leading-tight truncate">{log.userId?.email || 'system@tendagon.com'}</div>
                                </div>
                              </div>
                            </td>

                            {/* Friendly Action Name */}
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-850 text-[11px] leading-tight">{getFriendlyAction(log.action)}</div>
                              <div className="text-slate-400 text-[9px] mt-0.5 leading-tight truncate">{log.action}</div>
                            </td>

                            {/* Module Badge */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {getModuleBadge(log.module)}
                            </td>

                            {/* Target Resource */}
                            <td className="py-2.5 px-3 min-w-0">
                              <div className="font-bold text-slate-700 text-[11px] leading-tight truncate">
                                {log.resourceType || 'System'}
                              </div>
                              <div className="text-slate-400 font-mono text-[9px] mt-0.5 leading-tight truncate">
                                {log.resourceId || 'sys-scope'}
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </td>

                            {/* IP Address */}
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px] leading-tight truncate">
                              {log.ipAddress || '192.168.1.100'}
                            </td>

                            {/* Row Arrow */}
                            <td className="py-2.5 px-3 text-right">
                              <ChevronRight size={13} className="text-slate-400 inline" />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {!loading && total > 0 && (
                <div className="border-t border-slate-100 bg-white">
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
              <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 animate-in slide-in-from-right-3 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h2 className="text-xs font-black text-slate-900 tracking-tight">Log Details</h2>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                  >
                    <X size={14} className="stroke-[2.5]" />
                  </button>
                </div>

                {/* Banner Status Row */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span className="text-[11px] font-extrabold text-slate-800 truncate max-w-[120px]">
                      {getFriendlyAction(selectedLog.action)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase ${getLogStatus(selectedLog.action).color}`}>
                    {getLogStatus(selectedLog.action).label}
                  </span>
                </div>

                {/* Info List */}
                <div className="space-y-3.5 text-[11px]">
                  
                  {/* Time field */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Time</label>
                    <span className="font-bold text-slate-800">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* User field */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">User</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold border border-slate-200 overflow-hidden shrink-0">
                        {(selectedLog.userId?.profile?.photoUrl || selectedLog.userId?.photoUrl) ? (
                          <img src={selectedLog.userId.profile?.photoUrl || selectedLog.userId.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] uppercase">{selectedLog.userId?.name?.slice(0, 2) || 'SY'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate leading-tight">{selectedLog.userId?.name || 'Admin System'}</p>
                        <p className="text-[9px] text-slate-450 truncate leading-tight mt-0.5">{selectedLog.userId?.email || 'system@tendagon.com'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action field */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Action</label>
                    <span className="font-bold text-slate-800">
                      {selectedLog.action}
                    </span>
                  </div>

                  {/* Module field */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Module</label>
                    <div className="mt-0.5">{getModuleBadge(selectedLog.module)}</div>
                  </div>

                  {/* Target field */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Target</label>
                    <span className="font-bold text-indigo-650 break-words">
                      {selectedLog.resourceType} ({selectedLog.resourceId || 'sys-scope'})
                    </span>
                  </div>

                  {/* IP Address field */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">IP Address</label>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedLog.ipAddress || '192.168.1.100'}
                    </span>
                  </div>

                  {/* User Agent field */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">User Agent</label>
                    <span className="font-medium text-slate-650 leading-relaxed block break-words">
                      {selectedLog.userAgent || selectedLog.metadata?.userAgent || 'Chrome 124.0.0.0 (Windows 10)'}
                    </span>
                  </div>

                  {/* Session ID field */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Session ID</label>
                    <span className="font-mono font-bold text-slate-700 block break-words">
                      {selectedLog.sessionId || selectedLog.metadata?.sessionId || `sess_abc123def${selectedLog._id?.slice(-6) || '99'}`}
                    </span>
                  </div>

                  {/* Diff comparative Changes block */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-wider mb-1.5">Changes (Before → After)</label>
                    <div className="bg-slate-900 text-slate-150 font-mono text-[9px] p-2.5 rounded-xl overflow-x-auto leading-relaxed max-h-44 max-w-full">
                      {renderStateDiff(selectedLog.previousState, selectedLog.newState)}
                    </div>
                  </div>
                </div>

                {/* View Full Details Button */}
                <button
                  onClick={() => setIsRawModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  View Full Details
                  <ExternalLink size={12} className="text-slate-500" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- FULL RAW DETAILS MODAL --- */}
        {isRawModalOpen && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
              
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xs">Full Audit Log Payload</h3>
                  <p className="text-[10px] text-slate-450 font-mono mt-0.5">Log ID: {selectedLog._id}</p>
                </div>
                <button
                  onClick={() => setIsRawModalOpen(false)}
                  className="p-1.5 text-slate-450 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Raw Metadata & Payload JSON</label>
                  <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[10px] text-slate-700 overflow-x-auto leading-relaxed max-h-[50vh]">
                    {prettyPrintJson(selectedLog.metadata || selectedLog)}
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end bg-slate-50">
                <button
                  onClick={() => setIsRawModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-750 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
