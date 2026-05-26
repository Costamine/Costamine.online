-- Add discount fields to templates table
ALTER TABLE public.templates 
ADD COLUMN discount_percentage numeric DEFAULT 0,
ADD COLUMN discount_active boolean DEFAULT false;