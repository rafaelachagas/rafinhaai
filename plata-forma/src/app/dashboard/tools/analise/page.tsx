'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { authFetch } from '@/lib/auth-fetch';
import { Header } from '@/components/Header';
import { LoadingPhrases } from '@/components/LoadingPhrases';
import {
    Sparkles, Loader2, ArrowLeft, Copy, Check, Eye, Send, Download, History, Plus, BarChart3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AnalisePage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const [roteiro, setRoteiro] = useState('');
    const [plataforma, setPlataforma] = useState('');
    const [objetivo, setObjetivo] = useState('');
    const [generating, setGenerating] = useState(false);
    const [analise, setAnalise] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!themeLoading) {
            if (!profile) {
                const checkSession = async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) router.push('/login');
                };
                checkSession();
            } else {
                setLoading(false);
                fetchUnreadCount();
            }
        }
    }, [profile, themeLoading, router]);

    async function fetchUnreadCount() {
        if (!profile?.id) return;
        const { data: recent } = await supabase.from('messages').select('*').or(`recipient_id.eq.${profile?.id},recipient_id.is.null`).order('created_at', { ascending: false }).limit(5);
        if (recent) setRecentMessages(recent);
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).or(`recipient_id.eq.${profile?.id},recipient_id.is.null`).eq('is_read', false);
        if (count !== null) setUnreadCount(count);
    }

    const handleGenerate = async () => {
        if (!roteiro.trim()) return;
        setGenerating(true);
        setAnalise('');
        try {
            const res = await authFetch('/api/ai/analise', {
                method: 'POST',
                body: JSON.stringify({ roteiro, plataforma, objetivo }),
            });
            const data = await res.json();
            if (data.analise) {
                setAnalise(data.analise);
            } else {
                setAnalise('Erro ao gerar análise. Tente novamente.');
            }
        } catch (error) {
            setAnalise('Erro de conexão. Tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(analise);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setAnalise('');
        setRoteiro('');
        setPlataforma('');
        setObjetivo('');
    };

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />

                {/* Back Button */}
                <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#8B7AD8]/10 group-hover:border-[#8B7AD8]/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para Ferramentas
                </button>

                {/* Page Title */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#8B7AD8] font-black text-[10px] uppercase tracking-[0.4em]">
                        <Eye size={12} />
                        Análise Completa
                    </div>
                    <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        Análise de <span className="text-[#8B7AD8]">Roteiros</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-lg">
                        Cole seu roteiro e receba uma análise completa com nota, pontos fortes, melhorias e uma versão otimizada.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-6`}>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Roteiro para Análise *</label>
                                <textarea
                                    value={roteiro}
                                    onChange={(e) => setRoteiro(e.target.value)}
                                    placeholder="Cole aqui o roteiro que deseja analisar..."
                                    rows={10}
                                    className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#8B7AD8]/40 transition-all resize-none`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plataforma (Opcional)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['YouTube', 'Instagram', 'TikTok', 'Vendas'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setPlataforma(plataforma === opt ? '' : opt)}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${plataforma === opt
                                                ? 'bg-[#8B7AD8] border-[#8B7AD8] text-white shadow-lg shadow-[#8B7AD8]/30'
                                                : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#8B7AD8]/5'}`}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Objetivo (Opcional)</label>
                                <input
                                    value={objetivo}
                                    onChange={(e) => setObjetivo(e.target.value)}
                                    placeholder="Ex: Gerar vendas, crescer seguidores..."
                                    className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#8B7AD8]/40 transition-all`}
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating || !roteiro.trim()}
                                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#8B7AD8] to-[#6C5DD3] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-[#8B7AD8]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles size={18} /> Analisar Roteiro</>}
                            </button>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="lg:col-span-8">
                        <div className={`min-h-[600px] ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} rounded-[2.5rem] border relative overflow-hidden transition-all`}>
                            {!analise && !generating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 gap-6">
                                    <div className="w-24 h-24 rounded-full bg-[#8B7AD8]/10 flex items-center justify-center border border-[#8B7AD8]/20 animate-pulse">
                                        <BarChart3 size={40} className="text-[#8B7AD8] opacity-40" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Cole seu roteiro</h3>
                                        <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium leading-relaxed">Preencha os detalhes ao lado e receba uma análise completa do seu roteiro.</p>
                                    </div>
                                </div>
                            )}

                            {generating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-[#8B7AD8]/20 rounded-full animate-ping absolute inset-0"></div>
                                        <div className="w-24 h-24 border-t-2 border-[#8B7AD8] rounded-full animate-spin relative z-10"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="text-[#8B7AD8] w-8 h-8 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-lg font-black tracking-widest text-[#8B7AD8] uppercase">Analisando</p>
                                        <LoadingPhrases phrases={[
                                            "Avaliando a estrutura do seu roteiro...",
                                            "Analisando o gancho e retenção...",
                                            "Verificando a qualidade do CTA...",
                                            "Identificando pontos fortes e fracos...",
                                            "Preparando a versão otimizada..."
                                        ]} />
                                    </div>
                                </div>
                            )}

                            {analise && (
                                <div className="p-10">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8B7AD8]">Resultado</span>
                                            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Análise Completa</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={copyToClipboard}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl ${isDark ? 'bg-white/5 hover:bg-[#8B7AD8] border-white/5' : 'bg-gray-50 hover:bg-[#8B7AD8] border-gray-100'} border hover:text-white text-gray-400 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer`}
                                            >
                                                {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#8B7AD8] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#6C5DD3] transition-all shadow-lg shadow-[#8B7AD8]/20 cursor-pointer"
                                            >
                                                <Plus size={16} /> Nova Análise
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-purple font-medium leading-relaxed
                                            [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:bg-transparent [&_pre]:p-0
                                            [&_code]:break-words [&_code]:whitespace-pre-wrap [&_code]:bg-transparent [&_code]:p-0`}>
                                            <ReactMarkdown>{analise}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
