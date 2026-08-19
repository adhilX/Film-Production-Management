export interface UserProfile {
  id: string;
  email: string;
  name: string;
  contractorType: string;
  systemRoleId?: {
    _id: string;
    name: string;
  };
  status: string;
  permissions: string[];
  onboardingStatus?: string;
  currentStep?: number;
  adminFeedback?: string;
  isActive?: boolean;
}

export interface User {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  contractorType: 'Freelancer' | 'Cast' | 'Crew' | 'Supplier' | 'Agent' | 'Cast-Crew Agent' | 'TCS Team' | 'Production Company' | 'None';
  systemRoleId?: string | { _id: string; name: string } | null;
  status: 'Draft' | 'Pending' | 'UnderReview' | 'Approved' | 'Rejected';
  isActive: boolean;
  profile?: any;
  onboardingStatus?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  contractorType?: string;
  systemRoleId?: string;
  status?: string;
  onboardingStatus?: string;
  isActive?: boolean;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}
