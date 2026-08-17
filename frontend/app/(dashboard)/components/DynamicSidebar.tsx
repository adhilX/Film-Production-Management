'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import LogoutButton from '@/app/components/LogoutButton';
import { USER_MENU_ITEMS } from '@/config/menu-config';
import productionsService from '@/services/productionsService';

export default function DynamicSidebar() {
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  const productions = useProductionStore(state => state.productions);
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const setProductions = useProductionStore(state => state.setProductions);
  const setSelectedProduction = useProductionStore(state => state.setSelectedProduction);
  const token = useAuthStore(state => state.accessToken);

  useEffect(() => {
    if (user && token && user.status === 'Approved') {
      fetchProductions();
    }
  }, [user, token]);

  const fetchProductions = async () => {
    try {
      const data = await productionsService.getProductions();
      setProductions(data);
      if (data.length > 0 && !selectedProduction) {
        setSelectedProduction(data[0]);
      }
    } catch (e) {
      console.error('Error fetching productions:', e);
    }
  };

  const hasPermission = (permission: string | null): boolean => {
    if (permission === null) return true;
    if (!user) return false;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  // Filter based on permissions
  const visibleItems = USER_MENU_ITEMS.filter(item => {
    // Wait, requirement: if user?.onboardingStatus !== 'approved' return false
    if (user?.status !== 'Approved') return false; 
    
    // Check permission string
    if (!hasPermission(item.permission)) return false;

    return true;
  });

  if (!user) return null;

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between shrink-0 p-4">
      <div>
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
            <Clapperboard size={20} />
          </div>
          <div>
            <span className="block text-sm font-bold text-slate-100 uppercase tracking-wider">Tendagon</span>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Production Manager</span>
          </div>
        </div>

        {/* Active Production Selector */}
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 mb-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block px-1">Active Production</span>
          {productions.length > 0 ? (
            <select
              value={selectedProduction?._id || ''}
              onChange={(e) => {
                const prod = productions.find(p => p._id === e.target.value);
                if (prod) setSelectedProduction(prod);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
            >
              {productions.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-800">
              No active productions
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 mt-4">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  isActive ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon size={14} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Card & Logout */}
      <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
        <div className="flex flex-col bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <span className="font-semibold text-xs text-slate-100">{user.name}</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
            {user.contractorType} • {user.systemRoleId?.name || 'User'}
          </span>
        </div>
        <LogoutButton 
          className="w-full py-2 px-3 bg-red-950/10 border border-red-900/20 hover:bg-red-950/20 rounded-lg text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          iconClassName="w-3 h-3"
        >
          Sign Out
        </LogoutButton>
      </div>
    </aside>
  );
}
