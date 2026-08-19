import type { User } from '@/features/users/types/user.types';

export interface Costume {
  _id: string;
  productionId: string;
  name: string;
  category: string;
  description?: string;
  size?: string;
  imageUrl?: string;
  quantity: number;
  availableQuantity: number;
  condition: 'New' | 'Good' | 'Fair' | 'Damaged';
  status: 'Available' | 'Assigned' | 'Damaged' | 'Lost';
  createdBy: string | User;
  updatedBy?: string | User;
  createdAt?: string;
  updatedAt?: string;
}
