'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, 
    Loader2, 
    Copy, 
    Check, 
    ArrowLeft, 
    Plus,
    Target,
    Layout,
    ChevronRight,
    AtSign,
    Instagram,
    History,
    Download,
    User,
    Award,
    TrendingUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const STEPS = [
    { 
        id: 'identidade', 
        title: 'Sua Identidade', 
        description: 'Qual seu nome e nicho?',
        icon: User
    },
    { 
        id: 'publico', 
        title: 'Público & Alvo', 
        description: 'Quem você quer ajudar?',
        icon: Target
    },
    { 
        id: 'autoridade', 
        title: 'Autoridade', 
        description: 'Resultados e diferenciais',
        icon: Award
    },
    { 
        id: 'estilo', 
        title: 'Tom & Estilo', 
        description: 'Qual a pegada da sua marca?',
        icon: TrendingUp
    }
];

export default function BioPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    
    // UI States
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    
    // Content States
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        nome: '',
        nicho: '',
        publicoAlvo: '',
        resultados: '',
        diferenciais: '',
        tomVoz: '',
        objetivo: ''
    });
    const [generating, setGenerating] = useState(false);
    const [bios, setBios] = useState('');
    const [copied, setCopied] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    
    // History & Tabs
    const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const [pdfSettings, setPdfSettings] = useState({
        logo: '/logo-original-si.png',
        footer: 'Bio gerada pelo App Profissão do Futuro.'
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
                    footer: parsed.footer_bio || parsed.footer_roteiro || 'Bio gerada pelo App Profissão do Futuro.'
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

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleGenerate();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleReset = () => {
        setFormData({ nome: '', nicho: '', publicoAlvo: '', resultados: '', diferenciais: '', tomVoz: '', objetivo: '' });
        setBios('');
        setCurrentStep(0);
        setActiveTab('novo');
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
                margin: 15,
                filename: `Bio_Gerada_${new Date().getTime()}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, windowWidth: 794, letterRendering: true },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };
            await html2pdf().set(opt).from(contentRef.current).save();
        } catch (e) { console.error('PDF Error:', e); }
        finally { setDownloadingPDF(false); }
    };

    const canProceed = () => {
        if (currentStep === 0) return !!(formData.nome?.trim() && formData.nicho?.trim());
        if (currentStep === 1) return !!(formData.publicoAlvo?.trim());
        if (currentStep === 2) return !!(formData.resultados?.trim() || formData.diferenciais?.trim());
        if (currentStep === 3) return !!(formData.tomVoz?.trim() && formData.objetivo?.trim());
        return true;
    };

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />

                {/* Top Nav */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#6C5DD3]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                        <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#E1306C]/10 group-hover:border-[#E1306C]/20 transition-all`}>
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        Voltar
                    </button>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('novo')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'novo' ? 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                            <Plus size={18} /> Novo
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
                ) : !bios && !generating ? (
                    /* ===== TRIAGE FLOW ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Steps Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[#E1306C] font-black text-[10px] uppercase tracking-[0.4em]">
                                    <AtSign size={12} />
                                    Perfil Otmizado
                                </div>
                                <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                    Criador de <span className="text-[#E1306C]">Bio</span>
                                </h1>
                            </div>

                            <div className="space-y-4">
                                {STEPS.map((step, i) => (
                                    <div key={step.id} className="flex items-center gap-4 group">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 ${
                                            i === currentStep 
                                                ? 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/40 scale-110' 
                                                : i < currentStep 
                                                    ? 'bg-green-500/20 text-green-500' 
                                                    : isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {i < currentStep ? <Check size={20} /> : i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${i === currentStep ? (isDark ? 'text-white' : 'text-[#1B1D21]') : 'text-gray-500'}`}>{step.title}</p>
                                            <p className="text-[11px] text-gray-400 font-medium">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="lg:col-span-8">
                            <div className={`p-8 lg:p-12 rounded-[3rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'} min-h-[550px] flex flex-col`}>
                                <div className="flex-1 space-y-8">
                                    <div className="space-y-4">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-[#E1306C]/5'}`}>
                                            {(() => {
                                                const Icon = STEPS[currentStep].icon;
                                                return <Icon size={32} className="text-[#E1306C]" />;
                                            })()}
                                        </div>
                                        <div className="space-y-2 text-center lg:text-left">
                                            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                                {STEPS[currentStep].title}
                                            </h2>
                                            <p className="text-gray-400 font-medium">Preencha os detalhes para gerar suas bios</p>
                                        </div>
                                    </div>

                                    {/* Inputs baseados no Step */}
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        {currentStep === 0 && (
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Seu Nome ou Marca *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.nome}
                                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                        placeholder="Ex: Maria Consultora ou Agência X"
                                                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} border rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-[#E1306C]/20 transition-all`}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Seu Nicho *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.nicho}
                                                        onChange={(e) => setFormData({ ...formData, nicho: e.target.value })}
                                                        placeholder="Ex: Marketing Digital, Nutrição, Finanças..."
                                                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} border rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-[#E1306C]/20 transition-all`}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {currentStep === 1 && (
                                            <div className="space-y-4">
                                                <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Quem é seu público-alvo? *</label>
                                                <textarea
                                                    value={formData.publicoAlvo}
                                                    onChange={(e) => setFormData({ ...formData, publicoAlvo: e.target.value })}
                                                    placeholder="Ex: Empreendedoras iniciantes que faturam até 5k..."
                                                    className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} border rounded-3xl p-6 h-40 resize-none outline-none focus:ring-4 focus:ring-[#E1306C]/20 transition-all`}
                                                />
                                            </div>
                                        )}

                                        {currentStep === 2 && (
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Resultados Atuais (opcional)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.resultados}
                                                        onChange={(e) => setFormData({ ...formData, resultados: e.target.value })}
                                                        placeholder="Ex: +500 alunas, faturamento 7 dígitos..."
                                                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} border rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-[#E1306C]/20 transition-all`}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Principais Diferenciais *</label>
                                                    <textarea
                                                        value={formData.diferenciais}
                                                        onChange={(e) => setFormData({ ...formData, diferenciais: e.target.value })}
                                                        placeholder="Ex: Método exclusivo de 21 dias, atendimento premium..."
                                                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'} border rounded-3xl p-6 h-32 resize-none outline-none focus:ring-4 focus:ring-[#E1306C]/20 transition-all`}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {currentStep === 3 && (
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Tom de Voz</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Profissional', 'Descontraído', 'Empoderado', 'Minimalista', 'Aspiracional'].map(opt => (
                                                            <button key={opt} onClick={() => setFormData({ ...formData, tomVoz: opt })} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.tomVoz === opt ? 'bg-[#E1306C] border-[#E1306C] text-white shadow-lg shadow-[#E1306C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-600 hover:bg-[#E1306C]/5'}`}`}>
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Objetivo Principal</label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {['Vender', 'Gerar Autoridade', 'Captar Leads', 'Crescer Seguidores', 'Networking'].map(opt => (
                                                            <button key={opt} onClick={() => setFormData({ ...formData, objetivo: opt })} className={`px-4 py-3 rounded-xl text-[11px] font-bold transition-all border ${formData.objetivo === opt ? 'bg-[#E1306C] border-[#E1306C] text-white shadow-lg shadow-[#E1306C]/20' : `${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-600 hover:bg-[#E1306C]/5'}`}`}>
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-gray-100/10 mt-8">
                                    <button onClick={handleBack} disabled={currentStep === 0} className={`px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#1B1D21]'}`}>
                                        Anterior
                                    </button>
                                    <button onClick={handleNext} disabled={!canProceed()} className={`px-10 py-5 rounded-2xl bg-gradient-to-r from-[#E1306C] to-[#C13584] text-white font-bold text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-[#E1306C]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale`}>
                                        {currentStep === STEPS.length - 1 ? 'Gerar 5 Bios' : 'Próximo'}
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== LOADING OR RESULT ===== */
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        {generating ? (
                            <div className={`p-10 lg:p-20 rounded-[3rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'} flex flex-col items-center justify-center gap-12 text-center min-h-[600px]`}>
                                <div className="relative">
                                    <div className="w-32 h-32 border-4 border-[#E1306C]/10 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-32 h-32 border-t-4 border-[#E1306C] rounded-full animate-spin relative z-10"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Instagram className="text-[#E1306C] w-12 h-12 animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-4 max-w-sm">
                                    <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Gerando suas Bios...</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed">Nossa IA está combinando seus diferenciais para criar 5 bios altamente magnéticas.</p>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-8 lg:p-12 rounded-[3rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'} space-y-10`}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[#E1306C] font-black text-[10px] uppercase tracking-[0.4em]">
                                            <Check size={12} className="text-green-500" />
                                            Bios Geradas
                                        </div>
                                        <h2 className={`text-4xl font-extrabold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Suas Opções de <span className="text-[#E1306C]">Bio</span></h2>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'} ${downloadingPDF ? 'opacity-50' : ''}`}>
                                            {downloadingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                            <span className="hidden sm:inline">PDF</span>
                                        </button>
                                        <button onClick={copyToClipboard} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${isDark ? 'bg-white/5 border-white/10 hover:bg-[#E1306C] hover:border-[#E1306C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#E1306C] hover:text-white text-gray-700'}`}>
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
                                        </button>
                                        <button onClick={handleReset} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E1306C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#c32b5d] transition-all shadow-xl shadow-[#E1306C]/20">
                                            <Plus size={18} />
                                            <span>Novo</span>
                                        </button>
                                    </div>
                                </div>

                                <div className={`p-8 lg:p-12 rounded-[2.5rem] border ${isDark ? 'bg-black/40 border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
                                    <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-pink font-medium leading-relaxed
                                        [&_h1]:text-[#E1306C] [&_h2]:text-[#E1306C] [&_h3]:text-[#E1306C]
                                        [&_strong]:text-[#E1306C] [&_strong]:font-bold
                                        text-lg`}>
                                        <ReactMarkdown>{bios}</ReactMarkdown>
                                    </div>
                                </div>

                                {/* Hidden PDF Container */}
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
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
