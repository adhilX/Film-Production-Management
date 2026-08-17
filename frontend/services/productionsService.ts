import { axiosClient } from '@/lib/axios';
import type { Production, LocationBooking, FundRequest, Character, CastCrew } from '@/app/types';

export const productionsService = {
  // Productions
  async getProductions(): Promise<Production[]> {
    const res = await axiosClient.get<Production[]>('/productions');
    return res.data;
  },
  async createProduction(payload: { title: string; description: string }): Promise<Production> {
    const res = await axiosClient.post<Production>('/productions', payload);
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
  async updateFundStatus(productionId: string, fundId: string, status: string): Promise<FundRequest> {
    const res = await axiosClient.patch<FundRequest>(`/productions/${productionId}/funds/${fundId}/status`, { status });
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

  // Cast & Crew
  async getCastCrew(productionId: string): Promise<CastCrew[]> {
    const res = await axiosClient.get<CastCrew[]>(`/productions/${productionId}/cast-crew`);
    return res.data;
  },
  async assignCastCrew(productionId: string, payload: { userId: string; roleInProduction: string; characterId?: string }): Promise<CastCrew> {
    const res = await axiosClient.post<CastCrew>(`/productions/${productionId}/cast-crew`, payload);
    return res.data;
  },
};

export default productionsService;
