import { apiClient } from '@/services/api/api-client';
import type { Production } from '@/app/types';

export interface GetProductionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  genre?: string;
  productionManager?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetProductionsResponse {
  productions: Production[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export const projectService = {
  async getProductions(params?: GetProductionsParams): Promise<any> {
    const res = await apiClient.get<any>('/productions', { params });
    return res.data;
  },

  async createProduction(payload: Partial<Production>): Promise<Production> {
    const res = await apiClient.post<Production>('/productions', payload);
    return res.data;
  },

  async updateProduction(productionId: string, payload: Partial<Production>): Promise<Production> {
    const res = await apiClient.patch<Production>(`/productions/${productionId}`, payload);
    return res.data;
  },

  async getEligibleManagers(): Promise<any[]> {
    const res = await apiClient.get<any[]>('/productions/managers');
    return res.data;
  },
};

export default projectService;
