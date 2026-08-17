'use client';

import React, { useState, useEffect } from 'react';
import { FileLock2 } from 'lucide-react';
import adminService from '@/services/adminService';

export default function AuditLogsModule() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const data = await adminService.getAuditLogs();
      setAuditLogs(data);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Compliance Audit Logs</h2>
        <p className="text-xs text-slate-400 mt-1">Read-only transaction history logs of all resource state changes.</p>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
          <FileLock2 size={16} /> Audit Trail
        </h3>

        {auditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-350">
              <thead className="bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource Type</th>
                  <th className="py-3 px-4">State Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {auditLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString();
                  return (
                    <tr key={log._id} className="hover:bg-slate-950/20">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{dateStr}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200 block">{log.userId?.name}</span>
                        <span className="text-[10px] text-slate-500 block">{log.userId?.email}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-purple-400">{log.action}</td>
                      <td className="py-3 px-4">{log.resourceType}</td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400">{log.previousState}</span>
                        <span className="mx-2 text-slate-600">➔</span>
                        <span className="text-emerald-450 font-semibold">{log.newState}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-6">No audit trails recorded yet.</div>
        )}

      </div>
    </div>
  );
}
