'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clapperboard, AlertCircle, CheckCircle2, Shield, Users } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '../components/auth-context';
import AuthSidebar from '../components/AuthSidebar';
import LoginForm from './components/LoginForm';
import { loginSchema } from '@/lib/validation';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { login: contextLogin } = useAuth();

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
      const res = await login({ email, password });
      
      // Sync the token with the AuthProvider context
      contextLogin(res.access_token);

      const loggedInUser = useAuthStore.getState().user;
      setSuccess(`Welcome back, ${loggedInUser?.name || 'User'}! Redirecting to workspace...`);

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

  const features = [
    { title: 'Role Based Access', description: 'Secure dashboards for every team member.', icon: Users },
    { title: 'Secure & Reliable', description: 'Enterprise grade security and data protection.', icon: Shield },
    { title: 'Built for Film Industry', description: 'Designed specifically for modern production houses.', icon: Clapperboard }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Main Container - Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-60px)]">
        
        {/* Left Side: Cinematic Atmospheric Background & Value Proposition */}
        <AuthSidebar features={features} className="lg:col-span-7" />

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
            <LoginForm
              email={email}
              password={password}
              rememberMe={rememberMe}
              showPassword={showPassword}
              isLoading={isLoading}
              errors={fieldErrors}
              onEmailChange={handleEmailChange}
              onPasswordChange={handlePasswordChange}
              onRememberMeChange={setRememberMe}
              onShowPasswordChange={setShowPassword}
              onSubmit={handleSubmit}
            />

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
          <span>© 2026 Tendagon. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
