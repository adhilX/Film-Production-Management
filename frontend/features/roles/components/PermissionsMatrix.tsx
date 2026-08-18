import React from 'react';
import { Search, Check, Minus, X } from 'lucide-react';
import { Pagination } from '@/app/components/Pagination';

interface PermissionsMatrixProps {
  roles: any[];
  permissions: any[];
  permLoading: boolean;
  permSearchQuery: string;
  setPermSearchQuery: (val: string) => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  updatingCell: string | null;
  canManage: boolean;
  isSuperAdmin: boolean;
  CORE_ROLES: string[];
  getPermissionStatus: (role: any, permissionId: string, permissionGroup: string) => string;
  onToggleMatrixPermission: (role: any, permId: string) => Promise<void>;
  roleColWidth: string;
}

export const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({
  roles,
  permissions,
  permLoading,
  permSearchQuery,
  setPermSearchQuery,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  updatingCell,
  canManage,
  isSuperAdmin,
  CORE_ROLES,
  getPermissionStatus,
  onToggleMatrixPermission,
  roleColWidth,
}) => {
  const filteredPermissions = permissions.filter((perm) => {
    const term = permSearchQuery.toLowerCase();
    const nameMatch = perm.name.toLowerCase().includes(term);
    const descMatch = (perm.description || '').toLowerCase().includes(term);
    const groupMatch = (perm.group || '').toLowerCase().includes(term);
    return nameMatch || descMatch || groupMatch;
  });

  const totalPermissions = filteredPermissions.length;
  const totalPages = Math.ceil(totalPermissions / pageSize);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(totalPermissions, startIndex + pageSize);
  const currentPermissions = filteredPermissions.slice(startIndex, endIndex);

  const GROUP_ORDER = ['Projects', 'Funds', 'Locations', 'Costumes & Assets', 'Users', 'Logs', 'Roles & Permissions'];

  const groupedPermissions: Record<string, any[]> = {};
  currentPermissions.forEach((perm) => {
    const groupName = perm.group || 'Custom Perms';
    if (!groupedPermissions[groupName]) {
      groupedPermissions[groupName] = [];
    }
    groupedPermissions[groupName].push(perm);
  });

  const sortedGroups = Object.keys(groupedPermissions).sort((a, b) => {
    const idxA = GROUP_ORDER.indexOf(a);
    const idxB = GROUP_ORDER.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return (
    <div className="xl:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <h2 className="text-xs font-black text-slate-900">Permissions Matrix</h2>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Check size={8} className="stroke-[3]" />
            </div>
            <span>Allow</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
              <Minus size={8} className="stroke-[3]" />
            </div>
            <span>Deny</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-200 flex items-center justify-center text-slate-405 shrink-0">
              <Minus size={8} className="stroke-[3]" />
            </div>
            <span>No Access</span>
          </div>
        </div>
      </div>

      {/* Permission Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
        <input
          type="text"
          placeholder="Search permissions..."
          value={permSearchQuery}
          onChange={(e) => setPermSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-8.5 pr-8 py-1.5 text-[11px] text-slate-700 placeholder-slate-450 focus:outline-none transition font-semibold"
        />
        {permSearchQuery && (
          <button
            onClick={() => setPermSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 cursor-pointer flex items-center"
          >
            <X size={12} className="stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full border-collapse text-left text-xs table-fixed min-w-0">
          <colgroup>
            <col className="w-[32%]" />
            {roles.map((r) => (
              <col key={r._id} style={{ width: roleColWidth }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[9px] font-bold uppercase tracking-wider">
              <th className="py-2 pl-3.5 pr-2 font-bold w-[32%]">Permissions</th>
              {roles.map((r) => (
                <th
                  key={r._id}
                  className="py-2 px-0.5 text-[8px] font-extrabold text-center uppercase tracking-tight whitespace-normal break-words leading-tight"
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permLoading ? (
              <tr>
                <td colSpan={roles.length + 1} className="py-10 text-center text-slate-405 font-semibold">
                  Loading matrix...
                </td>
              </tr>
            ) : (
              sortedGroups.map((group) => (
                <React.Fragment key={group}>
                  {/* Section Title Row */}
                  <tr className="bg-slate-50/60 font-black text-indigo-600 tracking-wider text-[8px] uppercase border-y border-slate-200/50">
                    <td colSpan={roles.length + 1} className="py-1.5 px-2.5">
                      {group === 'Projects' ? 'PRODUCTIONS' : group.toUpperCase()}
                    </td>
                  </tr>

                  {/* Group Permissions */}
                  {groupedPermissions[group].map((perm) => (
                    <tr key={perm._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-1.5 pl-3.5 pr-2 text-[11px] font-semibold text-slate-700 leading-tight truncate">
                        {perm.description || perm.name}
                      </td>
                      {roles.map((role) => {
                        const status = getPermissionStatus(role, perm._id, perm.group);
                        const cellKey = `${role._id}-${perm._id}`;
                        const isCellUpdating = updatingCell === cellKey;
                        const isCheckboxDisabled =
                          !canManage || role.name === 'Super Admin' || (CORE_ROLES.includes(role.name) && !isSuperAdmin);

                        return (
                          <td key={role._id} className="py-1.5 px-1 text-center">
                            <div className="flex items-center justify-center">
                              {isCellUpdating ? (
                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <button
                                  disabled={isCheckboxDisabled}
                                  onClick={() => onToggleMatrixPermission(role, perm._id)}
                                  className={`focus:outline-none transition shrink-0 ${
                                    isCheckboxDisabled ? 'opacity-85 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'
                                  }`}
                                >
                                  {status === 'allow' && (
                                    <div className="w-4.5 h-4.5 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                                      <Check size={10} className="stroke-[3]" />
                                    </div>
                                  )}
                                  {status === 'deny' && (
                                    <div className="w-4.5 h-4.5 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                                      <Minus size={10} className="stroke-[3]" />
                                    </div>
                                  )}
                                  {status === 'no_access' && (
                                    <div className="w-4.5 h-4.5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                      <Minus size={8} className="stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        page={currentPage}
        pages={totalPages}
        total={totalPermissions}
        limit={pageSize}
        onPageChange={setCurrentPage}
        onLimitChange={(l) => {
          setPageSize(l);
          setCurrentPage(1);
        }}
        itemName="permissions"
      />
    </div>
  );
};

export default PermissionsMatrix;
