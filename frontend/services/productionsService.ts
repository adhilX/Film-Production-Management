import { axiosClient } from '@/lib/axios';
import type { Production, LocationBooking, FundRequest, Character, CastCrew } from '@/app/types';

export const productionsService = {
  // Productions
  async getProductions(): Promise<Production[]> {
    const res = await axiosClient.get<Production[]>('/productions');
    return res.data;
  },
  async createProduction(payload: Partial<Production>): Promise<Production> {
    const res = await axiosClient.post<Production>('/productions', payload);
    return res.data;
  },
  async updateProduction(productionId: string, payload: Partial<Production>): Promise<Production> {
    const res = await axiosClient.patch<Production>(`/productions/${productionId}`, payload);
    return res.data;
  },


  // Locations
  async getLocations(productionId: string): Promise<LocationBooking[]> {
    const res = await axiosClient.get<LocationBooking[]>(`/productions/${productionId}/locations`);
    return res.data;
  },
  async createLocation(productionId: string, payload: Partial<LocationBooking>): Promise<LocationBooking> {
    const res = await axiosClient.post<LocationBooking>(`/productions/${productionId}/locations`, payload);
    return res.data;
  },
  async updateLocationStatus(productionId: string, locationId: string, status: string): Promise<LocationBooking> {
    const res = await axiosClient.patch<LocationBooking>(`/productions/${productionId}/locations/${locationId}/status`, { status });
    return res.data;
  },

  // Funds
  async getFunds(productionId: string): Promise<FundRequest[]> {
    const res = await axiosClient.get<FundRequest[]>(`/productions/${productionId}/funds`);
    return res.data;
  },
  async createFundRequest(productionId: string, payload: { amount: number; justification: string }): Promise<FundRequest> {
    const res = await axiosClient.post<FundRequest>(`/productions/${productionId}/funds`, payload);
    return res.data;
  },
  async updateFundStatus(productionId: string, fundId: string, status: string, rejectionReason?: string): Promise<FundRequest> {
    const res = await axiosClient.patch<FundRequest>(`/productions/${productionId}/funds/${fundId}/status`, { status, rejectionReason });
    return res.data;
  },

  // Characters
  async getCharacters(productionId: string): Promise<Character[]> {
    const res = await axiosClient.get<Character[]>(`/productions/${productionId}/characters`);
    return res.data;
  },
  async createCharacter(productionId: string, payload: { name: string; description: string }): Promise<Character> {
    const res = await axiosClient.post<Character>(`/productions/${productionId}/characters`, payload);
    return res.data;
  },
  async updateCharacter(productionId: string, characterId: string, payload: { name?: string; description?: string }): Promise<Character> {
    const res = await axiosClient.patch<Character>(`/productions/${productionId}/characters/${characterId}`, payload);
    return res.data;
  },
  async deleteCharacter(productionId: string, characterId: string): Promise<void> {
    await axiosClient.delete(`/productions/${productionId}/characters/${characterId}`);
  },

  // Cast & Crew
  async getCastCrew(productionId: string): Promise<CastCrew[]> {
    const res = await axiosClient.get<CastCrew[]>(`/productions/${productionId}/cast-crew`);
    return res.data;
  },
  async assignCastCrew(productionId: string, payload: { userId: string; roleInProduction: string; characterId?: string }): Promise<CastCrew> {
    const res = await axiosClient.post<CastCrew>(`/productions/${productionId}/cast-crew`, payload);
    return res.data;
  },
  async updateCastCrew(productionId: string, castCrewId: string, payload: { roleInProduction?: string; characterId?: string | null }): Promise<CastCrew> {
    const res = await axiosClient.patch<CastCrew>(`/productions/${productionId}/cast-crew/${castCrewId}`, payload);
    return res.data;
  },
  async removeCastCrew(productionId: string, castCrewId: string): Promise<void> {
    await axiosClient.delete(`/productions/${productionId}/cast-crew/${castCrewId}`);
  },
  async getEligibleCast(productionId: string): Promise<any[]> {
    const res = await axiosClient.get<any[]>(`/productions/${productionId}/eligible-cast`);
    return res.data;
  },
  async getEligibleCrew(productionId: string): Promise<any[]> {
    const res = await axiosClient.get<any[]>(`/productions/${productionId}/eligible-crew`);
    return res.data;
  },
  async getEligibleManagers(): Promise<any[]> {
    const res = await axiosClient.get<any[]>('/productions/managers');
    return res.data;
  },
};

export default productionsService;
