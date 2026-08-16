'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Step6Props {
  formData: any;
}

export default function Step6Review({ formData }: Step6Props) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Step 6: Review & Final Submission
      </h2>
      <p className="text-xs text-slate-400">
        Please review all your details carefully. Submitting will transition your application to the <strong>Pending Review</strong> state for administrator audit.
      </p>

      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-4 text-xs">
        {/* Section 1: Professional */}
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">1. Profile & Classification</span>
          <div className="space-y-2 pl-2 border-l border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">Full Name</span>
              <span className="font-semibold text-slate-200">{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone</span>
              <span className="font-semibold text-slate-200">{formData.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Department & Position</span>
              <span className="font-semibold text-slate-200">{formData.department} - {formData.position}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Experience</span>
              <span className="font-semibold text-slate-200 truncate max-w-xs">{formData.experience}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Financial */}
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">2. Payout & Taxes</span>
          <div className="space-y-2 pl-2 border-l border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">Bank Details</span>
              <span className="font-semibold text-slate-200">{formData.bankName} ({formData.accountNumber})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tax Document</span>
              <span className="font-semibold text-emerald-400">{formData.taxFormUrl ? 'Uploaded ✓' : 'Missing ✗'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Identity */}
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">3. Identification</span>
          <div className="space-y-2 pl-2 border-l border-slate-850">
            <div className="flex justify-between">
              <span className="text-slate-400">ID Type</span>
              <span className="font-semibold text-slate-200">{formData.governmentIdType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Front & Back Uploads</span>
              <span className="font-semibold text-slate-200">
                {formData.identityDocs?.[0] ? 'Front ✓' : 'Front ✗'} | {formData.identityDocs?.[1] ? 'Back ✓' : 'Back ✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Signature */}
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2">4. Signed NDA & Signature Preview</span>
          <div className="space-y-2 pl-2 border-l border-slate-850 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">NDA & Terms Agreed:</span>
                <span className="text-emerald-400 font-semibold">{formData.agreeNda && formData.agreeTerms ? 'Yes ✓' : 'No ✗'}</span>
              </div>
            </div>
            {formData.signatureData && (
              <div className="border border-slate-800 bg-slate-900 rounded-lg p-1.5 h-12 w-32 flex items-center justify-center overflow-hidden">
                <img src={formData.signatureData} alt="Signature Preview" className="h-full object-contain filter invert opacity-80" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
