'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Step6Props {
  formData: any;
}

export default function Step6Review({ formData }: Step6Props) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Step 6: Application Review & Submission
      </h2>
      <p className="text-xs text-slate-400">
        Please review your information. Submitting will transition your application to the <strong>Pending Review</strong> state for Production Manager evaluation.
      </p>

      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-2.5 text-xs">
        <div className="flex justify-between border-b border-slate-900 pb-1.5">
          <span className="text-slate-500">Applicant Name</span>
          <span className="font-semibold text-slate-200">{formData.name}</span>
        </div>
        <div className="flex justify-between border-b border-slate-900 pb-1.5">
          <span className="text-slate-500">Email</span>
          <span className="font-semibold text-slate-200">{formData.email}</span>
        </div>
        <div className="flex justify-between border-b border-slate-900 pb-1.5">
          <span className="text-slate-500">Contractor Type</span>
          <span className="font-semibold text-purple-400">{formData.contractorType}</span>
        </div>
        <div className="flex justify-between border-b border-slate-900 pb-1.5">
          <span className="text-slate-500">Daily Payout Target</span>
          <span className="font-semibold text-emerald-400">${formData.dailyRate} / day</span>
        </div>
        <div className="flex justify-between border-b border-slate-900 pb-1.5">
          <span className="text-slate-500">Verification Document</span>
          <span className="font-semibold text-slate-200">{formData.documentType} ({formData.nationalId})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Application State</span>
          <span className="font-semibold text-amber-400">Draft ➔ Pending Review</span>
        </div>
      </div>
    </div>
  );
}
