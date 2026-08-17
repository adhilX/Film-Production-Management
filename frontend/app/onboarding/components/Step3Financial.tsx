'use client';

import React, { useState } from 'react';
import { CreditCard, Upload, AlertCircle, Copy, HelpCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import UploadedFileCard from '@/app/components/UploadedFileCard';

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
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

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

  const handleCopy = () => {
    if (!formData.accountNumber) return;
    navigator.clipboard.writeText(formData.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveFile = () => {
    onFieldChange('taxFormUrl', '');
  };

  const isBankRejected = adminFeedback?.toLowerCase().match(/bank|account|routing/);
  const isTaxRejected = adminFeedback?.toLowerCase().match(/tax|w9|w8|form/);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Bank Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800">Bank Name</label>
        <input 
          type="text" 
          name="bankName" 
          value={formData.bankName} 
          onChange={onChange}
          placeholder="Chase Bank"
          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 ${
            errors.bankName || isBankRejected ? 'border-red-500/50' : 'border-slate-200'
          }`}
        />
        {errors.bankName && <span className="text-red-500 text-xs mt-1 block font-semibold">{errors.bankName}</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Account Number */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">Account Number</label>
          <div className="relative flex items-center">
            <input 
              type="text" 
              name="accountNumber" 
              value={formData.accountNumber} 
              onChange={onChange}
              placeholder="Enter account number"
              className={`w-full bg-white border rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 ${
                errors.accountNumber || isBankRejected ? 'border-red-500/50' : 'border-slate-200'
              }`}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copied && (
              <span className="absolute -top-6 right-0 bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-sans">
                Copied!
              </span>
            )}
          </div>
          {errors.accountNumber && <span className="text-red-500 text-xs mt-1 block font-semibold">{errors.accountNumber}</span>}
        </div>

        {/* Routing Number */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">Routing Number / IFSC</label>
          <input 
            type="text" 
            name="routingNumber" 
            value={formData.routingNumber} 
            onChange={onChange}
            placeholder="021000021"
            className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 ${
              errors.routingNumber || isBankRejected ? 'border-red-500/50' : 'border-slate-200'
            }`}
          />
          {errors.routingNumber && <span className="text-red-500 text-xs mt-1 block font-semibold">{errors.routingNumber}</span>}
        </div>
      </div>

      {/* Tax Form Upload Section */}
      <div className={`p-5 rounded-2xl border ${isTaxRejected ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="block text-xs font-bold text-slate-800">W-9 or W-8BEN Form Upload</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
            </div>
            <p className="text-[11px] text-slate-550">Please sign and upload your tax documentation (PDF or Image format).</p>
          </div>
          
          <label className="cursor-pointer shrink-0 px-4.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition flex items-center justify-center gap-2">
            {uploading ? (
              <span className="w-3.5 h-3.5 border border-slate-550 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>Upload Document</span>
            <input type="file" accept=".pdf,image/*" onChange={handleTaxUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        {formData.taxFormUrl && (
          <UploadedFileCard
            fileUrl={formData.taxFormUrl}
            label="Tax Form"
            onRemove={handleRemoveFile}
          />
        )}

        {isTaxRejected && (
          <div className="text-red-500 text-xs flex items-center gap-1.5 mt-1 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Admin rejected this tax form. Please upload a valid W9/W8-BEN.</span>
          </div>
        )}

        {uploadError && <p className="text-red-500 text-xs font-semibold">{uploadError}</p>}
        {errors.taxFormUrl && <span className="text-red-500 text-xs mt-1 block font-semibold">{errors.taxFormUrl}</span>}
      </div>
    </div>
  );
}
