'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserRole } from '@/context/ThemeContext';

// Contas que possuem proteção total (não podem ser excluídas nem rebaixadas)
const MASTER_EMAILS = ['isaiaszuchi@gmail.com'];
const isMasterAccount = (email: string) => {
    const clean = email.toLowerCase().trim();
    return MASTER_EMAILS.includes(clean) || clean.includes('isaiaszuchi');
};

export async function updateUserRole(targetUserId: string, targetUserEmail: string, newRole: UserRole, requesterId: string) {
    try {
        const normalizedTargetEmail = targetUserEmail.trim().toLowerCase();

        // 1. Verificar se o solicitante (requester) ainda é um administrador/moderador
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role, email')
            .eq('id', requesterId)
            .single();

        if (!requesterProfile || (requesterProfile.role !== 'admin' && requesterProfile.role !== 'moderator')) {
            return { success: false, error: 'Acesso negado. Você não tem permissão para realizar esta ação.' };
        }

        // 2. Impedir auto-rebaixamento (ninguém pode tirar o próprio Admin)
        if (targetUserId === requesterId) {
            return { success: false, error: 'Você não pode alterar seu próprio cargo para evitar perda acidental de acesso.' };
        }

        // 3. Impedir alteração de contas MASTER (usando e-mail normalizado)
        if (isMasterAccount(normalizedTargetEmail)) {
            return { success: false, error: 'Esta é uma conta Master e seu cargo não pode ser alterado via painel.' };
        }

        // 4. Se o solicitante for Moderador, ele não pode alterar cargos de Admin nem transformar outros em Admin
        if (requesterProfile.role === 'moderator' && (newRole === 'admin')) {
            return { success: false, error: 'Moderadores não podem atribuir cargos de Administrador.' };
        }

        // 5. Atualizar o cargo no perfil
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

// Função especial para restaurar acesso (pode ser chamada uma vez ou via trigger de emergência)
export async function restoreMasterAccess() {
    try {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin' })
            .in('email', MASTER_EMAILS);

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function createUser(email: string, full_name: string, password: string, role: UserRole) {
    try {
        // 1. Criar o usuário no Supabase Auth usando o Admin API
        const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        });

        if (authError) {
            return { success: false, error: authError.message };
        }

        if (data.user) {
            // 2. Atualizar o cargo no perfil (o trigger já criou o perfil como 'user')
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name,
                    role
                })
                .eq('id', data.user.id);

            if (profileError) {
                return { success: false, error: 'Usuário criado, mas erro ao definir cargo: ' + profileError.message };
            }
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro inesperado' };
    }
}

export async function deleteUser(userId: string, userEmail: string, requesterId: string) {
    try {
        const normalizedTargetEmail = userEmail.trim().toLowerCase();

        // 1. Verificar permissão do solicitante
        const { data: requesterProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requesterId)
            .single();

        if (!requesterProfile || requesterProfile.role !== 'admin') {
            return { success: false, error: 'Apenas administradores podem excluir usuários.' };
        }

        // 2. Impedir auto-exclusão
        if (userId === requesterId) {
            return { success: false, error: 'Você não pode excluir sua própria conta.' };
        }

        // 3. Impedir exclusão de contas MASTER
        if (isMasterAccount(normalizedTargetEmail)) {
            return { success: false, error: 'Contas Master não podem ser excluídas.' };
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
