'use client';

import { useEffect, useState } from 'react';
import { axiosClient as api } from '@/lib/axios';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FileText, ArrowRight, Clock } from 'lucide-react';

export default function ApprovalsQueue() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStale, setFilterStale] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get('/admin/applications');
        let data = res.data;

        // Check URL params for stale filter
        const params = new URLSearchParams(window.location.search);
        if (params.get('filter') === 'stale' || filterStale) {
          const now = new Date().getTime();
          data = data.filter((app: any) => {
            const updatedAt = new Date(app.updatedAt).getTime();
            return (now - updatedAt) > (3 * 24 * 60 * 60 * 1000);
          });
        }
        setApplications(data);
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [filterStale]);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <FileText className="text-amber-500 w-8 h-8" />
            Onboarding Approvals
          </h1>
          <p className="text-slate-400 mt-2">Review and verify contractor applications.</p>
        </div>
        <div>
          <button 
            onClick={() => setFilterStale(!filterStale)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${filterStale ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'}`}
          >
            {filterStale ? 'Showing Stale (>3 Days)' : 'Filter: Stale'}
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Applicant</th>
              <th className="px-6 py-4">Contractor Type</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No pending applications found in the queue.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app._id} className="hover:bg-slate-900/30 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                        {app.profile?.photoUrl ? (
                          <img src={app.profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-500 font-bold">{app.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{app.name}</p>
                        <p className="text-xs text-slate-500">{app.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium">
                      {app.contractorType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(app.updatedAt), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/approvals/${app._id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition"
                    >
                      Review
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
