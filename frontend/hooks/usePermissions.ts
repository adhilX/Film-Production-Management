import { useAuthStore } from '@/store/useAuthStore';
import { Permission } from '@/constants/permissions';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const hasPermission = (permission: Permission | string): boolean => {
    if (!user) return false;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissions.some((permission) => user.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: (Permission | string)[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissions.every((permission) => user.permissions.includes(permission));
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

export default usePermissions;
