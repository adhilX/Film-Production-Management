import React from 'react';
import { Shirt, Edit, Trash2 } from 'lucide-react';
import type { Costume } from '@/app/types';

interface CostumesGridProps {
  costumes: Costume[];
  onOpenDetail: (c: Costume) => void;
  onOpenEdit: (c: Costume) => void;
  onOpenAssign: (c: Costume) => void;
  onDeleteCostume: (id: string, name: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export const CostumesGrid: React.FC<CostumesGridProps> = ({
  costumes,
  onOpenDetail,
  onOpenEdit,
  onOpenAssign,
  onDeleteCostume,
  canUpdate,
  canDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {costumes.map((c) => (
        <div
          key={c._id}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-2xs hover:shadow-xs transition group relative"
        >
          {/* Costume image preview */}
          <div className="h-44 bg-slate-55 relative overflow-hidden border-b border-slate-100 flex items-center justify-center">
            {c.imageUrl ? (
              <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-103 transition duration-300" />
            ) : (
              <Shirt className="w-12 h-12 text-slate-350 stroke-1" />
            )}

            {/* Status badge */}
            <span
              className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm ${
                c.status === 'Available'
                  ? 'bg-green-105 text-green-700'
                  : c.status === 'Assigned'
                  ? 'bg-indigo-105 text-indigo-700'
                  : c.status === 'Damaged'
                  ? 'bg-red-105 text-red-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {c.status}
            </span>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-start gap-4">
                <h4
                  onClick={() => onOpenDetail(c)}
                  className="font-black text-sm text-slate-850 hover:text-indigo-600 transition cursor-pointer"
                >
                  {c.name}
                </h4>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                  Size: {c.size || 'N/A'}
                </span>
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mt-1.5">
                {c.category}
              </span>
              <p className="text-xs text-slate-450 mt-2 line-clamp-2 leading-relaxed">
                {c.description || 'No description provided.'}
              </p>
            </div>

            <div className="divide-y divide-slate-100 space-y-3 pt-3 border-t border-slate-100 text-xs">
              {/* Quantities */}
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650">
                <span>Available / Total</span>
                <span className="font-bold text-slate-800">
                  {c.availableQuantity} / {c.quantity} items
                </span>
              </div>

              {/* Condition */}
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 pt-2">
                <span>Condition</span>
                <span
                  className={`font-extrabold ${
                    c.condition === 'New'
                      ? 'text-emerald-650'
                      : c.condition === 'Good'
                      ? 'text-indigo-650'
                      : c.condition === 'Fair'
                      ? 'text-amber-650'
                      : 'text-red-650'
                  }`}
                >
                  {c.condition}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-3 gap-2">
                <button
                  onClick={() => onOpenDetail(c)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  View History
                </button>

                <div className="flex gap-2">
                  {canUpdate && (
                    <>
                      <button
                        onClick={() => onOpenEdit(c)}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit size={13} />
                      </button>

                      <button
                        onClick={() => onOpenAssign(c)}
                        disabled={c.availableQuantity <= 0}
                        className="flex items-center gap-1 py-1.5 px-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 rounded-xl text-[10px] font-bold cursor-pointer transition shadow-3xs disabled:cursor-not-allowed"
                      >
                        Assign
                      </button>
                    </>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => onDeleteCostume(c._id, c.name)}
                      className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CostumesGrid;
