-- Add is_demo column to energy_logs to distinguish real vs generated data
ALTER TABLE public.energy_logs
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
