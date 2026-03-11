CREATE TABLE IF NOT EXISTS public.hotmart_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.hotmart_transactions ENABLE ROW LEVEL SECURITY;

-- Política de leitura: administradores podem ver tudo (se existir) 
-- ou a própria API que roda como "admin service_role" que já ignora RLS.
-- Então não precisamos de políticas públicas, pois só o webhook insere.
