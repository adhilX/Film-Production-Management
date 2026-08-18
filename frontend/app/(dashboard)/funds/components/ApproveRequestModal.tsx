import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useProductionStore } from '@/store/useProductionStore';
import fundsService from '@/services/fundsService';
import { FundRequest } from '@/app/types';
import { formatError } from '@/utils/format-error';

interface ApproveRequestModalProps {
  request: FundRequest;
  remainingBudget: number; // in paise
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApproveRequestModal({
  request,
  remainingBudget,
  currency,
  onClose,
  onSuccess,
}: ApproveRequestModalProps) {
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const [apiError, setApiError] = useState<string | null>(null);

  const maxAllowedAmount = Math.min(request.requestedAmount, remainingBudget);
  const maxAllowedAmountRupees = maxAllowedAmount / 100;

  const approveSchema = z.object({
    approvedAmount: z.number()
      .positive('Approved amount must be positive')
      .finite()
      .max(request.requestedAmount / 100, `Approved amount cannot exceed requested amount (${request.requestedAmount / 100})`)
      .max(remainingBudget / 100, `Approved amount cannot exceed remaining budget (${remainingBudget / 100})`),
  });

  type ApproveFormValues = z.infer<typeof approveSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApproveFormValues>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      approvedAmount: request.requestedAmount / 100,
    },
  });

  const onSubmit = async (values: ApproveFormValues) => {
    if (!selectedProduction) return;
    setApiError(null);
    try {
      const approvedAmountPaise = Math.round(values.approvedAmount * 100);

      await fundsService.approveFundRequest(selectedProduction._id, request._id, {
        approvedAmount: approvedAmountPaise,
      });
      toast.success('Fund request approved successfully.');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      let customMsg = '';
      if (
        msg === 'Approvers cannot approve their own fund requests.' ||
        (Array.isArray(msg) && msg.includes('Approvers cannot approve their own fund requests.'))
      ) {
        customMsg = 'You cannot approve your own fund request.';
      } else {
        customMsg = formatError(err, 'Failed to approve fund request');
      }
      setApiError(customMsg);
      toast.error(customMsg);
    }
  };

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
    }).format(paise / 100);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Approve Fund Request</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Review and allocate funds for: <strong className="text-slate-700">{request.title}</strong>
          </p>
        </div>

        {/* Info Grid */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Requested Amount:</span>
            <span className="font-bold text-slate-800">{formatCurrency(request.requestedAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining Budget:</span>
            <span className="font-bold text-slate-800">{formatCurrency(remainingBudget)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200/60 pt-2 text-indigo-700">
            <span>Max Approvable:</span>
            <span className="font-extrabold">{formatCurrency(maxAllowedAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Approved Amount ({currency})
              </label>
              <button
                type="button"
                onClick={() => setValue('approvedAmount', request.requestedAmount / 100)}
                className="text-[9px] text-indigo-600 hover:text-indigo-700 font-extrabold uppercase tracking-wider"
              >
                Approve Full
              </button>
            </div>
            <input
              {...register('approvedAmount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              max={maxAllowedAmountRupees}
              placeholder="e.g. 50000"
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
            />
            {errors.approvedAmount && <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.approvedAmount.message}</p>}
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
