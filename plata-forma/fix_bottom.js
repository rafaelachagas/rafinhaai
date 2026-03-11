const fs = require('fs');

const tools = [
    'src/app/dashboard/tools/analise/page.tsx',
    'src/app/dashboard/tools/bio/page.tsx'
];

tools.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/                    <\/div>\r?\n\r?\n            <\/main>/, "                    </div>\n                )}\n            </main>");
    fs.writeFileSync(file, content);
});

console.log('Fixed analise and bio');
