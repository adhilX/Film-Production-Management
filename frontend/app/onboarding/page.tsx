"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  LogOut,
  HelpCircle,
  ChevronDown,
  Clock,
  Shield,
  Save,
  Bell,
  Headphones,
  Clapperboard,
  Check
} from 'lucide-react';

import Step1Welcome from './components/Step1Welcome';
import Step2Information from './components/Step2Information';
import Step3Financial from './components/Step3Financial';
import Step4Identity from './components/Step4Identity';
import Step5Contracts from './components/Step5Contracts';
import Step6Done from './components/Step6Done';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import TopNavbar from './components/TopNavbar';
import FormHeader from './components/FormHeader';
import { onboardingSchema, validateOnboardingStep } from '@/lib/validation';

export default function OnboardingPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    contractorType: '',
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
          if (me.contractorType) {
            setFormData(prev => ({ ...prev, contractorType: me.contractorType }));
          }
          if (me.name) {
            setFormData(prev => ({ ...prev, name: me.name }));
          }
          if (me.profile) {
            const prof = me.profile;
            setFormData(prev => ({
              ...prev,
              contractorType: me.contractorType || '',
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
      } finally {
        setInitializing(false);
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
          contractorType: formData.contractorType,
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
    const { isValid, errors: fieldErrors } = validateOnboardingStep(step, formData);
    
    if (!isValid && fieldErrors) {
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
      // Validate all steps before submitting using onboardingSchema from validation.ts
      const result = onboardingSchema.safeParse(formData);
      if (!result.success) {
        const allErrors: Record<string, string> = {};
        result.error.issues.forEach((issue: any) => {
          if (issue.path[0]) {
            allErrors[String(issue.path[0])] = issue.message;
          }
        });

        setErrors({ ...allErrors, api: 'Please correct all validation errors across onboarding steps before submitting.' });

        // Focus on the first step that contains an error
        const firstErrorKey = result.error.issues[0]?.path[0] as string;
        if (['contractorType'].includes(firstErrorKey)) {
          setStep(1);
        } else if (['name', 'photoUrl', 'phoneNumber', 'department', 'position', 'experience'].includes(firstErrorKey)) {
          setStep(2);
        } else if (['bankName', 'accountNumber', 'routingNumber', 'taxFormUrl'].includes(firstErrorKey)) {
          setStep(3);
        } else if (['governmentIdType', 'identityDocs'].includes(firstErrorKey)) {
          setStep(4);
        } else if (['agreeNda', 'agreeTerms', 'signatureData'].includes(firstErrorKey)) {
          setStep(5);
        }

        setLoading(false);
        return;
      }

      // Step 6 submit resets onboardingStatus to pending-review and updates progress to 6
      await authService.updateOnboarding({
        currentStep: 6,
        profileData: {
          contractorType: formData.contractorType,
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

      setSuccess('Application submitted successfully!');
      setStep(6);
    } catch (e: any) {
      setErrors({ api: e.response?.data?.message || 'An error occurred during onboarding submission.' });
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { title: 'Welcome', desc: 'Getting started', icon: Sparkles },
    { title: 'Your Information', desc: 'Personal & professional details', icon: User },
    { title: 'Financial', desc: 'Payment & bank details', icon: CreditCard },
    { title: 'Documents', desc: 'Upload required documents', icon: ShieldCheck },
    { title: 'Sign Agreement', desc: 'Review & e-sign agreement', icon: FileSignature },
    { title: 'Done', desc: 'Submitted for review', icon: CheckCircle2 },
  ];

  const progressPercentage = Math.round((step / 6) * 100);

  const getProgressColor = (percent: number) => {
    if (percent <= 20) return '#ef4444'; // red-500
    if (percent <= 40) return '#f97316'; // orange-500
    if (percent <= 60) return '#f59e0b'; // amber-500
    if (percent <= 80) return '#3b82f6'; // blue-500
    return '#10b981'; // emerald-500
  };

  const progressColor = getProgressColor(progressPercentage);

  if (initializing) {
    return (
      <div className="flex min-h-screen bg-[#030712] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4f46e5]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      
      {/* Top Header (Full Width) */}
      <TopNavbar formData={formData} currentUser={currentUser} />

      {/* Main Layout Body Container */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* 1. Left Sidebar Navigation */}
        <LeftSidebar step={step} stepsList={stepsList} />

        {/* 2. Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 lg:pl-[320px] lg:pr-[300px]">

        {/* Scrollable Container */}
        <div className="p-8 space-y-6 max-w-4xl w-full mx-auto">
          
          {/* Changes Requested Banner */}
          {adminFeedback && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex flex-col gap-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="font-bold uppercase tracking-wider">Changes Requested by Administrator</span>
              </div>
              <p className="pl-7 font-medium">{adminFeedback}</p>
            </div>
          )}

          {/* Global Error Banner */}
          {errors.api && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errors.api}</span>
            </div>
          )}

          {/* Global Success Banner */}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* 3. Central Form Container Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Header Banner Section */}
            <FormHeader step={step} />

            {/* Step Body */}
            <div className="p-6 sm:p-8 flex-1">
              {step === 1 && (
                <Step1Welcome 
                  formData={formData} 
                  errors={errors} 
                  onFieldChange={handleFieldChange} 
                />
              )}
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
              {step === 6 && <Step6Done />}
            </div>

            {/* Stepper Footer Controls */}
            {step < 6 && (
              <div className="p-6 bg-slate-50/50 border-t border-slate-200/85 flex items-center justify-between">
                <div>
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={loading}
                      className="flex items-center gap-1.5 py-2 px-4 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 text-xs font-bold transition disabled:opacity-50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}
                </div>

                <div>
                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={loading}
                      className="flex items-center gap-2 py-2.5 px-6 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition duration-300 disabled:opacity-50 cursor-pointer animate-in fade-in"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          {step === 1 ? "Let's Get Started" : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex items-center gap-2 py-2.5 px-6 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer Rights */}
          <footer className="text-center py-4 text-[11px] text-slate-400">
            © 2026 Tendagon. All rights reserved.
          </footer>
        </div>
      </main>

      {/* 3. Right Sidebar Details Panel */}
      <RightSidebar 
        step={step} 
        progressPercentage={progressPercentage} 
        progressColor={progressColor} 
        formData={formData} 
      />

      </div> {/* End of flex-1 container */}
    </div>
  );
}
