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
  photoUrl: z.string().min(1, 'Profile photo is required'),
  phoneNumber: z.string().min(5, 'Phone number must be at least 5 digits'),
  department: z.string().min(1, 'Please select your department'),
  position: z.string().min(1, 'Position is required'),
  experience: z.string().min(10, 'Experience summary must be at least 10 characters'),
});

export const step3Schema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Account number must be at least 5 digits'),
  routingNumber: z.string().min(5, 'Routing number must be at least 5 digits'),
  taxFormUrl: z.string().min(1, 'Tax document upload is required'),
});

export const step4Schema = z.object({
  governmentIdType: z.string().min(1, 'Government ID Type selection is required'),
  identityDocs: z.array(z.string()).min(2, 'Both front and back ID document uploads are required'),
});

export const step1Schema = z.object({
  contractorType: z.string().min(1, 'Please select your contractor type'),
});

export const step5Schema = z.object({
  agreeNda: z.boolean().refine((val) => val === true, { message: 'You must agree to the NDA' }),
  agreeTerms: z.boolean().refine((val) => val === true, { message: 'You must agree to the Terms of Service' }),
  signatureData: z.string().min(1, 'Digital signature is required'),
});

export const onboardingSchema = z.object({
  contractorType: z.string().min(1, 'Please select your contractor type'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  photoUrl: z.string().min(1, 'Profile photo is required'),
  phoneNumber: z.string().min(5, 'Phone number must be at least 5 digits'),
  department: z.string().min(1, 'Please select your department'),
  position: z.string().min(1, 'Position is required'),
  experience: z.string().min(10, 'Experience summary must be at least 10 characters'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Account number must be at least 5 digits'),
  routingNumber: z.string().min(5, 'Routing number must be at least 5 digits'),
  taxFormUrl: z.string().min(1, 'Tax document upload is required'),
  governmentIdType: z.string().min(1, 'Government ID Type selection is required'),
  identityDocs: z.array(z.string()).min(2, 'Both front and back ID document uploads are required'),
  agreeNda: z.boolean().refine((val) => val === true, { message: 'You must agree to the NDA' }),
  agreeTerms: z.boolean().refine((val) => val === true, { message: 'You must agree to the Terms of Service font-bold' }),
  signatureData: z.string().min(1, 'Digital signature is required'),
});
