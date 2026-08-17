'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, Loader2, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';

export default function ApprovalsQueue() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStale, setFilterStale] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await adminService.getApplications();
        let filteredData = data;

        // Check URL params for stale filter
        const params = new URLSearchParams(window.location.search);
        if (params.get('filter') === 'stale' || filterStale) {
          const now = new Date().getTime();
          filteredData = filteredData.filter((app: any) => {
            const updatedAt = new Date(app.updatedAt).getTime();
            return (now - updatedAt) > (3 * 24 * 60 * 60 * 1000);
          });
        }
        setApplications(filteredData);
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [filterStale]);

  // KPI stats calculations
  const pendingCount = applications.length;
  const approvedCount = 0; // Backend currently only returns pending-review applications
  const rejectedCount = 0;
  const totalCount = applications.length;

  return (
    <div className="animate-in fade-in duration-300 w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 flex flex-col gap-8 font-sans text-slate-800">
      
      {/* Title & Filters Panel (Starts directly with Application Queue) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Application Queue</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Verify pending contractor submissions.</p>
        </div>
        <div className="shrink-0">
          <button 
            onClick={() => setFilterStale(!filterStale)}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition shadow-xs cursor-pointer ${
              filterStale 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            {filterStale ? 'Showing Stale (>3 Days)' : 'Filter: Stale'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pending Review */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100/50 shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900 leading-none">{pendingCount}</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Pending Review</span>
            <span className="block text-[10px] text-slate-400 font-medium">Requires attention</span>
          </div>
        </div>

        {/* Card 2: Approved */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900 leading-none">{approvedCount}</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Approved</span>
            <span className="block text-[10px] text-slate-400 font-medium">This month</span>
          </div>
        </div>

        {/* Card 3: Rejected */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-100/50 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900 leading-none">{rejectedCount}</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Rejected</span>
            <span className="block text-[10px] text-slate-400 font-medium">This month</span>
          </div>
        </div>

        {/* Card 4: Total Applications */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-650 border border-amber-100/50 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xl font-bold text-slate-900 leading-none">{totalCount}</span>
            <span className="block text-xs font-bold text-slate-700 mt-1">Total Applications</span>
            <span className="block text-[10px] text-slate-400 font-medium">All time</span>
          </div>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
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
                    <Loader2 className="animate-spin h-5 w-5 text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium">
                    No pending applications found in the queue.
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
                      <span className="inline-block px-2.5 py-0.5 bg-purple-50/70 border border-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {app.contractorType}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex flex-col gap-0.5 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDistanceToNow(new Date(app.updatedAt), { addSuffix: true })}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-normal pl-5">
                          {format(new Date(app.updatedAt), 'MMM dd, yyyy - hh:mm a')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <span className="inline-block px-2.5 py-0.5 bg-amber-50/70 border border-amber-100 text-amber-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                        Pending Review
                      </span>
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

        {/* Table Card Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold tracking-wide">
          <span>Showing {applications.length} of {applications.length} {applications.length === 1 ? 'application' : 'applications'}</span>
        </div>
      </div>
    </div>
  );
}
