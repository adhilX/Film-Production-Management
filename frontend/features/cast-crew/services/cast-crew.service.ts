import { apiClient } from '@/services/api/api-client';
import type { Character, CastCrew } from '@/app/types';

export const castCrewService = {
  // Characters
  async getCharacters(productionId: string): Promise<Character[]> {
    const res = await apiClient.get<Character[]>(`/productions/${productionId}/characters`);
    return res.data;
  },

  async createCharacter(productionId: string, payload: { name: string; description: string }): Promise<Character> {
    const res = await apiClient.post<Character>(`/productions/${productionId}/characters`, payload);
    return res.data;
  },

  async updateCharacter(productionId: string, characterId: string, payload: { name?: string; description?: string }): Promise<Character> {
    const res = await apiClient.patch<Character>(`/productions/${productionId}/characters/${characterId}`, payload);
    return res.data;
  },

  async deleteCharacter(productionId: string, characterId: string): Promise<void> {
    await apiClient.delete(`/productions/${productionId}/characters/${characterId}`);
  },

  // Cast & Crew
  async getCastCrew(productionId: string): Promise<CastCrew[]> {
    const res = await apiClient.get<CastCrew[]>(`/productions/${productionId}/cast-crew`);
    return res.data;
  },

  async assignCastCrew(
    productionId: string,
    payload: { userId: string; roleInProduction: string; characterId?: string }
  ): Promise<CastCrew> {
    const res = await apiClient.post<CastCrew>(`/productions/${productionId}/cast-crew`, payload);
    return res.data;
  },

  async updateCastCrew(
    productionId: string,
    castCrewId: string,
    payload: { roleInProduction?: string; characterId?: string | null }
  ): Promise<CastCrew> {
    const res = await apiClient.patch<CastCrew>(`/productions/${productionId}/cast-crew/${castCrewId}`, payload);
    return res.data;
  },

  async removeCastCrew(productionId: string, castCrewId: string): Promise<void> {
    await apiClient.delete(`/productions/${productionId}/cast-crew/${castCrewId}`);
  },

  async getEligibleCast(productionId: string): Promise<any[]> {
    const res = await apiClient.get<any[]>(`/productions/${productionId}/eligible-cast`);
    return res.data;
  },

  async getEligibleCrew(productionId: string): Promise<any[]> {
    const res = await apiClient.get<any[]>(`/productions/${productionId}/eligible-crew`);
    return res.data;
  },
};

export default castCrewService;
