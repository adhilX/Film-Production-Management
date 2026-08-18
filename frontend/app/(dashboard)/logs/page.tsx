'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '@/services/adminService';
import { AuditFilterBar } from './components/AuditFilterBar';
import { AuditTableBody } from './components/AuditTableBody';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await adminService.getAuditLogs();
        setLogs(data || []);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Apply Search (across IP, Action, Module, UserId, or Details)
      const searchLower = search.toLowerCase();
      const matchesSearch = search === '' || 
        log.ipAddress?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.module?.toLowerCase().includes(searchLower) ||
        log.userId?.name?.toLowerCase().includes(searchLower) ||
        log.userId?.email?.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.metadata || {}).toLowerCase().includes(searchLower);

      // Apply Module Filter
      const logModule = log.module || log.resourceType || '';
      const matchesModule = moduleFilter === 'All' || logModule === moduleFilter;

      // Apply Action Filter
      const matchesAction = actionFilter === 'All' || log.action === actionFilter;

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [logs, search, moduleFilter, actionFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, moduleFilter, actionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      <AuditFilterBar 
        search={search} setSearch={setSearch}
        moduleFilter={moduleFilter} setModuleFilter={setModuleFilter}
        actionFilter={actionFilter} setActionFilter={setActionFilter}
      />

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">User</th>
                <th className="py-3 px-4 font-bold">Action</th>
                <th className="py-3 px-4 font-bold">Module</th>
                <th className="py-3 px-4 font-bold">IP Address</th>
                <th className="py-3 px-4 font-bold">Details</th>
              </tr>
            </thead>
            <AuditTableBody logs={paginatedLogs} loading={loading} />
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && filteredLogs.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p>
                  Showing <span className="font-bold text-slate-700">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="font-bold text-slate-700">
                    {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-700">{filteredLogs.length}</span> results
                </p>
              </div>
              <div>
                <nav className="inline-flex rounded-xl shadow-xs gap-1" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
