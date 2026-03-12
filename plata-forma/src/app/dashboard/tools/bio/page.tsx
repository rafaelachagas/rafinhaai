'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, Loader2, Copy, Check, ArrowLeft, Instagram, AtSign, RotateCcw, Download, History, Plus
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
    const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

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

    
    const fetchHistory = async () => {
        if (!profile?.id) return;
        setLoadingHistory(true);
        const { data } = await supabase
            .from('ai_content_history')
            .select('*')
            .eq('user_id', profile.id)
            .eq('tool_type', 'bio')
            .order('created_at', { ascending: false });
        
        if (data) setHistory(data);
        setLoadingHistory(false);
    };

    useEffect(() => {
        if (activeTab === 'historico') fetchHistory();
    }, [activeTab, profile]);

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
            if (profile?.id) {
                await supabase.from('ai_content_history').insert([{ user_id: profile.id, tool_type: 'bio', input_data: formData, output_content: data.bios }]);
            }
            else setBios('Erro ao gerar bio. Tente novamente.');
        } catch {
            setBios('Erro de conexão. Verifique sua internet.');
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => { setFormData({ nome: '', nicho: '', resultados: '', diferenciais: '', publicoAlvo: '', tomVoz: '', objetivo: '', estilo: '' }); setBios(''); setActiveTab('novo'); };

        const copyToClipboard = () => {
        const textToCopy = `${bios}\n\n---\nBio gerada pelo App Profissão do Futuro.`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadPDF = async () => {
        if (!contentRef.current) return;
        setDownloadingPDF(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = contentRef.current;
            if (element.parentElement) element.parentElement.style.display = 'block';
            
            const opt = {
                margin:       [10, 10, 10, 10] as [number, number, number, number],
                filename:     'Bio_Gerada_IA.pdf',
                image:        { type: 'jpeg' as const, quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, windowWidth: 650, letterRendering: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };
            
            await html2pdf().set(opt).from(element).save();
            if (element.parentElement) element.parentElement.style.display = 'none';
        } catch (error) {
            console.error('Erro ao gerar PDF', error);
        } finally {
            setDownloadingPDF(false);
        }
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
                
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#E1306C] font-black text-[10px] uppercase tracking-[0.4em]">
                                <Instagram size={12} /> Gerador de Bio
                            </div>
                            <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                Bio do <span className="text-[#E1306C]">Instagram</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">
                                Receba 5 opções de bio profissional otimizadas para gerar autoridade e converter seguidores em clientes.
                            </p>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('novo')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'novo' ? 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <Plus size={18} /> Nova Bio
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <History size={18} /> Histórico
                        </button>
                    </div>
                </div>

                {activeTab === 'historico' ? (
                                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Seu Histórico</h2>
                        {loadingHistory ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-8 h-8 text-[#6C5DD3] animate-spin" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-12 text-gray-500 font-medium">
                                Você ainda não gerou nenhum histórico.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {history.map((item) => (
                                    <div key={item.id} className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:shadow-md'} transition-all flex flex-col justify-between`}>
                                        <div className="mb-4">
                                            <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Geração de {new Date(item.created_at).toLocaleDateString('pt-BR')}</h3>
                                            <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleTimeString('pt-BR')}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setBios(item.output_content);
                                                setActiveTab('novo');
                                            }}
                                            className={`w-full py-3 ${isDark ? 'bg-white/5 hover:bg-[#6C5DD3] text-white' : 'bg-white border border-gray-200 hover:border-[#6C5DD3] hover:text-[#6C5DD3] text-gray-700'} font-bold text-sm rounded-xl transition-all`}
                                        >
                                            Visualizar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : generating || bios ? (
                    <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} min-h-[500px] relative overflow-hidden`}>
                        {generating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-20">
                                <div className="relative">
                                    <div className="w-24 h-24 border-2 border-[#E1306C]/20 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-24 h-24 border-t-2 border-[#E1306C] rounded-full animate-spin relative z-10"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="text-[#E1306C] w-8 h-8 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-black tracking-widest text-[#E1306C] uppercase">Gerando suas Bios</p>
                                    <p className="text-sm text-gray-400 font-medium">Buscando palavras-chave e otimizando perfis...</p>
                                </div>
                            </div>
                        ) : bios ? (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E1306C]">Bios Geradas</span>
                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Suas 5 opções de bio estão prontas!</h3>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'} ${downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#E1306C] hover:border-[#E1306C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#E1306C] hover:text-white text-gray-700'}`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#E1306C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#c31960] transition-all shadow-lg shadow-[#E1306C]/20">
                                            <RotateCcw size={16} /> Gerar Novamente
                                        </button>
                                    </div>
                                </div>
                                <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`prose max-w-none ${isDark ? 'text-gray-300' : 'text-gray-700'}
                                        [&>p]:mb-6 [&>p]:leading-relaxed 
                                        [&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-[#E1306C]
                                        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-[#E1306C]
                                        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-6 
                                        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                                        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                                        [&_strong]:font-bold ${isDark ? '[&_strong]:text-white' : '[&_strong]:text-black'}
                                        font-medium leading-relaxed`}>
                                        <ReactMarkdown>{bios}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        {/* Hidden PDF container */}
                        <div style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}>
                            <div ref={contentRef} style={{ width: '650px', backgroundColor: '#ffffff', color: '#1f2937', padding: '40px', boxSizing: 'border-box' }} className="font-sans">
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', borderBottom: '2px solid #f3f4f6', paddingBottom: '20px' }}>
                                    <img src="/logo-original-si.png" alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
                                </div>
                                <div style={{ width: '100%', textAlign: 'left' }}>
                                    <div style={{ color: '#1f2937', fontSize: '13px', lineHeight: '1.7', wordBreak: 'break-word' }}>
                                        <div className="
                                            [&_p]:mb-3 [&_p]:leading-relaxed
                                            [&_h1]:text-xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[#E1306C]
                                            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[#E1306C]
                                            [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[#E1306C]
                                            [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ul_li]:mb-1
                                            [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3 [&_ol_li]:mb-1
                                            [&_strong]:font-bold [&_strong]:text-[#000000]
                                            [&_hr]:my-6 [&_hr]:border-[#e5e7eb]
                                            [&_h1]:break-after-avoid [&_h2]:break-after-avoid [&_h3]:break-after-avoid
                                            [&_li]:break-inside-avoid
                                        ">
                                            <ReactMarkdown>{bios}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#9ca3af' }}>
                                    Bio gerada pelo App Profissão do Futuro.
                                </div>
                            </div>
                        </div></div>
                ) : (
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
