'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useHeaderStore } from '@/store/useHeaderStore';
import { useProductionStore } from '@/store/useProductionStore';
import { USER_MENU_ITEMS } from '@/config/menu-config';
import productionsService from '@/services/productionsService';
import { usePermissions } from '@/hooks/usePermissions';

interface DynamicSidebarProps {
  isMobile?: boolean;
}

export default function DynamicSidebar({ isMobile }: DynamicSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  const { hasPermission: checkPerm } = usePermissions();
  const productions = useProductionStore(state => state.productions);
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const setProductions = useProductionStore(state => state.setProductions);
  const setSelectedProduction = useProductionStore(state => state.setSelectedProduction);
  const token = useAuthStore(state => state.accessToken);
  const { setSidebarOpen } = useHeaderStore();

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user && token && user.status === 'Approved') {
      fetchProductions();
    }
  }, [user, token]);

  const fetchProductions = async () => {
    try {
      const data = await productionsService.getProductions();
      setProductions(data);
      if (data.length > 0) {
        let restoredProd = null;
        if (typeof window !== 'undefined') {
          const storedId = localStorage.getItem('selectedProductionId');
          if (storedId) {
            restoredProd = data.find((p: any) => p._id === storedId);
          }
        }
        if (restoredProd) {
          setSelectedProduction(restoredProd);
        } else {
          setSelectedProduction(data[0]);
        }
      } else {
        setSelectedProduction(null);
      }
    } catch (e) {
      console.error('Error fetching productions:', e);
    }
  };

  const hasPermission = (permission: string | null): boolean => {
    if (permission === null) return true;
    return checkPerm(permission);
  };

  // Filter based on permissions
  const visibleItems = USER_MENU_ITEMS.filter(item => {
    if (user?.status !== 'Approved') return false;
    if (!hasPermission(item.permission)) return false;
    return true;
  });

  if (!user) return null;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 p-2 h-full overflow-y-auto">
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
        <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl mb-4 relative" ref={dropdownRef}>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block px-1">Active Project</span>
          {productions.length > 0 ? (
            <div className="relative">
              {/* Dropdown Trigger */}
              <button
                onClick={() => {
                  setIsOpen(!isOpen);
                  setSearchQuery('');
                }}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-2.5 pr-8 text-left focus:outline-none focus:border-purple-500 shadow-xs flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Thumbnail Poster */}
                  {selectedProduction?.imageUrl ? (
                    <img
                      src={selectedProduction.imageUrl}
                      alt={selectedProduction.title}
                      className="w-8 h-10 object-cover rounded-md shrink-0 border border-slate-200/60"
                    />
                  ) : (
                    <div className="w-8 h-10 bg-slate-100 border border-slate-200 rounded-md flex flex-col items-center justify-center shrink-0 text-slate-400 text-xs">
                      <span>🎬</span>
                      <span className="text-[6px] text-slate-350 tracking-tighter mt-0.5">—</span>
                    </div>
                  )}
                  <div className="leading-tight truncate">
                    <span className="block text-xs font-bold text-slate-700 truncate">{selectedProduction?.title}</span>
                    <span className="flex items-center gap-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedProduction?.status === 'Active' ? 'bg-emerald-500' :
                        selectedProduction?.status === 'On Hold' ? 'bg-amber-500' :
                        selectedProduction?.status === 'Draft' ? 'bg-blue-500' :
                        selectedProduction?.status === 'Completed' ? 'bg-emerald-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-[9px] font-bold text-slate-450 uppercase">{selectedProduction?.status}</span>
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </button>

              {/* Dropdown Menu Card */}
              {isOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-2 max-h-72 flex flex-col">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-7 pr-3 text-xs focus:outline-none focus:border-purple-500 text-slate-700"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs select-none">🔍</span>
                  </div>

                  {/* List of projects */}
                  <div className="overflow-y-auto flex-1 space-y-1 pr-1">
                    {productions
                      .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((p) => {
                        const isSelected = selectedProduction?._id === p._id;
                        return (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => {
                              setSelectedProduction(p);
                              setIsOpen(false);
                            }}
                            className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              isSelected ? 'bg-purple-50/50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Thumbnail */}
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.title}
                                  className="w-7 h-9 object-cover rounded-md shrink-0 border border-slate-200/50"
                                />
                              ) : (
                                <div className="w-7 h-9 bg-slate-100 border border-slate-200 rounded-md flex flex-col items-center justify-center shrink-0 text-slate-400 text-[10px]">
                                  <span>🎬</span>
                                </div>
                              )}
                              <div className="leading-tight truncate">
                                <span className="block text-xs font-bold text-slate-750 truncate">{p.title}</span>
                                <span className="flex items-center gap-1 mt-0.5">
                                  <span className={`w-1 h-1 rounded-full ${
                                    p.status === 'Active' ? 'bg-emerald-500' :
                                    p.status === 'On Hold' ? 'bg-amber-500' :
                                    p.status === 'Draft' ? 'bg-blue-500' :
                                    p.status === 'Completed' ? 'bg-emerald-500' :
                                    'bg-red-500'
                                  }`} />
                                  <span className="text-[8px] font-bold text-slate-400 uppercase">{p.status}</span>
                                </span>
                              </div>
                            </div>
                            {isSelected && <span className="text-purple-650 font-bold text-xs pr-1">✓</span>}
                          </button>
                        );
                      })}
                    {productions.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div className="text-[10px] text-slate-400 text-center py-2">No projects found</div>
                    )}
                  </div>

                  {/* View All Projects link */}
                  <div className="border-t border-slate-100 pt-2 flex justify-center">
                    <Link
                      href="/projects"
                      onClick={() => isMobile && setSidebarOpen(false)}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900 transition flex items-center gap-0.5"
                    >
                      View all projects <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
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
          href="/projects"
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
