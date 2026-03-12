const fs = require('fs');

const tools = [
    { file: 'src/app/dashboard/tools/analise/page.tsx', toolKey: 'analise', color: '#FF754C', name: 'Análise' },
    { file: 'src/app/dashboard/tools/bio/page.tsx', toolKey: 'bio', color: '#E1306C', name: 'Bio' },
    { file: 'src/app/dashboard/tools/roteiro/page.tsx', toolKey: 'roteiro', color: '#6C5DD3', name: 'Roteiro' },
    { file: 'src/app/dashboard/tools/negociacao/page.tsx', toolKey: 'negociacao', color: '#10B981', name: 'Simulação de Vendas' }
];

tools.forEach(tool => {
    if (!fs.existsSync(tool.file)) return;
    let content = fs.readFileSync(tool.file, 'utf8');

    // Update PDF container with better alignment and padding
    const pdfRegex = /\{(\/\* Hidden PDF container \*\/)\}\s*<div style=\{\{ display: 'none'.+?<\/div>\s*<\/div>/s;
    
    const standardizedPDF = `{/* Hidden PDF container */}
                        <div style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}>
                            <div ref={contentRef} style={{ width: '750px', backgroundColor: '#ffffff', color: '#1f2937', padding: '60px', boxSizing: 'border-box', minHeight: '1000px' }} className="font-sans">
                                {/* Logo */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', borderBottom: '2px solid #f3f4f6', paddingBottom: '30px' }}>
                                    <img src="/logo-original-si.png" alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                                </div>
                                
                                {/* Content Wrapper for Alignment */}
                                <div style={{ width: '100%', textAlign: 'left' }}>
                                    <div className="text-[#1f2937] text-[14px]" style={{ lineHeight: '1.6', wordBreak: 'break-word' }}>
                                        <div className="
                                            [&_p]:mb-4 [&_p]:leading-relaxed
                                            [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-6 [&_h1]:mt-8 [&_h1]:text-[${tool.color}]
                                            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-6 [&_h2]:text-[${tool.color}]
                                            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-4 [&_h3]:text-[${tool.color}]
                                            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ul_li]:mb-2
                                            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_ol_li]:mb-2
                                            [&_strong]:font-bold [&_strong]:text-[#000000]
                                            [&_hr]:my-8 [&_hr]:border-[#e5e7eb]
                                        ">
                                            <ReactMarkdown>{${tool.toolKey === 'analise' ? 'analise' : tool.toolKey === 'bio' ? 'bios' : tool.toolKey === 'roteiro' ? 'script' : 'feedback'}}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Footer */}
                                <div style={{ marginTop: '80px', paddingTop: '30px', borderTop: '1px solid #f3f4f6', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>
                                    ${tool.name} gerada pelo App Profissão do Futuro.
                                </div>
                            </div>
                        </div>`;

    if (content.match(pdfRegex)) {
        content = content.replace(pdfRegex, standardizedPDF);
    }

    // Switch model to 2.0-flash for better quota handling
    content = content.replace(/gemini-(2\.5|1\.5)-pro/g, 'gemini-2.0-flash');
    content = content.replace(/gemini-(2\.5|1\.5)-flash/g, 'gemini-2.0-flash');

    fs.writeFileSync(tool.file, content);
    console.log(`Updated ${tool.file}`);
});

// Update API routes as well
const routes = [
    'src/app/api/ai/scripts/route.ts',
    'src/app/api/ai/roteiros/route.ts',
    'src/app/api/ai/negociacao/route.ts',
    'src/app/api/ai/analise/route.ts',
    'src/app/api/ai/bio/route.ts'
];

routes.forEach(route => {
    if (!fs.existsSync(route)) return;
    let content = fs.readFileSync(route, 'utf8');
    content = content.replace(/gemini-(2\.5|1\.5)-pro/g, 'gemini-2.0-flash');
    content = content.replace(/gemini-(2\.5|1\.5)-flash/g, 'gemini-2.0-flash');
    fs.writeFileSync(route, content);
    console.log(`Updated API ${route}`);
});
