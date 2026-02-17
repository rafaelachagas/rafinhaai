'use client';

import { useState, useEffect } from 'react';
import { Sparkles, PenTool, Loader2, ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

import { useTheme } from '@/context/ThemeContext';

export default function ScriptsPage() {
    const { isDark } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [type, setType] = useState('YouTube');
    const [loading, setLoading] = useState(false);
    const [script, setScript] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const generateScript = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const res = await fetch('/api/ai/scripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, type }),
            });
            const data = await res.json();
            setScript(data.script);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'} p-4 lg:p-10 selection:bg-[#B42AF0]/30 transition-colors duration-500 relative overflow-hidden font-sans`}>
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#B42AF0]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#7D1AB8]/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <Link href="/dashboard" className="inline-flex items-center gap-3 text-gray-400 hover:text-[#B42AF0] mb-12 transition-all group font-bold text-sm uppercase tracking-widest">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-[#B42AF0]/10 group-hover:border-[#B42AF0]/20 transition-all">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    Voltar para o Painel
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#B42AF0] font-black text-[10px] uppercase tracking-[0.4em]">
                            <Sparkles size={12} />
                            Inteligência Artificial
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter">Criador de <span className="text-[#B42AF0]">Roteiros</span></h1>
                        <p className="text-gray-400 font-medium max-w-md">Transforme ideias simples em roteiros cinematográficos e de alta conversão em segundos.</p>
                    </div>

                    <div className="px-6 py-3 rounded-2xl bg-[#120222]/40 backdrop-blur-xl border border-white/5 flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Model: Rafinha.AI v2.0</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Form */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className={`p-8 ${isDark ? 'bg-[#120222]/40 backdrop-blur-2xl border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-gray-100 shadow-sm'} rounded-[2.5rem] space-y-8 transition-all duration-500 relative overflow-hidden group border`}>
                            {/* Card Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#B42AF0]/5 to-transparent blur-2xl" />

                            <div className="space-y-4">
                                <label className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plataforma</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['YouTube', 'Instagram', 'TikTok', 'Vendas'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setType(opt)}
                                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${type === opt
                                                ? 'bg-[#B42AF0] border-[#B42AF0] text-white shadow-lg shadow-[#B42AF0]/30 scale-105'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Objetivo ou Título</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: 5 dicas para crescer no reels..."
                                    rows={5}
                                    className={`w-full ${isDark ? 'bg-[#0A0113]/60 border-white/5 placeholder:text-gray-600' : 'bg-gray-50 border-gray-100 placeholder:text-gray-400'} rounded-[1.5rem] px-6 py-5 text-sm font-medium focus:ring-2 focus:ring-[#B42AF0]/50 outline-none transition-all resize-none border`}
                                />
                            </div>

                            <button
                                onClick={generateScript}
                                disabled={loading || !prompt}
                                className="w-full py-5 rounded-[1.5rem] bg-gradient-to-br from-[#B42AF0] to-[#7D1AB8] hover:scale-[1.02] active:scale-[0.98] font-black text-xs uppercase tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-[#B42AF0]/20 cursor-pointer relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <Sparkles size={18} className="animate-pulse" />
                                        Gerar Agora
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="lg:col-span-8">
                        <div className={`h-full min-h-[600px] ${isDark ? 'bg-[#120222]/20 backdrop-blur-3xl border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-sm'} rounded-[3rem] p-10 relative overflow-hidden transition-all duration-500 border`}>
                            {!script && !loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 gap-6">
                                    <div className="w-24 h-24 rounded-full bg-[#B42AF0]/10 flex items-center justify-center border border-[#B42AF0]/20 animate-pulse">
                                        <PenTool size={40} className="text-[#B42AF0] opacity-40" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black tracking-tight">Pronto para criar?</h3>
                                        <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium leading-relaxed">Preencha os detalhes ao lado e deixe nossa IA fazer a mágica acontecer.</p>
                                    </div>
                                </div>
                            )}

                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0113]/40 backdrop-blur-md z-20 gap-8 animate-in fade-in duration-500">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-2 border-[#B42AF0]/20 rounded-full animate-ping absolute inset-0"></div>
                                        <div className="w-24 h-24 border-t-2 border-[#B42AF0] rounded-full animate-spin relative z-10"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="text-[#B42AF0] w-8 h-8 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-lg font-black tracking-widest text-[#B42AF0] uppercase">Processando Dados</p>
                                        <p className="text-sm text-gray-400 font-medium">Criando uma estrutura de alta conversão...</p>
                                    </div>
                                </div>
                            )}

                            {script && (
                                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B42AF0]">Sucesso</span>
                                            <h3 className="text-2xl font-black tracking-tight">Roteiro Otimizado</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={copyToClipboard}
                                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-[#B42AF0] hover:text-white transition-all duration-300 group border border-white/5 font-bold text-xs uppercase tracking-widest cursor-pointer"
                                            >
                                                {copied ? (
                                                    <><Check size={18} className="text-white" /> Copiado</>
                                                ) : (
                                                    <><Copy size={18} className="group-hover:scale-110 transition-transform" /> Copiar</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="prose prose-invert prose-purple max-w-none bg-[#050505]/40 p-8 rounded-[2rem] border border-white/5 font-medium leading-relaxed">
                                        <ReactMarkdown>{script}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
