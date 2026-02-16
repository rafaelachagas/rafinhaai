'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserRole } from '@/context/ThemeContext';

// Contas que possuem proteção total (não podem ser excluídas nem rebaixadas)
const MASTER_EMAILS = ['isaiaszuchi@gmail.com'];

export async function updateUserRole(targetUserId: string, targetUserEmail: string, newRole: UserRole, adminId: string) {
    try {
        // 1. Impedir auto-rebaixamento (ninguém pode tirar o próprio Admin)
        if (targetUserId === adminId) {
            return { success: false, error: 'Você não pode alterar seu próprio cargo para evitar perda de acesso.' };
        }

        // 2. Impedir alteração de contas MASTER
        if (MASTER_EMAILS.includes(targetUserEmail)) {
            return { success: false, error: 'Esta é uma conta Master e seu cargo não pode ser alterado via painel.' };
        }

        // 3. Atualizar o cargo no perfil
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

export async function deleteUser(userId: string, userEmail: string) {
    try {
        // Impedir exclusão de contas MASTER
        if (MASTER_EMAILS.includes(userEmail)) {
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
