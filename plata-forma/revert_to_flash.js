const fs = require('fs');
const path = require('path');

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
    content = content.replace(/gemini-1\.5-pro/g, 'gemini-1.5-flash');
    fs.writeFileSync(route, content);
    console.log(`Updated ${route} to gemini-1.5-flash`);
});
