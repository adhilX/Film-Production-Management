'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Film,
  Plus,
  Edit2,
  Calendar,
  DollarSign,
  Globe,
  Folder,
  User,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import productionsService from '@/services/productionsService';
import { authService } from '@/services/authService';
import type { Production } from '@/app/types';
import Pagination from '@/app/components/Pagination';

export default function ProductionsPage() {
  const user = useAuthStore(state => state.user);
  const productions = useProductionStore(state => state.productions);
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const setProductions = useProductionStore(state => state.setProductions);
  const setSelectedProduction = useProductionStore(state => state.setSelectedProduction);

  // States
  const [loading, setLoading] = useState(true);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Production | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [managerFilter, setManagerFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Active Action Dropdown Row ID
  const [activeRowActions, setActiveRowActions] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Form states
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    genre: string;
    language: string;
    format: string;
    logline: string;
    synopsis: string;
    startDate: string;
    endDate: string;
    budget: number;
    productionManager: string;
    imageUrl?: string | null;
    status: 'Draft' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
  }>({
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
    imageUrl: null,
    status: 'Draft',
  });

  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPermission = (perm: string): boolean => {
    return user?.permissions?.includes(perm) || false;
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle click outside row actions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActiveRowActions(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prods = await productionsService.getProductions();
      setProductions(prods);

      if (hasPermission('productions.create') || hasPermission('productions.update')) {
        const managers = await productionsService.getEligibleManagers();
        setSystemUsers(managers || []);
      }
    } catch (e) {
      console.error('Error fetching productions page data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Relative time
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const now = new Date();
    const updated = new Date(dateStr);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 60) return `${diffMins || 1}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Validations & Image Drag/Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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

    // Trigger Cloudinary Upload immediately
    setIsUploadingImage(true);
    try {
      const response = await authService.uploadOnboardingFile(file, 'projectCover');
      setFormData(prev => ({
        ...prev,
        imageUrl: response.fileUrl
      }));
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to upload project image.');
      setImageFile(null);
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: null
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
    setIsCreateOpen(true);
  };

  const openEditModal = (prod: Production) => {
    setEditingProd(prod);
    const mgrId = typeof prod.productionManager === 'object' && prod.productionManager !== null
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
    setIsEditOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? Number(value) : value
    }));
  };

  const validateForm = (): boolean => {
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setFormError('Start date must be before the end date.');
      return false;
    }
    if (formData.budget < 0) {
      setFormError('Budget cannot be negative.');
      return false;
    }
    if (!formData.productionManager) {
      setFormError('Project Manager is required.');
      return false;
    }
    return true;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = { ...formData };
      const newProd = await productionsService.createProduction(payload);
      setIsCreateOpen(false);
      fetchData();
      if (!selectedProduction) {
        setSelectedProduction(newProd);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create project.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd) return;
    if (!validateForm()) return;
    try {
      const payload = { ...formData };
      const updated = await productionsService.updateProduction(editingProd._id, payload);
      setIsEditOpen(false);
      fetchData();
      if (selectedProduction?._id === editingProd._id) {
        setSelectedProduction(updated);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update project.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Draft': return 'bg-blue-50 text-blue-750 border-blue-100';
      case 'On Hold': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Completed': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getValidTransitions = (status: string) => {
    switch (status) {
      case 'Draft': return ['Active', 'Cancelled'];
      case 'Active': return ['On Hold', 'Completed', 'Cancelled'];
      case 'On Hold': return ['Active', 'Cancelled'];
      default: return [];
    }
  };

  // Dynamic filter arrays
  const uniqueGenres = Array.from(new Set(productions.map(p => p.genre).filter(Boolean)));
  const uniqueManagers = Array.from(
    new Set(
      productions.map(p => {
        if (typeof p.productionManager === 'object' && p.productionManager !== null) {
          return JSON.stringify({ _id: (p.productionManager as any)._id, name: (p.productionManager as any).name });
        }
        return '';
      }).filter(Boolean)
    )
  ).map(str => JSON.parse(str));

  // Determine which managers to show in filter dropdown
  const filterManagers = (user?.permissions?.includes('users.approve') || user?.permissions?.includes('roles.manage'))
    ? systemUsers
    : uniqueManagers;

  // Filter logic
  const filteredProductions = productions.filter(p => {
    const mgrName = typeof p.productionManager === 'object' && p.productionManager !== null
      ? (p.productionManager as any).name || ''
      : '';
    const mgrId = typeof p.productionManager === 'object' && p.productionManager !== null
      ? (p.productionManager as any)._id || ''
      : String(p.productionManager || '');

    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mgrName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesManager = managerFilter === 'All' || mgrId === managerFilter;
    const matchesGenre = genreFilter === 'All' || p.genre === genreFilter;

    return matchesSearch && matchesStatus && matchesManager && matchesGenre;
  });

  // Client-side pagination
  const totalItems = filteredProductions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentProjects = filteredProductions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Metrics
  const metricTotal = productions.length;
  const metricActive = productions.filter(p => p.status === 'Active').length;
  const metricOnHold = productions.filter(p => p.status === 'On Hold').length;
  const metricCompleted = productions.filter(p => p.status === 'Completed').length;

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300 w-full">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Projects</span>
              <span className="text-3xl font-black text-slate-900 leading-none">{loading ? '...' : metricTotal}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Film className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-450 font-semibold mt-4">
            Total configured workflows
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Active</span>
              <span className="text-3xl font-black text-slate-900 leading-none">{loading ? '...' : metricActive}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-450 font-semibold mt-4">
            Currently in production
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">On Hold</span>
              <span className="text-3xl font-black text-slate-900 leading-none">{loading ? '...' : metricOnHold}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-450 font-semibold mt-4">
            Awaiting review or funds
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Completed</span>
              <span className="text-3xl font-black text-slate-900 leading-none">{loading ? '...' : metricCompleted}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Check className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-450 font-semibold mt-4">
            Finished/archived projects
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
        {/* Toolbar header */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full lg:w-64">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-purple-500 text-slate-700"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs select-none">🔍</span>
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-650 font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Manager Dropdown */}
            <select
              value={managerFilter}
              onChange={e => { setManagerFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-650 font-bold focus:outline-none focus:border-purple-500 cursor-pointer max-w-xs"
            >
              <option value="All">All Managers</option>
              {filterManagers.map((mgr) => (
                <option key={mgr._id} value={mgr._id}>{mgr.name}</option>
              ))}
            </select>

            {/* Genre Dropdown */}
            <select
              value={genreFilter}
              onChange={e => { setGenreFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-650 font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All">All Genres</option>
              {uniqueGenres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            {/* Create Project Button */}
            {hasPermission('productions.create') && (
              <button
                onClick={openCreateModal}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs shrink-0 w-full lg:w-auto"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Create Project
              </button>
            )}
          </div>
        </div>

        {/* Responsive Table Body */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-650" />
            <span className="text-xs font-semibold">Loading projects directory...</span>
          </div>
        ) : currentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-100 bg-slate-50/40">
                  <th className="py-3.5 px-5 select-none">Project</th>
                  <th className="py-3.5 px-5 select-none">Project Manager</th>
                  <th className="py-3.5 px-5 select-none">Status</th>
                  <th className="py-3.5 px-5 select-none">Budget</th>
                  <th className="py-3.5 px-5 select-none">Timeline</th>
                  <th className="py-3.5 px-5 select-none">Updated</th>
                  <th className="py-3.5 px-5 select-none text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentProjects.map((proj) => {
                  const isCurrentActive = selectedProduction?._id === proj._id;
                  const mgrName = typeof proj.productionManager === 'object' && proj.productionManager !== null
                    ? (proj.productionManager as any).name
                    : 'Unassigned';
                  const mgrInitial = mgrName.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={proj._id}
                      onClick={() => setSelectedProduction(proj)}
                      className={`hover:bg-slate-50/50 transition cursor-pointer duration-150 ${isCurrentActive ? 'bg-purple-50/100' : ''
                        }`}
                    >
                      {/* Project Cover & Title */}
                      <td className="py-4 px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          {/* Image Poster */}
                          {proj.imageUrl ? (
                            <img
                              src={proj.imageUrl}
                              alt={proj.title}
                              className="w-12 h-16 object-cover rounded-lg shrink-0 border border-slate-200/60 shadow-3xs"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center shrink-0 text-slate-400 text-xs">
                              <span>🎬</span>
                              <span className="text-[7px] text-slate-350 tracking-tighter mt-0.5 font-mono">—</span>
                            </div>
                          )}
                          <div className="leading-tight">
                            <div className="flex items-center gap-1.5">
                              <span className="block text-slate-800 text-xs font-black">{proj.title}</span>
                              {isCurrentActive && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-450 font-semibold block mt-1">
                              {proj.format} · {proj.genre}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Project Manager */}
                      <td className="py-4 px-5 text-slate-655 font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                            {mgrInitial}
                          </div>
                          <span className="truncate max-w-[130px]">{mgrName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-block py-0.5 px-2.5 border rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getStatusColor(proj.status)}`}>
                          {proj.status}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="py-4 px-5 font-extrabold text-slate-700">
                        ${proj.budget?.toLocaleString() || '0'}
                      </td>

                      {/* Timeline */}
                      <td className="py-4 px-5 text-slate-450 font-semibold leading-normal">
                        <div className="flex flex-col">
                          <span>Start: {proj.startDate ? new Date(proj.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                          <span className="text-[10px] mt-0.5">End: {proj.endDate ? new Date(proj.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Updated Relative */}
                      <td className="py-4 px-5 text-slate-450 font-bold">
                        {getRelativeTime(proj.updatedAt || proj.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveRowActions(activeRowActions === proj._id ? null : proj._id)}
                            className="p-1.5 text-slate-450 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeRowActions === proj._id && (
                            <div
                              ref={actionsRef}
                              className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-1 duration-100"
                            >
                              <button
                                onClick={() => {
                                  setSelectedProduction(proj);
                                  setActiveRowActions(null);
                                }}
                                disabled={isCurrentActive}
                                className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition ${isCurrentActive
                                  ? 'text-slate-350 cursor-not-allowed bg-slate-50/30'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                              >
                                <Check className="w-3.5 h-3.5 text-slate-400" /> Set as Active
                              </button>

                              {hasPermission('productions.update') && (
                                <button
                                  onClick={() => {
                                    openEditModal(proj);
                                    setActiveRowActions(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition border-t border-slate-50"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-450" /> Edit Project
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <Film className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No Projects Found</h3>
            <p className="text-xs text-slate-450">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Reusable Pagination Component */}
        {!loading && totalItems > 0 && (
          <Pagination
            page={currentPage}
            pages={totalPages}
            total={totalItems}
            limit={pageSize}
            onPageChange={setCurrentPage}
            onLimitChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            itemName="projects"
          />
        )}
      </div>

      {/* --- CREATE PROJECT MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsCreateOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-600" /> Create Project
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer font-bold text-xs">Close</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-750 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* PROJECT COVER IMAGE SECTION */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Project Cover Image</span>

                {/* Drag and Drop Container */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full min-h-[140px] border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition duration-200 relative ${dragActive ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploadingImage}
                  />

                  {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-500">Uploading cover image to Cloudinary...</span>
                    </div>
                  ) : imagePreview ? (
                    <div className="flex items-center gap-4 w-full px-4">
                      <img src={imagePreview} alt="Preview" className="w-16 h-20 object-cover rounded-lg border border-slate-200 shadow-3xs" />
                      <div className="flex-1 leading-tight min-w-0">
                        <span className="block text-xs font-bold text-slate-800 truncate">{imageFile?.name || 'Uploaded Cover'}</span>
                        <span className="text-[10px] text-emerald-650 font-bold block mt-1">Ready to save</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="p-2 text-rose-650 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Drag and drop your poster, or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-indigo-600 hover:text-indigo-800 transition font-black underline cursor-pointer"
                        >
                          browse files
                        </button>
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">Supports: JPG, JPEG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Budget ($)</label>
                  <input
                    type="number"
                    name="budget"
                    required
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    required
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Format</label>
                  <input
                    type="text"
                    name="format"
                    required
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Language</label>
                  <input
                    type="text"
                    name="language"
                    required
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Project Manager</label>
                  <select
                    name="productionManager"
                    required
                    value={formData.productionManager}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 appearance-none cursor-pointer"
                  >
                    <option value="">Select Manager...</option>
                    {systemUsers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Logline</label>
                <input
                  type="text"
                  name="logline"
                  value={formData.logline}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Synopsis</label>
                <textarea
                  name="synopsis"
                  value={formData.synopsis}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
                />
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-655 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreateSubmit}
                disabled={isUploadingImage}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT PROJECT MODAL --- */}
      {isEditOpen && editingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-600" /> Edit Project: {editingProd.title}
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer font-bold text-xs">Close</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-750 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* PROJECT COVER IMAGE SECTION */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block">Project Cover Image</span>

                {/* Drag and Drop Container */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full min-h-[140px] border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition duration-200 relative ${dragActive ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploadingImage}
                  />

                  {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-500">Uploading cover image to Cloudinary...</span>
                    </div>
                  ) : imagePreview ? (
                    <div className="flex items-center gap-4 w-full px-4">
                      <img src={imagePreview} alt="Preview" className="w-16 h-20 object-cover rounded-lg border border-slate-200 shadow-3xs" />
                      <div className="flex-1 leading-tight min-w-0">
                        <span className="block text-xs font-bold text-slate-800 truncate">{imageFile?.name || 'Current Poster'}</span>
                        <span className="text-[10px] text-emerald-650 font-bold block mt-1">Ready to save</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="p-2 text-rose-650 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Drag and drop your poster, or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-indigo-600 hover:text-indigo-800 transition font-black underline cursor-pointer"
                        >
                          browse files
                        </button>
                      </p>
                      <p className="text-[9px] text-slate-450 mt-1 font-semibold">Supports: JPG, JPEG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Status & Transitions</label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-705 font-bold cursor-pointer"
                  >
                    <option value={editingProd.status}>{editingProd.status} (Current)</option>
                    {getValidTransitions(editingProd.status).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Budget ($)</label>
                  <input
                    type="number"
                    name="budget"
                    required
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    required
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Format</label>
                  <input
                    type="text"
                    name="format"
                    required
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Language</label>
                  <input
                    type="text"
                    name="language"
                    required
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Project Manager</label>
                  <select
                    name="productionManager"
                    required
                    value={formData.productionManager}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-705 cursor-pointer"
                  >
                    {systemUsers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Logline</label>
                <input
                  type="text"
                  name="logline"
                  value={formData.logline}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455">Synopsis</label>
                <textarea
                  name="synopsis"
                  value={formData.synopsis}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-600 text-slate-900 resize-none"
                />
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-655 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleEditSubmit}
                disabled={isUploadingImage}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
