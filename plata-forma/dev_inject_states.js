const fs = require('fs');

const tools = [
    { 
        file: 'src/app/dashboard/tools/analise/page.tsx', 
        name: 'Analise',
        toolName: 'analise',
        setTab: 'setActiveTab',
        setState: 'setAnalise(item.output_content); setActiveTab("novo");',
        fetchName: 'fetchHistory'
    },
    { 
        file: 'src/app/dashboard/tools/bio/page.tsx', 
        name: 'Bio',
        toolName: 'bio',
        setTab: 'setActiveTab',
        setState: 'setBios(item.output_content); setActiveTab("novo");',
        fetchName: 'fetchHistory'
    },
    { 
        file: 'src/app/dashboard/tools/negociacao/page.tsx', 
        name: 'Negociacao',
        toolName: 'negociacao',
        setTab: 'setActiveTab',
        setState: 'setFeedback(item.output_content); setShowFeedback(true); setSetupDone(true); setActiveTab("novo");',
        fetchName: 'fetchHistory'
    }
];

function injectHistoryCode() {
    tools.forEach(tool => {
        let code = fs.readFileSync(tool.file, 'utf8');

        // 1. Inject History States if not present
        if (!code.includes('activeTab')) {
            code = code.replace(
                /const \[copied, setCopied\] = useState\(false\);|const \[loadingFeedback, setLoadingFeedback\] = useState\(false\);/, 
                match => \`\${match}
    const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);\`
            );
        }

        // 2. Inject fetchHistory function correctly
        if (!code.includes('fetchHistory')) {
            const fetchFn = \`
    const fetchHistory = async () => {
        if (!profile?.id) return;
        setLoadingHistory(true);
        const { data } = await supabase
            .from('ai_content_history')
            .select('*')
            .eq('user_id', profile.id)
            .eq('tool_type', '\${tool.toolName}')
            .order('created_at', { ascending: false });
        
        if (data) setHistory(data);
        setLoadingHistory(false);
    };

    useEffect(() => {
        if (activeTab === 'historico') fetchHistory();
    }, [activeTab, profile]);
\`;

            // safely place BEFORE fetchUnreadCount
            code = code.replace(/async function fetchUnreadCount\(\) {/, fetchFn + '\\n    async function fetchUnreadCount() {');
        }

        fs.writeFileSync(tool.file, code);
    });
}

injectHistoryCode();
