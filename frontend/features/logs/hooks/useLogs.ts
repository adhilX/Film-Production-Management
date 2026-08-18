import { useState, useEffect } from 'react';
import { useProductionStore } from '@/store/useProductionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { logService } from '../services/log.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

export function useLogs() {
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const user = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  const isSuperAdmin = hasPermission(PERMISSIONS.ROLES_MANAGE);

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [scopeAllProjects, setScopeAllProjects] = useState(false);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Details panel and raw JSON modal states
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, moduleFilter, actionFilter, scopeAllProjects]);

  // Clear stale data and reset page on active project change
  useEffect(() => {
    setLogs([]);
    setMetrics(null);
    setPage(1);
    setSelectedLog(null);
  }, [selectedProduction?._id]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const prodIdParam = isSuperAdmin && scopeAllProjects ? undefined : selectedProduction?._id;

      const data = await logService.getAuditLogs({
        page,
        limit,
        search: debouncedSearch,
        module: moduleFilter === 'All' ? undefined : moduleFilter,
        action: actionFilter === 'All' ? undefined : actionFilter,
        productionId: prodIdParam,
        sortBy,
        sortOrder,
      });

      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
      setMetrics(data.metrics || null);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'An error occurred while loading audit logs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, debouncedSearch, moduleFilter, actionFilter, scopeAllProjects, sortBy, sortOrder, selectedProduction?._id]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return {
    selectedProduction,
    user,
    isSuperAdmin,
    logs,
    setLogs,
    total,
    setTotal,
    totalPages,
    setTotalPages,
    metrics,
    setMetrics,
    loading,
    setLoading,
    error,
    setError,
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    moduleFilter,
    setModuleFilter,
    actionFilter,
    setActionFilter,
    scopeAllProjects,
    setScopeAllProjects,
    page,
    setPage,
    limit,
    setLimit,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedLog,
    setSelectedLog,
    isRawModalOpen,
    setIsRawModalOpen,
    fetchLogs,
    handleSort,
  };
}

export default useLogs;
