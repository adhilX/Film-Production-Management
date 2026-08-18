'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { Shield, Plus } from 'lucide-react';
import { PermissionGuard } from '@/app/components/permission-guard';
import RoleEditModal from '@/app/components/admin/RoleEditModal';
import PermissionMatrix from '@/app/components/admin/PermissionMatrix';
import SystemRolesTab from '@/app/components/admin/SystemRolesTab';
import PermissionsTab from '@/app/components/admin/PermissionsTab';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'roles' | 'permissions'>('matrix');
  const [loading, setLoading] = useState(true);
  const [permLoading, setPermLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatError = (err: any, defaultMsg: string): string => {
    if (err.response?.status === 403) {
      return "You don't have permission to perform this action.";
    }
    const message = err.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message || err.message || defaultMsg;
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getRoles();
      setRoles(data);
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      setError(formatError(err, 'Failed to load system roles.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermLoading(true);
      setError(null);
      const data = await adminService.getPermissions();
      setPermissions(data);
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err);
      setError(formatError(err, 'Failed to load permissions list.'));
    } finally {
      setPermLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
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
    <PermissionGuard permission="roles.view">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 lg:px-10 py-8 space-y-6 animate-in fade-in duration-300">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <div className="text-red-750 text-xs font-bold w-full flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="text-[10px] text-red-500 hover:text-red-700 underline font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {activeTab === 'roles' && (
          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" />
              Create Role
            </button>
          </div>
        )}

        {/* Tabs Selector */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-4 px-1 font-bold text-xs border-b-2 transition uppercase tracking-wider ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-450 hover:text-slate-700'
            }`}
          >
            Permission Matrix (Grid View)
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-4 px-1 font-bold text-xs border-b-2 transition uppercase tracking-wider ${
              activeTab === 'roles'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-450 hover:text-slate-700'
            }`}
          >
            System Roles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-4 px-1 font-bold text-xs border-b-2 transition uppercase tracking-wider ${
              activeTab === 'permissions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-450 hover:text-slate-700'
            }`}
          >
            Permissions List ({permissions.length})
          </button>
        </div>

        {/* TAB 1: PERMISSION MATRIX */}
        {activeTab === 'matrix' && (
          <PermissionMatrix
            roles={roles}
            permissions={permissions}
            onRefreshRoles={fetchRoles}
            loading={loading || permLoading}
          />
        )}

        {/* TAB 2: SYSTEM ROLES */}
        {activeTab === 'roles' && (
          <SystemRolesTab
            roles={roles}
            loading={loading}
            onEditRole={handleEdit}
          />
        )}

        {/* TAB 3: PERMISSIONS LIST */}
        {activeTab === 'permissions' && (
          <PermissionsTab
            permissions={permissions}
            roles={roles}
            permLoading={permLoading}
            onRefreshPermissions={fetchPermissions}
          />
        )}

        {/* Role edit/create modal */}
        <RoleEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          role={selectedRole}
          onSave={fetchRoles}
        />
      </div>
    </PermissionGuard>
  );
}
