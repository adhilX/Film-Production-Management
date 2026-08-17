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
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by justification..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Justification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                </tr>
              ))
            ) : filteredFunds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No fund requests found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredFunds.map((fund) => (
                <tr key={fund._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(fund.createdAt || '').toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(fund.requestedBy as any)?.name || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${fund.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={fund.justification}>
                    {fund.justification}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fund.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      fund.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {fund.status === 'Pending' && (
                      <PermissionGuard permission="funds.approve">
                        <div className="flex space-x-2">
                          <button
                            disabled={processingId === fund._id}
                            onClick={() => handleApprove(fund._id)}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={processingId === fund._id}
                            onClick={() => handleReject(fund._id)}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </PermissionGuard>
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
