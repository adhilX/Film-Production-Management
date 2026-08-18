'use client';

import React, { useState, useEffect } from 'react';
import {
  Shirt,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Upload,
  User,
  Info,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { productionsService } from '@/services/productionsService';
import costumesService from '@/services/costumesService';
import { authService } from '@/services/authService';
import type { Costume, CostumeAssignment, Character, CastCrew } from '@/app/types';

export default function CostumesModule() {
  const { user } = useAuthStore();
  const selectedProduction = useProductionStore((state) => state.selectedProduction);

  // Lists & Data
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [assignments, setAssignments] = useState<CostumeAssignment[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [castCrewList, setCastCrewList] = useState<CastCrew[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'assignments'>('catalog');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');

  // Modals state
  const [costumeModalOpen, setCostumeModalOpen] = useState(false);
  const [selectedCostume, setSelectedCostume] = useState<Costume | null>(null);
  const [costumeForm, setCostumeForm] = useState({
    name: '',
    category: '',
    description: '',
    size: '',
    imageUrl: '',
    quantity: 1,
    condition: 'New' as Costume['condition'],
  });

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    targetType: 'character' as 'character' | 'user',
    characterId: '',
    userId: '',
    quantity: 1,
    conditionAtAssignment: 'Good',
    notes: '',
  });

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<CostumeAssignment | null>(null);
  const [returnForm, setReturnForm] = useState({
    quantity: 1,
    conditionAtReturn: 'Good',
    notes: '',
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailCostume, setDetailCostume] = useState<Costume | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Permission Checks
  const canCreate = user?.permissions?.includes('costumes.create') || false;
  const canUpdate = user?.permissions?.includes('costumes.update') || false;
  const canDelete = user?.permissions?.includes('costumes.delete') || false;

  // Clear state when production changes
  useEffect(() => {
    setCostumes([]);
    setAssignments([]);
    setCharacters([]);
    setCastCrewList([]);
    setCategories([]);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (selectedProduction) {
      fetchData();
    }
  }, [selectedProduction]);

  const fetchData = async () => {
    if (!selectedProduction) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [costumesData, assignmentsData, charsData, castCrewData] = await Promise.all([
        costumesService.getCostumes(selectedProduction._id),
        costumesService.getAssignments(selectedProduction._id),
        productionsService.getCharacters(selectedProduction._id),
        productionsService.getCastCrew(selectedProduction._id),
      ]);

      setCostumes(costumesData);
      setAssignments(assignmentsData);
      setCharacters(charsData);
      setCastCrewList(castCrewData);

      // Extract unique categories for filter
      const uniqueCats = Array.from(new Set(costumesData.map((c) => c.category))).filter(Boolean);
      setCategories(uniqueCats);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(formatError(err, 'Failed to retrieve costumes and assets data.'));
    } finally {
      setLoading(false);
    }
  };

  const formatError = (err: any, defaultMsg: string): string => {
    if (err.response?.status === 403) {
      return "You don't have permission to perform this action.";
    }
    return err.response?.data?.message || err.message || defaultMsg;
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Upload costume image handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file exceeds the 5MB size limit.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await authService.uploadOnboardingFile(file, 'costume');
      setCostumeForm((prev) => ({ ...prev, imageUrl: res.fileUrl }));
      triggerSuccess('Image uploaded successfully.');
    } catch (err: any) {
      setErrorMsg(formatError(err, 'Failed to upload image file.'));
    } finally {
      setIsUploading(false);
    }
  };

  // --- CRUD Handlers ---
  const openCreateModal = () => {
    setSelectedCostume(null);
    setCostumeForm({
      name: '',
      category: '',
      description: '',
      size: '',
      imageUrl: '',
      quantity: 1,
      condition: 'New',
    });
    setCostumeModalOpen(true);
  };

  const openEditModal = (c: Costume) => {
    setSelectedCostume(c);
    setCostumeForm({
      name: c.name,
      category: c.category,
      description: c.description || '',
      size: c.size || '',
      imageUrl: c.imageUrl || '',
      quantity: c.quantity,
      condition: c.condition,
    });
    setCostumeModalOpen(true);
  };

  const handleSaveCostume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    if (!costumeForm.name.trim() || !costumeForm.category.trim()) {
      setErrorMsg('Name and Category are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (selectedCostume) {
        // Update
        await costumesService.updateCostume(selectedProduction._id, selectedCostume._id, costumeForm);
        triggerSuccess(`Costume "${costumeForm.name}" updated successfully.`);
      } else {
        // Create
        await costumesService.createCostume(selectedProduction._id, costumeForm);
        triggerSuccess(`Costume "${costumeForm.name}" added to catalog.`);
      }
      setCostumeModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(formatError(err, 'Failed to save costume asset.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCostume = async (costumeId: string, costumeName: string) => {
    if (!selectedProduction) return;
    if (!confirm(`Are you sure you want to delete "${costumeName}" from inventory?`)) return;

    setErrorMsg(null);
    try {
      await costumesService.deleteCostume(selectedProduction._id, costumeId);
      triggerSuccess('Costume asset deleted successfully.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(formatError(err, 'Failed to delete costume.'));
    }
  };

  // --- Assignment Handlers ---
  const openAssignModal = (c: Costume) => {
    setSelectedCostume(c);
    setAssignForm({
      targetType: 'character',
      characterId: characters[0]?._id || '',
      userId: castCrewList[0]?.userId?._id || '',
      quantity: 1,
      conditionAtAssignment: c.condition,
      notes: '',
    });
    setAssignModalOpen(true);
  };

  const handleAssignCostume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction || !selectedCostume) return;

    const payload: any = {
      quantity: Number(assignForm.quantity),
      conditionAtAssignment: assignForm.conditionAtAssignment,
      notes: assignForm.notes,
    };

    if (assignForm.targetType === 'character') {
      if (!assignForm.characterId) {
        setErrorMsg('Please select a character.');
        return;
      }
      payload.characterId = assignForm.characterId;
    } else {
      if (!assignForm.userId) {
        setErrorMsg('Please select a cast/crew member.');
        return;
      }
      payload.userId = assignForm.userId;
    }

    if (payload.quantity > selectedCostume.availableQuantity) {
      setErrorMsg(`Cannot assign quantity greater than available stock (${selectedCostume.availableQuantity}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await costumesService.assignCostume(selectedProduction._id, selectedCostume._id, payload);
      triggerSuccess('Wardrobe assignment created successfully.');
      setAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(formatError(err, 'Failed to assign costume.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Return Handlers ---
  const openReturnModal = (assignment: CostumeAssignment) => {
    setSelectedAssignment(assignment);
    setReturnForm({
      quantity: assignment.quantity,
      conditionAtReturn: assignment.conditionAtAssignment,
      notes: '',
    });
    setReturnModalOpen(true);
  };

  const handleReturnCostume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction || !selectedAssignment) return;

    if (returnForm.quantity > selectedAssignment.quantity) {
      setErrorMsg(`Return quantity cannot exceed assigned quantity (${selectedAssignment.quantity}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await costumesService.returnCostume(selectedProduction._id, selectedAssignment._id, {
        quantity: Number(returnForm.quantity),
        conditionAtReturn: returnForm.conditionAtReturn,
        notes: returnForm.notes,
      });
      triggerSuccess('Costume items checked back in successfully.');
      setReturnModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(formatError(err, 'Failed to check in costume items.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Details Modal ---
  const openDetailModal = (c: Costume) => {
    setDetailCostume(c);
    setDetailModalOpen(true);
  };

  // Metrics calculations
  const totalItems = costumes.reduce((sum, c) => sum + c.quantity, 0);
  const availableItems = costumes.reduce((sum, c) => sum + c.availableQuantity, 0);
  const assignedItems = totalItems - availableItems;
  const damagedOrLost = costumes.filter((c) => c.status === 'Damaged' || c.status === 'Lost').length;

  // Catalog Filters
  const filteredCostumes = costumes.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesCondition = conditionFilter === 'All' || c.condition === conditionFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSize = sizeFilter === 'All' || c.size === sizeFilter;
    return matchesSearch && matchesCategory && matchesCondition && matchesStatus && matchesSize;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Shirt className="text-indigo-600 w-6 h-6" /> Costumes & Assets
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage wardrobe assets, assign costumes to characters, track stock checkout status, and log inventory conditions.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start md:self-auto"
          >
            <Plus size={15} /> Add Costume Asset
          </button>
        )}
      </div>

      {/* Success/Error Alerts */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-650 rounded-xl p-4 text-xs font-bold flex items-start gap-3 shadow-3xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="text-red-450 hover:text-red-600 transition">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-755 rounded-xl p-4 text-xs font-bold flex items-start gap-3 shadow-3xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-green-500 mt-0.5" />
          <div className="flex-1 leading-relaxed">{successMsg}</div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-450 hover:text-green-600 transition">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metrics Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Items</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{loading ? '...' : totalItems}</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-green-600">Available Pool</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{loading ? '...' : availableItems}</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-indigo-600">Currently Assigned</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{loading ? '...' : assignedItems}</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-amber-600">Damaged / Lost Types</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{loading ? '...' : damagedOrLost}</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-xs font-extrabold uppercase tracking-wider relative cursor-pointer transition ${
            activeTab === 'catalog' ? 'text-indigo-650' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          Catalog
          {activeTab === 'catalog' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 text-xs font-extrabold uppercase tracking-wider relative cursor-pointer transition ${
            activeTab === 'assignments' ? 'text-indigo-650' : 'text-slate-400 hover:text-slate-650'
          }`}
        >
          Assignments history
          {activeTab === 'assignments' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {loading ? (
        /* Loading Skeleton */
        <div className="space-y-4">
          <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : activeTab === 'catalog' ? (
        /* CATALOG VIEW */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-2xs flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search costumes catalog by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none cursor-pointer focus:border-indigo-650"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Condition</span>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none cursor-pointer focus:border-indigo-650"
              >
                <option value="All">All Conditions</option>
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 outline-none cursor-pointer focus:border-indigo-650"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Damaged">Damaged</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          {filteredCostumes.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <Shirt className="w-12 h-12 text-slate-300 stroke-1" />
              <h3 className="text-sm font-bold text-slate-800">No costume assets found</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Add wardrobe items, set up size and quantities, and verify matching criteria filter checks.
              </p>
            </div>
          ) : (
            /* Costume Grid Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCostumes.map((c) => (
                <div
                  key={c._id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-2xs hover:shadow-xs transition group relative"
                >
                  {/* Costume image preview */}
                  <div className="h-44 bg-slate-50 relative overflow-hidden border-b border-slate-100 flex items-center justify-center">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-103 transition duration-300" />
                    ) : (
                      <Shirt className="w-12 h-12 text-slate-350 stroke-1" />
                    )}

                    {/* Status badge */}
                    <span
                      className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm ${
                        c.status === 'Available'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'Assigned'
                          ? 'bg-indigo-100 text-indigo-700'
                          : c.status === 'Damaged'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h4
                          onClick={() => openDetailModal(c)}
                          className="font-black text-sm text-slate-850 hover:text-indigo-600 transition cursor-pointer"
                        >
                          {c.name}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                          Size: {c.size || 'N/A'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mt-1.5">
                        {c.category}
                      </span>
                      <p className="text-xs text-slate-450 mt-2 line-clamp-2 leading-relaxed">
                        {c.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100 space-y-3 pt-3 border-t border-slate-100 text-xs">
                      {/* Quantities */}
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650">
                        <span>Available / Total</span>
                        <span className="font-bold text-slate-800">
                          {c.availableQuantity} / {c.quantity} items
                        </span>
                      </div>

                      {/* Condition */}
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-650 pt-2">
                        <span>Condition</span>
                        <span
                          className={`font-extrabold ${
                            c.condition === 'New'
                              ? 'text-emerald-600'
                              : c.condition === 'Good'
                              ? 'text-indigo-600'
                              : c.condition === 'Fair'
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {c.condition}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-3 gap-2">
                        <button
                          onClick={() => openDetailModal(c)}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                        >
                          View History
                        </button>

                        <div className="flex gap-2">
                          {canUpdate && (
                            <>
                              <button
                                onClick={() => openEditModal(c)}
                                className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition cursor-pointer"
                                title="Edit Details"
                              >
                                <Edit size={13} />
                              </button>

                              <button
                                onClick={() => openAssignModal(c)}
                                disabled={c.availableQuantity <= 0}
                                className="flex items-center gap-1 py-1.5 px-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 disabled:opacity-50 rounded-xl text-[10px] font-bold cursor-pointer transition shadow-3xs disabled:cursor-not-allowed"
                              >
                                Assign
                              </button>
                            </>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteCostume(c._id, c.name)}
                              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ASSIGNMENTS VIEW */
        <div className="space-y-4">
          {assignments.length === 0 ? (
            /* Empty assignments state */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <Clock className="w-12 h-12 text-slate-350 stroke-1 animate-in spin-in-1" />
              <h3 className="text-sm font-bold text-slate-800">No costume assignments logged</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Assignments track who checked out which costume, when, and checkout condition at checkout / checkin.
              </p>
            </div>
          ) : (
            /* Assignments List Table */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4 font-bold">Costume</th>
                      <th className="py-3 px-4 font-bold">Assigned To</th>
                      <th className="py-3 px-4 font-bold">Qty</th>
                      <th className="py-3 px-4 font-bold">Assigned Date</th>
                      <th className="py-3 px-4 font-bold">Checkout condition</th>
                      <th className="py-3 px-4 font-bold">Checkin condition</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50/30 transition">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            {a.costumeId?.imageUrl ? (
                              <img src={a.costumeId.imageUrl} alt={a.costumeId.name} className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                <Shirt size={13} className="text-slate-400" />
                              </div>
                            )}
                            <span className="font-bold text-slate-800">{a.costumeId?.name || 'Deleted Costume'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium">
                          {a.characterId ? (
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <Sparkles size={11} className="text-indigo-500" /> {a.characterId.name}
                            </span>
                          ) : a.assignedTo ? (
                            <span className="font-bold text-slate-850 flex items-center gap-1">
                              <User size={11} className="text-slate-500" /> {a.assignedTo.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-bold">{a.quantity} items</td>
                        <td className="py-4 px-4 text-slate-550 font-mono text-[10px]">
                          {new Date(a.assignedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`font-semibold ${
                              a.conditionAtAssignment === 'New'
                                ? 'text-emerald-600'
                                : a.conditionAtAssignment === 'Good'
                                ? 'text-indigo-650'
                                : a.conditionAtAssignment === 'Fair'
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }`}
                          >
                            {a.conditionAtAssignment}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {a.conditionAtReturn ? (
                            <span
                              className={`font-semibold ${
                                a.conditionAtReturn === 'New'
                                  ? 'text-emerald-600'
                                  : a.conditionAtReturn === 'Good'
                                  ? 'text-indigo-650'
                                  : a.conditionAtReturn === 'Fair'
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {a.conditionAtReturn}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              a.status === 'Assigned' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {a.status === 'Assigned' && canUpdate ? (
                            <button
                              onClick={() => openReturnModal(a)}
                              className="py-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold rounded-lg text-[10px] cursor-pointer shadow-3xs transition"
                            >
                              Check In
                            </button>
                          ) : a.returnedAt ? (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Returned {new Date(a.returnedAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- ADD / EDIT COSTUME MODAL --- */}
      {costumeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-lg w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">
                {selectedCostume ? 'Edit Costume details' : 'Log Costume Asset'}
              </h3>
              <button onClick={() => setCostumeModalOpen(false)} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCostume} className="space-y-4">
              {/* Image Upload field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Item Image</label>
                <div className="flex gap-4 items-center">
                  <label className="flex-1 border border-dashed border-slate-250 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer transition">
                    {isUploading ? (
                      <RefreshCw className="animate-spin text-indigo-600 w-6 h-6" />
                    ) : (
                      <Upload className="text-slate-400 w-6 h-6" />
                    )}
                    <span className="text-[10px] font-bold text-slate-700">PNG, JPG, WEBP up to 5MB</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" />
                  </label>

                  {costumeForm.imageUrl && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={costumeForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCostumeForm((prev) => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-1 right-1 bg-slate-950/60 hover:bg-red-650 text-white rounded-full p-0.5 transition"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Costume Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juliet Renaissance Dress"
                  value={costumeForm.name}
                  onChange={(e) => setCostumeForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                />
              </div>

              {/* Category & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Period, Sci-Fi"
                    value={costumeForm.category}
                    onChange={(e) => setCostumeForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Size (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. M, L, XL"
                    value={costumeForm.size}
                    onChange={(e) => setCostumeForm((prev) => ({ ...prev, size: e.target.value }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Wardrobe details, material type, style notes, etc..."
                  value={costumeForm.description}
                  onChange={(e) => setCostumeForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
                />
              </div>

              {/* Quantity & Initial Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Stock quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={costumeForm.quantity}
                    onChange={(e) => setCostumeForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Condition *</label>
                  <select
                    value={costumeForm.condition}
                    onChange={(e) => setCostumeForm((prev) => ({ ...prev, condition: e.target.value as any }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCostumeModalOpen(false)}
                  className="py-2 px-4 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ASSIGN COSTUME MODAL --- */}
      {assignModalOpen && selectedCostume && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Assign costume: {selectedCostume.name}</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignCostume} className="space-y-4">
              <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-3.5 flex justify-between items-center text-xs font-medium text-slate-650">
                <span>Available checkout quantity:</span>
                <span className="font-extrabold text-slate-900">{selectedCostume.availableQuantity} items</span>
              </div>

              {/* Target Selector type (XOR) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Assign To</label>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setAssignForm((prev) => ({ ...prev, targetType: 'character' }))}
                    className={`flex-1 py-2 font-bold cursor-pointer transition ${
                      assignForm.targetType === 'character' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-655'
                    }`}
                  >
                    Character
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignForm((prev) => ({ ...prev, targetType: 'user' }))}
                    className={`flex-1 py-2 font-bold cursor-pointer transition ${
                      assignForm.targetType === 'user' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-655'
                    }`}
                  >
                    Cast/Crew member
                  </button>
                </div>
              </div>

              {/* Target character select */}
              {assignForm.targetType === 'character' ? (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Character *</label>
                  <select
                    value={assignForm.characterId}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, characterId: e.target.value }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 cursor-pointer"
                  >
                    <option value="">Select Character</option>
                    {characters.map((char) => (
                      <option key={char._id} value={char._id}>
                        {char.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Target user select */
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Cast / Crew Member *</label>
                  <select
                    value={assignForm.userId}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, userId: e.target.value }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-655 text-slate-900 cursor-pointer"
                  >
                    <option value="">Select Member</option>
                    {castCrewList
                      .filter((cc) => cc.userId)
                      .map((cc) => (
                        <option key={cc.userId._id} value={cc.userId._id}>
                          {cc.userId.name} ({cc.roleInProduction})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Quantity & Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Quantity to assign</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedCostume.availableQuantity}
                    value={assignForm.quantity}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Condition *</label>
                  <select
                    value={assignForm.conditionAtAssignment}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, conditionAtAssignment: e.target.value }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Assignment Notes</label>
                <textarea
                  placeholder="Scene number, specific fit notes, or checkout details..."
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="py-2 px-4 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Checking Out...' : 'Check Out Costume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RETURN COSTUME MODAL --- */}
      {returnModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Check In: {selectedAssignment.costumeId?.name}</h3>
              <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnCostume} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-xs font-medium text-indigo-900">
                Checking back in items checked out to{' '}
                <span className="font-black">
                  {selectedAssignment.characterId?.name || selectedAssignment.assignedTo?.name || 'Cast'}
                </span>
                . (Total checkout: {selectedAssignment.quantity} items)
              </div>

              {/* Quantity & Return Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Quantity to Return</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedAssignment.quantity}
                    value={returnForm.quantity}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Return Condition *</label>
                  <select
                    value={returnForm.conditionAtReturn}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, conditionAtReturn: e.target.value }))}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Checkin Notes</label>
                <textarea
                  placeholder="Deterioration reports, wash instructions, or status logs..."
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="py-2 px-4 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Checking In...' : 'Confirm Check In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAIL & HISTORY MODAL --- */}
      {detailModalOpen && detailCostume && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-2xl w-full space-y-6 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">{detailCostume.name}</h3>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mt-1">
                  {detailCostume.category}
                </span>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Image and details */}
              <div className="md:col-span-1 space-y-4">
                <div className="h-40 bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden flex items-center justify-center">
                  {detailCostume.imageUrl ? (
                    <img src={detailCostume.imageUrl} alt={detailCostume.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shirt className="w-12 h-12 text-slate-300 stroke-1" />
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-medium">Size</span>
                    <span className="font-extrabold text-slate-800">{detailCostume.size || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-medium">Condition</span>
                    <span className="font-extrabold text-slate-800">{detailCostume.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-medium">Status</span>
                    <span className="font-extrabold text-slate-800">{detailCostume.status}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 mt-2">
                    <span className="text-slate-450 font-medium">Total Quantity</span>
                    <span className="font-black text-slate-900">{detailCostume.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450 font-medium">Available</span>
                    <span className="font-black text-slate-900">{detailCostume.availableQuantity}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Descriptions & history */}
              <div className="md:col-span-2 space-y-5">
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 border border-slate-150/60 rounded-xl p-3.5">
                    {detailCostume.description || 'No description logged.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={12} className="text-indigo-500" /> Assignment History Log
                  </h4>

                  {assignments.filter((a) => a.costumeId?._id === detailCostume._id).length === 0 ? (
                    <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 font-medium">
                      No assignments registered for this asset.
                    </div>
                  ) : (
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {assignments
                        .filter((a) => a.costumeId?._id === detailCostume._id)
                        .map((a) => (
                          <div key={a._id} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50/40 transition">
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                {a.characterId ? (
                                  <span>{a.characterId.name}</span>
                                ) : (
                                  <span>{a.assignedTo?.name || 'Cast'}</span>
                                )}
                                <span
                                  className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.25 rounded ${
                                    a.status === 'Assigned' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-650'
                                  }`}
                                >
                                  {a.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
                                Assigned: {new Date(a.assignedAt).toLocaleDateString()}
                                {a.returnedAt && ` • Returned: ${new Date(a.returnedAt).toLocaleDateString()}`}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="font-bold text-slate-800 block">{a.quantity} qty</span>
                              <span className="text-[10px] text-slate-450 block font-medium">Cond: {a.conditionAtAssignment}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
