'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Mail, Loader2, Sparkles, ChevronLeft, ArrowRight, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { isDark, toggleTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push('/dashboard');
            }
        };
        checkUser();
    }, [router]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao enviar e-mail. Verifique se o endereço está correto.' });
        } else {
            setMessage({ type: 'success', text: 'Link de recuperação enviado! Verifique sua caixa de entrada.' });
        }
        setLoading(false);
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 selection:bg-[#B42AF0]/30 overflow-hidden relative ${isDark ? 'bg-[#0A0113]' : 'bg-gray-50'} md:transition-colors md:duration-500`}>
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                type="button"
                className={`absolute top-6 right-6 p-3 rounded-2xl border transition-all duration-300 z-20 ${isDark
                    ? 'bg-white/5 border-white/10 text-[#B42AF0] hover:bg-white/10'
                    : 'bg-white border-gray-200 text-[#B42AF0] shadow-sm hover:shadow-md'
                    }`}
                title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

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
                <div className={`rounded-[2.5rem] p-8 md:p-10 shadow-xl md:shadow-2xl border md:transition-all md:duration-500 ${isDark
                    ? 'bg-[#120222] border-white/10'
                    : 'bg-white border-gray-100 shadow-[#B42AF0]/5'
                    } md:backdrop-blur-xl`}>
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B42AF0] to-[#7D1AB8] mb-6 shadow-lg shadow-[#B42AF0]/25">
                            <Sparkles className="text-white w-8 h-8" />
                        </div>
                        <h1 className={`text-3xl font-bold mb-2 tracking-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Recuperar senha
                        </h1>
                        <p className={`text-sm transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Enviaremos um link de acesso ao seu e-mail
                        </p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-2">
                            <label className={`text-xs font-semibold uppercase tracking-wider ml-1 transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                E-mail cadastrado
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
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`border text-sm p-4 rounded-2xl transition-colors duration-500 animate-in fade-in slide-in-from-top-2 ${message?.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                {message?.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (message?.type === 'success')}
                            className={`w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg ${isDark
                                ? 'bg-gradient-to-r from-[#B42AF0] to-[#7D1AB8] hover:from-[#A21FDC] hover:to-[#6C179F] shadow-violet-950/40'
                                : 'bg-gradient-to-r from-[#B42AF0] to-[#7D1AB8] hover:from-[#A21FDC] hover:to-[#6C179F] shadow-[#B42AF0]/30'
                                }`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Enviar link de recuperação
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className={`my-8 border-t transition-colors ${isDark ? 'border-white/5' : 'border-gray-100'}`} />

                    <div className="text-center">
                        <Link
                            href="/login"
                            className={`inline-flex items-center text-sm font-medium transition-colors hover:underline ${isDark ? 'text-gray-400 hover:text-[#B42AF0]' : 'text-gray-600 hover:text-[#B42AF0]'
                                }`}
                        >
                            <ChevronLeft size={18} className="mr-1" />
                            Voltar para o login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
