'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Sparkles, Sun, Moon, Eye, EyeOff, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isDark, toggleTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Mensagens mais amigáveis para erros comuns
                if (error.message.includes('Invalid login credentials')) {
                    setError('E-mail ou senha incorretos.');
                } else if (error.message.includes('Email not confirmed')) {
                    setError('Por favor, confirme seu e-mail antes de acessar.');
                } else {
                    setError('Erro ao entrar: ' + error.message);
                }
                setLoading(false);
                return;
            }

            if (data?.session) {
                // Redirecionamento forçado para limpar o estado e garantir fluidez
                window.location.href = '/dashboard';
            } else {
                setError('Sessão não iniciada. Tente novamente.');
                setLoading(false);
            }
        } catch (err: any) {
            setError('Erro inesperado: ' + (err.message || 'Falha na conexão'));
            setLoading(false);
        }
    };

    // Avoid hydration mismatch by not rendering theme-dependent classes until mounted
    const backgroundClass = !mounted ? 'bg-[#0A0113]' : (isDark ? 'bg-[#0A0113]' : 'bg-gray-50');

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 selection:bg-[#B42AF0]/30 overflow-hidden relative ${backgroundClass} md:transition-colors md:duration-500`}>
            {/* Centered Highlight Glow Layer - Desktop only */}
            <div
                className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 blur-[100px] hidden md:block"
                style={{
                    background: `radial-gradient(circle at center, ${isDark ? 'rgba(180, 42, 240, 0.15)' : 'rgba(180, 42, 240, 0.08)'
                        } 0%, transparent 70%)`
                }}
            />


            {/* Background Glows - Desktop only */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse transition-colors duration-500 will-change-[opacity,transform] ${isDark ? 'bg-[#B42AF0]/10' : 'bg-[#B42AF0]/5'}`}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse delay-700 transition-colors duration-500 will-change-[opacity,transform] ${isDark ? 'bg-[#7D1AB8]/10' : 'bg-[#7D1AB8]/5'}`}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className={`rounded-[2.5rem] p-8 md:p-10 shadow-xl md:shadow-2xl border md:transition-all md:duration-500 ${isDark && mounted
                    ? 'bg-[#120222] border-white/10 text-white'
                    : 'bg-white border-gray-100 text-gray-900'
                    } md:backdrop-blur-xl`}>
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B42AF0] to-[#7D1AB8] mb-6 shadow-lg shadow-[#B42AF0]/25">
                            <Sparkles className="text-white w-8 h-8" />
                        </div>
                        <h1 className={`text-3xl font-bold mb-2 tracking-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Acesse sua conta
                        </h1>
                        <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Plataforma de Formação Exclusiva
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className={`text-xs font-semibold uppercase tracking-wider ml-1 transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                E-mail
                            </label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? 'text-gray-300 group-focus-within:text-[#B42AF0]' : 'text-gray-400 group-focus-within:text-[#B42AF0]'
                                    }`}>
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`block w-full pl-11 pr-4 py-3.5 border rounded-2xl leading-5 transition-all focus:outline-none focus:ring-2 focus:ring-[#B42AF0]/40 focus:border-[#B42AF0]/40 ${isDark
                                        ? 'bg-white/5 border-white/10 text-gray-100 placeholder-gray-300'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                    placeholder="Seu e-mail"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-semibold uppercase tracking-wider ml-1 transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Senha
                            </label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? 'text-gray-300 group-focus-within:text-[#B42AF0]' : 'text-gray-400 group-focus-within:text-[#B42AF0]'
                                    }`}>
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`block w-full pl-11 pr-12 py-3.5 border rounded-2xl leading-5 transition-all focus:outline-none focus:ring-2 focus:ring-[#B42AF0]/40 focus:border-[#B42AF0]/40 ${isDark
                                        ? 'bg-white/5 border-white/10 text-gray-100 placeholder-gray-300'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                    placeholder="Sua senha"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className={`w-5 h-5 border rounded-md transition-all flex items-center justify-center peer-checked:bg-[#B42AF0] peer-checked:border-[#B42AF0] ${isDark ? 'bg-white/5 border-white/20' : 'bg-white border-gray-300'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-sm bg-white transition-opacity ${rememberMe ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                                <span className={`ml-2 text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Manter conectado
                                </span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className={`text-sm font-medium transition-colors hover:underline ${isDark ? 'text-gray-400 hover:text-[#B42AF0]' : 'text-gray-600 hover:text-[#B42AF0]'
                                    }`}
                            >
                                Esqueci minha senha
                            </Link>
                        </div>

                        {error && (
                            <div className={`border text-sm p-4 rounded-2xl transition-colors duration-500 animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                                }`}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg ${isDark
                                ? 'bg-gradient-to-r from-[#B42AF0] to-[#7D1AB8] hover:from-[#A21FDC] hover:to-[#6C179F] shadow-violet-950/40'
                                : 'bg-gradient-to-r from-[#B42AF0] to-[#7D1AB8] hover:from-[#A21FDC] hover:to-[#6C179F] shadow-[#B42AF0]/30'
                                }`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
                        </button>
                    </form>

                    <div className={`my-8 border-t transition-colors ${isDark ? 'border-white/5' : 'border-gray-100'}`} />

                    <div className="text-center space-y-4">
                        <p className={`text-sm font-medium transition-colors duration-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Ainda não é membro?
                        </p>
                        <button
                            type="button"
                            className={`w-full group flex items-center justify-center py-4 px-4 rounded-2xl border transition-all duration-300 font-bold ${isDark
                                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100 shadow-sm'
                                }`}
                        >
                            Comprar agora!
                            <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <p className={`mt-10 text-center text-[10px] leading-relaxed transition-colors duration-500 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Ao fazer login, você concorda com nossos <br />
                        <span className="font-bold hover:underline cursor-pointer">Termos de Uso</span> e <span className="font-bold hover:underline cursor-pointer">Política de Privacidade</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}
