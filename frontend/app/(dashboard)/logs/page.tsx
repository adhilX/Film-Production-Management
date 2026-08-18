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
  FolderSync
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
  const [scopeAllProjects, setScopeAllProjects] = useState(false); // Top toggle for Super Admin

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Details Modal state
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <ChevronUp className="w-3 h-3 inline ml-1 text-indigo-600" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1 text-indigo-600" />
    );
  };

  const handleViewLog = (log: any) => {
    setSelectedLog(log);
    setIsModalOpen(true);
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
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs text-rose-800 font-bold">Access Denied: You do not have the required permissions (audit_logs.view) to view the system audit logs.</span>
        </div>
      </div>
    }>
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-indigo-600" />
              Compliance Audit Logs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isSuperAdmin
                ? 'System-wide compliance audit trail and resource mutation logs.'
                : `Compliance audit logs for active project: ${selectedProduction?.title || 'None selected'}.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={() => setScopeAllProjects(!scopeAllProjects)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                  scopeAllProjects
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FolderSync className="w-4 h-4" />
                {scopeAllProjects ? 'Viewing All Projects' : 'Scoped to Sidebar Project'}
              </button>
            )}
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Activity Logs</span>
              <h3 className="text-2xl font-bold text-slate-800">{metrics?.total ?? 0}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-650">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security & Denial Events</span>
              <h3 className="text-2xl font-bold text-rose-650">{metrics?.securityEvents ?? 0}</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-650">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuration Modifications</span>
              <h3 className="text-2xl font-bold text-slate-800">{metrics?.configChanges ?? 0}</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Search Query</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by action, module, resource ID, IP, user name/email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="w-full md:w-48">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Module</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
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
          </div>

          <div className="w-full md:w-48">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
            >
              <option value="All">All Actions</option>
              {/* Funds */}
              <option value="BUDGET_UPDATED">BUDGET_UPDATED</option>
              <option value="FUND_REQUEST_CREATED">FUND_REQUEST_CREATED</option>
              <option value="FUND_REQUEST_UPDATED">FUND_REQUEST_UPDATED</option>
              <option value="FUND_REQUEST_APPROVED">FUND_REQUEST_APPROVED</option>
              <option value="FUND_REQUEST_REJECTED">FUND_REQUEST_REJECTED</option>
              {/* Locations */}
              <option value="LOCATION_CREATED">LOCATION_CREATED</option>
              <option value="LOCATION_UPDATED">LOCATION_UPDATED</option>
              <option value="LOCATION_DELETED">LOCATION_DELETED</option>
              <option value="LOCATION_BOOKING_CREATED">LOCATION_BOOKING_CREATED</option>
              <option value="LOCATION_BOOKING_APPROVED">LOCATION_BOOKING_APPROVED</option>
              <option value="LOCATION_BOOKING_REJECTED">LOCATION_BOOKING_REJECTED</option>
              <option value="LOCATION_BOOKING_CANCELLED">LOCATION_BOOKING_CANCELLED</option>
              {/* Costumes */}
              <option value="COSTUME_CREATED">COSTUME_CREATED</option>
              <option value="COSTUME_UPDATED">COSTUME_UPDATED</option>
              <option value="COSTUME_DELETED">COSTUME_DELETED</option>
              <option value="COSTUME_ASSIGNED">COSTUME_ASSIGNED</option>
              <option value="COSTUME_RETURNED">COSTUME_RETURNED</option>
              {/* Projects */}
              <option value="PROJECT_CREATED">PROJECT_CREATED</option>
              <option value="PROJECT_UPDATED">PROJECT_UPDATED</option>
              <option value="CAST_ASSIGNED">CAST_ASSIGNED</option>
              <option value="CREW_ASSIGNED">CREW_ASSIGNED</option>
              <option value="CHARACTER_CREATED">CHARACTER_CREATED</option>
              <option value="CHARACTER_UPDATED">CHARACTER_UPDATED</option>
              {/* User management & Onboarding */}
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="USER_UPDATED">USER_UPDATED</option>
              <option value="USER_ONBOARDING_APPROVED">USER_ONBOARDING_APPROVED</option>
              <option value="USER_ONBOARDING_CHANGES_REQUESTED">USER_ONBOARDING_CHANGES_REQUESTED</option>
              <option value="ROLE_CREATED">ROLE_CREATED</option>
              <option value="ROLE_PERMISSIONS_UPDATED">ROLE_PERMISSIONS_UPDATED</option>
              {/* Security */}
              <option value="SECURITY_DENIAL">SECURITY_DENIAL</option>
              <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
            </select>
          </div>
        </div>

        {/* Error State */}
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

        {/* Data Table */}
        {!error && (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th
                      onClick={() => handleSort('timestamp')}
                      className="py-3 px-4 font-bold cursor-pointer hover:text-slate-800 select-none"
                    >
                      Timestamp {renderSortIcon('timestamp')}
                    </th>
                    <th className="py-3 px-4 font-bold select-none">User</th>
                    <th
                      onClick={() => handleSort('action')}
                      className="py-3 px-4 font-bold cursor-pointer hover:text-slate-800 select-none"
                    >
                      Action {renderSortIcon('action')}
                    </th>
                    <th
                      onClick={() => handleSort('module')}
                      className="py-3 px-4 font-bold cursor-pointer hover:text-slate-800 select-none"
                    >
                      Module {renderSortIcon('module')}
                    </th>
                    <th
                      onClick={() => handleSort('resourceType')}
                      className="py-3 px-4 font-bold cursor-pointer hover:text-slate-800 select-none"
                    >
                      Resource {renderSortIcon('resourceType')}
                    </th>
                    <th
                      onClick={() => handleSort('ipAddress')}
                      className="py-3 px-4 font-bold cursor-pointer hover:text-slate-800 select-none"
                    >
                      IP Address {renderSortIcon('ipAddress')}
                    </th>
                    <th className="py-3 px-4 font-bold text-right select-none">Actions</th>
                  </tr>
                </thead>

                {loading ? (
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4.5 px-4"><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                        <td className="py-4.5 px-4">
                          <div className="h-3 bg-slate-100 rounded w-28 mb-1.5"></div>
                          <div className="h-2 bg-slate-100/80 rounded w-36"></div>
                        </td>
                        <td className="py-4.5 px-4"><div className="h-4 bg-slate-100 rounded-lg w-28"></div></td>
                        <td className="py-4.5 px-4"><div className="h-3 bg-slate-100 rounded w-16"></div></td>
                        <td className="py-4.5 px-4">
                          <div className="h-3 bg-slate-100 rounded w-16 mb-1.5"></div>
                          <div className="h-2 bg-slate-100/80 rounded w-24"></div>
                        </td>
                        <td className="py-4.5 px-4"><div className="h-3 bg-slate-100 rounded w-24"></div></td>
                        <td className="py-4.5 px-4 text-right"><div className="h-6 bg-slate-100 rounded-lg w-12 ml-auto"></div></td>
                      </tr>
                    ))}
                  </tbody>
                ) : logs.length === 0 ? (
                  <tbody className="bg-white">
                    <tr>
                      <td colSpan={7} className="py-12 px-4 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <AlertTriangle className="w-8 h-8 text-slate-350 mx-auto" />
                          <h4 className="text-sm font-bold text-slate-700">No logs found</h4>
                          <p className="text-[11px] text-slate-450">
                            We couldn't find any compliance audit logs matching your current filters or scoping.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/40 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-650 font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{log.userId?.name || 'System / Unregistered'}</div>
                          <div className="text-slate-450 text-[10px] font-medium mt-0.5">{log.userId?.email || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                            log.action?.includes('DENIAL') || log.action?.includes('REJECTED') || log.action?.includes('FAILED')
                              ? 'bg-rose-50 border-rose-100 text-rose-700'
                              : log.action?.includes('APPROVED')
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-blue-50 border-blue-100 text-blue-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-705 font-bold">
                          {log.module || 'SYSTEM'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-700">{log.resourceType}</div>
                          <div className="text-slate-400 font-mono text-[9px] mt-0.5">{log.resourceId}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[10px]">
                          {log.ipAddress || 'Internal'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleViewLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:text-indigo-650 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && logs.length > 0 && (
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
                itemName="logs"
              />
            )}
          </div>
        )}

        {/* Read-Only Log Details Modal */}
        {isModalOpen && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Audit Log Entry Details</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {selectedLog._id}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action</label>
                    <span className="px-2 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase bg-indigo-50 border-indigo-100 text-indigo-700">
                      {selectedLog.action}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timestamp</label>
                    <p className="font-semibold text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actor User</label>
                    <p className="font-bold text-slate-800">{selectedLog.userId?.name || 'System / Unregistered'}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">{selectedLog.userId?.email || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">IP Address</label>
                    <p className="font-semibold text-slate-700 font-mono">{selectedLog.ipAddress || 'Internal/Unknown'}</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Module</label>
                    <p className="font-bold text-slate-800">{selectedLog.module || 'SYSTEM'}</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resource Context</label>
                    <p className="font-semibold text-slate-700">{selectedLog.resourceType}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedLog.resourceId}</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Metadata JSON */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Metadata Payload</label>
                  <pre className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 font-mono text-[10px] text-slate-750 overflow-x-auto leading-relaxed max-h-48">
                    {prettyPrintJson(selectedLog.metadata)}
                  </pre>
                </div>

                {/* Previous & New State comparison */}
                {(selectedLog.previousState || selectedLog.newState) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Previous State</label>
                      <pre className="bg-rose-50/40 border border-rose-100/80 rounded-xl p-3.5 font-mono text-[10px] text-rose-900 overflow-x-auto leading-relaxed max-h-48">
                        {prettyPrintJson(selectedLog.previousState)}
                      </pre>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New State</label>
                      <pre className="bg-emerald-50/40 border border-emerald-100/80 rounded-xl p-3.5 font-mono text-[10px] text-emerald-900 overflow-x-auto leading-relaxed max-h-48">
                        {prettyPrintJson(selectedLog.newState)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
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
