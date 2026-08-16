'use client';

import React, { useState } from 'react';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';

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

  const isIdRejected = adminFeedback?.toLowerCase().match(/id|passport|identity|license/);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-amber-500" /> Step 4: Identity Verification
      </h2>

      {/* Identity Type Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Verification Document Type</label>
        <select
          name="governmentIdType"
          value={formData.governmentIdType}
          onChange={onChange}
          className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 text-slate-200 ${
            errors.governmentIdType ? 'border-red-500/50' : 'border-slate-800'
          }`}
        >
          <option value="">Select ID Type</option>
          <option value="Passport">Passport</option>
          <option value="Driver License">Driver's License</option>
          <option value="National ID Card">National ID Card</option>
        </select>
        {errors.governmentIdType && <span className="text-red-400 text-xs mt-1 block">{errors.governmentIdType}</span>}
      </div>

      {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
      {isIdRejected && (
        <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-center gap-1.5 mb-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Admin requested changes to your ID uploads. Please upload clear, un-cropped images.</span>
        </div>
      )}

      {/* Front Upload */}
      <div className={`p-4 rounded-xl border ${errors.identityDocs || isIdRejected ? 'border-red-500/50 bg-red-950/10' : 'border-slate-800 bg-slate-950/40'} flex items-center justify-between`}>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">ID Document - Front Side</span>
          <p className="text-xs text-slate-500 mt-0.5">Upload a scan/photo of the front of your identification card.</p>
        </div>
        <label className="cursor-pointer px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-2">
          {uploadingFront ? (
            <span className="w-3.5 h-3.5 border border-slate-200 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>Upload Front</span>
          <input type="file" accept="image/*,.pdf" onChange={(e) => handleIdUpload(e, 'front')} disabled={uploadingFront} className="hidden" />
        </label>
      </div>
      {formData.identityDocs?.[0] && (
        <div className="flex flex-col gap-2 -mt-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/20 border border-emerald-950 px-3 py-2 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Front Side Loaded: {formData.identityDocs[0].split('/').pop()}</span>
          </div>
          <div className="w-32 h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
            <img src={formData.identityDocs[0]} alt="Front ID Preview" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Back Upload */}
      <div className={`p-4 rounded-xl border ${errors.identityDocs || isIdRejected ? 'border-red-500/50 bg-red-950/10' : 'border-slate-800 bg-slate-950/40'} flex items-center justify-between`}>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">ID Document - Back Side</span>
          <p className="text-xs text-slate-500 mt-0.5">Upload a scan/photo of the back of your identification card.</p>
        </div>
        <label className="cursor-pointer px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-2">
          {uploadingBack ? (
            <span className="w-3.5 h-3.5 border border-slate-200 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>Upload Back</span>
          <input type="file" accept="image/*,.pdf" onChange={(e) => handleIdUpload(e, 'back')} disabled={uploadingBack} className="hidden" />
        </label>
      </div>
      {formData.identityDocs?.[1] && (
        <div className="flex flex-col gap-2 -mt-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/20 border border-emerald-950 px-3 py-2 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Back Side Loaded: {formData.identityDocs[1].split('/').pop()}</span>
          </div>
          <div className="w-32 h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
            <img src={formData.identityDocs[1]} alt="Back ID Preview" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {errors.identityDocs && <span className="text-red-400 text-xs mt-1 block">{errors.identityDocs}</span>}
    </div>
  );
}
