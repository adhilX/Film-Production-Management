import React from 'react';
import { X, Shirt, Calendar } from 'lucide-react';
import type { Costume, CostumeAssignment } from '@/app/types';

interface CostumeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detailCostume: Costume | null;
  assignments: CostumeAssignment[];
}

export const CostumeDetailModal: React.FC<CostumeDetailModalProps> = ({
  isOpen,
  onClose,
  detailCostume,
  assignments,
}) => {
  if (!isOpen || !detailCostume) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-2xl w-full space-y-6 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-lg">{detailCostume.name}</h3>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mt-1">
              {detailCostume.category}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Image and details */}
          <div className="md:col-span-1 space-y-4">
            <div className="h-40 bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden flex items-center justify-center">
              {detailCostume.imageUrl ? (
                <img src={detailCostume.imageUrl} alt={detailCostume.name} className="w-full h-full object-cover" />
              ) : (
                <Shirt className="w-12 h-12 text-slate-350 stroke-1" />
              )}
            </div>

            <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-450 font-medium">Size</span>
                <span className="font-extrabold text-slate-800">{detailCostume.size || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455 font-medium">Condition</span>
                <span className="font-extrabold text-slate-800">{detailCostume.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455 font-medium">Status</span>
                <span className="font-extrabold text-slate-800">{detailCostume.status}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2 mt-2">
                <span className="text-slate-455 font-medium">Total Quantity</span>
                <span className="font-black text-slate-900">{detailCostume.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455 font-medium">Available</span>
                <span className="font-black text-slate-900">{detailCostume.availableQuantity}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Descriptions & history */}
          <div className="md:col-span-2 space-y-5">
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 border border-slate-150/60 rounded-xl p-3.5">
                {detailCostume.description || 'No description logged.'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-indigo-500" /> Assignment History Log
              </h4>

              {assignments.filter((a) => a.costumeId?._id === detailCostume._id).length === 0 ? (
                <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 font-medium">
                  No assignments registered for this asset.
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {assignments
                    .filter((a) => a.costumeId?._id === detailCostume._id)
                    .map((a) => (
                      <div key={a._id} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50/40 transition">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            {a.characterId ? (
                              <span>{a.characterId.name}</span>
                            ) : (
                              <span>{a.assignedTo?.name || 'Cast'}</span>
                            )}
                            <span
                              className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.25 rounded ${
                                a.status === 'Assigned' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
                            Assigned: {new Date(a.assignedAt).toLocaleDateString()}
                            {a.returnedAt && ` • Returned: ${new Date(a.returnedAt).toLocaleDateString()}`}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-slate-800 block">{a.quantity} qty</span>
                          <span className="text-[10px] text-slate-455 block font-medium">Cond: {a.conditionAtAssignment}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostumeDetailModal;
