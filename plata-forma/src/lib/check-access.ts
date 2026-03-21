import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Verifica se o usuário da requisição tem acesso ativo à plataforma.
 * Checa:
 *   1. Se o token Bearer é válido (sessão ativa no Supabase)
 *   2. Se o hotmart_status não é 'revoked' (estornado)
 *   3. Se o access_expires_at não passou (acesso não expirado)
 *
 * Retorna { userId } se o acesso for válido, ou um NextResponse 403 se não for.
 */
export async function checkAccess(request: Request): Promise<{ userId: string } | NextResponse> {
    // Pega o token do header Authorization: Bearer <token>
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return NextResponse.json({ error: 'Não autorizado. Token ausente.' }, { status: 401 });
    }

    // Cria um cliente anon com o token do usuário para validação segura
    const supabaseRouteClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );

    // Verifica o token com o Supabase
    const { data: { user }, error } = await supabaseRouteClient.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }

    // Busca o perfil para checar hotmart_status e access_expires_at
    const { data: profile } = await supabaseRouteClient
        .from('profiles')
        .select('hotmart_status, access_expires_at, role')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 403 });
    }

    // Admins sempre passam
    if (profile.role === 'admin') {
        return { userId: user.id };
    }

    // Acesso revogado (estorno/chargeback)
    if (profile.hotmart_status === 'revoked') {
        return NextResponse.json({ error: 'Acesso revogado. Entre em contato com o suporte.' }, { status: 403 });
    }

    // Acesso expirado
    if (profile.access_expires_at) {
        const expiryDate = new Date(profile.access_expires_at).getTime();
        if (expiryDate < Date.now()) {
            return NextResponse.json({ error: 'Acesso expirado. Renove sua assinatura.' }, { status: 403 });
        }
    }

    return { userId: user.id };
}
