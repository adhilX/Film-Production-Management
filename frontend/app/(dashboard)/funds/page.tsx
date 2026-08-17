'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import { FundRequestList } from './components/FundRequestList';
import { CreateFundForm } from './components/CreateFundForm';
import productionsService from '@/services/productionsService';
import { FundRequest } from '@/app/types';

export default function FundsPage() {
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const [funds, setFunds] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFunds = useCallback(async () => {
    if (!selectedProduction) return;
    setLoading(true);
    try {
      const data = await productionsService.getFunds(selectedProduction._id);
      setFunds(data);
    } catch (error) {
      console.error('Failed to fetch funds', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProduction]);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  if (!selectedProduction) {
    return (
      <div className="p-6 flex justify-center text-gray-500">
        Please select a production to view funds.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 justify-between items-start">
        <h1 className="text-2xl font-bold">Fund Management</h1>

        {/* Only visible to those who can request funds */}
        <div className="w-full">
          <PermissionGuard permission="funds.request">
            <CreateFundForm onSuccess={fetchFunds} />
          </PermissionGuard>
        </div>
      </div>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Request History</h2>
        <FundRequestList funds={funds} loading={loading} onRefresh={fetchFunds} />
      </section>
    </div>
  );
}
