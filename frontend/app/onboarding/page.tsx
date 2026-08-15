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
  Briefcase,
  Lock,
  Mail,
  AlertCircle
} from 'lucide-react';

// Zod Schemas for the 6 Steps
const step2Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  contractorType: z.enum(['Freelancer', 'Cast', 'Supplier', 'Cast-Crew Agent', 'TCS Team']),
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
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-10" />
            <div 
              className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 -z-10"
              style={{ width: `${((step - 1) / 5) * 100}%` }}
            />

            {stepsList.map((s, idx) => {
              const StepIcon = s.icon;
              const isCompleted = idx + 1 < step;
              const isActive = idx + 1 === step;
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div 
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-purple-600 border-purple-500 text-white' 
                        : isActive 
                        ? 'bg-slate-950 border-purple-400 text-purple-400 shadow-lg shadow-purple-500/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium hidden sm:block ${isActive ? 'text-purple-300' : 'text-slate-500'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
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

          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100">Welcome to the Production Platform</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Thank you for applying to join our film production system. This onboarding process registers your identity and establishes your <strong>Contractor Classification</strong> (e.g. Freelancer, Cast, Supplier).
              </p>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-200 uppercase tracking-wider">What to expect:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Specify account credentials and select your contractor identity type</li>
                  <li>Provide financial payout details for production fund distributions</li>
                  <li>Upload national ID / contract document serial for compliance</li>
                  <li>Review & agree to NDA and safety regulations</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: Your Information (Account + Contractor Type) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" /> Step 2: Your Information & Classification
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name}</span>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange}
                    placeholder="john@production.com"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email}</span>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {errors.password && <span className="text-red-400 text-xs mt-1 block">{errors.password}</span>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {errors.confirmPassword && <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword}</span>}
                </div>
              </div>

              {/* Contractor Type Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Contractor Identity Type (Document 3 Specification)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {['Freelancer', 'Cast', 'Supplier', 'Cast-Crew Agent', 'TCS Team'].map((type) => (
                    <label 
                      key={type} 
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.contractorType === type 
                          ? 'bg-purple-950/40 border-purple-500/80 text-purple-300 shadow-md shadow-purple-500/10' 
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="contractorType" 
                        value={type} 
                        checked={formData.contractorType === type}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className="font-semibold text-xs text-slate-200">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bio & Skills */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Skills & Background Bio</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Describe your production skills, equipment, or role expectations..."
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
                {errors.bio && <span className="text-red-400 text-xs mt-1 block">{errors.bio}</span>}
              </div>
            </div>
          )}

          {/* STEP 3: Financial */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" /> Step 3: Financial Details & Payout
              </h2>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Desired Daily Rate ($ USD)</label>
                <input 
                  type="number" 
                  name="dailyRate" 
                  value={formData.dailyRate} 
                  onChange={handleInputChange}
                  min={1}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
                {errors.dailyRate && <span className="text-red-400 text-xs mt-1 block">{errors.dailyRate}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Bank Account / Routing / IBAN</label>
                <input 
                  type="text" 
                  name="bankAccount" 
                  value={formData.bankAccount} 
                  onChange={handleInputChange}
                  placeholder="US12345678909876"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {errors.bankAccount && <span className="text-red-400 text-xs mt-1 block">{errors.bankAccount}</span>}
              </div>
            </div>
          )}

          {/* STEP 4: Identity */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" /> Step 4: Identity Verification & Documents
              </h2>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Verification Document Type</label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver's License</option>
                  <option value="National ID Card">National ID Card</option>
                  <option value="Agency Contract">Agency Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Document ID / Serial Number</label>
                <input 
                  type="text" 
                  name="nationalId" 
                  value={formData.nationalId} 
                  onChange={handleInputChange}
                  placeholder="AB-98765432-X"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {errors.nationalId && <span className="text-red-400 text-xs mt-1 block">{errors.nationalId}</span>}
              </div>
            </div>
          )}

          {/* STEP 5: Contracts */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-purple-400" /> Step 5: Contracts & Agreements
              </h2>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox"
                    name="agreeNda"
                    checked={formData.agreeNda}
                    onChange={handleInputChange}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200">Non-Disclosure Agreement (NDA)</span>
                    <p className="text-slate-400 mt-0.5">I agree to keep all script assets, character details, and production footage strictly confidential.</p>
                  </div>
                </label>
                {errors.agreeNda && <span className="text-red-400 text-xs block">{errors.agreeNda}</span>}

                <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox"
                    name="agreeSafety"
                    checked={formData.agreeSafety}
                    onChange={handleInputChange}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200">Set Safety Regulations</span>
                    <p className="text-slate-400 mt-0.5">I agree to follow all production manager safety guidelines on set locations.</p>
                  </div>
                </label>
                {errors.agreeSafety && <span className="text-red-400 text-xs block">{errors.agreeSafety}</span>}

                <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200">Platform Terms of Service</span>
                    <p className="text-slate-400 mt-0.5">I accept the terms governing contractor applications and onboarding status.</p>
                  </div>
                </label>
                {errors.agreeTerms && <span className="text-red-400 text-xs block">{errors.agreeTerms}</span>}
              </div>
            </div>
          )}

          {/* STEP 6: Review */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Step 6: Application Review & Submission
              </h2>
              <p className="text-xs text-slate-400">
                Please review your information. Submitting will transition your application to the <strong>Pending Review</strong> state for Production Manager evaluation.
              </p>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Applicant Name</span>
                  <span className="font-semibold text-slate-200">{formData.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-200">{formData.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Contractor Type</span>
                  <span className="font-semibold text-purple-400">{formData.contractorType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Daily Payout Target</span>
                  <span className="font-semibold text-emerald-400">${formData.dailyRate} / day</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Verification Document</span>
                  <span className="font-semibold text-slate-200">{formData.documentType} ({formData.nationalId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Application State</span>
                  <span className="font-semibold text-amber-400">Draft ➔ Pending Review</span>
                </div>
              </div>
            </div>
          )}

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
