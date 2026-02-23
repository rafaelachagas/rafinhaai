-- Adiciona a coluna horizontal_cover_url na tabela modules
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS horizontal_cover_url TEXT;
