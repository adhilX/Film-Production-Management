import React from 'react';
import Link from 'next/link';
import { Loader2, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ApprovalsTableProps {
  applications: any[];
  loading: boolean;
}

export const ApprovalsTable: React.FC<ApprovalsTableProps> = ({ applications, loading }) => {
  return (
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
        <tbody className="divide-y divide-slate-100 bg-white">
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
                <td className="px-6 py-5 align-middle font-semibold">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center overflow-hidden shrink-0">
                      {app.profile?.photoUrl ? (
                        <img src={app.profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 font-bold text-xs">{app.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm leading-tight">{app.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">{app.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 align-middle">
                  <span className="inline-block px-2.5 py-0.5 bg-indigo-50/70 border border-indigo-100 text-indigo-705 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {app.contractorType || 'None'}
                  </span>
                </td>
                <td className="px-6 py-5 align-middle">
                  <div className="flex flex-col gap-0.5 text-slate-505 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {app.updatedAt ? formatDistanceToNow(new Date(app.updatedAt), { addSuffix: true }) : 'N/A'}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-normal pl-5">
                      {app.updatedAt ? format(new Date(app.updatedAt), 'MMM dd, yyyy - hh:mm a') : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 align-middle">
                  {app.onboardingStatus === 'pending-review' ? (
                    <span className="inline-block px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-705 rounded-md text-[9px] font-black uppercase tracking-wider">
                      Pending Review
                    </span>
                  ) : app.onboardingStatus === 'approved' ? (
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-705 rounded-md text-[9px] font-black uppercase tracking-wider">
                      Approved
                    </span>
                  ) : app.onboardingStatus === 'changes-requested' ? (
                    <span className="inline-block px-2.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-705 rounded-md text-[9px] font-black uppercase tracking-wider">
                      Changes Requested
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-wider">
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
  );
};

export default ApprovalsTable;
