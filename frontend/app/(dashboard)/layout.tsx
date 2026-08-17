'use client';

import React from 'react';
import DynamicSidebar from './components/DynamicSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(state => state.user);
  const router = useRouter();

  if (!user) {
    return null; // Let auth guard handle redirect
  }

  // Admin users have their own portal, but maybe they can see dashboard too.
  // The prompt asks to ensure fallback if no permission, but sidebar handles visibility.
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <DynamicSidebar />
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
