import React from 'react';
import type { Budget } from '@/features/funds/types';

interface BudgetUtilizationBarProps {
  budget: Budget | null;
  utilizationPercentage: number;
}

export const BudgetUtilizationBar: React.FC<BudgetUtilizationBarProps> = ({
  budget,
  utilizationPercentage,
}) => {
  if (!budget) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
        <span>Budget Utilization</span>
        <span>{utilizationPercentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            utilizationPercentage >= 90
              ? 'bg-rose-600'
              : utilizationPercentage >= 70
              ? 'bg-amber-500'
              : 'bg-indigo-600'
          }`}
          style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span>0%</span>
        <span>{utilizationPercentage >= 100 ? 'Overdraft!' : '100%'}</span>
      </div>
    </div>
  );
};

export default BudgetUtilizationBar;
