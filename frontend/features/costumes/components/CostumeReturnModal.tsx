import React from 'react';
import { X } from 'lucide-react';
import type { CostumeAssignment } from '@/features/costumes/types';

interface CostumeReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssignment: CostumeAssignment | null;
  returnForm: {
    quantity: number;
    conditionAtReturn: string;
    notes: string;
  };
  setReturnForm: React.Dispatch<React.SetStateAction<{
    quantity: number;
    conditionAtReturn: string;
    notes: string;
  }>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CostumeReturnModal: React.FC<CostumeReturnModalProps> = ({
  isOpen,
  onClose,
  selectedAssignment,
  returnForm,
  setReturnForm,
  isSubmitting,
  onSubmit,
}) => {
  if (!isOpen || !selectedAssignment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-base">Check In: {selectedAssignment.costumeId?.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-xs font-medium text-indigo-900">
            Checking back in items checked out to{' '}
            <span className="font-black">
              {selectedAssignment.characterId?.name || selectedAssignment.assignedTo?.name || 'Cast'}
            </span>
            . (Total checkout: {selectedAssignment.quantity} items)
          </div>

          {/* Quantity & Return Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Quantity to Return</label>
              <input
                type="number"
                required
                min={1}
                max={selectedAssignment.quantity}
                value={returnForm.quantity}
                onChange={(e) => setReturnForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Return Condition *</label>
              <select
                value={returnForm.conditionAtReturn}
                onChange={(e) => setReturnForm((prev) => ({ ...prev, conditionAtReturn: e.target.value }))}
                className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Checkin Notes</label>
            <textarea
              placeholder="Deterioration reports, wash instructions, or status logs..."
              value={returnForm.notes}
              onChange={(e) => setReturnForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Checking In...' : 'Confirm Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CostumeReturnModal;
