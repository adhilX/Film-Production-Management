'use client';

import React from 'react';
import { FileSignature } from 'lucide-react';

interface Step5Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function Step5Contracts({ formData, errors, onChange }: Step5Props) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-purple-400" /> Step 5: Contracts & Agreements
      </h2>

      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer">
          <input 
            type="checkbox"
            name="agreeNda"
            checked={formData.agreeNda}
            onChange={onChange}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Non-Disclosure Agreement (NDA)</span>
            <p className="text-slate-400 mt-0.5">I agree to keep all script assets, character details, and production footage strictly confidential.</p>
          </div>
        </label>
        {errors.agreeNda && <span className="text-red-400 text-xs block">{errors.agreeNda}</span>}

        <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer">
          <input 
            type="checkbox"
            name="agreeSafety"
            checked={formData.agreeSafety}
            onChange={onChange}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Set Safety Regulations</span>
            <p className="text-slate-400 mt-0.5">I agree to follow all production manager safety guidelines on set locations.</p>
          </div>
        </label>
        {errors.agreeSafety && <span className="text-red-400 text-xs block">{errors.agreeSafety}</span>}

        <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer">
          <input 
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={onChange}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Platform Terms of Service</span>
            <p className="text-slate-400 mt-0.5">I accept the terms governing contractor applications and onboarding status.</p>
          </div>
        </label>
        {errors.agreeTerms && <span className="text-red-400 text-xs block">{errors.agreeTerms}</span>}
      </div>
    </div>
  );
}
