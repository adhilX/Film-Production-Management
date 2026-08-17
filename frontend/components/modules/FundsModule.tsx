'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/app/components/auth-context';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import type { FundRequest } from '@/app/types';
import productionsService from '@/services/productionsService';

export default function FundsModule() {
  const { token } = useAuth();
  const selectedProduction = useProductionStore(state => state.selectedProduction);

  const [funds, setFunds] = useState<any[]>([]);
  const [newFundAmount, setNewFundAmount] = useState('');
  const [newFundJustify, setNewFundJustify] = useState('');
  const [newFundError, setNewFundError] = useState('');

  useEffect(() => {
    if (selectedProduction && token) {
      fetchFunds();
    }
  }, [selectedProduction, token]);

  const fetchFunds = async () => {
    if (!selectedProduction) return;
    try {
      const data = await productionsService.getFunds(selectedProduction._id);
      setFunds(data);
    } catch (e) {
      console.error('Error fetching fund requests:', e);
    }
  };

  const handleSubmitFundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewFundError('');
    if (!selectedProduction) return;

    try {
      await productionsService.createFundRequest(selectedProduction._id, {
        amount: Number(newFundAmount),
        justification: newFundJustify,
      });

      setNewFundAmount('');
      setNewFundJustify('');
      fetchFunds();
    } catch (err: any) {
      setNewFundError(err.message);
    }
  };

  const handleUpdateFundStatus = async (fundId: string, status: string) => {
    if (!selectedProduction) return;
    try {
      await productionsService.updateFundStatus(selectedProduction._id, fundId, status);
      fetchFunds();
    } catch (err: any) {
      setNewFundError(err.message);
    }
  };

  if (!selectedProduction) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Budget & Fund Requests</h2>
        <p className="text-xs text-slate-400 mt-1">Submit budget requests for equipment, costumes, or operations. Gated by managers.</p>
      </div>

      {newFundError && (
        <div className="p-3.5 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs font-semibold leading-relaxed">
          <AlertTriangle size={14} className="inline mr-2 text-red-500" />
          {newFundError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Requests history */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Fund Request History</h3>
          
          {funds.length > 0 ? (
            <div className="space-y-3">
              {funds.map((f) => (
                <div key={f._id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg text-emerald-400">${f.amount.toLocaleString()}</span>
                      <span className={`text-[10px] font-semibold py-0.5 px-2 border rounded ${
                        f.status === 'Approved'
                          ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400'
                          : f.status === 'Rejected'
                          ? 'bg-red-950/30 border-red-900 text-red-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{f.justification}</p>
                    <span className="text-[10px] text-slate-500 mt-1.5 block">Requested by: {f.requestedBy?.name || 'Unknown'} ({f.requestedBy?.email})</span>
                  </div>

                  <PermissionGuard permission="funds.approve">
                    {f.status === 'Pending' && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleUpdateFundStatus(f._id, 'Approved')}
                          className="flex-1 sm:flex-none py-1 px-3 bg-emerald-700/20 hover:bg-emerald-700/30 border border-emerald-700/40 rounded text-xs font-semibold text-emerald-450 cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateFundStatus(f._id, 'Rejected')}
                          className="flex-1 sm:flex-none py-1 px-3 bg-red-700/20 hover:bg-red-700/30 border border-red-700/40 rounded text-xs font-semibold text-red-450 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </PermissionGuard>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-12 bg-slate-900/20 border border-slate-800 rounded-xl">
              No fund requests found.
            </div>
          )}
        </div>

        {/* Submit request form */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Submit Request</h3>
          
          <form onSubmit={handleSubmitFundRequest} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request Amount (USD)</label>
              <input 
                type="number" 
                placeholder="e.g. 5000"
                value={newFundAmount}
                onChange={(e) => setNewFundAmount(e.target.value)}
                required
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Justification / Operational Cost</label>
              <textarea 
                placeholder="Explain what these funds are required for..."
                value={newFundJustify}
                onChange={(e) => setNewFundJustify(e.target.value)}
                required
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200 resize-none"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold transition-all cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.2)]"
            >
              Submit Fund Request
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
