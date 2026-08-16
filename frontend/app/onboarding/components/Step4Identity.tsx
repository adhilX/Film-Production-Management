'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface Step4Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function Step4Identity({ formData, errors, onChange }: Step4Props) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-purple-400" /> Step 4: Identity Verification & Documents
      </h2>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Verification Document Type</label>
        <select
          name="documentType"
          value={formData.documentType}
          onChange={onChange}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 text-slate-200"
        >
          <option value="Passport">Passport</option>
          <option value="Driver License">Driver's License</option>
          <option value="National ID Card">National ID Card</option>
          <option value="Agency Contract">Agency Contract</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Document ID / Serial Number</label>
        <input 
          type="text" 
          name="nationalId" 
          value={formData.nationalId} 
          onChange={onChange}
          placeholder="AB-98765432-X"
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
        {errors.nationalId && <span className="text-red-400 text-xs mt-1 block">{errors.nationalId}</span>}
      </div>
    </div>
  );
}
