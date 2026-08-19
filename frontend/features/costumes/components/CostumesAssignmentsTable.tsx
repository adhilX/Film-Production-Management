import React from 'react';
import { Shirt, Sparkles, User } from 'lucide-react';
import type { CostumeAssignment } from '@/features/costumes/types';

interface CostumesAssignmentsTableProps {
  assignments: CostumeAssignment[];
  onOpenReturn: (assignment: CostumeAssignment) => void;
  canUpdate: boolean;
}

export const CostumesAssignmentsTable: React.FC<CostumesAssignmentsTableProps> = ({
  assignments,
  onOpenReturn,
  canUpdate,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-4 font-bold">Costume</th>
              <th className="py-3 px-4 font-bold">Assigned To</th>
              <th className="py-3 px-4 font-bold">Qty</th>
              <th className="py-3 px-4 font-bold">Assigned Date</th>
              <th className="py-3 px-4 font-bold">Checkout condition</th>
              <th className="py-3 px-4 font-bold">Checkin condition</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <tr key={a._id} className="hover:bg-slate-55/30 transition">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2.5">
                    {a.costumeId?.imageUrl ? (
                      <img src={a.costumeId.imageUrl} alt={a.costumeId.name} className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                        <Shirt size={13} className="text-slate-450" />
                      </div>
                    )}
                    <span className="font-bold text-slate-800">{a.costumeId?.name || 'Deleted Costume'}</span>
                  </div>
                </td>
                <td className="py-4 px-4 font-medium">
                  {a.characterId ? (
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles size={11} className="text-indigo-500" /> {a.characterId.name}
                    </span>
                  ) : a.assignedTo ? (
                    <span className="font-bold text-slate-850 flex items-center gap-1">
                      <User size={11} className="text-slate-500" /> {a.assignedTo.name}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
                <td className="py-4 px-4 font-bold">{a.quantity} items</td>
                <td className="py-4 px-4 text-slate-550 font-mono text-[10px]">
                  {new Date(a.assignedAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`font-semibold ${
                      a.conditionAtAssignment === 'New'
                        ? 'text-emerald-600'
                        : a.conditionAtAssignment === 'Good'
                        ? 'text-indigo-650'
                        : a.conditionAtAssignment === 'Fair'
                        ? 'text-amber-600'
                        : 'text-red-655'
                    }`}
                  >
                    {a.conditionAtAssignment}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {a.conditionAtReturn ? (
                    <span
                      className={`font-semibold ${
                        a.conditionAtReturn === 'New'
                          ? 'text-emerald-600'
                          : a.conditionAtReturn === 'Good'
                          ? 'text-indigo-655'
                          : a.conditionAtReturn === 'Fair'
                          ? 'text-amber-600'
                          : 'text-red-655'
                      }`}
                    >
                      {a.conditionAtReturn}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      a.status === 'Assigned' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  {a.status === 'Assigned' && canUpdate ? (
                    <button
                      onClick={() => onOpenReturn(a)}
                      className="py-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold rounded-lg text-[10px] cursor-pointer shadow-3xs transition"
                    >
                      Check In
                    </button>
                  ) : a.returnedAt ? (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Returned {new Date(a.returnedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostumesAssignmentsTable;
