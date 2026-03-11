'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    ArrowLeft, Send, Loader2, MessageSquare, RotateCcw, BarChart3, Bot, User, Settings2, Download, History, Plus, Check, Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = { role: 'user' | 'assistant'; content: string };

export default function NegociacaoPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Setup
    const [setupDone, setSetupDone] = useState(false);
    const [contexto, setContexto] = useState({
        produto: '', preco: '', nicho: '', dificuldade: 'Médio'
    });

    // Chat
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchUnreadCount() {
        if (!profile?.id) return;
        const { data: recent }

    const fetchHistory = async () => {
        if (!profile?.id) return;
        setLoadingHistory(true);
        const { data } = await supabase
            .from('ai_content_history')
            .select('*')
            .eq('user_id', profile.id)
            .eq('tool_type', 'negociacao')
            .order('created_at', { ascending: false });
        
        if (data) setHistory(data);
        setLoadingHistory(false);
    };

    useEffect(() => {
        if (activeTab === 'historico') fetchHistory();
    }, [activeTab, profile]); = await supabase.from('messages').select('*').or(`recipient_id.eq.${profile?.id},recipient_id.is.null`).order('created_at', { ascending: false }).limit(5);
        if (recent) setRecentMessages(recent);
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).or(`recipient_id.eq.${profile?.id},recipient_id.is.null`).eq('is_read', false);
        if (count !== null) setUnreadCount(count);
    }

    const startChat = async () => {
        setSetupDone(true);
        // Send initial message to get the client's first response
        const initialMessages: Message[] = [
            { role: 'user', content: `Olá! Tudo bem? Eu vi que você tem interesse no nosso ${contexto.produto || 'produto'}. Posso te contar mais sobre ele?` }
        ];
        setMessages(initialMessages);
        setSending(true);

        try {
            const res = await fetch('/api/ai/negociacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: initialMessages, contexto }),
            });
            const data = await res.json();
            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Hmm, tô um pouco ocupado agora. Pode ser rápido?' }]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const userMessage: Message = { role: 'user', content: input.trim() };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setSending(true);

        try {
            const res = await fetch('/api/ai/negociacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages, contexto }),
            });
            const data = await res.json();
            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpa, perdi a conexão. Pode repetir?' }]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const requestFeedback = async () => {
        setShowFeedback(true);
        setLoadingFeedback(true);
        try {
            const res = await fetch('/api/ai/negociacao/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, contexto }),
            });
            const data = await res.json();
            if (data.feedback) setFeedback(data.feedback);
            if (profile?.id) {
                await supabase.from('ai_content_history').insert([{ user_id: profile.id, tool_type: 'negociacao', input_data: { contexto, messages }, output_content: data.feedback }]);
            }
            else setFeedback('Erro ao gerar feedback.');
        } catch {
            setFeedback('Erro de conexão ao gerar feedback.');
        } finally {
            setLoadingFeedback(false);
        }
    };

    const handleReset = () => { setSetupDone(false); setMessages([]); setInput(''); setShowFeedback(false); setFeedback(''); setContexto({ produto: '', preco: '', nicho: '', dificuldade: 'Médio' }); setActiveTab('novo'); };

    const copyToClipboard = () => {
        const textToCopy = `${feedback}\n\n---\nNegociação gerada pelo App Profissão do Futuro.`;
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
            element.parentElement.classList.remove('h-0', 'w-0', 'overflow-hidden');
            
            const opt = {
                margin:       15,
                filename:     'Simulacao_Vendas_IA.pdf',
                image:        { type: 'jpeg' as const, quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 800 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };
            
            await html2pdf().set(opt).from(element).save();
            element.parentElement.classList.add('h-0', 'w-0', 'overflow-hidden');
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
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#10B981]/10 group-hover:border-[#10B981]/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para Ferramentas
                </button>

                {/* Page Title */}
                
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#10B981] font-black text-[10px] uppercase tracking-[0.4em]">
                                <MessageSquare size={12} /> Simulador de Negociação
                            </div>
                            <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                Treinamento de <span className="text-[#10B981]">Vendas</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">
                                Pratique negociações com um cliente IA difícil. Ao final, receba um feedback completo com score de execução.
                            </p>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('novo')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'novo' ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <Plus size={18} /> Nova Simulação
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
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
                                                setFeedback(item.output_content);
                                                setShowFeedback(true); setSetupDone(true); setActiveTab('novo');
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
                ) : !setupDone ? (
                    /* ===== SETUP ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-6`}>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 flex items-center justify-center">
                                    <Settings2 size={26} className="text-[#10B981]" />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Configure a Simulação</h3>
                                    <p className="text-sm text-gray-400">Defina o cenário da negociação</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Produto/Serviço *</label>
                                    <input value={contexto.produto} onChange={(e) => setContexto({ ...contexto, produto: e.target.value })} placeholder="Ex: Mentoria de Marketing Digital" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#10B981]/40 transition-all`} />
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Preço</label>
                                    <input value={contexto.preco} onChange={(e) => setContexto({ ...contexto, preco: e.target.value })} placeholder="Ex: R$ 997" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#10B981]/40 transition-all`} />
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nicho</label>
                                    <input value={contexto.nicho} onChange={(e) => setContexto({ ...contexto, nicho: e.target.value })} placeholder="Ex: Emagrecimento" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#10B981]/40 transition-all`} />
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nível de Dificuldade</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Fácil', 'Médio', 'Difícil'].map(d => (
                                            <button key={d} onClick={() => setContexto({ ...contexto, dificuldade: d })} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${contexto.dificuldade === d ? 'bg-[#10B981] border-[#10B981] text-white shadow-lg shadow-[#10B981]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#10B981]/5'}`}`}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button onClick={startChat} disabled={!contexto.produto.trim()} className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-[#10B981]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                <MessageSquare size={20} /> Iniciar Negociação
                            </button>
                        </div>

                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-gradient-to-br from-[#10B981]/5 to-transparent border-[#10B981]/10' : 'bg-[#10B981]/5 border-[#10B981]/10'} flex flex-col justify-center`}>
                            <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>🎯 Como Funciona</h3>
                            <div className="space-y-5">
                                {[
                                    { step: '1', title: 'Configure o cenário', desc: 'Defina produto, preço e dificuldade da simulação.' },
                                    { step: '2', title: 'Negocie com o cliente IA', desc: 'A IA simula um cliente real com objeções e resistências.' },
                                    { step: '3', title: 'Receba feedback detalhado', desc: 'Ao final, receba score de execução e plano de evolução.' }
                                ].map(item => (
                                    <div key={item.step} className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-bold text-sm shrink-0">{item.step}</div>
                                        <div>
                                            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{item.title}</h4>
                                            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
                ) : showFeedback ? (
                    <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-8 min-h-[500px] relative overflow-hidden`}>
                        {loadingFeedback ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center py-20 gap-6 bg-white/10 dark:bg-black/10 backdrop-blur-md z-20">
                                <div className="relative">
                                    <div className="w-24 h-24 border-2 border-[#10B981]/20 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-24 h-24 border-t-2 border-[#10B981] rounded-full animate-spin relative z-10"></div>
                                    <div className="absolute inset-0 flex items-center justify-center"><BarChart3 className="text-[#10B981] w-8 h-8 animate-pulse" /></div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-bold text-[#10B981] uppercase tracking-widest">Analisando Performance</p>
                                    <p className="text-sm text-gray-400">Revisando cada mensagem da negociação...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10B981]">Feedback Completo</span>
                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Sua análise de performance</h3>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'} ${downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#10B981] hover:border-[#10B981] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#10B981] hover:text-white text-gray-700'}`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#10B981] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20">
                                            <RotateCcw size={16} /> Nova Simulação
                                        </button>
                                    </div>
                                </div>
                                <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`prose max-w-none ${isDark ? 'text-gray-300' : 'text-gray-700'}
                                        [&>p]:mb-6 [&>p]:leading-relaxed 
                                        [&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-[#10B981]
                                        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-[#10B981]
                                        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-6 
                                        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                                        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                                        [&_strong]:font-bold ${isDark ? '[&_strong]:text-white' : '[&_strong]:text-black'}
                                        font-medium leading-relaxed`}>
                                        <ReactMarkdown>{feedback}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                                                {/* Hidden PDF container */}
                        <div className="absolute h-0 w-0 overflow-hidden">
                            <div ref={contentRef} style={{ width: '800px', padding: '40px', backgroundColor: '#ffffff', color: '#1f2937' }} className="font-sans break-words">
                                {/* Logo */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '24px' }}>
                                    <img src="/logo-original-si.png" alt="Logo" style={{ height: '56px', objectFit: 'contain' }} />
                                </div>
                                {/* Content */}
                                <div className="text-[#1f2937] text-sm
                                    [&_p]:mb-4 [&_p]:leading-relaxed
                                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[#10B981]
                                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-[#10B981]
                                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[#10B981]
                                    [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-4 [&_ul_li]:mb-1
                                    [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-4 [&_ol_li]:mb-1
                                    [&_strong]:font-bold [&_strong]:text-[#000000]
                                    [&_hr]:my-6 [&_hr]:border-[#e5e7eb]">
                                    <ReactMarkdown>{feedback}</ReactMarkdown>
                                </div>
                                {/* Footer */}
                                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                                    Simulação de Vendas gerada pelo App Profissão do Futuro.
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== CHAT ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className={`lg:col-span-9 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} flex flex-col overflow-hidden`} style={{ height: 'calc(100vh - 350px)
                )}
            </main>
        </div>
    );
}
