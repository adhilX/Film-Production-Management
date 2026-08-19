import { z } from 'zod';

export const costumeSchema = z.object({
  name: z
    .string()
    .min(1, 'Costume name is required.')
    .min(2, 'Costume name must be at least 2 characters.')
    .max(100, 'Costume name cannot exceed 100 characters.'),
  category: z
    .string()
    .min(1, 'Category is required.')
    .min(2, 'Category must be at least 2 characters.')
    .max(50, 'Category cannot exceed 50 characters.'),
  size: z
    .string()
    .max(20, 'Size cannot exceed 20 characters.')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.')
    .optional()
    .or(z.literal('')),
  quantity: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' ? undefined : Number(val)))
    .pipe(
      z
        .number({ message: 'Quantity is required.' })
        .min(1, 'Quantity must be at least 1.')
    ),
  condition: z.enum(['New', 'Good', 'Fair', 'Damaged']),
  imageUrl: z.string().optional().or(z.literal('')),
});

export type CostumeFormData = z.infer<typeof costumeSchema>;
