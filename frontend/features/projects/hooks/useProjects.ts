import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useProductionStore } from '@/store/useProductionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { projectService } from '../services/project.service';
import { authService } from '@/services/authService';
import { projectSchema } from '../validations/project.validation';
import { formatError } from '@/utils/format-error';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';
import type { Production } from '@/app/types';

export function useProjects() {
  const user = useAuthStore((state) => state.user);
  const { hasPermission } = usePermissions();
  const selectedProduction = useProductionStore((state) => state.selectedProduction);
  const setSelectedProduction = useProductionStore((state) => state.setSelectedProduction);

  // Data lists
  const [productions, setProductions] = useState<Production[]>([]);
  const [productionsList, setProductionsList] = useState<Production[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  // Loading and pagination state
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters and Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [managerFilter, setManagerFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Production | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: 'Drama',
    language: 'English',
    format: 'Feature Film',
    logline: '',
    synopsis: '',
    startDate: '',
    endDate: '',
    budget: 0,
    productionManager: '',
    imageUrl: null as string | null,
    status: 'Draft' as 'Draft' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled',
  });

  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Trigger paginated load when state changes
  useEffect(() => {
    fetchTableData();
  }, [currentPage, pageSize, searchQuery, statusFilter, genreFilter, managerFilter, sortBy, sortOrder]);

  // Trigger initial static data load
  useEffect(() => {
    fetchStaticData();
  }, []);



  const fetchStaticData = async () => {
    try {
      const allProdsResponse = await projectService.getProductions();
      setProductions(
        Array.isArray(allProdsResponse)
          ? allProdsResponse
          : allProdsResponse.productions || []
      );

      if (hasPermission('productions.create') || hasPermission('productions.update')) {
        const managers = await projectService.getEligibleManagers();
        setSystemUsers(managers || []);
      }
    } catch (e) {
      console.error('Error fetching static data:', e);
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const res = await projectService.getProductions({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        status: statusFilter === 'All' ? undefined : statusFilter,
        genre: genreFilter === 'All' ? undefined : genreFilter,
        productionManager: managerFilter === 'All' ? undefined : managerFilter,
        sortBy,
        sortOrder,
      });

      const list = Array.isArray(res) ? res : res.productions || [];
      const total = Array.isArray(res) ? res.length : res.total || 0;
      const pagesCount = Array.isArray(res) ? 1 : res.pages || 1;

      setProductionsList(list);
      setTotalItems(total);
      setTotalPages(pagesCount);
    } catch (e) {
      console.error('Error fetching paginated projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchStaticData(), fetchTableData()]);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processImageFile(e.target.files[0]);
    }
  };

  const processImageFile = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Invalid file type. Only JPG, JPEG, PNG, and WEBP are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('File is too large. Maximum size allowed is 5 MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError('');

    setIsUploadingImage(true);
    try {
      const response = await authService.uploadOnboardingFile(file, 'projectCover');
      setFormData((prev) => ({
        ...prev,
        imageUrl: response.fileUrl,
      }));
      toast.success('Cover image uploaded successfully.');
    } catch (err: any) {
      console.error(err);
      setFormError(formatError(err, 'Failed to upload project image.'));
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      imageUrl: null,
    }));
  };

  const openCreateModal = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      title: '',
      description: '',
      genre: 'Drama',
      language: 'English',
      format: 'Feature Film',
      logline: '',
      synopsis: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 100000,
      productionManager: '',
      imageUrl: null,
      status: 'Draft',
    });
    setFormError('');
    setErrors({});
    setIsCreateOpen(true);
  };

  const openEditModal = (prod: Production) => {
    setEditingProd(prod);
    const mgrId =
      typeof prod.productionManager === 'object' && prod.productionManager !== null
        ? (prod.productionManager as any)._id
        : String(prod.productionManager || '');

    setImageFile(null);
    setImagePreview(prod.imageUrl || null);
    setFormData({
      title: prod.title,
      description: prod.description || '',
      genre: prod.genre,
      language: prod.language,
      format: prod.format,
      logline: prod.logline || '',
      synopsis: prod.synopsis || '',
      startDate: prod.startDate ? new Date(prod.startDate).toISOString().split('T')[0] : '',
      endDate: prod.endDate ? new Date(prod.endDate).toISOString().split('T')[0] : '',
      budget: prod.budget,
      productionManager: mgrId,
      imageUrl: prod.imageUrl || null,
      status: prod.status,
    });
    setFormError('');
    setErrors({});
    setIsEditOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'budget' ? (value === '' ? '' : Number(value)) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === 'startDate' || name === 'endDate') {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.startDate;
        delete next.endDate;
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const result = projectSchema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path[0];
      if (path !== undefined && path !== null) {
        newErrors[String(path)] = issue.message;
      }
    });
    setErrors(newErrors);
    return false;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = { ...formData };
      const newProd = await projectService.createProduction(payload);
      setIsCreateOpen(false);
      await fetchData();
      if (!selectedProduction) {
        setSelectedProduction(newProd);
      }
      toast.success('Project created successfully.');
    } catch (err: any) {
      setFormError(formatError(err, 'Failed to create project.'));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd) return;
    if (!validateForm()) return;
    try {
      const payload = { ...formData };
      const updated = await projectService.updateProduction(editingProd._id, payload);
      setIsEditOpen(false);
      await fetchData();
      if (selectedProduction?._id === editingProd._id) {
        setSelectedProduction(updated);
      }
      toast.success('Project updated successfully.');
    } catch (err: any) {
      setFormError(formatError(err, 'Failed to update project.'));
    }
  };

  return {
    user,
    selectedProduction,
    setSelectedProduction,
    productions,
    productionsList,
    systemUsers,
    loading,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    genreFilter,
    setGenreFilter,
    managerFilter,
    setManagerFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    editingProd,
    setEditingProd,
    formData,
    setFormData,
    formError,
    errors,
    dragActive,
    isUploadingImage,
    imageFile,
    imagePreview,
    handleSort,
    handleDrag,
    handleDrop,
    handleFileChange,
    removeImage,
    openCreateModal,
    openEditModal,
    handleInputChange,
    handleCreateSubmit,
    handleEditSubmit,
    fetchData,
  };
}

export default useProjects;
