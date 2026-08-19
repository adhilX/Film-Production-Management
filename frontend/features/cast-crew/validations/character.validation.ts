import { z } from 'zod';

export const characterSchema = z.object({
  name: z
    .string()
    .min(1, 'Character name is required.')
    .max(100, 'Character name cannot exceed 100 characters.'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.')
    .optional()
    .or(z.literal('')),
});

export type CharacterFormData = z.infer<typeof characterSchema>;
