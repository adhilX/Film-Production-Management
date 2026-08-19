import type { User } from '@/features/users/types/user.types';
import type { Character } from '@/features/cast-crew/types/character.types';
import type { Costume } from './costume.types';

export interface CostumeAssignment {
  _id: string;
  productionId: string;
  costumeId: Costume;
  characterId?: Character | null;
  assignedTo?: User | null;
  assignedBy: User;
  assignedAt: string;
  returnedAt?: string;
  quantity: number;
  status: 'Assigned' | 'Returned';
  conditionAtAssignment: string;
  conditionAtReturn?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
