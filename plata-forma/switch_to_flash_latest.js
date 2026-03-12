const fs = require('fs');

const tools = [
    { file: 'src/app/dashboard/tools/analise/page.tsx' },
    { file: 'src/app/dashboard/tools/bio/page.tsx' },
    { file: 'src/app/dashboard/tools/roteiro/page.tsx' },
    { file: 'src/app/dashboard/tools/negociacao/page.tsx' }
];

tools.forEach(tool => {
    if (!fs.existsSync(tool.file)) return;
    let content = fs.readFileSync(tool.file, 'utf8');
    content = content.replace(/gemini-(2\.5|2\.0|1\.5)-(pro|flash)/g, 'gemini-flash-latest');
    content = content.replace(/gemini-(pro|flash)-latest/g, 'gemini-flash-latest');
    fs.writeFileSync(tool.file, content);
    console.log(`Updated ${tool.file} to gemini-flash-latest`);
});

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
    content = content.replace(/gemini-(2\.5|2\.0|1\.5)-(pro|flash)/g, 'gemini-flash-latest');
    content = content.replace(/gemini-(pro|flash)-latest/g, 'gemini-flash-latest');
    fs.writeFileSync(route, content);
    console.log(`Updated API ${route} to gemini-flash-latest`);
});
