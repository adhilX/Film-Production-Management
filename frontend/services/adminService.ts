import { axiosClient } from '@/lib/axios';

export const adminService = {
  // Roles
  async getRoles(): Promise<any[]> {
    const res = await axiosClient.get<any[]>('/admin/roles');
    return res.data;
  },
  async createRole(payload: { name: string; permissions: string[] }): Promise<any> {
    const res = await axiosClient.post<any>('/admin/roles', payload);
    return res.data;
  },
  async updateRole(id: string, payload: { permissions: string[] }): Promise<any> {
    const res = await axiosClient.patch<any>(`/admin/roles/${id}`, payload);
    return res.data;
  },

  // Permissions
  async getPermissions(): Promise<any[]> {
    const res = await axiosClient.get<any[]>('/admin/permissions');
    return res.data;
  },
  async createPermission(payload: { name: string; description?: string; group: string }): Promise<any> {
    const res = await axiosClient.post<any>('/admin/permissions', payload);
    return res.data;
  },

  // Applications/Approvals
  async getApplications(params?: {
    page?: number;
    limit?: number;
    search?: string;
    contractorType?: string;
    department?: string;
    onboardingStatus?: string;
    stale?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ applications: any[]; total: number; page: number; pages: number; limit: number; metrics: any }> {
    const res = await axiosClient.get<{ applications: any[]; total: number; page: number; pages: number; limit: number; metrics: any }>('/admin/applications', {
      params
    });
    return res.data;
  },
  async getApplication(id: string): Promise<any> {
    const res = await axiosClient.get<any>(`/admin/applications/${id}`);
    return res.data;
  },
  async evaluateApplication(
    id: string,
    payload: { status: 'approved' | 'changes-requested'; systemRoleId?: string; adminFeedback?: string }
  ): Promise<any> {
    const res = await axiosClient.patch<any>(`/admin/applications/${id}/evaluate`, payload);
    return res.data;
  },

  // User Management
  async getUsers(page = 1, limit = 10, search = ''): Promise<{ users: any[]; total: number; page: number; pages: number; limit: number }> {
    const res = await axiosClient.get<{ users: any[]; total: number; page: number; pages: number; limit: number }>('/users', {
      params: { page, limit, search }
    });
    return res.data;
  },
  async createUser(payload: any): Promise<any> {
    const res = await axiosClient.post<any>('/admin/users', payload);
    return res.data;
  },
  async updateUser(id: string, payload: any): Promise<any> {
    const res = await axiosClient.patch<any>(`/admin/users/${id}`, payload);
    return res.data;
  },


  // Audit Logs
  async getAuditLogs(): Promise<any[]> {
    const res = await axiosClient.get<any[]>('/audit-logs');
    return res.data;
  },
};
export default adminService;
