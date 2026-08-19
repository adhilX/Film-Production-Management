export interface AuditLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  resourceId: string;
  resourceType: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  productionId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  userId?: string;
  resourceType?: string;
}

export interface GetAuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  metrics?: any;
}
