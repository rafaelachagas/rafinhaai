'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import { Camera, User, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark, refreshProfile } = useTheme();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile states
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!themeLoading && !profile) {
            router.push('/login');
        }
        if (profile) {
            setFullName(profile.full_name || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile, themeLoading, router]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showMessage('error', 'Por favor, selecione uma imagem válida.');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showMessage('error', 'A imagem deve ter no máximo 2MB.');
            return;
        }

        setUploading(true);

        try {
            // Create a canvas to resize the image
            const img = document.createElement('img');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = async () => {
                // Resize to 600x600
                canvas.width = 600;
                canvas.height = 600;
                ctx?.drawImage(img, 0, 0, 600, 600);

                // Convert to blob
                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        showMessage('error', 'Erro ao processar imagem.');
                        setUploading(false);
                        return;
                    }

                    const fileExt = file.name.split('.').pop();
                    const fileName = `${profile?.id}/${Date.now()}.${fileExt}`;

                    // Delete old avatar if exists
                    if (avatarUrl) {
                        const oldPath = avatarUrl.split('/').slice(-2).join('/');
                        await supabase.storage.from('avatars').remove([oldPath]);
                    }

                    // Upload new avatar
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, blob, { upsert: true });

                    if (uploadError) {
                        showMessage('error', 'Erro ao fazer upload da imagem.');
                        setUploading(false);
                        return;
                    }

                    // Get public URL
                    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                    const publicUrl = data.publicUrl;

                    // Update profile
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ avatar_url: publicUrl })
                        .eq('id', profile?.id);

                    if (updateError) {
                        showMessage('error', 'Erro ao atualizar perfil.');
                        setUploading(false);
                        return;
                    }

                    setAvatarUrl(publicUrl);
                    await refreshProfile();
                    showMessage('success', 'Foto de perfil atualizada com sucesso!');
                    setUploading(false);
                }, 'image/jpeg', 0.9);
            };

            img.src = URL.createObjectURL(file);
        } catch (error) {
            showMessage('error', 'Erro ao processar imagem.');
            setUploading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!fullName || fullName.length < 3) {
            showMessage('error', 'O nome deve ter pelo menos 3 caracteres.');
            return;
        }

        setLoading(true);

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', profile?.id);

        if (error) {
            showMessage('error', 'Erro ao atualizar nome.');
        } else {
            await refreshProfile();
            showMessage('success', 'Nome atualizado com sucesso!');
        }

        setLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            showMessage('error', 'A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('error', 'As senhas não coincidem.');
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            showMessage('error', 'Erro ao atualizar senha.');
        } else {
            showMessage('success', 'Senha atualizada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }

        setLoading(false);
    };

    if (themeLoading || !profile) return null;

    return (
        <main className={`flex-1 p-4 lg:p-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full min-h-screen ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-50'}`}>
            <Header profile={profile} unreadCount={0} />

            {/* Message Toast */}
            {message && (
                <div className={`fixed top-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 ${message.type === 'success'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Configurações</h1>
                    <p className="text-gray-400 mt-2">Gerencie suas informações pessoais e preferências</p>
                </div>

                {/* Avatar Section */}
                <section className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} rounded-3xl border p-8 transition-colors`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-[#6C5DD3]/10 flex items-center justify-center">
                            <Camera size={20} className="text-[#6C5DD3]" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Foto de Perfil</h2>
                            <p className="text-sm text-gray-400">Recomendamos uma imagem de 600x600 pixels</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-[#6C5DD3]/20 overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=6C5DD3&color=fff&size=600`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-6 py-3 bg-[#6C5DD3] text-white rounded-2xl font-bold text-sm hover:bg-[#5a4ec2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Enviando...' : 'Alterar Foto'}
                            </button>
                            <p className="text-xs text-gray-400 mt-2">JPG, PNG ou GIF. Máximo 2MB.</p>
                        </div>
                    </div>
                </section>

                {/* Name Section */}
                <section className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} rounded-3xl border p-8 transition-colors`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                            <User size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Informações Pessoais</h2>
                            <p className="text-sm text-gray-400">Atualize seu nome completo</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Nome Completo</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={`w-full px-4 py-3 rounded-2xl border ${isDark ? 'bg-[#0F0F0F] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:border-[#6C5DD3] transition-colors`}
                                placeholder="Seu nome completo"
                            />
                        </div>
                        <button
                            onClick={handleUpdateName}
                            disabled={loading}
                            className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Nome'}
                        </button>
                    </div>
                </section>

                {/* Password Section */}
                <section className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} rounded-3xl border p-8 transition-colors`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                            <Lock size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Segurança</h2>
                            <p className="text-sm text-gray-400">Altere sua senha de acesso</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Nova Senha</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`w-full px-4 py-3 rounded-2xl border ${isDark ? 'bg-[#0F0F0F] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:border-[#6C5DD3] transition-colors`}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-3 rounded-2xl border ${isDark ? 'bg-[#0F0F0F] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:border-[#6C5DD3] transition-colors`}
                                placeholder="Repita a nova senha"
                            />
                        </div>
                        <button
                            onClick={handleUpdatePassword}
                            disabled={loading}
                            className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Lock size={18} />
                            {loading ? 'Salvando...' : 'Alterar Senha'}
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
