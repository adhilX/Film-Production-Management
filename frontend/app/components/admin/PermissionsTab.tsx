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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by permission name or description..."
            className="w-full bg-white border border-slate-250 rounded-xl pl-10 pr-4 py-2 text-slate-900 text-xs focus:outline-none focus:border-indigo-650 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition cursor-pointer ${
              isFormOpen 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'border-slate-200 text-slate-705 bg-white hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {isFormOpen ? 'Hide Register Form' : 'Register Permission'}
            {isFormOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>
        </div>
      </div>

      {/* Expandable Register Permission Form */}
      {isFormOpen && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs animate-in slide-in-from-top-4 duration-200 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              Add Global Permission
            </h2>
            <p className="text-xs text-slate-450 mt-1 font-medium">
              Create a new permission string that can be mapped to roles in the permission matrix.
            </p>
          </div>

          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-750 font-medium">{formError}</p>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-755 font-medium">{formSuccess}</p>
            </div>
          )}

          <form onSubmit={handleAddPermission} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                Permission String (Name)
              </label>
              <input
                type="text"
                value={newPermName}
                onChange={(e) => setNewPermName(e.target.value)}
                required
                placeholder="e.g. costumes.burn"
                className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-650 transition font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                Description / Label
              </label>
              <input
                type="text"
                value={newPermDesc}
                onChange={(e) => setNewPermDesc(e.target.value)}
                placeholder="e.g. Burn costumes in store"
                className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-650 transition text-xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1 w-full">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  Category Group
                </label>
                <select
                  value={newPermGroup}
                  onChange={(e) => setNewPermGroup(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-650 transition appearance-none cursor-pointer"
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
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 h-[42px] min-w-[130px] cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                {isSubmittingPerm ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Group category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-450 mr-2 shrink-0 font-bold">
          <Filter className="w-3.5 h-3.5" />
          <span>Group Filter:</span>
        </div>
        {groupsList.map((grp) => (
          <button
            key={grp}
            onClick={() => setSelectedGroupFilter(grp)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedGroupFilter === grp
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs'
                : 'bg-slate-50 text-slate-450 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {grp}
          </button>
        ))}
      </div>

      {/* Filter Result Counter */}
      <div className="text-xs text-slate-450 flex justify-between items-center font-bold">
        <span>
          Showing {filteredPermissions.length} of {permissions.length} permissions
        </span>
        {(searchQuery || selectedGroupFilter !== 'All') && (
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedGroupFilter('All');
            }}
            className="text-indigo-650 hover:underline cursor-pointer"
          >
            Reset Search Filters
          </button>
        )}
      </div>

      {/* Permission List Grid */}
      <div className="space-y-6">
        {permLoading && permissions.length === 0 ? (
          <div className="flex justify-center items-center h-64 bg-white border border-slate-200/80 rounded-2xl animate-pulse shadow-xs">
            <div className="w-8 h-8 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 bg-white border border-slate-200/80 rounded-2xl text-center p-6 shadow-xs">
            <ShieldAlert className="w-8 h-8 text-slate-400 mb-3" />
            <h3 className="font-bold text-slate-650 text-xs">No permissions match your criteria</h3>
            <p className="text-[11px] text-slate-450 mt-1 max-w-xs font-medium">
              Try adjusting your search queries or selecting a different category group filter.
            </p>
          </div>
        ) : (
          Object.keys(groupedFilteredPermissions).map((groupName) => (
            <div key={groupName} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-650" />
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">{groupName}</h3>
              </div>

              <div className="divide-y divide-slate-100">
                {groupedFilteredPermissions[groupName].map((perm: any) => {
                  const assignedRoles = getRolesWithPermission(perm._id || perm.id);

                  return (
                    <div key={perm._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/50 transition">
                      <div className="space-y-1.5 flex-1">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono border border-slate-200/60">
                          <Tag className="w-3 h-3 text-indigo-600" />
                          {perm.name}
                        </span>
                        <p className="text-xs text-slate-600 font-medium pl-0.5 leading-relaxed">
                          {perm.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Assigned Roles badges */}
                      <div className="flex flex-col items-start sm:items-end gap-1.5 min-w-[200px]">
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                          Assigned Roles
                        </span>
                        <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                          {assignedRoles.length > 0 ? (
                            assignedRoles.map((role) => {
                              const isAdmin = role.name === 'Admin' || role.name === 'Super Admin' || role.name === 'Production Admin';
                              const isManager = role.name.includes('Manager');
                              return (
                                <span
                                  key={role._id}
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                                    isAdmin
                                      ? 'bg-red-50 border-red-100 text-red-750'
                                      : isManager
                                      ? 'bg-indigo-50 border-indigo-100 text-indigo-755'
                                      : 'bg-slate-100 border-slate-200 text-slate-650'
                                  }`}
                                >
                                  {role.name}
                                </span>
                              );
                            })
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-205 font-bold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
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
