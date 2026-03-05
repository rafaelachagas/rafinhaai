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

        const event = payload.event;
        const buyerInfo = payload.data?.buyer;

        if (!buyerInfo || !buyerInfo.email) {
            return NextResponse.json({ message: 'Event ignored - No buyer data' }, { status: 200 });
        }

        const email = buyerInfo.email;

        // 2. Lógica de Vendas Aprovadas (Criar Acesso)
        if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
            const first_name = buyerInfo.first_name || buyerInfo.name?.split(' ')[0] || 'Aluno';
            const tempPassword = `Pf#${Math.random().toString(36).slice(-6)}!A`;

            // Verificar se usuário já existe
            const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
            if (existingProfile) {
                // Se já existir, apenas garanta que está ativo
                await supabaseAdmin.from('profiles').update({ hotmart_status: 'approved' }).eq('id', existingProfile.id);
                return NextResponse.json({ message: 'User already exists, updated status' }, { status: 200 });
            }

            // Criar o usuário no Supabase Auth
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: first_name }
            });

            if (authError || !authUser.user) {
                console.error('Erro ao criar usuário:', authError?.message);
                return NextResponse.json({ error: authError?.message }, { status: 400 });
            }

            // Salvar perfil adicional na tabela de Profiles
            await supabaseAdmin.from('profiles').insert({
                id: authUser.user.id,
                email: email,
                full_name: first_name,
                hotmart_status: 'approved',
                role: 'user'
            });

            console.log(`Usuário criado na plataforma via Hotmart: ${email}`);
            return NextResponse.json({ message: 'User created' }, { status: 201 });
        }

        // 3. Lógica de Estorno, Cancelamento e Chargeback (Remover Acesso)
        if (
            event === 'PURCHASE_REFUNDED' ||
            event === 'PURCHASE_CANCELED' ||
            event === 'PURCHASE_CHARGEBACK' ||
            event === 'SUBSCRIPTION_CANCELLATION'
        ) {
            // Acha o aluno pelo e-mail
            const { data: profileToBlock } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();

            if (profileToBlock) {
                // Expulsa e Deleta o usuário da Plataforma (Mata o Login via Auth admin)
                await supabaseAdmin.auth.admin.deleteUser(profileToBlock.id);

                // Limpa o perfil do banco
                await supabaseAdmin.from('profiles').delete().eq('id', profileToBlock.id);

                console.log(`ACESSO REVOGADO com sucesso para o aluno estornado: ${email} (Motivo: ${event})`);
            }
            return NextResponse.json({ message: 'User access successfully revoked' }, { status: 200 });
        }

        return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    } catch (error) {
        console.error('Erro no Webhook da Hotmart:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
