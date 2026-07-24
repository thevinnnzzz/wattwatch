-- Add icon_name column to appliances table
ALTER TABLE public.appliances
ADD COLUMN IF NOT EXISTS icon_name TEXT;
