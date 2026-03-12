'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, PenTool, Loader2, Copy, Check, ArrowLeft, ArrowRight,
    Target, Users, ShoppingBag, Monitor, Megaphone, MessageCircle, ChevronRight, Download, History, Plus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const STEPS = [
    { id: 'nicho', label: 'Nicho', icon: Target, question: 'Qual é o seu nicho de atuação?', placeholder: 'Ex: Marketing Digital, Fitness, Finanças, Beleza, Gastronomia...', type: 'text' },
    { id: 'avatar', label: 'Avatar', icon: Users, question: 'Quem é o seu público-alvo (avatar)?', placeholder: 'Ex: Mulheres de 25-35 anos que querem emagrecer sem dieta restritiva...', type: 'textarea' },
    { id: 'produto', label: 'Produto', icon: ShoppingBag, question: 'Qual produto ou serviço você está vendendo?', placeholder: 'Ex: Curso online de marketing digital, mentoria, consultoria...', type: 'text' },
    { id: 'plataforma', label: 'Plataforma', icon: Monitor, question: 'Onde esse vídeo será publicado?', placeholder: '', type: 'select', options: ['Instagram Reels', 'TikTok', 'YouTube Shorts', 'YouTube Longo', 'Stories', 'Feed'] },
    { id: 'objetivo', label: 'Objetivo', icon: Megaphone, question: 'Qual o objetivo principal do vídeo?', placeholder: '', type: 'select', options: ['Gerar vendas diretas', 'Captar leads', 'Gerar autoridade', 'Engajamento e viralizar', 'Educar o público', 'Lançamento de produto'] },
    { id: 'tomVoz', label: 'Tom', icon: MessageCircle, question: 'Qual tom de voz você quer usar?', placeholder: '', type: 'select', options: ['Persuasivo e direto', 'Empático e acolhedor', 'Enérgico e motivacional', 'Educativo e sério', 'Divertido e leve', 'Provocador e polêmico'] },
];

export default function RoteiroPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Triage state
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, string>>({
        nicho: '', avatar: '', produto: '', plataforma: '', objetivo: '', tomVoz: ''
    });
    const [triageCompleted, setTriageCompleted] = useState(false);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [script, setScript] = useState('');
    const [copied, setCopied] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    // History state
    const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [pdfSettings, setPdfSettings] = useState({
        logo: '/logo-original-si.png',
        footer: 'Roteiro gerado pelo App Profissão do Futuro.'
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
            }
        }
    }, [profile, themeLoading, router]);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase.from('platform_settings').select('value').eq('key', 'pdf_settings').single();
            if (data?.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                setPdfSettings({
                    logo: parsed.logo_url !== undefined ? parsed.logo_url : '/logo-original-si.png',
                    footer: parsed.footer_roteiro || 'Roteiro gerado pelo App Profissão do Futuro.'
                });
            }
        } catch (e) {
            // Settings not initialized yet
        }
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
            .eq('tool_type', 'roteiro')
            .order('created_at', { ascending: false });
        
        if (data) setHistory(data);
        setLoadingHistory(false);
    };

    useEffect(() => {
        if (activeTab === 'historico') {
            fetchHistory();
        }
    }, [activeTab, profile]);

    const currentField = STEPS[currentStep];
    const canProceed = formData[currentField?.id]?.trim().length > 0;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setTriageCompleted(true);
            handleGenerate();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/ai/roteiros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.script) {
                setScript(data.script);
                // Salvar no histórico
                if (profile?.id) {
                    await supabase.from('ai_content_history').insert([{
                        user_id: profile.id,
                        tool_type: 'roteiro',
                        input_data: formData,
                        output_content: data.script
                    }]);
                }
            } else {
                setScript('Erro ao gerar roteiro. Tente novamente.');
            }
        } catch {
            setScript('Erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => {
        setCurrentStep(0);
        setFormData({ nicho: '', avatar: '', produto: '', plataforma: '', objetivo: '', tomVoz: '' });
        setTriageCompleted(false);
        setScript('');
        setActiveTab('novo');
    };

    const copyToClipboard = () => {
        const textToCopy = `${script}\n\n---\nRoteiro gerado pelo App Profissão do Futuro.`;
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
                margin:       [10, 0, 10, 0] as [number, number, number, number],
                filename:     'Roteiro_Gerado_IA.pdf',
                image:        { type: 'jpeg' as const, quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, windowWidth: 794, letterRendering: true },
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

                {/* Back Button */}
                <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#6C5DD3]/10 group-hover:border-[#6C5DD3]/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para Ferramentas
                </button>

                {/* Page Title & Tabs */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#6C5DD3] font-black text-[10px] uppercase tracking-[0.4em]">
                                <Sparkles size={12} />
                                Gerador de Roteiros com IA
                            </div>
                            <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                Criar <span className="text-[#6C5DD3]">Roteiro</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-md">
                                Responda a triagem abaixo e receba um roteiro altamente personalizado para o seu conteúdo.
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setActiveTab('novo')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'novo' ? 'bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                        >
                            <Plus size={18} /> Novo Roteiro
                        </button>
                        <button 
                            onClick={() => setActiveTab('historico')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                        >
                            <History size={18} /> Histórico
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {activeTab === 'historico' ? (
                    <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                        <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Seu Histórico de Roteiros</h2>
                        {loadingHistory ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-8 h-8 text-[#6C5DD3] animate-spin" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-12 text-gray-500">
                                Você ainda não gerou nenhum roteiro.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {history.map((item) => (
                                    <div key={item.id} className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:shadow-md'} transition-all flex flex-col justify-between`}>
                                        <div className="mb-4">
                                            <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.input_data.produto || 'Roteiro Gerado'}</h3>
                                            <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap mb-4">
                                            <span className="text-xs px-3 py-1 bg-[#6C5DD3]/10 text-[#6C5DD3] font-bold rounded-lg">{item.input_data.plataforma}</span>
                                            <span className="text-xs px-3 py-1 bg-gray-200 dark:bg-black/30 rounded-lg text-gray-600 dark:text-gray-400">{item.input_data.nicho}</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setScript(item.output_content);
                                                setTriageCompleted(true);
                                                setActiveTab('novo');
                                            }}
                                            className={`w-full py-3 ${isDark ? 'bg-white/5 hover:bg-[#6C5DD3] text-white' : 'bg-white border border-gray-200 hover:border-[#6C5DD3] hover:text-[#6C5DD3] text-gray-700'} font-bold text-sm rounded-xl transition-all`}
                                        >
                                            Visualizar Roteiro
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : !triageCompleted ? (
                    /* ===== TRIAGE FORM ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Progress Steps */}
                        <div className="lg:col-span-3">
                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} space-y-2`}>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Etapas da Triagem</p>
                                {STEPS.map((step, i) => (
                                    <div key={step.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${i === currentStep ? `${isDark ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]' : 'bg-[#6C5DD3]/5 text-[#6C5DD3]'} font-bold` :
                                            i < currentStep ? `${isDark ? 'text-green-400' : 'text-green-600'}` :
                                                'text-gray-400'
                                        }`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === currentStep ? 'bg-[#6C5DD3] text-white' :
                                                i < currentStep ? 'bg-green-500/20 text-green-500' :
                                                    `${isDark ? 'bg-white/5' : 'bg-gray-100'}`
                                            }`}>
                                            {i < currentStep ? '✓' : i + 1}
                                        </div>
                                        <span className="text-sm font-medium">{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Current Question */}
                        <div className="lg:col-span-9">
                            <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} min-h-[400px] flex flex-col justify-between relative overflow-hidden`}>
                                <div className={`absolute top-0 right-0 w-40 h-40 bg-[#6C5DD3] rounded-full mix-blend-multiply filter blur-[80px] opacity-10 ${isDark ? 'mix-blend-lighten' : ''}`}></div>

                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#6C5DD3]/10 flex items-center justify-center">
                                            {currentField && <currentField.icon size={26} className="text-[#6C5DD3]" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Etapa {currentStep + 1} de {STEPS.length}</p>
                                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{currentField?.question}</h2>
                                        </div>
                                    </div>

                                    {currentField?.type === 'text' && (
                                        <input
                                            type="text"
                                            value={formData[currentField.id] || ''}
                                            onChange={(e) => setFormData({ ...formData, [currentField.id]: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
                                            placeholder={currentField.placeholder}
                                            className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-6 py-5 text-lg font-medium outline-none focus:ring-2 focus:ring-[#6C5DD3]/40 transition-all`}
                                            autoFocus
                                        />
                                    )}

                                    {currentField?.type === 'textarea' && (
                                        <textarea
                                            value={formData[currentField.id] || ''}
                                            onChange={(e) => setFormData({ ...formData, [currentField.id]: e.target.value })}
                                            placeholder={currentField.placeholder}
                                            rows={4}
                                            className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'} border rounded-2xl px-6 py-5 text-lg font-medium outline-none focus:ring-2 focus:ring-[#6C5DD3]/40 transition-all resize-none`}
                                            autoFocus
                                        />
                                    )}

                                    {currentField?.type === 'select' && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {currentField.options?.map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setFormData({ ...formData, [currentField.id]: opt })}
                                                    className={`px-5 py-4 rounded-2xl text-sm font-bold transition-all border ${formData[currentField.id] === opt
                                                            ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30 scale-[1.02]'
                                                            : `${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-[#6C5DD3]/5'}`
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center justify-between mt-10 relative z-10">
                                    <button
                                        onClick={handleBack}
                                        disabled={currentStep === 0}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${currentStep === 0 ? 'opacity-30 cursor-not-allowed' :
                                                isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        <ArrowLeft size={18} /> Voltar
                                    </button>

                                    <button
                                        onClick={handleNext}
                                        disabled={!canProceed}
                                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all ${canProceed
                                                ? 'bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30 hover:bg-[#5a4cb3] hover:scale-[1.02]'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {currentStep === STEPS.length - 1 ? (
                                            <><Sparkles size={18} /> Gerar Roteiro</>
                                        ) : (
                                            <>Próximo <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== RESULT AREA ===== */
                    <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} min-h-[500px] relative overflow-hidden`}>
                        {generating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-20">
                                <div className="relative">
                                    <div className="w-24 h-24 border-2 border-[#6C5DD3]/20 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-24 h-24 border-t-2 border-[#6C5DD3] rounded-full animate-spin relative z-10"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="text-[#6C5DD3] w-8 h-8 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-black tracking-widest text-[#6C5DD3] uppercase">Gerando seu Roteiro</p>
                                    <p className="text-sm text-gray-400 font-medium">Analisando seu avatar, objetivo e plataforma...</p>
                                </div>
                            </div>
                        ) : script ? (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#6C5DD3]">Roteiro Gerado</span>
                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Seu roteiro personalizado está pronto!</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'} ${downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#6C5DD3] hover:border-[#6C5DD3] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#6C5DD3] hover:text-white text-gray-700'}`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6C5DD3] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#5a4cb3] transition-all shadow-lg shadow-[#6C5DD3]/20">
                                            <PenTool size={16} /> Novo Roteiro
                                        </button>
                                    </div>
                                </div>

                                <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`prose max-w-none ${isDark ? 'text-gray-300' : 'text-gray-700'}
                                        [&>p]:mb-6 [&>p]:leading-relaxed 
                                        [&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-[#6C5DD3]
                                        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-[#6C5DD3]
                                        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-6 
                                        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                                        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                                        [&_strong]:font-bold ${isDark ? '[&_strong]:text-white' : '[&_strong]:text-black'}
                                        font-medium leading-relaxed`}>
                                        <ReactMarkdown>{script}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Hidden PDF container */}
                        <div style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}>
                            <div ref={contentRef} style={{ width: '794px', backgroundColor: '#ffffff', color: '#1f2937', padding: '30px 40px', boxSizing: 'border-box' }} className="font-sans">
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', borderBottom: '2px solid #f3f4f6', paddingBottom: '20px' }}>
                                    {pdfSettings.logo ? (
                                        <img src={pdfSettings.logo} alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ height: '50px' }}></div>
                                    )}
                                </div>
                                <div style={{ width: '100%', textAlign: 'left' }}>
                                    <div style={{ color: '#1f2937', fontSize: '13px', lineHeight: '1.7', wordBreak: 'break-word' }}>
                                        <div className="
                                            [&_p]:mb-3 [&_p]:leading-relaxed
                                            [&_h1]:text-xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[#6C5DD3]
                                            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[#6C5DD3]
                                            [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[#6C5DD3]
                                            [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ul_li]:mb-1
                                            [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-3 [&_ol_li]:mb-1
                                            [&_strong]:font-bold [&_strong]:text-[#000000]
                                            [&_hr]:my-6 [&_hr]:border-[#e5e7eb]
                                            [&_h1]:break-after-avoid [&_h2]:break-after-avoid [&_h3]:break-after-avoid
                                            [&_li]:break-inside-avoid
                                        ">
                                            <ReactMarkdown>{script}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#9ca3af' }}>
                                    {pdfSettings.footer}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
