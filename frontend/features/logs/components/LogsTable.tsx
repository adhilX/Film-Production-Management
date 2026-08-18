import React from 'react';
import { ChevronUp, ChevronDown, AlertTriangle, Settings, Briefcase, DollarSign, MapPin, Shirt, ShieldAlert, ChevronRight, Users as UsersIcon } from 'lucide-react';

interface LogsTableProps {
  logs: any[];
  loading: boolean;
  selectedLog: any;
  onSelectLog: (log: any) => void;
  onSort: (field: string) => void;
  renderSortIcon: (field: string) => React.ReactNode;
  getFriendlyAction: (action: string) => string;
  getModuleBadge: (mod: string) => React.ReactNode;
  getLogStatus: (action: string) => { label: string; color: string };
}

export const LogsTable: React.FC<LogsTableProps> = ({
  logs,
  loading,
  selectedLog,
  onSelectLog,
  onSort,
  renderSortIcon,
  getFriendlyAction,
  getModuleBadge,
  getLogStatus,
}) => {
  return (
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
      <thead className="bg-slate-50 text-slate-505 uppercase text-[9px] font-bold tracking-wider border-b border-slate-200">
        <tr>
          <th onClick={() => onSort('timestamp')} className="py-2.5 px-3 cursor-pointer hover:text-slate-800 select-none">
            Time {renderSortIcon('timestamp')}
          </th>
          <th className="py-2.5 px-3 select-none">User</th>
          <th onClick={() => onSort('action')} className="py-2.5 px-3 cursor-pointer hover:text-slate-800 select-none">
            Action {renderSortIcon('action')}
          </th>
          <th onClick={() => onSort('module')} className="py-2.5 px-3 cursor-pointer hover:text-slate-800 select-none">
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
              <td className="py-3 px-3">
                <div className="h-3 bg-slate-100 rounded w-20"></div>
              </td>
              <td className="py-3 px-3">
                <div className="h-3 bg-slate-100 rounded w-24 mb-1"></div>
                <div className="h-2 bg-slate-100/80 rounded w-32"></div>
              </td>
              <td className="py-3 px-3">
                <div className="h-3 bg-slate-100 rounded w-24"></div>
              </td>
              <td className="py-3 px-3">
                <div className="h-3 bg-slate-100 rounded w-14"></div>
              </td>
              <td className="py-3 px-3">
                <div className="h-3 bg-slate-100 rounded w-20 mb-1"></div>
                <div className="h-2 bg-slate-100/80 rounded w-16"></div>
              </td>
              <td className="py-3 px-3">
                <div className="h-4 bg-slate-100 rounded-lg w-12"></div>
              </td>
              <td className="py-3 px-3">
                <div className="h-3 bg-slate-100 rounded w-20"></div>
              </td>
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
                onClick={() => onSelectLog(isCurrentSelected ? null : log)}
                className={`hover:bg-slate-50/50 transition cursor-pointer select-none ${
                  isCurrentSelected ? 'bg-indigo-50/40 font-bold' : ''
                }`}
              >
                {/* Time */}
                <td className="py-2.5 px-3 text-slate-500 font-medium">
                  <div className="text-[11px] text-slate-800 leading-tight">
                    {new Date(log.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-[10px] text-slate-405 font-mono mt-0.5 leading-tight">
                    {new Date(log.timestamp).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })}
                  </div>
                </td>

                {/* User details */}
                <td className="py-2.5 px-3 font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold overflow-hidden border border-slate-200 shrink-0">
                      {log.userId?.profile?.photoUrl || log.userId?.photoUrl ? (
                        <img
                          src={log.userId.profile?.photoUrl || log.userId.photoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] uppercase">{log.userId?.name?.slice(0, 2) || 'SY'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-850 text-[11px] leading-tight truncate">
                        {log.userId?.name || 'Admin System'}
                      </div>
                      <div className="text-slate-450 text-[9px] mt-0.5 leading-tight truncate">
                        {log.userId?.email || 'system@tendagon.com'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Friendly Action Name */}
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-850 text-[11px] leading-tight">
                    {getFriendlyAction(log.action)}
                  </div>
                  <div className="text-slate-400 text-[9px] mt-0.5 leading-tight truncate">{log.action}</div>
                </td>

                {/* Module Badge */}
                <td className="py-2.5 px-3 whitespace-nowrap">{getModuleBadge(log.module)}</td>

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
                  <span
                    className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase tracking-wider ${statusInfo.color}`}
                  >
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
  );
};

export default LogsTable;
