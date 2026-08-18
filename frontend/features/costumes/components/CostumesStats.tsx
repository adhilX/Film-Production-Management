import React from 'react';

interface CostumesStatsProps {
  totalItems: number;
  availableItems: number;
  assignedItems: number;
  damagedOrLost: number;
  loading: boolean;
}

export const CostumesStats: React.FC<CostumesStatsProps> = ({
  totalItems,
  availableItems,
  assignedItems,
  damagedOrLost,
  loading,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Items</span>
        <span className="text-2xl font-black text-slate-900 block mt-1">{loading ? '...' : totalItems}</span>
      </div>
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-green-600">Available Pool</span>
        <span className="text-2xl font-black text-slate-900 block mt-1">{loading ? '...' : availableItems}</span>
      </div>
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-indigo-600">Currently Assigned</span>
        <span className="text-2xl font-black text-slate-900 block mt-1">{loading ? '...' : assignedItems}</span>
      </div>
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-amber-600">Damaged / Lost Types</span>
        <span className="text-2xl font-black text-slate-900 block mt-1">{loading ? '...' : damagedOrLost}</span>
      </div>
    </div>
  );
};

export default CostumesStats;
