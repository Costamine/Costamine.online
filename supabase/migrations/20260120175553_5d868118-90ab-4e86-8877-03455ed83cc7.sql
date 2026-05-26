
-- Create a table to track site visits
CREATE TABLE public.site_visits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    page_path TEXT,
    user_agent TEXT,
    ip_hash TEXT
);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visits (for tracking)
CREATE POLICY "Anyone can insert visits" 
ON public.site_visits 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view visits
CREATE POLICY "Only admins can view visits" 
ON public.site_visits 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster counting
CREATE INDEX idx_site_visits_visited_at ON public.site_visits(visited_at);
