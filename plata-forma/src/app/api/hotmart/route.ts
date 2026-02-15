import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const hottok = request.headers.get('x-hotmart-hottok');

        // 1. Validar o Token da Hotmart
        if (hottok !== process.env.HOTMART_HOTTOK) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Filtrar apenas compras aprovadas
        // Eventos possíveis: PURCHASE_APPROVED, PURCHASE_COMPLETE, etc.
        if (payload.event === 'PURCHASE_APPROVED') {
            const { email, first_name } = payload.data.buyer;
            const tempPassword = `user@${Math.random().toString(36).slice(-6)}`;

            // 3. Criar o usuário no Supabase Auth
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: first_name }
            });

            if (authError) {
                console.error('Erro ao criar usuário:', authError.message);
                return NextResponse.json({ error: authError.message }, { status: 400 });
            }

            // 4. Salvar perfil adicional (opcional)
            await supabaseAdmin.from('profiles').insert({
                id: authUser.user.id,
                email: email,
                full_name: first_name,
                hotmart_status: 'approved'
            });

            console.log(`Usuário criado com sucesso: ${email}`);
            return NextResponse.json({ message: 'User created' }, { status: 201 });
        }

        return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
