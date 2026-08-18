import React from 'react';
import { Crown, Shield, Users, ChevronRight, Edit2, Trash2, Info, Check, Minus } from 'lucide-react';

interface RoleDetailsPanelProps {
  selectedRole: any | null;
  permissions: any[];
  userCounts: Record<string, number>;
  onEditRole: (role: any) => void;
  onDeleteRoleClick: () => void;
  getRoleDescription: (roleName: string) => string;
  getPermissionStatus: (role: any, permissionId: string, permissionGroup: string) => string;
}

export const RoleDetailsPanel: React.FC<RoleDetailsPanelProps> = ({
  selectedRole,
  permissions,
  userCounts,
  onEditRole,
  onDeleteRoleClick,
  getRoleDescription,
  getPermissionStatus,
}) => {
  let allowedCount = 0;
  let deniedCount = 0;
  let noAccessCount = 0;

  if (selectedRole) {
    permissions.forEach((p) => {
      const status = getPermissionStatus(selectedRole, p._id, p.group);
      if (status === 'allow') allowedCount++;
      else if (status === 'deny') deniedCount++;
      else noAccessCount++;
    });
  }

  return (
    <div className="xl:col-span-3 space-y-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <h2 className="text-xs font-black text-slate-900 border-b border-slate-105 pb-2">Role Details</h2>

        {selectedRole ? (
          <>
            {/* Selected Role Header Card */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-150 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                {selectedRole.name.toLowerCase().includes('super admin') ? (
                  <Crown size={16} />
                ) : (
                  <Shield size={16} />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-normal">{selectedRole.name}</h3>
                <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[8px] font-bold uppercase">
                  System Role
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Description</h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {getRoleDescription(selectedRole.name)}
              </p>
            </div>

            {/* Users Assignment */}
            <div className="space-y-1">
              <h4 className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Users with this role</h4>
              <div className="flex justify-between items-center bg-slate-50/50 border border-slate-150 rounded-xl p-2.5 text-xs text-slate-750">
                <div className="flex items-center gap-2 font-bold text-slate-850">
                  <Users size={13} className="text-slate-400" />
                  <span>
                    {userCounts[selectedRole._id] || 0}{' '}
                    {(userCounts[selectedRole._id] || 0) === 1 ? 'user' : 'users'}
                  </span>
                </div>
                <a
                  href={`/users?role=${selectedRole._id}`}
                  className="text-xs font-bold text-indigo-650 hover:underline flex items-center gap-0.5 transition"
                >
                  View users
                  <ChevronRight size={13} />
                </a>
              </div>
            </div>

            {/* Permissions Summary breakdown */}
            <div className="space-y-2.5">
              <h4 className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Role Permissions Summary</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-750">
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                    <span className="text-slate-650 font-medium">Full Access</span>
                  </div>
                  <span className="text-slate-900">{allowedCount} permissions</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-755">
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                      <Minus size={10} className="stroke-[3]" />
                    </div>
                    <span className="text-slate-655 font-medium">Restricted</span>
                  </div>
                  <span className="text-slate-900">{deniedCount} permissions</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-755">
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Minus size={8} className="stroke-[3]" />
                    </div>
                    <span className="text-slate-650 font-medium">No Access</span>
                  </div>
                  <span className="text-slate-900">{noAccessCount} permissions</span>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between items-center text-xs font-bold text-slate-850">
                  <span>Total Permissions</span>
                  <span>{permissions.length}</span>
                </div>
              </div>
            </div>

            {/* Role Actions */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-[9px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">Role Actions</h4>
              <button
                onClick={() => onEditRole(selectedRole)}
                className="w-full py-1.5 border border-indigo-600/30 bg-white hover:bg-slate-50 text-indigo-655 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit2 size={12} />
                Edit Role
              </button>
              <button
                onClick={onDeleteRoleClick}
                className="w-full py-1.5 border border-rose-205 bg-white hover:bg-rose-50/50 text-rose-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} />
                Delete Role
              </button>
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-xs text-slate-400 font-medium">No role selected.</div>
        )}
      </div>

      {/* Info Callout Banner */}
      <div className="p-3 bg-indigo-50/55 border border-indigo-150 rounded-xl flex items-start gap-2.5 text-indigo-900 text-xs">
        <Info size={15} className="text-indigo-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed font-semibold">
          Changes to roles and permissions will be applied to all users with this role. Please review carefully before making
          changes.
        </span>
      </div>
    </div>
  );
};

export default RoleDetailsPanel;
