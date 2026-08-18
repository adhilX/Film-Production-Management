import { apiClient } from '@/services/api/api-client';
import type { AuditLog } from '@/app/types';

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  productionId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetAuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  metrics?: any;
}

export const logService = {
  async getAuditLogs(params?: GetAuditLogsParams): Promise<GetAuditLogsResponse> {
    const res = await apiClient.get<GetAuditLogsResponse>('/audit-logs', { params });
    return res.data;
  },
};

export default logService;
