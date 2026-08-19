import { apiClient } from '@/services/api/api-client';
import type { Role, CreateRolePayload, UpdateRolePayload, CreatePermissionPayload } from '@/features/roles/types';

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
