-- Add preview_video_url to modules table
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS preview_video_url TEXT;
