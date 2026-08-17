import { ClipboardList, Users, MapPin, DollarSign, Shirt, FileLock2, UserCheck } from 'lucide-react';

export const USER_MENU_ITEMS = [
  { 
    label: 'Project Overview', 
    href: '/', 
    permission: null, 
    icon: ClipboardList 
  },
  { 
    label: 'Costumes & Assets', 
    href: '/costumes', 
    permission: null, 
    contractorType: 'Supplier',
    icon: Shirt 
  },
  { 
    label: 'Cast Assignments', 
    href: '/crew', 
    permission: null, 
    contractorType: 'Cast',
    icon: Users 
  },
  { 
    label: 'Location Bookings', 
    href: '/locations', 
    permission: 'locations.book', 
    icon: MapPin 
  },
  { 
    label: 'Budget & Funds', 
    href: '/funds', 
    permission: 'funds.approve', 
    icon: DollarSign 
  }
];
