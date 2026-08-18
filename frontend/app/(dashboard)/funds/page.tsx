'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProductionStore } from '@/store/useProductionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import fundsService from '@/services/fundsService';
import { FundRequest, Budget } from '@/app/types';
import type { UserProfile } from '@/types/auth';
import {
  IndianRupee,
  Plus,
  Filter,
  Search,
  X,
  Pencil,
  CheckCircle,
  XCircle,
  RotateCw,
  Clock,
  Info,
  AlertTriangle,
} from 'lucide-react';
import CreateRequestModal from './components/CreateRequestModal';
import ApproveRequestModal from './components/ApproveRequestModal';
import RejectRequestModal from './components/RejectRequestModal';
import EditBudgetModal from './components/EditBudgetModal';
import RequestDetailsModal from './components/RequestDetailsModal';
import EditRequestModal from './components/EditRequestModal';

export default function FundsPage() {
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const user = useAuthStore((state) => state.user);

  // States
  const [budget, setBudget] = useState<Budget | null>(null);
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal Open states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
  const [approvingRequest, setApprovingRequest] = useState<FundRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<FundRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<FundRequest | null>(null);

  // Check Permissions
  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };

  const isSuperAdmin = user?.systemRoleId?.name === 'Super Admin';

  const isRequestOwner = (requestItem: FundRequest, currentUser: UserProfile | null) => {
    if (!requestItem || !currentUser) return false;
    const requesterId = requestItem.requestedBy?._id || (requestItem.requestedBy as any);
    const currentUserId = currentUser.id || (currentUser as any)._id;
    return requesterId === currentUserId;
  };

  const fetchBudgetAndRequests = useCallback(async () => {
    if (!selectedProduction) return;
    setLoading(true);
    setError(null);
    try {
      const [budgetData, requestsData] = await Promise.all([
        fundsService.getBudget(selectedProduction._id),
        fundsService.getFundRequests(selectedProduction._id),
      ]);
      setBudget(budgetData);
      setRequests(requestsData);
    } catch (err: any) {
      console.error('Failed to load financial data:', err);
      setError(err.response?.data?.message || 'Failed to fetch project budget and requests.');
    } finally {
      setLoading(false);
    }
  }, [selectedProduction]);

  // Project Switching Sync
  useEffect(() => {
    // 1. Immediately clear old project data
    setBudget(null);
    setRequests([]);
    setSelectedRequest(null);
    setApprovingRequest(null);
    setRejectingRequest(null);
    setEditingRequest(null);
    setIsCreateOpen(false);
    setIsEditBudgetOpen(false);
    
    // 2. Reset filters
    setSearch('');
    setStatusFilter('All');
    setCategoryFilter('All');

    // 3. Fetch new data
    if (selectedProduction) {
      fetchBudgetAndRequests();
    }
  }, [selectedProduction?._id, fetchBudgetAndRequests]);

  // Cancel Handler
  const handleCancelRequest = async (requestId: string) => {
    if (!selectedProduction) return;
    if (!confirm('Are you sure you want to cancel this pending fund request?')) return;
    try {
      await fundsService.cancelFundRequest(selectedProduction._id, requestId);
      fetchBudgetAndRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel the request.');
    }
  };

  // Money Formatter Helper
  const formatCurrency = (paise: number, currency: string = 'INR') => {
    const value = paise / 100;
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  // Calculate Pending sum
  const pendingRequestsSum = requests
    .filter((r) => r.status === 'Pending')
    .reduce((sum, r) => sum + r.requestedAmount, 0);

  // Filters logic
  const filteredRequests = requests.filter((r) => {
    const requesterName = r.requestedBy?.name || '';
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      requesterName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Extract unique categories for filter dropdown
  const categories = Array.from(new Set(requests.map((r) => r.category)));

  // Utilization Math
  const totalBudget = budget?.totalBudget || 0;
  const allocatedAmount = budget?.allocatedAmount || 0;
  const remainingAmount = budget?.remainingAmount || 0;
  const utilizationPercentage = totalBudget > 0 ? (allocatedAmount / totalBudget) * 100 : 0;
  const isBudgetLow = totalBudget > 0 && remainingAmount / totalBudget < 0.15;

  if (!selectedProduction) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-16 text-center text-slate-400 font-medium">
        Please select a project to view funds.
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Budget & Funds</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage allocations, approvals, and verify spending against project limits.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchBudgetAndRequests}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
          <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Project Budget</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                {budget ? formatCurrency(budget.totalBudget, budget.currency) : '₹0.00'}
              </h2>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          {hasPermission('funds.approve') && (
            <button
              onClick={() => setIsEditBudgetOpen(true)}
              className="mt-3.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              Update Limit
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allocated Amount</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                {budget ? formatCurrency(budget.allocatedAmount, budget.currency) : '₹0.00'}
              </h2>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-semibold">
            {utilizationPercentage.toFixed(1)}% utilized
          </p>
        </div>

        <div className={`bg-white border rounded-2xl p-5 shadow-sm transition-colors ${
          isBudgetLow ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Budget</span>
              <h2 className={`text-xl font-bold mt-1.5 ${isBudgetLow ? 'text-amber-800' : 'text-slate-900'}`}>
                {budget ? formatCurrency(budget.remainingAmount, budget.currency) : '₹0.00'}
              </h2>
            </div>
            <div className={`p-2.5 rounded-xl ${isBudgetLow ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
              <Info className="h-5 w-5" />
            </div>
          </div>
          <p className={`text-[10px] mt-4 uppercase tracking-wider font-semibold ${isBudgetLow ? 'text-amber-700' : 'text-slate-400'}`}>
            {isBudgetLow ? 'Warning: Low remaining budget!' : 'Available for allocation'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1.5">
                {budget ? formatCurrency(pendingRequestsSum, budget.currency) : '₹0.00'}
              </h2>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-semibold">
            {requests.filter((r) => r.status === 'Pending').length} requests pending review
          </p>
        </div>
      </div>

      {/* Utilization Bar */}
      {budget && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Budget Utilization</span>
            <span>{utilizationPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilizationPercentage >= 90
                  ? 'bg-rose-600'
                  : utilizationPercentage >= 70
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>0%</span>
            <span>{utilizationPercentage >= 100 ? 'Overdraft!' : '100%'}</span>
          </div>
        </div>
      )}

      {/* Requests History List Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Fund Request History
          </h3>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests or users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl py-2 px-3 pr-8 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 shadow-sm cursor-pointer appearance-none min-w-[120px]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Filter className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl py-2 px-3 pr-8 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 shadow-sm cursor-pointer appearance-none min-w-[120px]"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 font-bold">Title</th>
                <th className="py-3.5 px-4 font-bold">Requester</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold text-right">Requested</th>
                <th className="py-3.5 px-4 font-bold text-right">Approved</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold">Date Requested</th>
                <th className="py-3.5 px-4 font-bold">Reviewer</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-32" /></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-16" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-3.5 bg-slate-100 rounded w-16 ml-auto" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-3.5 bg-slate-100 rounded w-16 ml-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-3.5 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-20" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-3.5 bg-slate-100 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-slate-400 font-medium">
                    No fund requests found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const isRequester = isRequestOwner(r, user);
                  const canCancel = r.status === 'Pending' && (isRequester || isSuperAdmin || hasPermission('funds.update'));
                  const canEdit = r.status === 'Pending' && hasPermission('funds.update');

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <button
                          onClick={() => setSelectedRequest(r)}
                          className="hover:underline text-left font-bold text-slate-900 cursor-pointer"
                        >
                          {r.title}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{r.requestedBy?.name || 'Unknown'}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(r.requestedAmount, budget?.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        {r.status === 'Approved' ? formatCurrency(r.approvedAmount, budget?.currency) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                          r.status === 'Approved'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : r.status === 'Rejected'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : r.status === 'Cancelled'
                            ? 'bg-slate-150 border-slate-200 text-slate-600'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(r.createdAt || '').toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {r.reviewedBy?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRequest(r)}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Details
                          </button>
                          
                          {r.status === 'Pending' && (
                            <>
                              {hasPermission('funds.approve') && !isRequester && (
                                <>
                                  <button
                                    disabled={isRequester}
                                    onClick={() => setApprovingRequest(r)}
                                    title={isRequester ? "You cannot approve your own fund request" : undefined}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                      isRequester
                                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                        : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 cursor-pointer"
                                    }`}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    disabled={isRequester}
                                    onClick={() => setRejectingRequest(r)}
                                    title={isRequester ? "You cannot reject your own fund request" : undefined}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                      isRequester
                                        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                                        : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 cursor-pointer"
                                    }`}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              
                              {canEdit && (
                                <button
                                  onClick={() => setEditingRequest(r)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}

                              {canCancel && (
                                <button
                                  onClick={() => handleCancelRequest(r._id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
