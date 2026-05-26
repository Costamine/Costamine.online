-- Add discount expiry date column to templates table
ALTER TABLE public.templates
ADD COLUMN discount_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;