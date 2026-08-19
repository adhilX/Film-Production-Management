import { z } from 'zod';

export const locationSchema = z.object({
  name: z
    .string()
    .min(1, 'Location name is required.')
    .min(2, 'Location name must be at least 2 characters.')
    .max(100, 'Location name cannot exceed 100 characters.'),
  address: z
    .string()
    .min(1, 'Location address is required.')
    .min(5, 'Address must be a valid, descriptive address (at least 5 characters).'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.')
    .optional()
    .or(z.literal('')),
  latitude: z
    .number({ message: 'Latitude must be a valid number.' })
    .min(-90, 'Latitude must be between -90 and 90 degrees.')
    .max(90, 'Latitude must be between -90 and 90 degrees.')
    .optional(),
  longitude: z
    .number({ message: 'Longitude must be a valid number.' })
    .min(-180, 'Longitude must be between -180 and 180 degrees.')
    .max(180, 'Longitude must be between -180 and 180 degrees.')
    .optional(),
  locationType: z.string().optional().or(z.literal('')),
  contactInfo: z
    .string()
    .max(150, 'Contact info cannot exceed 150 characters.')
    .optional()
    .or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    // If latitude is provided, longitude must be too, and vice versa.
    const hasLat = data.latitude !== undefined && data.latitude !== null && !isNaN(data.latitude);
    const hasLng = data.longitude !== undefined && data.longitude !== null && !isNaN(data.longitude);
    return hasLat === hasLng;
  },
  {
    message: 'Both Latitude and Longitude are required if either is specified.',
    path: ['latitude'], // Show error on latitude field
  }
);

export type LocationFormData = z.infer<typeof locationSchema>;
