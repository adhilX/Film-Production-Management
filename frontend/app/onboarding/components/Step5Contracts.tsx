'use client';

import React from 'react';
import { FileSignature } from 'lucide-react';
import SignaturePad from '@/app/components/SignaturePad';

interface Step5Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFieldChange: (name: string, value: any) => void;
  adminFeedback?: string | null;
}

export default function Step5Contracts({ formData, errors, onChange, onFieldChange, adminFeedback }: Step5Props) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <FileSignature className="w-5 h-5 text-[#4f46e5]" /> Step 5: NDA & Signatures
      </h2>

      {/* NDA Checkbox */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer shadow-sm">
          <input 
            type="checkbox"
            name="agreeNda"
            checked={formData.agreeNda}
            onChange={onChange}
            className="mt-0.5 rounded border-slate-300 bg-white text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800">Non-Disclosure Agreement (NDA)</span>
            <p className="text-slate-500 mt-0.5">I agree to keep all script assets, character details, budget details, and production footage strictly confidential.</p>
          </div>
        </label>
        {errors.agreeNda && <span className="text-red-500 text-xs block font-semibold">{errors.agreeNda}</span>}

        {/* Terms Checkbox */}
        <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer shadow-sm">
          <input 
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={onChange}
            className="mt-0.5 rounded border-slate-300 bg-white text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800">Platform Terms & Conditions</span>
            <p className="text-slate-500 mt-0.5">I accept all policies regarding contractor verification, payment schedules, and compliance standards.</p>
          </div>
        </label>
        {errors.agreeTerms && <span className="text-red-500 text-xs block font-semibold">{errors.agreeTerms}</span>}
      </div>

      {/* Digital Signature Drawing Board */}
      <div className="mt-4">
        <SignaturePad
          value={formData.signatureData}
          onChange={(val) => onFieldChange('signatureData', val)}
          error={errors.signatureData}
        />
      </div>
    </div>
  );
}
