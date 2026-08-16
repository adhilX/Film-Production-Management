'use client';

import React from 'react';

interface StepItem {
  title: string;
  icon: React.ComponentType<any>;
}

interface StepperProps {
  step: number;
  stepsList: StepItem[];
}

export default function Stepper({ step, stepsList }: StepperProps) {
  return (
    <div className="flex items-center justify-between relative">
      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-10" />
      <div 
        className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 -z-10"
        style={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
      />

      {stepsList.map((s, idx) => {
        const StepIcon = s.icon;
        const isCompleted = idx + 1 < step;
        const isActive = idx + 1 === step;
        return (
          <div key={idx} className="flex flex-col items-center">
            <div 
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                isCompleted 
                  ? 'bg-purple-600 border-purple-500 text-white' 
                  : isActive 
                  ? 'bg-slate-950 border-purple-400 text-purple-400 shadow-lg shadow-purple-500/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <StepIcon className="w-4 h-4" />
            </div>
            <span className={`text-[10px] mt-1.5 font-medium hidden sm:block ${isActive ? 'text-purple-300' : 'text-slate-500'}`}>
              {s.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
