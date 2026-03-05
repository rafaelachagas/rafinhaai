-- Tabela de Anotações do CRM
CREATE TABLE IF NOT EXISTS public.crm_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativação de Segurança da Tabela (RLS)
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura admin" ON public.crm_notes FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator')));
CREATE POLICY "Permitir insercao admin" ON public.crm_notes FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator')));
CREATE POLICY "Permitir update admin" ON public.crm_notes FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator')));
CREATE POLICY "Permitir deletar admin" ON public.crm_notes FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator')));
