import React from 'react';
import { X } from 'lucide-react';
import type { Character, CastCrew } from '@/app/types';

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssignment: CastCrew | null;
  editForm: { roleInProduction: string; characterId: string };
  setEditForm: React.Dispatch<React.SetStateAction<{ roleInProduction: string; characterId: string }>>;
  characters: Character[];
  onSubmit: (e: React.FormEvent) => void;
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedAssignment,
  editForm,
  setEditForm,
  characters,
  onSubmit,
}) => {
  if (!isOpen || !selectedAssignment) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <h4 className="font-bold text-slate-800 text-sm">Edit Assignment Details</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl space-y-1 border border-slate-150">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Assigned User</span>
            <span className="block font-bold text-slate-700 text-xs">{selectedAssignment.userId?.name}</span>
            <span className="block text-[9.5px] text-slate-400 font-semibold font-mono">{selectedAssignment.userId?.email}</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Position / Role</label>
            <input
              type="text"
              required
              value={editForm.roleInProduction}
              onChange={(e) => setEditForm({ ...editForm, roleInProduction: e.target.value })}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition text-slate-900"
            />
          </div>

          {/* Only show Character mapper if the assignment is Cast or had character mapped */}
          {(selectedAssignment.characterId || selectedAssignment.userId?.contractorType === 'Cast') && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Map to Script Character</label>
              <select
                value={editForm.characterId}
                onChange={(e) => setEditForm({ ...editForm, characterId: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition cursor-pointer font-bold text-slate-705"
              >
                <option value="">-- No character mapped --</option>

                {/* Preserve currently assigned character */}
                {selectedAssignment.characterId && (
                  <option value={selectedAssignment.characterId._id}>
                    {selectedAssignment.characterId.name} (Current)
                  </option>
                )}

                {/* Show other unassigned characters */}
                {characters
                  .filter((c) => !c.assignments || c.assignments.length === 0 || c._id === selectedAssignment.characterId?._id)
                  .filter((c) => c._id !== selectedAssignment.characterId?._id)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssignmentModal;
