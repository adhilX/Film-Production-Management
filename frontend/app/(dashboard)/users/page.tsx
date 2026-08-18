'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/store/useAuthStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import { 
  User, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Edit, 
  UserPlus, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw,
  Users as UsersIcon
} from 'lucide-react';
import UserEditModal from '@/app/components/admin/UserEditModal';
import UserDetailsModal from '@/app/components/admin/UserDetailsModal';
import Pagination from '@/app/components/Pagination';

export default function AdminUsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const hasUpdatePerm = currentUser?.permissions?.includes('users.update');
  const hasCreatePerm = currentUser?.permissions?.includes('users.create');

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Modal & Drawer State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);

  // Debounce search input and department filter
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
      const data = await adminService.getUsers({
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
      setError(formatError(err, 'Failed to load user directory.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await adminService.getRoles();
      setRoles(data || []);
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      setError(formatError(err, 'Failed to load system roles.'));
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

  const handleEdit = (user: any) => {
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

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-indigo-650" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-indigo-650" />;
  };

  // Derive dynamic metrics from currently fetched lists or simple counting
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <PermissionGuard permission="users.view" fallback={
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xs text-red-750 font-bold">Access Denied: You do not have permissions to view the User Management Directory.</span>
        </div>
      </div>
    }>
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-indigo-600" />
              Users
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage users, roles, access and project assignments.</p>
          </div>
          {hasCreatePerm && (
            <button 
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs sm:self-center"
            >
              <UserPlus className="w-4 h-4" />
              Create User
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <div className="text-red-750 text-xs font-bold w-full flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="text-[10px] text-red-500 hover:text-red-700 underline font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total System Users</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{total}</div>
          </div>
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Accounts</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{total > 0 ? activeCount : 0}</div>
          </div>
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inactive Accounts</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{total > 0 ? total - activeCount : 0}</div>
          </div>
          <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Items Limit</span>
            <div className="text-xl font-bold text-slate-800 mt-1">{limit} / page</div>
          </div>
        </div>

        {/* Filters Controls Panel */}
        <div className="bg-white p-5 border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-250 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-650 transition"
              />
            </div>

            {/* Department Input */}
            <div>
              <input 
                type="text" 
                placeholder="Filter by Department..." 
                value={filterDepartment}
                onChange={(e) => {
                  setFilterDepartment(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-650 transition"
              />
            </div>

            {/* Contractor Type Filter */}
            <select 
              value={filterContractorType}
              onChange={(e) => {
                setFilterContractorType(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
            >
              <option value="all">All Contractor Types</option>
              <option value="Cast">Cast</option>
              <option value="Crew">Crew</option>
              <option value="Freelancer">Freelancer</option>
              <option value="None">None</option>
            </select>

            {/* System Role Filter */}
            <select 
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
            >
              <option value="all">All System Roles</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            
            {/* Account Status Filter */}
            <select 
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
            >
              <option value="all">All Account Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="UnderReview">UnderReview</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Changes Requested">Changes Requested</option>
            </select>

            {/* Onboarding Status Filter */}
            <select 
              value={filterOnboardingStatus}
              onChange={(e) => {
                setFilterOnboardingStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
            >
              <option value="all">All Onboarding Statuses</option>
              <option value="draft">draft</option>
              <option value="pending-review">pending-review</option>
              <option value="changes-requested">changes-requested</option>
              <option value="approved">approved</option>
            </select>

            {/* Active Status Filter */}
            <select 
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-650 transition w-full appearance-none cursor-pointer"
            >
              <option value="all">All Active States</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Reset / Actions */}
            <button 
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-xl transition cursor-pointer text-xs w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Filters
            </button>

          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('name')}>
                    User Name & Email {renderSortIcon('name') || renderSortIcon('email')}
                  </th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('contractorType')}>
                    Contractor Type {renderSortIcon('contractorType')}
                  </th>
                  <th className="px-6 py-4 font-bold">Department</th>
                  <th className="px-6 py-4 font-bold">System Role</th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('status')}>
                    Status & Onboarding {renderSortIcon('status')}
                  </th>
                  <th className="px-6 py-4 font-bold">State</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading user directory...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition">
                      
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {user.profile?.photoUrl ? (
                              <img src={user.profile.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm hover:text-indigo-650 cursor-pointer" onClick={() => handleViewDetails(user._id)}>
                              {user.name || 'Unnamed User'}
                            </div>
                            <div className="text-slate-400 mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contractor Type */}
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-lg text-[10px] border border-slate-200/60 font-bold uppercase tracking-wider">
                          {user.contractorType || 'None'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {user.profile?.department || 'None'}
                      </td>

                      {/* System Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.systemRoleId?.name === 'Super Admin' || user.systemRoleId?.name === 'Production Admin' ? (
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                          ) : ['Production Manager', 'Finance Manager', 'Location Manager', 'Costume Manager'].includes(user.systemRoleId?.name || '') ? (
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          ) : user.systemRoleId?.name === 'Cast' || user.systemRoleId?.name === 'Crew' ? (
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                          )}
                          <span className="font-bold text-slate-700">{user.systemRoleId?.name || 'Pending'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="block font-bold text-slate-750">{user.status}</span>
                          <span className="block text-[9px] text-slate-400 lowercase">{user.onboardingStatus}</span>
                        </div>
                      </td>

                      {/* Active State */}
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(user._id)}
                            className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasUpdatePerm && (
                            <button 
                              onClick={() => handleEdit(user)}
                              className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination component */}
          <Pagination
            page={page}
            pages={pages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
            itemName="users"
          />
        </div>

        {/* Create/Edit Modal */}
        <UserEditModal 
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          user={selectedUser}
          onSave={fetchUsers}
        />

        {/* Read-only details view */}
        <UserDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setDetailsUserId(null);
          }}
          userId={detailsUserId}
        />
      </div>
    </PermissionGuard>
  );
}
