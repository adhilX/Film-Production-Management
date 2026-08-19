import { apiClient } from '@/services/api/api-client';
import type { AuditLog, GetAuditLogsParams, GetAuditLogsResponse } from '@/features/logs/types';

export const logService = {
  async getAuditLogs(params?: GetAuditLogsParams): Promise<GetAuditLogsResponse> {
    const res = await apiClient.get<GetAuditLogsResponse>('/audit-logs', { params });
    return res.data;
  },
};

export default logService;
