import { apiClient } from '@/services/api/api-client';
import type { User } from '@/app/types';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  contractorType?: string;
  systemRoleId?: string;
  status?: string;
  onboardingStatus?: string;
  isActive?: boolean;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export const userService = {
  async getUsers(
    pageOrParams?: number | GetUsersParams,
    limit?: number,
    search?: string
  ): Promise<GetUsersResponse> {
    let params: any = {};
    if (typeof pageOrParams === 'object' && pageOrParams !== null) {
      params = pageOrParams;
    } else {
      if (pageOrParams !== undefined) params.page = pageOrParams;
      if (limit !== undefined) params.limit = limit;
      if (search !== undefined) params.search = search;
    }
    const res = await apiClient.get<GetUsersResponse>('/users', { params });
    return res.data;
  },

  async getUser(id: string): Promise<User> {
    const res = await apiClient.get<User>(`/users/${id}`);
    return res.data;
  },

  async createUser(payload: Partial<User>): Promise<User> {
    const res = await apiClient.post<User>('/admin/users', payload);
    return res.data;
  },

  async updateUser(id: string, payload: Partial<User>): Promise<User> {
    const res = await apiClient.patch<User>(`/admin/users/${id}`, payload);
    return res.data;
  },
};

export default userService;
