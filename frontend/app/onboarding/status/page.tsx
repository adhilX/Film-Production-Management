"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function OnboardingStatusPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const checkStatus = useAuthStore((state) => state.checkStatus);
  const logout = useAuthStore((state) => state.logout);
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    const statusData = await checkStatus();
    setChecking(false);
    if (statusData?.onboardingStatus === 'approved') {
      router.push('/');
    } else if (statusData?.onboardingStatus === 'changes-requested') {
      router.push('/onboarding');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-6 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl text-center">
        {/* Film slate style header */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-widest text-amber-500 uppercase">CINE-FACTORY LOGISTICS</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Application Under Review
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
          Thank you, <span className="text-slate-200 font-semibold">{user?.name}</span>. Your onboarding information is being reviewed by the operations team.
        </p>

        {/* Queue Visual Indicator */}
        <div className="mb-10 p-6 bg-slate-950/60 border border-slate-800/80 rounded-xl text-left">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-slate-500 font-mono">QUEUE STATUS</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Position #3 in queue
            </span>
          </div>

          <div className="relative pl-8 space-y-6">
            {/* Vertical timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-800" />

            {/* Step 1 */}
            <div className="relative flex items-start">
              <div className="absolute -left-8 mt-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-emerald-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">Application Submitted</h4>
                <p className="text-xs text-slate-500">Form step 1 to 6 completed successfully.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start">
              <div className="absolute -left-8 mt-1 w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-400 text-sm">Compliance & Identity Audit</h4>
                <p className="text-xs text-slate-400">Verifying tax documents and government credentials.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-start">
              <div className="absolute -left-8 mt-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-500 text-sm">Administrator Final Sign-off</h4>
                <p className="text-xs text-slate-600">Permissions tier assignment and account activation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-500/50 text-slate-950 font-semibold rounded-lg transition duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10"
          >
            {checking ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
            <span>Check Review Status</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition duration-200 border border-slate-700"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
