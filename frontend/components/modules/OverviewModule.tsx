'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Film } from 'lucide-react';
import { useAuth } from '@/app/components/auth-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
import type { Production, CastCrew, Character } from '@/app/types';
import productionsService from '@/services/productionsService';
import adminService from '@/services/adminService';

export default function OverviewModule() {
  const { token } = useAuth();
  const user = useAuthStore(state => state.user);
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const setProductions = useProductionStore(state => state.setProductions);
  const setSelectedProduction = useProductionStore(state => state.setSelectedProduction);

  const [castCrewList, setCastCrewList] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  
  const [assignUser, setAssignUser] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [assignChar, setAssignChar] = useState('');

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  useEffect(() => {
    if (selectedProduction && token) {
      fetchCharacters();
      fetchCastCrew();
      if (hasPermission('users.approve')) {
        fetchSystemUsers();
      }
    }
  }, [selectedProduction, token]);

  // We can just rely on the layout or fetch locally if needed
  // Removing fetchProductions local definition because handleCreateProduction can just call the service

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productionsService.createProduction({ title: newProdTitle, description: newProdDesc });
      setNewProdTitle('');
      setNewProdDesc('');
      
      // We don't fetchProductions here because DynamicSidebar fetches it,
      // but to update local state immediately without lifting logic, we can re-fetch
      // or we can import the service and fetch. Wait, we DO need to fetch!
      const data = await productionsService.getProductions();
      setProductions(data);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Project Overview</h2>
          <p className="text-xs text-slate-400 mt-1">Management metrics for active productions.</p>
        </div>
        <PermissionGuard permission="productions.create">
          <form onSubmit={handleCreateProduction} className="flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="New Production Title"
              value={newProdTitle}
              onChange={(e) => setNewProdTitle(e.target.value)}
              required
              className="bg-slate-900 border border-slate-850 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
            />
            <button 
              type="submit"
              className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.2)]"
            >
              <Plus size={14} /> Create
            </button>
          </form>
        </PermissionGuard>
      </div>

      {selectedProduction ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Production Stats Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Production Metadata</h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-500 block">Title</span>
                <span className="font-semibold text-slate-200 text-sm">{selectedProduction.title}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Description</span>
                <span className="text-slate-300 block leading-relaxed">{selectedProduction.description || 'No description provided.'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status</span>
                <span className="inline-block mt-1 py-0.5 px-2 bg-purple-950/40 border border-purple-800 text-purple-300 rounded text-[10px] font-semibold">
                  {selectedProduction.status}
                </span>
              </div>
            </div>
          </div>

          {/* Cast Crew Members */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 md:col-span-2">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Assigned Cast & Crew</h3>
              <span className="text-[10px] text-slate-400">{castCrewList.length} total mapped</span>
            </div>

            {castCrewList.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 text-xs">
                {castCrewList.map((cc) => (
                  <div key={cc._id} className="flex justify-between items-center p-2.5 bg-slate-950/40 border border-slate-850 rounded-lg">
                    <div>
                      <span className="font-semibold text-slate-200">{cc.userId?.name}</span>
                      <span className="text-slate-500 block text-[10px]">{cc.userId?.email} ({cc.userId?.contractorType})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-300 block">{cc.roleInProduction}</span>
                      {cc.characterId && (
                        <span className="text-[10px] text-purple-400 font-medium">Plays: {cc.characterId.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">No cast or crew assigned yet.</div>
            )}

            {/* Quick Crew Mapper */}
            <PermissionGuard permission="productions.create">
              <form onSubmit={handleAssignCastCrew} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-850">
                <select
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select User...</option>
                  {systemUsers.filter(u => u.isActive && !castCrewList.some(cc => cc.userId?._id === u._id)).map((u: any) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.contractorType})</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="Role in Production"
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  required
                  className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                />
                <select
                  value={assignChar}
                  onChange={(e) => setAssignChar(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="">No character role...</option>
                  {characters.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <button 
                  type="submit"
                  className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold cursor-pointer text-center"
                >
                  Assign
                </button>
              </form>
            </PermissionGuard>
          </div>

          {/* Script Characters */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 md:col-span-3">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Script Characters</h3>
              <span className="text-[10px] text-slate-400">{characters.length} characters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {characters.length > 0 ? (
                characters.map((char) => (
                  <div key={char._id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                    <h4 className="font-semibold text-sm text-purple-300">{char.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{char.description || 'No description.'}</p>
                    <div className="border-t border-slate-900 pt-2 text-[10px]">
                      <span className="text-slate-500 block">Assigned Actors:</span>
                      <span className="text-slate-300 block truncate font-medium">
                        {char.assignments && char.assignments.length > 0
                          ? (char.assignments as any[]).map(a => a.name).join(', ')
                          : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-6 col-span-3">No script characters mapped yet.</div>
              )}
            </div>

            <PermissionGuard permission="productions.create">
              <form onSubmit={handleCreateCharacter} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-850">
                <input 
                  type="text" 
                  placeholder="Character Name"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  required
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                />
                <input 
                  type="text" 
                  placeholder="Description (e.g. Lead protagonist, age 30s)"
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  className="flex-2 bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                />
                <button 
                  type="submit"
                  className="py-1.5 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold cursor-pointer"
                >
                  Create Character
                </button>
              </form>
            </PermissionGuard>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-4">
          <Film size={40} className="mx-auto text-purple-500/50" />
          <p className="text-sm">You are not assigned to any active film productions yet.</p>
          <p className="text-xs text-slate-500">Ask your system administrator or project manager to assign you to a project.</p>
        </div>
      )}
    </div>
  );
}
