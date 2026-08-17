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
      case 'Active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Draft': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'On Hold': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  // Filter eligible managers (pre-filtered by backend to only return eligible managers)
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent flex items-center gap-3">
            <Film className="w-8 h-8 text-purple-500" />
            Film Productions
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Create, track, and manage details, budgets, schedules, and personnel.
          </p>
        </div>

        {hasPermission('productions.create') && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create Production
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-64 animate-pulse" />
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
                className={`bg-slate-900/40 backdrop-blur-md border rounded-2xl p-6 transition flex flex-col justify-between relative overflow-hidden group ${
                  isCurrentActive ? 'border-purple-500/70 shadow-lg shadow-purple-500/5' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Active Indicator Badge */}
                {isCurrentActive && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-extrabold uppercase px-3.5 py-1 rounded-bl-xl shadow flex items-center gap-1">
                    <Check size={10} strokeWidth={3} /> Active Project
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-purple-400 transition pr-24">{prod.title}</h3>
                      <span className={`inline-block border text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mt-1.5 rounded ${getStatusColor(prod.status)}`}>
                        {prod.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {prod.logline || prod.description || 'No logline provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 border-y border-slate-850 py-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-purple-400" />
                      <span>{prod.format} • {prod.genre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                      <span>{prod.language}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        {prod.startDate ? new Date(prod.startDate).toLocaleDateString() : 'N/A'} - {prod.endDate ? new Date(prod.endDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-semibold text-slate-200">
                        Budget: ${prod.budget?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Manager: <strong className="text-slate-300">{mgrName}</strong></span>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-6">
                  <button
                    onClick={() => setSelectedProduction(prod)}
                    disabled={isCurrentActive}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-purple-950/20 text-purple-400/60 border border-purple-900/30 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    Select Project
                  </button>

                  {hasPermission('productions.update') && (
                    <button
                      onClick={() => openEditModal(prod)}
                      className="py-2 px-3.5 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/10 rounded-xl text-slate-300 hover:text-purple-400 transition cursor-pointer flex items-center gap-1"
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
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-4 max-w-2xl mx-auto">
          <Film size={48} className="mx-auto text-purple-500/40 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-200">No Productions Found</h3>
          <p className="text-sm">You are not mapped to any active productions yet.</p>
        </div>
      )}

      {/* --- CREATE PRODUCTION MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-500" /> Create Film Production
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Close</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Budget ($)</label>
                  <input
                    type="number"
                    name="budget"
                    required
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    required
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Format</label>
                  <input
                    type="text"
                    name="format"
                    required
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Language</label>
                  <input
                    type="text"
                    name="language"
                    required
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Production Manager</label>
                  <select
                    name="productionManager"
                    required
                    value={formData.productionManager}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  >
                    <option value="">Select Eligible Manager...</option>
                    {eligibleManagers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logline</label>
                <input
                  type="text"
                  name="logline"
                  value={formData.logline}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Synopsis</label>
                <textarea
                  name="synopsis"
                  value={formData.synopsis}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-purple-900/25"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PRODUCTION MODAL --- */}
      {isEditOpen && editingProd && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-500" /> Edit Production: {editingProd.title}
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Close</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status & Transitions</label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200 font-semibold"
                  >
                    <option value={editingProd.status}>{editingProd.status} (Current)</option>
                    {getValidTransitions(editingProd.status).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Budget ($)</label>
                  <input
                    type="number"
                    name="budget"
                    required
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Genre</label>
                  <input
                    type="text"
                    name="genre"
                    required
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Format</label>
                  <input
                    type="text"
                    name="format"
                    required
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Language</label>
                  <input
                    type="text"
                    name="language"
                    required
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Production Manager</label>
                  <select
                    name="productionManager"
                    required
                    value={formData.productionManager}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  >
                    {eligibleManagers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-semibold text-slate-400">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logline</label>
                <input
                  type="text"
                  name="logline"
                  value={formData.logline}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Synopsis</label>
                <textarea
                  name="synopsis"
                  value={formData.synopsis}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-purple-900/25"
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
