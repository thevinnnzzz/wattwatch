-- Add role column to profiles (default: 'user', admin: 'admin')
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Admin-only RLS policy for rate_plans updates
DROP POLICY IF EXISTS "Admin can update rate plans" ON public.rate_plans;
CREATE POLICY "Admin can update rate plans" ON public.rate_plans
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin config table (single-row global settings)
CREATE TABLE IF NOT EXISTS public.admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generate_data_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read admin_config" ON public.admin_config;
CREATE POLICY "Anyone can read admin_config" ON public.admin_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can update admin_config" ON public.admin_config;
CREATE POLICY "Admin can update admin_config" ON public.admin_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed the admin_config singleton row
INSERT INTO public.admin_config (id, generate_data_enabled)
VALUES (gen_random_uuid(), true)
ON CONFLICT DO NOTHING;
