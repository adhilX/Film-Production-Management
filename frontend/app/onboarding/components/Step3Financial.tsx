'use client';

import React, { useState } from 'react';
import { CreditCard, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';

interface Step3Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFieldChange: (name: string, value: any) => void;
  adminFeedback?: string | null;
}

export default function Step3Financial({ formData, errors, onChange, onFieldChange, adminFeedback }: Step3Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleTaxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const res = await authService.uploadOnboardingFile(file, 'taxForm');
      onFieldChange('taxFormUrl', res.fileUrl);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload tax form.');
    } finally {
      setUploading(false);
    }
  };

  const isBankRejected = adminFeedback?.toLowerCase().match(/bank|account|routing/);
  const isTaxRejected = adminFeedback?.toLowerCase().match(/tax|w9|w8|form/);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-amber-500" /> Step 3: Financial Details & Tax Documents
      </h2>

      {/* Bank Name */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Bank Name</label>
        <input 
          type="text" 
          name="bankName" 
          value={formData.bankName} 
          onChange={onChange}
          placeholder="Chase Bank"
          className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 ${
            errors.bankName || isBankRejected ? 'border-red-500/50' : 'border-slate-800'
          }`}
        />
        {errors.bankName && <span className="text-red-400 text-xs mt-1 block">{errors.bankName}</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Account Number */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Account Number</label>
          <input 
            type="text" 
            name="accountNumber" 
            value={formData.accountNumber} 
            onChange={onChange}
            placeholder="123456789"
            className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 ${
              errors.accountNumber || isBankRejected ? 'border-red-500/50' : 'border-slate-800'
            }`}
          />
          {errors.accountNumber && <span className="text-red-400 text-xs mt-1 block">{errors.accountNumber}</span>}
        </div>

        {/* Routing Number */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Routing Number</label>
          <input 
            type="text" 
            name="routingNumber" 
            value={formData.routingNumber} 
            onChange={onChange}
            placeholder="021000021"
            className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 ${
              errors.routingNumber || isBankRejected ? 'border-red-500/50' : 'border-slate-800'
            }`}
          />
          {errors.routingNumber && <span className="text-red-400 text-xs mt-1 block">{errors.routingNumber}</span>}
        </div>
      </div>

      {/* Tax Form Upload */}
      <div className={`p-4 rounded-xl border ${isTaxRejected ? 'border-red-500/50 bg-red-950/10' : 'border-slate-800 bg-slate-950/40'} space-y-3`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">W-9 or W-8BEN Form Upload</span>
            <p className="text-xs text-slate-500 mt-0.5">Please sign and upload your tax documentation (PDF or Image format).</p>
          </div>
          <label className="cursor-pointer px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-2">
            {uploading ? (
              <span className="w-3.5 h-3.5 border border-slate-200 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>Upload Document</span>
            <input type="file" accept=".pdf,image/*" onChange={handleTaxUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        {formData.taxFormUrl && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/20 border border-emerald-950 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Document Uploaded: {formData.taxFormUrl.split('/').pop()}</span>
            </div>
            <div className="w-32 h-40 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
              {formData.taxFormUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={formData.taxFormUrl} className="w-full h-full bg-white" title="Tax Form Preview" />
              ) : (
                <img src={formData.taxFormUrl} alt="Tax Form Preview" className="w-full h-full object-cover" />
              )}
            </div>
          </div>
        )}

        {isTaxRejected && (
          <div className="text-red-400 text-xs flex items-center gap-1.5 mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Admin rejected this tax form. Please upload a valid W9/W8-BEN.</span>
          </div>
        )}

        {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
        {errors.taxFormUrl && <span className="text-red-400 text-xs mt-1 block">{errors.taxFormUrl}</span>}
      </div>
    </div>
  );
}
