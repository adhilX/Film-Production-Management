'use client';

import { useState } from 'react';
import { 
  Key, Folder, Tag, AlertTriangle, CheckCircle, Search, Filter, 
  ChevronDown, ChevronUp, SlidersHorizontal, Plus, ShieldAlert 
} from 'lucide-react';
import { adminService } from '@/services/adminService';

interface PermissionsTabProps {
  permissions: any[];
  roles: any[];
  permLoading: boolean;
  onRefreshPermissions: () => Promise<void>;
}

export default function PermissionsTab({
  permissions,
  roles,
  permLoading,
  onRefreshPermissions
}: PermissionsTabProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // New permission form state
  const [newPermName, setNewPermName] = useState('');
  const [newPermDesc, setNewPermDesc] = useState('');
  const [newPermGroup, setNewPermGroup] = useState('User & Auth Perms');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmittingPerm, setIsSubmittingPerm] = useState(false);

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermName.trim()) return;

    setIsSubmittingPerm(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await adminService.createPermission({
        name: newPermName.trim().toLowerCase(),
        description: newPermDesc.trim() || undefined,
        group: newPermGroup,
      });

      setNewPermName('');
      setNewPermDesc('');
      setFormSuccess(`Permission "${newPermName.trim().toLowerCase()}" created successfully!`);
      
      setTimeout(() => setFormSuccess(null), 4000);
      await onRefreshPermissions();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.response?.data?.message || 'Failed to create permission.');
    } finally {
      setIsSubmittingPerm(false);
    }
  };

  const getRolesWithPermission = (permId: string) => {
    return roles.filter((role) =>
      (role.permissions || []).some((p: any) => (p._id || p.id || p) === permId)
    );
  };

  const filteredPermissions = permissions.filter((perm) => {
    const matchesSearch = 
      perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (perm.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroupFilter === 'All' || perm.group === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  const groupedFilteredPermissions = filteredPermissions.reduce((acc: Record<string, any[]>, perm) => {
    const groupName = perm.group || 'Custom Perms';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(perm);
    return acc;
  }, {});

  const groupsList = ['All', 'User & Auth Perms', 'Production Perms', 'Financial Perms', 'Custom Perms'];

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Action Button */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by permission name or description..."
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold transition ${
              isFormOpen 
                ? 'bg-slate-800 border-slate-700 text-amber-400' 
                : 'border-slate-800 text-slate-300 hover:bg-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {isFormOpen ? 'Hide Register Form' : 'Register Permission'}
            {isFormOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 animate-bounce" />}
          </button>
        </div>
      </div>

      {/* Expandable Register Permission Form */}
      {isFormOpen && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-200">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Add Global Permission
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Create a new permission string that can be mapped to roles in the permission matrix.
            </p>
          </div>

          {formError && (
            <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{formError}</p>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-xl flex items-start gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-200">{formSuccess}</p>
            </div>
          )}

          <form onSubmit={handleAddPermission} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Permission String (Name)
              </label>
              <input
                type="text"
                value={newPermName}
                onChange={(e) => setNewPermName(e.target.value)}
                required
                placeholder="e.g. costumes.burn"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Description / Label
              </label>
              <input
                type="text"
                value={newPermDesc}
                onChange={(e) => setNewPermDesc(e.target.value)}
                placeholder="e.g. Burn costumes in store"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category Group
                </label>
                <select
                  value={newPermGroup}
                  onChange={(e) => setNewPermGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 transition text-sm"
                >
                  <option value="User & Auth Perms">User & Auth Perms</option>
                  <option value="Production Perms">Production Perms</option>
                  <option value="Financial Perms">Financial Perms</option>
                  <option value="Custom Perms">Custom Perms / Other</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPerm}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-900/20 transition disabled:opacity-50 h-[42px] min-w-[150px]"
              >
                <Plus className="w-5 h-5" />
                {isSubmittingPerm ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Group category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/40">
        <div className="flex items-center gap-2 text-xs text-slate-500 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Group Filter:</span>
        </div>
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

      {/* Filter Result Counter */}
      <div className="text-xs text-slate-500 flex justify-between items-center">
        <span>
          Showing {filteredPermissions.length} of {permissions.length} permissions
        </span>
        {(searchQuery || selectedGroupFilter !== 'All') && (
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedGroupFilter('All');
            }}
            className="text-amber-500 hover:underline"
          >
            Reset Search Filters
          </button>
        )}
      </div>

      {/* Permission List Grid */}
      <div className="space-y-6">
        {permLoading && permissions.length === 0 ? (
          <div className="flex justify-center items-center h-64 bg-slate-900/20 border border-slate-800/50 rounded-2xl animate-pulse">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 bg-slate-900/10 border border-slate-800/30 rounded-2xl text-center p-6">
            <ShieldAlert className="w-10 h-10 text-slate-600 mb-3" />
            <h3 className="font-bold text-slate-400 text-sm">No permissions match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Try adjusting your search queries or selecting a different category group filter.
            </p>
          </div>
        ) : (
          Object.keys(groupedFilteredPermissions).map((groupName) => (
            <div key={groupName} className="bg-slate-900/20 border border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-900/40 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wider">{groupName}</h3>
              </div>

              <div className="divide-y divide-slate-800/40">
                {groupedFilteredPermissions[groupName].map((perm: any) => {
                  const assignedRoles = getRolesWithPermission(perm._id || perm.id);

                  return (
                    <div key={perm._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-900/10 transition">
                      <div className="space-y-1.5 flex-1">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
                          <Tag className="w-3 h-3 text-amber-500" />
                          {perm.name}
                        </span>
                        <p className="text-sm text-slate-400 pl-0.5">
                          {perm.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Assigned Roles badges */}
                      <div className="flex flex-col items-start sm:items-end gap-1.5 min-w-[200px]">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          Assigned Roles
                        </span>
                        <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                          {assignedRoles.length > 0 ? (
                            assignedRoles.map((role) => {
                              const isAdmin = role.name === 'Admin';
                              const isManager = role.name.includes('Manager');
                              return (
                                <span
                                  key={role._id}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                    isAdmin
                                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                      : isManager
                                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                                  }`}
                                >
                                  {role.name}
                                </span>
                              );
                            })
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-500/80 italic font-medium bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              Not assigned to any role
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
