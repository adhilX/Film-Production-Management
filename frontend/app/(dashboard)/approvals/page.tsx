'use client';

import React from 'react';
import { PermissionGuard } from '@/app/components/permission-guard';
import { ShieldAlert, RefreshCw, AlertCircle } from 'lucide-react';

// Central hook & subcomponents
import { useApprovals } from '@/features/approvals/hooks/useApprovals';
import { ApprovalsStats } from '@/features/approvals/components/ApprovalsStats';
import { ApprovalsFilters } from '@/features/approvals/components/ApprovalsFilters';
import { ApprovalsTable } from '@/features/approvals/components/ApprovalsTable';

// Pagination component
import Pagination from '@/app/components/Pagination';

const UnauthorizedFallback = () => (
  <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-slate-800 text-sm">Unauthorized Access</h3>
    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
      You don't have permission to review onboarding applications. Please contact your system administrator.
    </p>
  </div>
);

function ApprovalsQueueContent() {
  const {
    applications,
    loading,
    errorMsg,
    searchTerm,
    setSearchTerm,
    contractorType,
    setContractorType,
    department,
    setDepartment,
    onboardingStatus,
    setOnboardingStatus,
    filterStale,
    setFilterStale,
    sortBy,
    setSortBy,
    sortOrder,
    page,
    setPage,
    limit,
    setLimit,
    total,
    pages,
    metrics,
    fetchApps,
    toggleSortOrder,
  } = useApprovals();

  return (
    <div className="animate-in fade-in duration-300 w-full px-6 md:px-8 lg:px-10 py-8 flex flex-col gap-8 font-sans text-slate-850">
      
      {/* Title & Filters Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Onboarding Approvals</h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Verify contractor compliance, verify IDs/Tax logs, and approve platform access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStale(!filterStale)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition shadow-xs cursor-pointer ${
              filterStale
                ? 'bg-rose-55 text-rose-700 border-rose-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            {filterStale ? 'Showing Stale (>3 Days)' : 'Filter: Stale (>3 Days)'}
          </button>
          <button
            onClick={fetchApps}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 bg-white rounded-lg transition shadow-xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <ApprovalsStats metrics={metrics} />

      {/* Filter / Search Bar */}
      <ApprovalsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onboardingStatus={onboardingStatus}
        setOnboardingStatus={setOnboardingStatus}
        contractorType={contractorType}
        setContractorType={setContractorType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        onToggleSortOrder={toggleSortOrder}
      />

      {/* Applications Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {errorMsg && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3 text-rose-705 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="flex-1">{errorMsg}</div>
            <button
              onClick={fetchApps}
              className="px-3 py-1 bg-white border border-rose-200 text-rose-700 font-bold hover:bg-rose-100/50 rounded-lg transition text-[10px] cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <ApprovalsTable applications={applications} loading={loading} />

        {/* Real Pagination component */}
        {!loading && total > 5 && (
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
            itemName="applications"
          />
        )}
      </div>
    </div>
  );
}

export default function ApprovalsQueue() {
  return (
    <PermissionGuard permission="users.approve" fallback={<UnauthorizedFallback />}>
      <ApprovalsQueueContent />
    </PermissionGuard>
  );
}
