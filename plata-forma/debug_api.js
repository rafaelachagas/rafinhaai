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
    
    // Change to gemini-1.5-flash as it's more reliable, 
    // but the user wants "Pro quality", so maybe gemini-1.5-pro is okay if it works.
    // However, if it's failing, we need to know why.
    
    // Let's add better logging.
    content = content.replace(/catch \(error\) \{/, "catch (error) {\n        console.error('AI Route Error Detail:', error);");
    
    fs.writeFileSync(route, content);
    console.log(`Updated logging in ${route}`);
});
