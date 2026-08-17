'use client';

import { useEffect, useState } from 'react';
import { axiosClient as api } from '@/lib/axios';
import { Activity, Clock, Search, Shield, User, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      // Sort logs by timestamp descending if not already sorted by backend
      const sortedLogs = res.data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
    if (action.includes('USER')) return <User className="w-4 h-4" />;
    if (action.includes('ROLE')) return <Shield className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('CREATED')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-900/50';
    if (action.includes('UPDATED')) return 'text-blue-400 bg-blue-400/10 border-blue-900/50';
    if (action.includes('DELETED') || action.includes('CHANGES_REQUESTED')) return 'text-red-400 bg-red-400/10 border-red-900/50';
    return 'text-amber-400 bg-amber-400/10 border-amber-900/50';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="w-8 h-8 text-amber-500" />
            System Audit Logs
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Chronological record of high-privilege system activities and configuration changes.
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-300 text-sm font-mono">
          <Clock className="w-4 h-4 text-slate-500" />
          {logs.length} Events Logged
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-900/50 p-4 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by Action, Actor ID, or Target ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 transition font-mono text-sm"
          />
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Actor ID</th>
                <th className="px-6 py-4 font-semibold">Target ID</th>
                <th className="px-6 py-4 font-semibold">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      Fetching logs...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-mono text-xs">
                    No audit logs match your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition group font-mono text-[11px]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-300">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-semibold tracking-wide ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {log.actorId}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {log.targetId}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                      {log.metadata ? (
                        <>
                          {log.metadata.oldStatus && <span><span className="text-slate-600">Old:</span> {log.metadata.oldStatus} </span>}
                          {log.metadata.newStatus && <span><span className="text-slate-600">New:</span> {log.metadata.newStatus}</span>}
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
