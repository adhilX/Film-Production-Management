import { apiClient } from '@/services/api/api-client';
import type { Costume, CostumeAssignment } from '@/app/types';

export const costumeService = {
  async getCostumes(
    productionId: string,
    params?: { status?: string; category?: string; condition?: string; search?: string },
  ): Promise<Costume[]> {
    const res = await apiClient.get<Costume[]>(`/productions/${productionId}/costumes`, { params });
    return res.data;
  },

  async getCostume(productionId: string, costumeId: string): Promise<Costume> {
    const res = await apiClient.get<Costume>(`/productions/${productionId}/costumes/${costumeId}`);
    return res.data;
  },

  async createCostume(productionId: string, payload: Partial<Costume>): Promise<Costume> {
    const res = await apiClient.post<Costume>(`/productions/${productionId}/costumes`, payload);
    return res.data;
  },

  async updateCostume(productionId: string, costumeId: string, payload: Partial<Costume>): Promise<Costume> {
    const res = await apiClient.patch<Costume>(`/productions/${productionId}/costumes/${costumeId}`, payload);
    return res.data;
  },

  async deleteCostume(productionId: string, costumeId: string): Promise<void> {
    await apiClient.delete(`/productions/${productionId}/costumes/${costumeId}`);
  },

  async getAssignments(productionId: string): Promise<CostumeAssignment[]> {
    const res = await apiClient.get<CostumeAssignment[]>(`/productions/${productionId}/costumes/assignments`);
    return res.data;
  },

  async assignCostume(
    productionId: string,
    costumeId: string,
    payload: { characterId?: string; userId?: string; quantity: number; conditionAtAssignment: string; notes?: string },
  ): Promise<CostumeAssignment> {
    const res = await apiClient.post<CostumeAssignment>(
      `/productions/${productionId}/costumes/${costumeId}/assign`,
      payload,
    );
    return res.data;
  },

  async returnCostume(
    productionId: string,
    assignmentId: string,
    payload: { quantity?: number; conditionAtReturn: string; notes?: string },
  ): Promise<CostumeAssignment> {
    const res = await apiClient.patch<CostumeAssignment>(
      `/productions/${productionId}/costumes/assignments/${assignmentId}/return`,
      payload,
    );
    return res.data;
  },
};

export default costumeService;
