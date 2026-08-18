'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { Clock, Search, Shield, User, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs();
      const sortedLogs = data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(sortedLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const searchString = `${log.action} ${log.actorId} ${log.targetId}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getActionIcon = (action: string) => {
    if (action.includes('USER')) return <User className="w-3 h-3" />;
    if (action.includes('ROLE')) return <Shield className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('CREATED')) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (action.includes('UPDATED')) return 'text-blue-700 bg-blue-50 border-blue-100';
    if (action.includes('DELETED') || action.includes('CHANGES_REQUESTED')) return 'text-rose-700 bg-rose-50 border-rose-100';
    return 'text-amber-700 bg-amber-50 border-amber-100';
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Action, Actor ID, or Target ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-250 rounded-xl pl-10 pr-4 py-2 text-slate-800 focus:outline-none focus:border-indigo-600 transition font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-xs font-bold font-mono">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          {logs.length} Events Logged
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4 font-bold">Timestamp</th>
                <th className="px-6 py-4 font-bold">Action</th>
                <th className="px-6 py-4 font-bold">Actor ID</th>
                <th className="px-6 py-4 font-bold">Target ID</th>
                <th className="px-6 py-4 font-bold">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      Fetching logs...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                    No audit logs match your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/40 transition border-b border-slate-100">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="text-slate-800 font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div className="text-slate-450 text-[10px] mt-0.5">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-extrabold uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {log.actorId}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-medium">
                      {log.targetId}
                    </td>
                    <td className="px-6 py-3.5 text-slate-550 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                      {log.metadata ? (
                        <>
                          {log.metadata.oldStatus && <span><span className="text-slate-400 font-semibold">Old:</span> {log.metadata.oldStatus} </span>}
                          {log.metadata.newStatus && <span><span className="text-slate-400 font-semibold">New:</span> {log.metadata.newStatus}</span>}
                        </>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
