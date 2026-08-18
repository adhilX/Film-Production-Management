'use client';

import React from 'react';
import { PermissionGuard } from '@/app/components/permission-guard';
import { UnauthorizedFallback } from '@/components/common/UnauthorizedFallback';
import { PERMISSIONS } from '@/constants/permissions';
import { Shield, BookOpen, Plus, Crown, Briefcase, Monitor, DollarSign, Shirt, MapPin, Users } from 'lucide-react';

// Central hook & subcomponents
import { useRoles } from '@/features/roles/hooks/useRoles';
import { RolesList } from '@/features/roles/components/RolesList';
import { PermissionsMatrix } from '@/features/roles/components/PermissionsMatrix';
import { RoleDetailsPanel } from '@/features/roles/components/RoleDetailsPanel';
import { PermissionGuideModal } from '@/features/roles/components/PermissionGuideModal';

// Existing legacy modals (relative imports preserved, paths updated to relative)
import RoleEditModal from '@/app/components/admin/RoleEditModal';

export default function AdminRolesPage() {
  const {
    roles,
    permissions,
    loading,
    permLoading,
    error,
    setError,
    success,
    setSuccess,
    roleSearchQuery,
    setRoleSearchQuery,
    selectedRole,
    setSelectedRole,
    userCounts,
    updatingCell,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    permSearchQuery,
    setPermSearchQuery,
    showGuide,
    setShowGuide,
    isModalOpen,
    setIsModalOpen,
    editModalRole,
    isSuperAdmin,
    canManage,
    CORE_ROLES,
    fetchRoles,
    handleEditRole,
    handleCreateRole,
    handleDeleteRoleClick,
    handleToggleMatrixPermission,
  } = useRoles();

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

  // Calculate dynamic column width to distribute remaining width equally without overflow
  const roleColWidth = roles.length > 0 ? `${68 / roles.length}%` : '13.6%';

  return (
    <PermissionGuard permission={PERMISSIONS.ROLES_VIEW} fallback={<UnauthorizedFallback />}>
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
              <p className="text-[11px] text-slate-500 font-semibold">
                Manage user roles and their access permissions across the system.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-255 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <BookOpen size={13} className="text-slate-550" />
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
          <RolesList
            roles={roles}
            roleSearchQuery={roleSearchQuery}
            setRoleSearchQuery={setRoleSearchQuery}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            userCounts={userCounts}
            onEditRole={handleEditRole}
            onCreateRole={handleCreateRole}
            loading={loading}
            getRoleStyle={getRoleStyle}
          />

          {/* COLUMN 2: Permissions Matrix (Width: 6/12) */}
          <PermissionsMatrix
            roles={roles}
            permissions={permissions}
            permLoading={permLoading}
            permSearchQuery={permSearchQuery}
            setPermSearchQuery={setPermSearchQuery}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            updatingCell={updatingCell}
            canManage={canManage}
            isSuperAdmin={isSuperAdmin}
            CORE_ROLES={CORE_ROLES}
            getPermissionStatus={getPermissionStatus}
            onToggleMatrixPermission={handleToggleMatrixPermission}
            roleColWidth={roleColWidth}
          />

          {/* COLUMN 3: Role Details (Width: 3/12) */}
          <RoleDetailsPanel
            selectedRole={selectedRole}
            permissions={permissions}
            userCounts={userCounts}
            onEditRole={handleEditRole}
            onDeleteRoleClick={handleDeleteRoleClick}
            getRoleDescription={getRoleDescription}
            getPermissionStatus={getPermissionStatus}
          />

        </div>

        {/* --- GUIDE MODAL --- */}
        <PermissionGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

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
