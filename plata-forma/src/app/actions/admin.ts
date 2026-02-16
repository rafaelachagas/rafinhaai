'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserRole } from '@/context/ThemeContext';



export async function updateUserRole(targetUserId: string, targetUserEmail: string, newRole: UserRole, requesterId: string) {
    try {
        // 1. Buscar o perfil do solicitante e o perfil do alvo
        const { data: profiles, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .in('id', [requesterId, targetUserId]);

        if (fetchError || !profiles) {
            return { success: false, error: 'Erro ao verificar permissões.' };
        }

        const requester = profiles.find(p => p.id === requesterId);
        const target = profiles.find(p => p.id === targetUserId);

        if (!requester || (requester.role !== 'admin' && requester.role !== 'moderator')) {
            return { success: false, error: 'Acesso negado.' };
        }

        // 2. Proteção Universal para Administradores
        // Ninguém (nem mesmo outro admin) pode mudar o cargo de quem já é Admin
        if (target?.role === 'admin') {
            return { success: false, error: 'Cargos de Administrador são protegidos e só podem ser alterados via Banco de Dados.' };
        }

        // 3. Proibir promoção para Admin
        // O cargo Admin não pode ser atribuído via painel
        if (newRole === 'admin') {
            return { success: false, error: 'O cargo de Administrador só pode ser atribuído diretamente no Supabase.' };
        }

        // 4. Impedir auto-alteração (por segurança extra)
        if (targetUserId === requesterId) {
            return { success: false, error: 'Você não pode alterar seu próprio cargo.' };
        }

        // 5. Moderadores não podem promover outros para Moderador
        if (requester.role === 'moderator' && newRole === 'moderator') {
            return { success: false, error: 'Moderadores não podem atribuir cargos de Moderador.' };
        }

        // 6. Atualizar o cargo
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', targetUserId);

        if (profileError) {
            return { success: false, error: 'Erro ao atualizar cargo: ' + profileError.message };
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro inesperado' };
    }
}

export async function createUser(email: string, full_name: string, password: string, role: UserRole, cpf?: string) {
    try {
        // Bloquear criação de admin via painel
        if (role === 'admin') {
            return { success: false, error: 'Novos administradores devem ser criados via banco de dados.' };
        }

        // 1. Criar o usuário no Supabase Auth usando o Admin API
        const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, cpf }
        });

        if (authError) {
            return { success: false, error: authError.message };
        }

        if (data.user) {
            // 2. Atualizar o cargo e dados no perfil
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ full_name, role, cpf })
                .eq('id', data.user.id);

            if (profileError) {
                return { success: false, error: 'Usuário criado, mas erro ao definir cargo/dados: ' + profileError.message };
            }
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro inesperado' };
    }
}

export async function updateUserProfile(targetUserId: string, data: { full_name?: string, cpf?: string }, requesterId: string) {
    try {
        // 1. Verificar se o solicitante tem permissão (admin ou moderador)
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requesterId)
            .single();

        if (!requesterProfile || (requesterProfile.role !== 'admin' && requesterProfile.role !== 'moderator')) {
            return { success: false, error: 'Acesso negado.' };
        }

        // 2. Atualizar perfil
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update(data)
            .eq('id', targetUserId);

        if (updateError) {
            return { success: false, error: 'Erro ao atualizar perfil: ' + updateError.message };
        }

        // 3. Opcionalmente atualizar metadados do Auth (para manter sincronizado)
        if (data.full_name || data.cpf) {
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
                user_metadata: {
                    ...(data.full_name ? { full_name: data.full_name } : {}),
                    ...(data.cpf ? { cpf: data.cpf } : {})
                }
            });
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro inesperado' };
    }
}

export async function deleteUser(userId: string, userEmail: string, requesterId: string) {
    try {
        // 1. Buscar o perfil do solicitante e o perfil do alvo
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .in('id', [requesterId, userId]);

        const requester = profiles?.find(p => p.id === requesterId);
        const target = profiles?.find(p => p.id === userId);

        if (!requester || requester.role !== 'admin') {
            return { success: false, error: 'Apenas administradores podem excluir usuários.' };
        }

        // 2. Impedir exclusão de Administradores
        if (target?.role === 'admin') {
            return { success: false, error: 'Administradores não podem ser excluídos via painel.' };
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro inesperado' };
    }
}
