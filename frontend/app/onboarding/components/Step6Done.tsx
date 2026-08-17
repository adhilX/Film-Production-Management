'use client';

import React from 'react';
import Link from 'next/link';
import { ClipboardList, Clock, FileText, CheckCircle2, Edit, Mail, AlertCircle, RefreshCw } from 'lucide-react';

interface Step6DoneProps {
  status?: string;
  adminFeedback?: string | null;
  onEdit?: () => void;
}

export default function Step6Done({ status = 'in-progress', adminFeedback, onEdit }: Step6DoneProps) {
  const submitDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date());

  const isChangesRequested = status === 'changes-requested' || status === 'rejected' || !!adminFeedback;

  return (
    <div className="flex flex-col items-center justify-center text-center py-2 sm:py-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-4">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center rotate-3 relative z-10 shadow-sm border ${isChangesRequested ? 'bg-red-100 border-red-200' : 'bg-indigo-100 border-indigo-200'}`}>
          {isChangesRequested ? (
            <AlertCircle className="w-10 h-10 text-red-500" />
          ) : (
            <ClipboardList className="w-10 h-10 text-[#4f46e5]" />
          )}
        </div>
        {!isChangesRequested && (
          <>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center z-20 shadow-sm border border-amber-200">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            {/* Decorative sparkles */}
            <div className="absolute -top-4 -left-4 w-3 h-3 bg-indigo-200 rounded-full opacity-60" />
            <div className="absolute top-4 -right-6 w-2 h-2 bg-amber-200 rounded-full opacity-60" />
          </>
        )}
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
        {isChangesRequested ? 'Changes Requested' : 'Your Onboarding Has Been Submitted!'}
      </h2>
      <h3 className={`text-base sm:text-lg font-bold mb-4 ${isChangesRequested ? 'text-red-500' : 'text-[#4f46e5]'}`}>
        {isChangesRequested ? 'Please review your application' : 'Waiting for Admin Approval'}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
        {isChangesRequested
          ? 'The administrator has reviewed your application and requested some changes before it can be approved.'
          : 'Thank you for completing the onboarding process. Your application is currently under review by our administrator. You will be notified once your application is reviewed.'}
      </p>

      {isChangesRequested && adminFeedback && (
        <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-5 text-left shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="font-bold uppercase tracking-wider text-xs">Reason for Changes</span>
          </div>
          <p className="text-sm font-medium pl-7">{adminFeedback}</p>
        </div>
      )}

      {/* Status Box */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-left w-full sm:w-auto">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isChangesRequested ? 'bg-red-50' : 'bg-indigo-50'}`}>
            {isChangesRequested ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Clock className="w-5 h-5 text-[#4f46e5]" />}
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Status</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                {isChangesRequested ? 'Changes Requested' : 'Pending Review'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isChangesRequested 
                  ? 'bg-red-50 text-red-600 border-red-200/50' 
                  : 'bg-amber-50 text-amber-600 border-amber-200/50'
              }`}>
                {isChangesRequested ? 'Action Required' : 'Under Review'}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-10 bg-slate-200 mx-6" />

        <div className="text-left w-full sm:w-auto mt-4 sm:mt-0">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Submitted On</span>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700 text-sm">{submitDate}</span>
          </div>
        </div>
      </div>

      {/* Timeline or Actions */}
      <div className="w-full max-w-2xl bg-slate-50/50 border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden">
        {isChangesRequested ? (
          <div className="flex flex-col items-center py-4 space-y-4">
            <p className="text-sm font-medium text-slate-700 max-w-md">
              Please click below to edit your application and address the requested changes.
            </p>
            <button 
              onClick={onEdit}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4f46e5] text-white font-bold hover:bg-indigo-600 transition shadow-md shadow-indigo-500/20"
            >
              <RefreshCw className="w-5 h-5" /> Edit Application
            </button>
          </div>
        ) : (
          <>
            <h4 className="text-xs font-bold text-slate-800 text-left mb-4">What happens next?</h4>
            
            <div className="flex flex-col sm:flex-row items-start justify-between relative gap-6 sm:gap-0">
              <div className="hidden sm:block absolute top-5 left-[12%] right-[12%] h-[2px] bg-slate-200" />
              
              <div className="flex flex-col items-center z-10 relative px-2 sm:px-0 w-full sm:w-1/4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-2 text-[#4f46e5] border border-indigo-200 mx-auto">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 mb-1">Admin Review</span>
                <span className="text-[10px] text-slate-500 text-center max-w-[120px] mx-auto leading-normal">Our admin will review your application.</span>
              </div>

              <div className="flex flex-col items-center z-10 relative px-2 sm:px-0 w-full sm:w-1/4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600 border border-emerald-200 mx-auto">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 mb-1">Approval</span>
                <span className="text-[10px] text-slate-500 text-center max-w-[120px] mx-auto leading-normal">You will be notified if your application is approved.</span>
              </div>

              <div className="flex flex-col items-center z-10 relative px-2 sm:px-0 w-full sm:w-1/4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-2 text-amber-600 border border-amber-200 mx-auto">
                  <Edit className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 mb-1">Changes Requested</span>
                <span className="text-[10px] text-slate-500 text-center max-w-[120px] mx-auto leading-normal">You may be asked to make some changes.</span>
              </div>

              <div className="flex flex-col items-center z-10 relative px-2 sm:px-0 w-full sm:w-1/4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-2 text-blue-500 border border-blue-200 mx-auto">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 mb-1">Get Notified</span>
                <span className="text-[10px] text-slate-500 text-center max-w-[120px] mx-auto leading-normal">We will notify you via email & in-app.</span>
              </div>
            </div>
          </>
        )}

        <div className="mt-5 pt-4 border-t border-slate-200 flex justify-center">
          <Link href="/onboarding/details" className="flex items-center gap-1.5 px-5 py-2 rounded-xl border border-indigo-200 bg-white text-indigo-600 text-xs font-bold shadow-sm hover:bg-indigo-50 transition">
            <FileText className="w-3.5 h-3.5" /> View Application Details
          </Link>
        </div>
      </div>
    </div>
  );
}
