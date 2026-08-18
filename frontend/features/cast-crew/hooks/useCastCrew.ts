import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { castCrewService } from '../services/cast-crew.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import type { Character, CastCrew } from '@/app/types';

export function useCastCrew() {
  const user = useAuthStore(state => state.user);
  const { hasPermission } = usePermissions();
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
  const canUpdate = hasPermission(PERMISSIONS.PRODUCTIONS_UPDATE);

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
        castCrewService.getCharacters(selectedProduction._id),
        castCrewService.getCastCrew(selectedProduction._id)
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
        const data = await castCrewService.getEligibleCast(selectedProduction._id);
        setEligibleCast(data);
      } else {
        const data = await castCrewService.getEligibleCrew(selectedProduction._id);
        setEligibleCrew(data);
      }
    } catch (e) {
      console.error(`Error fetching eligible ${type} list:`, e);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    toast.success(msg);
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
        await castCrewService.updateCharacter(selectedProduction._id, selectedCharacter._id, characterForm);
        triggerSuccess('Character updated successfully!');
      } else {
        // Create character
        await castCrewService.createCharacter(selectedProduction._id, characterForm);
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
      await castCrewService.deleteCharacter(selectedProduction._id, charId);
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
      await castCrewService.assignCastCrew(selectedProduction._id, {
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
      await castCrewService.assignCastCrew(selectedProduction._id, {
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
      await castCrewService.updateCastCrew(selectedProduction._id, selectedAssignment._id, {
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
      await castCrewService.removeCastCrew(selectedProduction._id, assignmentId);
      triggerSuccess('Assignment removed successfully.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to remove assignment.');
    }
  };

  // Derived stats
  const totalCharacters = characters.length;
  const assignedCharacters = characters.filter(c => c.assignments && c.assignments.length > 0).length;

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

  return {
    user,
    selectedProduction,
    characters,
    castCrewList,
    eligibleCast,
    eligibleCrew,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    characterModalOpen,
    setCharacterModalOpen,
    selectedCharacter,
    setSelectedCharacter,
    characterForm,
    setCharacterForm,
    assignCastModalOpen,
    setAssignCastModalOpen,
    castForm,
    setCastForm,
    assignCrewModalOpen,
    setAssignCrewModalOpen,
    crewForm,
    setCrewForm,
    editAssignmentModalOpen,
    setEditAssignmentModalOpen,
    selectedAssignment,
    setSelectedAssignment,
    editForm,
    setEditForm,
    canUpdate,
    fetchData,
    fetchEligibleData,
    openCreateCharacter,
    openEditCharacter,
    handleSaveCharacter,
    handleDeleteCharacter,
    openAssignCast,
    handleAssignCast,
    openAssignCrew,
    handleAssignCrew,
    openEditAssignment,
    handleEditAssignment,
    handleRemoveAssignment,
    totalCharacters,
    assignedCharacters,
    castList,
    crewList,
    filteredCharacters,
    filteredCast,
    filteredCrew,
  };
}

export default useCastCrew;
