import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import { productionsService } from '@/services/productionsService';
import { costumeService } from '../services/costume.service';
import { authService } from '@/services/authService';
import { formatError } from '@/utils/format-error';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import type { Costume, CostumeAssignment, Character, CastCrew } from '@/app/types';

export function useCostumes() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
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
  const [costumeErrors, setCostumeErrors] = useState<Record<string, string>>({});

  // Costume Form Validation Logic
  const validateCostumeForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedProduction) {
      setErrorMsg('Please select a project before saving.');
      return false;
    }

    // Name Validation
    if (!costumeForm.name.trim()) {
      errors.name = 'Costume name is required.';
    } else if (costumeForm.name.trim().length < 2) {
      errors.name = 'Costume name must be at least 2 characters.';
    } else if (costumeForm.name.length > 100) {
      errors.name = 'Costume name cannot exceed 100 characters.';
    }

    // Category Validation
    if (!costumeForm.category.trim()) {
      errors.category = 'Category is required.';
    } else if (costumeForm.category.trim().length < 2) {
      errors.category = 'Category must be at least 2 characters.';
    } else if (costumeForm.category.length > 50) {
      errors.category = 'Category cannot exceed 50 characters.';
    }

    // Size Validation
    if (costumeForm.size && costumeForm.size.length > 20) {
      errors.size = 'Size cannot exceed 20 characters.';
    }

    // Description Validation
    if (costumeForm.description && costumeForm.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    // Quantity Validation
    if (costumeForm.quantity === undefined || costumeForm.quantity === null || isNaN(costumeForm.quantity)) {
      errors.quantity = 'Quantity is required.';
    } else if (costumeForm.quantity < 1) {
      errors.quantity = 'Quantity must be at least 1.';
    } else if (selectedCostume) {
      const assignedCount = selectedCostume.quantity - selectedCostume.availableQuantity;
      if (costumeForm.quantity < assignedCount) {
        errors.quantity = `Quantity cannot be less than currently assigned items (${assignedCount}).`;
      }
    }

    setCostumeErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErrorMsg('Please resolve form validation errors before saving.');
      return false;
    }
    return true;
  };

  // Permission Checks
  const canCreate = hasPermission(PERMISSIONS.COSTUMES_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.COSTUMES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.COSTUMES_DELETE);

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
        costumeService.getCostumes(selectedProduction._id),
        costumeService.getAssignments(selectedProduction._id),
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
      const errMsg = formatError(err, 'Failed to retrieve costumes and assets data.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    toast.success(msg);
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
      const errMsg = formatError(err, 'Failed to upload image file.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // --- CRUD Handlers ---
  const openCreateModal = () => {
    setSelectedCostume(null);
    setCostumeErrors({});
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
    setCostumeErrors({});
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
    if (!validateCostumeForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (selectedCostume) {
        // Update
        await costumeService.updateCostume(selectedProduction._id, selectedCostume._id, costumeForm);
        triggerSuccess(`Costume "${costumeForm.name}" updated successfully.`);
      } else {
        // Create
        await costumeService.createCostume(selectedProduction._id, costumeForm);
        triggerSuccess(`Costume "${costumeForm.name}" added to catalog.`);
      }
      setCostumeModalOpen(false);
      fetchData();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to save costume asset.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCostume = async (costumeId: string, costumeName: string) => {
    if (!selectedProduction) return;
    if (!confirm(`Are you sure you want to delete "${costumeName}" from inventory?`)) return;

    setErrorMsg(null);
    try {
      await costumeService.deleteCostume(selectedProduction._id, costumeId);
      triggerSuccess('Costume asset deleted successfully.');
      fetchData();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to delete costume.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
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
      await costumeService.assignCostume(selectedProduction._id, selectedCostume._id, payload);
      triggerSuccess('Wardrobe assignment created successfully.');
      setAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to assign costume.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
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
      await costumeService.returnCostume(selectedProduction._id, selectedAssignment._id, {
        quantity: Number(returnForm.quantity),
        conditionAtReturn: returnForm.conditionAtReturn,
        notes: returnForm.notes,
      });
      triggerSuccess('Costume items checked back in successfully.');
      setReturnModalOpen(false);
      fetchData();
    } catch (err: any) {
      const errMsg = formatError(err, 'Failed to check in costume items.');
      setErrorMsg(errMsg);
      toast.error(errMsg);
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

  return {
    user,
    selectedProduction,
    costumes,
    assignments,
    characters,
    castCrewList,
    categories,
    loading,
    activeTab,
    setActiveTab,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    conditionFilter,
    setConditionFilter,
    statusFilter,
    setStatusFilter,
    sizeFilter,
    setSizeFilter,
    costumeModalOpen,
    setCostumeModalOpen,
    selectedCostume,
    setSelectedCostume,
    costumeForm,
    setCostumeForm,
    costumeErrors,
    setCostumeErrors,
    assignModalOpen,
    setAssignModalOpen,
    assignForm,
    setAssignForm,
    returnModalOpen,
    setReturnModalOpen,
    selectedAssignment,
    setSelectedAssignment,
    returnForm,
    setReturnForm,
    detailModalOpen,
    setDetailModalOpen,
    detailCostume,
    setDetailCostume,
    isSubmitting,
    isUploading,
    fetchData,
    handleImageUpload,
    openCreateModal,
    openEditModal,
    handleSaveCostume,
    handleDeleteCostume,
    openAssignModal,
    handleAssignCostume,
    openReturnModal,
    handleReturnCostume,
    openDetailModal,
    canCreate,
    canUpdate,
    canDelete,
    filteredCostumes,
    totalItems,
    availableItems,
    assignedItems,
    damagedOrLost,
  };
}

export default useCostumes;
