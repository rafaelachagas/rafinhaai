'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { authFetch } from '@/lib/auth-fetch';
import { Header } from '@/components/Header';
import { LoadingPhrases } from '@/components/LoadingPhrases';
import {
    Sparkles, Loader2, ArrowLeft, Copy, Check, PenTool, Plus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function RoteiroPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const [nicho, setNicho] = useState('');
    const [avatar, setAvatar] = useState('');
    const [produto, setProduto] = useState('');
    const [plataforma, setPlataforma] = useState('Instagram');
    const [objetivo, setObjetivo] = useState('');
    const [tomVoz, setTomVoz] = useState('Persuasivo e direto');
    const [duracaoEstimada, setDuracaoEstimada] = useState('60 segundos');
    const [generating, setGenerating] = useState(false);
    const [script, setScript] = useState('');
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
        if (!nicho.trim() || !avatar.trim() || !produto.trim() || !objetivo.trim()) return;
        setGenerating(true);
        setScript('');
        try {
            const res = await authFetch('/api/ai/roteiros', {
                method: 'POST',
                body: JSON.stringify({ nicho, avatar, produto, plataforma, objetivo, tomVoz, duracaoEstimada }),
            });
            const data = await res.json();
            if (data.script) {
                setScript(data.script);
            } else {
                setScript('Erro ao gerar roteiro. Tente novamente.');
            }
        } catch (error) {
            setScript('Erro de conexão. Tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setScript('');
        setNicho('');
        setAvatar('');
        setProduto('');
        setObjetivo('');
        setTomVoz('Persuasivo e direto');
        setDuracaoEstimada('60 segundos');
    };

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />

                {/* Back Button */}
                <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#B42AF0]/10 group-hover:border-[#B42AF0]/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para Ferramentas
                </button>

                {/* Page Title */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#B42AF0] font-black text-[10px] uppercase tracking-[0.4em]">
                        <PenTool size={12} />
                        Roteirista Expert
                    </div>
                    <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        Criador de <span className="text-[#B42AF0]">Roteiros</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-lg">
                        Preencha a triagem completa e receba um roteiro ultra-personalizado com hook, agitação, solução e CTA.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-5`}>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nicho *</label>
                                <input value={nicho} onChange={(e) => setNicho(e.target.value)} placeholder="Ex: Emagrecimento, Marketing Digital" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#B42AF0]/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avatar (Público-Alvo) *</label>
                                <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="Ex: Mulheres 25-40 que querem emagrecer" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#B42AF0]/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Produto/Serviço *</label>
                                <input value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Ex: Mentoria de 12 semanas" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#B42AF0]/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plataforma *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['YouTube', 'Instagram', 'TikTok', 'Vendas'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setPlataforma(opt)}
                                            className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${plataforma === opt
                                                ? 'bg-[#B42AF0] border-[#B42AF0] text-white shadow-lg shadow-[#B42AF0]/30'
                                                : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#B42AF0]/5'}`}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Objetivo do Vídeo *</label>
                                <input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Ex: Vender mentoria, gerar leads" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#B42AF0]/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tom de Voz</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Persuasivo e direto', 'Educativo', 'Descontraído', 'Autoritário'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setTomVoz(opt)}
                                            className={`px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${tomVoz === opt
                                                ? 'bg-[#B42AF0] border-[#B42AF0] text-white shadow-lg shadow-[#B42AF0]/30'
                                                : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#B42AF0]/5'}`}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duração Estimada</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['30 segundos', '60 segundos', '3 minutos'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setDuracaoEstimada(opt)}
                                            className={`px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${duracaoEstimada === opt
                                                ? 'bg-[#B42AF0] border-[#B42AF0] text-white shadow-lg shadow-[#B42AF0]/30'
                                                : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#B42AF0]/5'}`}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating || !nicho.trim() || !avatar.trim() || !produto.trim() || !objetivo.trim()}
                                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#B42AF0] to-[#7D1AB8] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-[#B42AF0]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles size={18} /> Gerar Roteiro</>}
                            </button>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="lg:col-span-8">
                        <div className={`min-h-[600px] ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} rounded-[2.5rem] border relative overflow-hidden transition-all`}>
                            {!script && !generating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 gap-6">
                                    <div className="w-24 h-24 rounded-full bg-[#B42AF0]/10 flex items-center justify-center border border-[#B42AF0]/20 animate-pulse">
                                        <PenTool size={40} className="text-[#B42AF0] opacity-40" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Pronto para criar?</h3>
                                        <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium leading-relaxed">Preencha a triagem ao lado e receba um roteiro personalizado.</p>
                                    </div>
                                </div>
                            )}

                            {generating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-[#B42AF0]/20 rounded-full animate-ping absolute inset-0"></div>
                                        <div className="w-24 h-24 border-t-2 border-[#B42AF0] rounded-full animate-spin relative z-10"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="text-[#B42AF0] w-8 h-8 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-lg font-black tracking-widest text-[#B42AF0] uppercase">Criando Roteiro</p>
                                        <LoadingPhrases phrases={[
                                            "Estruturando seu roteiro com padrões de alta conversão...",
                                            "Aplicando gatilhos mentais e técnicas de retenção...",
                                            "Ajustando as copys para prender a atenção em 3 segundos...",
                                            "Inserindo Call-to-Actions que vendem de verdade...",
                                            "Revisando toda a cadência e naturalidade do script..."
                                        ]} />
                                    </div>
                                </div>
                            )}

                            {script && (
                                <div className="p-10">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B42AF0]">Sucesso</span>
                                            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Roteiro Otimizado</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={copyToClipboard}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl ${isDark ? 'bg-white/5 hover:bg-[#B42AF0] border-white/5' : 'bg-gray-50 hover:bg-[#B42AF0] border-gray-100'} border hover:text-white text-gray-400 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer`}
                                            >
                                                {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#B42AF0] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#7D1AB8] transition-all shadow-lg shadow-[#B42AF0]/20 cursor-pointer"
                                            >
                                                <Plus size={16} /> Novo Roteiro
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-purple font-medium leading-relaxed
                                            [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:bg-transparent [&_pre]:p-0
                                            [&_code]:break-words [&_code]:whitespace-pre-wrap [&_code]:bg-transparent [&_code]:p-0`}>
                                            <ReactMarkdown>{script}</ReactMarkdown>
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
