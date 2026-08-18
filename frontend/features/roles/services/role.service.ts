import { apiClient } from '@/services/api/api-client';
import type { Role } from '@/app/types';

export interface CreateRolePayload {
  name: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  permissions: string[];
}

export interface CreatePermissionPayload {
  name: string;
  description?: string;
  group: string;
}

export const roleService = {
  async getRoles(): Promise<Role[]> {
    const res = await apiClient.get<Role[]>('/admin/roles');
    return res.data;
  },

  async createRole(payload: CreateRolePayload): Promise<Role> {
    const res = await apiClient.post<Role>('/admin/roles', payload);
    return res.data;
  },

  async updateRole(id: string, payload: UpdateRolePayload): Promise<Role> {
    const res = await apiClient.patch<Role>(`/admin/roles/${id}`, payload);
    return res.data;
  },

  async getPermissions(): Promise<any[]> {
    const res = await apiClient.get<any[]>('/admin/permissions');
    return res.data;
  },

  async createPermission(payload: CreatePermissionPayload): Promise<any> {
    const res = await apiClient.post<any>('/admin/permissions', payload);
    return res.data;
  },
};

export default roleService;
