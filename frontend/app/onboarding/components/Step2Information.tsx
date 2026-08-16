'use client';

import React from 'react';
import { User } from 'lucide-react';

interface Step2Props {
  formData: any;
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function Step2Information({ formData, errors, onChange }: Step2Props) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <User className="w-5 h-5 text-purple-400" /> Step 2: Your Information & Classification
      </h2>

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
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name}</span>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Email Address</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={onChange}
            placeholder="john@production.com"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email}</span>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Password</label>
          <input 
            type="password" 
            name="password" 
            value={formData.password} 
            onChange={onChange}
            placeholder="••••••••"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          {errors.password && <span className="text-red-400 text-xs mt-1 block">{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Confirm Password</label>
          <input 
            type="password" 
            name="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={onChange}
            placeholder="••••••••"
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          {errors.confirmPassword && <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword}</span>}
        </div>
      </div>

      {/* Contractor Type Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Contractor Identity Type (Document 3 Specification)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {['Freelancer', 'Cast', 'Crew', 'Supplier', 'Agent', 'Production Company'].map((type) => (
            <label 
              key={type} 
              className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                formData.contractorType === type 
                  ? 'bg-purple-950/40 border-purple-500/80 text-purple-300 shadow-md shadow-purple-500/10' 
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input 
                type="radio" 
                name="contractorType" 
                value={type} 
                checked={formData.contractorType === type}
                onChange={onChange}
                className="sr-only"
              />
              <span className="font-semibold text-xs text-slate-200">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Bio & Skills */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Skills & Background Bio</label>
        <textarea 
          name="bio" 
          value={formData.bio} 
          onChange={onChange}
          rows={2}
          placeholder="Describe your production skills, equipment, or role expectations..."
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
        />
        {errors.bio && <span className="text-red-400 text-xs mt-1 block">{errors.bio}</span>}
      </div>
    </div>
  );
}
