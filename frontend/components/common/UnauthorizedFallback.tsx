"use client";

import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const UnauthorizedFallback: React.FC = () => {
  const router = useRouter();

  return (
    <div className="flex-1 min-h-[450px] flex items-center justify-center bg-[#f8fafc] px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 border border-slate-200 rounded-3xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="inline-flex p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl">
          <ShieldAlert size={40} className="stroke-[1.8]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Access Denied
          </h2>
          <p className="text-sm font-semibold text-slate-400 leading-relaxed">
            You do not have the required permissions to view this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer"
          >
            <Home size={14} />
            Go Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedFallback;
