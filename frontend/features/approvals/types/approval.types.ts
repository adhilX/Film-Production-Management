import type { User } from '@/features/users/types/user.types';

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
  applications: User[];
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
