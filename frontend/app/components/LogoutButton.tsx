'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  iconClassName?: string;
  showIcon?: boolean;
}

export default function LogoutButton({ 
  className = "w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium rounded-xl transition-colors",
  children = "Log Out",
  iconClassName = "w-4 h-4",
  showIcon = true
}: LogoutButtonProps) {
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <button onClick={handleLogout} className={className}>
      {showIcon && <LogOut className={iconClassName} />}
      {children}
    </button>
  );
}
