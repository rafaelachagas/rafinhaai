const fs = require('fs');

const tools = [
    'src/app/dashboard/tools/analise/page.tsx',
    'src/app/dashboard/tools/bio/page.tsx'
];

tools.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Fix 1: The mangled fetchUnreadCount
    const brokenFetch1 = /async function fetchUnreadCount\(\) \{\r?\n\s*if \(\!profile\?\.id\) return;\r?\n\s*const \{ data: recent \}\r?\n/;        
    const brokenFetch2Search = /\}, \[activeTab, profile\]\); = await supabase\.from\('messages'\)\.select\('\*'\)\.or\(`recipient_id\.eq\.\$\{profile\?\.id\},recipient_id\.is\.null`\)\.order\('created_at', \{ ascending: false \}\)\.limit\(5\);/;

    if (content.match(brokenFetch1) && content.match(brokenFetch2Search)) {
        content = content.replace(brokenFetch1, '');
        
        const fixedFetch2 = `}, [activeTab, profile]);

    async function fetchUnreadCount() {
        if (!profile?.id) return;
        const { data: recent } = await supabase.from('messages').select('*').or(\`recipient_id.eq.\${profile?.id},recipient_id.is.null\`).order('created_at', { ascending: false }).limit(5);`;
        
        content = content.replace(brokenFetch2Search, fixedFetch2);
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
});

console.log('Done syntax fix');
