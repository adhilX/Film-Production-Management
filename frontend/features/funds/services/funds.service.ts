import { apiClient } from '@/services/api/api-client';
import type { Budget, FundRequest } from '@/app/types';

export const fundsService = {
  async getBudget(productionId: string): Promise<Budget> {
    const res = await apiClient.get<Budget>(`/productions/${productionId}/funds/budget`);
    return res.data;
  },

  async updateBudget(
    productionId: string,
    payload: { totalBudget: number; currency?: string },
  ): Promise<Budget> {
    const res = await apiClient.patch<Budget>(
      `/productions/${productionId}/funds/budget`,
      payload,
    );
    return res.data;
  },

  async getFundRequests(productionId: string): Promise<FundRequest[]> {
    const res = await apiClient.get<FundRequest[]>(
      `/productions/${productionId}/funds/requests`,
    );
    return res.data;
  },

  async getFundRequest(productionId: string, requestId: string): Promise<FundRequest> {
    const res = await apiClient.get<FundRequest>(
      `/productions/${productionId}/funds/requests/${requestId}`,
    );
    return res.data;
  },

  async createFundRequest(
    productionId: string,
    payload: { title: string; description: string; category: string; requestedAmount: number },
  ): Promise<FundRequest> {
    const res = await apiClient.post<FundRequest>(
      `/productions/${productionId}/funds/requests`,
      payload,
    );
    return res.data;
  },

  async updateFundRequest(
    productionId: string,
    requestId: string,
    payload: { title?: string; description?: string; category?: string; requestedAmount?: number },
  ): Promise<FundRequest> {
    const res = await apiClient.patch<FundRequest>(
      `/productions/${productionId}/funds/requests/${requestId}`,
      payload,
    );
    return res.data;
  },

  async approveFundRequest(
    productionId: string,
    requestId: string,
    payload: { approvedAmount: number },
  ): Promise<FundRequest> {
    const res = await apiClient.patch<FundRequest>(
      `/productions/${productionId}/funds/requests/${requestId}/approve`,
      payload,
    );
    return res.data;
  },

  async rejectFundRequest(
    productionId: string,
    requestId: string,
    payload: { rejectionReason: string },
  ): Promise<FundRequest> {
    const res = await apiClient.patch<FundRequest>(
      `/productions/${productionId}/funds/requests/${requestId}/reject`,
      payload,
    );
    return res.data;
  },

  async cancelFundRequest(productionId: string, requestId: string): Promise<FundRequest> {
    const res = await apiClient.patch<FundRequest>(
      `/productions/${productionId}/funds/requests/${requestId}/cancel`,
    );
    return res.data;
  },
};

export default fundsService;
