import { z } from 'zod';

export const adoptionFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  reason: z.string().min(50, 'Please provide more details'),
});

export type AdoptionFormData = z.infer<typeof adoptionFormSchema>;