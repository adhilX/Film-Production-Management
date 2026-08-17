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
      const isOnboardingFormRoute = pathname === '/onboarding';

      if (isPublicRoute) {
        setChecking(false);
        return;
      }

      if (status === 'approved') {
        if (isOnboardingFormRoute) {
          router.replace('/');
        }
      } else {
        // 'in-progress', 'changes-requested', or 'pending-review'
        if (!isOnboardingFormRoute) {
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
        <div className="flex min-h-screen bg-slate-950 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
