'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { Shield, Plus } from 'lucide-react';
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setPermLoading(true);
      const data = await adminService.getPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
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
    <div className="max-w-none w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-500" />
            System Settings (RBAC)
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Configure roles, granular permissions, and control access levels across the system.
          </p>
        </div>

        {activeTab === 'roles' && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-900/20 transition"
          >
            <Plus className="w-5 h-5" />
            Create Role
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-4 px-2 font-semibold text-sm border-b-2 transition ${
            activeTab === 'matrix'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Permission Matrix (Grid View)
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-4 px-2 font-semibold text-sm border-b-2 transition ${
            activeTab === 'roles'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          System Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-4 px-2 font-semibold text-sm border-b-2 transition ${
            activeTab === 'permissions'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
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
  );
}
