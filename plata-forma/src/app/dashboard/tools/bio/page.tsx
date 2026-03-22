'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, Loader2, Copy, Check, ArrowLeft, Instagram, AtSign, RotateCcw, History, Download, Plus
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
    const [pdfSettings, setPdfSettings] = useState({
        logo: '/logo-original-si.png',
        footer: 'Bio gerada pelo App Profissão do Futuro.',
        filename: 'Bio_Inteligente'
    });

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
                fetchSettings();
            }
        }
    }, [profile, themeLoading, router]);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase.from('platform_settings').select('value').eq('key', 'pdf_settings').single();
            if (data?.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                setPdfSettings({
                    logo: parsed.logo_url || '/logo-original-si.png',
                    footer: parsed.footer_bio || parsed.footer_roteiro || 'Bio gerada pelo App Profissão do Futuro.',
                    filename: parsed.filename_bio || 'Bio_Inteligente'
                });
            }
        } catch (e) { /* settings not initialized */ }
    };

    async function fetchUnreadCount() {
        if (!profile?.id) return;
        const { data: recent } = await supabase.from('messages').select('*').or(`recipient_id.eq.${profile?.id},recipient_id.is.null`).order('created_at', { ascending: false }).limit(5);
        if (recent) setRecentMessages(recent);
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).or(`recipient_id.eq.${profile?.id},recipient_id.is.null`).eq('is_read', false);
        if (count !== null) setUnreadCount(count);
    }

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

    const handleGenerate = async () => {
        if (!formData.nicho || !formData.publicoAlvo) return;
        setGenerating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/ai/bio', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.bios) {
                setBios(data.bios);
                if (profile?.id) {
                    const { data: curr } = await supabase.from('profiles').select('ai_tools_used').eq('id', profile.id).single();
                    await supabase.from('profiles').update({
                        ai_tools_used: (curr?.ai_tools_used || 0) + 1
                    }).eq('id', profile.id);

                    await supabase.from('ai_content_history').insert([{
                        user_id: profile.id, tool_type: 'bio',
                        input_data: formData,
                        output_content: data.bios
                    }]);
                }
            } else setBios(data.error || 'Erro ao gerar bio. Tente novamente.');
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

    const downloadPDF = async () => {
        if (!contentRef.current) return;
        setDownloadingPDF(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin: 0,
                filename: `${pdfSettings.filename}_${new Date().getTime()}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, windowWidth: 794, letterRendering: true },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };
            await html2pdf().set(opt).from(contentRef.current).save();
        } catch (e) { console.error('PDF Error:', e); }
        finally { setDownloadingPDF(false); }
    };

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />

                {/* Back & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                        <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#E1306C]/10 group-hover:border-[#E1306C]/20 transition-all`}>
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        Voltar para Ferramentas
                    </button>

                    <div className="flex items-center gap-4">
                        <button onClick={() => { handleReset(); setActiveTab('novo'); }} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'novo' ? 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <Plus size={18} /> Nova Bio
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <History size={18} /> Histórico
                        </button>
                    </div>
                </div>

                {activeTab === 'historico' ? (
                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} animate-in fade-in duration-300`}>
                        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Histórico de Bios</h2>
                        {loadingHistory ? (
                            <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-[#E1306C] animate-spin" /></div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-12 text-gray-500 font-medium">Você ainda não gerou nenhuma bio.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {history.map((item) => (
                                    <div key={item.id} className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:shadow-md'} transition-all flex flex-col`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#E1306C]/10 flex items-center justify-center">
                                                <AtSign size={20} className="text-[#E1306C]" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className={`font-bold mb-4 line-clamp-2 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                            Bio: {item.input_data?.nome || 'Perfil'}
                                        </h3>
                                        <button
                                            onClick={() => { setBios(item.output_content); setActiveTab('novo'); }}
                                            className={`w-full py-3 ${isDark ? 'bg-white/5 hover:bg-[#E1306C]' : 'bg-white border border-gray-200 hover:border-[#E1306C] hover:text-[#E1306C]'} font-bold text-xs uppercase tracking-widest rounded-xl transition-all`}
                                        >
                                            Ver Resultado
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
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

                        {!bios && !generating && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                                <div className="lg:col-span-7">
                                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-6 shadow-sm`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InputField label="Nome ou Marca" value={formData.nome} onChange={(v: string) => setFormData({ ...formData, nome: v })} placeholder="Maria" isDark={isDark} />
                                            <InputField label="Nicho *" value={formData.nicho} onChange={(v: string) => setFormData({ ...formData, nicho: v })} placeholder="Skincare & Moda" isDark={isDark} required />
                                            <InputField label="Público-alvo *" value={formData.publicoAlvo} onChange={(v: string) => setFormData({ ...formData, publicoAlvo: v })} placeholder="Marcas do nicho de skincare e moda" isDark={isDark} required />
                                            <InputField label="Resultados/Conquistas" value={formData.resultados} onChange={(v: string) => setFormData({ ...formData, resultados: v })} placeholder="+200 trabalhos realizados..." isDark={isDark} />
                                            <InputField label="Diferenciais" value={formData.diferenciais} onChange={(v: string) => setFormData({ ...formData, diferenciais: v })} placeholder="Eu já trabalhei com as maiores de skincare..." isDark={isDark} className="md:col-span-2" />
                                        </div>

                                        <div className="space-y-3">
                                            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tom de Voz</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Profissional', 'Descontraído', 'Empoderado', 'Minimalista', 'Aspiracional'].map(t => (
                                                    <button key={t} onClick={() => setFormData({ ...formData, tomVoz: t })} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${formData.tomVoz === t ? 'bg-[#E1306C] border-[#E1306C] text-white shadow-lg shadow-[#E1306C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#E1306C]/5'}`}`}>
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Objetivo do Perfil</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Vender', 'Gerar Autoridade', 'Captar Leads', 'Crescer Seguidores', 'Networking'].map(o => (
                                                    <button key={o} onClick={() => setFormData({ ...formData, objetivo: o })} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${formData.objetivo === o ? 'bg-[#E1306C] border-[#E1306C] text-white shadow-lg shadow-[#E1306C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#E1306C]/5'}`}`}>
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button onClick={handleGenerate} disabled={generating || !formData.nicho || !formData.publicoAlvo} className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#E1306C] to-[#C13584] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-[#E1306C]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles size={20} /> Gerar 5 Bios</>}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 space-y-6">
                                    {/* Preview Card */}
                                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} shadow-sm`}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-0.5">
                                                <div className={`w-full h-full rounded-full ${isDark ? 'bg-[#1A1D1F]' : 'bg-white'} flex items-center justify-center`}>
                                                    <AtSign size={28} className="text-[#E1306C]" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className={`font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{formData.nome || 'Maria'}</h4>
                                                <p className="text-xs text-gray-400">{formData.nicho || 'Skincare & Moda'}</p>
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} min-h-[140px] flex items-center justify-center`}>
                                            <p className="text-xs text-gray-400 text-center italic">Suas bios aparecerão aqui após gerar...</p>
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-gradient-to-br from-[#E1306C]/5 to-transparent border-[#E1306C]/10' : 'bg-[#E1306C]/5 border-[#E1306C]/10'} shadow-sm`}>
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

                        {generating && (
                            <div className={`p-10 lg:p-20 rounded-[3rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'} flex flex-col items-center justify-center gap-10 text-center min-h-[500px] animate-in zoom-in-95 duration-500`}>
                                <div className="relative">
                                    <div className="w-24 h-24 border-4 border-[#E1306C]/10 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-24 h-24 border-t-4 border-[#E1306C] rounded-full animate-spin relative z-10"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="text-[#E1306C] w-10 h-10 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className={`text-2xl font-black uppercase tracking-widest text-[#E1306C]`}>Gerando suas Bios</h3>
                                    <p className="text-gray-400 font-medium max-w-xs mx-auto">Buscando palavras-chave e otimizando perfis...</p>
                                </div>
                            </div>
                        )}

                        {bios && !generating && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
                                <div className={`p-8 lg:p-12 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-10 shadow-sm`}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E1306C] block mb-2">Bios Geradas</span>
                                            <h3 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Suas 5 opções de <span className="text-[#E1306C]">Bio</span> estão prontas!</h3>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <button onClick={downloadPDF} disabled={downloadingPDF} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'}`}>
                                                {downloadingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                                <span>Salvar PDF</span>
                                            </button>
                                            <button onClick={copyToClipboard} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#E1306C] hover:border-[#E1306C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#E1306C] hover:text-white text-gray-700'}`}>
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                                            </button>
                                            <button onClick={handleReset} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E1306C] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-[#c31960] transition-all shadow-xl shadow-[#E1306C]/20">
                                                <RotateCcw size={16} /> Nova Bio
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`p-10 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100 shadow-inner'}`}>
                                        <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-pink font-medium leading-relaxed
                                            [&_h1]:text-[#E1306C] [&_h2]:text-[#E1306C] [&_h3]:text-[#E1306C]
                                            [&_strong]:text-[#E1306C] [&_strong]:font-extrabold
                                            text-base lg:text-lg`}>
                                            <ReactMarkdown>{bios}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* PDF Container */}
                                    <div style={{ display: 'none', position: 'absolute', top: '-9999px' }}>
                                        <div ref={contentRef} style={{ width: '794px', padding: '60px', background: 'white', color: '#000000', fontFamily: 'sans-serif' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #E1306C', paddingBottom: '20px' }}>
                                                <h1 style={{ color: '#E1306C', fontSize: '28px', fontWeight: '900', margin: 0 }}>CRIADOR DE BIO</h1>
                                                {pdfSettings.logo && <img src={pdfSettings.logo} crossOrigin="anonymous" style={{ height: '40px' }} />}
                                            </div>
                                            <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({node, ...props}) => <h1 style={{ color: '#E1306C', fontSize: '22px', fontWeight: 'bold', marginTop: '30px', borderLeft: '4px solid #E1306C', paddingLeft: '15px' }} {...props} />,
                                                        h2: ({node, ...props}) => <h2 style={{ color: '#E1306C', fontSize: '18px', fontWeight: 'bold', marginTop: '25px' }} {...props} />,
                                                        p: ({node, ...props}) => <p style={{ marginBottom: '15px' }} {...props} />,
                                                        strong: ({node, ...props}) => <strong style={{ color: '#E1306C', fontWeight: 'bold' }} {...props} />,
                                                        ul: ({node, ...props}) => <ul style={{ marginLeft: '25px', marginBottom: '20px' }} {...props} />,
                                                        li: ({node, ...props}) => <li style={{ marginBottom: '8px' }} {...props} />,
                                                    }}
                                                >
                                                    {bios}
                                                </ReactMarkdown>
                                            </div>
                                            <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                                                <p style={{ fontSize: '10px', color: '#999' }}>{pdfSettings.footer}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder, isDark, required, className = '' }: any) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#E1306C]/40 transition-all shadow-inner`} />
        </div>
    );
}
