import { z } from 'zod';

export const assignmentSchema = z.object({
  targetType: z.enum(['character', 'user']),
  characterId: z.string().optional().or(z.literal('')),
  userId: z.string().optional().or(z.literal('')),
  quantity: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' ? undefined : Number(val)))
    .pipe(
      z
        .number({ message: 'Quantity is required.' })
        .min(1, 'Quantity must be at least 1.')
    ),
  conditionAtAssignment: z.enum(['New', 'Good', 'Fair', 'Damaged']),
  notes: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.targetType === 'character') {
      return !!data.characterId;
    }
    return true;
  },
  {
    message: 'Please select a character.',
    path: ['characterId'],
  }
).refine(
  (data) => {
    if (data.targetType === 'user') {
      return !!data.userId;
    }
    return true;
  },
  {
    message: 'Please select a cast/crew member.',
    path: ['userId'],
  }
);

export type CostumeAssignmentFormData = z.infer<typeof assignmentSchema>;
