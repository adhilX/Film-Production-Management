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

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.systemRole === 'Admin') return true;
    return user.permissions ? user.permissions.includes(perm) : false;
  };

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
