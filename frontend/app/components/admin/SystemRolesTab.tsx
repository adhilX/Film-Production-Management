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
            className="bg-white border border-slate-200/85 rounded-2xl p-6 h-64 animate-pulse flex flex-col items-center justify-center gap-4"
          >
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ))
      ) : (
        roles.map((role) => {
          const isAdmin = role.name === 'Admin' || role.name === 'Super Admin' || role.name === 'Production Admin';
          const isManager = role.name.includes('Manager');

          return (
            <div
              key={role._id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-md transition duration-200 group flex flex-col shadow-xs"
            >
              <div
                className={`p-6 border-b border-slate-100 ${
                  isAdmin ? 'bg-red-50/20' : isManager ? 'bg-indigo-50/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isAdmin
                          ? 'bg-red-50 text-red-650'
                          : isManager
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isAdmin ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{role.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {role.permissions?.length || 0} Permissions
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onEditRole(role)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                    title="Edit Role Matrix"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50/25 flex-1">
                <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-3">
                  Granted Permissions
                </h4>
                {role.permissions && role.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.slice(0, 8).map((perm: any) => (
                      <span
                        key={perm._id || perm.id || perm}
                        className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded text-[9px] font-mono border border-slate-200/60"
                      >
                        {perm.name || perm}
                      </span>
                    ))}
                    {role.permissions.length > 8 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold font-mono border border-indigo-150">
                        +{role.permissions.length - 8} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic font-medium">No explicit permissions granted.</div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
