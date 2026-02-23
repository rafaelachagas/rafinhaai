-- Add metadata columns to modules table
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS genres TEXT,
ADD COLUMN IF NOT EXISTS traits TEXT,
ADD COLUMN IF NOT EXISTS cast_list TEXT; -- Using cast_list to avoid potential keyword conflicts, though it's usually fine
