'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { useHeaderStore } from '@/store/useHeaderStore';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Building2, 
  UserCircle, 
  Briefcase, 
  FileText, 
  AlertTriangle, 
  Download, 
  ExternalLink,
  User,
  Mail,
  Phone,
  Building,
  CreditCard,
  IdCard,
  Video,
  Award,
  Shield,
  Check,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { PermissionGuard } from '@/app/components/permission-guard';
import { UnauthorizedFallback } from '@/components/common/UnauthorizedFallback';


export default function ApprovalDetails() {
  return (
    <PermissionGuard permission="users.approve" fallback={<UnauthorizedFallback />}>
      <ApprovalDetailsContent />
    </PermissionGuard>
  );
}

function ApprovalDetailsContent() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setHeader = useHeaderStore(state => state.setHeader);

  const formatError = (err: any, defaultMsg: string): string => {
    if (err.response?.status === 403) {
      return "You don't have permission to perform this action.";
    }
    const message = err.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message || err.message || defaultMsg;
  };

  useEffect(() => {
    if (user?.name) {
      setHeader('Approval Review', `Evaluating onboarding submission for ${user.name}`);
    } else {
      setHeader('Approval Review', 'Evaluating onboarding submission');
    }
  }, [user, setHeader]);
  
  // Decision State
  const [feedback, setFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [roleOverride, setRoleOverride] = useState('');
  const [roles, setRoles] = useState<any[]>([]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [appData, rolesData] = await Promise.all([
        adminService.getApplication(id as string),
        adminService.getRoles()
      ]);
      setUser(appData);
      setRoles(rolesData || []);
    } catch (err: any) {
      console.error('Failed to load application details', err);
      setErrorMsg(formatError(err, 'Failed to load application details. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDecision = async (status: 'approved' | 'changes-requested') => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminService.evaluateApplication(id as string, {
        status,
        systemRoleId: roleOverride || undefined,
        adminFeedback: status === 'changes-requested' ? feedback : undefined,
      });
      router.push('/approvals');
    } catch (err: any) {
      console.error('Failed to submit decision', err);
      setSubmitError(formatError(err, 'Failed to submit decision. Please check validation rules.'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[400px] gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        <span className="text-xs text-slate-400 font-semibold">Loading submission details...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Error Loading Details</h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          {errorMsg}
        </p>
        <button
          onClick={fetchData}
          className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-lg transition cursor-pointer"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 shrink-0">
          <UserCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Application Not Found</h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          The requested onboarding application does not exist or has been deleted.
        </p>
        <Link
          href="/approvals"
          className="mt-2 inline-flex items-center px-4 py-2 bg-slate-650 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition"
        >
          Back to Queue
        </Link>
      </div>
    );
  }

  const profile = user.profile || {};

  return (
    <div className="animate-in fade-in duration-300 w-full px-6 md:px-8 lg:px-10 py-8 flex flex-col gap-8 font-sans text-slate-800">
      {/* Top Header Navigation */}
      <div className="flex items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-705 hover:text-indigo-650 transition text-xs font-bold cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </button>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <div className="text-red-750 text-xs font-bold w-full flex items-center justify-between">
            <span>{submitError}</span>
            <button 
              onClick={() => setSubmitError(null)} 
              className="text-[10px] text-red-500 hover:text-red-700 underline font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container Card (Submission summary box) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-block text-[9px] font-extrabold tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md uppercase font-mono">
              Completed & Submitted
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Onboarding Submission Details</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Review the verification information and compliance assets currently active for this profile.
            </p>
          </div>
        </div>

        <div className="shrink-0 select-none hidden sm:block z-10">
          <svg className="w-36 h-24 text-indigo-600" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="20" width="60" height="80" rx="8" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2" />
            <rect x="56" y="28" width="48" height="66" rx="4" fill="#ffffff" />
            <rect x="70" y="14" width="20" height="8" rx="2" fill="#4f46e5" />
            <path d="M62 40 L65 43 L72 36" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="78" y1="39" x2="98" y2="39" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <path d="M62 54 L65 57 L72 50" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="78" y1="53" x2="98" y2="53" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <path d="M62 68 L65 71 L72 64" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="78" y1="67" x2="98" y2="67" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <circle cx="108" cy="88" r="12" fill="#10b981" />
            <path d="M103 88 L106 91 L113 84" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Column 1: Classification (Personal / Safe) */}
        <div className="space-y-3">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">1. Classification</span>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Contractor Type</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">{user.contractorType || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-655 rounded-xl">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Department</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">{profile.department || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-655 rounded-xl">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Position / Title</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">{profile.position || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-655 rounded-xl">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Experience & Credits</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800 max-w-[140px] truncate" title={profile.experience?.join('\n')}>
                {profile.experience?.join(', ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Profile / Contact (Personal / Safe) */}
        <div className="space-y-3">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">2. Profile & Contact</span>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-650 rounded-xl">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Full Name</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">{user.name || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-655 rounded-xl">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Email Address</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800 max-w-[130px] truncate" title={user.email}>{user.email || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-655 rounded-xl">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Phone Number</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">{profile.phoneNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Financial & Tax (Financial) */}
        <div className="space-y-3">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">3. Financial & Tax</span>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Building className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Bank Name</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">{profile.bankDetails?.bankName || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-650 rounded-xl">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Account Number</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800 font-mono">{profile.bankDetails?.accountNumber || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-650 rounded-xl">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Routing Number</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800 font-mono">{profile.bankDetails?.routingNumber || 'N/A'}</span>
            </div>

            {/* Tax Document Section */}
            <div className="space-y-2 pt-1.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Tax Document</span>
              {profile.taxFormUrl ? (
                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold text-slate-800 truncate">Tax Form Document</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">Uploaded & Verified</span>
                    </div>
                  </div>
                  <a 
                    href={profile.taxFormUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-650" />
                  </a>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl text-xs text-center border border-rose-100 font-bold">Missing</div>
              )}
            </div>
          </div>
        </div>

        {/* Column 4: Identification (Compliance) */}
        <div className="space-y-3">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">4. Identification</span>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <IdCard className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500">Government ID Type</span>
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">{profile.governmentIdType || 'N/A'}</span>
            </div>

            {/* ID Document Previews */}
            <div className="space-y-2 pt-1.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Uploaded ID Documents</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-2 flex flex-col justify-between shadow-sm min-h-[110px]">
                  <span className="text-[9px] font-bold text-slate-400">ID Front View</span>
                  {profile.identityDocs?.[0] ? (
                    <div className="relative group overflow-hidden rounded-lg border border-slate-100 h-14 mt-1.5">
                      <img src={profile.identityDocs[0]} alt="ID Front" className="w-full h-full object-cover" />
                      <a 
                        href={profile.identityDocs[0]} 
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

                <div className="bg-white border border-slate-200/80 rounded-2xl p-2 flex flex-col justify-between shadow-sm min-h-[110px]">
                  <span className="text-[9px] font-bold text-slate-400">ID Back View</span>
                  {profile.identityDocs?.[1] ? (
                    <div className="relative group overflow-hidden rounded-lg border border-slate-100 h-14 mt-1.5">
                      <img src={profile.identityDocs[1]} alt="ID Back" className="w-full h-full object-cover" />
                      <a 
                        href={profile.identityDocs[1]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-slate-955/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
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

      </div>

      {/* Agreements & Signature Grid (Compliance) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
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
                <span className="block text-[10px] text-slate-450 mt-0.5 font-medium">Electronically reviewed and signed</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="text-xs">
                <span className="block font-bold text-slate-800">Terms of Engagement</span>
                <span className="block text-[10px] text-slate-450 mt-0.5 font-medium">Electronically reviewed and accepted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature column */}
        <div className="space-y-3">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Digital Signature Preview</span>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-center min-h-[110px] shadow-sm relative overflow-hidden">
            {profile.signatureData ? (
              <div className="w-full h-16 bg-slate-50/50 rounded-xl p-1 flex items-center justify-center overflow-hidden border border-slate-100">
                <img src={profile.signatureData} alt="Signature" className="h-full object-contain mix-blend-multiply opacity-90" />
              </div>
            ) : (
              <span className="text-xs text-slate-400">No digital signature recorded.</span>
            )}
          </div>
        </div>

      </div>

      {/* Decision Controls Action Panel */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">Assign System Role:</label>
          <select 
            value={roleOverride}
            onChange={(e) => setRoleOverride(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
            required
          >
            <option value="">Select a Role...</option>
            {roles.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={() => setShowFeedbackModal(true)}
            disabled={submitting}
            className="flex items-center gap-1.5 py-3 px-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-650 text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-rose-600" /> Request Changes
          </button>
          
          <button 
            onClick={() => setShowApproveModal(true)}
            disabled={submitting || !roleOverride}
            className="flex items-center gap-1.5 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve & Activate Profile
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2 mb-2">
              <AlertTriangle className="text-rose-500 w-5 h-5" />
              Request Changes
            </h3>
            <p className="text-xs text-slate-550 mb-4 leading-relaxed">
              Specify what needs to be fixed. The applicant will be notified and sent back to the onboarding form.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. The photo uploaded for the Front ID is blurry. Please re-upload a clear copy."
              className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-650 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowFeedbackModal(false);
                  handleDecision('changes-requested');
                }}
                disabled={!feedback.trim() || submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Confirm & Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-955 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Approval
            </h3>
            <p className="text-xs text-slate-555 mb-5 leading-relaxed">
              Are you sure you want to approve this applicant? They will be granted system access with the role of:{' '}
              <span className="font-extrabold text-emerald-700 border border-emerald-500/25 bg-emerald-50 px-2 py-1 rounded-md">
                {roles.find(r => r._id === roleOverride)?.name || 'Unknown Role'}
              </span>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowApproveModal(false);
                  handleDecision('approved');
                }}
                disabled={submitting || !roleOverride}
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-lg transition cursor-pointer"
              >
                Confirm & Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
