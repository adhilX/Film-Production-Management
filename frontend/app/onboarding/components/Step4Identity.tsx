'use client';

import React, { useState } from 'react';
import { ShieldCheck, Upload, AlertCircle, HelpCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import UploadedFileCard from '@/app/components/UploadedFileCard';

interface Step4Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFieldChange: (name: string, value: any) => void;
  adminFeedback?: string | null;
}

export default function Step4Identity({ formData, errors, onChange, onFieldChange, adminFeedback }: Step4Props) {
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>, position: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (position === 'front') setUploadingFront(true);
    else setUploadingBack(true);

    setUploadError(null);
    try {
      const res = await authService.uploadOnboardingFile(file, 'identityDoc');
      const currentDocs = [...(formData.identityDocs || [])];
      if (position === 'front') {
        currentDocs[0] = res.fileUrl;
      } else {
        currentDocs[1] = res.fileUrl;
      }
      onFieldChange('identityDocs', currentDocs);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload identity document.');
    } finally {
      if (position === 'front') setUploadingFront(false);
      else setUploadingBack(false);
    }
  };

  const handleRemoveDoc = (position: 'front' | 'back') => {
    const currentDocs = [...(formData.identityDocs || [])];
    if (position === 'front') {
      currentDocs[0] = '';
    } else {
      currentDocs[1] = '';
    }
    onFieldChange('identityDocs', currentDocs);
  };

  const isIdRejected = adminFeedback?.toLowerCase().match(/id|passport|identity|license/);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Identity Type Selection */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800">Verification Document Type</label>
        <select
          name="governmentIdType"
          value={formData.governmentIdType}
          onChange={onChange}
          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 ${
            errors.governmentIdType ? 'border-red-500/50' : 'border-slate-200'
          }`}
        >
          <option value="">Select ID Type</option>
          <option value="Passport">Passport</option>
          <option value="Driver License">Driver's License</option>
          <option value="National ID Card">National ID Card</option>
        </select>
        {errors.governmentIdType && <span className="text-red-505 text-xs mt-1 block font-semibold">{errors.governmentIdType}</span>}
      </div>

      {uploadError && <p className="text-red-505 text-xs font-semibold">{uploadError}</p>}
      {isIdRejected && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-1.5 mb-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-650" />
          <span>Admin requested changes to your ID uploads. Please upload clear, un-cropped images.</span>
        </div>
      )}

      {/* Front Upload */}
      <div className={`p-5 rounded-2xl border ${errors.identityDocs || isIdRejected ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="block text-xs font-bold text-slate-800">ID Document - Front Side</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
            </div>
            <p className="text-[11px] text-slate-550">Upload a scan/photo of the front of your identification card.</p>
          </div>
          
          <label className="cursor-pointer shrink-0 px-4.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition flex items-center justify-center gap-2">
            {uploadingFront ? (
              <span className="w-3.5 h-3.5 border border-slate-550 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>Upload Front</span>
            <input type="file" accept="image/*,.pdf" onChange={(e) => handleIdUpload(e, 'front')} disabled={uploadingFront} className="hidden" />
          </label>
        </div>

        {formData.identityDocs?.[0] && (
          <UploadedFileCard
            fileUrl={formData.identityDocs[0]}
            fileName={formData.identityDocs[0].split('/').pop() || 'ID_Front_Side.png'}
            label="Front ID"
            successMessage="Front ID uploaded successfully"
            onRemove={() => handleRemoveDoc('front')}
          />
        )}
      </div>

      {/* Back Upload */}
      <div className={`p-5 rounded-2xl border ${errors.identityDocs || isIdRejected ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="block text-xs font-bold text-slate-800">ID Document - Back Side</span>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
            </div>
            <p className="text-[11px] text-slate-550">Upload a scan/photo of the back of your identification card.</p>
          </div>
          
          <label className="cursor-pointer shrink-0 px-4.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition flex items-center justify-center gap-2">
            {uploadingBack ? (
              <span className="w-3.5 h-3.5 border border-slate-550 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>Upload Back</span>
            <input type="file" accept="image/*,.pdf" onChange={(e) => handleIdUpload(e, 'back')} disabled={uploadingBack} className="hidden" />
          </label>
        </div>

        {formData.identityDocs?.[1] && (
          <UploadedFileCard
            fileUrl={formData.identityDocs[1]}
            fileName={formData.identityDocs[1].split('/').pop() || 'ID_Back_Side.png'}
            label="Back ID"
            successMessage="Back ID uploaded successfully"
            onRemove={() => handleRemoveDoc('back')}
          />
        )}
      </div>

      {errors.identityDocs && <span className="text-red-500 text-xs mt-1 block font-semibold">{errors.identityDocs}</span>}
    </div>
  );
}
