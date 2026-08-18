import React, { useState } from 'react';
import { Clapperboard, HelpCircle, ChevronDown, Menu, User, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useHeaderStore } from '@/store/useHeaderStore';
import LogoutButton from '@/app/components/LogoutButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavBarProps {
  title?: string;
  subtitle?: string;
}

export default function NavBar({ title: propTitle, subtitle: propSubtitle }: NavBarProps) {
  const user = useAuthStore((state) => state.user);
  const { title: storeTitle, subtitle: storeSubtitle, toggleSidebar } = useHeaderStore();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const pathname = usePathname() || '';

  // Route map for automatic titles and subtitles when store is clean/default
  const getHeaderDetails = () => {
    // 1. Explicit prop overrides first
    if (propTitle !== undefined) {
      return { title: propTitle, subtitle: propSubtitle || '' };
    }
    // 2. Explicit store updates second
    if (storeTitle && storeTitle !== 'Tendagon') {
      return { title: storeTitle, subtitle: storeSubtitle || '' };
    }

    // 3. Fallback based on route pathnames
    if (pathname === '/') {
      return { title: 'Admin Dashboard', subtitle: 'System overview and high-level metrics.' };
    }
    if (pathname.startsWith('/approvals')) {
      if (pathname.includes('/[id]') || pathname !== '/approvals') {
        return { title: 'Approval Review', subtitle: 'Evaluating onboarding submission' };
      }
      return { title: 'Onboarding Approvals', subtitle: 'Review and verify contractor applications.' };
    }
    if (pathname.startsWith('/users')) {
      return { title: 'User Directory', subtitle: 'Manage system access, roles, and profiles for all personnel.' };
    }
    if (pathname.startsWith('/roles')) {
      return { title: 'Roles & Permissions', subtitle: 'Configure system access levels and granular permission policies.' };
    }
    if (pathname.startsWith('/audit-logs') || pathname.startsWith('/logs')) {
      return { title: 'System Logs', subtitle: 'Track admin actions, modifications, and system events.' };
    }
    if (pathname.startsWith('/costumes')) {
      return { title: 'Costumes & Wardrobe', subtitle: 'Manage costume inventories and wardrobe assignments.' };
    }
    if (pathname.startsWith('/crew')) {
      return { title: 'Cast & Crew Assignments', subtitle: 'Manage personnel schedules and assignments.' };
    }
    if (pathname.startsWith('/locations')) {
      return { title: 'Location Bookings', subtitle: 'Track set locations, permits, and shoots.' };
    }
    if (pathname.startsWith('/funds')) {
      return { title: 'Budget & Funds', subtitle: 'Monitor transaction histories and fund requests.' };
    }
    if (pathname.startsWith('/productions')) {
      return { title: 'Project Overview', subtitle: 'Manage and overview film projects.' };
    }
    if (pathname.startsWith('/onboarding')) {
      return { title: 'Onboarding Process', subtitle: 'Complete all steps to join Tendagon' };
    }
    
    return { title: 'Tendagon', subtitle: 'Film Project Management' };
  };

  const { title, subtitle } = getHeaderDetails();

  const photoUrl = (user as any)?.profile?.photoUrl || (user as any)?.photoUrl;
  const name = user?.name || 'Administrator';
  const roleName = user?.systemRoleId?.name || '';

  const isOnboarding = pathname.startsWith('/onboarding');

  return (
    <header className={`w-full h-20 border-b border-slate-200/80 bg-white/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shrink-0 ${isOnboarding ? 'lg:pl-0' : 'md:pl-0'}`}>
      {/* Left Side: Hamburger (mobile), Logo & Page Title */}
      <div className="flex items-center h-full">
        {/* Mobile Hamburger Toggle (only show in dashboard/sidebar view) */}
        {!isOnboarding && (
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 mr-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Logo / Branding */}
        <div className={`h-full flex items-center gap-3 shrink-0 ${
          isOnboarding 
            ? 'pl-0 lg:pl-6 pr-4 sm:pr-6 border-r border-slate-200/80 w-auto lg:w-[320px]' 
            : 'pl-0 md:pl-6 pr-4 sm:pr-6 w-auto md:w-64'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Clapperboard className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="hidden sm:block">
            <span className="block text-base font-black tracking-wider text-slate-900 uppercase font-sans leading-none">Tendagon</span>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 font-mono">Film Production</span>
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="px-4 sm:px-6">
          <h1 className="text-sm font-bold text-slate-900 leading-snug">{title}</h1>
          <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Right Side: Help & Profile Dropdown */}
      <div className="flex items-center gap-4 sm:gap-6">
        <a
          href="mailto:support@tendagon.com"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <HelpCircle className="w-4 h-4" /> Need Help?
        </a>

        {/* Profile Dropdown Widget */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-indigo-650/20 rounded-xl p-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-650/20 flex items-center justify-center text-xs font-bold text-[#4f46e5] overflow-hidden shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0).toUpperCase() : 'A'
              )}
            </div>
            <div className="hidden sm:block leading-none">
              <span className="block text-xs font-bold text-slate-900 leading-none">
                {name}
              </span>
              <span className="block text-[9px] text-slate-450 leading-none mt-1 font-semibold">{roleName}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Profile Link */}
              <Link 
                href="/onboarding/details" 
                onClick={() => setShowUserDropdown(false)}
                className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold transition"
              >
                <User className="w-3.5 h-3.5 text-slate-400" /> Profile
              </Link>
              
              {/* Account Settings Link */}
              <Link 
                href="/onboarding/details" 
                onClick={() => setShowUserDropdown(false)}
                className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold transition border-b border-slate-100 pb-2 mb-1"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" /> Account Settings
              </Link>

              {/* Sign Out Button */}
              <div className="px-1.5 pt-0.5">
                <LogoutButton 
                  className="w-full text-left px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 flex items-center gap-2 font-bold rounded-xl transition"
                  showIcon={true}
                  iconClassName="w-3.5 h-3.5"
                >
                  Sign Out
                </LogoutButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
