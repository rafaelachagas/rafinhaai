'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { UserRole } from '@/context/ThemeContext';

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

export async function deleteUser(userId: string) {
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro inesperado' };
    }
}
