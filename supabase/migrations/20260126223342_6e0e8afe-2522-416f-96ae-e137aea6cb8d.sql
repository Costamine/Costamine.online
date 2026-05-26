-- Add column to control NEW badge visibility
ALTER TABLE public.templates 
ADD COLUMN show_new_badge boolean DEFAULT true;