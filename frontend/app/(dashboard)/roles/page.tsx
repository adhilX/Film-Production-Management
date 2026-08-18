'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import RoleEditModal from '@/app/components/admin/RoleEditModal';
import { Pagination } from '@/app/components/Pagination';
import { 
  Shield, 
  Plus, 
  Search, 
  MoreVertical, 
  Check, 
  Minus, 
  BookOpen, 
  Crown, 
  Briefcase, 
  Monitor, 
  DollarSign, 
  Shirt, 
  MapPin, 
  Users, 
  AlertTriangle,
  X,
  Info,
  ShieldCheck,
  Edit2,
  Trash2,
  ChevronRight
} from 'lucide-react';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [permLoading, setPermLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & selection states
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  // Pagination states for permissions matrix
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [permSearchQuery, setPermSearchQuery] = useState('');

  // Reset page when search query or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [permSearchQuery, pageSize]);

  // Guide Modal State
  const [showGuide, setShowGuide] = useState(false);

  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalRole, setEditModalRole] = useState<any | null>(null);

  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.systemRoleId?.name?.toLowerCase() === 'super admin';
  const canManage = user?.permissions?.includes('roles.manage');

  const CORE_ROLES = ['Super Admin', 'Production Admin', 'Production Manager', 'Cast', 'Crew'];

  const formatError = (err: any, defaultMsg: string): string => {
    if (err.response?.status === 403) {
      return "You don't have permission to perform this action.";
    }
    const message = err.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message || err.message || defaultMsg;
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getRoles();
      setRoles(data);
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      setError(formatError(err, 'Failed to load system roles.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermLoading(true);
      setError(null);
      const data = await adminService.getPermissions();
      setPermissions(data);
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err);
      setError(formatError(err, 'Failed to load permissions list.'));
    } finally {
      setPermLoading(false);
    }
  };

  const fetchUserCounts = async () => {
    try {
      const usersResult = await adminService.getUsers({ limit: 1000 });
      const counts: Record<string, number> = {};
      usersResult.users.forEach((u: any) => {
        const roleId = u.systemRoleId?._id || u.systemRoleId;
        if (roleId) {
          counts[roleId] = (counts[roleId] || 0) + 1;
        }
      });
      setUserCounts(counts);
    } catch (err) {
      console.error('Failed to fetch user counts:', err);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUserCounts();
  }, []);

  // Update selected role reference when roles refresh
  useEffect(() => {
    if (roles.length > 0) {
      if (!selectedRole) {
        setSelectedRole(roles[0]);
      } else {
        const fresh = roles.find((r) => r._id === selectedRole._id);
        if (fresh) {
          setSelectedRole(fresh);
        }
      }
    }
  }, [roles]);

  const handleEditRole = (role: any) => {
    setEditModalRole(role);
    setIsModalOpen(true);
  };

  const handleCreateRole = () => {
    setEditModalRole(null);
    setIsModalOpen(true);
  };

  const handleDeleteRoleClick = () => {
    if (!selectedRole) return;
    
    // Core system roles check
    if (CORE_ROLES.includes(selectedRole.name)) {
      alert(`Core system role "${selectedRole.name}" is protected and cannot be deleted.`);
      return;
    }

    // Custom roles are allowed to be deleted theoretically, but backend doesn't support DELETE /admin/roles/:id.
    // So we show a clean message preserving system security.
    alert('For security and audit trail integrity, system roles cannot be hard-deleted. You can modify their permissions to revoke access.');
  };

  // Toggling permissions inside matrix
  const handleToggleMatrixPermission = async (role: any, permId: string) => {
    if (!canManage) return;
    if (role.name === 'Super Admin') return;
    if (CORE_ROLES.includes(role.name) && !isSuperAdmin) return;

    const cellKey = `${role._id}-${permId}`;
    setUpdatingCell(cellKey);

    const currentPermIds = (role.permissions || []).map((p: any) => p._id || p.id || p);
    const hasPerm = currentPermIds.includes(permId);
    
    const updatedPermIds = hasPerm
      ? currentPermIds.filter((id: string) => id !== permId)
      : [...currentPermIds, permId];

    // Optimistic UI Update
    const originalRoles = [...roles];
    setRoles(
      roles.map((r) => {
        if (r._id === role._id) {
          const toggledPermissions = hasPerm
            ? r.permissions.filter((p: any) => (p._id || p.id || p) !== permId)
            : [...r.permissions, { _id: permId }];
          return { ...r, permissions: toggledPermissions };
        }
        return r;
      })
    );

    try {
      await adminService.updateRole(role._id, { permissions: updatedPermIds });
      // Keep track of change in audit log trigger
      await fetchRoles();
      setSuccess(`Permissions updated successfully for "${role.name}".`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to toggle matrix permission:', err);
      setRoles(originalRoles);
      setError(formatError(err, 'Failed to update role permissions.'));
    } finally {
      setUpdatingCell(null);
    }
  };

  // Role Style Mapper
  const getRoleStyle = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('super admin')) {
      return {
        icon: Crown,
        bg: 'bg-purple-50 text-purple-600',
        borderColor: 'border-purple-200',
        activeBg: 'bg-purple-50/50 border-purple-300',
      };
    }
    if (name.includes('project manager') || name.includes('production admin')) {
      return {
        icon: Briefcase,
        bg: 'bg-emerald-50 text-emerald-600',
        borderColor: 'border-emerald-250',
        activeBg: 'bg-emerald-50/40 border-emerald-300',
      };
    }
    if (name.includes('production manager')) {
      return {
        icon: Monitor,
        bg: 'bg-blue-50 text-blue-600',
        borderColor: 'border-blue-200',
        activeBg: 'bg-blue-50/40 border-blue-300',
      };
    }
    if (name.includes('finance') || name.includes('budget')) {
      return {
        icon: DollarSign,
        bg: 'bg-amber-50 text-amber-600',
        borderColor: 'border-amber-200',
        activeBg: 'bg-amber-50/40 border-amber-300',
      };
    }
    if (name.includes('costume')) {
      return {
        icon: Shirt,
        bg: 'bg-violet-50 text-violet-600',
        borderColor: 'border-violet-200',
        activeBg: 'bg-violet-50/40 border-violet-300',
      };
    }
    if (name.includes('location')) {
      return {
        icon: MapPin,
        bg: 'bg-rose-50 text-rose-600',
        borderColor: 'border-rose-200',
        activeBg: 'bg-rose-50/40 border-rose-300',
      };
    }
    if (name.includes('cast') || name.includes('crew')) {
      return {
        icon: Users,
        bg: 'bg-cyan-50 text-cyan-600',
        borderColor: 'border-cyan-200',
        activeBg: 'bg-cyan-50/40 border-cyan-300',
      };
    }
    return {
      icon: Shield,
      bg: 'bg-slate-50 text-slate-600',
      borderColor: 'border-slate-200',
      activeBg: 'bg-slate-50/40 border-slate-300',
    };
  };

  // Role Description Mapper
  const getRoleDescription = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('super admin')) return 'Full system access with all permissions.';
    if (name.includes('project manager') || name.includes('production admin')) return 'Manage projects, financial approvals, cast & crew lists.';
    if (name.includes('production manager')) return 'Manage daily operations, locations, costumes, schedule, and equipment.';
    if (name.includes('finance') || name.includes('budget')) return 'Approve or reject fund requests, review budgets and financial logs.';
    if (name.includes('costume')) return 'Catalog costume assets, log stock quantity, and assign wardrobe items.';
    if (name.includes('location')) return 'Log locations, verify map coordinates, and manage location bookings.';
    if (name.includes('cast') || name.includes('crew')) return 'Access general dashboard, view assigned costumes, and request funds.';
    return 'Custom system role with customized permissions.';
  };

  // Permission Status Mapper (Allow / Deny / No Access)
  const getPermissionStatus = (role: any, permissionId: string, permissionGroup: string) => {
    const currentPermIds = (role.permissions || []).map((p: any) => p._id || p.id || p);
    const hasPermission = currentPermIds.includes(permissionId);
    if (hasPermission) return 'allow';

    const roleName = role.name.toLowerCase();
    if (roleName === 'super admin') return 'deny';
    if (roleName.includes('cast') || roleName.includes('crew')) return 'no_access';

    const group = (permissionGroup || '').toLowerCase();
    if (roleName.includes('costume')) {
      return group.includes('costume') ? 'deny' : 'no_access';
    }
    if (roleName.includes('location')) {
      return group.includes('location') ? 'deny' : 'no_access';
    }
    if (roleName.includes('finance') || roleName.includes('budget')) {
      return group.includes('fund') || group.includes('budget') ? 'deny' : 'no_access';
    }

    return 'deny';
  };

  // Filter roles list by search query
  const filteredRolesList = roles.filter((role) =>
    role.name.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  // Filter permissions by search query first
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

  // Group and sort permissions for the current page
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

  // Calculate permission metrics for active role details sidebar
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

  // Calculate dynamic column width to distribute remaining width equally without overflow
  const roleColWidth = roles.length > 0 ? `${68 / roles.length}%` : '13.6%';

  return (
    <PermissionGuard permission="roles.view">
      <div className="w-full px-4 md:px-5 lg:px-6 py-4 space-y-4 animate-in fade-in duration-300">
        
        {/* Error / Success Banners */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3">
            <div className="text-red-750 text-xs font-bold w-full flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-[10px] text-red-500 hover:text-red-700 underline font-bold cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3">
            <div className="text-emerald-750 text-xs font-bold w-full flex items-center justify-between">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="text-[10px] text-emerald-500 hover:text-emerald-750 underline font-bold cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-650 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Shield size={18} className="fill-white/10" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Roles & Permissions</h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Manage user roles and their access permissions across the system.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <BookOpen size={13} className="text-slate-500" />
              Permission Guide
            </button>
            <button
              onClick={handleCreateRole}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              <Plus size={13} />
              Create Role
            </button>
          </div>
        </div>

        {/* --- THREE COLUMN LAYOUT --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
          
          {/* COLUMN 1: Roles List (Width: 3/12) */}
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
                          <span className="text-[9px] text-slate-450 font-medium">
                            {userCount} {userCount === 1 ? 'user' : 'users'}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
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
              onClick={handleCreateRole}
              className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} className="text-slate-500" />
              Add Role
            </button>
          </div>

          {/* COLUMN 2: Permissions Matrix (Width: 6/12) */}
          <div className="xl:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <h2 className="text-xs font-black text-slate-900">Permissions Matrix</h2>
              
              {/* Legend */}
              <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    <Check size={7} className="stroke-[3]" />
                  </div>
                  <span>Allow</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                    <Minus size={7} className="stroke-[3]" />
                  </div>
                  <span>Deny</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Minus size={7} className="stroke-[3]" />
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
                      <th key={r._id} className="py-2 px-0.5 text-[8px] font-extrabold text-center uppercase tracking-tight whitespace-normal break-words leading-tight">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permLoading ? (
                    <tr>
                      <td colSpan={roles.length + 1} className="py-10 text-center text-slate-400 font-medium">
                        Loading matrix...
                      </td>
                    </tr>
                  ) : sortedGroups.map((group) => (
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
                              !canManage || 
                              role.name === 'Super Admin' || 
                              (CORE_ROLES.includes(role.name) && !isSuperAdmin);

                            return (
                              <td key={role._id} className="py-1.5 px-1 text-center">
                                <div className="flex items-center justify-center">
                                  {isCellUpdating ? (
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <button
                                      disabled={isCheckboxDisabled}
                                      onClick={() => handleToggleMatrixPermission(role, perm._id)}
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              page={currentPage}
              pages={totalPages}
              total={totalPermissions}
              limit={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onLimitChange={(l) => {
                setPageSize(l);
                setCurrentPage(1);
              }}
              itemName="permissions"
            />
          </div>

          {/* COLUMN 3: Role Details (Width: 3/12) */}
          <div className="xl:col-span-3 space-y-4">
            
            {/* Details Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
              <h2 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2">Role Details</h2>

              {selectedRole ? (
                <>
                  {/* Selected Role Header Card */}
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-150 rounded-xl p-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600`}>
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
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {getRoleDescription(selectedRole.name)}
                    </p>
                  </div>

                  {/* Users Assignment */}
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Users with this role</h4>
                    <div className="flex justify-between items-center bg-slate-50/50 border border-slate-150 rounded-xl p-2.5 text-xs text-slate-750">
                      <div className="flex items-center gap-2 font-bold text-slate-850">
                        <Users size={13} className="text-slate-400" />
                        <span>{userCounts[selectedRole._id] || 0} { (userCounts[selectedRole._id] || 0) === 1 ? 'user' : 'users' }</span>
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
                      
                      <div className="flex justify-between items-center text-xs font-bold text-slate-750">
                        <div className="flex items-center gap-2">
                          <div className="w-4.5 h-4.5 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                            <Minus size={10} className="stroke-[3]" />
                          </div>
                          <span className="text-slate-650 font-medium">Restricted</span>
                        </div>
                        <span className="text-slate-900">{deniedCount} permissions</span>
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-slate-750">
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
                    <h4 className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Role Actions</h4>
                    <button
                      onClick={() => handleEditRole(selectedRole)}
                      className="w-full py-1.5 border border-indigo-600/30 bg-white hover:bg-slate-50 text-indigo-655 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 size={12} />
                      Edit Role
                    </button>
                    <button
                      onClick={handleDeleteRoleClick}
                      className="w-full py-1.5 border border-rose-200 bg-white hover:bg-rose-50/50 text-rose-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
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
            <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl flex items-start gap-2.5 text-indigo-900 text-xs">
              <Info size={15} className="text-indigo-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">
                Changes to roles and permissions will be applied to all users with this role. Please review carefully before making changes.
              </span>
            </div>

          </div>

        </div>

        {/* --- GUIDE MODAL --- */}
        {showGuide && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-650" />
                  Permission Matrix Guide
                </h3>
                <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-700 max-h-[60vh] overflow-y-auto pr-1">
                <p>
                  The permission matrix defines access levels for user roles in the system. Access is categorized in three states:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Check size={11} className="stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-slate-900 font-bold block">Allow</strong>
                      <span className="text-slate-500 font-medium">Users with this role are explicitly allowed to perform the action.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Minus size={11} className="stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-slate-900 font-bold block">Deny</strong>
                      <span className="text-slate-500 font-medium">Users with this role are explicitly denied access. Toggling allowed cells will set them to Deny.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                      <Minus size={9} className="stroke-[3]" />
                    </div>
                    <div>
                      <strong className="text-slate-900 font-bold block">No Access</strong>
                      <span className="text-slate-500 font-medium">The permission is out of scope for the role and is disabled by default.</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-3 mt-4 text-[11px] text-amber-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/50 font-medium flex gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>Only administrators with "Manage Roles & RBAC" permissions can edit the matrix. Changes take effect immediately.</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setShowGuide(false)}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- EDIT / CREATE MODAL --- */}
        <RoleEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          role={editModalRole}
          onSave={fetchRoles}
        />
      </div>
    </PermissionGuard>
  );
}
