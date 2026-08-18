'use client';

import React, { useEffect } from 'react';
import DynamicSidebar from './components/DynamicSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useHeaderStore } from '@/store/useHeaderStore';
import { useRouter, usePathname } from 'next/navigation';
import NavBar from '@/app/components/NavBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen, setHeader } = useHeaderStore();

  useEffect(() => {
    // Close mobile sidebar on route change
    setSidebarOpen(false);
    // Reset header store state on route change so path-based auto titles take over
    setHeader('Tendagon', '');
  }, [pathname, setSidebarOpen, setHeader]);

  if (!user) {
    return null; // Let auth guard handle redirect
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Top Header */}
      <NavBar />

      {/* Main split area */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Desktop Sidebar (normal flow) */}
        <div className="hidden md:block h-full shrink-0">
          <DynamicSidebar />
        </div>

        {/* Mobile/Tablet Drawer Sidebar */}
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar Container */}
            <div className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-white shadow-2xl flex flex-col md:hidden animate-in slide-in-from-left duration-250">
              <DynamicSidebar isMobile={true} />
            </div>
          </>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 min-h-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
