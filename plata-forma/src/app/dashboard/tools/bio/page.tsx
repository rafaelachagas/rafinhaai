'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { authFetch } from '@/lib/auth-fetch';
import { Header } from '@/components/Header';
import { LoadingPhrases } from '@/components/LoadingPhrases';
import {
    Sparkles, Loader2, ArrowLeft, Copy, Check, Instagram, Plus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function BioPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const [nome, setNome] = useState('');
    const [nicho, setNicho] = useState('');
    const [publicoAlvo, setPublicoAlvo] = useState('');
    const [resultados, setResultados] = useState('');
    const [diferenciais, setDiferenciais] = useState('');
    const [tomVoz, setTomVoz] = useState('Profissional e confiante');
    const [objetivo, setObjetivo] = useState('Gerar autoridade e vender');
    const [estilo, setEstilo] = useState('Moderno e impactante');
    const [generating, setGenerating] = useState(false);
    const [bios, setBios] = useState('');
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
        if (!nicho.trim() || !publicoAlvo.trim()) return;
        setGenerating(true);
        setBios('');
        try {
            const res = await authFetch('/api/ai/bio', {
                method: 'POST',
                body: JSON.stringify({ nome, nicho, publicoAlvo, resultados, diferenciais, tomVoz, objetivo, estilo }),
            });
            const data = await res.json();
            if (data.bios) {
                setBios(data.bios);
            } else {
                setBios('Erro ao gerar bios. Tente novamente.');
            }
        } catch (error) {
            setBios('Erro de conexão. Tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bios);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setBios('');
        setNome('');
        setNicho('');
        setPublicoAlvo('');
        setResultados('');
        setDiferenciais('');
        setTomVoz('Profissional e confiante');
        setObjetivo('Gerar autoridade e vender');
        setEstilo('Moderno e impactante');
    };

    if (loading || themeLoading) return null;

    const accentColor = '#E1306C';

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />

                {/* Back Button */}
                <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-pink-500/10 group-hover:border-pink-500/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para Ferramentas
                </button>

                {/* Page Title */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.4em]" style={{ color: accentColor }}>
                        <Instagram size={12} />
                        Branding Pessoal
                    </div>
                    <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        Bio para <span style={{ color: accentColor }}>Instagram</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-lg">
                        Crie bios profissionais que convertem seguidores em clientes. Receba 5 opções prontas para usar.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-5`}>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nome/Marca</label>
                                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nicho *</label>
                                <input value={nicho} onChange={(e) => setNicho(e.target.value)} placeholder="Ex: Marketing Digital" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Público-Alvo *</label>
                                <input value={publicoAlvo} onChange={(e) => setPublicoAlvo(e.target.value)} placeholder="Ex: Empreendedores digitais" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Resultados/Conquistas</label>
                                <input value={resultados} onChange={(e) => setResultados(e.target.value)} placeholder="Ex: +500 alunos formados" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Diferenciais</label>
                                <input value={diferenciais} onChange={(e) => setDiferenciais(e.target.value)} placeholder="Ex: Método exclusivo" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500/40 transition-all`} />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tom de Voz</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Profissional e confiante', 'Divertido e leve', 'Direto e vendedor', 'Inspirador'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setTomVoz(opt)}
                                            className={`px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${tomVoz === opt
                                                ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/30'
                                                : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-pink-50'}`}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating || !nicho.trim() || !publicoAlvo.trim()}
                                className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles size={18} /> Gerar Bios</>}
                            </button>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="lg:col-span-8">
                        <div className={`min-h-[600px] ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} rounded-[2.5rem] border relative overflow-hidden transition-all`}>
                            {!bios && !generating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 gap-6">
                                    <div className="w-24 h-24 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20 animate-pulse">
                                        <Instagram size={40} className="text-pink-500 opacity-40" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Crie sua bio perfeita</h3>
                                        <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium leading-relaxed">Preencha os dados ao lado e receba 5 opções de bio otimizadas.</p>
                                    </div>
                                </div>
                            )}

                            {generating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-pink-500/20 rounded-full animate-ping absolute inset-0"></div>
                                        <div className="w-24 h-24 border-t-2 border-pink-500 rounded-full animate-spin relative z-10"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="text-pink-500 w-8 h-8 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-lg font-black tracking-widest text-pink-500 uppercase">Criando Bios</p>
                                        <LoadingPhrases phrases={[
                                            "Analisando seu nicho e público...",
                                            "Criando versões com diferentes estilos...",
                                            "Otimizando CTAs para conversão...",
                                            "Ajustando ao limite do Instagram...",
                                            "Finalizando suas 5 opções..."
                                        ]} />
                                    </div>
                                </div>
                            )}

                            {bios && (
                                <div className="p-10">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500">Resultado</span>
                                            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Suas Bios Prontas</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={copyToClipboard}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl ${isDark ? 'bg-white/5 hover:bg-pink-500 border-white/5' : 'bg-gray-50 hover:bg-pink-500 border-gray-100'} border hover:text-white text-gray-400 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer`}
                                            >
                                                {copied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-pink-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-pink-500/20 cursor-pointer"
                                            >
                                                <Plus size={16} /> Gerar Novas
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-pink font-medium leading-relaxed
                                            [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:bg-transparent [&_pre]:p-0
                                            [&_code]:break-words [&_code]:whitespace-pre-wrap [&_code]:bg-transparent [&_code]:p-0`}>
                                            <ReactMarkdown>{bios}</ReactMarkdown>
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
