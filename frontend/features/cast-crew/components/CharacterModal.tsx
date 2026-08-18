import React from 'react';
import { X } from 'lucide-react';
import type { Character } from '@/app/types';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacter: Character | null;
  characterForm: { name: string; description: string };
  setCharacterForm: React.Dispatch<React.SetStateAction<{ name: string; description: string }>>;
  onSubmit: (e: React.FormEvent) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  selectedCharacter,
  characterForm,
  setCharacterForm,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <h4 className="font-bold text-slate-800 text-sm">
            {selectedCharacter ? 'Edit Character Details' : 'Create Script Character'}
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">
              Character Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Juliet Capulet"
              value={characterForm.name}
              onChange={(e) => setCharacterForm({ ...characterForm, name: e.target.value })}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">
              Description / Script Notes
            </label>
            <textarea
              rows={4}
              placeholder="Describe the script details, key attributes, or costume requirements..."
              value={characterForm.description}
              onChange={(e) => setCharacterForm({ ...characterForm, description: e.target.value })}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition text-slate-900 resize-none"
            />
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
              {selectedCharacter ? 'Save Changes' : 'Create Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterModal;
