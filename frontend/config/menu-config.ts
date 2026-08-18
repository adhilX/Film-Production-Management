import { Film, Users, MapPin, DollarSign, Shirt, FileLock2, UserCheck, Activity, LayoutDashboard } from 'lucide-react';
import { PERMISSIONS } from '@/constants/permissions';

export const USER_MENU_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    permission: PERMISSIONS.PRODUCTIONS_VIEW,
    icon: LayoutDashboard,
    group: 'project'
  },
  {
    label: 'Projects',
    href: '/projects',
    permission: PERMISSIONS.PRODUCTIONS_VIEW,
    icon: Film,
    group: 'project'
  },
  {
    label: 'Cast & Crew',
    href: '/cast-crew',
    permission: PERMISSIONS.PRODUCTIONS_VIEW,
    icon: Users,
    group: 'project'
  },
  {
    label: 'Costumes & Assets',
    href: '/costumes',
    permission: PERMISSIONS.COSTUMES_VIEW,
    icon: Shirt,
    group: 'project'
  },
  {
    label: 'Location Bookings',
    href: '/locations',
    permission: PERMISSIONS.LOCATIONS_VIEW,
    icon: MapPin,
    group: 'project'
  },
  {
    label: 'Budget & Funds',
    href: '/funds',
    permission: PERMISSIONS.FUNDS_VIEW,
    icon: DollarSign,
    group: 'project'
  },
  {
    label: 'Onboarding Approvals',
    href: '/approvals',
    permission: PERMISSIONS.USERS_APPROVE,
    icon: UserCheck,
    group: 'admin'
  },
  {
    label: 'User Management',
    href: '/users',
    permission: PERMISSIONS.USERS_VIEW,
    icon: Users,
    group: 'admin'
  },
  {
    label: 'Roles & Permissions',
    href: '/roles',
    permission: PERMISSIONS.ROLES_MANAGE,
    icon: FileLock2,
    group: 'admin'
  },
  {
    label: 'System Logs',
    href: '/logs',
    permission: PERMISSIONS.AUDIT_LOGS_VIEW,
    icon: Activity,
    group: 'admin'
  }
];
