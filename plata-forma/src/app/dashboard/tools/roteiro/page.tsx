'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, PenTool, Loader2, Copy, Check, ArrowLeft, ArrowRight,
    Target, Users, ShoppingBag, Monitor, Megaphone, MessageCircle, ChevronRight
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
            if (data.script) setScript(data.script);
            else setScript('Erro ao gerar roteiro. Tente novamente.');
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
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

                {/* Content Area */}
                {!triageCompleted ? (
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
                                        <button onClick={copyToClipboard} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#6C5DD3] hover:border-[#6C5DD3] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#6C5DD3] hover:text-white text-gray-700'}`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6C5DD3] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#5a4cb3] transition-all shadow-lg shadow-[#6C5DD3]/20">
                                            <PenTool size={16} /> Novo Roteiro
                                        </button>
                                    </div>
                                </div>

                                <div className={`p-8 rounded-[2rem] border ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-purple font-medium leading-relaxed`}>
                                        <ReactMarkdown>{script}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </main>
        </div>
    );
}
