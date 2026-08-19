import { z } from 'zod';

export const bookingSchema = z.object({
  locationId: z.string().min(1, 'Please select a location.'),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().min(1, 'End date is required.'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before end date.',
    path: ['startDate'],
  }
);

export type BookingFormData = z.infer<typeof bookingSchema>;
