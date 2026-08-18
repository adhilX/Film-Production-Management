import React from 'react';
import { ClipboardList, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface ApprovalsStatsProps {
  metrics: {
    pending: number;
    approved: number;
    rejected: number;
    changesRequested: number;
  };
}

export const ApprovalsStats: React.FC<ApprovalsStatsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Pending Review */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50 shrink-0">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <span className="block text-xl font-bold text-slate-900 leading-none">{metrics.pending}</span>
          <span className="block text-xs font-bold text-slate-700 mt-1">Pending Review</span>
          <span className="block text-[10px] text-slate-400 font-semibold">Requires audit</span>
        </div>
      </div>

      {/* Approved */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="block text-xl font-bold text-slate-900 leading-none">{metrics.approved}</span>
          <span className="block text-xs font-bold text-slate-700 mt-1">Approved Users</span>
          <span className="block text-[10px] text-slate-400 font-semibold">Active on platform</span>
        </div>
      </div>

      {/* Changes Requested */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <span className="block text-xl font-bold text-slate-900 leading-none">{metrics.changesRequested}</span>
          <span className="block text-xs font-bold text-slate-700 mt-1">Changes Requested</span>
          <span className="block text-[10px] text-slate-400 font-semibold">Awaiting update</span>
        </div>
      </div>

      {/* Rejected */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100/50 shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <span className="block text-xl font-bold text-slate-900 leading-none">{metrics.rejected}</span>
          <span className="block text-xs font-bold text-slate-700 mt-1">Rejected Accounts</span>
          <span className="block text-[10px] text-slate-400 font-semibold">Access disabled</span>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsStats;
