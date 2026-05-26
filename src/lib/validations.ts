import { z } from 'zod';

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  phone: z.string()
    .trim()
    .max(20, { message: 'Phone must be less than 20 characters' })
    .optional()
    .nullable()
    .transform(val => val || null),
  message: z.string()
    .trim()
    .min(1, { message: 'Message is required' })
    .max(2000, { message: 'Message must be less than 2000 characters' }),
});

// Order form validation schema
export const orderFormSchema = z.object({
  customer_name: z.string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  customer_email: z.string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  customer_phone: z.string()
    .trim()
    .max(20, { message: 'Phone must be less than 20 characters' })
    .optional()
    .nullable()
    .transform(val => val || null),
  total_sar: z.number()
    .positive({ message: 'Total must be positive' })
    .max(10000000, { message: 'Total exceeds maximum allowed' }),
  total_usd: z.number()
    .positive({ message: 'Total must be positive' })
    .max(10000000, { message: 'Total exceeds maximum allowed' }),
  total_egp: z.number()
    .positive({ message: 'Total must be positive' })
    .max(100000000, { message: 'Total exceeds maximum allowed' }),
  currency_used: z.enum(['SAR', 'USD', 'EGP']),
});

// Order item validation schema
export const orderItemSchema = z.object({
  order_id: z.string().uuid(),
  template_id: z.string().uuid().optional().nullable(),
  template_name: z.string()
    .trim()
    .min(1)
    .max(255),
  price: z.number()
    .nonnegative()
    .max(10000000),
  currency: z.enum(['SAR', 'USD', 'EGP']).default('SAR'),
});

// Type that ensures required fields for Supabase insert
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type OrderFormData = z.infer<typeof orderFormSchema>;
export type OrderItemData = z.output<typeof orderItemSchema>;
