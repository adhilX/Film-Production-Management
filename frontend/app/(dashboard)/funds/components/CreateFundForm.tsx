'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProductionStore } from '@/store/useProductionStore';
import productionsService from '@/services/productionsService';

const fundSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1"),
  justification: z.string()
    .min(10, "Justification must be at least 10 characters")
    .max(500, "Justification must not exceed 500 characters"),
});

type FundFormValues = z.infer<typeof fundSchema>;

interface CreateFundFormProps {
  onSuccess: () => void;
}

export const CreateFundForm: React.FC<CreateFundFormProps> = ({ onSuccess }) => {
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      amount: undefined,
      justification: '',
    }
  });

  const onSubmit = async (data: FundFormValues) => {
    if (!selectedProduction) return;
    setApiError(null);
    try {
      await productionsService.createFundRequest(selectedProduction._id, data);
      reset();
      onSuccess();
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Failed to submit fund request');
    }
  };

  if (!selectedProduction) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
      <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider border-b border-slate-100 pb-3">Request Project Funds</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Amount (USD)</label>
          <input 
            {...register("amount", { valueAsNumber: true })} 
            type="number" 
            placeholder="e.g. 5000" 
            className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
          />
          {errors.amount && <p className="text-red-650 text-[10px] font-bold mt-1.5 uppercase tracking-wider">{errors.amount.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Justification</label>
          <input 
            {...register("justification")} 
            type="text"
            placeholder="Operational justification for these funds..." 
            className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
          />
          {errors.justification && <p className="text-red-650 text-[10px] font-bold mt-1.5 uppercase tracking-wider">{errors.justification.message}</p>}
        </div>

        <div className="md:col-span-1">
          <button 
            disabled={isSubmitting} 
            type="submit"
            className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
          >
            {isSubmitting ? 'Submitting...' : 'Request Funds'}
          </button>
        </div>
      </div>

      {apiError && <p className="text-red-650 text-[10px] font-bold uppercase tracking-wider">{apiError}</p>}
    </form>
  );
};
