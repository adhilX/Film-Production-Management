"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './components/auth-context';
import { PermissionGuard } from './components/permission-guard';
import { 
  Production, 
  LocationBooking, 
  FundRequest, 
  AuditLog, 
  User as SystemUser,
  Character,
  CastCrew
} from './types';
import { 
  Film, 
  MapPin, 
  DollarSign, 
  Users, 
  FileLock2, 
  LogOut, 
  RefreshCw, 
  Plus, 
  Calendar,
  AlertTriangle,
  Check,
  X,
  UserCheck,
  ClipboardList,
  Shirt,
  Info
} from 'lucide-react';

export default function DashboardHome() {
  const router = useRouter();
  const { user, token, loading, login, logout, refreshStatus, hasPermission } = useAuth();

  // Authentication form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Core data states
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'funds' | 'onboarding' | 'audit' | 'cast' | 'inventory'>('overview');

  // Module data states
  const [locations, setLocations] = useState<LocationBooking[]>([]);
  const [funds, setFunds] = useState<FundRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [castCrewList, setCastCrewList] = useState<CastCrew[]>([]);

  // Action/Form states
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocStart, setNewLocStart] = useState('');
  const [newLocEnd, setNewLocEnd] = useState('');
  const [newLocError, setNewLocError] = useState('');
  const [newLocSuccess, setNewLocSuccess] = useState('');
  
  const [newFundAmount, setNewFundAmount] = useState('');
  const [newFundJustify, setNewFundJustify] = useState('');
  const [newFundError, setNewFundError] = useState('');
  
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  
  const [assignUser, setAssignUser] = useState('');
  const [assignRole, setAssignRole] = useState('');
  const [assignChar, setAssignChar] = useState('');

  // Costumes Mock Data (for Suppliers)
  const [costumes, setCostumes] = useState([
    { _id: '1', name: 'Victorian Suit', category: 'Period', size: 'L', quantity: 3 },
    { _id: '2', name: 'Spacesuit V2', category: 'Sci-Fi', size: 'M', quantity: 2 },
    { _id: '3', name: 'Medieval Gown', category: 'Fantasy', size: 'S', quantity: 5 },
  ]);
  const [newCostumeName, setNewCostumeName] = useState('');
  const [newCostumeCategory, setNewCostumeCategory] = useState('');
  const [newCostumeSize, setNewCostumeSize] = useState('');
  const [newCostumeQty, setNewCostumeQty] = useState('');

  // Refresh status loop check
  const [refreshing, setRefreshing] = useState(false);

  // Redirect to /login if unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Fetch initial productions
  useEffect(() => {
    if (user && token && user.status === 'Approved') {
      fetchProductions();
    }
  }, [user, token]);

  // Fetch production-specific data when selected production changes
  useEffect(() => {
    if (selectedProduction && token) {
      fetchLocations();
      fetchFunds();
      fetchCharacters();
      fetchCastCrew();
      if (hasPermission('users.approve')) {
        fetchSystemUsers();
      }
      if (hasPermission('audit_logs.view')) {
        fetchAuditLogs();
      }
    }
  }, [selectedProduction, token]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      login(data.access_token, data.user);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshStatus();
    setRefreshing(false);
  };

  // API Call: Fetch Productions
  const fetchProductions = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/productions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProductions(data);
        if (data.length > 0 && !selectedProduction) {
          setSelectedProduction(data[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching productions:', e);
    }
  };

  // API Call: Create Production
  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/productions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newProdTitle, description: newProdDesc }),
      });
      if (res.ok) {
        setNewProdTitle('');
        setNewProdDesc('');
        fetchProductions();
      }
    } catch (e) {
      console.error('Error creating production:', e);
    }
  };

  // API Call: Fetch Locations
  const fetchLocations = async () => {
    if (!selectedProduction) return;
    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (e) {
      console.error('Error fetching locations:', e);
    }
  };

  // API Call: Create Location Booking
  const handleBookLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewLocError('');
    setNewLocSuccess('');
    if (!selectedProduction) return;

    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productionId: selectedProduction._id,
          name: newLocName,
          address: newLocAddress,
          startDate: newLocStart,
          endDate: newLocEnd,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      setNewLocSuccess(`Requested location booking for "${newLocName}" successfully.`);
      setNewLocName('');
      setNewLocAddress('');
      setNewLocStart('');
      setNewLocEnd('');
      fetchLocations();
    } catch (err: any) {
      setNewLocError(err.message);
    }
  };

  // API Call: Transition Location Booking Status (Conflict Guarded)
  const handleUpdateLocationStatus = async (locId: string, status: string) => {
    if (!selectedProduction) return;
    setNewLocError('');
    setNewLocSuccess('');
    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/locations/${locId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update location status');
      }
      setNewLocSuccess(`Location booking status successfully set to "${status}".`);
      fetchLocations();
      if (hasPermission('audit_logs.view')) {
        fetchAuditLogs();
      }
    } catch (err: any) {
      setNewLocError(err.message);
    }
  };

  // API Call: Fetch Funds
  const fetchFunds = async () => {
    if (!selectedProduction) return;
    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/funds`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFunds(data);
      }
    } catch (e) {
      console.error('Error fetching fund requests:', e);
    }
  };

  // API Call: Submit Fund Request
  const handleSubmitFundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewFundError('');
    if (!selectedProduction) return;

    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/funds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(newFundAmount),
          justification: newFundJustify,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit fund request');
      }

      setNewFundAmount('');
      setNewFundJustify('');
      fetchFunds();
    } catch (err: any) {
      setNewFundError(err.message);
    }
  };

  // API Call: Update Fund request status (Approved/Rejected)
  const handleUpdateFundStatus = async (fundId: string, status: string) => {
    if (!selectedProduction) return;
    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/funds/${fundId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchFunds();
        if (hasPermission('audit_logs.view')) {
          fetchAuditLogs();
        }
      }
    } catch (e) {
      console.error('Error updating fund status:', e);
    }
  };

  // API Call: Fetch Characters
  const fetchCharacters = async () => {
    if (!selectedProduction) return;
    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/characters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCharacters(data);
      }
    } catch (e) {
      console.error('Error fetching characters:', e);
    }
  };

  // API Call: Create Character
  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCharName, description: newCharDesc }),
      });
      if (res.ok) {
        setNewCharName('');
        setNewCharDesc('');
        fetchCharacters();
      }
    } catch (e) {
      console.error('Error creating character:', e);
    }
  };

  // API Call: Fetch Cast Crew list
  const fetchCastCrew = async () => {
    if (!selectedProduction) return;
    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/cast-crew`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCastCrewList(data);
      }
    } catch (e) {
      console.error('Error fetching cast/crew:', e);
    }
  };

  // API Call: Assign Cast Crew mapping
  const handleAssignCastCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduction) return;
    try {
      const res = await fetch(`http://localhost:3001/api/productions/${selectedProduction._id}/cast-crew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: assignUser,
          roleInProduction: assignRole,
          characterId: assignChar || undefined,
        }),
      });
      if (res.ok) {
        setAssignUser('');
        setAssignRole('');
        setAssignChar('');
        fetchCastCrew();
        fetchCharacters();
      }
    } catch (e) {
      console.error('Error mapping cast/crew:', e);
    }
  };

  // API Call: Fetch System Users (Onboarding queue)
  const fetchSystemUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSystemUsers(data);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  // API Call: Transition user onboarding status & systemRole (Admin/Manager/User)
  const handleUpdateOnboarding = async (targetUserId: string, status: string, systemRole?: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/users/${targetUserId}/onboard`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, systemRole }),
      });
      if (res.ok) {
        fetchSystemUsers();
      }
    } catch (e) {
      console.error('Error updating onboarding status:', e);
    }
  };

  // API Call: Fetch Compliance Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    }
  };

  // Handle Costume Inventory addition (Supplier mockup)
  const handleAddCostume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostumeName || !newCostumeSize || !newCostumeQty) return;
    const costume = {
      _id: String(costumes.length + 1),
      name: newCostumeName,
      category: newCostumeCategory || 'Modern',
      size: newCostumeSize,
      quantity: Number(newCostumeQty),
    };
    setCostumes(prev => [...prev, costume]);
    setNewCostumeName('');
    setNewCostumeCategory('');
    setNewCostumeSize('');
    setNewCostumeQty('');
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <RefreshCw className="animate-spin text-purple-500 mb-4" size={40} />
        <p className="text-sm font-medium text-slate-400">Loading system context...</p>
      </div>
    );
  }

  // --- UNAUTHENTICATED REDIRECT ---
  if (!user) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <RefreshCw className="animate-spin text-purple-500 mb-4" size={40} />
        <p className="text-sm font-medium text-slate-400">Redirecting to login...</p>
      </div>
    );
  }

  // --- LOGGED IN: PENDING REVIEW OR REJECTED (ONBOARDING TIMELINE SCREEN) ---
  if (user.status !== 'Approved') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-slate-100 items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
              Onboarding Review Status
            </h1>
            <p className="text-sm text-slate-400">
              Welcome, {user.name}. Your profile registration is under evaluation.
            </p>
          </div>

          {/* Stepper showing Draft -> Pending -> UnderReview -> Approved/Rejected */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 space-y-6">
            <div className="relative flex justify-between items-center">
              <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-800 -z-10"></div>
              
              {['Draft', 'Pending', 'UnderReview', 'Approved'].map((s, idx) => {
                const isRejected = user.status === 'Rejected' && s === 'Approved';
                const statusName = isRejected ? 'Rejected' : s;
                
                const isCurrent = user.status === s || (user.status === 'Rejected' && s === 'Approved');
                const isPassed = ['Draft', 'Pending', 'UnderReview', 'Approved', 'Rejected'].indexOf(user.status) >= idx;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs transition-all duration-300 ${
                        isCurrent 
                          ? isRejected 
                            ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                            : 'bg-purple-950 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                          : isPassed 
                          ? 'bg-purple-950 border-purple-800 text-purple-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 font-semibold ${isCurrent ? isRejected ? 'text-red-400' : 'text-purple-400' : 'text-slate-500'}`}>
                      {statusName === 'UnderReview' ? 'Under Review' : statusName}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-950/60 p-4 border border-slate-800 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Type</span>
                <span className="font-semibold text-purple-400">{user.contractorType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Application State</span>
                <span className={`font-semibold ${user.status === 'Rejected' ? 'text-red-400' : 'text-purple-400'}`}>{user.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Access</span>
                <span className="font-semibold text-slate-400">Locked (Awaiting Approval)</span>
              </div>
            </div>

            {user.status === 'Rejected' && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs leading-5">
                <AlertTriangle size={16} className="inline mr-2 text-red-500 align-text-bottom" />
                Your onboarding submission has been rejected. This occurs when credentials or rates do not match production parameters. Contact a supervisor.
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white font-semibold text-sm transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Check Approval Status
            </button>
            <button
              onClick={logout}
              className="py-2.5 px-4 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-lg text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGGED IN & APPROVED: DASHBOARD WORKSPACE ---
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Logo / Production Selector */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Film size={24} />
              <span className="font-extrabold text-lg text-slate-100 uppercase tracking-wider">Film Board</span>
            </div>
            
            {/* Production dropdown */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Selected Project</label>
              {productions.length > 0 ? (
                <select
                  value={selectedProduction?._id || ''}
                  onChange={(e) => {
                    const prod = productions.find(p => p._id === e.target.value);
                    if (prod) setSelectedProduction(prod);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                >
                  {productions.map((p) => (
                    <option key={p._id} value={p._id}>{p.title}</option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  No active productions
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <ClipboardList size={14} /> Project Overview
            </button>

            {/* Costumes link (For Suppliers) */}
            {user.contractorType === 'Supplier' && (
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'inventory' ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Shirt size={14} /> Costumes & Assets
              </button>
            )}

            {/* Cast Character Schedules link (For Cast) */}
            {user.contractorType === 'Cast' && (
              <button 
                onClick={() => setActiveTab('cast')}
                className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'cast' ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Users size={14} /> Cast Assignments
              </button>
            )}

            <button 
              onClick={() => setActiveTab('locations')}
              className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeTab === 'locations' ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <MapPin size={14} /> Location Bookings
            </button>

            <button 
              onClick={() => setActiveTab('funds')}
              className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeTab === 'funds' ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <DollarSign size={14} /> Budget & Funds
            </button>

            <PermissionGuard permission="users.approve">
              <button 
                onClick={() => setActiveTab('onboarding')}
                className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'onboarding' ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <UserCheck size={14} /> Onboarding Queue
              </button>
            </PermissionGuard>

            <PermissionGuard permission="audit_logs.view">
              <button 
                onClick={() => setActiveTab('audit')}
                className={`w-full text-left py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'audit' ? 'bg-purple-950/20 text-purple-400 border border-purple-900/40' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <FileLock2 size={14} /> Compliance Logs
              </button>
            </PermissionGuard>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
          <div className="flex flex-col bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
            <span className="font-semibold text-xs text-slate-100">{user.name}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
              {user.contractorType} • {user.systemRole}
            </span>
          </div>
          <button 
            onClick={logout}
            className="w-full py-2 px-3 bg-red-950/10 border border-red-900/20 hover:bg-red-950/20 rounded-lg text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        
        {/* --- TAB: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Project Overview</h2>
                <p className="text-xs text-slate-400 mt-1">Management metrics for active productions.</p>
              </div>
              <PermissionGuard permission="productions.create">
                <form onSubmit={handleCreateProduction} className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    placeholder="New Production Title"
                    value={newProdTitle}
                    onChange={(e) => setNewProdTitle(e.target.value)}
                    required
                    className="bg-slate-900 border border-slate-850 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button 
                    type="submit"
                    className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                  >
                    <Plus size={14} /> Create
                  </button>
                </form>
              </PermissionGuard>
            </div>

            {selectedProduction ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Production Stats Card */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Production Metadata</h3>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-500 block">Title</span>
                      <span className="font-semibold text-slate-200 text-sm">{selectedProduction.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Description</span>
                      <span className="text-slate-300 block leading-relaxed">{selectedProduction.description || 'No description provided.'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status</span>
                      <span className="inline-block mt-1 py-0.5 px-2 bg-purple-950/40 border border-purple-800 text-purple-300 rounded text-[10px] font-semibold">
                        {selectedProduction.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cast Crew Members */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 md:col-span-2">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Assigned Cast & Crew</h3>
                    <span className="text-[10px] text-slate-400">{castCrewList.length} total mapped</span>
                  </div>

                  {castCrewList.length > 0 ? (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 text-xs">
                      {castCrewList.map((cc) => (
                        <div key={cc._id} className="flex justify-between items-center p-2.5 bg-slate-950/40 border border-slate-850 rounded-lg">
                          <div>
                            <span className="font-semibold text-slate-200">{cc.userId?.name}</span>
                            <span className="text-slate-500 block text-[10px]">{cc.userId?.email} ({cc.userId?.contractorType})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-300 block">{cc.roleInProduction}</span>
                            {cc.characterId && (
                              <span className="text-[10px] text-purple-400 font-medium">Plays: {cc.characterId.name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-6">No cast or crew assigned yet.</div>
                  )}

                  {/* Quick Crew Mapper */}
                  <PermissionGuard permission="productions.create">
                    <form onSubmit={handleAssignCastCrew} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-850">
                      <select
                        value={assignUser}
                        onChange={(e) => setAssignUser(e.target.value)}
                        required
                        className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select User...</option>
                        {systemUsers.filter(u => u.isActive && !castCrewList.some(cc => cc.userId?._id === u._id)).map((u: any) => (
                          <option key={u._id} value={u._id}>{u.name} ({u.contractorType})</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Role in Production"
                        value={assignRole}
                        onChange={(e) => setAssignRole(e.target.value)}
                        required
                        className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                      />
                      <select
                        value={assignChar}
                        onChange={(e) => setAssignChar(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                      >
                        <option value="">No character role...</option>
                        {characters.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <button 
                        type="submit"
                        className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold cursor-pointer text-center"
                      >
                        Assign
                      </button>
                    </form>
                  </PermissionGuard>
                </div>

                {/* Script Characters (Document 5 Section 8) */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 md:col-span-3">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Script Characters</h3>
                    <span className="text-[10px] text-slate-400">{characters.length} characters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {characters.length > 0 ? (
                      characters.map((char) => (
                        <div key={char._id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                          <h4 className="font-semibold text-sm text-purple-300">{char.name}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{char.description || 'No description.'}</p>
                          <div className="border-t border-slate-900 pt-2 text-[10px]">
                            <span className="text-slate-500 block">Assigned Actors:</span>
                            <span className="text-slate-300 block truncate font-medium">
                              {char.assignments && char.assignments.length > 0
                                ? (char.assignments as any[]).map(a => a.name).join(', ')
                                : 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 text-center py-6 col-span-3">No script characters mapped yet.</div>
                    )}
                  </div>

                  <PermissionGuard permission="productions.create">
                    <form onSubmit={handleCreateCharacter} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-850">
                      <input 
                        type="text" 
                        placeholder="Character Name"
                        value={newCharName}
                        onChange={(e) => setNewCharName(e.target.value)}
                        required
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                      />
                      <input 
                        type="text" 
                        placeholder="Description (e.g. Lead protagonist, age 30s)"
                        value={newCharDesc}
                        onChange={(e) => setNewCharDesc(e.target.value)}
                        className="flex-2 bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-purple-500"
                      />
                      <button 
                        type="submit"
                        className="py-1.5 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold cursor-pointer"
                      >
                        Create Character
                      </button>
                    </form>
                  </PermissionGuard>
                </div>

              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-4">
                <Film size={40} className="mx-auto text-purple-500/50" />
                <p className="text-sm">You are not assigned to any active film productions yet.</p>
                <p className="text-xs text-slate-500">Ask your system administrator or project manager to assign you to a project.</p>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: LOCATIONS BOOKINGS (With Collision visual indicator!) --- */}
        {activeTab === 'locations' && selectedProduction && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Location Booking Calendar</h2>
              <p className="text-xs text-slate-400 mt-1">Schedule conflicts are dynamically checked on booking state transitions.</p>
            </div>

            {newLocError && (
              <div className="p-3.5 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs font-semibold leading-relaxed">
                <AlertTriangle size={14} className="inline mr-2 text-red-500" />
                {newLocError}
              </div>
            )}

            {newLocSuccess && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-semibold">
                <Check size={14} className="inline mr-2 text-emerald-500" />
                {newLocSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Active Bookings List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Scheduled Locations</h3>
                
                {locations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {locations.map((loc) => {
                      const startStr = new Date(loc.startDate).toLocaleDateString();
                      const endStr = new Date(loc.endDate).toLocaleDateString();
                      
                      // Check client-side for overlap warning (visual collision check!)
                      const hasVisualOverlap = locations.some(other => 
                        other._id !== loc._id &&
                        other.name === loc.name &&
                        other.status === 'Booked' &&
                        new Date(other.startDate) < new Date(loc.endDate) &&
                        new Date(other.endDate) > new Date(loc.startDate)
                      );

                      return (
                        <div key={loc._id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3 relative">
                          {hasVisualOverlap && loc.status !== 'Booked' && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 py-0.5 px-2 bg-amber-950/40 border border-amber-900 text-amber-400 rounded text-[9px] font-semibold">
                              <AlertTriangle size={10} /> Schedule Collision Warning
                            </div>
                          )}

                          <div>
                            <span className="font-semibold text-slate-200 block text-sm">{loc.name}</span>
                            <span className="text-[10px] text-slate-500 block">{loc.address}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 py-1.5 px-3 rounded-lg border border-slate-850">
                            <Calendar size={12} className="text-purple-400" />
                            <span>{startStr} — {endStr}</span>
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-850 pt-3">
                            <span className={`py-0.5 px-2 rounded text-[10px] font-semibold ${
                              loc.status === 'Booked' 
                                ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' 
                                : loc.status === 'Completed' 
                                ? 'bg-indigo-950 border border-indigo-800 text-indigo-400' 
                                : 'bg-slate-950 border border-slate-800 text-slate-400'
                            }`}>
                              {loc.status}
                            </span>

                            {/* Gated approval options */}
                            <PermissionGuard permission="locations.approve">
                              <div className="flex gap-1.5">
                                {loc.status !== 'Booked' && loc.status !== 'Completed' && (
                                  <button
                                    onClick={() => handleUpdateLocationStatus(loc._id, 'Booked')}
                                    className="py-1 px-2.5 bg-emerald-700/20 hover:bg-emerald-700/30 border border-emerald-700/40 rounded text-[10px] font-semibold text-emerald-400 cursor-pointer"
                                  >
                                    Book
                                  </button>
                                )}
                                {loc.status !== 'Completed' && (
                                  <button
                                    onClick={() => handleUpdateLocationStatus(loc._id, 'Completed')}
                                    className="py-1 px-2.5 bg-indigo-700/20 hover:bg-indigo-700/30 border border-indigo-700/40 rounded text-[10px] font-semibold text-indigo-400 cursor-pointer"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </PermissionGuard>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-12 bg-slate-900/20 border border-slate-800 rounded-xl">
                    No locations scheduled.
                  </div>
                )}
              </div>

              {/* Book location form */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Request Booking</h3>
                
                <form onSubmit={handleBookLocation} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Stage B"
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address / Set Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Studio Lot 4, Burbank"
                      value={newLocAddress}
                      onChange={(e) => setNewLocAddress(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filming Start Date</label>
                    <input 
                      type="date" 
                      value={newLocStart}
                      onChange={(e) => setNewLocStart(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filming End Date</label>
                    <input 
                      type="date" 
                      value={newLocEnd}
                      onChange={(e) => setNewLocEnd(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold transition-all cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                  >
                    Submit Booking Request
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB: BUDGET & FUNDS --- */}
        {activeTab === 'funds' && selectedProduction && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Budget & Fund Requests</h2>
              <p className="text-xs text-slate-400 mt-1">Submit budget requests for equipment, costumes, or operations. Gated by managers.</p>
            </div>

            {newFundError && (
              <div className="p-3.5 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs font-semibold leading-relaxed">
                <AlertTriangle size={14} className="inline mr-2 text-red-500" />
                {newFundError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Requests history */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Fund Request History</h3>
                
                {funds.length > 0 ? (
                  <div className="space-y-3">
                    {funds.map((f) => (
                      <div key={f._id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-lg text-emerald-400">${f.amount.toLocaleString()}</span>
                            <span className={`text-[10px] font-semibold py-0.5 px-2 border rounded ${
                              f.status === 'Approved'
                                ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400'
                                : f.status === 'Rejected'
                                ? 'bg-red-950/30 border-red-900 text-red-400'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}>
                              {f.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{f.justification}</p>
                          <span className="text-[10px] text-slate-500 mt-1.5 block">Requested by: {f.requestedBy?.name || 'Unknown'} ({f.requestedBy?.email})</span>
                        </div>

                        <PermissionGuard permission="funds.approve">
                          {f.status === 'Pending' && (
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => handleUpdateFundStatus(f._id, 'Approved')}
                                className="flex-1 sm:flex-none py-1 px-3 bg-emerald-700/20 hover:bg-emerald-700/30 border border-emerald-700/40 rounded text-xs font-semibold text-emerald-450 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateFundStatus(f._id, 'Rejected')}
                                className="flex-1 sm:flex-none py-1 px-3 bg-red-700/20 hover:bg-red-700/30 border border-red-700/40 rounded text-xs font-semibold text-red-450 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </PermissionGuard>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-12 bg-slate-900/20 border border-slate-800 rounded-xl">
                    No fund requests found.
                  </div>
                )}
              </div>

              {/* Submit request form */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Submit Request</h3>
                
                <form onSubmit={handleSubmitFundRequest} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request Amount (USD)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 5000"
                      value={newFundAmount}
                      onChange={(e) => setNewFundAmount(e.target.value)}
                      required
                      min={0}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Justification / Operational Cost</label>
                    <textarea 
                      placeholder="Explain what these funds are required for..."
                      value={newFundJustify}
                      onChange={(e) => setNewFundJustify(e.target.value)}
                      required
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200 resize-none"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold transition-all cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                  >
                    Submit Fund Request
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB: ONBOARDING REVIEW QUEUE (Admin/Manager) --- */}
        {activeTab === 'onboarding' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Onboarding Queue</h2>
              <p className="text-xs text-slate-400 mt-1">Review onboarding applications, activate contractor accounts, and assign system roles.</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Pending Applications</h3>

              {systemUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-350">
                    <thead className="bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Contractor Classification</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions / System Role Assignment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {systemUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-950/20">
                          <td className="py-3 px-4 font-semibold text-slate-200">{u.name}</td>
                          <td className="py-3 px-4">{u.email}</td>
                          <td className="py-3 px-4 text-purple-400 font-semibold">{u.contractorType}</td>
                          <td className="py-3 px-4">
                            <span className={`py-0.5 px-1.5 border rounded text-[10px] font-semibold ${
                              u.status === 'Approved'
                                ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400'
                                : u.status === 'Rejected'
                                ? 'bg-red-950/30 border-red-900 text-red-400'
                                : 'bg-slate-950 border-slate-850 text-slate-450'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 items-center justify-center">
                              {u.status !== 'Approved' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateOnboarding(u._id!, 'Approved', 'User')}
                                    className="py-1 px-2.5 bg-emerald-700/20 hover:bg-emerald-700/30 border border-emerald-700/40 rounded text-[10px] font-semibold text-emerald-400 cursor-pointer"
                                  >
                                    Approve as User
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOnboarding(u._id!, 'Approved', 'Manager')}
                                    className="py-1 px-2.5 bg-purple-700/20 hover:bg-purple-700/30 border border-purple-700/40 rounded text-[10px] font-semibold text-purple-400 cursor-pointer"
                                  >
                                    Approve as Manager
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOnboarding(u._id!, 'Rejected')}
                                    className="py-1 px-2.5 bg-red-700/20 hover:bg-red-700/30 border border-red-700/40 rounded text-[10px] font-semibold text-red-450 cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {u.status === 'Approved' && (
                                <span className="text-[10px] text-slate-500 font-medium">Activated ({u.systemRole})</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-6">No onboarding requests.</div>
              )}

            </div>
          </div>
        )}

        {/* --- TAB: COMPLIANCE AUDIT LOGS (Admin only) --- */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Compliance Audit Logs</h2>
              <p className="text-xs text-slate-400 mt-1">Read-only transaction history logs of all resource state changes.</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <FileLock2 size={16} /> Audit Trail
              </h3>

              {auditLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-350">
                    <thead className="bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Operator</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Resource Type</th>
                        <th className="py-3 px-4">State Transition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {auditLogs.map((log) => {
                        const dateStr = new Date(log.timestamp).toLocaleString();
                        return (
                          <tr key={log._id} className="hover:bg-slate-950/20">
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{dateStr}</td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-200 block">{log.userId?.name}</span>
                              <span className="text-[10px] text-slate-500 block">{log.userId?.email}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-purple-400">{log.action}</td>
                            <td className="py-3 px-4">{log.resourceType}</td>
                            <td className="py-3 px-4">
                              <span className="text-slate-400">{log.previousState}</span>
                              <span className="mx-2 text-slate-600">➔</span>
                              <span className="text-emerald-450 font-semibold">{log.newState}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-6">No audit trails recorded yet.</div>
              )}

            </div>
          </div>
        )}

        {/* --- TAB: SUPPLIER COSTUMES & ASSETS PANEL (Supplier only) --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Costumes & Assets Inventory</h2>
              <p className="text-xs text-slate-400 mt-1">Manage physical costume listings, period catalogs, and item sizes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Costumes table list */}
              <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Itemized costumes catalog</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-350">
                    <thead className="bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Stock Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {costumes.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-950/20">
                          <td className="py-3 px-4 font-semibold text-slate-200">{c.name}</td>
                          <td className="py-3 px-4 text-purple-400 font-semibold">{c.category}</td>
                          <td className="py-3 px-4 font-mono">{c.size}</td>
                          <td className="py-3 px-4 text-slate-250 font-semibold">{c.quantity} items</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Costume Form */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Log Costume Asset</h3>
                
                <form onSubmit={handleAddCostume} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Costume Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Roman Armor Suit"
                      value={newCostumeName}
                      onChange={(e) => setNewCostumeName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Period, Fantasy, Modern"
                      value={newCostumeCategory}
                      onChange={(e) => setNewCostumeCategory(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Size</label>
                    <input 
                      type="text" 
                      placeholder="e.g. S, M, L, XL"
                      value={newCostumeSize}
                      onChange={(e) => setNewCostumeSize(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quantity</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 5"
                      value={newCostumeQty}
                      onChange={(e) => setNewCostumeQty(e.target.value)}
                      required
                      min={1}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-purple-500 text-slate-200"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-semibold cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                  >
                    Add Costume Asset
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB: CAST ROLES & ASSIGNMENTS PANEL (Cast only) --- */}
        {activeTab === 'cast' && selectedProduction && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Cast Roles & Assignments</h2>
              <p className="text-xs text-slate-400 mt-1">Review your assigned characters and production tasks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* My character roles */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info size={16} /> My Characters
                </h3>

                {castCrewList.filter(cc => cc.userId?._id === user.id && cc.characterId).length > 0 ? (
                  <div className="space-y-4">
                    {castCrewList.filter(cc => cc.userId?._id === user.id && cc.characterId).map((cc) => (
                      <div key={cc._id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Character Name</span>
                        <h4 className="font-bold text-base text-purple-300">{cc.characterId?.name}</h4>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block pt-2">Description</span>
                        <p className="text-xs text-slate-355 leading-relaxed">{cc.characterId?.description || 'No script details provided.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-10 bg-slate-950/20 border border-slate-850 rounded-xl">
                    You have not been mapped to any script characters yet. Ask the casting manager.
                  </div>
                )}
              </div>

              {/* Schedule listing */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={16} /> Shoot Schedule Overview
                </h3>

                {locations.filter(l => l.status === 'Booked').length > 0 ? (
                  <div className="space-y-3">
                    {locations.filter(l => l.status === 'Booked').map((loc) => {
                      const start = new Date(loc.startDate).toLocaleDateString();
                      const end = new Date(loc.endDate).toLocaleDateString();
                      return (
                        <div key={loc._id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <span className="font-semibold text-slate-200 block">{loc.name}</span>
                            <span className="text-[10px] text-slate-500 block">{loc.address}</span>
                          </div>
                          <span className="text-purple-400 font-semibold">{start} — {end}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-10 bg-slate-950/20 border border-slate-850 rounded-xl">
                    No booked shoot schedules on locations.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
