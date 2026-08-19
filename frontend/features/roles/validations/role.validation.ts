import { z } from 'zod';

export const roleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required.')
    .min(2, 'Role name must be at least 2 characters.')
    .max(50, 'Role name cannot exceed 50 characters.'),
  permissions: z.array(z.string()).optional(),
});

export const permissionSchema = z.object({
  name: z
    .string()
    .min(1, 'Permission name cannot be empty.')
    .regex(
      /^[a-z0-9_.-]+$/,
      'Permission name must only contain lowercase letters, numbers, dots, dashes, or underscores.'
    ),
  description: z.string().optional().or(z.literal('')),
  group: z.string().min(1, 'Category group is required.'),
});

export type RoleFormData = z.infer<typeof roleSchema>;
export type PermissionFormData = z.infer<typeof permissionSchema>;
