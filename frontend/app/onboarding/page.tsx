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
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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

  const handleLogoutClick = () => {
    useAuthStore.getState().logout();
    router.push('/login');
  };

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
      <header className="w-full h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur pr-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        {/* Left Side: Logo & Page Title */}
        <div className="flex items-center h-full">
          {/* Logo / Branding (matches sidebar width on desktop) */}
          <div className="h-full flex items-center gap-3 px-6 lg:w-[320px] lg:border-r lg:border-slate-200/80 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              <Clapperboard className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="block text-sm font-black tracking-wider text-slate-900 uppercase font-sans">Tendagon</span>
              <span className="block text-[9px] text-slate-550 font-bold uppercase tracking-wider -mt-0.5 font-mono">Film Production</span>
            </div>
          </div>

          {/* Page Title */}
          <div className="hidden md:block px-6">
            <h1 className="text-sm font-bold text-slate-900">Onboarding Process</h1>
            <p className="text-[10px] text-slate-400 font-medium">Complete all steps to join Tendagon</p>
          </div>
        </div>

        {/* Right Side: Help & Profile Dropdown */}
        <div className="flex items-center gap-6">
          <a
            href="mailto:support@tendagon.com"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-550 hover:text-slate-800 transition font-medium"
          >
            <HelpCircle className="w-4 h-4" /> Need Help?
          </a>

          {/* Profile Dropdown Widget */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-indigo-600/20 rounded-xl p-1"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-xs font-bold text-[#4f46e5] overflow-hidden shrink-0">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  formData.name ? formData.name.charAt(0).toUpperCase() : 'A'
                )}
              </div>
              <div className="hidden sm:block">
                <span className="block text-xs font-bold text-slate-900 leading-none">
                  {formData.name || currentUser?.name || 'Arjun Raj'}
                </span>
                <span className="block text-[10px] text-slate-450 leading-none mt-1 font-medium">Applicant</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50">
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

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
            <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-3 z-10">
                <span className="inline-block text-[9px] font-extrabold tracking-widest text-[#4f46e5] bg-[#e0e7ff] px-2.5 py-1 rounded-md uppercase font-mono">
                  Step {step} of 6
                </span>
                
                {step === 1 && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Welcome to Tendagon! 👋</h2>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      We're excited to have you on board. This onboarding process will help us know you better.
                    </p>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Your Information 👤</h2>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Please enter your contact details, professional position, and experience details.
                    </p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight font-sans">Financial Information</h2>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Please provide your payment and bank details.
                    </p>
                  </>
                )}
                {step === 4 && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Identity Verification 🛡️</h2>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Upload your national identification papers to clear legal compliance gates.
                    </p>
                  </>
                )}
                {step === 5 && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">NDA & Signature ✍️</h2>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Acknowledge NDA agreements, and draw your legal digital signature.
                    </p>
                  </>
                )}
                {step === 6 && (
                  <>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Review Submission 🎉</h2>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Double-check all entered records before sending the profile to administrators.
                    </p>
                  </>
                )}
              </div>

              {/* Decorative Studio Illustration / Financial Illustration */}
              <div className="shrink-0 select-none hidden sm:block">
                {step === 3 ? (
                  <svg className="w-40 h-24 text-indigo-600" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Bank Building */}
                    <rect x="110" y="48" width="36" height="3" fill="#3b82f6" rx="1.5" />
                    <rect x="114" y="32" width="28" height="3" fill="#3b82f6" rx="1" />
                    {/* Roof Triangle */}
                    <path d="M110 32 L128 18 L146 32 Z" fill="#2563eb" />
                    {/* Columns */}
                    <rect x="116" y="35" width="3" height="13" fill="#60a5fa" />
                    <rect x="122" y="35" width="3" height="13" fill="#60a5fa" />
                    <rect x="128" y="35" width="3" height="13" fill="#60a5fa" />
                    <rect x="134" y="35" width="3" height="13" fill="#60a5fa" />
                    <rect x="140" y="35" width="3" height="13" fill="#60a5fa" />
                    
                    {/* Wallet */}
                    <rect x="25" y="38" width="66" height="44" rx="12" fill="#6366f1" />
                    <path d="M25 49 L91 49 L91 70 C91 76.6 85.6 82 79 82 L37 82 C30.4 82 25 76.6 25 70 Z" fill="#4f46e5" />
                    {/* Wallet strap */}
                    <rect x="70" y="49" width="22" height="14" rx="4" fill="#818cf8" />
                    <circle cx="77" cy="56" r="3" fill="#ffffff" />
                    
                    {/* Credit Card sticking out */}
                    <rect x="35" y="24" width="42" height="26" rx="6" fill="#a5b4fc" transform="rotate(-12 35 24)" />
                    <rect x="39" y="28" width="9" height="5" fill="#4f46e5" transform="rotate(-12 39 28)" />
                    
                    {/* Gold Coins */}
                    <circle cx="18" cy="80" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="18" cy="80" r="6" fill="#f59e0b" />
                    <circle cx="32" cy="82" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="32" cy="82" r="6" fill="#f59e0b" />
                    
                    {/* Sparks */}
                    <path d="M135 12 L137 16 L141 17 L137 18 L135 22 L133 18 L129 17 L133 16 Z" fill="#a5b4fc" opacity="0.7" />
                    <path d="M12 30 L14 33 L17 34 L14 35 L12 38 L10 35 L7 34 L10 33 Z" fill="#a5b4fc" opacity="0.7" />
                  </svg>
                ) : (
                  <svg className="w-48 h-32 text-indigo-600" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Spotlight Stand */}
                    <path d="M190 120 L175 150 M190 120 L205 150 M190 50 L190 125" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
                    {/* Spotlight Lamp */}
                    <path d="M180 40 L200 45 L195 65 L175 60 Z" fill="#1e293b" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="187.5" cy="52.5" r="8" fill="#f59e0b"/>
                    {/* Light Ray */}
                    <polygon points="187.5,52.5 130,120 70,80" fill="url(#yellow-glow)" opacity="0.15"/>
                    
                    {/* Megaphone */}
                    <path d="M140 100 L115 110 L105 95 L125 90 Z" fill="#6366f1"/>
                    <path d="M125 90 C125 90 135 70 145 75 C155 80 140 100 140 100 Z" fill="#818cf8"/>
                    <path d="M105 95 L95 102 L98 108 L108 101 Z" fill="#334155"/>
                    <circle cx="142.5" cy="87.5" r="4" fill="#a5b4fc"/>

                    {/* Director Chair */}
                    <path d="M130 90 L160 145 M160 90 L130 145" stroke="#b45309" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M125 90 L165 90" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M132 90 L132 60 M158 90 L158 60" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round"/>
                    <rect x="128" y="65" width="34" height="15" rx="2" fill="#1e293b"/>
                    <text x="145" y="74" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">DIRECTOR</text>

                    {/* Gradient Glow */}
                    <defs>
                      <radialGradient id="yellow-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
                      </radialGradient>
                    </defs>
                  </svg>
                )}
              </div>
            </div>

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
