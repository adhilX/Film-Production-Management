'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  Loader2, 
  User, 
  CreditCard, 
  IdCard, 
  Building,
  Mail,
  Phone,
  Download,
  Check,
  ExternalLink,
  Shield,
  Award,
  Building2
} from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import NavBar from '@/app/components/NavBar';

export default function ApplicationDetailsPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
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
            email: me.email || '',
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
            photoUrl: prof.photoUrl || '',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center text-slate-500 font-sans">
        <p className="mb-4 font-semibold">Failed to load onboarding application data.</p>
        <button 
          onClick={() => router.push('/onboarding')}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl transition"
        >
          Go to Onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <NavBar title="Onboarding Process" subtitle="Complete all steps to join Tendagon" />

      {/* Main Layout Body Container (Centered Standalone Page) */}
      <div className="flex-1 flex flex-col">
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
            
            {/* Back Button */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition text-xs font-bold cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>
            </div>

            {/* Four Columns Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Classification */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Contractor Type</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{formData.contractorType || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Department</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{formData.department || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Position / Title</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{formData.position || 'N/A'}</span>
                </div>

                <div className="py-3 flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Professional Experience & Credits</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 pl-11 mt-1 leading-relaxed max-w-[200px] truncate" title={formData.experience}>
                    {formData.experience || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Card 2: Profile & Contact */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-start gap-4 min-h-[360px]">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Full Name</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{formData.name || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Email Address</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 max-w-[130px] truncate" title={formData.email}>
                    {formData.email || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Phone Number</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{formData.phoneNumber || 'N/A'}</span>
                </div>
              </div>

              {/* Card 3: Financial & Tax */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Bank Name</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{formData.bankName || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Account Number</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 font-mono">{formData.accountNumber || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Routing Number</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 font-mono">{formData.routingNumber || 'N/A'}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tax Document</span>
                  {formData.taxFormUrl ? (
                    <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-red-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold text-slate-800 truncate">Tax Form Document</span>
                          <span className="block text-[9px] text-slate-400 mt-0.5">Uploaded & Verified</span>
                        </div>
                      </div>
                      <a 
                        href={formData.taxFormUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 text-red-650 rounded-2xl text-xs text-center border border-red-100 font-bold">Missing</div>
                  )}
                </div>
              </div>

              {/* Card 4: Identification */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Government ID Type</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{formData.governmentIdType || 'N/A'}</span>
                </div>

                <div className="space-y-2 pt-2 flex-1 flex flex-col justify-end">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Uploaded ID Documents</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-col justify-between shadow-xs min-h-[110px]">
                      <span className="text-[9px] font-bold text-slate-405">ID Front View</span>
                      {formData.identityDocs?.[0] ? (
                        <div className="relative group overflow-hidden rounded-lg border border-slate-100 h-14 mt-1.5">
                          <img src={formData.identityDocs[0]} alt="ID Front" className="w-full h-full object-cover" />
                          <a 
                            href={formData.identityDocs[0]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 mt-2 block text-center">Missing</span>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-col justify-between shadow-xs min-h-[110px]">
                      <span className="text-[9px] font-bold text-slate-405">ID Back View</span>
                      {formData.identityDocs?.[1] ? (
                        <div className="relative group overflow-hidden rounded-lg border border-slate-100 h-14 mt-1.5">
                          <img src={formData.identityDocs[1]} alt="ID Back" className="w-full h-full object-cover" />
                          <a 
                            href={formData.identityDocs[1]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 mt-2 block text-center">Missing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Agreements & Signature Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              
              {/* Agreements column */}
              <div className="space-y-3">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Agreements</span>
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="text-xs">
                      <span className="block font-bold text-slate-800">NDA & Secrecy Agreement</span>
                      <span className="block text-[10px] text-slate-405 mt-0.5 font-medium font-sans">Electronically reviewed and signed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="text-xs">
                      <span className="block font-bold text-slate-800">Terms of Engagement</span>
                      <span className="block text-[10px] text-slate-405 mt-0.5 font-medium font-sans">Electronically reviewed and accepted</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Signature column */}
              <div className="space-y-3">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Digital Signature Preview</span>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-center min-h-[110px] shadow-sm relative overflow-hidden">
                  {formData.signatureData ? (
                    <div className="w-full h-16 bg-slate-50/50 rounded-xl p-1 flex items-center justify-center overflow-hidden border border-slate-100">
                      <img src={formData.signatureData} alt="Signature" className="h-full object-contain mix-blend-multiply opacity-90" />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No digital signature recorded.</span>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Rights */}
            <footer className="text-center py-4 text-[11px] text-slate-400">
              © 2026 Tendagon. All rights reserved.
            </footer>

          </div>
        </main>

      </div>
    </div>
  );
}
