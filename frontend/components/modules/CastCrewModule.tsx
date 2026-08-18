'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clapperboard, 
  Briefcase, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Info, 
  X, 
  UserPlus, 
  UserCheck, 
  CheckCircle,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { productionsService } from '@/services/productionsService';
import type { Character, CastCrew } from '@/app/types';

export default function CastCrewModule() {
  const user = useAuthStore(state => state.user);
  const selectedProduction = useProductionStore(state => state.selectedProduction);

  // Lists
  const [characters, setCharacters] = useState<Character[]>([]);
  const [castCrewList, setCastCrewList] = useState<CastCrew[]>([]);
  
  // Eligible lists for assigning
  const [eligibleCast, setEligibleCast] = useState<any[]>([]);
  const [eligibleCrew, setEligibleCrew] = useState<any[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'characters' | 'cast' | 'crew'>('characters');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [characterModalOpen, setCharacterModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterForm, setCharacterForm] = useState({ name: '', description: '' });

  const [assignCastModalOpen, setAssignCastModalOpen] = useState(false);
  const [castForm, setCastForm] = useState({ userId: '', roleInProduction: '', characterId: '' });

  const [assignCrewModalOpen, setAssignCrewModalOpen] = useState(false);
  const [crewForm, setCrewForm] = useState({ userId: '', roleInProduction: '' });

  const [editAssignmentModalOpen, setEditAssignmentModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<CastCrew | null>(null);
  const [editForm, setEditForm] = useState({ roleInProduction: '', characterId: '' });

  // Permissions check
  const canUpdate = user?.permissions?.includes('productions.update') || false;

  useEffect(() => {
    if (selectedProduction) {
      fetchData();
    }
  }, [selectedProduction]);

  const fetchData = async () => {
    if (!selectedProduction) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [chars, ccList] = await Promise.all([
        productionsService.getCharacters(selectedProduction._id),
        productionsService.getCastCrew(selectedProduction._id)
      ]);
      setCharacters(chars);
      setCastCrewList(ccList);
    } catch (e: any) {
      console.error('Error fetching cast & crew details:', e);
      setErrorMsg(e?.response?.data?.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleData = async (type: 'cast' | 'crew') => {
    if (!selectedProduction) return;
    try {
      if (type === 'cast') {
        const data = await productionsService.getEligibleCast(selectedProduction._id);
        setEligibleCast(data);
      } else {
        const data = await productionsService.getEligibleCrew(selectedProduction._id);
        setEligibleCrew(data);
      }
    } catch (e) {
      console.error(`Error fetching eligible ${type} list:`, e);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // --- Character Handlers ---
  const openCreateCharacter = () => {
    setSelectedCharacter(null);
    setCharacterForm({ name: '', description: '' });
    setCharacterModalOpen(true);
  };

  const openEditCharacter = (char: Character) => {
    setSelectedCharacter(char);
    setCharacterForm({ name: char.name, description: char.description || '' });
    setCharacterModalOpen(true);
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    try {
      if (selectedCharacter) {
        // Update character
        await productionsService.updateCharacter(selectedProduction._id, selectedCharacter._id, characterForm);
        triggerSuccess('Character updated successfully!');
      } else {
        // Create character
        await productionsService.createCharacter(selectedProduction._id, characterForm);
        triggerSuccess('Character created successfully!');
      }
      setCharacterModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to save character.');
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (!selectedProduction) return;
    if (!confirm('Are you sure you want to delete this character? This will clear all actor assignments for it.')) return;
    try {
      await productionsService.deleteCharacter(selectedProduction._id, charId);
      triggerSuccess('Character deleted successfully.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to delete character.');
    }
  };

  // --- Cast Assignment Handlers ---
  const openAssignCast = async () => {
    setCastForm({ userId: '', roleInProduction: 'Actor', characterId: '' });
    await fetchEligibleData('cast');
    setAssignCastModalOpen(true);
  };

  const handleAssignCast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    if (!castForm.userId) {
      alert('Please select a cast member.');
      return;
    }
    try {
      await productionsService.assignCastCrew(selectedProduction._id, {
        userId: castForm.userId,
        roleInProduction: castForm.roleInProduction,
        characterId: castForm.characterId || undefined
      });
      triggerSuccess('Cast member assigned successfully!');
      setAssignCastModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to assign cast member.');
    }
  };

  // --- Crew Assignment Handlers ---
  const openAssignCrew = async () => {
    setCrewForm({ userId: '', roleInProduction: '' });
    await fetchEligibleData('crew');
    setAssignCrewModalOpen(true);
  };

  const handleAssignCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    if (!crewForm.userId) {
      alert('Please select a crew member.');
      return;
    }
    try {
      await productionsService.assignCastCrew(selectedProduction._id, {
        userId: crewForm.userId,
        roleInProduction: crewForm.roleInProduction
      });
      triggerSuccess('Crew member assigned successfully!');
      setAssignCrewModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to assign crew member.');
    }
  };

  // --- Edit/Update Assignment Handlers ---
  const openEditAssignment = (assignment: CastCrew) => {
    setSelectedAssignment(assignment);
    setEditForm({
      roleInProduction: assignment.roleInProduction,
      characterId: assignment.characterId?._id || ''
    });
    setEditAssignmentModalOpen(true);
  };

  const handleEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction || !selectedAssignment) return;
    try {
      await productionsService.updateCastCrew(selectedProduction._id, selectedAssignment._id, {
        roleInProduction: editForm.roleInProduction,
        characterId: editForm.characterId || null
      });
      triggerSuccess('Assignment updated successfully!');
      setEditAssignmentModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update assignment.');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!selectedProduction) return;
    if (!confirm('Are you sure you want to remove this assignment from the project?')) return;
    try {
      await productionsService.removeCastCrew(selectedProduction._id, assignmentId);
      triggerSuccess('Assignment removed successfully.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to remove assignment.');
    }
  };

  if (!selectedProduction) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-12">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-150">
            <Clapperboard size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No Active Project Selected</h2>
          <p className="text-slate-500 max-w-md text-sm leading-relaxed">
            Please select a project from the sidebar list to view, assign, and manage cast and crew members.
          </p>
        </div>
      </div>
    );
  }

  // Derived stats
  const totalCharacters = characters.length;
  const assignedCharacters = characters.filter(c => c.assignments && c.assignments.length > 0).length;
  
  // Cast matches anyone whose CastCrew record has characterId mapped OR they are assigned a role like actor
  const castList = castCrewList.filter(cc => cc.characterId || cc.userId?.contractorType === 'Cast');
  const crewList = castCrewList.filter(cc => !cc.characterId && cc.userId?.contractorType !== 'Cast');

  // Search & filters logic
  const filteredCharacters = characters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCast = castList.filter(cc => 
    cc.userId?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cc.roleInProduction.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (cc.characterId?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCrew = crewList.filter(cc => {
    const matchesSearch = cc.userId?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cc.roleInProduction.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (roleFilter === 'All') return matchesSearch;
    return matchesSearch && cc.roleInProduction.toLowerCase().includes(roleFilter.toLowerCase());
  });

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Alert Notices */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-750 px-4 py-3 rounded-xl flex items-start gap-3 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800 transition">
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <p className="flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 transition">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5 hover:border-slate-300 transition duration-150">
          <div className="flex items-center justify-between text-slate-450">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Characters</span>
            <Clapperboard size={18} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalCharacters}</span>
            <span className="text-[10px] text-slate-400 font-semibold">total</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5 hover:border-slate-300 transition duration-150">
          <div className="flex items-center justify-between text-slate-450">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Mapped Roles</span>
            <UserCheck size={18} className="text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{assignedCharacters}</span>
            <span className="text-[10px] text-slate-400 font-semibold">of {totalCharacters} casted</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5 hover:border-slate-300 transition duration-150">
          <div className="flex items-center justify-between text-slate-450">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Cast Members</span>
            <Users size={18} className="text-[#3b82f6]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{castList.length}</span>
            <span className="text-[10px] text-slate-400 font-semibold">actors</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-1.5 hover:border-slate-300 transition duration-150">
          <div className="flex items-center justify-between text-slate-450">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Crew Members</span>
            <Briefcase size={18} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{crewList.length}</span>
            <span className="text-[10px] text-slate-400 font-semibold">on project</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        
        {/* Navigation Tab & Actions Header */}
        <div className="border-b border-slate-150 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          
          {/* Tab Selection */}
          <div className="flex items-center gap-1.5 border border-slate-200 bg-white p-1 rounded-xl w-fit">
            <button 
              onClick={() => { setActiveTab('characters'); setSearchQuery(''); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'characters' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              Characters
            </button>
            <button 
              onClick={() => { setActiveTab('cast'); setSearchQuery(''); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'cast' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              Cast
            </button>
            <button 
              onClick={() => { setActiveTab('crew'); setSearchQuery(''); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'crew' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              Crew
            </button>
          </div>

          {/* Action Buttons for Managers */}
          {canUpdate && (
            <div className="flex items-center gap-3">
              {activeTab === 'characters' && (
                <button 
                  onClick={openCreateCharacter}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  <Plus size={14} /> Create Character
                </button>
              )}
              {activeTab === 'cast' && (
                <button 
                  onClick={openAssignCast}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  <UserPlus size={14} /> Assign Cast
                </button>
              )}
              {activeTab === 'crew' && (
                <button 
                  onClick={openAssignCrew}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  <UserPlus size={14} /> Assign Crew
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search, Filters & Controls */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition"
            />
          </div>

          {activeTab === 'crew' && (
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Filter className="text-slate-400 w-4 h-4" />
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition cursor-pointer flex-1 sm:flex-none"
              >
                <option value="All">All Departments</option>
                <option value="Camera">Camera / G&E</option>
                <option value="Direction">Direction</option>
                <option value="Art">Art & Props</option>
                <option value="Production">Production Office</option>
                <option value="Sound">Sound</option>
                <option value="Makeup">Makeup & Hair</option>
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Content Listing */}
        <div className="flex-1 overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 rounded-full border-[3px] border-indigo-100 border-t-indigo-600 animate-spin" />
              <span className="text-xs text-slate-400 font-bold">Synchronizing project workspace...</span>
            </div>
          ) : (
            <>
              {/* Characters Tab Listing */}
              {activeTab === 'characters' && (
                filteredCharacters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                    {filteredCharacters.map(char => (
                      <div key={char._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-slate-250 transition duration-200">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-bold text-slate-800 text-sm leading-snug">{char.name}</h4>
                            
                            {/* Management Actions */}
                            {canUpdate && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => openEditCharacter(char)}
                                  className="p-1.5 text-slate-450 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="Edit Character"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCharacter(char._id)}
                                  className="p-1.5 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-lg transition"
                                  title="Delete Character"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium min-h-[36px]">
                            {char.description || 'No script character profile/description details provided.'}
                          </p>
                        </div>

                        {/* Assignments Detail */}
                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">Assigned Actor</span>
                          {char.assignments && char.assignments.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5.5 h-5.5 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center overflow-hidden">
                                {(char.assignments[0] as any)?.profile?.photoUrl ? (
                                  <img src={(char.assignments[0] as any).profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[9px] font-bold text-[#4f46e5]">{(char.assignments[0] as any).name?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="font-bold text-slate-700">{(char.assignments[0] as any).name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-semibold">Unassigned</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-2">
                    <Info className="w-10 h-10 text-slate-350 mx-auto" />
                    <h5 className="font-bold text-slate-700 text-sm">No characters found</h5>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Try refining your search or add a new character to this project.</p>
                  </div>
                )
              )}

              {/* Cast Tab Listing */}
              {activeTab === 'cast' && (
                filteredCast.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-3.5">Actor / User</th>
                        <th className="px-6 py-3.5">Assigned Character</th>
                        <th className="px-6 py-3.5">Role Name</th>
                        {canUpdate && <th className="px-6 py-3.5 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCast.map(cc => (
                        <tr key={cc._id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4 font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center overflow-hidden shrink-0">
                                {cc.userId?.profile?.photoUrl ? (
                                  <img src={cc.userId.profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-[#4f46e5]">{cc.userId?.name?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <span className="block">{cc.userId?.name}</span>
                                <span className="block text-[9px] text-slate-400 font-semibold font-mono mt-0.5">{cc.userId?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            {cc.characterId ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                                {cc.characterId.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No character mapped</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">{cc.roleInProduction}</td>
                          
                          {/* Actions */}
                          {canUpdate && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => openEditAssignment(cc)}
                                  className="p-1.5 text-slate-450 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="Edit Assignment"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleRemoveAssignment(cc._id)}
                                  className="p-1.5 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-lg transition"
                                  title="Remove Assignment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-20 space-y-2">
                    <Info className="w-10 h-10 text-slate-350 mx-auto" />
                    <h5 className="font-bold text-slate-700 text-sm">No cast members found</h5>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Assign a registered actor user to a script character.</p>
                  </div>
                )
              )}

              {/* Crew Tab Listing */}
              {activeTab === 'crew' && (
                filteredCrew.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-3.5">User / Contractor</th>
                        <th className="px-6 py-3.5">Role / Position</th>
                        <th className="px-6 py-3.5">Registered Category</th>
                        {canUpdate && <th className="px-6 py-3.5 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredCrew.map(cc => (
                        <tr key={cc._id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4 font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {cc.userId?.profile?.photoUrl ? (
                                  <img src={cc.userId.profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-slate-600">{cc.userId?.name?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <span className="block">{cc.userId?.name}</span>
                                <span className="block text-[9px] text-slate-400 font-semibold font-mono mt-0.5">{cc.userId?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                              {cc.roleInProduction}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">{cc.userId?.contractorType || 'Crew'}</td>
                          
                          {/* Actions */}
                          {canUpdate && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => openEditAssignment(cc)}
                                  className="p-1.5 text-slate-450 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="Edit Position"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleRemoveAssignment(cc._id)}
                                  className="p-1.5 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-lg transition"
                                  title="Remove Assignment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-20 space-y-2">
                    <Info className="w-10 h-10 text-slate-350 mx-auto" />
                    <h5 className="font-bold text-slate-700 text-sm">No crew assignments found</h5>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Click "Assign Crew" to map registered users to crew roles.</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* --- MODAL 1: Character Creation/Edit --- */}
      {characterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm">
                {selectedCharacter ? 'Edit Character' : 'Create Script Character'}
              </h4>
              <button onClick={() => setCharacterModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCharacter} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Character Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Iron Man / Tony Stark"
                  value={characterForm.name}
                  onChange={(e) => setCharacterForm({ ...characterForm, name: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Description / Script Notes</label>
                <textarea 
                  rows={4}
                  placeholder="Describe the script details, key attributes, or costume requirements..."
                  value={characterForm.description}
                  onChange={(e) => setCharacterForm({ ...characterForm, description: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setCharacterModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  {selectedCharacter ? 'Save Changes' : 'Create Character'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Assign Cast --- */}
      {assignCastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm">Assign Cast Member</h4>
              <button onClick={() => setAssignCastModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignCast} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Select Actor / User</label>
                <select 
                  required
                  value={castForm.userId}
                  onChange={(e) => setCastForm({ ...castForm, userId: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition cursor-pointer font-medium"
                >
                  <option value="">-- Choose registered actor --</option>
                  {eligibleCast.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-450 italic mt-1 font-semibold flex items-center gap-1">
                  <Info size={10} /> Showing active approved users not yet assigned a character.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Role in Production</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Lead / Supporting / Stunt Double"
                  value={castForm.roleInProduction}
                  onChange={(e) => setCastForm({ ...castForm, roleInProduction: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Map to Script Character (Optional)</label>
                <select 
                  value={castForm.characterId}
                  onChange={(e) => setCastForm({ ...castForm, characterId: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition cursor-pointer font-medium"
                >
                  <option value="">-- Select Character --</option>
                  {characters.filter(c => !c.assignments || c.assignments.length === 0).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setAssignCastModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Assign Cast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Assign Crew --- */}
      {assignCrewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm">Assign Crew Member</h4>
              <button onClick={() => setAssignCrewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignCrew} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Select Crew / User</label>
                <select 
                  required
                  value={crewForm.userId}
                  onChange={(e) => setCrewForm({ ...crewForm, userId: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition cursor-pointer font-medium"
                >
                  <option value="">-- Choose registered crew --</option>
                  {eligibleCrew.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.contractorType || 'Freelancer'})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-450 italic mt-1 font-semibold flex items-center gap-1">
                  <Info size={10} /> Showing active approved users not yet assigned to the crew.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Position / Role</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Director of Photography / Camera Assistant"
                  value={crewForm.roleInProduction}
                  onChange={(e) => setCrewForm({ ...crewForm, roleInProduction: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setAssignCrewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Assign Crew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Edit Assignment (Cast or Crew) --- */}
      {editAssignmentModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm">Edit Assignment Details</h4>
              <button onClick={() => setEditAssignmentModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditAssignment} className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1 border border-slate-150">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Assigned User</span>
                <span className="block font-bold text-slate-700 text-xs">{selectedAssignment.userId?.name}</span>
                <span className="block text-[9.5px] text-slate-400 font-semibold font-mono">{selectedAssignment.userId?.email}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Position / Role</label>
                <input 
                  type="text"
                  required
                  value={editForm.roleInProduction}
                  onChange={(e) => setEditForm({ ...editForm, roleInProduction: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition"
                />
              </div>

              {/* Only show Character mapper if the assignment is Cast or had character mapped */}
              {(selectedAssignment.characterId || selectedAssignment.userId?.contractorType === 'Cast') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Map to Script Character</label>
                  <select 
                    value={editForm.characterId}
                    onChange={(e) => setEditForm({ ...editForm, characterId: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition cursor-pointer font-medium"
                  >
                    <option value="">-- No character mapped --</option>
                    
                    {/* Preserve currently assigned character */}
                    {selectedAssignment.characterId && (
                      <option value={selectedAssignment.characterId._id}>
                        {selectedAssignment.characterId.name} (Current)
                      </option>
                    )}

                    {/* Show other unassigned characters */}
                    {characters
                      .filter(c => !c.assignments || c.assignments.length === 0 || c._id === selectedAssignment.characterId?._id)
                      .filter(c => c._id !== selectedAssignment.characterId?._id)
                      .map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditAssignmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
