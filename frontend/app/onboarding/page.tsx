"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
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
  AlertCircle
} from 'lucide-react';

import Stepper from './components/Stepper';
import Step1Welcome from './components/Step1Welcome';
import Step2Information from './components/Step2Information';
import Step3Financial from './components/Step3Financial';
import Step4Identity from './components/Step4Identity';
import Step5Contracts from './components/Step5Contracts';
import Step6Review from './components/Step6Review';

// Zod Schemas for the 6 Steps
const step2Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  contractorType: z.enum(['Freelancer', 'Cast', 'Crew', 'Supplier', 'Agent', 'Production Company']),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const step3Schema = z.object({
  dailyRate: z.number().min(1, 'Daily rate must be greater than 0'),
  bankAccount: z.string().min(6, 'Bank account / IBAN must be at least 6 characters'),
});

const step4Schema = z.object({
  documentType: z.string().min(2, 'Document type is required'),
  nationalId: z.string().min(5, 'National ID / Serial number must be at least 5 characters'),
});

const step5Schema = z.object({
  agreeNda: z.boolean().refine((val) => val === true, { message: 'You must agree to the NDA' }),
  agreeSafety: z.boolean().refine((val) => val === true, { message: 'You must agree to the Safety Policy' }),
  agreeTerms: z.boolean().refine((val) => val === true, { message: 'You must agree to the Terms of Service' }),
});

export default function OnboardingPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    contractorType: 'Freelancer' as const,
    bio: '',
    dailyRate: 450,
    bankAccount: '',
    documentType: 'Passport',
    nationalId: '',
    agreeNda: false,
    agreeSafety: false,
    agreeTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (name === 'dailyRate' ? Number(value) : value);
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

  const handleNext = () => {
    let result;
    if (step === 2) {
      result = step2Schema.safeParse({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        contractorType: formData.contractorType,
        bio: formData.bio,
      });
    } else if (step === 3) {
      result = step3Schema.safeParse({
        dailyRate: formData.dailyRate,
        bankAccount: formData.bankAccount,
      });
    } else if (step === 4) {
      result = step4Schema.safeParse({
        documentType: formData.documentType,
        nationalId: formData.nationalId,
      });
    } else if (step === 5) {
      result = step5Schema.safeParse({
        agreeNda: formData.agreeNda,
        agreeSafety: formData.agreeSafety,
        agreeTerms: formData.agreeTerms,
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

    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      // Identity Creation (Signup)
      await authService.signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        contractorType: formData.contractorType,
      });

      // Login to capture token & transition to Pending Review state
      await login({
        email: formData.email,
        password: formData.password,
      });

      router.push('/');
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e) {
        const axiosErr = e as { response?: { data?: { error?: string; message?: string } } };
        setErrors({ api: axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Failed to submit contractor application.' });
      } else {
        setErrors({ api: (e as Error).message || 'An error occurred during onboarding.' });
      }
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
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Header & Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-indigo-200 to-slate-200 bg-clip-text text-transparent">
              Contractor Registration & Onboarding
            </h1>
            <span className="text-xs font-semibold px-3 py-1 bg-purple-950/80 border border-purple-800/80 text-purple-300 rounded-full">
              Step {step} of 6
            </span>
          </div>
          <p className="text-slate-400 text-xs mb-6">
            Document 1 & 3 Specification: Complete all six steps to submit your contractor application for manager approval.
          </p>

          {/* Stepper Navigation Indicator */}
          <Stepper step={step} stepsList={stepsList} />
        </div>

        {/* Global Error Banner */}
        {errors.api && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errors.api}</span>
          </div>
        )}

        {/* Step Contents */}
        <div className="min-h-[300px]">
          {step === 1 && <Step1Welcome />}
          {step === 2 && <Step2Information formData={formData} errors={errors} onChange={handleInputChange} />}
          {step === 3 && <Step3Financial formData={formData} errors={errors} onChange={handleInputChange} />}
          {step === 4 && <Step4Identity formData={formData} errors={errors} onChange={handleInputChange} />}
          {step === 5 && <Step5Contracts formData={formData} errors={errors} onChange={handleInputChange} />}
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
              className="flex items-center gap-2 py-2.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition"
            >
              Next Step <ArrowRight className="w-4 h-4" />
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
