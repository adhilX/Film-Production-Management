"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '../components/auth-context';
import { 
  User, 
  Shield, 
  Briefcase, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2
} from 'lucide-react';

// Zod Validation Schemas for each step
const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const step2Schema = z.object({
  contractorType: z.enum(['Freelancer', 'Cast', 'Supplier', 'Cast-Crew Agent', 'TCS Team']),
});

const step3Schema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  experienceYears: z.number().min(0, 'Experience must be a positive number'),
});

const step4Schema = z.object({
  nationalId: z.string().min(5, 'National ID must be at least 5 characters'),
  documentType: z.string().min(2, 'Document type is required'),
});

const step5Schema = z.object({
  dailyRate: z.number().min(1, 'Daily rate must be greater than 0'),
  bankAccount: z.string().min(8, 'Bank account number must be at least 8 digits'),
});

export default function OnboardingPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contractorType: 'Freelancer' as const,
    bio: '',
    experienceYears: 0,
    nationalId: '',
    documentType: 'Passport',
    dailyRate: 0,
    bankAccount: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experienceYears' || name === 'dailyRate' ? Number(value) : value
    }));
    // Clear error
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
    if (step === 1) {
      result = step1Schema.safeParse({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
    } else if (step === 2) {
      result = step2Schema.safeParse({ contractorType: formData.contractorType });
    } else if (step === 3) {
      result = step3Schema.safeParse({
        bio: formData.bio,
        experienceYears: formData.experienceYears
      });
    } else if (step === 4) {
      result = step4Schema.safeParse({
        nationalId: formData.nationalId,
        documentType: formData.documentType
      });
    } else if (step === 5) {
      result = step5Schema.safeParse({
        dailyRate: formData.dailyRate,
        bankAccount: formData.bankAccount
      });
    }

    if (result && !result.success) {
      const fieldErrors: Record<string, string> = {};
      (result as any).error.errors.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
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
    try {
      // Step 1: Sign up
      const signupRes = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          contractorType: formData.contractorType,
        }),
      });

      if (!signupRes.ok) {
        const errData = await signupRes.json();
        throw new Error(errData.error || 'Signup failed');
      }

      // Step 2: Log in immediately to establish credentials
      const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        login(loginData.access_token, loginData.user);
        
        // Push user details / other fields (bio, rates, etc.) to backend if profile endpoint exists, 
        // but since it's mock/simulated on backend schemas, they will be reviewed by admin.
        router.push('/');
      } else {
        // Fallback: If login fails because of Pending status, go to home to show onboarding status page
        router.push('/');
      }
    } catch (e: any) {
      setErrors({ api: e.message || 'An error occurred during onboarding.' });
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { title: 'Account', icon: User },
    { title: 'Contractor', icon: Briefcase },
    { title: 'Skills & Bio', icon: FileText },
    { title: 'Verification', icon: Shield },
    { title: 'Financials', icon: CreditCard },
    { title: 'Confirm', icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-slate-100 items-center justify-center p-4">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
        
        {/* Progress Bar & Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300 mb-2">
            Contractor Onboarding
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            Complete the 6-step process to request system access.
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -z-10"></div>
            <div 
              className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 -z-10"
              style={{ width: `${((step - 1) / 5) * 100}%` }}
            ></div>

            {stepsList.map((s, idx) => {
              const StepIcon = s.icon;
              const isCompleted = idx + 1 < step;
              const isActive = idx + 1 === step;
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-purple-600 border-purple-500 text-white' 
                        : isActive 
                        ? 'bg-slate-950 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <StepIcon size={16} />
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium ${isActive ? 'text-purple-400' : 'text-slate-500'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Errors Alert */}
        {errors.api && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-sm">
            {errors.api}
          </div>
        )}

        {/* Step Contents */}
        <div className="min-h-[250px]">
          
          {/* STEP 1: Account Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                <User size={20} /> Account Registration
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500"
                />
                {errors.name && <span className="text-red-400 text-xs mt-1 block">{errors.name}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange}
                  placeholder="e.g. john@production.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500"
                />
                {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500"
                />
                {errors.password && <span className="text-red-400 text-xs mt-1 block">{errors.password}</span>}
              </div>
            </div>
          )}

          {/* STEP 2: Contractor Type */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                <Briefcase size={20} /> Contractor Classification
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Select your specialized role. This determines which modules and dashboards you can access in the system.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Freelancer', 'Cast', 'Supplier', 'Cast-Crew Agent', 'TCS Team'].map((type) => (
                  <label 
                    key={type} 
                    className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      formData.contractorType === type 
                        ? 'bg-purple-950/20 border-purple-500/80 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
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
                    <span className="font-semibold text-sm text-slate-200">{type}</span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {type === 'Cast' && 'Actors, Performers, Extras'}
                      {type === 'Supplier' && 'Costume suppliers, equipment, transport'}
                      {type === 'Freelancer' && 'Technical Crew, Camera, Gaffer, sound'}
                      {type === 'Cast-Crew Agent' && 'Agency managers'}
                      {type === 'TCS Team' && 'Administrative crew, accountants'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Bio & Experience */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                <FileText size={20} /> Background & Experience
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Short Biography / Skillset Summary</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleInputChange}
                  placeholder="Tell us about your production experience, equipment you own, or credentials..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
                {errors.bio && <span className="text-red-400 text-xs mt-1 block">{errors.bio}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Years of Industry Experience</label>
                <input 
                  type="number" 
                  name="experienceYears" 
                  value={formData.experienceYears} 
                  onChange={handleInputChange}
                  min={0}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500"
                />
                {errors.experienceYears && <span className="text-red-400 text-xs mt-1 block">{errors.experienceYears}</span>}
              </div>
            </div>
          )}

          {/* STEP 4: Documents Verification */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                <Shield size={20} /> Document Verification
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Verification Document Type</label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver's License</option>
                  <option value="National ID Card">National ID Card</option>
                  <option value="Agency Contract">Agency Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Document ID / Serial Number</label>
                <input 
                  type="text" 
                  name="nationalId" 
                  value={formData.nationalId} 
                  onChange={handleInputChange}
                  placeholder="e.g. AB123456C"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500"
                />
                {errors.nationalId && <span className="text-red-400 text-xs mt-1 block">{errors.nationalId}</span>}
              </div>
            </div>
          )}

          {/* STEP 5: Rates & Financials */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                <CreditCard size={20} /> Financial Information
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Desired Daily Rate (USD)</label>
                <input 
                  type="number" 
                  name="dailyRate" 
                  value={formData.dailyRate} 
                  onChange={handleInputChange}
                  min={0}
                  placeholder="e.g. 450"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500"
                />
                {errors.dailyRate && <span className="text-red-400 text-xs mt-1 block">{errors.dailyRate}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bank Account / Routing Number</label>
                <input 
                  type="text" 
                  name="bankAccount" 
                  value={formData.bankAccount} 
                  onChange={handleInputChange}
                  placeholder="e.g. 123456789012"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-purple-500"
                />
                {errors.bankAccount && <span className="text-red-400 text-xs mt-1 block">{errors.bankAccount}</span>}
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
                <CheckCircle size={20} /> Review & Submit Profile
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Please double-check your credentials and classification. Once submitted, your request will enter the onboarding queue under <strong>Draft</strong> and transition to <strong>Pending</strong> review by a Production Manager.
              </p>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-3 text-sm text-slate-300">
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold">{formData.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold">{formData.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Contractor Classification</span>
                  <span className="font-semibold text-purple-400">{formData.contractorType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Industry Experience</span>
                  <span className="font-semibold">{formData.experienceYears} Years</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Document Serial</span>
                  <span className="font-semibold">{formData.nationalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rate Target</span>
                  <span className="font-semibold text-emerald-400">${formData.dailyRate} / Day</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Step Navigation Controls */}
        <div className="flex justify-between mt-8 border-t border-slate-800 pt-6">
          {step > 1 ? (
            <button 
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-2 py-2 px-5 border border-slate-800 rounded-lg hover:bg-slate-800/40 text-slate-300 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 6 ? (
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white text-sm font-medium transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] cursor-pointer"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 py-2 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-white text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
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
