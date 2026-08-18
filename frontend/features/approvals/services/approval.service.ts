import { apiClient } from '@/services/api/api-client';

export interface GetApplicationsParams {
  page?: number;
  limit?: number;
  search?: string;
  contractorType?: string;
  department?: string;
  onboardingStatus?: string;
  stale?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetApplicationsResponse {
  applications: any[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  metrics: any;
}

export interface EvaluateApplicationPayload {
  status: 'approved' | 'changes-requested';
  systemRoleId?: string;
  adminFeedback?: string;
}

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
