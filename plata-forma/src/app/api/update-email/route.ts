import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Endpoint dedicado para quando a Equipe (N8N, Zapier, Hotmart etc) alterar o e-mail de um afiliado/comprador 
// Pode ser chamado com uma requisição POST passando a HOTMART_HOTTOK no header ou com uma API Key própria.
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        
        // Verifica a segurança da chamada (Pode mandar no Header Authorization ou como x-api-key)
        const authHeader = request.headers.get('Authorization') || request.headers.get('x-api-key') || request.headers.get('x-hotmart-hottok');
        const token = authHeader?.replace('Bearer ', '');

        if (token !== process.env.HOTMART_HOTTOK) {
            return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 });
        }

        const { old_email, new_email } = payload;

        if (!old_email || !new_email) {
            return NextResponse.json({ error: 'old_email and new_email are required in the JSON body' }, { status: 400 });
        }

        // Tentar buscar o usuário pelo e-mail antigo
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', old_email)
            .single();

        let userId = profile?.id;

        // Se não existir no profile (o que é raro), busca direto no Supabase Auth Admin
        if (!userId) {
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (listError) throw listError;
            
            const authUser = users?.find(u => u.email === old_email);
            if (authUser) userId = authUser.id;
        }

        if (!userId) {
            return NextResponse.json({ error: `User with email ${old_email} not found` }, { status: 404 });
        }

        console.log(`Atualizando e-mail do usuário ${userId} de ${old_email} para ${new_email}`);

        // 1. Atualiza no Supabase Auth (coração da plataforma)
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: new_email,
            email_confirm: true // Force confirm to avoid sending verification email to the new address immediately if config says so
        });

        if (authError) {
            console.error('Erro ao atualizar e-mail no Auth:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 2. Atualiza na tabela Profiles para bater certinho com a plataforma
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ email: new_email })
            .eq('id', userId);

        if (profileError) {
            console.error('Erro ao atualizar e-mail no Profile:', profileError);
            // Mesmo com erro aqui, o principal já foi no Auth, mas avisaríamos.
            return NextResponse.json({ error: 'Email updated in Auth but failed in Profiles', details: profileError }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email successfully updated', userId, new_email }, { status: 200 });

    } catch (error: any) {
        console.error('Webhook Email Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
