-- Public bucket for hero/landing assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-assets', 'hero-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public can read hero assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-assets');

-- Admin write
CREATE POLICY "Admins can upload hero assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hero-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hero assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hero-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'hero-assets' AND has_role(auth.uid(), 'admin'::app_role));
