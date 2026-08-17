'use client';

import React from 'react';
import { User, Users, Box, Building, Check, Briefcase, Video, IdCard } from 'lucide-react';

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
      description: 'Independent professionals hired on a contract basis.',
      icon: User,
      bgClass: 'bg-indigo-50/80',
      iconClass: 'text-indigo-600',
    },
    {
      id: 'Cast',
      title: 'Cast',
      description: 'Actors, performers, and talent.',
      icon: Users,
      bgClass: 'bg-blue-50/80',
      iconClass: 'text-blue-700',
    },
    {
      id: 'Crew',
      title: 'Crew',
      description: 'Technical and creative production staff.',
      icon: Video,
      bgClass: 'bg-green-50/80',
      iconClass: 'text-green-600',
    },
    {
      id: 'Supplier',
      title: 'Supplier',
      description: 'Vendors providing equipment, catering, or services.',
      icon: Box,
      bgClass: 'bg-amber-50/80',
      iconClass: 'text-amber-600',
    },
    {
      id: 'Agent',
      title: 'Agent',
      description: 'Representatives and managers of talent.',
      icon: Briefcase,
      bgClass: 'bg-orange-50/80',
      iconClass: 'text-orange-650',
    },
    {
      id: 'Cast-Crew Agent',
      title: 'Cast-Crew Agent',
      description: 'Agencies representing multiple talent members.',
      icon: Users,
      bgClass: 'bg-teal-50/80',
      iconClass: 'text-teal-600',
    },
    {
      id: 'TCS Team',
      title: 'TCS Team',
      description: 'Internal film production management and operations.',
      icon: IdCard,
      bgClass: 'bg-sky-50/80',
      iconClass: 'text-sky-600',
    },
    {
      id: 'Production Company',
      title: 'Production Company',
      description: 'Studios and companies managing projects.',
      icon: Building,
      bgClass: 'bg-purple-50/80',
      iconClass: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900">Select Contractor Type</h3>
        <p className="text-xs text-slate-500">Please select the type that best describes you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {contractorTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = formData.contractorType === type.id;

          return (
            <div
              key={type.id}
              onClick={() => onFieldChange('contractorType', type.id)}
              className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 select-none flex flex-col justify-between min-h-[125px] ${
                isSelected
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/10'
                  : 'border-slate-200/80 bg-white hover:border-slate-350'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl ${type.bgClass} ${type.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {/* Checked Badge */}
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3.5]" />}
                </div>
              </div>

              <div className="mt-4">
                <span className="block font-bold text-sm text-slate-800">{type.title}</span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{type.description}</p>
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
