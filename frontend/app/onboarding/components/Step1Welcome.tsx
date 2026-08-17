'use client';

import React from 'react';
import { User, Users, Box, Building, GraduationCap, Check } from 'lucide-react';

interface Step1Props {
  formData: any;
  errors: Record<string, string>;
  onFieldChange: (name: string, value: any) => void;
}

export default function Step1Welcome({ formData, errors, onFieldChange }: Step1Props) {
  const contractorTypes = [
    {
      id: 'Freelancer',
      title: 'Freelancer',
      description: 'Individuals working as Cast, Crew, or Interns.',
      icon: User,
    },
    {
      id: 'Cast',
      title: 'Cast',
      description: 'Specific for Actors and Talent.',
      icon: Users,
    },
    {
      id: 'Supplier',
      title: 'Supplier',
      description: 'Companies or Agencies providing services/equipment.',
      icon: Box,
    },
    {
      id: 'Cast-Crew Agent',
      title: 'Cast-Crew Agent',
      description: 'Representatives of talent.',
      icon: Users,
    },
    {
      id: 'TCS Team',
      title: 'TCS Team',
      description: 'Internal team members (Production-side).',
      icon: Building,
    },
    {
      id: 'Production Company',
      title: 'Production Company',
      description: 'Businesses managing the overall film project.',
      icon: Building,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">Select Contractor Type</h3>
        <p className="text-xs text-slate-500">Please select the type that best describes you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {contractorTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = formData.contractorType === type.id;

          return (
            <div
              key={type.id}
              onClick={() => onFieldChange('contractorType', type.id)}
              className={`relative p-5 rounded-2xl border text-left cursor-pointer transition-all duration-355 select-none flex flex-col justify-between min-h-[140px] ${
                isSelected
                  ? 'border-[#4f46e5] bg-[#e0e7ff]/10 ring-2 ring-[#4f46e5]/20'
                  : 'border-slate-200 bg-white hover:border-slate-350 hover:scale-101'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#e0e7ff] text-[#4f46e5]' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {/* Checked Badge */}
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'bg-[#4f46e5] border-[#4f46e5] text-white' : 'border-slate-300'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <div className="mt-4">
                <span className="block font-bold text-sm text-slate-800">{type.title}</span>
                <p className="text-xs text-slate-405 mt-1">{type.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {errors.contractorType && (
        <span className="text-red-500 text-xs mt-1 block font-semibold">{errors.contractorType}</span>
      )}
    </div>
  );
}
