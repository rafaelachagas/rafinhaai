'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    ArrowLeft, Send, Loader2, MessageSquare, RotateCcw, BarChart3, Bot, User, Settings2
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
        const { data: recent } = await supabase.from('messages').select('*').or(`recipient_id.eq.${profile?.id},recipient_id.is.null`).order('created_at', { ascending: false }).limit(5);
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
            else setFeedback('Erro ao gerar feedback.');
        } catch {
            setFeedback('Erro de conexão ao gerar feedback.');
        } finally {
            setLoadingFeedback(false);
        }
    };

    const handleReset = () => {
        setSetupDone(false);
        setMessages([]);
        setInput('');
        setShowFeedback(false);
        setFeedback('');
        setContexto({ produto: '', preco: '', nicho: '', dificuldade: 'Médio' });
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
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#10B981] font-black text-[10px] uppercase tracking-[0.4em]">
                        <MessageSquare size={12} />
                        Simulador de Negociação
                    </div>
                    <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        Treinamento de <span className="text-[#10B981]">Vendas</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-lg">
                        Pratique negociações com um cliente IA difícil. Ao final, receba um feedback completo com score de execução.
                    </p>
                </div>

                {!setupDone ? (
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
                ) : showFeedback ? (
                    /* ===== FEEDBACK ===== */
                    <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-8`}>
                        {loadingFeedback ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-6">
                                <div className="relative">
                                    <div className="w-20 h-20 border-t-2 border-[#10B981] rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center"><BarChart3 className="text-[#10B981] w-8 h-8" /></div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-bold text-[#10B981] uppercase tracking-widest">Analisando sua Performance</p>
                                    <p className="text-sm text-gray-400">Revisando cada mensagem da negociação...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#10B981]">Feedback Completo</span>
                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Sua análise de performance</h3>
                                    </div>
                                    <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#10B981] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20">
                                        <RotateCcw size={16} /> Nova Simulação
                                    </button>
                                </div>
                                <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-emerald font-medium leading-relaxed`}>
                                        <ReactMarkdown>{feedback}</ReactMarkdown>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    /* ===== CHAT ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className={`lg:col-span-9 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} flex flex-col overflow-hidden`} style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}>
                            {/* Chat Header */}
                            <div className={`px-8 py-5 border-b ${isDark ? 'border-white/5' : 'border-gray-100'} flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                                        <Bot size={20} className="text-[#10B981]" />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Cliente Simulado</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                                            <span className="text-[10px] text-gray-400 font-medium">Online • Dificuldade: {contexto.dificuldade}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{messages.length} msgs</span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex items-end gap-2 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#6C5DD3]/10' : 'bg-[#10B981]/10'}`}>
                                                {msg.role === 'user' ? <User size={14} className="text-[#6C5DD3]" /> : <Bot size={14} className="text-[#10B981]" />}
                                            </div>
                                            <div className={`px-5 py-3.5 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user'
                                                    ? 'bg-[#6C5DD3] text-white rounded-br-md'
                                                    : `${isDark ? 'bg-white/5 text-gray-200 border border-white/5' : 'bg-gray-100 text-gray-800'} rounded-bl-md`
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                    <div className="flex justify-start">
                                        <div className="flex items-end gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
                                                <Bot size={14} className="text-[#10B981]" />
                                            </div>
                                            <div className={`px-5 py-3.5 rounded-2xl rounded-bl-md ${isDark ? 'bg-white/5 border border-white/5' : 'bg-gray-100'}`}>
                                                <div className="flex gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div className={`px-6 py-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'} flex items-center gap-3`}>
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Digite sua mensagem de vendas..."
                                    disabled={sending}
                                    className={`flex-1 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#10B981]/40 transition-all`}
                                />
                                <button onClick={sendMessage} disabled={sending || !input.trim()} className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center hover:bg-[#059669] transition-all disabled:opacity-40 shrink-0">
                                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Sidebar Actions */}
                        <div className="lg:col-span-3 space-y-4">
                            <button onClick={requestFeedback} disabled={messages.length < 4} className={`w-full p-5 rounded-2xl border font-bold text-sm flex items-center gap-3 transition-all ${messages.length >= 4 ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/20 hover:scale-[1.02]' : `${isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400'} cursor-not-allowed`}`}>
                                <BarChart3 size={20} /> Finalizar e Ver Feedback
                            </button>
                            <button onClick={handleReset} className={`w-full p-4 rounded-2xl border ${isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'} font-bold text-sm flex items-center gap-3 transition-all`}>
                                <RotateCcw size={18} /> Reiniciar Simulação
                            </button>

                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-3`}>
                                <h4 className={`font-bold text-xs uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cenário Atual</h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between"><span className="text-gray-400">Produto</span><span className={`font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{contexto.produto || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">Preço</span><span className={`font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{contexto.preco || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">Dificuldade</span><span className={`font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{contexto.dificuldade}</span></div>
                                </div>
                            </div>

                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#10B981]/5 border-[#10B981]/10' : 'bg-[#10B981]/5 border-[#10B981]/10'}`}>
                                <p className="text-xs text-gray-400 leading-relaxed">💡 <strong>Dica:</strong> Troque pelo menos 4 mensagens antes de solicitar o feedback para uma análise mais completa.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
