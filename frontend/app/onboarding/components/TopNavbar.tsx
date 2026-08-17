import React, { useState } from 'react';
import { Clapperboard, HelpCircle, ChevronDown } from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import LogoutButton from '@/app/components/LogoutButton';

interface TopNavbarProps {
  formData: any;
  currentUser: any;
}

export default function TopNavbar({ formData, currentUser }: TopNavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
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
              <LogoutButton className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-slate-50 flex items-center gap-2 font-medium" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
