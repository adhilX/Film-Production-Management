'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '../components/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    // Wait briefly to allow Zustand to hydrate if necessary
    const timer = setTimeout(() => {
      if (!token) {
        router.replace('/login');
      } else if (user?.systemRole !== 'Admin') {
        router.replace('/');
      } else {
        setChecking(false);
      }
    }, 300); // 300ms delay to prevent immediate redirect on refresh

    return () => clearTimeout(timer);
  }, [user, token, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
