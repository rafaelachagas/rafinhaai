-- Add thumbnail_url to lessons table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update RLS if necessary (it shouldn't be, as we are adding a column to a table with existing policies)
COMMENT ON COLUMN public.lessons.thumbnail_url IS 'URL for the lesson cover image or GIF';
