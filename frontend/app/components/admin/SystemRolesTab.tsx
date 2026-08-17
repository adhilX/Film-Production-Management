'use client';

import { ShieldCheck, ShieldAlert, Edit2 } from 'lucide-react';

interface SystemRolesTabProps {
  roles: any[];
  loading: boolean;
  onEditRole: (role: any) => void;
}

export default function SystemRolesTab({
  roles,
  loading,
  onEditRole
}: SystemRolesTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        [1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 h-64 animate-pulse flex flex-col items-center justify-center gap-4"
          >
            <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ))
      ) : (
        roles.map((role) => {
          const isAdmin = role.name === 'Admin';
          const isManager = role.name.includes('Manager');

          return (
            <div
              key={role._id}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-amber-500/30 transition group flex flex-col"
            >
              <div
                className={`p-6 border-b border-slate-800 ${
                  isAdmin ? 'bg-red-950/10' : isManager ? 'bg-blue-950/10' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isAdmin
                          ? 'bg-red-500/20 text-red-400'
                          : isManager
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isAdmin ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{role.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {role.permissions?.length || 0} Permissions
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditRole(role)}
                    className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition"
                    title="Edit Permission Matrix"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-950/20 flex-1">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Granted Permissions
                </h4>
                {role.permissions && role.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.slice(0, 8).map((perm: any) => (
                      <span
                        key={perm._id || perm.id || perm}
                        className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700"
                      >
                        {perm.name || perm}
                      </span>
                    ))}
                    {role.permissions.length > 8 && (
                      <span className="px-2 py-1 bg-amber-950/30 text-amber-500 rounded text-[10px] font-mono border border-amber-900/50">
                        +{role.permissions.length - 8} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic">No explicit permissions granted.</div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
