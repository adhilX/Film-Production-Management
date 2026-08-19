import type { User } from '@/features/users/types/user.types';

export interface Character {
  _id: string;
  productionId: string;
  name: string;
  description?: string;
  assignments: string[] | User[];
}
