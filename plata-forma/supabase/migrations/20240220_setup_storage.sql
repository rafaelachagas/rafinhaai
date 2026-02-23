-- 1. Criar o bucket 'course-assets' se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer pessoa veja os arquivos (Leitura Pública)
CREATE POLICY "Acesso Público para Visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

-- 3. Permitir que apenas Admins façam Upload
CREATE POLICY "Admins podem fazer Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-assets' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Permitir que Admins deletem ou atualizem arquivos
CREATE POLICY "Admins podem Gerenciar Arquivos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'course-assets' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
