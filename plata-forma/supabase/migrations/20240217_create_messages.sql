-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id),
    recipient_id UUID REFERENCES public.profiles(id), -- NULL significa para todos
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas para evitar erro de "já existe"
DROP POLICY IF EXISTS "Students can read their own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins have full access to messages" ON public.messages;
DROP POLICY IF EXISTS "Recipient can update is_read" ON public.messages;
DROP POLICY IF EXISTS "Recipient can update message status" ON public.messages;

-- Criar Políticas de Segurança
CREATE POLICY "Students can read their own messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = recipient_id OR recipient_id IS NULL
    );

CREATE POLICY "Admins have full access to messages" ON public.messages
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Recipient can update message status" ON public.messages
    FOR UPDATE USING (
        auth.uid() = recipient_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() = recipient_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

