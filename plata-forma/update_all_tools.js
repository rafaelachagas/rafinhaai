const fs = require('fs');
const ObjectAst = require('path'); // not doing real AST, just regex

const stateInitStr = `const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
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

const getCopyPdf = (appName, contentVar, filename) => `    const copyToClipboard = () => {
        const textToCopy = \`\$\{${contentVar}\}\\n\\n---\\n${appName} gerada pelo App Profissão do Futuro.\`;
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
                filename:     '${filename}.pdf',
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
    };`;

const getPdfHtmlStr = (appName, contentVar, mainColor) => `                        {/* Hidden PDF container */}
                        <div className="absolute h-0 w-0 overflow-hidden">
                            <div ref={contentRef} style={{ width: '800px', padding: '40px', backgroundColor: '#ffffff', color: '#1f2937' }} className="font-sans break-words">
                                {/* Logo */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '24px' }}>
                                    <img src="/logo-original-si.png" alt="Logo" style={{ height: '56px', objectFit: 'contain' }} />
                                </div>
                                {/* Content */}
                                <div className="text-[#1f2937] text-sm
                                    [&_p]:mb-4 [&_p]:leading-relaxed
                                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[${mainColor}]
                                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-[${mainColor}]
                                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[${mainColor}]
                                    [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-4 [&_ul_li]:mb-1
                                    [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-4 [&_ol_li]:mb-1
                                    [&_strong]:font-bold [&_strong]:text-[#000000]
                                    [&_hr]:my-6 [&_hr]:border-[#e5e7eb]">
                                    <ReactMarkdown>{${contentVar}}</ReactMarkdown>
                                </div>
                                {/* Footer */}
                                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                                    ${appName} gerada pelo App Profissão do Futuro.
                                </div>
                            </div>
                        </div>`;

const getHistoryStr = (toolName, setStateStr, setViewTabStr) => `                    <div className={\`p-8 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\}\`}>
                        <h2 className={\`text-2xl font-bold mb-6 \$\{isDark ? 'text-white' : 'text-[#1B1D21]'\}\`}>Seu Histórico</h2>
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
                                    <div key={item.id} className={\`p-6 rounded-2xl border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:shadow-md'\} transition-all flex flex-col justify-between\`}>
                                        <div className="mb-4">
                                            <h3 className={\`font-bold text-lg mb-1 \$\{isDark ? 'text-white' : 'text-gray-900'\}\`}>Geração de {new Date(item.created_at).toLocaleDateString('pt-BR')}</h3>
                                            <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleTimeString('pt-BR')}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                ${setStateStr}
                                                ${setViewTabStr}
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


function processAnalise() {
    const file = './src/app/dashboard/tools/analise/page.tsx';
    let code = fs.readFileSync(file, 'utf8');

    // add imports
    if (!code.includes('useRef')) code = code.replace(/import { useState, useEffect }/, "import { useState, useEffect, useRef }");
    if (!code.includes('Download')) code = code.replace(/(import {[^}]+)Eye, Send([^}]+} from 'lucide-react';)/, "$1Eye, Send, Download, History, Plus$2");

    // add states
    if (!code.includes('activeTab')) {
        code = code.replace(/(const \[copied, setCopied\] = useState\(false\);)/, `$1\n    ${stateInitStr}`);
        code = code.replace(/(async function fetchUnreadCount\(\) {[\s\S]+?})/, `$1\n\n    ${getFetchHistoryStr('analise')}`);
    }

    // handleAnalyze
    code = code.replace(/setAnalise\(data\.analise\);/, `setAnalise(data.analise);\n            if (profile?.id) {\n                await supabase.from('ai_content_history').insert([{ user_id: profile.id, tool_type: 'analise', input_data: { roteiro, plataforma, objetivo }, output_content: data.analise }]);\n            }`);

    // handleReset
    code = code.replace(/const handleReset = \(\) => {[\s\S]+?};/, `const handleReset = () => { setRoteiro(''); setPlataforma(''); setObjetivo(''); setAnalise(''); setActiveTab('novo'); };`);

    // copy to clipboard and download
    code = code.replace(/const copyToClipboard = \(\) => {[\s\S]+?};/, getCopyPdf('Análise', 'analise', 'Analise_Gerada_IA', '#FF754C'));

    // TSX - Header Tabs
    code = code.replace(/<div className="space-y-2">[\s\S]+?Cole seu roteiro abaixo e receba uma análise detalhada com nota, pontos fortes, melhorias e uma versão otimizada\.[\s\S]+?<\/p>\s+<\/div>/, `
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#FF754C] font-black text-[10px] uppercase tracking-[0.4em]">
                                <Eye size={12} /> Análise Inteligente
                            </div>
                            <h1 className={\`text-4xl lg:text-5xl font-extrabold tracking-tight \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>
                                Análise de <span className="text-[#FF754C]">Roteiro</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">
                                Cole seu roteiro abaixo e receba uma análise detalhada com nota, pontos fortes, melhorias e uma versão otimizada.
                            </p>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('novo')} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all \$\{activeTab === 'novo' ? 'bg-[#FF754C] text-white shadow-lg shadow-[#FF754C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}\`}>
                            <Plus size={18} /> Nova Análise
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all \$\{activeTab === 'historico' ? 'bg-[#FF754C] text-white shadow-lg shadow-[#FF754C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}\`}>
                            <History size={18} /> Histórico
                        </button>
                    </div>
                </div>`);

    // TSX - Content Area
    const contentArea = `{activeTab === 'historico' ? (
                    ${getHistoryStr('analise', 'setAnalise(item.output_content);', "setActiveTab('novo');")}
                ) : generating || analise ? (
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
                                    <div className="flex items-center gap-3 flex-wrap">
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
                        ${getPdfHtmlStr('Análise', 'analise', '#FF754C')}
                    </div>
                ) : (`;

    code = code.replace(/{!analise \? \([ \s\S]+?col-span-12 \/\* replace boundary \*\//, 'MARK_SPLIT');
    // Using simple approach to replace entire ternary
    const regex = /\{!analise \? \([\s\S]+?\}\s*<\/main>/;
    const oldMain = code.match(/(\{!analise \? \([\s\S]+?)\s*<\/main>/)[1];

    const inputFormMatch = oldMain.match(/(\/\* ===== INPUT FORM ===== \*\/[\s\S]+?)(\/\* ===== RESULT ===== \*\/)/);
    
    if (inputFormMatch) {
       code = code.replace(oldMain, contentArea + '\n' + inputFormMatch[1] + '\n)}');
    }

    fs.writeFileSync(file, code);
}

function processBio() {
    const file = './src/app/dashboard/tools/bio/page.tsx';
    let code = fs.readFileSync(file, 'utf8');

    if (!code.includes('useRef')) code = code.replace(/import { useState, useEffect }/, "import { useState, useEffect, useRef }");
    if (!code.includes('Download')) code = code.replace(/(import {[^}]+)RotateCcw([^}]+} from 'lucide-react';)/, "$1RotateCcw, Download, History, Plus$2");

    if (!code.includes('activeTab')) {
        code = code.replace(/(const \[copied, setCopied\] = useState\(false\);)/, `$1\n    ${stateInitStr}`);
        code = code.replace(/(async function fetchUnreadCount\(\) {[\s\S]+?})/, `$1\n\n    ${getFetchHistoryStr('bio')}`);
    }

    code = code.replace(/setBios\(data\.bios\);/, `setBios(data.bios);\n            if (profile?.id) {\n                await supabase.from('ai_content_history').insert([{ user_id: profile.id, tool_type: 'bio', input_data: formData, output_content: data.bios }]);\n            }`);
    code = code.replace(/const handleReset = \(\) => {[\s\S]+?};/, `const handleReset = () => { setFormData({ nome: '', nicho: '', resultados: '', diferenciais: '', publicoAlvo: '', tomVoz: '', objetivo: '', estilo: '' }); setBios(''); setActiveTab('novo'); };`);
    code = code.replace(/const copyToClipboard = \(\) => {[\s\S]+?};/, getCopyPdf('Bio', 'bios', 'Bio_Gerada_IA', '#E1306C'));

    code = code.replace(/<div className="space-y-2">[\s\S]+?Receba 5 opções de bio profissional otimizadas para gerar autoridade e converter seguidores em clientes\.[\s\S]+?<\/p>\s+<\/div>/, `
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#E1306C] font-black text-[10px] uppercase tracking-[0.4em]">
                                <Instagram size={12} /> Gerador de Bio
                            </div>
                            <h1 className={\`text-4xl lg:text-5xl font-extrabold tracking-tight \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>
                                Bio do <span className="text-[#E1306C]">Instagram</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">
                                Receba 5 opções de bio profissional otimizadas para gerar autoridade e converter seguidores em clientes.
                            </p>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('novo')} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all \$\{activeTab === 'novo' ? 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}\`}>
                            <Plus size={18} /> Nova Bio
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all \$\{activeTab === 'historico' ? 'bg-[#E1306C] text-white shadow-lg shadow-[#E1306C]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}\`}>
                            <History size={18} /> Histórico
                        </button>
                    </div>
                </div>`);

    const oldMain = code.match(/(\{!bios \? \([\s\S]+?)\s*<\/main>/)[1];
    const inputFormMatch = oldMain.match(/(\/\* ===== FORM ===== \*\/[\s\S]+?)(\/\* ===== RESULT ===== \*\/)/);
    
    const contentArea = `{activeTab === 'historico' ? (
                    ${getHistoryStr('bio', 'setBios(item.output_content);', "setActiveTab('novo');")}
                ) : generating || bios ? (
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
                                    <p className="text-sm text-gray-400 font-medium">Buscando palavras-chave e otimizando perfis...</p>
                                </div>
                            </div>
                        ) : bios ? (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#E1306C]">Bios Geradas</span>
                                        <h3 className={\`text-2xl font-bold \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>Suas 5 opções de bio estão prontas!</h3>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'\} \$\{downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}\`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-[#E1306C] hover:border-[#E1306C] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#E1306C] hover:text-white text-gray-700'\}\`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#E1306C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#c31960] transition-all shadow-lg shadow-[#E1306C]/20">
                                            <RotateCcw size={16} /> Gerar Novamente
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
                        ${getPdfHtmlStr('Bio', 'bios', '#E1306C')}
                    </div>
                ) : (`;

    if (inputFormMatch) {
        code = code.replace(oldMain, contentArea + '\n' + inputFormMatch[1] + '\n)}');
    }

    fs.writeFileSync(file, code);
}

function processNegociacao() {
    const file = './src/app/dashboard/tools/negociacao/page.tsx';
    let code = fs.readFileSync(file, 'utf8');

    if (!code.includes('Download')) code = code.replace(/(import {[^}]+)Settings2([^}]+} from 'lucide-react';)/, "$1Settings2, Download, History, Plus, Check, Copy$2");

    if (!code.includes('activeTab')) {
        code = code.replace(/(const \[loadingFeedback, setLoadingFeedback\] = useState\(false\);)/, `$1\n    ${stateInitStr}\n    const [copied, setCopied] = useState(false);`);
        code = code.replace(/(async function fetchUnreadCount\(\) {[\s\S]+?})/, `$1\n\n    ${getFetchHistoryStr('negociacao')}`);
    }

    code = code.replace(/setFeedback\(data\.feedback\);/, `setFeedback(data.feedback);\n            if (profile?.id) {\n                await supabase.from('ai_content_history').insert([{ user_id: profile.id, tool_type: 'negociacao', input_data: { contexto, messages }, output_content: data.feedback }]);\n            }`);
    code = code.replace(/const handleReset = \(\) => {[\s\S]+?};/, `const handleReset = () => { setSetupDone(false); setMessages([]); setInput(''); setShowFeedback(false); setFeedback(''); setContexto({ produto: '', preco: '', nicho: '', dificuldade: 'Médio' }); setActiveTab('novo'); };\n\n${getCopyPdf('Negociação', 'feedback', 'Simulacao_Vendas_IA', '#10B981')}`);

    code = code.replace(/<div className="space-y-2">[\s\S]+?Pratique negociações com um cliente IA difícil\. Ao final, receba um feedback completo com score de execução\.[\s\S]+?<\/p>\s+<\/div>/, `
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#10B981] font-black text-[10px] uppercase tracking-[0.4em]">
                                <MessageSquare size={12} /> Simulador de Negociação
                            </div>
                            <h1 className={\`text-4xl lg:text-5xl font-extrabold tracking-tight \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>
                                Treinamento de <span className="text-[#10B981]">Vendas</span>
                            </h1>
                            <p className="text-gray-400 font-medium max-w-lg">
                                Pratique negociações com um cliente IA difícil. Ao final, receba um feedback completo com score de execução.
                            </p>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveTab('novo')} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all \$\{activeTab === 'novo' ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}\`}>
                            <Plus size={18} /> Nova Simulação
                        </button>
                        <button onClick={() => setActiveTab('historico')} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all \$\{activeTab === 'historico' ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30' : isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}\`}>
                            <History size={18} /> Histórico
                        </button>
                    </div>
                </div>`);

    const oldMain = code.match(/(\{!setupDone \? \([\s\S]+?)\s*<\/main>/)[1];

    // Splitting by ? and :
    const setupFormMatch = oldMain.match(/(\/\* ===== SETUP ===== \*\/[\s\S]+?\)) : showFeedback \? \(/);
    const feedbackMatch = oldMain.match(/(\/\* ===== FEEDBACK ===== \*\/[\s\S]+?\)) : \(/);
    const chatMatch = oldMain.match(/(\/\* ===== CHAT ===== \*\/[\s\S]+?\s*\))/);

    let newRender = `{activeTab === 'historico' ? (
                    ${getHistoryStr('negociacao', 'setFeedback(item.output_content);', "setShowFeedback(true); setSetupDone(true); setActiveTab('novo');")}
                ) : !setupDone ? (
                    ${setupFormMatch[1]}
                ) : showFeedback ? (
                    <div className={\`p-10 rounded-[2.5rem] border \$\{isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'\} space-y-8 min-h-[500px] relative overflow-hidden\`}>
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
                                        <h3 className={\`text-2xl font-bold \$\{isDark ? 'text-white' : 'text-[#1B1D21]'}\`}>Sua análise de performance</h3>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button onClick={downloadPDF} disabled={downloadingPDF} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'\} \$\{downloadingPDF ? 'opacity-50 cursor-not-allowed' : ''}\`}>
                                            {downloadingPDF ? <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</> : <><Download size={16} /> Salvar PDF</>}
                                        </button>
                                        <button onClick={copyToClipboard} className={\`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border \$\{isDark ? 'bg-white/5 border-white/10 hover:bg-[#10B981] hover:border-[#10B981] hover:text-white text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-[#10B981] hover:text-white text-gray-700'\}\`}>
                                            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                        </button>
                                        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#10B981] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20">
                                            <RotateCcw size={16} /> Nova Simulação
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
                        ${getPdfHtmlStr('Simulação de Vendas', 'feedback', '#10B981')}
                    </div>
                ) : (
                    ${chatMatch[1]}
                )}`;

    code = code.replace(oldMain, newRender);

    fs.writeFileSync(file, code);
}

function fixRoteirosPdf() {
    const file = './src/app/dashboard/tools/roteiro/page.tsx';
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/<div className="absolute top-0 left-\[-9999px\] hidden">[\s\S]+?Roteiro gerado pelo App Profissão do Futuro\.[\s\S]+?<\/div>\s*<\/div>\s*<\/div>/, `${getPdfHtmlStr('Roteiro', 'script', '#6C5DD3')}`);

    code = code.replace(/element\.classList\.remove\('hidden'\);/, "element.parentElement.classList.remove('h-0', 'w-0', 'overflow-hidden');");
    code = code.replace(/element\.classList\.add\('hidden'\);/, "element.parentElement.classList.add('h-0', 'w-0', 'overflow-hidden');");
    
    // Fix margins
    code = code.replace(/margin:\s*\[20, 20, 20, 20\]/, "margin: 15");

    fs.writeFileSync(file, code);
}

processAnalise();
processBio();
processNegociacao();
fixRoteirosPdf();

console.log('All files updated successfully!');
