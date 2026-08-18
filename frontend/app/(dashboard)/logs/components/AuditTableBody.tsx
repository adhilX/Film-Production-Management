'use client';

import React from 'react';

interface AuditTableBodyProps {
  logs: any[];
  loading: boolean;
}

export const AuditTableBody: React.FC<AuditTableBodyProps> = ({ logs, loading }) => {
  const formatMetadata = (metadata?: Record<string, any>) => {
    if (!metadata) return <span className="text-slate-400 italic font-medium">None</span>;
    
    return (
      <div className="space-y-1">
        {Object.entries(metadata).map(([key, value]) => {
          // Clean up the key names for display
          const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          
          // Clean up values (e.g. format amounts)
          let displayValue = String(value);
          if (key === 'amount' && typeof value === 'number') {
            displayValue = `$${value.toLocaleString()}`;
          }

          return (
            <div key={key} className="text-[11px] leading-relaxed">
              <span className="font-bold text-slate-500">{displayKey.trim()}:</span>{' '}
              <span className="text-slate-800 font-semibold truncate max-w-xs inline-block align-bottom" title={displayValue}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <tbody className="divide-y divide-slate-100 bg-white">
        {[...Array(5)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-20"></div></td>
            <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-28"></div></td>
            <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-24"></div></td>
            <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-16"></div></td>
            <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-20"></div></td>
            <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-36"></div></td>
          </tr>
        ))}
      </tbody>
    );
  }

  if (logs.length === 0) {
    return (
      <tbody className="bg-white">
        <tr>
          <td colSpan={6} className="py-8 px-4 text-center text-slate-400 font-medium">
            No audit logs found matching your criteria.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-slate-100 bg-white">
      {logs.map((log) => (
        <tr key={log._id} className="hover:bg-slate-50/40 transition">
          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
            {new Date(log.timestamp || log.createdAt).toLocaleString()}
          </td>
          <td className="py-3.5 px-4 whitespace-nowrap">
            <div className="font-bold text-slate-800">{log.userId?.name || 'Unknown User'}</div>
            <div className="text-slate-450 text-[10px] font-medium mt-0.5">{log.userId?.email || 'N/A'}</div>
          </td>
          <td className="py-3.5 px-4 whitespace-nowrap">
            <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
              log.action?.includes('DENIAL') || log.action?.includes('REJECTED') ? 'bg-rose-50 border-rose-100 text-rose-700' :
              log.action?.includes('APPROVED') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
              'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              {log.action}
            </span>
          </td>
          <td className="py-3.5 px-4 whitespace-nowrap text-slate-705 font-bold">
            {log.module || log.resourceType || 'SYSTEM'}
          </td>
          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[10px]">
            {log.ipAddress || 'Unknown IP'}
          </td>
          <td className="py-3.5 px-4 text-slate-600 font-medium">
            {formatMetadata(log.metadata)}
            {!log.metadata && log.previousState && (
              <div className="text-[11px] mt-1">
                <span className="text-slate-400 line-through mr-2">{log.previousState}</span>
                <span className="text-slate-700 font-semibold">➔ {log.newState}</span>
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  );
};
