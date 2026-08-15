'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Clapperboard, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Shield, Users } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

// Zod Validation Schema for Login
const loginSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    // Zod Schema Validation
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const errorsMap: { email?: string; password?: string } = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'email' | 'password';
        if (field) {
          errorsMap[field] = issue.message;
        }
      });
      setFieldErrors(errorsMap);
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({ email, password });
      setSuccess(`Welcome back, ${response.user.name}! Redirecting to workspace...`);

      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Invalid email or password. Please check your credentials.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@production.com');
    setPassword('AdminPassword123!');
    setError(null);
    setFieldErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Main Container - Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-60px)]">
        
        {/* Left Side: Cinematic Atmospheric Background & Value Proposition (7 cols) */}
        <div className="lg:col-span-7 relative flex flex-col justify-between p-8 lg:p-14 overflow-hidden min-h-[450px] lg:min-h-full">
          {/* Background Image with Dark Vignette Overlay */}
          <div className="absolute inset-0 z-0">
            <Image 
              src="/images/film_set_bg.png" 
              alt="Film Production Set" 
              fill 
              priority 
              className="object-cover object-center transform scale-105"
            />
            {/* Gradient Overlays for contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
          </div>

          {/* Left Side Content Container */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 space-y-12 max-w-xl"
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white">
                Streamline.
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white">
                Collaborate.
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-amber-400">
                Create Magic.
              </h1>
              <p className="text-slate-300 text-sm sm:text-base pt-4 leading-relaxed font-normal max-w-lg">
                Manage your productions, people, locations, funds, costumes and more — all in one powerful platform built for the film industry.
              </p>
            </div>

            {/* Feature Highlights Badges */}
            <div className="space-y-5 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-md">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">Role Based Access</h3>
                  <p className="text-xs text-slate-400">Secure dashboards for every team member.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-md">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">Secure & Reliable</h3>
                  <p className="text-xs text-slate-400">Enterprise grade security and data protection.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-md">
                  <Clapperboard className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">Built for Film Industry</h3>
                  <p className="text-xs text-slate-400">Designed specifically for modern production houses.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="relative z-10 pt-8 hidden lg:block" />
        </div>

        {/* Right Side: Clean White Login Card (5 cols) */}
        <div className="lg:col-span-5 bg-white text-slate-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mx-auto space-y-8"
          >
            {/* Form Heading */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 text-sm">Sign in to your Tendagon account</p>
            </div>

            {/* Error / Success Feedback Banners */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-700 text-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter your email"
                    className={`w-full bg-white border ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-purple-600 focus:ring-purple-600/20'} rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition duration-200`}
                  />
                </div>
                {fieldErrors.email && (
                  <motion.span 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-1.5 block font-semibold"
                  >
                    {fieldErrors.email}
                  </motion.span>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full bg-white border ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-purple-600 focus:ring-purple-600/20'} rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition duration-200`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <motion.span 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs mt-1.5 block font-semibold"
                  >
                    {fieldErrors.password}
                  </motion.span>
                )}
              </div>

              {/* Remember Me Row */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  Remember me
                </label>
              </div>

              {/* Sign In Primary Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Bottom Signup Link & Quick Admin Demo Helper */}
            <div className="pt-6 border-t border-slate-100 text-center space-y-4 text-xs">
              <p className="text-slate-600">
                Don’t have an account?{' '}
                <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-bold transition inline-flex items-center gap-1 hover:underline">
                  Create an Account
                </Link>
              </p>

              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleDemoFill}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  Fill Super Admin Credentials
                </motion.button>
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* Dark Footer Bar (Matching Mockup) */}
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
