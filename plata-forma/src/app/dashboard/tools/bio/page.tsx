'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, Loader2, Copy, Check, ArrowLeft, Instagram, AtSign, RotateCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function BioPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const [formData, setFormData] = useState({
        nome: '', nicho: '', resultados: '', diferenciais: '',
        publicoAlvo: '', tomVoz: '', objetivo: '', estilo: ''
    });
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
        if (!formData.nicho || !formData.publicoAlvo) return;
        setGenerating(true);
        try {
            const res = await fetch('/api/ai/bio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.bios) setBios(data.bios);
            else setBios('Erro ao gerar bio. Tente novamente.');
        } catch {
            setBios('Erro de conexão. Verifique sua internet.');
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => {
        setFormData({ nome: '', nicho: '', resultados: '', diferenciais: '', publicoAlvo: '', tomVoz: '', objetivo: '', estilo: '' });
        setBios('');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bios);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />

                {/* Back */}
                <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#E1306C]/10 group-hover:border-[#E1306C]/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para Ferramentas
                </button>

                {/* Title */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#E1306C] font-black text-[10px] uppercase tracking-[0.4em]">
                        <Instagram size={12} />
                        Gerador de Bio
                    </div>
                    <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        Bio do <span className="text-[#E1306C]">Instagram</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-lg">
                        Receba 5 opções de bio profissional otimizadas para gerar autoridade e converter seguidores em clientes.
                    </p>
                </div>

                {!bios ? (
                    /* ===== FORM ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7">
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-6`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <InputField label="Nome ou Marca" value={formData.nome} onChange={(v: string) => setFormData({ ...formData, nome: v })} placeholder="Ex: Maria Finanças" isDark={isDark} />
                                    <InputField label="Nicho *" value={formData.nicho} onChange={(v: string) => setFormData({ ...formData, nicho: v })} placeholder="Ex: Marketing Digital" isDark={isDark} required />
                                    <InputField label="Público-alvo *" value={formData.publicoAlvo} onChange={(v: string) => setFormData({ ...formData, publicoAlvo: v })} placeholder="Ex: Empreendedoras iniciantes" isDark={isDark} required />
                                    <InputField label="Resultados/Conquistas" value={formData.resultados} onChange={(v: string) => setFormData({ ...formData, resultados: v })} placeholder="Ex: +500 alunas formadas" isDark={isDark} />
                                    <InputField label="Diferenciais" value={formData.diferenciais} onChange={(v: string) => setFormData({ ...formData, diferenciais: v })} placeholder="Ex: Método exclusivo de 7 dias" isDark={isDark} className="md:col-span-2" />
                                </div>

                                <div className="space-y-3">
                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tom de Voz</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Profissional', 'Descontraído', 'Empoderado', 'Minimalista', 'Aspiracional'].map(t => (
                                            <button key={t} onClick={() => setFormData({ ...formData, tomVoz: t })} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.tomVoz === t ? 'bg-[#E1306C] border-[#E1306C] text-white shadow-lg shadow-[#E1306C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#E1306C]/5'}`}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Objetivo do Perfil</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Vender', 'Gerar Autoridade', 'Captar Leads', 'Crescer Seguidores', 'Networking'].map(o => (
                                            <button key={o} onClick={() => setFormData({ ...formData, objetivo: o })} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.objetivo === o ? 'bg-[#E1306C] border-[#E1306C] text-white shadow-lg shadow-[#E1306C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#E1306C]/5'}`}`}>
                                                {o}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={handleGenerate} disabled={generating || !formData.nicho || !formData.publicoAlvo} className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#E1306C] to-[#C13584] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-[#E1306C]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles size={20} /> Gerar 5 Bios</>}
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            {/* Preview Card */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-0.5">
                                        <div className={`w-full h-full rounded-full ${isDark ? 'bg-[#1A1D1F]' : 'bg-white'} flex items-center justify-center`}>
                                            <AtSign size={28} className="text-[#E1306C]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{formData.nome || 'Seu Perfil'}</h4>
                                        <p className="text-xs text-gray-400">{formData.nicho || 'Seu nicho aqui'}</p>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} min-h-[80px] flex items-center justify-center`}>
                                    <p className="text-xs text-gray-400 text-center italic">Suas bios aparecerão aqui após gerar...</p>
                                </div>
                            </div>

                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-gradient-to-br from-[#E1306C]/5 to-transparent border-[#E1306C]/10' : 'bg-[#E1306C]/5 border-[#E1306C]/10'}`}>
                                <h4 className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>📱 O que uma boa bio precisa ter:</h4>
                                <ul className="space-y-2">
                                    {['Quem você é e o que faz', 'Para quem você ajuda', 'Resultado que entrega', 'CTA claro (link, DM, etc.)'].map((tip, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#E1306C] shrink-0"></div>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== RESULT ===== */
                    <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-8`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E1306C]">Bios Geradas</span>
                                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Suas 5 opções de bio estão prontas!</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#E1306C] hover:border-[#E1306C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#E1306C] hover:text-white text-gray-700'}`}>
                                    {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar Tudo</>}
                                </button>
                                <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#E1306C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#c31960] transition-all shadow-lg shadow-[#E1306C]/20">
                                    <RotateCcw size={16} /> Gerar Novamente
                                </button>
                            </div>
                        </div>

                        <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-pink font-medium leading-relaxed`}>
                                <ReactMarkdown>{bios}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder, isDark, required, className = '' }: any) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#E1306C]/40 transition-all`} />
        </div>
    );
}
