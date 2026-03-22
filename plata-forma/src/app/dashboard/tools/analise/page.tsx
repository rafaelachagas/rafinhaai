'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Sparkles, PenTool, Loader2, Copy, Check, ArrowLeft, ArrowRight,
    Target, Monitor, Megaphone, Eye, Download, History, Plus, BarChart3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const STEPS = [
    { id: 'nicho', label: 'Nicho', icon: Target, question: 'Qual o seu nicho ou tema do vídeo?', placeholder: 'Ex: Marketing, Fitness, Viagens...', type: 'text' },
    { id: 'plataforma', label: 'Plataforma', icon: Monitor, question: 'Para qual plataforma é o roteiro?', placeholder: '', type: 'select', options: ['Instagram', 'TikTok', 'YouTube', 'Stories', 'LinkedIn'] },
    { id: 'objetivo', label: 'Objetivo', icon: Megaphone, question: 'Qual o objetivo do vídeo?', placeholder: '', type: 'select', options: ['Vendas', 'Engajamento', 'Autoridade', 'Leads', 'Viralizar'] },
    { id: 'roteiro', label: 'Roteiro', icon: PenTool, question: 'Cole seu roteiro para análise:', placeholder: 'Cole aqui o texto completo...', type: 'textarea' },
];

export default function AnalisePage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, string>>({
        nicho: '', plataforma: '', objetivo: '', roteiro: ''
    });

    const [generating, setGenerating] = useState(false);
    const [analise, setAnalise] = useState('');
    const [copied, setCopied] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const [pdfSettings, setPdfSettings] = useState({
        logo: '/logo-original-si.png',
        footer: 'Análise gerada pelo App Profissão do Futuro.'
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
                    logo: parsed.logo_url !== undefined ? parsed.logo_url : '/logo-original-si.png',
                    footer: parsed.footer_analise || 'Análise gerada pelo App Profissão do Futuro.'
                });
            }
        } catch (e) {}
    };

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

    const currentField = STEPS[currentStep];
    const canProceed = !!(formData[currentField?.id]?.toString().trim());

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
        else handleGenerate();
    };

    const handleBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/ai/analise', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(formData),
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
                        user_id: profile.id, tool_type: 'analise', input_data: formData, output_content: data.analise
                    }]);
                }
            } else setAnalise(data.error || 'Erro ao analisar. Tente novamente.');
        } catch { setAnalise('Erro de conexão.'); }
        finally { setGenerating(false); }
    };

    const handleReset = () => {
        setCurrentStep(0);
        setFormData({ nicho: '', plataforma: '', objetivo: '', roteiro: '' });
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
            const element = contentRef.current;
            const container = element.parentElement;
            if (container) container.style.display = 'block';
            const opt = {
                margin: 10,
                filename: 'Analise_Roteiro.pdf',
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };
            await html2pdf().set(opt).from(element).save();
            if (container) container.style.display = 'none';
        } finally { setDownloadingPDF(false); }
    };

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)} showProfile={true} notificationsOpen={notificationsOpen} recentMessages={recentMessages} />
                
                <button onClick={() => router.push('/dashboard/tools')} className={`inline-flex items-center gap-3 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#FF754C]'} font-bold text-sm uppercase tracking-widest transition-all group w-fit`}>
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'} border flex items-center justify-center group-hover:bg-[#FF754C]/10 group-hover:border-[#FF754C]/20 transition-all`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar
                </button>

                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-[#FF754C] font-black text-[10px] uppercase tracking-[0.4em]">
                        <BarChart3 size={12} /> Análise Inteligente
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('novo')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'novo' ? 'bg-[#FF754C] text-white shadow-lg' : isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            Nova Análise
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'historico' ? 'bg-[#FF754C] text-white shadow-lg' : isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            Histórico
                        </button>
                    </div>
                </div>

                {activeTab === 'historico' ? (
                   <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                      {loadingHistory ? <Loader2 className="animate-spin mx-auto" /> : history.length === 0 ? <p>Vazio</p> : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {history.map(item => (
                                  <div key={item.id} className="p-6 border rounded-2xl">
                                      <p className="font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
                                      <button onClick={() => { setAnalise(item.output_content); setActiveTab('novo'); }} className="mt-4 text-[#FF754C] font-bold">Ver</button>
                                  </div>
                              ))}
                          </div>
                      )}
                   </div>
                ) : analise || generating ? (
                    <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} min-h-[500px] relative`}>
                        {generating ? (
                           <div className="flex flex-col items-center justify-center h-full gap-4">
                               <Loader2 className="animate-spin text-[#FF754C] w-12 h-12" />
                               <p className="font-bold text-[#FF754C]">ANALISANDO...</p>
                           </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                   <h2 className="text-2xl font-bold">Sua Análise</h2>
                                    <div className="flex gap-2">
                                        <button onClick={downloadPDF} className="p-2 border rounded-xl"><Download size={20}/></button>
                                        <button onClick={copyToClipboard} className="p-2 border rounded-xl"><Copy size={20}/></button>
                                        <button onClick={handleReset} className="bg-[#FF754C] text-white px-4 py-2 rounded-xl">Novo</button>
                                    </div>
                                </div>
                                <div className="prose max-w-none text-left">
                                    <ReactMarkdown>{analise}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'none', position: 'absolute' }}>
                             <div ref={contentRef} style={{ width: '794px', padding: '40px', background: 'white', color: '#000000', fontFamily: 'sans-serif' }}>
                                 {pdfSettings.logo && <img src={pdfSettings.logo} crossOrigin="anonymous" style={{ height: '50px', marginBottom: '20px' }} />}
                                 <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                    <ReactMarkdown 
                                        components={{
                                            h1: ({node, ...props}) => <h1 style={{ color: '#FF754C', fontSize: '24px', fontWeight: '900', marginTop: '20px', marginBottom: '10px' }} {...props} />,
                                            h2: ({node, ...props}) => <h2 style={{ color: '#FF754C', fontSize: '20px', fontWeight: '900', marginTop: '15px', marginBottom: '8px' }} {...props} />,
                                            h3: ({node, ...props}) => <h3 style={{ color: '#FF754C', fontSize: '18px', fontWeight: 'bold', marginTop: '12px', marginBottom: '5px' }} {...props} />,
                                            p: ({node, ...props}) => <p style={{ marginBottom: '10px' }} {...props} />,
                                            strong: ({node, ...props}) => <strong style={{ fontWeight: 'bold' }} {...props} />,
                                            ul: ({node, ...props}) => <ul style={{ marginLeft: '20px', marginBottom: '10px', listStyleType: 'disc' }} {...props} />,
                                            li: ({node, ...props}) => <li style={{ marginBottom: '5px' }} {...props} />,
                                        }}
                                    >
                                        {analise}
                                    </ReactMarkdown>
                                 </div>
                                 <p style={{ marginTop: '40px', fontSize: '10px', color: '#666' }}>{pdfSettings.footer}</p>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Step indicators */}
                        <div className="lg:col-span-3 space-y-4">
                            {STEPS.map((step, i) => (
                                <div key={step.id} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i <= currentStep ? 'bg-[#FF754C] text-white' : 'bg-gray-200 text-gray-400'}`}>{i + 1}</div>
                                    <span className="font-bold text-sm">{step.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="lg:col-span-9">
                           <div className={`p-10 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} min-h-[400px] flex flex-col justify-between`}>
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-bold">{currentField.question}</h2>
                                    {currentField.type === 'text' && <input type="text" value={formData[currentField.id]} onChange={e => setFormData({...formData, [currentField.id]: e.target.value})} className="w-full p-4 border rounded-xl bg-transparent" />}
                                    {currentField.type === 'textarea' && <textarea rows={6} value={formData[currentField.id]} onChange={e => setFormData({...formData, [currentField.id]: e.target.value})} className="w-full p-4 border rounded-xl bg-transparent" />}
                                    {currentField.type === 'select' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {currentField.options?.map(opt => (
                                                <button key={opt} onClick={() => setFormData({...formData, [currentField.id]: opt})} className={`p-4 border rounded-xl font-bold ${formData[currentField.id] === opt ? 'bg-[#FF754C] text-white border-[#FF754C]' : ''}`}>{opt}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between mt-8">
                                    <button onClick={handleBack} disabled={currentStep === 0} className="px-6 py-2 border rounded-xl disabled:opacity-20">Voltar</button>
                                    <button onClick={handleNext} disabled={!canProceed} className="px-8 py-3 bg-[#FF754C] text-white font-bold rounded-xl disabled:opacity-50">Próximo</button>
                                </div>
                           </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
