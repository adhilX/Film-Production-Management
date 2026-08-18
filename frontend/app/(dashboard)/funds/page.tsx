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
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-16 text-center text-slate-450">
        Please select a project to view funds.
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Only visible to those who can request funds */}
      <PermissionGuard permission="funds.request">
        <CreateFundForm onSuccess={fetchFunds} />
      </PermissionGuard>

      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider border-b border-slate-100 pb-3">Request History</h3>
        <FundRequestList funds={funds} loading={loading} onRefresh={fetchFunds} />
      </section>
    </div>
  );
}
