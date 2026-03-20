import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string({ error: 'Nama wajib diisi' }).min(1, 'Nama wajib diisi').max(255, 'Nama maksimal 255 karakter'),
  phone: z.string().max(20, 'No. telepon maksimal 20 karakter').optional().nullable().or(z.literal('')),
  email: z
    .union([
      z.literal(''),
      z.string().includes('@', { message: 'Email tidak valid' }).max(255, 'Email maksimal 255 karakter'),
    ])
    .optional()
    .nullable(),
  address: z.string().optional().nullable().or(z.literal('')),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(255, 'Nama maksimal 255 karakter').optional(),
  phone: z.string().max(20, 'No. telepon maksimal 20 karakter').optional().nullable().or(z.literal('')),
  email: z
    .union([
      z.literal(''),
      z.string().includes('@', { message: 'Email tidak valid' }).max(255, 'Email maksimal 255 karakter'),
    ])
    .optional()
    .nullable(),
  address: z.string().optional().nullable().or(z.literal('')),
});
