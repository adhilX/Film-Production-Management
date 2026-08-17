import React from 'react';
import Link from 'next/link';
import { Clock, Shield, Save, Bell } from 'lucide-react';

interface RightSidebarProps {
  step: number;
  progressPercentage: number;
  progressColor: string;
  formData: any;
}

export default function RightSidebar({ step, progressPercentage, progressColor, formData }: RightSidebarProps) {
  return (
    <aside className="w-full lg:w-[300px] bg-[#f8fafc] border-l border-slate-200/80 p-6 space-y-6 lg:fixed lg:top-20 lg:right-0 lg:bottom-0 lg:h-[calc(100vh-80px)] lg:overflow-y-auto z-20">
      {step === 6 ? (
        <>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-3">Application Summary</h4>
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">Contractor Type</span>
                <span className="text-xs font-bold text-slate-800">{formData.contractorType || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">Department</span>
                <span className="text-xs font-bold text-slate-800">{formData.department || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">Position</span>
                <span className="text-xs font-bold text-slate-800">{formData.position || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">Experience</span>
                <span className="text-xs font-bold text-slate-800">{formData.experience || 'N/A'}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <Link href="/onboarding/details" className="text-[11px] font-bold text-[#4f46e5] hover:text-indigo-700 transition">View Full Details &rarr;</Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2 text-left">
            <h4 className="text-xs font-bold text-slate-800">Need Help?</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">If you have any questions about your application, feel free to reach out.</p>
            <button className="w-full mt-2 py-2 bg-indigo-50 text-[#4f46e5] hover:bg-indigo-100 text-xs font-bold rounded-xl transition">
              Contact Support &rarr;
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Card 1: Overall Progress */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Overall Progress</span>
              <span className="font-extrabold font-mono transition-colors duration-500" style={{ color: progressColor }}>{progressPercentage}%</span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%`, backgroundColor: progressColor }}
              />
            </div>

            <span className="block text-[11px] text-slate-400 font-medium">
              {step} of 5 steps completed
            </span>
          </div>

          {/* Card 2: What to Expect list */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800">What to Expect</h4>
            
            <div className="space-y-4">
              
              {/* Expect 1 */}
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-[#e0e7ff] text-[#4f46e5] rounded-xl shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800 font-sans">Takes about 10–15 minutes</span>
                  <p className="text-[10px] text-slate-405 leading-normal mt-0.5">Complete all steps at your own pace.</p>
                </div>
              </div>

              {/* Expect 2 */}
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-emerald-50 text-emerald-650 rounded-xl shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800">Secure & Confidential</span>
                  <p className="text-[10px] text-slate-405 leading-normal mt-0.5">Your information is safe with us.</p>
                </div>
              </div>

              {/* Expect 3 */}
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-teal-50 text-teal-650 rounded-xl shrink-0">
                  <Save className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800">Save & Continue</span>
                  <p className="text-[10px] text-slate-405 leading-normal mt-0.5">You can save progress and continue later.</p>
                </div>
              </div>

              {/* Expect 4 */}
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-800">Get Notified</span>
                  <p className="text-[10px] text-slate-405 leading-normal mt-0.5">We'll notify you once your onboarding is reviewed.</p>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </aside>
  );
}
