-- Drop the old unrestricted policy
DROP POLICY IF EXISTS "Anyone can upload transfer proofs" ON storage.objects;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can upload transfer proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'transfer-proofs' 
  AND auth.role() = 'authenticated'
);