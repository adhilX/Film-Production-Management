import React from 'react';
import { IndianRupee, CheckCircle, Info, Clock, Pencil } from 'lucide-react';
import type { Budget } from '@/features/funds/types';

interface BudgetStatsProps {
  budget: Budget | null;
  pendingRequestsSum: number;
  requestsPendingCount: number;
  formatCurrency: (amount: number, currency?: string) => string;
  hasPermission: (permission: string) => boolean;
  setIsEditBudgetOpen: (val: boolean) => void;
  utilizationPercentage: number;
  isBudgetLow: boolean;
}

export const BudgetStats: React.FC<BudgetStatsProps> = ({
  budget,
  pendingRequestsSum,
  requestsPendingCount,
  formatCurrency,
  hasPermission,
  setIsEditBudgetOpen,
  utilizationPercentage,
  isBudgetLow,
}) => {
  const currency = budget?.currency || 'INR';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Total Project Budget */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Project Budget</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">
              {budget ? formatCurrency(budget.totalBudget, budget.currency) : '₹0.00'}
            </h2>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>
        {hasPermission('funds.approve') && (
          <button
            onClick={() => setIsEditBudgetOpen(true)}
            className="mt-3.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Update Limit
          </button>
        )}
      </div>

      {/* Allocated Amount */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allocated Amount</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">
              {budget ? formatCurrency(budget.allocatedAmount, budget.currency) : '₹0.00'}
            </h2>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-semibold">
          {utilizationPercentage.toFixed(1)}% utilized
        </p>
      </div>

      {/* Remaining Budget */}
      <div
        className={`bg-white border rounded-2xl p-5 shadow-sm transition-colors ${
          isBudgetLow ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Budget</span>
            <h2 className={`text-xl font-bold mt-1.5 ${isBudgetLow ? 'text-amber-850' : 'text-slate-900'}`}>
              {budget ? formatCurrency(budget.remainingAmount, budget.currency) : '₹0.00'}
            </h2>
          </div>
          <div className={`p-2.5 rounded-xl ${isBudgetLow ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>
            <Info className="h-5 w-5" />
          </div>
        </div>
        <p className={`text-[10px] mt-4 uppercase tracking-wider font-semibold ${isBudgetLow ? 'text-amber-700' : 'text-slate-400'}`}>
          {isBudgetLow ? 'Warning: Low remaining budget!' : 'Available for allocation'}
        </p>
      </div>

      {/* Pending Requests */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">
              {budget ? formatCurrency(pendingRequestsSum, budget.currency) : '₹0.00'}
            </h2>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-semibold">
          {requestsPendingCount} requests pending review
        </p>
      </div>
    </div>
  );
};

export default BudgetStats;
