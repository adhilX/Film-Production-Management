'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Users, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Onboarding Approvals', href: '/admin/approvals', icon: CheckSquare },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Roles & Permissions', href: '/admin/roles', icon: Shield },
  ];

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-900 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-900">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="text-amber-500 w-6 h-6" />
          Admin Portal
        </h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-900">
        <LogoutButton className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition" />
      </div>
    </div>
  );
}
