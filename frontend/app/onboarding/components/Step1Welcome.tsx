'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Step1Welcome() {
  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-2">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-xl font-semibold text-slate-100">Welcome to the Production Platform</h2>
      <p className="text-sm text-slate-300 leading-relaxed">
        Thank you for applying to join our film production system. This onboarding process registers your identity and establishes your <strong>Contractor Classification</strong> (e.g. Freelancer, Cast, Supplier).
      </p>
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <p className="font-semibold text-slate-200 uppercase tracking-wider">What to expect:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>Specify account credentials and select your contractor identity type</li>
          <li>Provide financial payout details for production fund distributions</li>
          <li>Upload national ID / contract document serial for compliance</li>
          <li>Review & agree to NDA and safety regulations</li>
        </ul>
      </div>
    </div>
  );
}
