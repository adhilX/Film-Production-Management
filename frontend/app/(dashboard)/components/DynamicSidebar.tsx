'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, Plus, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useHeaderStore } from '@/store/useHeaderStore';
import { useProductionStore } from '@/store/useProductionStore';
import { USER_MENU_ITEMS } from '@/config/menu-config';
import productionsService from '@/services/productionsService';

interface DynamicSidebarProps {
  isMobile?: boolean;
}

export default function DynamicSidebar({ isMobile }: DynamicSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  const productions = useProductionStore(state => state.productions);
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const setProductions = useProductionStore(state => state.setProductions);
  const setSelectedProduction = useProductionStore(state => state.setSelectedProduction);
  const token = useAuthStore(state => state.accessToken);
  const { setSidebarOpen } = useHeaderStore();

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
    if (user?.status !== 'Approved') return false;
    if (!hasPermission(item.permission)) return false;
    return true;
  });

  if (!user) return null;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 p-4 h-full overflow-y-auto">
      <div>
        {/* Mobile Header with Close Button */}
        {isMobile && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
                <Clapperboard className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-black tracking-wider text-slate-900 uppercase">Tendagon</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Project Selector */}
        <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl mb-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block px-1">Active Project</span>
          {productions.length > 0 ? (
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-slate-400 text-xs">🎬</span>
              <select
                value={selectedProduction?._id || ''}
                onChange={(e) => {
                  const prod = productions.find(p => p._id === e.target.value);
                  if (prod) setSelectedProduction(prod);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-7 pr-3 text-xs focus:outline-none focus:border-purple-500 text-slate-700 font-bold shadow-xs appearance-none cursor-pointer"
              >
                {productions.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
              <span className="absolute right-2.5 pointer-events-none text-[8px] text-slate-400">▼</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-white p-2 rounded-lg border border-slate-100 text-center font-medium">
              No active projects
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="space-y-4">
          {(() => {
            const projectItems = visibleItems.filter(item => item.group === 'project');
            const adminItems = visibleItems.filter(item => item.group === 'admin');

            return (
              <>
                {projectItems.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-2 block px-2">Main Menu</span>
                    <nav className="space-y-1">
                      {projectItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => isMobile && setSidebarOpen(false)}
                            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${isActive
                                ? 'bg-purple-50 border border-purple-100/50 text-purple-700 shadow-xs'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                          >
                            <Icon size={14} className={isActive ? 'text-purple-600' : 'text-slate-400'} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                )}

                {projectItems.length > 0 && adminItems.length > 0 && (
                  <div className="border-t border-slate-100 my-4" />
                )}

                {adminItems.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-2 block px-2">Administration</span>
                    <nav className="space-y-1">
                      {adminItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => isMobile && setSidebarOpen(false)}
                            className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${isActive
                                ? 'bg-purple-50 border border-purple-100/50 text-purple-700 shadow-xs'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                          >
                            <Icon size={14} className={isActive ? 'text-purple-600' : 'text-slate-400'} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Quick Actions (no Logout Button here) */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block px-2">Quick Actions</span>
        <Link
          href="/productions"
          onClick={() => isMobile && setSidebarOpen(false)}
          className="w-full py-2.5 px-3 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-100/60 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          Create Project
        </Link>
      </div>
    </aside>
  );
}
