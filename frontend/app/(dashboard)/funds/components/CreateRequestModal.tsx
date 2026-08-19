import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useProductionStore } from '@/store/useProductionStore';
import fundsService from '@/services/fundsService';
import { formatError } from '@/utils/format-error';

import { requestSchema, type RequestFormValues } from '@/features/funds/validations/fund-request.validation';

interface CreateRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
  remainingBudget: number; // in paise
  currency: string;
}

export default function CreateRequestModal({
  onClose,
  onSuccess,
  remainingBudget,
  currency,
}: CreateRequestModalProps) {
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Equipment',
      requestedAmount: undefined,
    },
  });

  const onSubmit = async (values: RequestFormValues) => {
    if (!selectedProduction) return;
    setApiError(null);
    try {
      // Convert to integer smallest currency unit (paise/cents)
      const requestedAmountPaise = Math.round(values.requestedAmount * 100);
      
      await fundsService.createFundRequest(selectedProduction._id, {
        title: values.title,
        description: values.description,
        category: values.category,
        requestedAmount: requestedAmountPaise,
      });
      toast.success('Fund request submitted successfully.');
      onSuccess();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to submit fund request');
      setApiError(errMsg);
      toast.error(errMsg);
    }
  };

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
    }).format(paise / 100);
  };

  const categoriesList = ['Equipment', 'Logistics', 'Catering', 'Locations', 'Cast & Crew', 'Costumes', 'Assets', 'Other'];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Request Project Funds</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Submit a new fund request for Project: <strong className="text-slate-700">{selectedProduction?.title}</strong>
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between text-xs text-slate-600">
          <span>Remaining Budget:</span>
          <span className="font-bold text-slate-800">{formatCurrency(remainingBudget)}</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Stage Rental Downpayment"
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
            />
            {errors.title && <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                {...register('category')}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-850 cursor-pointer"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount ({currency})</label>
              <input
                {...register('requestedAmount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="e.g. 50000"
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
              />
              {errors.requestedAmount && <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.requestedAmount.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description / Justification</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Provide details on what these funds will be allocated for..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
            />
            {errors.description && <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.description.message}</p>}
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
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
