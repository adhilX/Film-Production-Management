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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex gap-4 items-start">
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
          <input 
            {...register("amount", { valueAsNumber: true })} 
            type="number" 
            placeholder="e.g. 5000" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
          <textarea 
            {...register("justification")} 
            placeholder="Operational justification for these funds..." 
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.justification && <p className="text-red-500 text-sm mt-1">{errors.justification.message}</p>}
        </div>

        {apiError && <p className="text-red-500 text-sm">{apiError}</p>}
      </div>

      <button 
        disabled={isSubmitting} 
        type="submit"
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium whitespace-nowrap"
      >
        {isSubmitting ? 'Submitting...' : 'Request Funds'}
      </button>
    </form>
  );
};
