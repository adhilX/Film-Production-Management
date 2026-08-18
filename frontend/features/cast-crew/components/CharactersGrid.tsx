import React from 'react';
import { Edit, Trash2, Info } from 'lucide-react';
import type { Character } from '@/app/types';

interface CharactersGridProps {
  characters: Character[];
  onOpenEdit: (c: Character) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
}

export const CharactersGrid: React.FC<CharactersGridProps> = ({
  characters,
  onOpenEdit,
  onDelete,
  canUpdate,
}) => {
  if (characters.length === 0) {
    return (
      <div className="text-center py-20 space-y-2">
        <Info className="w-10 h-10 text-slate-350 mx-auto" />
        <h5 className="font-bold text-slate-700 text-sm">No characters found</h5>
        <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
          Try refining your search or add a new character to this project.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
      {characters.map((char) => (
        <div
          key={char._id}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-slate-250 transition duration-200"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-bold text-slate-800 text-sm leading-snug">{char.name}</h4>

              {/* Management Actions */}
              {canUpdate && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onOpenEdit(char)}
                    className="p-1.5 text-slate-450 hover:text-indigo-650 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="Edit Character"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(char._id)}
                    className="p-1.5 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete Character"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium min-h-[36px]">
              {char.description || 'No script character profile/description details provided.'}
            </p>
          </div>

          {/* Assignments Detail */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">Assigned Actor</span>
            {char.assignments && char.assignments.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-5.5 h-5.5 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center overflow-hidden">
                  {(char.assignments[0] as any)?.profile?.photoUrl ? (
                    <img src={(char.assignments[0] as any).profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-indigo-600">
                      {(char.assignments[0] as any).name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-700">{(char.assignments[0] as any).name}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 italic font-semibold">Unassigned</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CharactersGrid;
