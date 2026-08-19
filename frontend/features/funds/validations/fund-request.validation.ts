import { z } from 'zod';

export const requestSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  category: z.string().min(1, 'Category is required').max(50),
  requestedAmount: z
    .number()
    .positive('Amount must be positive')
    .finite()
    .min(0.01, 'Minimum request amount is 0.01'),
});

export const approveSchema = z.object({
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional().or(z.literal('')),
});

export const rejectSchema = z.object({
  reason: z
    .string()
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must not exceed 500 characters'),
});

export type RequestFormValues = z.infer<typeof requestSchema>;
export type ApproveFormValues = z.infer<typeof approveSchema>;
export type RejectFormValues = z.infer<typeof rejectSchema>;
