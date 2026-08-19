import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { castCrewService } from '../services/cast-crew.service';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import type { Character, CastCrew } from '@/features/cast-crew/types';
import type { User } from '@/features/users/types';
import { formatError } from '@/utils/format-error';
import { characterSchema } from '../validations/character.validation';
import { castCrewSchema, updateCastCrewSchema } from '../validations/cast-crew.validation';

export function useCastCrew() {
  const user = useAuthStore(state => state.user);
  const { hasPermission } = usePermissions();
  const selectedProduction = useProductionStore(state => state.selectedProduction);

  // Lists
  const [characters, setCharacters] = useState<Character[]>([]);
  const [castCrewList, setCastCrewList] = useState<CastCrew[]>([]);

  // Eligible lists for assigning
  const [eligibleCast, setEligibleCast] = useState<User[]>([]);
  const [eligibleCrew, setEligibleCrew] = useState<User[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'characters' | 'cast' | 'crew'>('characters');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [characterErrors, setCharacterErrors] = useState<Record<string, string>>({});
  const [castCrewErrors, setCastCrewErrors] = useState<Record<string, string>>({});

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
      const errMsg = formatError(e, 'Failed to load project details.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
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
      toast.error(formatError(e, `Failed to fetch eligible ${type} list.`));
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
    setCharacterErrors({});
    setCharacterModalOpen(true);
  };

  const openEditCharacter = (char: Character) => {
    setSelectedCharacter(char);
    setCharacterForm({ name: char.name, description: char.description || '' });
    setCharacterErrors({});
    setCharacterModalOpen(true);
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    setErrorMsg(null);
    setCharacterErrors({});

    const parseResult = characterSchema.safeParse(characterForm);
    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      });
      setCharacterErrors(errors);
      setErrorMsg('Please fix the validation errors before submitting.');
      return;
    }

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
      const errMsg = formatError(err, 'Failed to save character.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
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
      const errMsg = formatError(err, 'Failed to delete character.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
    }
  };

  // --- Cast Assignment Handlers ---
  const openAssignCast = async () => {
    setCastForm({ userId: '', roleInProduction: 'Actor', characterId: '' });
    setCastCrewErrors({});
    await fetchEligibleData('cast');
    setAssignCastModalOpen(true);
  };

  const handleAssignCast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    setErrorMsg(null);
    setCastCrewErrors({});

    const parseResult = castCrewSchema.safeParse(castForm);
    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      });
      setCastCrewErrors(errors);
      setErrorMsg('Please fix the validation errors before submitting.');
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
      const errMsg = formatError(err, 'Failed to assign cast member.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
    }
  };

  // --- Crew Assignment Handlers ---
  const openAssignCrew = async () => {
    setCrewForm({ userId: '', roleInProduction: '' });
    setCastCrewErrors({});
    await fetchEligibleData('crew');
    setAssignCrewModalOpen(true);
  };

  const handleAssignCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    setErrorMsg(null);
    setCastCrewErrors({});

    // Validate using castCrewSchema, with fallback characterId = '' to satisfy validation
    const parseResult = castCrewSchema.safeParse({ ...crewForm, characterId: '' });
    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      });
      setCastCrewErrors(errors);
      setErrorMsg('Please fix the validation errors before submitting.');
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
      const errMsg = formatError(err, 'Failed to assign crew member.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
    }
  };

  // --- Edit/Update Assignment Handlers ---
  const openEditAssignment = (assignment: CastCrew) => {
    setSelectedAssignment(assignment);
    setEditForm({
      roleInProduction: assignment.roleInProduction,
      characterId: assignment.characterId?._id || ''
    });
    setCastCrewErrors({});
    setEditAssignmentModalOpen(true);
  };

  const handleEditAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction || !selectedAssignment) return;
    setErrorMsg(null);
    setCastCrewErrors({});

    const parseResult = updateCastCrewSchema.safeParse(editForm);
    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[String(issue.path[0])] = issue.message;
        }
      });
      setCastCrewErrors(errors);
      setErrorMsg('Please fix the validation errors before submitting.');
      return;
    }

    try {
      await castCrewService.updateCastCrew(selectedProduction._id, selectedAssignment._id, {
        roleInProduction: editForm.roleInProduction,
        characterId: editForm.characterId || null
      });
      triggerSuccess('Assignment updated successfully!');
      setEditAssignmentModalOpen(false);
      fetchData();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to update assignment.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
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
      const errMsg = formatError(err, 'Failed to remove assignment.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
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
    characterErrors,
    castCrewErrors,
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
