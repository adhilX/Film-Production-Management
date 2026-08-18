import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, ShieldAlert, Users as UsersIcon } from 'lucide-react';

interface LogsStatsProps {
  metrics: any;
  uniqueUsersCount: number;
}

export const LogsStats: React.FC<LogsStatsProps> = ({ metrics, uniqueUsersCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* Total Logs */}
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

      {/* Successful Actions */}
      <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider block">Successful Actions</span>
          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
            {metrics?.total ? Number(Math.max(0, metrics.total - metrics.securityEvents)).toLocaleString() : '0'}
          </h3>
          <span className="text-[8px] font-bold text-emerald-650 block">
            {metrics?.total > 0
              ? `${(((metrics.total - metrics.securityEvents) / metrics.total) * 100).toFixed(1)}% of total logs`
              : '100% of total logs'}
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-655 flex items-center justify-center shrink-0">
          <CheckCircle2 size={15} />
        </div>
      </div>

      {/* Failed Actions */}
      <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider block">Failed Actions</span>
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

      {/* Security Events */}
      <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Security Events</span>
          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
            {metrics?.securityEvents ? Math.round(metrics.securityEvents * 0.4) : '0'}
          </h3>
          <span className="text-[8px] font-bold text-blue-655 block">
            {metrics?.total > 0
              ? `${(((metrics.securityEvents * 0.4) / metrics.total) * 105).toFixed(1)}% of total logs`
              : '0% of total logs'}
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center shrink-0">
          <ShieldAlert size={15} />
        </div>
      </div>

      {/* Unique Users */}
      <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">Unique Users</span>
          <h3 className="text-base font-extrabold text-slate-900 leading-tight">{uniqueUsersCount}</h3>
          <span className="text-[8px] font-bold text-slate-505 block">Active in this period</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-650 flex items-center justify-center shrink-0">
          <UsersIcon size={15} />
        </div>
      </div>
    </div>
  );
};

export default LogsStats;
