'use client';

import React, { useState } from 'react';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import productionsService from '@/services/productionsService';
import { FundRequest } from '@/app/types';

interface FundRequestListProps {
  funds: FundRequest[];
  loading: boolean;
  onRefresh: () => void;
}

export const FundRequestList: React.FC<FundRequestListProps> = ({ funds, loading, onRefresh }) => {
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const handleApprove = async (id: string) => {
    if (!selectedProduction) return;
    setProcessingId(id);
    try {
      await productionsService.updateFundStatus(selectedProduction._id, id, 'Approved');
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to approve fund request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!selectedProduction) return;
    const reason = prompt('Please provide a reason for rejecting this fund request (Required):');
    if (reason === null) return; // User cancelled
    if (reason.trim().length === 0) {
      alert('A rejection reason is required.');
      return;
    }

    setProcessingId(id);
    try {
      await productionsService.updateFundStatus(selectedProduction._id, id, 'Rejected', reason);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to reject fund request');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredFunds = funds.filter(fund => {
    const matchesSearch = fund.justification?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || fund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <input
          type="text"
          placeholder="Search by justification..."
          className="flex-1 bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-705 cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-4 font-bold">Date</th>
              <th className="py-3 px-4 font-bold">Requested By</th>
              <th className="py-3 px-4 font-bold">Amount</th>
              <th className="py-3 px-4 font-bold">Justification</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-20"></div></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-28"></div></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-16"></div></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-44"></div></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-16"></div></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-20"></div></td>
                </tr>
              ))
            ) : filteredFunds.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 px-4 text-center text-slate-400 font-medium">
                  No fund requests found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredFunds.map((fund) => (
                <tr key={fund._id} className="hover:bg-slate-50/40 transition">
                  <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                    {new Date(fund.createdAt || '').toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold whitespace-nowrap">
                    {(fund.requestedBy as any)?.name || 'Unknown User'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold whitespace-nowrap">
                    ${fund.amount?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={fund.justification}>
                    <span className="text-slate-800 font-medium block">{fund.justification}</span>
                    {fund.status === 'Rejected' && fund.rejectionReason && (
                      <span className="text-[10px] text-rose-600 block mt-0.5">Rejected: {fund.rejectionReason}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                      fund.status === 'Approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                      fund.status === 'Rejected' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                      'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                      {fund.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold">
                    {fund.status === 'Pending' && (
                      <div className="flex gap-2">
                        <PermissionGuard permission="funds.approve">
                          <button
                            disabled={processingId === fund._id}
                            onClick={() => handleApprove(fund._id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            Approve
                          </button>
                        </PermissionGuard>
                        <PermissionGuard permission="funds.reject">
                          <button
                            disabled={processingId === fund._id}
                            onClick={() => handleReject(fund._id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </PermissionGuard>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
