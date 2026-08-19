import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { userService } from '../services/user.service';
import { roleService } from '@/features/roles/services/role.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import { formatError } from '@/utils/format-error';

import type { User } from '@/features/users/types';
import type { Role } from '@/features/roles/types';

export function useUsers() {
  const currentUser = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  const hasUpdatePerm = hasPermission(PERMISSIONS.USERS_UPDATE);
  const hasCreatePerm = hasPermission(PERMISSIONS.USERS_CREATE);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterContractorType, setFilterContractorType] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOnboardingStatus, setFilterOnboardingStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Sorting State
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Modal & Drawer State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const isActiveParam = filterActive === 'all' ? undefined : filterActive === 'active';
      const data = await userService.getUsers({
        page,
        limit,
        search: debouncedSearch,
        contractorType: filterContractorType === 'all' ? undefined : filterContractorType,
        systemRoleId: filterRole === 'all' ? undefined : filterRole,
        status: filterStatus === 'all' ? undefined : filterStatus,
        onboardingStatus: filterOnboardingStatus === 'all' ? undefined : filterOnboardingStatus,
        isActive: isActiveParam,
        department: filterDepartment || undefined,
        sortBy,
        sortOrder,
      });
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      const errMsg = formatError(err, 'Failed to load user directory.');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await roleService.getRoles();
      setRoles(data || []);
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      const errMsg = formatError(err, 'Failed to load system roles.');
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [
    page,
    limit,
    debouncedSearch,
    filterContractorType,
    filterRole,
    filterStatus,
    filterOnboardingStatus,
    filterActive,
    filterDepartment,
    sortBy,
    sortOrder
  ]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsEditOpen(true);
  };

  const handleViewDetails = (userId: string) => {
    setDetailsUserId(userId);
    setIsDetailsOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterContractorType('all');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterOnboardingStatus('all');
    setFilterActive('all');
    setFilterDepartment('');
    setSortBy('updatedAt');
    setSortOrder('desc');
    setPage(1);
  };

  // Derive dynamic metrics
  const activeCount = users.filter(u => u.isActive).length;

  return {
    currentUser,
    hasUpdatePerm,
    hasCreatePerm,
    users,
    roles,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filterContractorType,
    setFilterContractorType,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    filterOnboardingStatus,
    setFilterOnboardingStatus,
    filterActive,
    setFilterActive,
    filterDepartment,
    setFilterDepartment,
    sortBy,
    sortOrder,
    page,
    setPage,
    limit,
    setLimit,
    showFilters,
    setShowFilters,
    total,
    pages,
    isEditOpen,
    setIsEditOpen,
    selectedUser,
    isDetailsOpen,
    setIsDetailsOpen,
    detailsUserId,
    setDetailsUserId,
    fetchUsers,
    handleEdit,
    handleCreate,
    handleViewDetails,
    handleSort,
    handleResetFilters,
    activeCount,
  };
}

export default useUsers;
