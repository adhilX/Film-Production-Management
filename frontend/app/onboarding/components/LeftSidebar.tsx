import React from 'react';
import { Check, Headphones } from 'lucide-react';

interface LeftSidebarProps {
  step: number;
  stepsList: Array<{ title: string; desc: string; icon: React.ElementType }>;
}

export default function LeftSidebar({ step, stepsList }: LeftSidebarProps) {
  return (
    <aside className="w-full lg:w-[320px] bg-white text-slate-650 flex flex-col justify-between shrink-0 border-r border-slate-200/80 p-6 lg:fixed lg:top-20 lg:bottom-0 lg:h-[calc(100vh-80px)] z-20">
      <div className="space-y-4">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans">Onboarding Steps</span>
        
        {/* Steps List */}
        <nav className="space-y-2">
          {stepsList.map((s, idx) => {
            const StepIcon = s.icon;
            const isCompleted = idx + 1 < step;
            const isActive = idx + 1 === step;

            if (isCompleted) {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-slate-600 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Green Check Circle */}
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    {/* Step Number */}
                    <span className="text-xs font-black text-emerald-600 font-mono">{idx + 1}</span>
                    
                    {/* Title & Desc */}
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-slate-900 leading-none">
                        {s.title}
                      </span>
                      <span className="block text-[10px] mt-1 text-slate-400 font-medium leading-none">
                        {s.desc}
                      </span>
                    </div>
                  </div>

                  {/* Completed Badge */}
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                    Completed
                  </span>
                </div>
              );
            } else if (isActive) {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#4f46e5] to-[#3b82f6] text-white font-semibold shadow-lg shadow-indigo-600/15"
                >
                  <div className="flex items-center gap-3">
                    {/* Semi-transparent icon container */}
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                      <StepIcon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    
                    {/* Title & Desc */}
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-white leading-none">
                        {idx + 1} {s.title}
                      </span>
                      <span className="block text-[10px] mt-1.5 text-indigo-100 font-medium leading-none">
                        {s.desc}
                      </span>
                    </div>
                  </div>

                  {/* Dashed Active Indicator Circle */}
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-dashed flex items-center justify-center shrink-0" />
                </div>
              );
            } else {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl text-slate-600"
                >
                  <div className="flex items-center gap-3">
                    {/* Hollow Step Index Circle */}
                    <div className="w-6 h-6 rounded-full border border-slate-200 bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                      {idx + 1}
                    </div>
                    
                    {/* Title & Desc */}
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-slate-700 leading-none">
                        {s.title}
                      </span>
                      <span className="block text-[10px] mt-1 text-slate-400 font-medium leading-none">
                        {s.desc}
                      </span>
                    </div>
                  </div>

                  {/* Empty Circle Indicator */}
                  <div className="w-5 h-5 rounded-full border border-slate-200 shrink-0" />
                </div>
              );
            }
          })}
        </nav>
      </div>

      {/* Sidebar Help Card */}
      <div className="mt-8 p-4.5 bg-[#f8fafc] border border-slate-200/80 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-slate-800">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
            <Headphones className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">Need Help?</span>
        </div>
        <p className="text-[11px] text-slate-550 leading-normal">
          If you face any issues during onboarding, our team is here to help.
        </p>
        <a
          href="mailto:support@tendagon.com"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4f46e5] hover:text-indigo-650 transition"
        >
          Contact Support &rarr;
        </a>
      </div>
    </aside>
  );
}
