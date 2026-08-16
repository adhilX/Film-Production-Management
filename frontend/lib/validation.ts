import { z } from 'zod';

// Zod Validation Schema for Login
export const loginSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Zod Validation Schema for Signup
export const signupSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  role: z.string().min(1, 'Please select your role'),
  agreeTerms: z.boolean().refine((val) => val === true, { message: 'You must agree to the Terms of Service & Privacy Policy' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Zod Schemas for the 6 Steps of Onboarding
export const step2Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  contractorType: z.enum(['Freelancer', 'Cast', 'Crew', 'Supplier', 'Agent', 'Production Company']),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const step3Schema = z.object({
  dailyRate: z.number().min(1, 'Daily rate must be greater than 0'),
  bankAccount: z.string().min(6, 'Bank account / IBAN must be at least 6 characters'),
});

export const step4Schema = z.object({
  documentType: z.string().min(2, 'Document type is required'),
  nationalId: z.string().min(5, 'National ID / Serial number must be at least 5 characters'),
});

export const step5Schema = z.object({
  agreeNda: z.boolean().refine((val) => val === true, { message: 'You must agree to the NDA' }),
  agreeSafety: z.boolean().refine((val) => val === true, { message: 'You must agree to the Safety Policy' }),
  agreeTerms: z.boolean().refine((val) => val === true, { message: 'You must agree to the Terms of Service' }),
});
