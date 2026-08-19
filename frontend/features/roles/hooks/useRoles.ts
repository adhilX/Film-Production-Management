import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { roleService } from '../services/role.service';
import { userService } from '@/features/users/services/user.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { formatError } from '@/utils/format-error';

export function useRoles() {
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
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.systemRoleId?.name?.toLowerCase() === 'super admin';
  const canManage = hasPermission(PERMISSIONS.ROLES_MANAGE);

  const CORE_ROLES = ['Super Admin', 'Production Admin', 'Production Manager', 'Cast', 'Crew'];



  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      const errMsg = formatError(err, 'Failed to load system roles.');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermLoading(true);
      setError(null);
      const data = await roleService.getPermissions();
      setPermissions(data);
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err);
      const errMsg = formatError(err, 'Failed to load permissions list.');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setPermLoading(false);
    }
  };

  const fetchUserCounts = async () => {
    try {
      const usersResult = await userService.getUsers({ limit: 1000 });
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
    
    if (CORE_ROLES.includes(selectedRole.name)) {
      toast.error(`Core system role "${selectedRole.name}" is protected and cannot be deleted.`);
      return;
    }

    toast.error('For security and audit trail integrity, system roles cannot be hard-deleted. You can modify their permissions to revoke access.');
  };

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
      await roleService.updateRole(role._id, { permissions: updatedPermIds });
      await fetchRoles();
      const successMsg = `Permissions updated successfully for "${role.name}".`;
      setSuccess(successMsg);
      toast.success(successMsg);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to toggle matrix permission:', err);
      setRoles(originalRoles);
      const errMsg = formatError(err, 'Failed to update role permissions.');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setUpdatingCell(null);
    }
  };

  return {
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
  };
}

export default useRoles;
