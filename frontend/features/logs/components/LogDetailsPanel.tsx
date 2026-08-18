import React from 'react';
import { X, CheckCircle2, ExternalLink } from 'lucide-react';

interface LogDetailsPanelProps {
  selectedLog: any;
  onClose: () => void;
  getFriendlyAction: (action: string) => string;
  getLogStatus: (action: string) => { label: string; color: string };
  getModuleBadge: (mod: string) => React.ReactNode;
  onOpenRawModal: () => void;
}

export const LogDetailsPanel: React.FC<LogDetailsPanelProps> = ({
  selectedLog,
  onClose,
  getFriendlyAction,
  getLogStatus,
  getModuleBadge,
  onOpenRawModal,
}) => {
  const renderStateDiff = (prev: any, next: any) => {
    if (!prev && !next) {
      return <div className="text-slate-500 italic">No state changes logged.</div>;
    }
    try {
      const prevObj = typeof prev === 'string' ? JSON.parse(prev || '{}') : prev || {};
      const nextObj = typeof next === 'string' ? JSON.parse(next || '{}') : next || {};
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
                  <span>
                    "{key}": {JSON.stringify(prevVal)},
                  </span>
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

  return (
    <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 animate-in slide-in-from-right-3 duration-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h2 className="text-xs font-black text-slate-900 tracking-tight">Log Details</h2>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-lg transition cursor-pointer"
        >
          <X size={14} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Banner Status Row */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span className="text-[11px] font-bold text-slate-805 truncate max-w-[120px]">
            {getFriendlyAction(selectedLog.action)}
          </span>
        </div>
        <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${getLogStatus(selectedLog.action).color}`}>
          {getLogStatus(selectedLog.action).label}
        </span>
      </div>

      {/* Info List */}
      <div className="space-y-3.5 text-[11px] font-semibold text-slate-600">
        {/* Time field */}
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Time</label>
          <span className="font-bold text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
        </div>

        {/* User field */}
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">User</label>
          <div className="flex items-center gap-2 mt-0.5 font-semibold">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold border border-slate-200 overflow-hidden shrink-0">
              {selectedLog.userId?.profile?.photoUrl || selectedLog.userId?.photoUrl ? (
                <img
                  src={selectedLog.userId.profile?.photoUrl || selectedLog.userId.photoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
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
          <span className="font-bold text-slate-850">{selectedLog.action}</span>
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
          <span className="font-mono font-bold text-slate-700">{selectedLog.ipAddress || '192.168.1.100'}</span>
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
          <span className="font-mono font-bold text-slate-750 block break-words">
            {selectedLog.sessionId ||
              selectedLog.metadata?.sessionId ||
              `sess_abc123def${selectedLog._id?.slice(-6) || '99'}`}
          </span>
        </div>

        {/* Diff comparative Changes block */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-[8px] font-black text-slate-450 uppercase tracking-wider mb-1.5">
            Changes (Before → After)
          </label>
          <div className="bg-slate-900 text-slate-150 font-mono text-[9px] p-2.5 rounded-xl overflow-x-auto leading-relaxed max-h-44 max-w-full">
            {renderStateDiff(selectedLog.previousState, selectedLog.newState)}
          </div>
        </div>
      </div>

      {/* View Full Details Button */}
      <button
        onClick={onOpenRawModal}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
      >
        View Full Details
        <ExternalLink size={12} className="text-slate-500" />
      </button>
    </div>
  );
};

export default LogDetailsPanel;
