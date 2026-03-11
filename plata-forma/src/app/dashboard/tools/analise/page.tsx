'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, Loader2, Copy, Check, ArrowLeft, BarChart3, Eye, Send, Download, History, Plus
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
            .eq('tool_type', 'analise')
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
            if (profile?.id) {
                await supabase.from('ai_content_history').insert([{ user_id: profile.id, tool_type: 'analise', input_data: { roteiro, plataforma, objetivo }, output_content: data.analise }]);
            }
            else setAnalise('Erro ao analisar roteiro. Tente novamente.');
        } catch {
            setAnalise('Erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => { setRoteiro(''); setPlataforma(''); setObjetivo(''); setAnalise(''); setActiveTab('novo'); };

        const copyToClipboard = () => {
        const textToCopy = `${analise}\n\n---\nAnálise gerada pelo App Profissão do Futuro.`;
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
                margin:       15,
                filename:     'Analise_Gerada_IA.pdf',
                image:        { type: 'jpeg' as const, quality: 1 },
                html2canvas:  { scale: 2, useCORS: true, windowWidth: 800, letterRendering: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
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

                {/* Back Button */}
                <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#6C5DD3]/10 group-hover:border-[#6C5DD3]/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para Ferramentas
                </button>

                {/* Page Title */}
                
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#FF754C] font-black text-[10px] uppercase tracking-[0.4em]">
                                <Eye size={12} /> Análise Inteligente
                            </div>
                            <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                Análise de <span className="text-[#FF754C]">Roteiro</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">
                                Cole seu roteiro abaixo e receba uma análise detalhada com nota, pontos fortes, melhorias e uma versão otimizada.
                            </p>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('novo')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'novo' ? 'bg-[#FF754C] text-white shadow-lg shadow-[#FF754C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <Plus size={18} /> Nova Análise
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-[#FF754C] text-white shadow-lg shadow-[#FF754C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
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
                                                setAnalise(item.output_content);
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
                ) : generating || analise ? (
                    <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} min-h-[500px] relative overflow-hidden`}>
                        {generating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-20">
                                <div className="relative">
                                    <div className="w-24 h-24 border-2 border-[#FF754C]/20 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-24 h-24 border-t-2 border-[#FF754C] rounded-full animate-spin relative z-10"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BarChart3 className="text-[#FF754C] w-8 h-8 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-black tracking-widest text-[#FF754C] uppercase">Analisando Roteiro</p>
                                    <p className="text-sm text-gray-400 font-medium">Buscando ganchos, métricas e oportunidades de ouro...</p>
                                </div>
                            </div>
                        ) : analise ? (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF754C]">Análise Completa</span>
                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Resultado da sua análise</h3>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'} ${downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#FF754C] hover:border-[#FF754C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#FF754C] hover:text-white text-gray-700'}`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF754C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#e5603c] transition-all shadow-lg shadow-[#FF754C]/20">
                                            <Eye size={16} /> Nova Análise
                                        </button>
                                    </div>
                                </div>
                                <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`prose max-w-none ${isDark ? 'text-gray-300' : 'text-gray-700'}
                                        [&>p]:mb-6 [&>p]:leading-relaxed 
                                        [&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-[#FF754C]
                                        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-[#FF754C]
                                        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-6 
                                        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                                        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                                        [&_strong]:font-bold ${isDark ? '[&_strong]:text-white' : '[&_strong]:text-black'}
                                        font-medium leading-relaxed`}>
                                        <ReactMarkdown>{analise}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                                                {/* Hidden PDF container */}
                        <div style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}>
                            <div ref={contentRef} style={{ width: '800px', backgroundColor: '#ffffff', color: '#1f2937', padding: '40px', boxSizing: 'border-box' }} className="font-sans">
                                {/* Logo */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '24px' }}>
                                    <img src="/logo-original-si.png" alt="Logo" style={{ height: '56px', objectFit: 'contain' }} />
                                </div>
                                
                                {/* Content */}
                                <div className="text-[#1f2937] text-sm" style={{ width: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    <div className="
                                        [&_p]:mb-4 [&_p]:leading-relaxed
                                        [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[#FF754C]
                                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-[#FF754C]
                                        [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[#FF754C]
                                        [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-4 [&_ul_li]:mb-1
                                        [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-4 [&_ol_li]:mb-1
                                        [&_strong]:font-bold [&_strong]:text-[#000000]
                                        [&_hr]:my-6 [&_hr]:border-[#e5e7eb]
                                    ">
                                        <ReactMarkdown>{analise}</ReactMarkdown>
                                    </div>
                                </div>
                                
                                {/* Footer */}
                                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                                    Análise gerada pelo App Profissão do Futuro.
                                </div>
                            </div>
                        </div></div>
                ) : (
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
                )}
            </main>
        </div>
    );
}
