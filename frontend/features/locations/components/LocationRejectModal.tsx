import React from 'react';
import { X } from 'lucide-react';

interface LocationRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  rejectionReason: string;
  setRejectionReason: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LocationRejectModal: React.FC<LocationRejectModalProps> = ({
  isOpen,
  onClose,
  rejectionReason,
  setRejectionReason,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center bg-slate-50/50 px-6 py-4 border-b border-slate-200">
          <span className="text-sm font-extrabold text-slate-800">Reject Booking Request</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Reason for Rejection (Optional)</label>
            <textarea
              placeholder="Provide a reason for rejecting this booking request..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-655 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Reject Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationRejectModal;
