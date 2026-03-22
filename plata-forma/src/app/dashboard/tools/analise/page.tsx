'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, Loader2, Copy, Check, ArrowLeft, BarChart3, Eye, Send, History, Download, Plus
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
    const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [pdfSettings, setPdfSettings] = useState({
        logo: '/logo-original-si.png',
        footer: 'Análise gerada pelo App Profissão do Futuro.',
        filename: 'Analise_Roteiro'
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
                    footer: parsed.footer_analise || parsed.footer_roteiro || 'Análise gerada pelo App Profissão do Futuro.',
                    filename: parsed.filename_analise || 'Analise_Roteiro'
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
            .eq('tool_type', 'analise')
            .order('created_at', { ascending: false });
        if (data) setHistory(data);
        setLoadingHistory(false);
    };

    useEffect(() => {
        if (activeTab === 'historico') fetchHistory();
    }, [activeTab, profile]);

    const handleAnalyze = async () => {
        if (!roteiro.trim()) return;
        setGenerating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/ai/analise', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ roteiro, plataforma, objetivo }),
            });
            const data = await res.json();
            if (data.analise) {
                setAnalise(data.analise);
                if (profile?.id) {
                    const { data: curr } = await supabase.from('profiles').select('ai_tools_used').eq('id', profile.id).single();
                    await supabase.from('profiles').update({
                        ai_tools_used: (curr?.ai_tools_used || 0) + 1
                    }).eq('id', profile.id);

                    await supabase.from('ai_content_history').insert([{
                        user_id: profile.id,
                        tool_type: 'analise',
                        input_data: { roteiro, plataforma, objetivo },
                        output_content: data.analise
                    }]);
                }
            } else setAnalise(data.error || 'Erro ao analisar roteiro. Tente novamente.');
        } catch {
            setAnalise('Erro de conexão. Verifique sua internet.');
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
        } catch (e) {
            console.error('PDF Error:', e);
        } finally {
            setDownloadingPDF(false);
        }
    };

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />

                {/* Back & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                        <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#FF754C]/10 group-hover:border-[#FF754C]/20 transition-all`}>
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        Voltar para Ferramentas
                    </button>

                    <div className="flex items-center gap-4">
                        <button onClick={() => { handleReset(); setActiveTab('novo'); }} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'novo' ? 'bg-[#FF754C] text-white shadow-lg shadow-[#FF754C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <Plus size={18} /> Nova Análise
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-[#FF754C] text-white shadow-lg shadow-[#FF754C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <History size={18} /> Histórico
                        </button>
                    </div>
                </div>

                {activeTab === 'historico' ? (
                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} animate-in fade-in duration-300`}>
                        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Histórico de Análises</h2>
                        {loadingHistory ? (
                            <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-[#FF754C] animate-spin" /></div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-12 text-gray-500 font-medium">Você ainda não realizou nenhuma análise.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {history.map((item) => (
                                    <div key={item.id} className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:shadow-md'} transition-all flex flex-col`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#FF754C]/10 flex items-center justify-center">
                                                <BarChart3 size={20} className="text-[#FF754C]" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className={`font-bold mb-4 line-clamp-2 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                            Análise: {item.input_data?.plataforma || 'Geral'}
                                        </h3>
                                        <button
                                            onClick={() => { setAnalise(item.output_content); setActiveTab('novo'); }}
                                            className={`w-full py-3 ${isDark ? 'bg-white/5 hover:bg-[#FF754C]' : 'bg-white border border-gray-200 hover:border-[#FF754C] hover:text-[#FF754C]'} font-bold text-xs uppercase tracking-widest rounded-xl transition-all`}
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

                        {!analise && !generating && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                                <div className="lg:col-span-8">
                                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-6 shadow-sm`}>
                                        <div className="space-y-3">
                                            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cole seu roteiro aqui *</label>
                                            <textarea
                                                value={roteiro}
                                                onChange={(e) => setRoteiro(e.target.value)}
                                                placeholder="Cole o roteiro completo que você quer analisar..."
                                                rows={14}
                                                className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-6 py-5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FF754C]/40 transition-all resize-none shadow-inner`}
                                            />
                                            <p className="text-[10px] text-gray-400 font-medium">{roteiro.length} caracteres</p>
                                        </div>

                                        <button
                                            onClick={handleAnalyze}
                                            disabled={generating || !roteiro.trim()}
                                            className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#FF754C] to-[#FF5722] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-[#FF754C]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><BarChart3 size={20} /> Analisar Roteiro</>}
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 space-y-6">
                                    <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-4 shadow-sm`}>
                                        <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plataforma (opcional)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Instagram', 'TikTok', 'YouTube', 'Stories'].map(opt => (
                                                <button key={opt} onClick={() => setPlataforma(opt)} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${plataforma === opt ? 'bg-[#FF754C] border-[#FF754C] text-white shadow-lg shadow-[#FF754C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#FF754C]/5'}`}`}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-4 shadow-sm`}>
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
                        )}

                        {generating && (
                            <div className={`p-10 lg:p-20 rounded-[3rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'} flex flex-col items-center justify-center gap-10 text-center min-h-[500px] animate-in zoom-in-95 duration-500`}>
                                <div className="relative">
                                    <div className="w-24 h-24 border-4 border-[#FF754C]/10 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-24 h-24 border-t-4 border-[#FF754C] rounded-full animate-spin relative z-10"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BarChart3 className="text-[#FF754C] w-10 h-10 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className={`text-2xl font-black uppercase tracking-widest text-[#FF754C]`}>Analisando Roteiro</h3>
                                    <p className="text-gray-400 font-medium max-w-xs mx-auto">Buscando ganchos, métricas e oportunidades de ouro...</p>
                                </div>
                            </div>
                        )}

                        {analise && !generating && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
                                <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-8 shadow-sm`}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF754C] block mb-2">Análise Completa</span>
                                            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Resultado da sua análise</h3>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <button onClick={downloadPDF} disabled={downloadingPDF} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'}`}>
                                                {downloadingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                                <span>Salvar PDF</span>
                                            </button>
                                            <button onClick={copyToClipboard} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#FF754C] hover:border-[#FF754C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#FF754C] hover:text-white text-gray-700'}`}>
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                                            </button>
                                            <button onClick={handleReset} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#FF754C] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-[#e66a45] transition-all shadow-xl shadow-[#FF754C]/20">
                                                <Sparkles size={16} /> Nova Análise
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`p-10 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100 shadow-inner'}`}>
                                        <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} font-medium leading-relaxed
                                            [&_h1]:text-current [&_h1]:font-black [&_h1]:mb-6
                                            [&_h2]:text-current [&_h2]:font-bold [&_h2]:mb-4
                                            [&_h3]:text-current [&_h3]:font-bold [&_h3]:mb-3
                                            [&_strong]:text-current [&_strong]:font-bold
                                            text-base lg:text-lg ${isDark ? 'text-gray-300' : 'text-[#1B1D21]'}`}>
                                            <ReactMarkdown>{analise}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* PDF Container */}
                                    <div style={{ display: 'none', position: 'absolute', top: '-9999px' }}>
                                        <div ref={contentRef} style={{ width: '794px', padding: '60px', background: 'white', color: '#000000', fontFamily: 'sans-serif' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #FF754C', paddingBottom: '20px' }}>
                                                <h1 style={{ color: '#FF754C', fontSize: '28px', fontWeight: '900', margin: 0 }}>ANÁLISE DE ROTEIRO</h1>
                                                {pdfSettings.logo && <img src={pdfSettings.logo} crossOrigin="anonymous" style={{ height: '40px' }} />}
                                            </div>
                                            <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#1a1a1a' }}>
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({node, ...props}) => <h1 style={{ color: '#000000', fontSize: '22px', fontWeight: 'bold', marginTop: '30px', borderLeft: '4px solid #FF754C', paddingLeft: '15px' }} {...props} />,
                                                        h2: ({node, ...props}) => <h2 style={{ color: '#000000', fontSize: '18px', fontWeight: 'bold', marginTop: '25px' }} {...props} />,
                                                        p: ({node, ...props}) => <p style={{ marginBottom: '15px' }} {...props} />,
                                                        strong: ({node, ...props}) => <strong style={{ color: '#000000', fontWeight: 'bold' }} {...props} />,
                                                        ul: ({node, ...props}) => <ul style={{ marginLeft: '25px', marginBottom: '20px' }} {...props} />,
                                                        li: ({node, ...props}) => <li style={{ marginBottom: '8px' }} {...props} />,
                                                    }}
                                                >
                                                    {analise}
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
