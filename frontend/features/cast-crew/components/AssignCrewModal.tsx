import React from 'react';
import { X, Info } from 'lucide-react';

import type { User } from '@/features/users/types';

interface AssignCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  crewForm: { userId: string; roleInProduction: string };
  setCrewForm: React.Dispatch<React.SetStateAction<{ userId: string; roleInProduction: string }>>;
  eligibleCrew: User[];
  onSubmit: (e: React.FormEvent) => void;
  castCrewErrors?: Record<string, string>;
}

export const AssignCrewModal: React.FC<AssignCrewModalProps> = ({
  isOpen,
  onClose,
  crewForm,
  setCrewForm,
  eligibleCrew,
  onSubmit,
  castCrewErrors = {},
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <h4 className="font-bold text-slate-800 text-sm">Assign Crew Member</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block font-mono">
              Select Crew / User
            </label>
            <select
              required
              value={crewForm.userId}
              onChange={(e) => setCrewForm({ ...crewForm, userId: e.target.value })}
              className={`w-full bg-slate-50/50 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition cursor-pointer font-bold text-slate-700 ${
                castCrewErrors.userId ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            >
              <option value="">-- Choose registered crew --</option>
              {eligibleCrew.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.contractorType || 'Freelancer'})
                </option>
              ))}
            </select>
            {castCrewErrors.userId ? (
              <p className="text-[10px] text-red-500 font-bold mt-1">{castCrewErrors.userId}</p>
            ) : (
              <p className="text-[10px] text-slate-450 italic mt-1 font-semibold flex items-center gap-1">
                <Info size={10} /> Showing active approved users not yet assigned to the crew.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block font-mono">
              Position / Role
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Director of Photography / Camera Assistant"
              value={crewForm.roleInProduction}
              onChange={(e) => setCrewForm({ ...crewForm, roleInProduction: e.target.value })}
              className={`w-full bg-slate-50/50 border rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition text-slate-900 ${
                castCrewErrors.roleInProduction ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            />
            {castCrewErrors.roleInProduction && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{castCrewErrors.roleInProduction}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
            >
              Assign Crew
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignCrewModal;
