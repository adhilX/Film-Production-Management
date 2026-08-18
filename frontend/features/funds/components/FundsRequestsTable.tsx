import React from 'react';
import type { FundRequest, Budget } from '@/app/types';
import type { UserProfile } from '@/types/auth';

interface FundsRequestsTableProps {
  requests: FundRequest[];
  loading: boolean;
  budget: Budget | null;
  user: UserProfile | null;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: boolean;
  isRequestOwner: (requestItem: FundRequest, currentUser: UserProfile | null) => boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  onSelectRequest: (r: FundRequest) => void;
  onApproveRequest: (r: FundRequest) => void;
  onRejectRequest: (r: FundRequest) => void;
  onEditRequest: (r: FundRequest) => void;
  onCancelRequest: (id: string) => Promise<void>;
}

export const FundsRequestsTable: React.FC<FundsRequestsTableProps> = ({
  requests,
  loading,
  budget,
  user,
  hasPermission,
  isSuperAdmin,
  isRequestOwner,
  formatCurrency,
  onSelectRequest,
  onApproveRequest,
  onRejectRequest,
  onEditRequest,
  onCancelRequest,
}) => {
  return (
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
                <td className="py-4 px-4 text-right"><div className="h-3.5 bg-slate-105 rounded w-16 ml-auto" /></td>
                <td className="py-4 px-4 text-center"><div className="h-3.5 bg-slate-100 rounded w-16 mx-auto" /></td>
                <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-20" /></td>
                <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-20" /></td>
                <td className="py-4 px-4 text-center"><div className="h-3.5 bg-slate-100 rounded w-16 mx-auto" /></td>
              </tr>
            ))
          ) : requests.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 px-4 text-center text-slate-400 font-semibold">
                No fund requests found matching filters.
              </td>
            </tr>
          ) : (
            requests.map((r) => {
              const isRequester = isRequestOwner(r, user);
              const canCancel = r.status === 'Pending' && (isRequester || isSuperAdmin || hasPermission('funds.update'));
              const canEdit = r.status === 'Pending' && hasPermission('funds.update');

              return (
                <tr key={r._id} className="hover:bg-slate-50/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <button
                      onClick={() => onSelectRequest(r)}
                      className="hover:underline text-left font-bold text-slate-900 cursor-pointer"
                    >
                      {r.title}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{r.requestedBy?.name || 'Unknown'}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
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
                    <span
                      className={`inline-block px-2.5 py-0.5 border rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        r.status === 'Approved'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : r.status === 'Rejected'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : r.status === 'Cancelled'
                          ? 'bg-slate-150 border-slate-200 text-slate-600'
                          : 'bg-amber-50 border-amber-100 text-amber-705'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px]">
                    {new Date(r.createdAt || '').toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {r.reviewedBy?.name || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => onSelectRequest(r)}
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
                                onClick={() => onApproveRequest(r)}
                                title={isRequester ? 'You cannot approve your own fund request' : undefined}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  isRequester
                                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 cursor-pointer'
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                disabled={isRequester}
                                onClick={() => onRejectRequest(r)}
                                title={isRequester ? 'You cannot reject your own fund request' : undefined}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                  isRequester
                                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                    : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 cursor-pointer'
                                }`}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => onEditRequest(r)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                          )}

                          {canCancel && (
                            <button
                              onClick={() => onCancelRequest(r._id)}
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
  );
};

export default FundsRequestsTable;
