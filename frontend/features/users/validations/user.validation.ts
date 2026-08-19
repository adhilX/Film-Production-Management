import { z } from 'zod';

export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required.')
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
  contractorType: z.string().optional().or(z.literal('')),
  systemRoleId: z.string().optional().or(z.literal('')),
  onboardingStatus: z.enum(['draft', 'pending-review', 'changes-requested', 'approved']).optional(),
  isActive: z.boolean().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
