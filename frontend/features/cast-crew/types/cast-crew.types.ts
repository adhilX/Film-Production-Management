import type { User } from '@/features/users/types/user.types';
import type { Character } from './character.types';

export interface CastCrew {
  _id: string;
  userId: User;
  productionId: string;
  roleInProduction: string;
  characterId?: Character | null;
}
