-- Add attachments column to lessons table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Update RLS policies for lessons to ensure attachments can be viewed/edited
-- (Existing policies cover the whole table, so no specific update needed unless we want to granularly restrict attachments)
