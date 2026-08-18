import React from 'react';
import { Search, Plus, MoreVertical, Crown, Shield, Briefcase, Monitor, DollarSign, Shirt, MapPin, Users } from 'lucide-react';

interface RolesListProps {
  roles: any[];
  roleSearchQuery: string;
  setRoleSearchQuery: (val: string) => void;
  selectedRole: any | null;
  setSelectedRole: (role: any) => void;
  userCounts: Record<string, number>;
  onEditRole: (role: any) => void;
  onCreateRole: () => void;
  loading: boolean;
  getRoleStyle: (roleName: string) => any;
}

export const RolesList: React.FC<RolesListProps> = ({
  roles,
  roleSearchQuery,
  setRoleSearchQuery,
  selectedRole,
  setSelectedRole,
  userCounts,
  onEditRole,
  onCreateRole,
  loading,
  getRoleStyle,
}) => {
  const filteredRolesList = roles.filter((role) =>
    role.name.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  return (
    <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
          Roles
          <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
            {roles.length}
          </span>
        </h2>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search roles..."
          value={roleSearchQuery}
          onChange={(e) => setRoleSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-655 transition"
        />
      </div>

      {/* Roles List */}
      <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">Loading roles...</div>
        ) : filteredRolesList.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">No roles match.</div>
        ) : (
          filteredRolesList.map((role) => {
            const style = getRoleStyle(role.name);
            const isSelected = selectedRole?._id === role._id;
            const Icon = style.icon;
            const userCount = userCounts[role._id] || 0;

            return (
              <div
                key={role._id}
                onClick={() => setSelectedRole(role)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? `${style.activeBg} border-indigo-650 bg-indigo-50/20`
                    : 'bg-white border-slate-150 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 leading-normal">{role.name}</h3>
                    <span className="text-[9px] text-slate-450 font-semibold">
                      {userCount} {userCount === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRole(role);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg transition"
                >
                  <MoreVertical size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Add Role Button */}
      <button
        onClick={onCreateRole}
        className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-55 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Plus size={13} className="text-slate-500" />
        Add Role
      </button>
    </div>
  );
};

export default RolesList;
