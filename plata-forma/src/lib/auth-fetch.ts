import { supabase } from './supabase/client';

/**
 * Faz um fetch autenticado para as APIs da plataforma.
 * Inclui automaticamente o token de sessão do Supabase no header Authorization.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
}
