import type { User } from '@/features/users/types/user.types';

export interface Production {
  _id: string;
  title: string;
  description?: string;
  genre: string;
  language: string;
  format: string;
  logline?: string;
  synopsis?: string;
  startDate: string;
  endDate: string;
  budget: number;
  productionManager: string | User;
  status: 'Draft' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetProductionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  genre?: string;
  productionManager?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetProductionsResponse {
  productions: Production[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}
