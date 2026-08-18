import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useProductionStore } from '@/store/useProductionStore';
import fundsService from '@/services/fundsService';
import { FundRequest } from '@/app/types';
import { formatError } from '@/utils/format-error';

interface RejectRequestModalProps {
  request: FundRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const rejectSchema = z.object({
  rejectionReason: z.string()
    .min(5, 'Rejection reason must be at least 5 characters')
    .max(500, 'Rejection reason must not exceed 500 characters'),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

export default function RejectRequestModal({
  request,
  onClose,
  onSuccess,
}: RejectRequestModalProps) {
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      rejectionReason: '',
    },
  });

  const onSubmit = async (values: RejectFormValues) => {
    if (!selectedProduction) return;
    setApiError(null);
    try {
      await fundsService.rejectFundRequest(selectedProduction._id, request._id, {
        rejectionReason: values.rejectionReason,
      });
      toast.success('Fund request rejected successfully.');
      onSuccess();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to reject fund request');
      setApiError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Reject Fund Request</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Reject allocation request for: <strong className="text-slate-700">{request.title}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Rejection Reason
            </label>
            <textarea
              {...register('rejectionReason')}
              rows={4}
              placeholder="e.g. Budget over-allocation or duplicated request."
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
            />
            {errors.rejectionReason && <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase tracking-wider">{errors.rejectionReason.message}</p>}
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
