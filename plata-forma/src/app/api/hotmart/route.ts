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
        const transactionId = payload.data?.purchase?.transaction;

        if (!buyerInfo || !buyerInfo.email) {
            return NextResponse.json({ message: 'Event ignored - No buyer data' }, { status: 200 });
        }

        const email = buyerInfo.email;

        // 2. Lógica de Vendas Aprovadas (Criar Acesso)
        if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
            const full_name = buyerInfo.name || 'Aluno';
            const first_name = buyerInfo.first_name || full_name.split(' ')[0] || 'Aluno';
            const tempPassword = `Pf#${Math.random().toString(36).slice(-6)}!A`;
            
            // RELÓGIO DA PLATAFORMA: +1 Ano de Acesso
            const dataAtual = new Date();
            const dataVencimento = new Date(dataAtual.setFullYear(dataAtual.getFullYear() + 1));
            const accessExpiresIso = dataVencimento.toISOString();

            // Verificar se usuário já existe
            const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id, access_expires_at').eq('email', email).single();
            if (existingProfile) {
                
                // Lógica de Renovação Acumulada: Se ela renovou antes de vencer o ano atual, 
                // não roubamos o tempo dela, adicionamos +1 ano a partir da data de vencimento que ela já tinha.
                let newExpiryDate = new Date(accessExpiresIso);
                if (existingProfile.access_expires_at) {
                    const currentExpiry = new Date(existingProfile.access_expires_at);
                    if (currentExpiry > new Date()) {
                        // Ainda tem tempo sobrando, soma 1 ano a partir daquele futuro
                        newExpiryDate = new Date(currentExpiry.setFullYear(currentExpiry.getFullYear() + 1));
                    }
                }

                // Se já existir, apenas garanta que está ativo, renove o acesso e ATUALIZE O NOME
                const { error: existingUpdateError } = await supabaseAdmin.from('profiles').update({ 
                    full_name: full_name,
                    hotmart_status: 'approved',
                    access_expires_at: newExpiryDate.toISOString()
                }).eq('id', existingProfile.id);
                
                if (existingUpdateError) {
                    console.error("Erro ao atualizar perfil existente:", existingUpdateError);
                }

                // Removemos a lógica de update user pra dar unban, pois não estamos banindo mais.
                // Atualiza o perfil apenas.

                // Salva ou atualiza a transação para constar que ele tem esse recibo ativo
                if (transactionId) {
                    await supabaseAdmin.from('hotmart_transactions').upsert({
                        user_id: existingProfile.id,
                        transaction_id: transactionId,
                        status: 'approved'
                    }, { onConflict: 'transaction_id' });
                }

                return NextResponse.json({ message: 'User already exists, updated status, name, and lifted any bans' }, { status: 200 });
            }

            // SOLUÇÃO 100% NATIVA DO SUPABASE (SEM FERRAMENTAS EXTERNAS):
            // Voltamos para a função inviteUserByEmail porque ELA é a ÚNICA que o Supabase envia um e-mail de "Boas Vindas" automaticamente.
            // O grande TRUQUE para resolver o erro de "Expirado":
            // Mandei a senha provisória para dentro do email (payload data)
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                data: { 
                     full_name: full_name,
                     temp_password: tempPassword // A MÁGICA TÁ AQUI
                }
            });

            if (authError || !authUser.user) {
                console.error('Erro ao convitar usuário:', authError?.message);
                return NextResponse.json({ error: authError?.message }, { status: 400 });
            }

            // Precisamos também Forçar a Senha Temporária na conta do usuário caso contrário ele não conseguirá logar pela primeira vez
            await supabaseAdmin.auth.admin.updateUserById(authUser.user.id, {
                password: tempPassword,
                email_confirm: true // Já confirmamos pra evitar que o login exija o clique no botão do convite!
            });

            // Salvar perfil adicional na tabela de Profiles (COM O RELÓGIO)
            // Usamos UPSERT aqui para garantir que se algum trigger do Supabase já tiver criado o perfil em branco, 
            // a gente sobrescreve/atualiza preenchendo o Nome e a Data de Validade corretamente.
            const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
                id: authUser.user.id,
                email: email,
                full_name: full_name,
                hotmart_status: 'approved',
                role: 'user',
                access_expires_at: accessExpiresIso // Registra o vencimento na tabela para a plataforma ver
            });

            if (profileError) {
                console.error("Erro ao salvar no profiles (nome ficou vazio possivelmente):", profileError);
            }

            // Salva a transação para este novo usuário
            if (transactionId) {
                await supabaseAdmin.from('hotmart_transactions').upsert({
                    user_id: authUser.user.id,
                    transaction_id: transactionId,
                    status: 'approved'
                }, { onConflict: 'transaction_id' });
            }

            console.log(`Usuário criado na plataforma via Hotmart: ${email} com validade até: ${accessExpiresIso}`);
            return NextResponse.json({ message: 'User created' }, { status: 201 });
        }

        // 3. Lógica de Estorno, Calote no Boleto/Pix e Chargeback (Remover Acesso Imediato)
        // NOTA: Removido o 'SUBSCRIPTION_CANCELLATION'. Alunos que cancelam renovação NÃO são estornados, 
        // eles apenas não terão o tempo renovado na próxima fatura, mas usarão o que já pagaram até a data_expires_at bater.
        if (
            event === 'PURCHASE_REFUNDED' || 
            event === 'PURCHASE_CANCELED' || 
            event === 'PURCHASE_CHARGEBACK' ||
            event === 'PURCHASE_BILLET_CANCELED' ||
            event === 'PURCHASE_PROTEST' ||
            event === 'PURCHASE_DELAYED' ||
            event === 'PURCHASE_EXPIRED' ||
            event === 'PURCHASE_RETURNED' ||
            event === 'PURCHASE_CHARGEBACK_DISPUTE'
        ) {
            // Acha o aluno pelo e-mail
            const { data: profileToBlock } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();

            let userId = profileToBlock?.id;

            // Se não achar no profile, tenta achar direto no Auth apenas por precaução
            if (!userId) {
                 const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
                 if (users) {
                     const authUser = users.find(u => u.email === email);
                     if (authUser) userId = authUser.id;
                 }
            }

            if (userId) {
                // Se tiver vindo o número da transação específica que estornou, a gente mata ELA primeiro
                if (transactionId) {
                    await supabaseAdmin.from('hotmart_transactions')
                        .update({ status: 'revoked' })
                        .eq('transaction_id', transactionId);
                }

                // VERIFICAÇÃO DE OURO: Esse aluno tem OUTRA transação "approved" rolando no banco dele?
                // Ex: Comprou 2x, estornou 1x só e ficou a outra
                const { count } = await supabaseAdmin
                    .from('hotmart_transactions')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('status', 'approved');

                if (count !== null && count > 0) {
                    console.log(`O aluno ${email} teve a transação ${transactionId} revogada, MAS ele ainda tem ${count} outra(s) compra(s) válidas ativas. Acesso MANTIDO!`);
                    return NextResponse.json({ message: `Transaction ${transactionId} revoked, but user access kept due to other active purchases.` }, { status: 200 });
                }

                // Se chegou aqui, ele não tem mais NENHUMA compra válida, descemos a machadada
                // Atualiza o perfil para mostrar que o acesso foi revogado/bloqueado
                const { error: updateProfileError } = await supabaseAdmin.from('profiles')
                    .update({ hotmart_status: 'revoked' })
                    .eq('id', userId);
                
                if (updateProfileError) {
                    console.error('Erro ao atualizar status do Profile:', updateProfileError);
                }

                console.log(`ACESSO REVOGADO/BANIDO com sucesso para o aluno estornado: ${email} (Motivo: ${event})`);
            } else {
                console.log(`Tentativa de revogar acesso para ${email}, mas o usuário não foi encontrado.`);
            }
            return NextResponse.json({ message: 'User access successfully revoked' }, { status: 200 });
        }

        return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    } catch (error) {
        console.error('Erro no Webhook da Hotmart:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
