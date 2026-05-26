
-- Create storage bucket for template files
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('transfer-proofs', 'transfer-proofs', false);

-- Storage policies for templates bucket (public read, admin write)
CREATE POLICY "Anyone can view template files" ON storage.objects FOR SELECT USING (bucket_id = 'templates');
CREATE POLICY "Admins can upload template files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update template files" ON storage.objects FOR UPDATE USING (bucket_id = 'templates' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete template files" ON storage.objects FOR DELETE USING (bucket_id = 'templates' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for transfer proofs (anyone can upload, admin can view)
CREATE POLICY "Anyone can upload transfer proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'transfer-proofs');
CREATE POLICY "Admins can view transfer proofs" ON storage.objects FOR SELECT USING (bucket_id = 'transfer-proofs' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete transfer proofs" ON storage.objects FOR DELETE USING (bucket_id = 'transfer-proofs' AND public.has_role(auth.uid(), 'admin'));
