'use client';

import { useEffect, useState } from 'react';
import { axiosClient as api } from '@/lib/axios';
import { Shield, Plus, Edit2, ShieldCheck, ShieldAlert } from 'lucide-react';
import RoleEditModal from '@/app/components/admin/RoleEditModal';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/roles');
      setRoles(res.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-500" />
            System Settings (RBAC)
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Manage Roles and configure the granular Permission Matrix across all domains.
          </p>
        </div>
        
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-900/20 transition"
        >
          <Plus className="w-5 h-5" />
          Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 h-64 animate-pulse flex flex-col items-center justify-center gap-4">
               <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ))
        ) : (
          roles.map((role) => {
            const isAdmin = role.name === 'Admin';
            const isManager = role.name.includes('Manager');
            
            return (
              <div key={role._id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-amber-500/30 transition group flex flex-col">
                <div className={`p-6 border-b border-slate-800 ${isAdmin ? 'bg-red-950/10' : isManager ? 'bg-blue-950/10' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-red-500/20 text-red-400' : isManager ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                        {isAdmin ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">{role.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">{role.permissions?.length || 0} Permissions</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleEdit(role)}
                      className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition"
                      title="Edit Permission Matrix"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-950/20 flex-1">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Granted Permissions</h4>
                  {role.permissions && role.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.slice(0, 8).map((perm: string) => (
                        <span key={perm} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
                          {perm}
                        </span>
                      ))}
                      {role.permissions.length > 8 && (
                        <span className="px-2 py-1 bg-amber-950/30 text-amber-500 rounded text-[10px] font-mono border border-amber-900/50">
                          +{role.permissions.length - 8} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic">No explicit permissions granted.</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <RoleEditModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={selectedRole}
        onSave={fetchRoles}
      />
    </div>
  );
}
