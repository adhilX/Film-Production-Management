"use client";

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/constants/permissions';
import { useAuthStore } from '@/store/useAuthStore';

interface PermissionGuardProps {
  permission: Permission | string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const { hasPermission } = usePermissions();
  const isLoading = useAuthStore((state) => state.isLoading);

  // Return a pulsing skeleton if the auth state is still loading to prevent content flashing
  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded h-8 w-24 inline-block align-middle" />
    );
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
