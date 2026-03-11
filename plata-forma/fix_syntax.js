const fs = require('fs');

const tools = [
    'src/app/dashboard/tools/analise/page.tsx',
    'src/app/dashboard/tools/bio/page.tsx',
    'src/app/dashboard/tools/negociacao/page.tsx'
];

tools.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Fix 1: The mangled fetchUnreadCount
    const brokenFetch1 = `    async function fetchUnreadCount() {
        if (!profile?.id) return;
        const { data: recent }`;
        
    const brokenFetch2Search = `    }, [activeTab, profile]); = await supabase.from('messages').select('*').or(\`recipient_id.eq.\${profile?.id},recipient_id.is.null\`).order('created_at', { ascending: false }).limit(5);`;

    if (content.includes(brokenFetch1) && content.includes(brokenFetch2Search)) {
        content = content.replace(brokenFetch1, '');
        
        const fixedFetch2 = `    }, [activeTab, profile]);

    async function fetchUnreadCount() {
        if (!profile?.id) return;
        const { data: recent } = await supabase.from('messages').select('*').or(\`recipient_id.eq.\${profile?.id},recipient_id.is.null\`).order('created_at', { ascending: false }).limit(5);`;
        
        content = content.replace(brokenFetch2Search, fixedFetch2);
    }

    // Fix 2: Unbalanced JSX at bottom
    // We can just remove the extraneous `) : (\n\n)}`
    
    // For analise and bio it was `                ) : (\n                    \n)}`
    content = content.replace(/[ \t]*\)\s*:\s*\(\s*\n+\s*\n\)\}/g, '');
    
    fs.writeFileSync(file, content);
});

// For negociacao, it's even more mangled at the bottom
let negContent = fs.readFileSync('src/app/dashboard/tools/negociacao/page.tsx', 'utf8');
negContent = negContent.replace(/height: 'calc\(100vh - 350px\)\s+/, "height: 'calc(100vh - 350px)' }}>");
fs.writeFileSync('src/app/dashboard/tools/negociacao/page.tsx', negContent);

console.log('Done syntax fix');
