"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const runGuard = async () => {
      const { accessToken: token, user, checkStatus } = useAuthStore.getState();

      if (!token || !user) {
        setChecking(false);
        return;
      }

      // Check remote status to ensure real-time admin actions are respected
      const statusData = await checkStatus();
      const status = statusData?.onboardingStatus || user.onboardingStatus || 'in-progress';

      const isPublicRoute = pathname === '/login' || pathname === '/signup';
      const isOnboardingRoute = pathname.startsWith('/onboarding');

      if (isPublicRoute) {
        setChecking(false);
        return;
      }

      if (status === 'approved') {
        if (isOnboardingRoute) {
          router.replace('/');
        }
      } else {
        // 'in-progress', 'changes-requested', or 'pending-review'
        if (!isOnboardingRoute) {
          router.replace('/onboarding');
        }
      }
      setChecking(false);
    };

    runGuard();
  }, [pathname, router]);

  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (checking && token && user) {
    const isPublicRoute = pathname === '/login' || pathname === '/signup';
    if (!isPublicRoute) {
      return (
        <div className="flex min-h-screen bg-[#f8fafc] items-center justify-center font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
            <span className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">Verifying Session...</span>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
