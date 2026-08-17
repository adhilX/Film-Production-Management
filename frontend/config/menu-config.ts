import { ClipboardList, Film, Users, MapPin, DollarSign, Shirt, FileLock2, UserCheck, Activity } from 'lucide-react';

export const USER_MENU_ITEMS = [
  { 
    label: 'Project Overview', 
    href: '/', 
    permission: 'productions.view', 
    icon: ClipboardList 
  },
  { 
    label: 'Productions', 
    href: '/productions', 
    permission: 'productions.view', 
    icon: Film 
  },

  { 
    label: 'Costumes & Assets', 
    href: '/costumes', 
    permission: 'costumes.view', 
    icon: Shirt 
  },
  { 
    label: 'Cast Assignments', 
    href: '/crew', 
    permission: 'productions.view', 
    icon: Users 
  },
  { 
    label: 'Location Bookings', 
    href: '/locations', 
    permission: 'locations.view', 
    icon: MapPin 
  },
  { 
    label: 'Budget & Funds', 
    href: '/funds', 
    permission: 'funds.view', 
    icon: DollarSign 
  },
  { 
    label: 'Onboarding Approvals', 
    href: '/approvals', 
    permission: 'users.approve', 
    icon: UserCheck 
  },
  { 
    label: 'User Management', 
    href: '/users', 
    permission: 'users.view', 
    icon: Users 
  },
  { 
    label: 'Roles & Permissions', 
    href: '/roles', 
    permission: 'roles.manage', 
    icon: FileLock2 
  },
  { 
    label: 'System Logs', 
    href: '/logs', 
    permission: 'audit_logs.view', 
    icon: Activity 
  }
];
