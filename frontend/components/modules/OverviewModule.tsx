'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Film } from 'lucide-react';
import { useAuth } from '@/app/components/auth-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { PermissionGuard } from '@/app/components/permission-guard';
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

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productionsService.createProduction({ title: newProdTitle, description: newProdDesc });
      setNewProdTitle('');
      setNewProdDesc('');
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
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      <PermissionGuard permission="productions.create">
        <div className="flex justify-end bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <form onSubmit={handleCreateProduction} className="flex gap-3 items-center w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="New Project Title"
              value={newProdTitle}
              onChange={(e) => setNewProdTitle(e.target.value)}
              required
              className="w-full sm:w-64 bg-white border border-slate-250 rounded-xl py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
            <button 
              type="submit"
              className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus size={14} /> Create Project
            </button>
          </form>
        </div>
      </PermissionGuard>

      {selectedProduction ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Project Stats Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Project Metadata</h3>
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Title</span>
                <span className="font-bold text-slate-800 text-sm">{selectedProduction.title}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Description</span>
                <span className="text-slate-600 block leading-relaxed mt-0.5">{selectedProduction.description || 'No description provided.'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Status</span>
                <span className="inline-block mt-1.5 py-0.5 px-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-extrabold uppercase tracking-wider">
                  {selectedProduction.status}
                </span>
              </div>
            </div>
          </div>

          {/* Cast Crew Members */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Assigned Cast & Crew</h3>
              <span className="text-[10px] text-slate-400 font-semibold">{castCrewList.length} total mapped</span>
            </div>

            {castCrewList.length > 0 ? (
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 text-xs">
                {castCrewList.map((cc) => (
                  <div key={cc._id} className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-150 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800">{cc.userId?.name}</span>
                      <span className="text-slate-450 block text-[10px] font-medium mt-0.5">{cc.userId?.email} ({cc.userId?.contractorType})</span>
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

            {/* Quick Crew Mapper */}
            <PermissionGuard permission="productions.create">
              <form onSubmit={handleAssignCastCrew} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-100">
                <select
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  required
                  className="bg-white border border-slate-250 rounded-xl py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 appearance-none cursor-pointer"
                >
                  <option value="">Select User...</option>
                  {systemUsers.filter(u => u.isActive && !castCrewList.some(cc => cc.userId?._id === u._id)).map((u: any) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.contractorType})</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="Role in Project"
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  required
                  className="bg-white border border-slate-250 rounded-xl py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <select
                  value={assignChar}
                  onChange={(e) => setAssignChar(e.target.value)}
                  className="bg-white border border-slate-250 rounded-xl py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 appearance-none cursor-pointer"
                >
                  <option value="">No character role...</option>
                  {characters.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <button 
                  type="submit"
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-bold cursor-pointer text-center transition shadow-xs"
                >
                  Assign User
                </button>
              </form>
            </PermissionGuard>
          </div>

          {/* Script Characters */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Script Characters</h3>
              <span className="text-[10px] text-slate-400 font-semibold">{characters.length} characters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {characters.length > 0 ? (
                characters.map((char) => (
                  <div key={char._id} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-2">
                    <h4 className="font-bold text-sm text-slate-800">{char.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">{char.description || 'No description.'}</p>
                    <div className="border-t border-slate-200/60 pt-2.5 text-[10px]">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider block">Assigned Actors:</span>
                      <span className="text-slate-700 block truncate font-bold mt-0.5">
                        {char.assignments && char.assignments.length > 0
                          ? (char.assignments as any[]).map(a => a.name).join(', ')
                          : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-8 col-span-3 font-medium">No script characters mapped yet.</div>
              )}
            </div>

            <PermissionGuard permission="productions.create">
              <form onSubmit={handleCreateCharacter} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100">
                <input 
                  type="text" 
                  placeholder="Character Name"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  required
                  className="flex-1 bg-white border border-slate-250 rounded-xl py-1.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <input 
                  type="text" 
                  placeholder="Description (e.g. Lead protagonist, age 30s)"
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  className="flex-2 bg-white border border-slate-250 rounded-xl py-1.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <button 
                  type="submit"
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  Create Character
                </button>
              </form>
            </PermissionGuard>
          </div>

        </div>
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
