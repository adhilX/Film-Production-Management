'use client';

import React from 'react';
import { Shirt, Plus, AlertCircle, CheckCircle, X, Clock } from 'lucide-react';

// Central hook & Subcomponents
import { useCostumes } from '@/features/costumes/hooks/useCostumes';
import { CostumesStats } from '@/features/costumes/components/CostumesStats';
import { CostumesFilters } from '@/features/costumes/components/CostumesFilters';
import { CostumesGrid } from '@/features/costumes/components/CostumesGrid';
import { CostumesAssignmentsTable } from '@/features/costumes/components/CostumesAssignmentsTable';
import { CostumeEditModal } from '@/features/costumes/components/CostumeEditModal';
import { CostumeAssignModal } from '@/features/costumes/components/CostumeAssignModal';
import { CostumeReturnModal } from '@/features/costumes/components/CostumeReturnModal';
import { CostumeDetailModal } from '@/features/costumes/components/CostumeDetailModal';

export default function CostumesModule() {
  const {
    selectedProduction,
    assignments,
    characters,
    castCrewList,
    categories,
    loading,
    activeTab,
    setActiveTab,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    conditionFilter,
    setConditionFilter,
    statusFilter,
    setStatusFilter,
    sizeFilter,
    setSizeFilter,
    costumeModalOpen,
    setCostumeModalOpen,
    selectedCostume,
    costumeForm,
    setCostumeForm,
    costumeErrors,
    setCostumeErrors,
    assignErrors,
    setAssignErrors,
    assignModalOpen,
    setAssignModalOpen,
    assignForm,
    setAssignForm,
    returnModalOpen,
    setReturnModalOpen,
    selectedAssignment,
    returnForm,
    setReturnForm,
    detailModalOpen,
    setDetailModalOpen,
    detailCostume,
    isSubmitting,
    isUploading,
    handleImageUpload,
    openCreateModal,
    openEditModal,
    handleSaveCostume,
    handleDeleteCostume,
    openAssignModal,
    handleAssignCostume,
    openReturnModal,
    handleReturnCostume,
    openDetailModal,
    canCreate,
    canUpdate,
    canDelete,
    filteredCostumes,
    totalItems,
    availableItems,
    assignedItems,
    damagedOrLost,
  } = useCostumes();

  if (!selectedProduction) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-sm font-semibold text-slate-400">Please select a project to manage costumes.</span>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Shirt className="text-indigo-600 w-6 h-6" /> Costumes & Assets
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage wardrobe assets, assign costumes to characters, track stock checkout status, and log inventory conditions.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start md:self-auto"
          >
            <Plus size={15} /> Add Costume Asset
          </button>
        )}
      </div>

      {/* Success/Error Alerts */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-650 rounded-xl p-4 text-xs font-bold flex items-start gap-3 shadow-3xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="text-red-450 hover:text-red-600 transition">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-755 rounded-xl p-4 text-xs font-bold flex items-start gap-3 shadow-3xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-green-500 mt-0.5" />
          <div className="flex-1 leading-relaxed">{successMsg}</div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-455 hover:text-green-600 transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metrics Widgets */}
      <CostumesStats
        totalItems={totalItems}
        availableItems={availableItems}
        assignedItems={assignedItems}
        damagedOrLost={damagedOrLost}
        loading={loading}
      />

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-xs font-extrabold uppercase tracking-wider relative cursor-pointer transition ${
            activeTab === 'catalog' ? 'text-indigo-650' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          Catalog
          {activeTab === 'catalog' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 text-xs font-extrabold uppercase tracking-wider relative cursor-pointer transition ${
            activeTab === 'assignments' ? 'text-indigo-650' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          Assignments history
          {activeTab === 'assignments' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-4">
          <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : activeTab === 'catalog' ? (
        /* CATALOG VIEW */
        <div className="space-y-4">
          {/* Filters Bar */}
          <CostumesFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            conditionFilter={conditionFilter}
            setConditionFilter={setConditionFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categories={categories}
          />

          {filteredCostumes.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <Shirt className="w-12 h-12 text-slate-350 stroke-1" />
              <h3 className="text-sm font-bold text-slate-800">No costume assets found</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Add wardrobe items, set up size and quantities, and verify matching criteria filter checks.
              </p>
            </div>
          ) : (
            /* Costume Grid Cards */
            <CostumesGrid
              costumes={filteredCostumes}
              onOpenDetail={openDetailModal}
              onOpenEdit={openEditModal}
              onOpenAssign={openAssignModal}
              onDeleteCostume={handleDeleteCostume}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          )}
        </div>
      ) : (
        /* ASSIGNMENTS VIEW */
        <div className="space-y-4">
          {assignments.length === 0 ? (
            /* Empty assignments state */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <Clock className="w-12 h-12 text-slate-350 stroke-1" />
              <h3 className="text-sm font-bold text-slate-800">No costume assignments logged</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Assignments track who checked out which costume, when, and checkout condition at checkout / checkin.
              </p>
            </div>
          ) : (
            /* Assignments List Table */
            <CostumesAssignmentsTable
              assignments={assignments}
              onOpenReturn={openReturnModal}
              canUpdate={canUpdate}
            />
          )}
        </div>
      )}

      {/* --- ADD / EDIT COSTUME MODAL --- */}
      <CostumeEditModal
        isOpen={costumeModalOpen}
        onClose={() => setCostumeModalOpen(false)}
        selectedCostume={selectedCostume}
        costumeForm={costumeForm}
        setCostumeForm={setCostumeForm}
        costumeErrors={costumeErrors}
        setCostumeErrors={setCostumeErrors}
        isUploading={isUploading}
        isSubmitting={isSubmitting}
        handleImageUpload={handleImageUpload}
        onSubmit={handleSaveCostume}
      />

      {/* --- ASSIGN COSTUME MODAL --- */}
      <CostumeAssignModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        selectedCostume={selectedCostume}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
        characters={characters}
        castCrewList={castCrewList}
        isSubmitting={isSubmitting}
        onSubmit={handleAssignCostume}
        assignErrors={assignErrors}
      />

      {/* --- RETURN COSTUME MODAL --- */}
      <CostumeReturnModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        selectedAssignment={selectedAssignment}
        returnForm={returnForm}
        setReturnForm={setReturnForm}
        isSubmitting={isSubmitting}
        onSubmit={handleReturnCostume}
      />

      {/* --- DETAIL & HISTORY MODAL --- */}
      <CostumeDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        detailCostume={detailCostume}
        assignments={assignments}
      />

    </div>
  );
}
