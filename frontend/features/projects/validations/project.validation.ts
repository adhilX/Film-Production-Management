import { z } from 'zod';

export const projectSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required.')
    .min(2, 'Title must be at least 2 characters.'),
  budget: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' ? undefined : Number(val)))
    .pipe(
      z
        .number({ message: 'Budget must be a valid number.' })
        .min(0, 'Budget cannot be negative.')
    ),
  genre: z.string().min(1, 'Genre is required.'),
  format: z.string().min(1, 'Format is required.'),
  language: z.string().min(1, 'Language is required.'),
  productionManager: z.string().min(1, 'Project Manager is required.'),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().min(1, 'End date is required.'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be after or equal to the start date.',
    path: ['endDate'],
  }
);

export type ProjectFormData = z.infer<typeof projectSchema>;
