'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Film,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  Clapperboard,
  MapPin,
  Bell,
  Mail,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/components/auth-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import productionsService from '@/services/productionsService';
import adminService from '@/services/adminService';

export default function OverviewModule() {
  const { token } = useAuth();
  const user = useAuthStore(state => state.user);
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const setProductions = useProductionStore(state => state.setProductions);
  const setSelectedProduction = useProductionStore(state => state.setSelectedProduction);
  const productions = useProductionStore(state => state.productions);

  const [castCrewList, setCastCrewList] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  // Dynamic backend stats
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  
  const [assignUser, setAssignUser] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [assignChar, setAssignChar] = useState('');

  const { hasPermission: checkPerm } = usePermissions();
  const hasPermission = (permission: string): boolean => {
    return checkPerm(permission);
  };

  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await productionsService.getCrewDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch crew dashboard stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    const loadProductions = async () => {
      try {
        const data = await productionsService.getProductions();
        setProductions(data);
        if (data.length > 0 && !selectedProduction) {
          setSelectedProduction(data[0]);
        }
      } catch (err) {
        console.error('Failed to load productions:', err);
      }
    };
    if (token) {
      loadProductions();
    }
  }, [token]);

  useEffect(() => {
    if (selectedProduction && token) {
      fetchCharacters();
      fetchCastCrew();
      fetchDashboardStats();
      if (hasPermission(PERMISSIONS.USERS_APPROVE)) {
        fetchSystemUsers();
      }
    }
  }, [selectedProduction, token]);

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productionsService.createProduction({ title: newProdTitle, description: newProdDesc });
      setNewProdTitle('');
      setNewProdDesc('');
      const data = await productionsService.getProductions();
      setProductions(data);
      fetchDashboardStats();
    } catch (e) {
      console.error('Error creating production:', e);
    }
  };

  const fetchCharacters = async () => {
    if (!selectedProduction) return;
    try {
      const data = await productionsService.getCharacters(selectedProduction._id);
      setCharacters(data);
    } catch (e) {
      console.error('Error fetching characters:', e);
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    try {
      await productionsService.createCharacter(selectedProduction._id, { name: newCharName, description: newCharDesc });
      setNewCharName('');
      setNewCharDesc('');
      fetchCharacters();
    } catch (e) {
      console.error('Error creating character:', e);
    }
  };

  const fetchCastCrew = async () => {
    if (!selectedProduction) return;
    try {
      const data = await productionsService.getCastCrew(selectedProduction._id);
      setCastCrewList(data);
    } catch (e) {
      console.error('Error fetching cast/crew:', e);
    }
  };

  const handleAssignCastCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    try {
      await productionsService.assignCastCrew(selectedProduction._id, {
        userId: assignUser,
        roleInProduction: assignRole,
        characterId: assignChar || undefined,
      });
      setAssignUser('');
      setAssignRole('');
      setAssignChar('');
      fetchCastCrew();
      fetchCharacters();
      fetchDashboardStats();
    } catch (e) {
      console.error('Error mapping cast/crew:', e);
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const data = await adminService.getUsers(1, 100);
      setSystemUsers(data.users || data);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const getManagerName = (proj: any) => {
    if (proj?.productionManager && typeof proj.productionManager === 'object') {
      return proj.productionManager.name;
    }
    return 'Adhi P';
  };

  if (!user) return null;

  const u = user as any;
  const prod = selectedProduction as any;

  // Use dynamic backend metrics
  const myProjectsCount = stats?.myProjectsCount ?? productions.length ?? 0;
  const myRolesCount = stats?.myRolesCount ?? 0;
  const upcomingCallsCount = stats?.upcomingCallsCount ?? 0;
  const totalWorkDays = stats?.totalWorkDays ?? 0;
  const completedTasks = stats?.completedTasks ?? 0;
  const myRoleAssignments = stats?.myRoleAssignments ?? [];
  const upcomingCallSheet = stats?.upcomingCallSheet;
  const recentActivities = stats?.recentActivities ?? [];

  return (
    <div className="w-full px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">    

      {selectedProduction ? (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Card 1: My Projects */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200 relative overflow-hidden h-32">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">My Projects</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{myProjectsCount}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Film className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-slate-450 font-bold mt-4 text-left">Active Engagements</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
            </div>

            {/* Card 2: My Roles */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200 relative overflow-hidden h-32">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">My Roles</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{myRolesCount}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-slate-450 font-bold mt-4 text-left">Total Roles Assigned</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500" />
            </div>

            {/* Card 3: Upcoming Calls */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200 relative overflow-hidden h-32">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Upcoming Calls</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{upcomingCallsCount}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-slate-450 font-bold mt-4 text-left">Next 7 Days</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
            </div>

            {/* Card 4: Total Work Days */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200 relative overflow-hidden h-32">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Work Days</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{totalWorkDays}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-slate-450 font-bold mt-4 text-left">Across All Projects</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            </div>

            {/* Card 5: Completed Tasks */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200 relative overflow-hidden h-32">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Completed Tasks</span>
                  <span className="text-3xl font-black text-slate-900 leading-none">{completedTasks}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-slate-450 font-bold mt-4 text-left">This Month</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </div>
          </div>

          {/* Middle Row (Project Overview + Role Assignments) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Project Overview */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div className="text-left pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider leading-none">Project Overview</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4">
                <div className="relative rounded-xl overflow-hidden aspect-video sm:aspect-auto sm:h-40 border border-slate-200/60 bg-slate-950 flex flex-col items-center justify-center">
                  {prod.imageUrl ? (
                    <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-450 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent z-10" />
                      <Film className="w-10 h-10 text-slate-500 mb-2 relative z-20" />
                      <span className="text-xs font-black text-white relative z-20 uppercase tracking-wider">{prod.title}</span>
                      <span className="text-[8px] text-slate-300 font-extrabold relative z-20 uppercase mt-1.5 px-2 py-0.5 bg-purple-950/70 border border-purple-800/40 rounded">
                        {prod.status}
                      </span>
                    </div>
                  )}
                  {/* Embedded title and status overlay */}
                  <div className="absolute bottom-3 left-3 z-20 text-left">
                    <span className="block text-xs font-extrabold text-white uppercase tracking-wider">{prod.title}</span>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 mr-1" />
                    <span className="text-[9px] font-extrabold text-slate-200 uppercase tracking-wider">{prod.status}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between text-xs py-1 space-y-3.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Project Status</span>
                    <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 rounded text-[9px] font-extrabold uppercase tracking-wider">
                      {prod.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Production Manager</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      {getManagerName(prod)}
                      <a href={`mailto:${prod.productionManager?.email || 'manager@tendagon.com'}`}>
                        <Mail className="w-3.5 h-3.5 text-slate-400 hover:text-slate-655 transition cursor-pointer" />
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Shoot Start Date</span>
                    <span className="font-bold text-slate-500">Not scheduled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Estimated Wrap</span>
                    <span className="font-bold text-slate-500">Not scheduled</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-2 text-left">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-800">Overall Progress</span>
                  <span className="text-slate-900">12%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: '12%' }} />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">Based on available project data</span>
              </div>
            </div>

            {/* My Role Assignments */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider leading-none">My Role Assignments</h3>
                <Link href="/projects" className="text-[10px] font-bold text-purple-750 hover:underline">View All</Link>
              </div>
              <div className="my-4 space-y-3.5 flex-1">
                {myRoleAssignments.length > 0 ? (
                  myRoleAssignments.map((role: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-2xl transition duration-150">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                          <Clapperboard className="w-4.5 h-4.5" />
                        </div>
                        <div className="leading-none text-left">
                          <span className="block text-xs font-bold text-slate-900 leading-none">{role.roleName}</span>
                          <span className="block text-[10px] text-slate-400 font-semibold mt-1.5">
                            Department: {role.department}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                          role.type === 'Primary' ? 'bg-purple-55 text-purple-700 border border-purple-100' : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {role.type}
                        </span>
                        <span className="text-[10px] text-slate-450 font-bold whitespace-nowrap">
                          {role.daysAssigned} Days Assigned
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-10 font-semibold">No assigned roles found.</div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row (Upcoming Call Sheet + Recent Activity) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Call Sheet */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider leading-none">Upcoming Call Sheet</h3>
                <Link href="/projects" className="text-[10px] font-bold text-purple-750 hover:underline">View All</Link>
              </div>
              <div className="my-4">
                {upcomingCallSheet ? (
                  <>
                    <div className="flex gap-4">
                      <div className="w-16 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-2 shrink-0">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">{upcomingCallSheet.date.month}</span>
                        <span className="text-2xl font-black text-slate-800 leading-none my-1.5">{upcomingCallSheet.date.day}</span>
                        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider leading-none">{upcomingCallSheet.date.weekday}</span>
                      </div>
                      <div className="space-y-3 text-left">
                        <h4 className="text-xs font-bold text-slate-900">{upcomingCallSheet.title}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-550 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{upcomingCallSheet.location}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-[10px] pt-1">
                          <div>
                            <span className="text-slate-455 block font-semibold text-[8px] uppercase tracking-wider">Call Time</span>
                            <span className="font-bold text-slate-800 mt-1 block">{upcomingCallSheet.callTime}</span>
                          </div>
                          <div>
                            <span className="text-slate-455 block font-semibold text-[8px] uppercase tracking-wider">Est. Duration</span>
                            <span className="font-bold text-slate-800 mt-1 block">{upcomingCallSheet.estDuration}</span>
                          </div>
                          <div>
                            <span className="text-slate-455 block font-semibold text-[8px] uppercase tracking-wider">My Department</span>
                            <span className="font-bold text-slate-800 mt-1 block">{upcomingCallSheet.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center gap-2 text-[10px] text-purple-750 font-extrabold">
                      <Bell className="w-4 h-4 text-purple-550 shrink-0" />
                      <span>Be on set at least 30 minutes before call time.</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-10 font-semibold">No upcoming call sheets scheduled.</div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
              <div className="flex justify-between items-center pb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider leading-none">Recent Activity</h3>
                <Link href="/logs" className="text-[10px] font-bold text-purple-750 hover:underline">View All</Link>
              </div>
              <div className="my-4 space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act: any) => (
                    <div key={act.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          act.type === 'task' ? 'bg-green-50 text-green-600' :
                          act.type === 'calendar' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {act.type === 'task' && <CheckCircle2 className="w-4.5 h-4.5" />}
                          {act.type === 'calendar' && <Calendar className="w-4.5 h-4.5" />}
                          {act.type === 'role' && <Users className="w-4.5 h-4.5" />}
                        </div>
                        <div className="leading-none text-left">
                          <p className="font-bold text-slate-800 leading-normal">{act.title}</p>
                          <p className="text-[10px] text-slate-450 font-semibold mt-1">{act.detail}</p>
                        </div>
                      </div>
                      <span className="text-slate-400 font-semibold text-[10px] shrink-0">{act.timeAgo}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-8 font-semibold">No recent activity.</div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Banner */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-3xs">
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                💡
              </div>
              <div className="leading-normal">
                <span className="block text-xs font-bold text-amber-900">Stay Updated</span>
                <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">Check your call sheets regularly and ensure you're prepared for your next shoot.</span>
              </div>
            </div>
            <Link href="/projects" className="py-2.5 px-4 bg-white border border-amber-250 hover:bg-amber-50/20 text-amber-900 rounded-xl text-xs font-bold shadow-3xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap">
              View All Call Sheets <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Management Section (Only visible to managers/admins with permissions) */}
          {(hasPermission(PERMISSIONS.PRODUCTIONS_CREATE)) && (
            <div className="border-t border-slate-200 pt-8 space-y-6">
              <h2 className="text-sm font-black text-slate-850 uppercase tracking-wider text-left">Management Tools</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Cast Crew Members Assignment */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider">Assign Cast & Crew</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">{castCrewList.length} total mapped</span>
                  </div>
                  
                  {/* Form */}
                  <form onSubmit={handleAssignCastCrew} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Select User</label>
                        <select
                          value={assignUser}
                          onChange={(e) => setAssignUser(e.target.value)}
                          required
                          className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 appearance-none cursor-pointer"
                        >
                          <option value="">Select User...</option>
                          {systemUsers.filter(u => u.isActive && !castCrewList.some(cc => cc.userId?._id === u._id)).map((u: any) => (
                            <option key={u._id} value={u._id}>{u.name} ({u.contractorType})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Role in Project</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Cameraman, Actor"
                          value={assignRole}
                          onChange={(e) => setAssignRole(e.target.value)}
                          required
                          className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Character (Optional)</label>
                        <select
                          value={assignChar}
                          onChange={(e) => setAssignChar(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 appearance-none cursor-pointer"
                        >
                          <option value="">No character role...</option>
                          {characters.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="submit"
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-bold cursor-pointer text-center transition shadow-xs"
                        >
                          Assign User
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Script Characters Creation */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider">Add Script Character</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">{characters.length} characters</span>
                  </div>

                  <form onSubmit={handleCreateCharacter} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Character Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Lead protagonist"
                          value={newCharName}
                          onChange={(e) => setNewCharName(e.target.value)}
                          required
                          className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Description</label>
                        <input 
                          type="text" 
                          placeholder="e.g. male, age 30s"
                          value={newCharDesc}
                          onChange={(e) => setNewCharDesc(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button 
                        type="submit"
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-bold cursor-pointer transition shadow-xs"
                      >
                        Create Character
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Assigned Cast & Crew List Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider text-left">All Mapped Cast & Crew</h3>
                {castCrewList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {castCrewList.map((cc) => (
                      <div key={cc._id} className="flex justify-between items-center p-3.5 bg-slate-50/50 border border-slate-150 rounded-xl text-xs">
                        <div className="text-left">
                          <span className="font-bold text-slate-800 block">{cc.userId?.name}</span>
                          <span className="text-slate-450 block text-[10px] font-medium mt-0.5">{cc.userId?.email}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-700 block">{cc.roleInProduction}</span>
                          {cc.characterId && (
                            <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">Plays: {cc.characterId.name}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-8 font-medium">No cast or crew assigned yet.</div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-450 space-y-4 max-w-2xl mx-auto shadow-xs">
          <Film size={44} className="mx-auto text-indigo-500/40" />
          <p className="text-sm font-bold text-slate-800">You are not assigned to any active film projects yet.</p>
          <p className="text-xs text-slate-450 leading-relaxed">Ask your system administrator or project manager to assign you to a project.</p>
        </div>
      )}
    </div>
  );
}
