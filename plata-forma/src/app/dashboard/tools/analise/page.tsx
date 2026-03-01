'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, Loader2, Copy, Check, ArrowLeft, BarChart3, Eye, Send
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

    const handleAnalyze = async () => {
        if (!roteiro.trim()) return;
        setGenerating(true);
        try {
            const res = await fetch('/api/ai/analise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roteiro, plataforma, objetivo }),
            });
            const data = await res.json();
            if (data.analise) setAnalise(data.analise);
            else setAnalise('Erro ao analisar roteiro. Tente novamente.');
        } catch {
            setAnalise('Erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => {
        setRoteiro('');
        setPlataforma('');
        setObjetivo('');
        setAnalise('');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(analise);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />

                {/* Back Button */}
                <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#6C5DD3]/10 group-hover:border-[#6C5DD3]/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para Ferramentas
                </button>

                {/* Page Title */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#FF754C] font-black text-[10px] uppercase tracking-[0.4em]">
                        <Eye size={12} />
                        Análise Inteligente
                    </div>
                    <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        Análise de <span className="text-[#FF754C]">Roteiro</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-lg">
                        Cole seu roteiro abaixo e receba uma análise detalhada com nota, pontos fortes, melhorias e uma versão otimizada.
                    </p>
                </div>

                {!analise ? (
                    /* ===== INPUT FORM ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-6`}>
                                <div className="space-y-3">
                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cole seu roteiro aqui *</label>
                                    <textarea
                                        value={roteiro}
                                        onChange={(e) => setRoteiro(e.target.value)}
                                        placeholder="Cole o roteiro completo que você quer analisar..."
                                        rows={14}
                                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-6 py-5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FF754C]/40 transition-all resize-none`}
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium">{roteiro.length} caracteres</p>
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={generating || !roteiro.trim()}
                                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#FF754C] to-[#FF5722] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-[#FF754C]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><BarChart3 size={20} /> Analisar Roteiro</>}
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-4`}>
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plataforma (opcional)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Instagram', 'TikTok', 'YouTube', 'Stories'].map(opt => (
                                        <button key={opt} onClick={() => setPlataforma(opt)} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${plataforma === opt ? 'bg-[#FF754C] border-[#FF754C] text-white shadow-lg shadow-[#FF754C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#FF754C]/5'}`}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-4`}>
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Objetivo (opcional)</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Vendas', 'Engajamento', 'Autoridade', 'Leads'].map(opt => (
                                        <button key={opt} onClick={() => setObjetivo(opt)} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${objetivo === opt ? 'bg-[#FF754C] border-[#FF754C] text-white shadow-lg shadow-[#FF754C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#FF754C]/5'}`}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-gradient-to-br from-[#FF754C]/5 to-transparent border-[#FF754C]/10' : 'bg-[#FF754C]/5 border-[#FF754C]/10'}`}>
                                <h4 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>💡 Dica</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">Cole seu roteiro completo, incluindo hooks, CTAs e indicações de cena. Quanto mais contexto, melhor a análise.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== RESULT ===== */
                    <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-8`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF754C]">Análise Completa</span>
                                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Resultado da sua análise</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#FF754C] hover:border-[#FF754C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#FF754C] hover:text-white text-gray-700'}`}>
                                    {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                </button>
                                <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF754C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#e5603c] transition-all shadow-lg shadow-[#FF754C]/20">
                                    <Eye size={16} /> Nova Análise
                                </button>
                            </div>
                        </div>

                        <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-orange font-medium leading-relaxed`}>
                                <ReactMarkdown>{analise}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
