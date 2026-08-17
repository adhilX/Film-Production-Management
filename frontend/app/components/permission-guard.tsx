"use client";

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Return a pulsing skeleton if the auth state is still loading to prevent content flashing
  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded h-8 w-24 inline-block align-middle" />
    );
  }

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    return user.permissions ? user.permissions.includes(perm) : false;
  };

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
