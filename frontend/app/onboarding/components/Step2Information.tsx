'use client';

import React, { useState } from 'react';
import { User, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';

interface Step2Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFieldChange: (name: string, value: any) => void;
  adminFeedback?: string | null;
}

export default function Step2Information({ formData, errors, onChange, onFieldChange, adminFeedback }: Step2Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const res = await authService.uploadOnboardingFile(file, 'photo');
      onFieldChange('photoUrl', res.fileUrl);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const isPhotoRejected = adminFeedback?.toLowerCase().match(/photo|image|face/);
  const isProfileRejected = adminFeedback?.toLowerCase().match(/phone|name|profile|department|position/);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <User className="w-5 h-5 text-amber-500" /> Step 2: Profile & Professional Information
      </h2>

      {/* Profile Photo Upload */}
      <div className={`p-4 rounded-xl border ${isPhotoRejected ? 'border-red-500/50 bg-red-950/10' : 'border-slate-800 bg-slate-950/40'} flex flex-col sm:flex-row items-center gap-4`}>
        <div className="relative w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {formData.photoUrl ? (
            <img 
              src={formData.photoUrl.startsWith('http') ? formData.photoUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${formData.photoUrl}`} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <User className="w-8 h-8 text-slate-600" />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Profile Photo</span>
          <p className="text-xs text-slate-500">Upload a professional headshot (JPG or PNG).</p>
          {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
          {isPhotoRejected && (
            <div className="text-red-400 text-xs flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Admin marked this photo as rejected/blurry. Please re-upload.</span>
            </div>
          )}
        </div>
        <label className="cursor-pointer px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-2">
          {uploading ? (
            <span className="w-3.5 h-3.5 border border-slate-200 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>{formData.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
        </label>
      </div>
      {errors.photoUrl && <span className="text-red-400 text-xs block">{errors.photoUrl}</span>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Full Name</label>
          <input 
            type="text"
            name="name" 
            value={formData.name} 
            onChange={onChange}
            placeholder="John Doe"
            className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 ${
              errors.name || isProfileRejected ? 'border-red-500/50' : 'border-slate-800'
            }`}
          />
          {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name}</span>}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Phone Number</label>
          <input 
            type="text"
            name="phoneNumber" 
            value={formData.phoneNumber} 
            onChange={onChange}
            placeholder="+1 (555) 019-2834"
            className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 ${
              errors.phoneNumber || isProfileRejected ? 'border-red-500/50' : 'border-slate-800'
            }`}
          />
          {errors.phoneNumber && <span className="text-red-400 text-xs mt-1 block">{errors.phoneNumber}</span>}
        </div>

        {/* Department Dropdown */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={onChange}
            className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 ${
              errors.department || isProfileRejected ? 'border-red-500/50' : 'border-slate-800'
            }`}
          >
            <option value="">Select Department</option>
            <option value="Production">Production</option>
            <option value="Camera">Camera</option>
            <option value="Sound">Sound</option>
            <option value="Art">Art</option>
            <option value="Wardrobe">Wardrobe</option>
            <option value="Makeup">Makeup</option>
            <option value="Cast">Cast</option>
            <option value="Crew">Crew</option>
            <option value="Other">Other</option>
          </select>
          {errors.department && <span className="text-red-400 text-xs mt-1 block">{errors.department}</span>}
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Position</label>
          <input 
            type="text"
            name="position" 
            value={formData.position} 
            onChange={onChange}
            placeholder="Director of Photography"
            className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 ${
              errors.position || isProfileRejected ? 'border-red-500/50' : 'border-slate-800'
            }`}
          />
          {errors.position && <span className="text-red-400 text-xs mt-1 block">{errors.position}</span>}
        </div>
      </div>

      {/* Experience Summary */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Experience Summary</label>
        <textarea 
          name="experience" 
          value={formData.experience} 
          onChange={onChange}
          rows={3}
          placeholder="List major projects, years of active production work, and equipment proficiency..."
          className={`w-full bg-slate-950/70 border rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none ${
            errors.experience ? 'border-red-500/50' : 'border-slate-800'
          }`}
        />
        {errors.experience && <span className="text-red-400 text-xs mt-1 block">{errors.experience}</span>}
      </div>
    </div>
  );
}
