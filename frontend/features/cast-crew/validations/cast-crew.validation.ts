import { z } from 'zod';

export const castCrewSchema = z.object({
  userId: z.string().min(1, 'Please select a team member to assign.'),
  roleInProduction: z
    .string()
    .min(1, 'Role in production is required.')
    .max(100, 'Role in production cannot exceed 100 characters.'),
  characterId: z.string().optional().or(z.literal('')),
});

export const updateCastCrewSchema = z.object({
  roleInProduction: z
    .string()
    .min(1, 'Role in production is required.')
    .max(100, 'Role in production cannot exceed 100 characters.'),
  characterId: z.string().optional().or(z.literal('')).nullable(),
});

export type CastCrewAssignmentFormData = z.infer<typeof castCrewSchema>;
export type UpdateCastCrewAssignmentFormData = z.infer<typeof updateCastCrewSchema>;
