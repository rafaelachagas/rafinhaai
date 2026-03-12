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

    // Fix 1: Double </div> at the end of some tool areas
    content = content.replace(/<\/div><\/div>\s*\)\s*:\s*\(/g, "</div>\n                ) : (");

    // Fix 2: PDF Alignment and "gerado"
    const pdfRegex = /\{(\/\* Hidden PDF container \*\/)\}\s*<div style=\{\{ display: 'none'.+?<\/div>\s*<\/div>/s;
    
    // Define the standardized PDF container
    const standardizedPDF = `{/* Hidden PDF container */}
                        <div style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}>
                            <div ref={contentRef} style={{ width: '800px', backgroundColor: '#ffffff', color: '#1f2937', padding: '50px', boxSizing: 'border-box' }} className="font-sans">
                                {/* Logo */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', borderBottom: '2px solid #f3f4f6', paddingBottom: '30px' }}>
                                    <img src="/logo-original-si.png" alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                                </div>
                                
                                {/* Content */}
                                <div className="text-[#1f2937] text-sm" style={{ width: '100%', wordBreak: 'break-word', overflowWrap: 'break-word', textAlign: 'justify', lineHeight: '1.6' }}>
                                    <div className="
                                        [&_p]:mb-6 [&_p]:leading-relaxed
                                        [&_h1]:text-3xl [&_h1]:font-black [&_h1]:mb-6 [&_h1]:mt-8 [&_h1]:text-[${tool.color}]
                                        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-[${tool.color}]
                                        [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[${tool.color}]
                                        [&_ul]:list-disc [&_ul]:ml-8 [&_ul]:mb-6 [&_ul_li]:mb-2
                                        [&_ol]:list-decimal [&_ol]:ml-8 [&_ol]:mb-6 [&_ol_li]:mb-2
                                        [&_strong]:font-bold [&_strong]:text-[#000000]
                                        [&_hr]:my-8 [&_hr]:border-[#e5e7eb]
                                    ">
                                        <ReactMarkdown>{${tool.toolKey === 'analise' ? 'analise' : tool.toolKey === 'bio' ? 'bios' : tool.toolKey === 'roteiro' ? 'script' : 'feedback'}}</ReactMarkdown>
                                    </div>
                                </div>
                                
                                {/* Footer */}
                                <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #f3f4f6', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#9ca3af' }}>
                                    ${tool.name} gerado pelo App Profissão do Futuro.
                                </div>
                            </div>
                        </div>`;

    if (content.match(pdfRegex)) {
        content = content.replace(pdfRegex, standardizedPDF);
    } else {
        // If missing (like in negociacao), inject it before the last </div>
        // But let's be more specific. In negociacao it should be inside the layout.
    }

    fs.writeFileSync(tool.file, content);
    console.log(`Processed ${tool.file}`);
});
