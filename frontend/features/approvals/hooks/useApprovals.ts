import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';

export function useApprovals() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [contractorType, setContractorType] = useState('all');
  const [department, setDepartment] = useState('all');
  const [onboardingStatus, setOnboardingStatus] = useState('pending-review');
  const [filterStale, setFilterStale] = useState(false);

  // Sorting State
  const [sortBy, setSortBy] = useState('submittedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // KPI Metrics State
  const [metrics, setMetrics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    changesRequested: 0,
  });

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

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 450);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [contractorType, department, onboardingStatus, filterStale, sortBy, sortOrder]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await adminService.getApplications({
        page,
        limit,
        search: debouncedSearch || undefined,
        contractorType: contractorType !== 'all' ? contractorType : undefined,
        department: department !== 'all' ? department : undefined,
        onboardingStatus: onboardingStatus !== 'all' ? onboardingStatus : undefined,
        stale: filterStale ? true : undefined,
        sortBy,
        sortOrder,
      });

      setApplications(res.applications || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      if (res.metrics) {
        setMetrics({
          pending: res.metrics.pending || 0,
          approved: res.metrics.approved || 0,
          rejected: res.metrics.rejected || 0,
          changesRequested: res.metrics.changesRequested || 0,
        });
      }
    } catch (err: any) {
      console.error('Failed to load applications', err);
      setErrorMsg(formatError(err, 'Failed to load onboarding applications. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [page, limit, debouncedSearch, contractorType, department, onboardingStatus, filterStale, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return {
    applications,
    loading,
    errorMsg,
    setErrorMsg,
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
    setSortOrder,
    page,
    setPage,
    limit,
    setLimit,
    total,
    pages,
    metrics,
    fetchApps,
    toggleSortOrder,
  };
}

export default useApprovals;
