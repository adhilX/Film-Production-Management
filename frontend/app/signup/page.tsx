'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clapperboard, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  Users, 
  User, 
  Phone, 
  Briefcase, 
  Info, 
  UserPlus, 
  BarChart3 
} from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

// Zod Validation Schema for Signup
const signupSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  role: z.string().min(1, 'Please select your role'),
  agreeTerms: z.boolean().refine((val) => val === true, { message: 'You must agree to the Terms of Service & Privacy Policy' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Freelancer',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    // Zod Validation
    const validationResult = signupSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorsMap: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (key) {
          errorsMap[key] = issue.message;
        }
      });
      setFieldErrors(errorsMap);
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Call signup service
      await authService.signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        contractorType: formData.role as any,
      });

      // Step 2: Auto-login
      await login({
        email: formData.email,
        password: formData.password,
      });

      setSuccess('Account created successfully! Redirecting to workspace...');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
        setError(axiosErr.response?.data?.error || axiosErr.response?.data?.message || 'Failed to create account.');
      } else {
        setError('An unexpected error occurred during signup.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Main Container - Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-60px)]">
        
        {/* Left Side: Dark Atmospheric Background */}
        <div className="lg:col-span-6 relative flex flex-col justify-between p-8 lg:p-14 overflow-hidden min-h-[450px] lg:min-h-full">
          {/* Background Image with Dark Overlay */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/images/film_set_bg.png" 
              alt="Film Production Set" 
              fill 
              priority 
              className="object-cover object-center transform scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
          </div>

          {/* Left Side Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 space-y-10 max-w-xl"
          >
            {/* Header Branding Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Clapperboard className="w-6 h-6 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-wider text-white leading-none">TENDAGON</h2>
                <p className="text-[10px] font-bold tracking-widest text-amber-400 uppercase mt-0.5">FILM PRODUCTION MANAGEMENT</p>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
                Streamline.
              </h1>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
                Collaborate.
              </h1>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-amber-400">
                Create Magic.
              </h1>
              <p className="text-slate-300 text-sm pt-3 leading-relaxed font-normal max-w-md">
                Tendagon helps you manage productions, people, locations, funds, costumes and more — all in one powerful platform built for the film industry.
              </p>
            </div>

            {/* Feature Container Box */}
            <div className="bg-slate-900/80 border border-slate-800/90 backdrop-blur-md rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-100">Role Based Access</h3>
                  <p className="text-[11px] text-slate-400">Secure dashboards for every team member.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-slate-800/60 pt-3">
                <div className="w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-100">Secure & Reliable</h3>
                  <p className="text-[11px] text-slate-400">Enterprise grade security and data protection.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-slate-800/60 pt-3">
                <div className="w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0">
                  <Clapperboard className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-100">Built for Film Industry</h3>
                  <p className="text-[11px] text-slate-400">Designed specifically for modern production houses.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border-t border-slate-800/60 pt-3">
                <div className="w-9 h-9 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-slate-100">Smart & Organized</h3>
                  <p className="text-[11px] text-slate-400">Track, manage and grow your productions.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="relative z-10 pt-4 hidden lg:block" />
        </div>

        {/* Right Side: Clean White Signup Form (6 cols) */}
        <div className="lg:col-span-6 bg-white text-slate-900 p-8 sm:p-12 flex flex-col justify-center relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg mx-auto space-y-6"
          >
            {/* Form Heading */}
            <div className="text-center space-y-1.5">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Your Account</h2>
              <p className="text-slate-500 text-sm">Join Tendagon and manage your productions with ease.</p>
            </div>

            {/* Error & Success Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-700 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              
              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className={`w-full bg-white border ${fieldErrors.name ? 'border-red-500' : 'border-slate-200 focus:border-purple-600'} rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition duration-200`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <motion.span 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[11px] mt-1 block font-semibold"
                    >
                      {fieldErrors.name}
                    </motion.span>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      className={`w-full bg-white border ${fieldErrors.email ? 'border-red-500' : 'border-slate-200 focus:border-purple-600'} rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition duration-200`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <motion.span 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[11px] mt-1 block font-semibold"
                    >
                      {fieldErrors.email}
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Row 2: Phone Number (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                    <Phone className="w-4 h-4 text-purple-600" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition duration-200"
                  />
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                      <Lock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="relative w-full">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a password"
                        className={`w-full bg-white border ${fieldErrors.password ? 'border-red-500' : 'border-slate-200 focus:border-purple-600'} rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition duration-200`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {fieldErrors.password && (
                    <motion.span 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[11px] mt-1 block font-semibold"
                    >
                      {fieldErrors.password}
                    </motion.span>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                      <Lock className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="relative w-full">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className={`w-full bg-white border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-slate-200 focus:border-purple-600'} rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition duration-200`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <motion.span 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[11px] mt-1 block font-semibold"
                    >
                      {fieldErrors.confirmPassword}
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Row 4: Your Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Role / Contractor Type
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition duration-200"
                  >
                    <option value="Freelancer">Freelancer (Technical Crew, Camera, Sound)</option>
                    <option value="Cast">Cast (Actor, Performer, Extras)</option>
                    <option value="Supplier">Supplier (Equipment, Transport, Costume)</option>
                    <option value="Cast-Crew Agent">Cast-Crew Agent</option>
                    <option value="TCS Team">TCS Team (Production Accountant)</option>
                  </select>
                </div>
              </div>

              {/* Info Banner Callout */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl flex items-start gap-3 text-purple-900 text-xs">
                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>Your account will be reviewed by an administrator before you can access all features.</span>
              </div>

              {/* Terms Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                  />
                  <span>
                    I agree to the <a href="#" className="text-purple-600 hover:underline font-bold">Terms of Service</a> and <a href="#" className="text-purple-600 hover:underline font-bold">Privacy Policy</a>
                  </span>
                </label>
                {fieldErrors.agreeTerms && (
                  <motion.span 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-[11px] mt-1 block font-semibold"
                  >
                    {fieldErrors.agreeTerms}
                  </motion.span>
                )}
              </div>

              {/* Create Account Primary Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider & Sign in Link */}
            <div className="pt-4 border-t border-slate-100 text-center space-y-3 text-xs">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-slate-400 text-[11px] font-semibold absolute">or</span>
              </div>
              <p className="text-slate-600 pt-2">
                Already have an account?{' '}
                <Link href="/login" className="text-purple-600 hover:text-purple-700 font-bold transition hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>

          </motion.div>
        </div>
      </div>

      {/* Dark Footer Bar */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-8 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <span>Secure Production Management Platform</span>
        </div>
        <div>
          <span>© 2024 Tendagon. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
