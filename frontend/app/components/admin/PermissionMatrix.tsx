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
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matrix permissions..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500/50 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                selectedGroupFilter === grp
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-900/20 text-slate-400 border border-slate-800/50 hover:text-slate-200'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-slate-900/20 border border-slate-800/50 rounded-2xl">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPermissions.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 bg-slate-900/10 border border-slate-800/30 rounded-2xl text-center p-6">
          <ShieldAlert className="w-10 h-10 text-slate-600 mb-3" />
          <h3 className="font-bold text-slate-400 text-sm">No permissions match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing or adjusting search filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-slate-900/30 border border-slate-800 rounded-2xl shadow-sm">
          <table className="w-full border-collapse text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[40%]">
                  Permission Description & String
                </th>
                {roles.map(role => (
                  <th 
                    key={role._id} 
                    className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredPermissions.map(perm => (
                <tr key={perm._id} className="hover:bg-slate-900/10 transition">
                  <td className="p-4 space-y-1">
                    <div className="text-sm font-semibold text-slate-200">
                      {perm.description || 'No description provided.'}
                    </div>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800/60 text-slate-400 rounded text-[10px] font-mono border border-slate-800">
                      {perm.name}
                    </div>
                    <span className="text-[9px] text-slate-500 ml-2 font-mono uppercase bg-slate-950/20 px-1 py-0.5 rounded border border-slate-900">
                      {perm.group || 'Custom'}
                    </span>
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
                            <div className="w-4.5 h-4.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={() => handleToggleMatrixPermission(role, perm._id)}
                              className="w-4.5 h-4.5 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0 transition cursor-pointer"
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
