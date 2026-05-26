ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS display_location text NOT NULL DEFAULT 'templates',
  ADD COLUMN IF NOT EXISTS show_download_button boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_try_now_button boolean NOT NULL DEFAULT false;
