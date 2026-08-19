'use client';

import React from 'react';
import { Clapperboard, Plus, UserPlus, AlertCircle, CheckCircle, X } from 'lucide-react';

// Custom hook & subcomponents
import { useCastCrew } from '@/features/cast-crew/hooks/useCastCrew';
import { CastCrewStats } from '@/features/cast-crew/components/CastCrewStats';
import { CastCrewFilters } from '@/features/cast-crew/components/CastCrewFilters';
import { CharactersGrid } from '@/features/cast-crew/components/CharactersGrid';
import { CastTable } from '@/features/cast-crew/components/CastTable';
import { CrewTable } from '@/features/cast-crew/components/CrewTable';
import { CharacterModal } from '@/features/cast-crew/components/CharacterModal';
import { AssignCastModal } from '@/features/cast-crew/components/AssignCastModal';
import { AssignCrewModal } from '@/features/cast-crew/components/AssignCrewModal';
import { EditAssignmentModal } from '@/features/cast-crew/components/EditAssignmentModal';

export default function CastCrewModule() {
  const {
    selectedProduction,
    characters,
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
    editForm,
    setEditForm,
    canUpdate,
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
  } = useCastCrew();

  if (!selectedProduction) {
    return (
      <div className="w-full px-6 md:px-8 lg:px-10 py-12">
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

  return (
    <div className="w-full px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      
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
      <CastCrewStats
        totalCharacters={totalCharacters}
        assignedCharacters={assignedCharacters}
        castCount={castList.length}
        crewCount={crewList.length}
      />

      {/* Main Grid View */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col">

        {/* Navigation Tab & Actions Header */}
        <div className="border-b border-slate-150 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">

          {/* Tab Selection */}
          <div className="flex items-center gap-1.5 border border-slate-200 bg-white p-1 rounded-xl w-fit">
            <button
              onClick={() => { setActiveTab('characters'); setSearchQuery(''); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'characters'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Characters
            </button>
            <button
              onClick={() => { setActiveTab('cast'); setSearchQuery(''); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'cast'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Cast
            </button>
            <button
              onClick={() => { setActiveTab('crew'); setSearchQuery(''); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'crew'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
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
        <CastCrewFilters
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
        />

        {/* Dynamic Content Listing */}
        <div className="flex-1 overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 rounded-full border-[3px] border-indigo-100 border-t-indigo-600 animate-spin" />
              <span className="text-xs text-slate-400 font-bold">Synchronizing project workspace...</span>
            </div>
          ) : (
            <>
              {activeTab === 'characters' && (
                <CharactersGrid
                  characters={filteredCharacters}
                  onOpenEdit={openEditCharacter}
                  onDelete={handleDeleteCharacter}
                  canUpdate={canUpdate}
                />
              )}

              {activeTab === 'cast' && (
                <CastTable
                  cast={filteredCast}
                  onOpenEdit={openEditAssignment}
                  onRemove={handleRemoveAssignment}
                  canUpdate={canUpdate}
                />
              )}

              {activeTab === 'crew' && (
                <CrewTable
                  crew={filteredCrew}
                  onOpenEdit={openEditAssignment}
                  onRemove={handleRemoveAssignment}
                  canUpdate={canUpdate}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* --- MODAL 1: Character Creation/Edit --- */}
      <CharacterModal
        isOpen={characterModalOpen}
        onClose={() => setCharacterModalOpen(false)}
        selectedCharacter={selectedCharacter}
        characterForm={characterForm}
        setCharacterForm={setCharacterForm}
        onSubmit={handleSaveCharacter}
        characterErrors={characterErrors}
      />

      {/* --- MODAL 2: Assign Cast --- */}
      <AssignCastModal
        isOpen={assignCastModalOpen}
        onClose={() => setAssignCastModalOpen(false)}
        castForm={castForm}
        setCastForm={setCastForm}
        eligibleCast={eligibleCast}
        characters={characters}
        onSubmit={handleAssignCast}
        castCrewErrors={castCrewErrors}
      />

      {/* --- MODAL 3: Assign Crew --- */}
      <AssignCrewModal
        isOpen={assignCrewModalOpen}
        onClose={() => setAssignCrewModalOpen(false)}
        crewForm={crewForm}
        setCrewForm={setCrewForm}
        eligibleCrew={eligibleCrew}
        onSubmit={handleAssignCrew}
        castCrewErrors={castCrewErrors}
      />

      {/* --- MODAL 4: Edit Assignment (Cast or Crew) --- */}
      <EditAssignmentModal
        isOpen={editAssignmentModalOpen}
        onClose={() => setEditAssignmentModalOpen(false)}
        selectedAssignment={selectedAssignment}
        editForm={editForm}
        setEditForm={setEditForm}
        characters={characters}
        onSubmit={handleEditAssignment}
        castCrewErrors={castCrewErrors}
      />

    </div>
  );
}
