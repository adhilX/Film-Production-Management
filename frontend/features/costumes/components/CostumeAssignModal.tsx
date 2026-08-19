import React from 'react';
import { X } from 'lucide-react';
import type { Costume } from '@/features/costumes/types';
import type { Character, CastCrew } from '@/features/cast-crew/types';

interface CostumeAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCostume: Costume | null;
  assignForm: {
    targetType: 'character' | 'user';
    characterId: string;
    userId: string;
    quantity: number;
    conditionAtAssignment: string;
    notes: string;
  };
  setAssignForm: React.Dispatch<React.SetStateAction<{
    targetType: 'character' | 'user';
    characterId: string;
    userId: string;
    quantity: number;
    conditionAtAssignment: string;
    notes: string;
  }>>;
  characters: Character[];
  castCrewList: CastCrew[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  assignErrors?: Record<string, string>;
}

export const CostumeAssignModal: React.FC<CostumeAssignModalProps> = ({
  isOpen,
  onClose,
  selectedCostume,
  assignForm,
  setAssignForm,
  characters,
  castCrewList,
  isSubmitting,
  onSubmit,
  assignErrors = {},
}) => {
  if (!isOpen || !selectedCostume) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-base">Assign costume: {selectedCostume.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-3.5 flex justify-between items-center text-xs font-medium text-slate-655">
            <span>Available checkout quantity:</span>
            <span className="font-extrabold text-slate-900">{selectedCostume.availableQuantity} items</span>
          </div>

          {/* Target Selector type */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Assign To</label>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setAssignForm((prev) => ({ ...prev, targetType: 'character' }))}
                className={`flex-1 py-2 font-bold cursor-pointer transition ${
                  assignForm.targetType === 'character' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-655'
                }`}
              >
                Character
              </button>
              <button
                type="button"
                onClick={() => setAssignForm((prev) => ({ ...prev, targetType: 'user' }))}
                className={`flex-1 py-2 font-bold cursor-pointer transition ${
                  assignForm.targetType === 'user' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-655'
                }`}
              >
                Cast/Crew member
              </button>
            </div>
          </div>

          {/* Target character select */}
          {assignForm.targetType === 'character' ? (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Character *</label>
              <select
                value={assignForm.characterId}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, characterId: e.target.value }))}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 cursor-pointer ${
                  assignErrors.characterId ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              >
                <option value="">Select Character</option>
                {characters.map((char) => (
                  <option key={char._id} value={char._id}>
                    {char.name}
                  </option>
                ))}
              </select>
              {assignErrors.characterId && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{assignErrors.characterId}</p>
              )}
            </div>
          ) : (
            /* Target user select */
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Cast / Crew Member *</label>
              <select
                value={assignForm.userId}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, userId: e.target.value }))}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 cursor-pointer ${
                  assignErrors.userId ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              >
                <option value="">Select Member</option>
                {castCrewList
                  .filter((cc) => cc.userId)
                  .map((cc) => (
                    <option key={cc.userId._id} value={cc.userId._id}>
                      {cc.userId.name} ({cc.roleInProduction})
                    </option>
                  ))}
              </select>
              {assignErrors.userId && (
                <p className="text-[10px] text-red-500 font-bold mt-1">{assignErrors.userId}</p>
              )}
            </div>
          )}

          {/* Quantity & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Quantity to assign</label>
              <input
                type="number"
                required
                min={1}
                value={assignForm.quantity}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 cursor-pointer ${
                  assignErrors.quantity ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              />
              {assignErrors.quantity && (
                <p className="text-[10px] text-red-500 font-bold mt-1 col-span-2">{assignErrors.quantity}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Condition *</label>
              <select
                value={assignForm.conditionAtAssignment}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, conditionAtAssignment: e.target.value }))}
                className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 cursor-pointer ${
                  assignErrors.conditionAtAssignment ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
                }`}
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>
              {assignErrors.conditionAtAssignment && (
                <p className="text-[10px] text-red-500 font-bold mt-1 col-span-2">{assignErrors.conditionAtAssignment}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">Assignment Notes</label>
            <textarea
              placeholder="Scene number, specific fit notes, or checkout details..."
              value={assignForm.notes}
              onChange={(e) => setAssignForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className={`w-full bg-white border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 cursor-pointer resize-none ${
                assignErrors.notes ? 'border-red-500 focus:border-red-500' : 'border-slate-250'
              }`}
            />
            {assignErrors.notes && (
              <p className="text-[10px] text-red-500 font-bold mt-1">{assignErrors.notes}</p>
            )}
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
              {isSubmitting ? 'Checking Out...' : 'Check Out Costume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CostumeAssignModal;
