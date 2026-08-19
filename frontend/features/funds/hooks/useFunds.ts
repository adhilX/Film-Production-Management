import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useProductionStore } from '@/store/useProductionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fundsService } from '../services/funds.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import type { Budget, FundRequest } from '@/features/funds/types';
import type { UserProfile } from '@/features/users/types';
import { formatError } from '@/utils/format-error';

export function useFunds() {
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const user = useAuthStore((state) => state.user);
  const { hasPermission: checkPerm } = usePermissions();

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
    return checkPerm(permission);
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
      const errMsg = formatError(err, 'Failed to fetch project budget and requests.');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedProduction]);

  // Project Switching Sync
  useEffect(() => {
    setBudget(null);
    setRequests([]);
    setSelectedRequest(null);
    setApprovingRequest(null);
    setRejectingRequest(null);
    setEditingRequest(null);
    setIsCreateOpen(false);
    setIsEditBudgetOpen(false);
    
    setSearch('');
    setStatusFilter('All');
    setCategoryFilter('All');

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
      toast.success('Fund request cancelled successfully.');
      fetchBudgetAndRequests();
    } catch (err: any) {
      toast.error(formatError(err, 'Failed to cancel the request.'));
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

  return {
    selectedProduction,
    user,
    budget,
    requests,
    loading,
    error,
    setError,
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
    totalBudget,
    allocatedAmount,
    remainingAmount,
    utilizationPercentage,
    isBudgetLow,
  };
}

export default useFunds;
