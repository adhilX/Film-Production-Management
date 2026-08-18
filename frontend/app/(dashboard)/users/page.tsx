'use client';

import React from 'react';
import { PermissionGuard } from '@/app/components/permission-guard';
import { ChevronUp, ChevronDown, Filter, UserPlus } from 'lucide-react';

// Central hook & subcomponents
import { useUsers } from '@/features/users/hooks/useUsers';
import { UserStats } from '@/features/users/components/UserStats';
import { UserFilters } from '@/features/users/components/UserFilters';
import { UsersTable } from '@/features/users/components/UsersTable';

// Existing legacy modals (relative imports preserved, paths updated to relative)
import UserEditModal from '@/app/components/admin/UserEditModal';
import UserDetailsModal from '@/app/components/admin/UserDetailsModal';
import Pagination from '@/app/components/Pagination';

export default function AdminUsersPage() {
  const {
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
  } = useUsers();

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-indigo-650" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-indigo-650" />
    );
  };

  return (
    <PermissionGuard
      permission="users.view"
      fallback={
        <div className="w-full px-6 md:px-8 lg:px-10 py-8 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xs text-red-750 font-bold">
              Access Denied: You do not have permissions to view the User Management Directory.
            </span>
          </div>
        </div>
      }
    >
      <div className="w-full px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <div className="text-red-750 text-xs font-semibold w-full flex items-center justify-between">
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
        <UserStats total={total} activeCount={activeCount} limit={limit} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition cursor-pointer ${
              showFilters
                ? 'bg-slate-150 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-650'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
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

        {/* Filters Controls Panel */}
        <UserFilters
          showFilters={showFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterDepartment={filterDepartment}
          setFilterDepartment={setFilterDepartment}
          filterContractorType={filterContractorType}
          setFilterContractorType={setFilterContractorType}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterOnboardingStatus={filterOnboardingStatus}
          setFilterOnboardingStatus={setFilterOnboardingStatus}
          filterActive={filterActive}
          setFilterActive={setFilterActive}
          roles={roles}
          onResetFilters={handleResetFilters}
        />

        {/* Directory Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <UsersTable
              users={users}
              loading={loading}
              hasUpdatePerm={hasUpdatePerm}
              onSort={handleSort}
              renderSortIcon={renderSortIcon}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
            />
          </div>

          {/* Pagination component */}
          {total > 5 && (
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
          )}
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
