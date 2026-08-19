import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useProductionStore } from '@/store/useProductionStore';
import fundsService from '@/services/fundsService';
import type { Budget } from '@/features/funds/types';
import { formatError } from '@/utils/format-error';
import { getBudgetSchema, type BudgetFormValues } from '@/features/funds/validations/budget.validation';

interface EditBudgetModalProps {
  budget: Budget;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBudgetModal({
  budget,
  onClose,
  onSuccess,
}: EditBudgetModalProps) {
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const [apiError, setApiError] = useState<string | null>(null);

  const minBudgetAllowedRupees = budget.allocatedAmount / 100;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(getBudgetSchema(minBudgetAllowedRupees)),
    defaultValues: {
      totalBudget: budget.totalBudget / 100,
      currency: budget.currency || 'INR',
    },
  });

  const onSubmit = async (values: BudgetFormValues) => {
    if (!selectedProduction) return;
    setApiError(null);
    try {
      const totalBudgetPaise = Math.round(values.totalBudget * 100);

      await fundsService.updateBudget(selectedProduction._id, {
        totalBudget: totalBudgetPaise,
        currency: values.currency,
      });
      toast.success('Project budget updated successfully.');
      onSuccess();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to update project budget');
      setApiError(errMsg);
      toast.error(errMsg);
    }
  };

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat(budget.currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: budget.currency,
    }).format(paise / 100);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Update Project Budget Limit</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Modify the total funds limit allocated to: <strong className="text-slate-700">{selectedProduction?.title}</strong>
          </p>
        </div>

        {/* Info Grid */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Currently Allocated:</span>
            <span className="font-bold text-slate-800">{formatCurrency(budget.allocatedAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Minimum Allowed:</span>
            <span className="font-bold text-slate-850">{formatCurrency(budget.allocatedAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Total Budget
              </label>
              <input
                {...register('totalBudget', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min={minBudgetAllowedRupees}
                placeholder="e.g. 500000"
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
              {errors.totalBudget && <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.totalBudget.message}</p>}
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                {...register('currency')}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              {errors.currency && <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.currency.message}</p>}
            </div>
          </div>

          {apiError && <p className="text-rose-600 text-[10px] font-bold uppercase tracking-wider">{apiError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
