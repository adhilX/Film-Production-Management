'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { CheckCircle2, XCircle, ArrowLeft, Building2, UserCircle, Briefcase, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import DocumentPreview from '@/app/components/DocumentPreview';

export default function ApprovalDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Decision State
  const [feedback, setFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [roleOverride, setRoleOverride] = useState('');
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appData, rolesData] = await Promise.all([
          adminService.getApplication(id as string),
          adminService.getRoles()
        ]);
        setUser(appData);
        setRoles(rolesData || []);
      } catch (err) {
        console.error('Failed to load application details', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleDecision = async (status: 'approved' | 'changes-requested') => {
    setSubmitting(true);
    try {
      await adminService.evaluateApplication(id as string, {
        status,
        roleId: roleOverride || undefined,
        adminFeedback: status === 'changes-requested' ? feedback : undefined,
      });
      router.push('/admin/approvals');
    } catch (err) {
      console.error('Failed to submit decision', err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) return <div className="text-red-400">Application not found.</div>;

  const profile = user.profile || {};

  return (
    <div className="animate-in fade-in duration-300 pb-20">
      <div className="mb-6">
        <Link href="/admin/approvals" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-500 transition mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            Application Review
          </h1>
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">
            {user.contractorType}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Personal Info */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-amber-500" />
              Applicant Profile
            </h2>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-xl">{user.name.charAt(0)}</div>
                )}
              </div>
              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</span>
                    <span className="text-sm text-slate-200">{user.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                    <span className="text-sm text-slate-200">{user.email}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</span>
                    <span className="text-sm text-slate-200">{profile.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</span>
                    <span className="text-sm text-slate-200">{profile.department || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Identity Docs */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              Identity Verification ({profile.governmentIdType})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Front Side</span>
                {profile.identityDocs?.[0] ? (
                  <DocumentPreview fileUrl={profile.identityDocs[0]} maxHeight={180} alt="ID Front" className="border-slate-850 bg-slate-900" />
                ) : (
                  <div className="h-48 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-sm">
                    Missing
                  </div>
                )}
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Back Side</span>
                {profile.identityDocs?.[1] ? (
                  <DocumentPreview fileUrl={profile.identityDocs[1]} maxHeight={180} alt="ID Back" className="border-slate-850 bg-slate-900" />
                ) : (
                  <div className="h-48 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-sm">
                    Missing
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Financial & Decision */}
        <div className="space-y-6">
          
          {/* Section 3: Financials */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-500" />
              Financial & Tax
            </h2>
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bank Name</span>
                <span className="text-sm text-slate-200">{profile.bankDetails?.bankName || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Account Number</span>
                <span className="text-sm font-mono text-slate-200">{profile.bankDetails?.accountNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tax Document</span>
                {profile.taxFormUrl ? (
                  <DocumentPreview fileUrl={profile.taxFormUrl} maxHeight={160} alt="Tax Document" className="border-slate-850 bg-slate-900" />
                ) : (
                  <div className="h-40 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-sm">
                    Missing
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decision Panel */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3 mb-4">
              Decision Panel
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Role Override (Optional)</label>
                <select 
                  value={roleOverride}
                  onChange={(e) => setRoleOverride(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                >
                  <option value="">Auto-assign based on Contractor Type</option>
                  {roles.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Leave blank to let the system map automatically.</p>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => handleDecision('approved')}
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve & Activate Account
                </button>
                
                <button 
                  onClick={() => setShowFeedbackModal(true)}
                  disabled={submitting}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-red-400 font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Request Changes...
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-500 w-5 h-5" />
              Request Changes
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Specify what needs to be fixed. The applicant will be notified and sent back to the onboarding form.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. The photo uploaded for the Front ID is blurry. Please re-upload a clear copy."
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowFeedbackModal(false);
                  handleDecision('changes-requested');
                }}
                disabled={!feedback.trim() || submitting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 disabled:bg-red-500/50 disabled:text-red-200/50 text-white font-semibold rounded-lg transition"
              >
                Confirm & Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
