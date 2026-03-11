const fs = require('fs');
const path = require('path');

function updatePage(toolName, targetFile, stateInitStr, fetchHistoryStr, handleGenerateStr, handleResetStr, copyPDFStr, tabsStr, contentAreaStr) {
    let content = fs.readFileSync(targetFile, 'utf8');

    // 1. Imports
    if (!content.includes('useRef')) {
        content = content.replace(/import { useState, useEffect } from 'react';/, "import { useState, useEffect, useRef } from 'react';");
    }
    if (!content.includes('Download')) {
        content = content.replace(/import {\n    ([^}]+)\n} from 'lucide-react';/, (match, p1) => {
            return `import {\n    ${p1}, Download, History, Plus\n} from 'lucide-react';`;
        });
    }

    // 2. States and refs
    if (!content.includes('const [activeTab')) {
        content = content.replace(/(const \[copied, setCopied\] = useState\(false\);)/, `$1\n    ${stateInitStr}`);
    } else if (toolName === 'negociacao' && !content.includes('const [activeTab')) {
        content = content.replace(/(const \[loadingFeedback, setLoadingFeedback\] = useState\(false\);)/, `$1\n    ${stateInitStr}`);
    }

    // 3. fetchHistory and useEffect
    if (!content.includes('fetchHistory')) {
        content = content.replace(/async function fetchUnreadCount\(\) {[\s\S]*?}/, (match) => {
            return `${match}\n\n    ${fetchHistoryStr}`;
        });
    }

    // 4. Update generator function to save history
    if (toolName === 'analise') {
        content = content.replace(/setAnalise\(data\.analise\);/, `setAnalise(data.analise);\n            if (profile?.id) {\n                await supabase.from('ai_content_history').insert([{\n                    user_id: profile.id,\n                    tool_type: 'analise',\n                    input_data: { roteiro, plataforma, objetivo },\n                    output_content: data.analise\n                }]);\n            }`);
    } else if (toolName === 'bio') {
        content = content.replace(/setBios\(data\.bios\);/, `setBios(data.bios);\n            if (profile?.id) {\n                await supabase.from('ai_content_history').insert([{\n                    user_id: profile.id,\n                    tool_type: 'bio',\n                    input_data: formData,\n                    output_content: data.bios\n                }]);\n            }`);
    } else if (toolName === 'negociacao') {
        content = content.replace(/setFeedback\(data\.feedback\);/, `setFeedback(data.feedback);\n            if (profile?.id) {\n                await supabase.from('ai_content_history').insert([{\n                    user_id: profile.id,\n                    tool_type: 'negociacao',\n                    input_data: { contexto, messages },\n                    output_content: data.feedback\n                }]);\n            }`);
    }

    // 5. handleReset
    if (toolName === 'analise') {
        content = content.replace(/const handleReset = \(\) => {[\s\S]*?};/, handleResetStr);
    } else if (toolName === 'bio') {
        content = content.replace(/const handleReset = \(\) => {[\s\S]*?};/, handleResetStr);
    } else if (toolName === 'negociacao') {
        content = content.replace(/const handleReset = \(\) => {[\s\S]*?};/, handleResetStr);
    }

    // 6. copyPDFStr
    if (toolName === 'analise' || toolName === 'bio') {
        content = content.replace(/const copyToClipboard = \(\) => {[\s\S]*?};/, copyPDFStr);
    } else if (toolName === 'negociacao') {
        if (!content.includes('const copyToClipboard')) {
            content = content.replace(/const handleReset = \(\) => {[\s\S]*?};/, (match) => {
                return `${match}\n\n${copyPDFStr}`;
            });
        }
    }

    // 7. Tabs string
    if (toolName === 'analise' || toolName === 'bio') {
        content = content.replace(/<div className="space-y-2">\s*<div className="flex items-center gap-2[\s\S]*?<\/p>\s*<\/div>/, tabsStr);
    } else if (toolName === 'negociacao') {
        content = content.replace(/<div className="space-y-2">\s*<div className="flex items-center gap-2 text-\[#10B981\][\s\S]*?<\/p>\s*<\/div>/, tabsStr);
    }

    // 8. Content Area replacement
    if (toolName === 'analise') {
        content = content.replace(/{!analise \? \([\s\S]*?\/\* ===== RESULT ===== \*\/\s*<div className={`p-10 rounded-\[2\.5rem\] border \$\{isDark \? 'bg-\[#1A1D1F\] border-white\/5' : 'bg-white border-gray-100'\} space-y-8`}>[\s\S]*?<\/div>\s*<\/div>\s*\)}/g, contentAreaStr);
    } else if (toolName === 'bio') {
        content = content.replace(/{!bios \? \([\s\S]*?\/\* ===== RESULT ===== \*\/\s*<div className={`p-10 rounded-\[2\.5rem\] border \$\{isDark \? 'bg-\[#1A1D1F\] border-white\/5' : 'bg-white border-gray-100'\} space-y-8`}>[\s\S]*?<\/div>\s*<\/div>\s*\)}/g, contentAreaStr);
    } else if (toolName === 'negociacao') {
        // Negociacao uses multiple renders: !setupDone, showFeedback, else chat. We replace the showFeedback branch.
        const feedbackReplacement = `) : showFeedback ? (\n${contentAreaStr}\n                ) : (`

        content = content.replace(/\) : showFeedback \? \([\s\S]*?\) : \(\s*\/\* ===== CHAT ===== \*\//, feedbackReplacement + '\n                    /* ===== CHAT ===== */');
        
        // Setup block replacement if needed to support ActiveTab='historico'
        content = content.replace(/{!setupDone \? \(/, `{activeTab === 'historico' ? (\n${historyStr('negociacao')}\n                ) : !setupDone ? (`);
    }

    fs.writeFileSync(targetFile, content);
}

// Reusable parts
const getCopyPdf = (toolName, varName, fileName, colorCode) => `    const copyToClipboard = () => {
        const textToCopy = \`\$\{${varName}\}\\n\\n---\n${toolName} gerada pelo App Profissão do Futuro.\`;
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
            element.classList.remove('hidden');
            
            const opt = {
                margin:       [20, 20, 20, 20],
                filename:     '${fileName}',
                image:        { type: 'jpeg' as const, quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 800 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };
            
            await html2pdf().set(opt).from(element).save();
            element.classList.add('hidden');
        } catch (error) {
            console.error('Erro ao gerar PDF', error);
        } finally {
            setDownloadingPDF(false);
        }
    };`;

const stateStr = `const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);`;
    
const getFetchHistoryStr = (toolName) => `const fetchHistory = async () => {
        if (!profile?.id) return;
        setLoadingHistory(true);
        const { data } = await supabase
            .from('ai_content_history')
            .select('*')
            .eq('user_id', profile.id)
            .eq('tool_type', '${toolName}')
            .order('created_at', { ascending: false });
        
        if (data) setHistory(data);
        setLoadingHistory(false);
    };

    useEffect(() => {
        if (activeTab === 'historico') fetchHistory();
    }, [activeTab, profile]);`;

const getTabsStr = (toolName, mainColor, titleStart, titleColor, desc, iconName) => `<div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[${mainColor}] font-black text-[10px] uppercase tracking-[0.4em]">
                                <${iconName} size={12} />
                                ${titleStart}
                            </div>
                            <h1 className={\`text-4xl lg:text-5xl font-extrabold tracking-tight \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>
                                ${titleColor.split(' ')[0]} <span className="text-[${mainColor}]">${titleColor.split(' ').slice(1).join(' ')}</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">
                                ${desc}
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setActiveTab('novo')}
                            className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all \$\{activeTab === 'novo' ? 'bg-[${mainColor}] text-white shadow-lg shadow-[${mainColor}]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}\`}
                        >
                            <Plus size={18} /> Novo
                        </button>
                        <button 
                            onClick={() => setActiveTab('historico')}
                            className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all \$\{activeTab === 'historico' ? 'bg-[${mainColor}] text-white shadow-lg shadow-[${mainColor}]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}\`}
                        >
                            <History size={18} /> Histórico
                        </button>
                    </div>
                </div>`;

const historyStr = (toolName) => `<div className={\`p-8 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\}\`}>
                        <h2 className={\`text-2xl font-bold mb-6 \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>Seu Histórico de ${toolName}</h2>
                        {loadingHistory ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="w-8 h-8 text-[#6C5DD3] animate-spin" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-12 text-gray-500">
                                Você ainda não gerou nenhum histórico.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {history.map((item) => (
                                    <div key={item.id} className={\`p-6 rounded-2xl border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:shadow-md'\} transition-all flex flex-col justify-between\`}>
                                        <div className="mb-4">
                                            <h3 className={\`font-bold text-lg mb-1 \$\{isDark ? 'text-white' : 'text-gray-900'}\`}>Geração de ${new Date(item.created_at).toLocaleDateString()}</h3>
                                            <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleTimeString('pt-BR')}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                ${toolName === 'analise' ? `setAnalise(item.output_content);\n                                                setActiveTab('novo');` : ''}
                                                ${toolName === 'bio' ? `setBios(item.output_content);\n                                                setActiveTab('novo');` : ''}
                                                ${toolName === 'negociacao' ? `setFeedback(item.output_content);\n                                                setShowFeedback(true);\n                                                setSetupDone(true);\n                                                setActiveTab('novo');` : ''}
                                            }}
                                            className={\`w-full py-3 \$\{isDark ? 'bg-white/5 hover:bg-[#6C5DD3] text-white' : 'bg-white border border-gray-200 hover:border-[#6C5DD3] hover:text-[#6C5DD3] text-gray-700'\} font-bold text-sm rounded-xl transition-all\`}
                                        >
                                            Visualizar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>`;

const getPdfHtmlStr = (toolName, mainColor, varName) => `{/* Hidden PDF container */}
                        <div className="absolute top-0 left-[-9999px] hidden">
                            <div ref={contentRef} className="w-[700px] bg-[#ffffff] text-[#1f2937] font-sans break-words pb-8">
                                {/* Logo (placeholder via next/image or standard img) */}
                                <div className="flex justify-center mb-8 border-b pb-6 border-[#e5e7eb]">
                                    <img src="/logo-original-si.png" alt="Logo" className="h-10 object-contain" />
                                </div>
                                
                                {/* Content formatting for PDF specifically */}
                                <div className="text-[#1f2937] text-sm
                                    [&_p]:mb-4 [&_p]:leading-normal
                                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[${mainColor}]
                                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-[${mainColor}]
                                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[${mainColor}]
                                    [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-4 [&_ul_li]:mb-1
                                    [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-4 [&_ol_li]:mb-1
                                    [&_strong]:font-bold [&_strong]:text-[#000000]
                                    [&_hr]:my-6 [&_hr]:border-[#e5e7eb]">
                                    <ReactMarkdown>{${varName}}</ReactMarkdown>
                                </div>
                                
                                {/* Footer Credits */}
                                <div className="mt-12 pt-6 border-t border-[#e5e7eb] text-center text-xs font-medium text-[#6b7280]">
                                    ${toolName} gerada pelo App Profissão do Futuro.
                                </div>
                            </div>
                        </div>`;

// ANALISE update
(()=>{
    const handleReset = `const handleReset = () => {
        setRoteiro('');
        setPlataforma('');
        setObjetivo('');
        setAnalise('');
        setActiveTab('novo');
    };`;
    const copyPdf = getCopyPdf('Análise', 'analise', 'Analise_Gerada_IA.pdf', '#FF754C');
    const tabs = getTabsStr('analise', '#FF754C', 'Análise Inteligente', 'Análise de Roteiro', 'Cole seu roteiro abaixo e receba uma análise detalhada com nota, pontos fortes, melhorias e uma versão otimizada.', 'Eye');
    const contentArea = `{activeTab === 'historico' ? (
                    ${historyStr('analise')}
                ) : generating || analise ? (
                    /* ===== RESULT AREA ===== */
                    <div className={\`p-10 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\} min-h-[500px] relative overflow-hidden\`}>
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
                                        <h3 className={\`text-2xl font-bold \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>Resultado da sua análise</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'\} \$\{downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}\`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-[#FF754C] hover:border-[#FF754C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#FF754C] hover:text-white text-gray-700'\}\`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF754C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#e5603c] transition-all shadow-lg shadow-[#FF754C]/20">
                                            <Eye size={16} /> Nova Análise
                                        </button>
                                    </div>
                                </div>
        
                                <div className={\`p-8 rounded-[2rem] border \$\{isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'\}\`}>
                                    <div className={\`prose max-w-none \$\{isDark ? 'text-gray-300' : 'text-gray-700'\}
                                        [&>p]:mb-6 [&>p]:leading-relaxed 
                                        [&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-[#FF754C]
                                        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-[#FF754C]
                                        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-6 
                                        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                                        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                                        [&_strong]:font-bold \$\{isDark ? '[&_strong]:text-white' : '[&_strong]:text-black'\}
                                        font-medium leading-relaxed\`}>
                                        <ReactMarkdown>{analise}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        ${getPdfHtmlStr('Análise', '#FF754C', 'analise')}
                    </div>
                ) : (
                    /* ===== INPUT FORM ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <div className={\`p-8 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\} space-y-6\`}>
                                <div className="space-y-3">
                                    <label className={\`text-xs font-bold uppercase tracking-widest \$\{isDark ? 'text-gray-400' : 'text-gray-600'\}\`}>Cole seu roteiro aqui *</label>
                                    <textarea
                                        value={roteiro}
                                        onChange={(e) => setRoteiro(e.target.value)}
                                        placeholder="Cole o roteiro completo que você quer analisar..."
                                        rows={14}
                                        className={\`w-full \$\{isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'\} border rounded-2xl px-6 py-5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FF754C]/40 transition-all resize-none\`}
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium">{roteiro.length} caracteres</p>
                                </div>
        
                                <button
                                    onClick={handleAnalyze}
                                    disabled={generating || !roteiro.trim()}
                                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#FF754C] to-[#FF5722] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-[#FF754C]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <BarChart3 size={20} /> Analisar Roteiro
                                </button>
                            </div>
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <div className={\`p-6 rounded-[2rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\} space-y-4\`}>
                                <label className={\`text-xs font-bold uppercase tracking-widest \$\{isDark ? 'text-gray-400' : 'text-gray-600'\}\`}>Plataforma (opcional)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Instagram', 'TikTok', 'YouTube', 'Stories'].map(opt => (
                                        <button key={opt} onClick={() => setPlataforma(opt)} className={\`px-4 py-3 rounded-xl text-xs font-bold transition-all border \$\{plataforma === opt ? 'bg-[#FF754C] border-[#FF754C] text-white shadow-lg shadow-[#FF754C]/20' : \`\$\{isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#FF754C]/5'\}\`\}\`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={\`p-6 rounded-[2rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\} space-y-4\`}>
                                <label className={\`text-xs font-bold uppercase tracking-widest \$\{isDark ? 'text-gray-400' : 'text-gray-600'\}\`}>Objetivo (opcional)</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Vendas', 'Engajamento', 'Autoridade', 'Leads'].map(opt => (
                                        <button key={opt} onClick={() => setObjetivo(opt)} className={\`px-4 py-3 rounded-xl text-xs font-bold transition-all border \$\{objetivo === opt ? 'bg-[#FF754C] border-[#FF754C] text-white shadow-lg shadow-[#FF754C]/20' : \`\$\{isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#FF754C]/5'\}\`\}\`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={\`p-6 rounded-[2rem] border \$\{isDark ? 'bg-gradient-to-br from-[#FF754C]/5 to-transparent border-[#FF754C]/10' : 'bg-[#FF754C]/5 border-[#FF754C]/10'\}\`}>
                                <h4 className={\`font-bold text-sm mb-2 \$\{isDark ? 'text-white' : 'text-[#1B1D21]'\}\`}>💡 Dica</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">Cole seu roteiro completo, incluindo hooks, CTAs e indicações de cena. Quanto mais contexto, melhor a análise.</p>
                            </div>
                        </div>
                    </div>
                )}`;
    
    updatePage('analise', 'src/app/dashboard/tools/analise/page.tsx', stateStr, getFetchHistoryStr('analise'), null, handleReset, copyPdf, tabs, contentArea);
})();

// BIO update
(()=>{
    const handleReset = `const handleReset = () => {
        setFormData({ nome: '', nicho: '', resultados: '', diferenciais: '', publicoAlvo: '', tomVoz: '', objetivo: '', estilo: '' });
        setBios('');
        setActiveTab('novo');
    };`;
    const copyPdf = getCopyPdf('Bio', 'bios', 'Bio_Instagram_IA.pdf', '#E1306C');
    const tabs = getTabsStr('bio', '#E1306C', 'Gerador de Bio', 'Bio do Instagram', 'Receba 5 opções de bio profissional otimizadas para gerar autoridade e converter seguidores em clientes.', 'Instagram');
    const contentArea = `{activeTab === 'historico' ? (
                    ${historyStr('bio')}
                ) : generating || bios ? (
                    /* ===== RESULT AREA ===== */
                    <div className={\`p-10 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\} min-h-[500px] relative overflow-hidden\`}>
                        {generating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-20">
                                <div className="relative">
                                    <div className="w-24 h-24 border-2 border-[#E1306C]/20 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-24 h-24 border-t-2 border-[#E1306C] rounded-full animate-spin relative z-10"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="text-[#E1306C] w-8 h-8 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-black tracking-widest text-[#E1306C] uppercase">Gerando suas Bios</p>
                                    <p className="text-sm text-gray-400 font-medium">Buscando as palavras-chave da atração financeira...</p>
                                </div>
                            </div>
                        ) : bios ? (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E1306C]">Bios Geradas</span>
                                        <h3 className={\`text-2xl font-bold \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>Suas 5 opções estão prontas!</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'\} \$\{downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}\`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-[#E1306C] hover:border-[#E1306C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#E1306C] hover:text-white text-gray-700'\}\`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#E1306C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#E1306C]/80 transition-all shadow-lg shadow-[#E1306C]/20">
                                            <Sparkles size={16} /> Gerar Novamente
                                        </button>
                                    </div>
                                </div>
        
                                <div className={\`p-8 rounded-[2rem] border \$\{isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'\}\`}>
                                    <div className={\`prose max-w-none \$\{isDark ? 'text-gray-300' : 'text-gray-700'\}
                                        [&>p]:mb-6 [&>p]:leading-relaxed 
                                        [&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-[#E1306C]
                                        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-[#E1306C]
                                        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-6 
                                        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                                        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                                        [&_strong]:font-bold \$\{isDark ? '[&_strong]:text-white' : '[&_strong]:text-black'\}
                                        font-medium leading-relaxed\`}>
                                        <ReactMarkdown>{bios}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        ${getPdfHtmlStr('Bio', '#E1306C', 'bios')}
                    </div>
                ) : (
                    /* ===== FORM ===== */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7">
                            <div className={\`p-8 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\} space-y-6\`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <InputField label="Nome ou Marca" value={formData.nome} onChange={(v: string) => setFormData({ ...formData, nome: v })} placeholder="Ex: Maria Finanças" isDark={isDark} />
                                    <InputField label="Nicho *" value={formData.nicho} onChange={(v: string) => setFormData({ ...formData, nicho: v })} placeholder="Ex: Marketing Digital" isDark={isDark} required />
                                    <InputField label="Público-alvo *" value={formData.publicoAlvo} onChange={(v: string) => setFormData({ ...formData, publicoAlvo: v })} placeholder="Ex: Empreendedoras iniciantes" isDark={isDark} required />
                                    <InputField label="Resultados/Conquistas" value={formData.resultados} onChange={(v: string) => setFormData({ ...formData, resultados: v })} placeholder="Ex: +500 alunas formadas" isDark={isDark} />
                                    <InputField label="Diferenciais" value={formData.diferenciais} onChange={(v: string) => setFormData({ ...formData, diferenciais: v })} placeholder="Ex: Método exclusivo de 7 dias" isDark={isDark} className="md:col-span-2" />
                                </div>
                                <div className="space-y-3">
                                    <label className={\`text-xs font-bold uppercase tracking-widest \$\{isDark ? 'text-gray-400' : 'text-gray-600'\}\`}>Tom de Voz</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Profissional', 'Descontraído', 'Empoderado', 'Minimalista', 'Aspiracional'].map(t => (
                                            <button key={t} onClick={() => setFormData({ ...formData, tomVoz: t })} className={\`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border \$\{formData.tomVoz === t ? 'bg-[#E1306C] border-[#E1306C] text-white shadow-lg shadow-[#E1306C]/20' : \`\$\{isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#E1306C]/5'\}\`\}\`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className={\`text-xs font-bold uppercase tracking-widest \$\{isDark ? 'text-gray-400' : 'text-gray-600'\}\`}>Objetivo do Perfil</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Vender', 'Gerar Autoridade', 'Captar Leads', 'Crescer Seguidores', 'Networking'].map(o => (
                                            <button key={o} onClick={() => setFormData({ ...formData, objetivo: o })} className={\`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border \$\{formData.objetivo === o ? 'bg-[#E1306C] border-[#E1306C] text-white shadow-lg shadow-[#E1306C]/20' : \`\$\{isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-[#E1306C]/5'\}\`\}\`}>
                                                {o}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleGenerate} disabled={generating || !formData.nicho || !formData.publicoAlvo} className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#E1306C] to-[#C13584] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-[#E1306C]/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Sparkles size={20} /> Gerar 5 Bios
                                </button>
                            </div>
                        </div>
                        <div className="lg:col-span-5 space-y-6">
                            {/* Preview Card */}
                            <div className={\`p-8 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\}\`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-0.5">
                                        <div className={\`w-full h-full rounded-full \$\{isDark ? 'bg-[#1A1D1F]' : 'bg-white'\} flex items-center justify-center\`}>
                                            <AtSign size={28} className="text-[#E1306C]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className={\`font-bold \$\{isDark ? 'text-white' : 'text-[#1B1D21]'\}\`}>{formData.nome || 'Seu Perfil'}</h4>
                                        <p className="text-xs text-gray-400">{formData.nicho || 'Seu nicho aqui'}</p>
                                    </div>
                                </div>
                                <div className={\`p-4 rounded-2xl \$\{isDark ? 'bg-white/5' : 'bg-gray-50'\} min-h-[80px] flex items-center justify-center\`}>
                                    <p className="text-xs text-gray-400 text-center italic">Suas bios aparecerão aqui após gerar...</p>
                                </div>
                            </div>
                            <div className={\`p-6 rounded-[2rem] border \$\{isDark ? 'bg-gradient-to-br from-[#E1306C]/5 to-transparent border-[#E1306C]/10' : 'bg-[#E1306C]/5 border-[#E1306C]/10'\}\`}>
                                <h4 className={\`font-bold text-sm mb-3 \$\{isDark ? 'text-white' : 'text-[#1B1D21]'\}\`}>📱 O que uma boa bio precisa ter:</h4>
                                <ul className="space-y-2">
                                    {['Quem você é e o que faz', 'Para quem você ajuda', 'Resultado que entrega', 'CTA claro (link, DM, etc.)'].map((tip, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#E1306C] shrink-0"></div>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}`;

    updatePage('bio', 'src/app/dashboard/tools/bio/page.tsx', stateStr, getFetchHistoryStr('bio'), null, handleReset, copyPdf, tabs, contentArea);
})();

// NEGOCIACAO update
(()=>{
    const handleReset = `const handleReset = () => {
        setSetupDone(false);
        setMessages([]);
        setInput('');
        setShowFeedback(false);
        setFeedback('');
        setContexto({ produto: '', preco: '', nicho: '', dificuldade: 'Médio' });
        setActiveTab('novo');
    };`;
    const copyPdf = getCopyPdf('Simulação de Vendas', 'feedback', 'Simulacao_Vendas_IA.pdf', '#10B981');
    const tabs = getTabsStr('negociacao', '#10B981', 'Simulador de Negociação', 'Treinamento de Vendas', 'Pratique negociações com um cliente IA difícil. Ao final, receba um feedback completo com score de execução.', 'MessageSquare');
    const contentArea = `<div className={\`p-10 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\} space-y-8 min-h-[500px] relative overflow-hidden\`}>
                        {loadingFeedback ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center py-20 gap-6 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-20">
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
                                        <h3 className={\`text-2xl font-bold \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>Sua análise de performance</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'\} \$\{downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}\`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-[#10B981] hover:border-[#10B981] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#10B981] hover:text-white text-gray-700'\}\`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#10B981] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20">
                                            <RotateCcw size={16} /> Simulação Fixa
                                        </button>
                                    </div>
                                </div>
                                <div className={\`p-8 rounded-[2rem] border \$\{isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-gray-100'\}\`}>
                                    <div className={\`prose max-w-none \$\{isDark ? 'text-gray-300' : 'text-gray-700'\}
                                        [&>p]:mb-6 [&>p]:leading-relaxed 
                                        [&>h1]:text-3xl [&>h1]:font-black [&>h1]:mb-6 [&>h1]:mt-8 [&>h1]:text-[#10B981]
                                        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8 [&>h2]:text-[#10B981]
                                        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-6 
                                        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul>li]:mb-2
                                        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol>li]:mb-2
                                        [&_strong]:font-bold \$\{isDark ? '[&_strong]:text-white' : '[&_strong]:text-black'\}
                                        font-medium leading-relaxed\`}>
                                        <ReactMarkdown>{feedback}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                        ${getPdfHtmlStr('Simulação de Vendas', '#10B981', 'feedback')}
                    </div>`;

    updatePage('negociacao', 'src/app/dashboard/tools/negociacao/page.tsx', stateStr, getFetchHistoryStr('negociacao'), null, handleReset, copyPdf, tabs, contentArea);
})();
