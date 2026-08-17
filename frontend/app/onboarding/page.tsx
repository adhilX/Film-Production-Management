"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Sparkles, 
  User, 
  CreditCard, 
  ShieldCheck, 
  FileSignature, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';

import Stepper from './components/Stepper';
import Step1Welcome from './components/Step1Welcome';
import Step2Information from './components/Step2Information';
import Step3Financial from './components/Step3Financial';
import Step4Identity from './components/Step4Identity';
import Step5Contracts from './components/Step5Contracts';
import Step6Review from './components/Step6Review';
import { step2Schema, step3Schema, step4Schema, step5Schema } from '@/lib/validation';

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    photoUrl: '',
    phoneNumber: '',
    secondaryEmail: '',
    department: '',
    position: '',
    experience: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    taxFormUrl: '',
    governmentIdType: '',
    identityDocs: [] as string[],
    agreeNda: false,
    agreeTerms: false,
    signatureData: '',
  });

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const me = await authService.getMe();
        if (me) {
          setAdminFeedback(me.adminFeedback || null);
          if (me.currentStep && me.currentStep >= 1 && me.currentStep <= 6) {
            setStep(me.currentStep);
          }
          if (me.name) {
            setFormData(prev => ({ ...prev, name: me.name }));
          }
          if (me.profile) {
            const prof = me.profile;
            setFormData(prev => ({
              ...prev,
              name: me.name || prev.name,
              photoUrl: prof.photoUrl || '',
              phoneNumber: prof.phoneNumber || '',
              secondaryEmail: prof.secondaryEmail || '',
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
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load user progress:', err);
      }
    };

    loadProgress();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const saveProgress = async (nextStep: number) => {
    setLoading(true);
    setErrors({});
    try {
      await authService.updateOnboarding({
        currentStep: nextStep,
        profileData: {
          name: formData.name,
          photoUrl: formData.photoUrl,
          phoneNumber: formData.phoneNumber,
          secondaryEmail: formData.secondaryEmail,
          department: formData.department,
          position: formData.position,
          experience: formData.experience,
          bankDetails: {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            routingNumber: formData.routingNumber,
          },
          taxFormUrl: formData.taxFormUrl,
          governmentIdType: formData.governmentIdType,
          identityDocs: formData.identityDocs,
          agreeNda: formData.agreeNda,
          agreeTerms: formData.agreeTerms,
          signatureData: formData.signatureData,
        }
      });
      setStep(nextStep);
    } catch (e: any) {
      setErrors({ api: e.response?.data?.message || 'Failed to save progress step.' });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    let result;
    if (step === 2) {
      result = step2Schema.safeParse({
        name: formData.name,
        photoUrl: formData.photoUrl,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        position: formData.position,
        experience: formData.experience,
      });
    } else if (step === 3) {
      result = step3Schema.safeParse({
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        routingNumber: formData.routingNumber,
        taxFormUrl: formData.taxFormUrl,
      });
    } else if (step === 4) {
      result = step4Schema.safeParse({
        governmentIdType: formData.governmentIdType,
        identityDocs: formData.identityDocs,
      });
    } else if (step === 5) {
      result = step5Schema.safeParse({
        agreeNda: formData.agreeNda,
        agreeTerms: formData.agreeTerms,
        signatureData: formData.signatureData,
      });
    }

    if (result && !result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[String(issue.path[0])] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    await saveProgress(step + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    setSuccess(null);
    try {
      // Step 6 submit resets onboardingStatus to pending-review and updates progress to 6
      await authService.updateOnboarding({
        currentStep: 6,
        profileData: {
          name: formData.name,
          photoUrl: formData.photoUrl,
          phoneNumber: formData.phoneNumber,
          secondaryEmail: formData.secondaryEmail,
          department: formData.department,
          position: formData.position,
          experience: formData.experience,
          bankDetails: {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            routingNumber: formData.routingNumber,
          },
          taxFormUrl: formData.taxFormUrl,
          governmentIdType: formData.governmentIdType,
          identityDocs: formData.identityDocs,
          agreeNda: formData.agreeNda,
          agreeTerms: formData.agreeTerms,
          signatureData: formData.signatureData,
        }
      });

      setSuccess('Application submitted successfully! Redirecting...');
      setTimeout(() => {
        router.push('/onboarding/status');
      }, 1500);
    } catch (e: any) {
      setErrors({ api: e.response?.data?.message || 'An error occurred during onboarding submission.' });
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { title: 'Welcome', icon: Sparkles },
    { title: 'Information', icon: User },
    { title: 'Financial', icon: CreditCard },
    { title: 'Identity', icon: ShieldCheck },
    { title: 'Contracts', icon: FileSignature },
    { title: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Header & Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-slate-200 bg-clip-text text-transparent">
              Contractor Registration & Onboarding
            </h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  useAuthStore.getState().logout();
                  router.push('/login');
                }}
                className="p-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-full text-slate-400 hover:text-red-400 transition"
                title="Log Out"
                type="button"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-3 py-1 bg-amber-950/80 border border-amber-800/80 text-amber-300 rounded-full">
                Step {step} of 6
              </span>
            </div>
          </div>
          <p className="text-slate-400 text-xs mb-6 font-mono">
            CINE-FACTORY LOGISTICS: Complete all six steps to submit your contractor application for approval.
          </p>

          {/* Stepper Navigation Indicator */}
          <Stepper step={step} stepsList={stepsList} />
        </div>

        {/* Changes Requested Banner */}
        {adminFeedback && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl text-xs flex flex-col gap-1.5 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-semibold uppercase tracking-wider">Changes Requested by Administrator</span>
            </div>
            <p className="pl-7 text-slate-300 font-mono">{adminFeedback}</p>
          </div>
        )}

        {/* Global Error Banner */}
        {errors.api && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errors.api}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded-xl text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Step Contents */}
        <div className="min-h-[300px]">
          {step === 1 && <Step1Welcome />}
          {step === 2 && (
            <Step2Information 
              formData={formData} 
              errors={errors} 
              onChange={handleInputChange} 
              onFieldChange={handleFieldChange}
              adminFeedback={adminFeedback}
            />
          )}
          {step === 3 && (
            <Step3Financial 
              formData={formData} 
              errors={errors} 
              onChange={handleInputChange} 
              onFieldChange={handleFieldChange}
              adminFeedback={adminFeedback}
            />
          )}
          {step === 4 && (
            <Step4Identity 
              formData={formData} 
              errors={errors} 
              onChange={handleInputChange} 
              onFieldChange={handleFieldChange}
              adminFeedback={adminFeedback}
            />
          )}
          {step === 5 && (
            <Step5Contracts 
              formData={formData} 
              errors={errors} 
              onChange={handleInputChange} 
              onFieldChange={handleFieldChange}
              adminFeedback={adminFeedback}
            />
          )}
          {step === 6 && <Step6Review formData={formData} />}
        </div>

        {/* Step Navigation Controls */}
        <div className="flex justify-between items-center mt-8 border-t border-slate-800/80 pt-6">
          {step > 1 ? (
            <button 
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-2 py-2 px-4 border border-slate-800 rounded-xl hover:bg-slate-800/50 text-slate-300 text-xs font-semibold transition disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button 
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 py-2.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-semibold shadow-lg shadow-amber-500/20 transition disabled:opacity-50 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Saving...
                </>
              ) : (
                <>
                  Next Step <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Submitting Application...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
