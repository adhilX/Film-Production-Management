import { Film, Users, MapPin, DollarSign, Shirt, FileLock2, UserCheck, Activity, LayoutDashboard } from 'lucide-react';

export const USER_MENU_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    permission: 'productions.view',
    icon: LayoutDashboard,
    group: 'project'
  },
  {
    label: 'Projects',
    href: '/projects',
    permission: 'productions.view',
    icon: Film,
    group: 'project'
  },
  {
    label: 'Cast & Crew',
    href: '/cast-crew',
    permission: 'productions.view',
    icon: Users,
    group: 'project'
  },
  {
    label: 'Costumes & Assets',
    href: '/costumes',
    permission: 'costumes.view',
    icon: Shirt,
    group: 'project'
  },
  {
    label: 'Location Bookings',
    href: '/locations',
    permission: 'locations.view',
    icon: MapPin,
    group: 'project'
  },
  {
    label: 'Budget & Funds',
    href: '/funds',
    permission: 'funds.view',
    icon: DollarSign,
    group: 'project'
  },
  {
    label: 'Onboarding Approvals',
    href: '/approvals',
    permission: 'users.approve',
    icon: UserCheck,
    group: 'admin'
  },
  {
    label: 'User Management',
    href: '/users',
    permission: 'users.view',
    icon: Users,
    group: 'admin'
  },
  {
    label: 'Roles & Permissions',
    href: '/roles',
    permission: 'roles.manage',
    icon: FileLock2,
    group: 'admin'
  },
  {
    label: 'System Logs',
    href: '/logs',
    permission: 'audit_logs.view',
    icon: Activity,
    group: 'admin'
  }
];
