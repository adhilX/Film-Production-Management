import React from 'react';
import { X, Info } from 'lucide-react';
import type { Character } from '@/features/cast-crew/types';
import type { User } from '@/features/users/types';

interface AssignCastModalProps {
  isOpen: boolean;
  onClose: () => void;
  castForm: { userId: string; roleInProduction: string; characterId: string };
  setCastForm: React.Dispatch<React.SetStateAction<{ userId: string; roleInProduction: string; characterId: string }>>;
  eligibleCast: User[];
  characters: Character[];
  onSubmit: (e: React.FormEvent) => void;
  castCrewErrors?: Record<string, string>;
}

export const AssignCastModal: React.FC<AssignCastModalProps> = ({
  isOpen,
  onClose,
  castForm,
  setCastForm,
  eligibleCast,
  characters,
  onSubmit,
  castCrewErrors = {},
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <h4 className="font-bold text-slate-800 text-sm">Assign Cast Member</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block font-mono">
              Select Actor / User
            </label>
            <select
              required
              value={castForm.userId}
              onChange={(e) => setCastForm({ ...castForm, userId: e.target.value })}
              className={`w-full bg-slate-50/50 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition cursor-pointer font-bold text-slate-700 ${
                castCrewErrors.userId ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            >
              <option value="">-- Choose registered actor --</option>
              {eligibleCast.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
            {castCrewErrors.userId ? (
              <p className="text-[10px] text-red-500 font-bold mt-1">{castCrewErrors.userId}</p>
            ) : (
              <p className="text-[10px] text-slate-450 italic mt-1 font-semibold flex items-center gap-1">
                <Info size={10} /> Showing active approved users not yet assigned a character.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block font-mono">
              Role in Production
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lead / Supporting / Stunt Double"
              value={castForm.roleInProduction}
              onChange={(e) => setCastForm({ ...castForm, roleInProduction: e.target.value })}
              className={`w-full bg-slate-50/50 border rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition text-slate-900 ${
                castCrewErrors.roleInProduction ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            />
            {castCrewErrors.roleInProduction && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{castCrewErrors.roleInProduction}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block font-mono">
              Map to Script Character (Optional)
            </label>
            <select
              value={castForm.characterId}
              onChange={(e) => setCastForm({ ...castForm, characterId: e.target.value })}
              className={`w-full bg-slate-50/50 border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition cursor-pointer font-bold text-slate-705 ${
                castCrewErrors.characterId ? 'border-red-500 focus:border-red-500' : 'border-slate-200'
              }`}
            >
              <option value="">-- Select Character --</option>
              {characters
                .filter((c) => !c.assignments || c.assignments.length === 0)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {castCrewErrors.characterId && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{castCrewErrors.characterId}</p>
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
              Assign Cast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignCastModal;
