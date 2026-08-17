'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import ApplicationDetails from '../components/ApplicationDetails';

export default function ApplicationDetailsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const me = await authService.getMe();
        if (me?.profile) {
          const prof = me.profile;
          setFormData({
            contractorType: me.contractorType || '',
            name: me.name || '',
            phoneNumber: prof.phoneNumber || '',
            department: prof.department || '',
            position: prof.position || '',
            experience: prof.experience?.join('\n') || '',
            bankName: prof.bankDetails?.bankName || '',
            accountNumber: prof.bankDetails?.accountNumber || '',
            routingNumber: prof.bankDetails?.routingNumber || '',
            taxFormUrl: prof.taxFormUrl || '',
            governmentIdType: prof.governmentIdType || '',
            identityDocs: prof.identityDocs || [],
            agreeNda: prof.signedNda || false,
            agreeTerms: prof.signedTerms || false,
            signatureData: prof.signatureData || '',
          });
        }
      } catch (e) {
        console.error('Failed to load details', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="w-full h-16 border-b border-slate-200/80 bg-white flex items-center px-6 sticky top-0 z-30">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10">
        <div className="mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Application Details</h1>
          <p className="text-sm text-slate-500 mt-1">Review the details you submitted during onboarding.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : formData ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <ApplicationDetails formData={formData} />
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
            Failed to load application data.
          </div>
        )}
      </main>
    </div>
  );
}
