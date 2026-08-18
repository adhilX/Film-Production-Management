'use client';

import { useEffect, useState, Activity } from 'react';
import { adminService } from '@/services/adminService';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Clock, 
  Loader2, 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  ShieldAlert, 
  ArrowUpDown, 
  RefreshCw, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { PermissionGuard } from '@/app/components/permission-guard';
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

export default function ApprovalsQueue() {
  return (
    <PermissionGuard permission="users.approve" fallback={<UnauthorizedFallback />}>
      <ApprovalsQueueContent />
    </PermissionGuard>
  );
}

function ApprovalsQueueContent() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="animate-in fade-in duration-300 w-full px-6 md:px-8 lg:px-10 py-8 flex flex-col gap-8 font-sans text-slate-800">
      
      {/* Title & Filters Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Onboarding Approvals</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Verify contractor compliance, verify IDs/Tax logs, and approve platform access.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilterStale(!filterStale)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition shadow-xs cursor-pointer ${
              filterStale 
                ? 'bg-rose-50 text-rose-700 border-rose-200' 
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pending Review */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50 shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900 leading-none">{metrics.pending}</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Pending Review</span>
            <span className="block text-[10px] text-slate-400 font-medium">Requires audit</span>
          </div>
        </div>

        {/* Card 2: Approved */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900 leading-none">{metrics.approved}</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Approved Users</span>
            <span className="block text-[10px] text-slate-400 font-medium">Active on platform</span>
          </div>
        </div>

        {/* Card 3: Changes Requested */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900 leading-none">{metrics.changesRequested}</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Changes Requested</span>
            <span className="block text-[10px] text-slate-400 font-medium">Awaiting update</span>
          </div>
        </div>

        {/* Card 4: Rejected / Inactive */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100/50 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900 leading-none">{metrics.rejected}</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Rejected Accounts</span>
            <span className="block text-[10px] text-slate-400 font-medium">Access disabled</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search applicants by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-950 focus:outline-none focus:border-indigo-600 transition"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Status Filter */}
          <div className="flex flex-col">
            <select
              value={onboardingStatus}
              onChange={(e) => setOnboardingStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 transition cursor-pointer"
            >
              <option value="pending-review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="changes-requested">Changes Requested</option>
              <option value="in-progress">In Progress</option>
              <option value="all">All Statuses</option>
            </select>
          </div>

          {/* Contractor Type Filter */}
          <div className="flex flex-col">
            <select
              value={contractorType}
              onChange={(e) => setContractorType(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 transition cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Cast">Cast</option>
              <option value="Crew">Crew</option>
              <option value="Supplier">Supplier</option>
              <option value="Agent">Agent</option>
              <option value="Production Company">Company</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex flex-col">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 transition cursor-pointer"
            >
              <option value="submittedDate">Sort: Submitted Date</option>
              <option value="name">Sort: Name</option>
              <option value="contractorType">Sort: Type</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={toggleSortOrder}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </button>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {errorMsg && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="flex-1">{errorMsg}</div>
            <button 
              onClick={fetchApps} 
              className="px-3 py-1 bg-white border border-rose-200 text-rose-700 font-bold hover:bg-rose-100/50 rounded-lg transition text-[10px]"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-650 border-collapse">
            <thead className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4 font-bold">Applicant</th>
                <th className="px-6 py-4 font-bold">Contractor Type</th>
                <th className="px-6 py-4 font-bold">Submitted</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400 font-medium">
                      <Loader2 className="animate-spin h-5 w-5 text-indigo-600" />
                      <span>Loading applications queue...</span>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-semibold text-xs">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/30 transition">
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center overflow-hidden shrink-0">
                          {app.profile?.photoUrl ? (
                            <img src={app.profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-400 font-bold text-xs">{app.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm leading-tight">{app.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <span className="inline-block px-2.5 py-0.5 bg-indigo-50/70 border border-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {app.contractorType || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex flex-col gap-0.5 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.updatedAt ? formatDistanceToNow(new Date(app.updatedAt), { addSuffix: true }) : 'N/A'}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-normal pl-5">
                          {app.updatedAt ? format(new Date(app.updatedAt), 'MMM dd, yyyy - hh:mm a') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      {app.onboardingStatus === 'pending-review' ? (
                        <span className="inline-block px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          Pending Review
                        </span>
                      ) : app.onboardingStatus === 'approved' ? (
                        <span className="inline-block px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          Approved
                        </span>
                      ) : app.onboardingStatus === 'changes-requested' ? (
                        <span className="inline-block px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          Changes Requested
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 align-middle text-right">
                      <Link 
                        href={`/approvals/${app._id}`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs hover:shadow-sm cursor-pointer"
                      >
                        Review Application →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
