import { apiClient } from '@/services/api/api-client';

import type { GetApplicationsParams, GetApplicationsResponse, EvaluateApplicationPayload } from '@/features/approvals/types';

export const approvalService = {
  async getApplications(params?: GetApplicationsParams): Promise<GetApplicationsResponse> {
    const res = await apiClient.get<GetApplicationsResponse>('/admin/applications', { params });
    return res.data;
  },

  async getApplication(id: string): Promise<any> {
    const res = await apiClient.get<any>(`/admin/applications/${id}`);
    return res.data;
  },

  async evaluateApplication(id: string, payload: EvaluateApplicationPayload): Promise<any> {
    const res = await apiClient.patch<any>(`/admin/applications/${id}/evaluate`, payload);
    return res.data;
  },
};

export default approvalService;
