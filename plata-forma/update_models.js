const fs = require('fs');
const path = require('path');

const files = [
    'src/app/api/ai/scripts/route.ts',
    'src/app/api/ai/roteiros/route.ts',
    'src/app/api/ai/negociacao/route.ts',
    'src/app/api/ai/analise/route.ts',
    'src/app/api/ai/bio/route.ts'
];

const basePath = 'c:\\Users\\Usuario\\Desktop\\Formação Profissão do Futuro\\1. Plataforma\\plata-forma';

files.forEach(file => {
    const fullPath = path.join(basePath, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/gemini-2\.5-flash/g, 'gemini-1.5-pro');
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${fullPath}`);
    }
});
