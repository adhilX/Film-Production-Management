import React from 'react';
import { FundRequest } from '@/app/types';
import { useAuthStore } from '@/store/useAuthStore';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

interface RequestDetailsModalProps {
  request: FundRequest;
  currency: string;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function RequestDetailsModal({
  request,
  currency,
  onClose,
  onApprove,
  onReject,
}: RequestDetailsModalProps) {
  const user = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  
  const isRequestOwner = (requestItem: FundRequest, currentUser: any) => {
    if (!requestItem || !currentUser) return false;
    const requesterId = requestItem.requestedBy?._id || (requestItem.requestedBy as any);
    const currentUserId = currentUser.id || currentUser._id;
    return requesterId === currentUserId;
  };

  const isOwner = isRequestOwner(request, user);
  const isPending = request.status === 'Pending';
  const hasApprovePermission = hasPermission(PERMISSIONS.FUNDS_APPROVE);

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
    }).format(paise / 100);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
              {request.category}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1.5">{request.title}</h3>
          </div>
          <span className={`px-2.5 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
            request.status === 'Approved'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
              : request.status === 'Rejected'
              ? 'bg-rose-50 border-rose-100 text-rose-700'
              : request.status === 'Cancelled'
              ? 'bg-slate-150 border-slate-200 text-slate-600'
              : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}>
            {request.status}
          </span>
        </div>

        {/* Self-Review Warning */}
        {isOwner && isPending && (
          <div className="bg-amber-50 border border-amber-250 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
            <p className="font-bold">Self-review is not allowed.</p>
            <p>This request must be reviewed by another authorized approver.</p>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested By</span>
            <span className="font-semibold text-slate-800 mt-1 block">
              {request.requestedBy?.name || 'Unknown'}
            </span>
            <span className="text-[10px] text-slate-450">{request.requestedBy?.email || ''}</span>
          </div>

          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Requested</span>
            <span className="font-semibold text-slate-800 mt-1 block">
              {new Date(request.createdAt || '').toLocaleString()}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested Amount</span>
            <span className="font-extrabold text-slate-950 mt-1 block text-sm">
              {formatCurrency(request.requestedAmount)}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Amount</span>
            <span className="font-extrabold text-emerald-800 mt-1 block text-sm">
              {request.status === 'Approved' ? formatCurrency(request.approvedAmount) : '—'}
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div className="border-t border-slate-100 pt-4">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Description & Justification
          </span>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed max-h-[150px] overflow-y-auto whitespace-pre-wrap">
            {request.description}
          </div>
        </div>

        {/* Review/Cancellation Details */}
        {(request.reviewedBy || request.status === 'Rejected' || request.status === 'Cancelled') && (
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Review Information</h4>
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
              {request.reviewedBy && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Reviewed By:</span>
                  <span className="font-semibold text-slate-800">{request.reviewedBy.name}</span>
                </div>
              )}
              {request.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Reviewed At:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(request.reviewedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {request.status === 'Rejected' && request.rejectionReason && (
                <div className="space-y-1 mt-1 pt-1.5 border-t border-slate-200/60">
                  <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">Rejection Reason</span>
                  <p className="text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 leading-relaxed text-[11px]">
                    {request.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          {isPending && hasApprovePermission && !isOwner && (
            <>
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
