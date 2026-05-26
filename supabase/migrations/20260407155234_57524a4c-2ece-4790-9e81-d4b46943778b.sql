
-- 1. Replace public coupon enumeration with a secure lookup function
DROP POLICY IF EXISTS "Anyone can view active coupons by code" ON public.coupons;

CREATE OR REPLACE FUNCTION public.lookup_coupon(coupon_code text)
RETURNS TABLE (
  id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  expires_at timestamptz,
  is_active boolean,
  max_uses integer,
  used_count integer,
  min_order_amount numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.code, c.discount_type, c.discount_value, c.expires_at,
         c.is_active, c.max_uses, c.used_count, c.min_order_amount
  FROM public.coupons c
  WHERE c.code = coupon_code
    AND c.is_active = true;
$$;

-- 2. Scope transfer-proofs uploads to user's own folder
-- First drop existing INSERT policy if any
DROP POLICY IF EXISTS "Authenticated users can upload transfer proofs" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_uploads" ON storage.objects;

-- Create scoped upload policy
CREATE POLICY "Users upload to own folder in transfer-proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transfer-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Restrict INSERT on contacts to require valid data (keep open for contact form but restrict to anon+authenticated)
-- The existing "Anyone can submit contact form" policy is acceptable for a contact form

-- 4. Restrict INSERT on template_downloads - keep open for tracking but it's acceptable

-- 5. Restrict INSERT on site_visits - keep open for tracking but it's acceptable

-- 6. Make sure the generate_order_number trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_order_number' AND tgrelid = 'public.orders'::regclass
  ) THEN
    CREATE TRIGGER set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_order_number();
  END IF;
END$$;
