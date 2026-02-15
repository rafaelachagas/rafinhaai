'use client';

import { useState } from 'react';
import { Sparkles, PenTool, Loader2, ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function ScriptsPage() {
    const [prompt, setPrompt] = useState('');
    const [type, setType] = useState('YouTube');
    const [loading, setLoading] = useState(false);
    const [script, setScript] = useState('');
    const [copied, setCopied] = useState(false);

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
        <div className="min-h-screen bg-[#050505] text-white p-4 lg:p-10 selection:bg-purple-500/30">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={18} />
                    Voltar para Dashboard
                </Link>

                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <PenTool className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Criador de Roteiros</h1>
                        <p className="text-gray-400 text-sm">IA treinada em copy de alta conversão</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Tipo de Conteúdo</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                >
                                    <option>YouTube</option>
                                    <option>Instagram (Reels)</option>
                                    <option>TikTok</option>
                                    <option>Vendas ( VSL )</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Tema ou Título</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Sobre o que é o vídeo?"
                                    rows={4}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <button
                                onClick={generateScript}
                                disabled={loading || !prompt}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <Sparkles size={18} />
                                        Gerar Roteiro
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Result */}
                    <div className="lg:col-span-2">
                        <div className="h-full min-h-[400px] bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                            {!script && !loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-4">
                                    <Sparkles size={48} className="opacity-20 text-purple-400" />
                                    <p className="text-sm italic">Seu roteiro aparecerá aqui...</p>
                                </div>
                            )}

                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-10 gap-4">
                                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                                    <p className="text-sm text-purple-400 font-medium">IA processando ideias...</p>
                                </div>
                            )}

                            {script && (
                                <div className="prose prose-invert max-w-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-center mb-6 not-prose">
                                        <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">
                                            Roteiro Gerado
                                        </span>
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white group relative"
                                        >
                                            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                Copiar
                                            </span>
                                        </button>
                                    </div>
                                    <ReactMarkdown>{script}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
