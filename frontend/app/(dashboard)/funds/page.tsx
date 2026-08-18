'use client';

import { RotateCw, Plus, ShieldAlert, AlertTriangle } from 'lucide-react';
import { PermissionGuard } from '@/app/components/permission-guard';
import { UnauthorizedFallback } from '@/components/common/UnauthorizedFallback';

// Central hook & subcomponents
import { useFunds } from '@/features/funds/hooks/useFunds';
import { BudgetStats } from '@/features/funds/components/BudgetStats';
import { BudgetUtilizationBar } from '@/features/funds/components/BudgetUtilizationBar';
import { FundsFilters } from '@/features/funds/components/FundsFilters';
import { FundsRequestsTable } from '@/features/funds/components/FundsRequestsTable';

// Existing legacy modals (relative imports preserved, paths updated to relative)
import CreateRequestModal from './components/CreateRequestModal';
import ApproveRequestModal from './components/ApproveRequestModal';
import RejectRequestModal from './components/RejectRequestModal';
import EditBudgetModal from './components/EditBudgetModal';
import RequestDetailsModal from './components/RequestDetailsModal';
import EditRequestModal from './components/EditRequestModal';

function FundsPageContent() {
  const {
    selectedProduction,
    user,
    budget,
    requests,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    isCreateOpen,
    setIsCreateOpen,
    isEditBudgetOpen,
    setIsEditBudgetOpen,
    selectedRequest,
    setSelectedRequest,
    approvingRequest,
    setApprovingRequest,
    rejectingRequest,
    setRejectingRequest,
    editingRequest,
    setEditingRequest,
    hasPermission,
    isSuperAdmin,
    isRequestOwner,
    fetchBudgetAndRequests,
    handleCancelRequest,
    formatCurrency,
    pendingRequestsSum,
    filteredRequests,
    categories,
    remainingAmount,
    utilizationPercentage,
    isBudgetLow,
  } = useFunds();

  if (!selectedProduction) {
    return (
      <div className="w-full px-6 md:px-8 py-16 text-center text-slate-400 font-medium">
        Please select a project to view funds.
      </div>
    );
  }

  return (
    <div className="w-full px-6 md:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Budget & Funds</h1>
          <p className="text-xs text-slate-505 mt-1">
            Manage allocations, approvals, and verify spending against project limits.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchBudgetAndRequests}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl transition cursor-pointer"
            title="Refresh Financial Data"
          >
            <RotateCw className="h-5 w-5" />
          </button>
          
          <PermissionGuard permission="funds.create">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Request Funds
            </button>
          </PermissionGuard>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
          <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <BudgetStats
        budget={budget}
        pendingRequestsSum={pendingRequestsSum}
        requestsPendingCount={requests.filter((r) => r.status === 'Pending').length}
        formatCurrency={formatCurrency}
        hasPermission={hasPermission}
        setIsEditBudgetOpen={setIsEditBudgetOpen}
        utilizationPercentage={utilizationPercentage}
        isBudgetLow={isBudgetLow}
      />

      {/* Utilization Bar */}
      <BudgetUtilizationBar
        budget={budget}
        utilizationPercentage={utilizationPercentage}
      />

      {/* Requests History List Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <FundsFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
        />

        {/* Requests Table */}
        <FundsRequestsTable
          requests={filteredRequests}
          loading={loading}
          budget={budget}
          user={user}
          hasPermission={hasPermission}
          isSuperAdmin={isSuperAdmin}
          isRequestOwner={isRequestOwner}
          formatCurrency={formatCurrency}
          onSelectRequest={setSelectedRequest}
          onApproveRequest={setApprovingRequest}
          onRejectRequest={setRejectingRequest}
          onEditRequest={setEditingRequest}
          onCancelRequest={handleCancelRequest}
        />
      </div>

      {/* Modals */}
      {isCreateOpen && (
        <CreateRequestModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchBudgetAndRequests();
          }}
          remainingBudget={remainingAmount}
          currency={budget?.currency || 'INR'}
        />
      )}

      {isEditBudgetOpen && budget && (
        <EditBudgetModal
          budget={budget}
          onClose={() => setIsEditBudgetOpen(false)}
          onSuccess={() => {
            setIsEditBudgetOpen(false);
            fetchBudgetAndRequests();
          }}
        />
      )}

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          currency={budget?.currency || 'INR'}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => {
            setApprovingRequest(selectedRequest);
            setSelectedRequest(null);
          }}
          onReject={() => {
            setRejectingRequest(selectedRequest);
            setSelectedRequest(null);
          }}
        />
      )}

      {approvingRequest && (
        <ApproveRequestModal
          request={approvingRequest}
          remainingBudget={remainingAmount}
          currency={budget?.currency || 'INR'}
          onClose={() => setApprovingRequest(null)}
          onSuccess={() => {
            setApprovingRequest(null);
            fetchBudgetAndRequests();
          }}
        />
      )}

      {rejectingRequest && (
        <RejectRequestModal
          request={rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          onSuccess={() => {
            setRejectingRequest(null);
            fetchBudgetAndRequests();
          }}
        />
      )}

      {editingRequest && (
        <EditRequestModal
          request={editingRequest}
          remainingBudget={remainingAmount}
          currency={budget?.currency || 'INR'}
          onClose={() => setEditingRequest(null)}
          onSuccess={() => {
            setEditingRequest(null);
            fetchBudgetAndRequests();
          }}
        />
      )}
    </div>
  );
}

export default function FundsPage() {
  return (
    <PermissionGuard permission="funds.view" fallback={<UnauthorizedFallback />}>
      <FundsPageContent />
    </PermissionGuard>
  );
}
