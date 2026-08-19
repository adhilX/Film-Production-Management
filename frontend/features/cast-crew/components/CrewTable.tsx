import React from 'react';
import { Edit, Trash2, Info } from 'lucide-react';
import type { CastCrew } from '@/features/cast-crew/types';

interface CrewTableProps {
  crew: CastCrew[];
  onOpenEdit: (cc: CastCrew) => void;
  onRemove: (id: string) => void;
  canUpdate: boolean;
}

export const CrewTable: React.FC<CrewTableProps> = ({
  crew,
  onOpenEdit,
  onRemove,
  canUpdate,
}) => {
  if (crew.length === 0) {
    return (
      <div className="text-center py-20 space-y-2">
        <Info className="w-10 h-10 text-slate-350 mx-auto" />
        <h5 className="font-bold text-slate-700 text-sm">No crew assignments found</h5>
        <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
          Click "Assign Crew" to map registered users to crew roles.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-200">
          <th className="px-6 py-3.5">User / Contractor</th>
          <th className="px-6 py-3.5">Role / Position</th>
          <th className="px-6 py-3.5">Registered Category</th>
          {canUpdate && <th className="px-6 py-3.5 text-right">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-xs">
        {crew.map((cc) => (
          <tr key={cc._id} className="hover:bg-slate-50/50 transition">
            <td className="px-6 py-4 font-bold text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {cc.userId?.profile?.photoUrl ? (
                    <img src={cc.userId.profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-slate-600">
                      {cc.userId?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <span className="block">{cc.userId?.name}</span>
                  <span className="block text-[9px] text-slate-400 font-semibold font-mono mt-0.5">
                    {cc.userId?.email}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 font-semibold text-slate-700">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-705 border border-slate-200 text-[11px] font-bold">
                {cc.roleInProduction}
              </span>
            </td>
            <td className="px-6 py-4 font-semibold text-slate-500">{cc.userId?.contractorType || 'Crew'}</td>

            {/* Actions */}
            {canUpdate && (
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onOpenEdit(cc)}
                    className="p-1.5 text-slate-450 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    title="Edit Position"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onRemove(cc._id)}
                    className="p-1.5 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Remove Assignment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CrewTable;
