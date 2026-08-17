'use client';

import React, { useEffect, useState } from 'react';
import { Film, Plus, Edit2, Calendar, DollarSign, Globe, Folder, BookOpen, User, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProductionStore } from '@/store/useProductionStore';
import productionsService from '@/services/productionsService';
import type { Production } from '@/app/types';

export default function ProductionsPage() {
  const user = useAuthStore(state => state.user);
  const productions = useProductionStore(state => state.productions);
  const selectedProduction = useProductionStore(state => state.selectedProduction);
  const setProductions = useProductionStore(state => state.setProductions);
  const setSelectedProduction = useProductionStore(state => state.setSelectedProduction);

  const [loading, setLoading] = useState(true);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Production | null>(null);

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
    status: 'Draft',
  });

  const [formError, setFormError] = useState('');

  const hasPermission = (perm: string): boolean => {
    return user?.permissions?.includes(perm) || false;
  };

  useEffect(() => {
    fetchData();
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

  const openCreateModal = () => {
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
      setFormError('Production Manager is required.');
      return false;
    }
    return true;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const newProd = await productionsService.createProduction(formData);
      setIsCreateOpen(false);
      fetchData();
      if (!selectedProduction) {
        setSelectedProduction(newProd);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create production.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd) return;
    if (!validateForm()) return;
    try {
      const updated = await productionsService.updateProduction(editingProd._id, formData);
      setIsEditOpen(false);
      fetchData();
      if (selectedProduction?._id === editingProd._id) {
        setSelectedProduction(updated);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update production.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'Draft': return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'On Hold': return 'bg-orange-50 text-orange-700 border-orange-150';
      case 'Completed': return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-150';
      default: return 'bg-slate-50 text-slate-600 border-slate-150';
    }
  };

  const eligibleManagers = systemUsers;

  const getValidTransitions = (status: string) => {
    switch (status) {
      case 'Draft': return ['Active', 'Cancelled'];
      case 'Active': return ['On Hold', 'Completed', 'Cancelled'];
      case 'On Hold': return ['Active', 'Cancelled'];
      default: return [];
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
      {hasPermission('productions.create') && (
        <div className="flex justify-end">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            Create Production
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl h-64 animate-pulse shadow-xs" />
          ))}
        </div>
      ) : productions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {productions.map((prod) => {
            const isCurrentActive = selectedProduction?._id === prod._id;
            const mgrName = typeof prod.productionManager === 'object' && prod.productionManager !== null
              ? (prod.productionManager as any).name
              : 'Unassigned';

            return (
              <div
                key={prod._id}
                className={`bg-white border rounded-2xl p-6 transition flex flex-col justify-between relative overflow-hidden group shadow-xs ${
                  isCurrentActive ? 'border-indigo-500 shadow-md shadow-indigo-500/5' : 'border-slate-200/80 hover:border-slate-350 hover:shadow-xs'
                }`}
              >
                {/* Active Indicator Badge */}
                {isCurrentActive && (
                  <div className="absolute top-0 right-0 bg-indigo-650 text-white text-[9px] font-extrabold uppercase px-3.5 py-1 rounded-bl-xl shadow flex items-center gap-1">
                    <Check size={10} strokeWidth={3} /> Active Project
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-650 transition pr-24 leading-snug">{prod.title}</h3>
                    <span className={`inline-block border text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 mt-2 rounded-lg ${getStatusColor(prod.status)}`}>
                      {prod.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {prod.logline || prod.description || 'No logline provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-3 text-xs text-slate-655 font-medium">
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{prod.format} • {prod.genre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{prod.language}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">
                        {prod.startDate ? new Date(prod.startDate).toLocaleDateString() : 'N/A'} - {prod.endDate ? new Date(prod.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-700 truncate">
                        Budget: ${prod.budget?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Manager: <strong className="text-slate-705 font-bold">{mgrName}</strong></span>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-6">
                  <button
                    onClick={() => setSelectedProduction(prod)}
                    disabled={isCurrentActive}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-indigo-650 hover:bg-indigo-750 text-white'
                    }`}
                  >
                    Select Project
                  </button>

                  {hasPermission('productions.update') && (
                    <button
                      onClick={() => openEditModal(prod)}
                      className="py-2 px-3.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-450 space-y-4 max-w-2xl mx-auto shadow-xs">
          <Film size={44} className="mx-auto text-indigo-500/40" />
          <h3 className="text-sm font-bold text-slate-800">No Productions Found</h3>
          <p className="text-xs text-slate-450">You are not mapped to any active productions yet.</p>
        </div>
      )}

      {/* --- CREATE PRODUCTION MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsCreateOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-600" /> Create Film Production
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer font-bold text-xs">Close</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-750 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Budget ($)</label>
                  <input
                    type="number"
                    name="budget"
                    required
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    required
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Format</label>
                  <input
                    type="text"
                    name="format"
                    required
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Language</label>
                  <input
                    type="text"
                    name="language"
                    required
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Production Manager</label>
                  <select
                    name="productionManager"
                    required
                    value={formData.productionManager}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 appearance-none cursor-pointer"
                  >
                    <option value="">Select Eligible Manager...</option>
                    {eligibleManagers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Logline</label>
                <input
                  type="text"
                  name="logline"
                  value={formData.logline}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Synopsis</label>
                <textarea
                  name="synopsis"
                  value={formData.synopsis}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 resize-none"
                />
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreateSubmit}
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-755 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCTION MODAL --- */}
      {isEditOpen && editingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsEditOpen(false)} />
          <div className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-600" /> Edit Production: {editingProd.title}
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer font-bold text-xs">Close</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-750 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Status & Transitions</label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-705 font-bold cursor-pointer"
                  >
                    <option value={editingProd.status}>{editingProd.status} (Current)</option>
                    {getValidTransitions(editingProd.status).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Budget ($)</label>
                  <input
                    type="number"
                    name="budget"
                    required
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    required
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Format</label>
                  <input
                    type="text"
                    name="format"
                    required
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Language</label>
                  <input
                    type="text"
                    name="language"
                    required
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Production Manager</label>
                  <select
                    name="productionManager"
                    required
                    value={formData.productionManager}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-705 cursor-pointer"
                  >
                    {eligibleManagers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-455 font-bold">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 cursor-pointer"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Logline</label>
                <input
                  type="text"
                  name="logline"
                  value={formData.logline}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Synopsis</label>
                <textarea
                  name="synopsis"
                  value={formData.synopsis}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-650 text-slate-900 resize-none"
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
                className="px-5 py-2 bg-indigo-650 hover:bg-indigo-755 text-white rounded-xl text-xs font-bold cursor-pointer"
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
