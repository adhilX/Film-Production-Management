'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';

interface Step3Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function Step3Financial({ formData, errors, onChange }: Step3Props) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-purple-400" /> Step 3: Financial Details & Payout
      </h2>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Desired Daily Rate ($ USD)</label>
        <input 
          type="number" 
          name="dailyRate" 
          value={formData.dailyRate} 
          onChange={onChange}
          min={1}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
        />
        {errors.dailyRate && <span className="text-red-400 text-xs mt-1 block">{errors.dailyRate}</span>}
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Bank Account / Routing / IBAN</label>
        <input 
          type="text" 
          name="bankAccount" 
          value={formData.bankAccount} 
          onChange={onChange}
          placeholder="US12345678909876"
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
        {errors.bankAccount && <span className="text-red-400 text-xs mt-1 block">{errors.bankAccount}</span>}
      </div>
    </div>
  );
}
