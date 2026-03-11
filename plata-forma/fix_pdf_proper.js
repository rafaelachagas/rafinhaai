const fs = require('fs');

const tools = [
    { 
        file: 'src/app/dashboard/tools/analise/page.tsx', 
        filename: 'Analise_Gerada_IA', 
        varName: 'analise',
        appName: 'Análise',
        color: '#FF754C'
    },
    { 
        file: 'src/app/dashboard/tools/bio/page.tsx', 
        filename: 'Bio_Gerada_IA', 
        varName: 'bios',
        appName: 'Bio',
        color: '#E1306C'
    },
    { 
        file: 'src/app/dashboard/tools/negociacao/page.tsx', 
        filename: 'Simulacao_Vendas_IA', 
        varName: 'feedback',
        appName: 'Simulação de Vendas',
        color: '#10B981'
    },
    { 
        file: 'src/app/dashboard/tools/roteiro/page.tsx', 
        filename: 'Roteiro_Gerado_IA', 
        varName: 'script',
        appName: 'Roteiro',
        color: '#6C5DD3'
    }
];

tools.forEach(tool => {
    let content = fs.readFileSync(tool.file, 'utf8');

    // Replace downloadPDF exactly by splitting at its signature and the next function
    const startIdx = content.indexOf('const downloadPDF = async () => {');
    const endIdxStr = 'if (loading || themeLoading) return null;';
    const endIdx = content.indexOf(endIdxStr);

    if (startIdx !== -1 && endIdx !== -1) {
        const replacement = `const downloadPDF = async () => {
        if (!contentRef.current) return;
        setDownloadingPDF(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = contentRef.current;
            element.parentElement.style.display = 'block';
            
            const opt = {
                margin:       15,
                filename:     '${tool.filename}.pdf',
                image:        { type: 'jpeg' as const, quality: 1 },
                html2canvas:  { scale: 2, useCORS: true, windowWidth: 800, letterRendering: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };
            
            await html2pdf().set(opt).from(element).save();
            element.parentElement.style.display = 'none';
        } catch (error) {
            console.error('Erro ao gerar PDF', error);
        } finally {
            setDownloadingPDF(false);
        }
    };

    `;
        content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    }

    // PDF HTML replacement
    const pdfRegex = /\{\/\* Hidden PDF container \*\/\}[\s\S]*?(?=<\/div>\s*\)\s*:|(?:\n\s*)*<\/div>\s*\}\s*<\/main>|(?:\n\s*)*<\/div>\s*\)\s*\}\s*<\/main>|<\/div>\s*\}\s*<\/div>\s*\}\s*<\/main>)/;

    const replacementHtml = `{/* Hidden PDF container */}
                        <div style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}>
                            <div ref={contentRef} style={{ width: '800px', backgroundColor: '#ffffff', color: '#1f2937', padding: '40px', boxSizing: 'border-box' }} className="font-sans">
                                {/* Logo */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', paddingBottom: '24px' }}>
                                    <img src="/logo-original-si.png" alt="Logo" style={{ height: '56px', objectFit: 'contain' }} />
                                </div>
                                
                                {/* Content */}
                                <div className="text-[#1f2937] text-sm" style={{ width: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    <div className="
                                        [&_p]:mb-4 [&_p]:leading-relaxed
                                        [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[${tool.color}]
                                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-[${tool.color}]
                                        [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[${tool.color}]
                                        [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-4 [&_ul_li]:mb-1
                                        [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-4 [&_ol_li]:mb-1
                                        [&_strong]:font-bold [&_strong]:text-[#000000]
                                        [&_hr]:my-6 [&_hr]:border-[#e5e7eb]
                                    ">
                                        <ReactMarkdown>{${tool.varName}}</ReactMarkdown>
                                    </div>
                                </div>
                                
                                {/* Footer */}
                                <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>
                                    ${tool.appName} gerada pelo App Profissão do Futuro.
                                </div>
                            </div>
                        </div>`;

    if (content.match(pdfRegex)) {
        content = content.replace(pdfRegex, replacementHtml);
    } else {
        const altRegex = /\{\/\* Hidden PDF container \*\/\}[\s\S]+?(?=<\/div>\s*\)\s*\}|(?:\n\s*)*<\/div>\s*\}\s*<\/div>)/;
        if(content.match(altRegex)) {
            content = content.replace(altRegex, replacementHtml);
        }
    }

    fs.writeFileSync(tool.file, content);
});

console.log('Done fixing PDF code properly!');
