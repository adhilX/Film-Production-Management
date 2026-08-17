'use client';

import { useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { adminService } from '@/services/adminService';

interface PermissionMatrixProps {
  roles: any[];
  permissions: any[];
  onRefreshRoles: () => Promise<void>;
  loading: boolean;
}

export default function PermissionMatrix({
  roles,
  permissions,
  onRefreshRoles,
  loading
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const handleToggleMatrixPermission = async (role: any, permId: string) => {
    const cellKey = `${role._id}-${permId}`;
    setUpdatingCell(cellKey);

    try {
      const currentPermIds = (role.permissions || []).map((p: any) => p._id || p.id || p);
      const updatedPermIds = currentPermIds.includes(permId)
        ? currentPermIds.filter((id: string) => id !== permId)
        : [...currentPermIds, permId];

      await adminService.updateRole(role._id, { permissions: updatedPermIds });
      await onRefreshRoles();
    } catch (err) {
      console.error('Failed to toggle matrix permission:', err);
    } finally {
      setUpdatingCell(null);
    }
  };

  const groupsList = ['All', 'User & Auth Perms', 'Production Perms', 'Financial Perms', 'Custom Perms'];

  const filteredPermissions = permissions.filter((perm) => {
    const matchesSearch = 
      perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (perm.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroupFilter === 'All' || perm.group === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* Controls: Search & Category Filter pills */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matrix permissions..."
            className="w-full bg-white border border-slate-250 rounded-xl pl-10 pr-10 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-650 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-650 cursor-pointer font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {groupsList.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroupFilter(grp)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedGroupFilter === grp
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                  : 'bg-slate-50 text-slate-450 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPermissions.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 bg-white border border-slate-200/80 rounded-2xl text-center p-6 shadow-xs">
          <ShieldAlert className="w-8 h-8 text-slate-400 mb-3" />
          <h3 className="font-bold text-slate-600 text-xs">No permissions match your criteria</h3>
          <p className="text-[11px] text-slate-450 mt-1 font-medium">Try clearing or adjusting search filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <table className="w-full border-collapse text-left min-w-[600px] text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="p-4 font-bold w-[40%]">
                  Permission Description & String
                </th>
                {roles.map(role => (
                  <th 
                    key={role._id} 
                    className="p-4 font-bold text-center"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermissions.map(perm => (
                <tr key={perm._id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800">
                      {perm.description || 'No description provided.'}
                    </div>
                    <div className="flex items-center">
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-mono border border-slate-200/60">
                        {perm.name}
                      </div>
                      <span className="text-[9px] text-indigo-650 font-bold uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 ml-2">
                        {perm.group || 'Custom'}
                      </span>
                    </div>
                  </td>

                  {roles.map(role => {
                    const hasPermission = (role.permissions || []).some(
                      (p: any) => (p._id || p.id || p) === perm._id
                    );
                    const cellKey = `${role._id}-${perm._id}`;
                    const isCellUpdating = updatingCell === cellKey;

                    return (
                      <td key={role._id} className="p-4 text-center">
                        <div className="flex items-center justify-center">
                          {isCellUpdating ? (
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={() => handleToggleMatrixPermission(role, perm._id)}
                              className="w-4.5 h-4.5 rounded border-slate-350 bg-white text-indigo-650 focus:ring-indigo-650/20 focus:ring-offset-0 transition cursor-pointer"
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
