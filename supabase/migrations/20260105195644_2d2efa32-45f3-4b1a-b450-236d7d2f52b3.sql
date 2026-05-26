-- Add explicit SELECT policy for contacts table - only admins can read
CREATE POLICY "Only admins can view contacts" 
ON public.contacts 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));