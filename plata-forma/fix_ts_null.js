const fs = require('fs');

const tools = [
    'src/app/dashboard/tools/analise/page.tsx',
    'src/app/dashboard/tools/bio/page.tsx',
    'src/app/dashboard/tools/negociacao/page.tsx',
    'src/app/dashboard/tools/roteiro/page.tsx'
];

tools.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix element.parentElement.style
    content = content.replace(/element\.parentElement\.style\.display = 'block';/g, "if (element.parentElement) element.parentElement.style.display = 'block';");
    content = content.replace(/element\.parentElement\.style\.display = 'none';/g, "if (element.parentElement) element.parentElement.style.display = 'none';");
    
    fs.writeFileSync(file, content);
});

console.log('Fixed TS null errors');
