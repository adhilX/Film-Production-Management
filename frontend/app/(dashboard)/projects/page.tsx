"use client";

import React from 'react';
import { PermissionGuard } from '@/app/components/permission-guard';
import { UnauthorizedFallback } from '@/components/common/UnauthorizedFallback';
import { Pagination } from '@/app/components/Pagination';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { ProjectsStats } from '@/features/projects/components/ProjectsStats';
import { ProjectsFilters } from '@/features/projects/components/ProjectsFilters';
import { ProjectsTable } from '@/features/projects/components/ProjectsTable';
import { ProjectCreateModal } from '@/features/projects/components/ProjectCreateModal';
import { ProjectEditModal } from '@/features/projects/components/ProjectEditModal';
import { PERMISSIONS } from '@/constants/permissions';

function ProductionsPageContent() {
  const {
    user,
    selectedProduction,
    setSelectedProduction,
    productions,
    productionsList,
    systemUsers,
    loading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    genreFilter,
    setGenreFilter,
    managerFilter,
    setManagerFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    editingProd,
    formData,
    formError,
    errors,
    dragActive,
    isUploadingImage,
    imageFile,
    imagePreview,
    handleSort,
    handleDrag,
    handleDrop,
    handleFileChange,
    removeImage,
    openCreateModal,
    openEditModal,
    handleInputChange,
    handleCreateSubmit,
    handleEditSubmit,
  } = useProjects();

  // Dynamic filter lists
  const uniqueGenres = Array.from(
    new Set(productions.map((p) => p.genre).filter(Boolean))
  );

  const uniqueManagers = Array.from(
    new Set(
      productions
        .map((p) => {
          if (typeof p.productionManager === 'object' && p.productionManager !== null) {
            return JSON.stringify({
              _id: (p.productionManager as any)._id,
              name: (p.productionManager as any).name,
            });
          }
          return '';
        })
        .filter(Boolean)
    )
  ).map((str) => JSON.parse(str));

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    return user.permissions ? user.permissions.includes(perm) : false;
  };

  const filterManagers =
    hasPermission(PERMISSIONS.USERS_APPROVE) || hasPermission(PERMISSIONS.ROLES_MANAGE)
      ? systemUsers
      : uniqueManagers;

  return (
    <div className="w-full px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Upper Metrics Grid */}
      <ProjectsStats productions={productions} loading={loading} />

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
        {/* Toolbar filter controls */}
        <ProjectsFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          managerFilter={managerFilter}
          setManagerFilter={setManagerFilter}
          genreFilter={genreFilter}
          setGenreFilter={setGenreFilter}
          uniqueGenres={uniqueGenres}
          filterManagers={filterManagers}
          openCreateModal={openCreateModal}
          hasCreatePermission={hasPermission(PERMISSIONS.PRODUCTIONS_CREATE)}
          setCurrentPage={setCurrentPage}
        />

        {/* Responsive Table Body */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <span className="w-8 h-8 animate-spin border-2 border-indigo-650 border-t-transparent rounded-full" />
            <span className="text-xs font-semibold">Loading projects directory...</span>
          </div>
        ) : (
          <ProjectsTable
            currentProjects={productionsList}
            selectedProduction={selectedProduction}
            setSelectedProduction={setSelectedProduction}
            sortBy={sortBy}
            sortOrder={sortOrder}
            handleSort={handleSort}
            hasUpdatePermission={hasPermission(PERMISSIONS.PRODUCTIONS_UPDATE)}
            openEditModal={openEditModal}
          />
        )}

        {/* Reusable Pagination Component */}
        {!loading && totalItems > 5 && (
          <Pagination
            page={currentPage}
            pages={totalPages}
            total={totalItems}
            limit={pageSize}
            onPageChange={setCurrentPage}
            onLimitChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemName="projects"
          />
        )}
      </div>

      {/* Modals */}
      <ProjectCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        formError={formError}
        dragActive={dragActive}
        handleDrag={handleDrag}
        handleDrop={handleDrop}
        handleFileChange={handleFileChange}
        isUploadingImage={isUploadingImage}
        imagePreview={imagePreview}
        imageFile={imageFile}
        removeImage={removeImage}
        formData={formData}
        handleInputChange={handleInputChange}
        systemUsers={systemUsers}
        handleSubmit={handleCreateSubmit}
        errors={errors}
      />

      <ProjectEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        editingProd={editingProd}
        formError={formError}
        dragActive={dragActive}
        handleDrag={handleDrag}
        handleDrop={handleDrop}
        handleFileChange={handleFileChange}
        isUploadingImage={isUploadingImage}
        imagePreview={imagePreview}
        imageFile={imageFile}
        removeImage={removeImage}
        formData={formData}
        handleInputChange={handleInputChange}
        systemUsers={systemUsers}
        handleSubmit={handleEditSubmit}
        errors={errors}
      />
    </div>
  );
}

export default function ProductionsPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.PRODUCTIONS_VIEW}
      fallback={<UnauthorizedFallback />}
    >
      <ProductionsPageContent />
    </PermissionGuard>
  );
}
