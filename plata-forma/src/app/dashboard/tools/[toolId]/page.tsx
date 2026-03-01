'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    ArrowLeft, Sparkles, Loader2, Copy, Check, Search, Briefcase, UserCheck,
    BookOpen, Compass, MessageSquare, Zap, Heart, Users, Music, Video, Lightbulb,
    Send, RotateCcw, Upload, Image as ImageIcon, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface FieldConfig {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'image';
    placeholder?: string;
    required?: boolean;
    options?: string[];
}

interface ToolConfig {
    title: string;
    subtitle: string;
    description: string;
    icon: any;
    color: string;
    badgeColor: string;
    badgeText: string;
    categoryLabel: string;
    fields: FieldConfig[];
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
    'portfolio-analise': {
        title: 'Análise de Portfólio',
        subtitle: 'Receba um diagnóstico afiado do seu portfólio',
        description: 'Cole o link ou descreva seu portfólio e receba feedback direto: o que cortar, o que lapidar, o que tá travando marcas de confiarem em você.',
        icon: Search,
        color: '#D946A8',
        badgeColor: 'bg-[#D946A8]/10 text-[#D946A8] border-[#D946A8]/20',
        badgeText: 'BIO & PORTFÓLIO',
        categoryLabel: 'Análise de Portfólio',
        fields: [
            { id: 'imagem', label: 'Faça upload do seu portfólio (Tire um print da tela inteira ou da melhor seção)', type: 'image' },
            { id: 'portfolio', label: 'Ou, se preferir descrever / colar o link:', type: 'textarea', placeholder: 'Cole o link do seu portfólio, ou descreva o que você tem nele: tipos de vídeo, marcas que trabalhou...' },
            { id: 'nicho', label: 'Qual seu nicho?', type: 'text', placeholder: 'Ex: Beleza, Fitness, Tech, Gastronomia...', required: true },
            { id: 'objetivo', label: 'O que você quer alcançar com o portfólio?', type: 'text', placeholder: 'Ex: Atrair marcas de skincare, conseguir campanhas maiores...' },
        ],
    },
    'portfolio-criacao': {
        title: 'Criação de Portfólio',
        subtitle: 'Saia do zero com um portfólio estruturado',
        description: 'Receba ideias prontas e estruturadas pra apresentar seu trampo de forma profissional — mesmo que você ainda não tenha trabalhado com marcas.',
        icon: Briefcase,
        color: '#C026D3',
        badgeColor: 'bg-[#C026D3]/10 text-[#C026D3] border-[#C026D3]/20',
        badgeText: 'BIO & PORTFÓLIO',
        categoryLabel: 'Criação de Portfólio',
        fields: [
            { id: 'nicho', label: 'Qual seu nicho?', type: 'text', placeholder: 'Ex: Beleza, Fitness, Moda, Tech...', required: true },
            { id: 'experiencia', label: 'Qual sua experiência atual com UGC?', type: 'select', options: ['Iniciante — nunca fiz UGC', 'Já fiz alguns vídeos pessoais', 'Já trabalhei com 1-3 marcas', 'Já trabalhei com 4+ marcas'], required: true },
            { id: 'estilo', label: 'Que estilo de conteúdo você curte?', type: 'select', options: ['Review natural', 'Get Ready With Me', 'Unboxing', 'Tutorial/How-to', 'Storytelling pessoal', 'Vários estilos'] },
            { id: 'marcas', label: 'Marcas que você sonha trabalhar', type: 'text', placeholder: 'Ex: Natura, Shein, Stanley, Sephora...' },
        ],
    },
    'marca-pessoal': {
        title: 'Marca Pessoal',
        subtitle: 'Ajuste sua imagem pra virar referência',
        description: 'Analisa seu posicionamento atual e te entrega um plano pra ajustar sua imagem e virar referência no nicho.',
        icon: UserCheck,
        color: '#A855F7',
        badgeColor: 'bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/20',
        badgeText: 'BIO & PORTFÓLIO',
        categoryLabel: 'Marca Pessoal',
        fields: [
            { id: 'nome', label: 'Seu nome ou @ do Instagram', type: 'text', placeholder: 'Ex: @seunome', required: true },
            { id: 'nicho', label: 'Qual seu nicho?', type: 'text', placeholder: 'Ex: Beleza, Lifestyle, Moda, Fitness...', required: true },
            { id: 'perfil', label: 'Descreva como é seu perfil hoje', type: 'textarea', placeholder: 'O que você posta, como são seus stories, que tipo de conteúdo faz, qual a vibe do visual...', required: true },
            { id: 'objetivo', label: 'Onde você quer chegar?', type: 'text', placeholder: 'Ex: Ser referência em skincare, fechar com marcas grandes, viver de UGC...' },
        ],
    },
    'thecal': {
        title: 'THECAL-POSTFÓLIO',
        subtitle: 'Trabalhe cada letra do método THECAL',
        description: 'Escolha qual letra do método THECAL você quer trabalhar hoje e receba orientação personalizada.',
        icon: BookOpen,
        color: '#7C3AED',
        badgeColor: 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20',
        badgeText: 'BIO & PORTFÓLIO',
        categoryLabel: 'THECAL-POSTFÓLIO',
        fields: [
            { id: 'letra', label: 'Qual letra do THECAL quer trabalhar?', type: 'select', options: ['T — Thumbnail / Capa', 'H — Hook / Gancho', 'E — Edição / Estética', 'C — Copy / Legenda', 'A — Autenticidade', 'L — Leveza / Naturalidade'], required: true },
            { id: 'nicho', label: 'Qual seu nicho?', type: 'text', placeholder: 'Ex: Beleza, Fitness, Gastronomia...', required: true },
            { id: 'contexto', label: 'Descreva o que você já tem ou quer melhorar', type: 'textarea', placeholder: 'Ex: Minhas capas são muito genéricas, quero aprender a fazer hooks que prendam...' },
        ],
    },
    'radar': {
        title: 'Radar de Oportunidade',
        subtitle: 'Descubra onde estão as oportunidades',
        description: 'Encontre campanhas e marcas que combinam com você — sem ficar dando tiro no escuro.',
        icon: Compass,
        color: '#10B981',
        badgeColor: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
        badgeText: 'ABORDAGENS',
        categoryLabel: 'Radar de Oportunidade',
        fields: [
            { id: 'nicho', label: 'Qual seu nicho?', type: 'text', placeholder: 'Ex: Beleza, Fitness, Tech, Gastronomia...', required: true },
            { id: 'plataforma', label: 'Onde você quer encontrar oportunidades?', type: 'select', options: ['Instagram', 'TikTok', 'Plataformas de UGC (Seu Influencer, Insiders...)', 'Todas as opções'], required: true },
            { id: 'nivel', label: 'Qual seu nível?', type: 'select', options: ['Iniciante — nunca abordei marcas', 'Já mandei algumas mensagens', 'Já fechei trabalhos', 'Profissional'] },
            { id: 'regiao', label: 'Região/País de foco', type: 'text', placeholder: 'Ex: Brasil, Portugal, EUA...' },
        ],
    },
    'abordagem-analise': {
        title: 'Análise de Abordagem',
        subtitle: 'Descubra por que a marca não respondeu',
        description: 'Cole a mensagem que você mandou e receba um diagnóstico completo com o que melhorar.',
        icon: MessageSquare,
        color: '#059669',
        badgeColor: 'bg-[#059669]/10 text-[#059669] border-[#059669]/20',
        badgeText: 'ABORDAGENS',
        categoryLabel: 'Análise de Abordagem',
        fields: [
            { id: 'mensagem', label: 'Cole a mensagem que você enviou', type: 'textarea', placeholder: 'Cole aqui a DM, email ou mensagem que você mandou pra marca...', required: true },
            { id: 'marca', label: 'Para qual marca foi?', type: 'text', placeholder: 'Ex: Natura, Shein, marca local...', required: true },
            { id: 'canal', label: 'Por onde você mandou?', type: 'select', options: ['DM do Instagram', 'Email', 'Plataforma de UGC', 'LinkedIn', 'Outro'] },
            { id: 'resposta', label: 'A marca respondeu algo?', type: 'textarea', placeholder: 'Se responderam, cole a resposta aqui. Se não responderam, deixe em branco.' },
        ],
    },
    'abordagem-objetiva': {
        title: 'Abordagem Objetiva',
        subtitle: 'Texto curto, direto, impossível de ignorar',
        description: 'Gera uma mensagem de abordagem curta e direta, personalizada pra marca que você quer atingir.',
        icon: Zap,
        color: '#14B8A6',
        badgeColor: 'bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/20',
        badgeText: 'ABORDAGENS',
        categoryLabel: 'Abordagem Objetiva',
        fields: [
            { id: 'marca', label: 'Nome da marca', type: 'text', placeholder: 'Ex: Natura, Boticário, marca local...', required: true },
            { id: 'produto', label: 'Produto ou categoria', type: 'text', placeholder: 'Ex: Skincare, Suplementos, Roupas fitness...', required: true },
            { id: 'nicho', label: 'Seu nicho', type: 'text', placeholder: 'Ex: Beleza, Fitness, Lifestyle...', required: true },
            { id: 'diferencial', label: 'Seu diferencial (o que te faz especial?)', type: 'text', placeholder: 'Ex: Tenho pele oleosa e testo tudo, audiência engajada de mães...' },
        ],
    },
    'abordagem-storytelling': {
        title: 'Abordagem Storytelling',
        subtitle: 'Conte história, gere conexão, abra conversa',
        description: 'Cria uma abordagem com storytelling que conecta emocionalmente e abre espaço pra conversa com a marca.',
        icon: Heart,
        color: '#0D9488',
        badgeColor: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20',
        badgeText: 'ABORDAGENS',
        categoryLabel: 'Abordagem Storytelling',
        fields: [
            { id: 'marca', label: 'Nome da marca', type: 'text', placeholder: 'Ex: Granado, Simple Organic...', required: true },
            { id: 'produto', label: 'Produto ou categoria', type: 'text', placeholder: 'Ex: Skincare, Maquiagem, Suplementos...', required: true },
            { id: 'historia', label: 'Sua história com o produto/marca', type: 'textarea', placeholder: 'Conte como você conheceu o produto, o que mudou na sua rotina, como se sentiu...', required: true },
            { id: 'objetivo', label: 'O que você quer propor?', type: 'text', placeholder: 'Ex: Parceria pra conteúdo, permuta, campanha paga...' },
        ],
    },
    'abordagem-influencer': {
        title: 'Abordagem Seu Influencer',
        subtitle: 'Abordagem otimizada pra plataforma',
        description: 'Mensagem específica pra rodar dentro da plataforma Seu Influencer, com lógica de conversão otimizada.',
        icon: Users,
        color: '#047857',
        badgeColor: 'bg-[#047857]/10 text-[#047857] border-[#047857]/20',
        badgeText: 'ABORDAGENS',
        categoryLabel: 'Abordagem Seu Influencer',
        fields: [
            { id: 'campanha', label: 'Nome da campanha ou marca', type: 'text', placeholder: 'Ex: Campanha Verão Natura, Parceria Shein...', required: true },
            { id: 'descricao', label: 'Descreva a campanha (se tiver briefing, cole aqui)', type: 'textarea', placeholder: 'Cole o briefing da campanha ou descreva o que a marca está pedindo...', required: true },
            { id: 'nicho', label: 'Seu nicho', type: 'text', placeholder: 'Ex: Beleza, Fitness, Gastronomia...', required: true },
            { id: 'experiencia', label: 'Experiência relevante', type: 'text', placeholder: 'Ex: Já fiz 10 UGCs de skincare, tenho portfólio com 5 marcas...' },
        ],
    },
    'capcut': {
        title: 'CapCut Efeitos Sonoros',
        subtitle: 'Sons e transições pra dar ritmo e retenção',
        description: 'Receba uma lista curada de efeitos sonoros, transições e dicas de edição pra deixar seus vídeos irresistíveis.',
        icon: Music,
        color: '#FF754C',
        badgeColor: 'bg-[#FF754C]/10 text-[#FF754C] border-[#FF754C]/20',
        badgeText: 'VÍDEOS',
        categoryLabel: 'CapCut Efeitos Sonoros',
        fields: [
            { id: 'tipo', label: 'Tipo de vídeo', type: 'select', options: ['Unboxing', 'Get Ready With Me', 'Review de produto', 'Tutorial', 'Antes e Depois', 'Day in my life', 'Storytelling'], required: true },
            { id: 'nicho', label: 'Qual seu nicho?', type: 'text', placeholder: 'Ex: Beleza, Fitness, Tech, Gastronomia...', required: true },
            { id: 'vibe', label: 'Qual vibe do vídeo?', type: 'select', options: ['Energético e rápido', 'Relaxante e estético (ASMR)', 'Divertido e leve', 'Profissional e clean', 'Emocional e intimista'] },
            { id: 'duracao', label: 'Duração estimada', type: 'select', options: ['15 segundos', '30 segundos', '60 segundos', 'Mais de 60 segundos'] },
        ],
    },
    'analise-video': {
        title: 'Análise de Vídeos',
        subtitle: 'Diagnóstico afiado com nota e melhorias',
        description: 'Descreva seu vídeo pronto e receba uma análise completa com nota e melhorias práticas.',
        icon: Video,
        color: '#F97316',
        badgeColor: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20',
        badgeText: 'VÍDEOS',
        categoryLabel: 'Análise de Vídeos',
        fields: [
            { id: 'video', label: 'Cole o link do vídeo ou descreva ele', type: 'textarea', placeholder: 'Cole o link do Instagram/TikTok/Drive, ou descreva detalhadamente o que tem no vídeo: cenas, falas, transições, duração...', required: true },
            { id: 'nicho', label: 'Nicho do conteúdo', type: 'text', placeholder: 'Ex: Beleza, Fitness, Tech...', required: true },
            { id: 'objetivo', label: 'Qual era o objetivo do vídeo?', type: 'select', options: ['Vender um produto', 'Gerar engajamento', 'Portfólio pra marca', 'Conteúdo orgânico', 'Teste de formato'] },
        ],
    },
    'ganchos': {
        title: 'Ideias de Ganchos e Quebra-Gelos',
        subtitle: 'Pare o scroll em 3 segundos',
        description: 'Receba frases e ideias visuais pra hooks que prendem a atenção nos primeiros segundos.',
        icon: Lightbulb,
        color: '#EAB308',
        badgeColor: 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20',
        badgeText: 'VÍDEOS',
        categoryLabel: 'Ideias de Ganchos',
        fields: [
            { id: 'nicho', label: 'Qual seu nicho?', type: 'text', placeholder: 'Ex: Beleza, Fitness, Gastronomia, Tech...', required: true },
            { id: 'produto', label: 'Produto ou tema do vídeo', type: 'text', placeholder: 'Ex: Sérum facial, tênis de corrida, receita fit...', required: true },
            { id: 'plataforma', label: 'Pra qual plataforma?', type: 'select', options: ['Instagram Reels', 'TikTok', 'YouTube Shorts', 'Anúncio/Ad', 'UGC pra marca'], required: true },
            { id: 'tipoGancho', label: 'Que tipo de gancho quer?', type: 'select', options: ['Contraintuitivo (surpreende)', 'Identificação (se conecta)', 'Curiosidade (prende)', 'Urgência (gera ação)', 'Polêmico (gera debate)', 'Todos os tipos'] },
        ],
    },
};

export default function DynamicToolPage() {
    const router = useRouter();
    const params = useParams();
    const toolId = params.toolId as string;
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const [formData, setFormData] = useState<Record<string, string>>({});
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);

    const config = TOOL_CONFIGS[toolId];

    useEffect(() => {
        if (!themeLoading) {
            if (!profile) {
                const checkSession = async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) router.push('/login');
                };
                checkSession();
            } else {
                setLoading(false);
                fetchUnreadCount();
            }
        }
    }, [profile, themeLoading, router]);

    async function fetchUnreadCount() {
        if (!profile?.id) return;
        const { data: recent } = await supabase
            .from('messages')
            .select('*')
            .or(`recipient_id.eq.${profile?.id},recipient_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(5);
        if (recent) setRecentMessages(recent);
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .or(`recipient_id.eq.${profile?.id},recipient_id.is.null`)
            .eq('is_read', false);
        if (count !== null) setUnreadCount(count);
    }

    async function handleGenerate() {
        const missingRequired = config.fields
            .filter(f => f.required && !formData[f.id]?.trim())
            .map(f => f.label);

        if (missingRequired.length > 0) {
            alert(`Preencha os campos obrigatórios:\n• ${missingRequired.join('\n• ')}`);
            return;
        }

        setGenerating(true);
        setResult('');

        try {
            const res = await fetch('/api/ai/tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toolId, formData }),
            });

            if (!res.ok) throw new Error('Erro na API');

            const data = await res.json();
            setResult(data.result || data.message || 'Resultado gerado com sucesso!');
        } catch (err) {
            setResult('⚠️ **Ferramenta em fase de ativação!**\n\nEsta ferramenta está sendo conectada com a IA. Em breve ela vai funcionar 100%. Fique de olho nas atualizações! 🚀');
        } finally {
            setGenerating(false);
        }
    }

    function handleReset() {
        setFormData({});
        setResult('');
        setCopied(false);
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading || themeLoading) return null;

    if (!config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ferramenta não encontrada</p>
                <button onClick={() => router.push('/dashboard/tools')} className="text-[#6C5DD3] font-bold hover:underline">
                    ← Voltar para Ferramentas
                </button>
            </div>
        );
    }

    const Icon = config.icon;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-6 w-full min-w-0">
                <Header
                    profile={profile}
                    unreadCount={unreadCount}
                    onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)}
                    showProfile={true}
                    notificationsOpen={notificationsOpen}
                    recentMessages={recentMessages}
                    searchPlaceholder="Procurar aula ou ferramenta..."
                />

                {/* Back Button */}
                <button
                    onClick={() => router.push('/dashboard/tools')}
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#1B1D21]'} transition-colors w-fit`}
                >
                    <ArrowLeft size={16} />
                    Voltar para Ferramentas
                </button>

                {/* Tool Header */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${config.badgeColor}`}>
                            {config.badgeText}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                            style={{ backgroundColor: config.color }}
                        >
                            <Icon size={26} />
                        </div>
                        <div>
                            <h1 className={`text-3xl lg:text-4xl font-extrabold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                {config.title}
                            </h1>
                            <p className="text-gray-400 font-medium mt-1">{config.subtitle}</p>
                        </div>
                    </div>
                </div>

                {/* Content area */}
                {!result ? (
                    <div className={`rounded-[2rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} p-8 space-y-6`}>
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {config.description}
                        </p>

                        <div className="space-y-5">
                            {config.fields.map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-[#1B1D21]'}`}>
                                        {field.label}
                                        {field.required && <span className="text-red-400 ml-1">*</span>}
                                    </label>

                                    {field.type === 'text' && (
                                        <input
                                            type="text"
                                            value={formData[field.id] || ''}
                                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                            placeholder={field.placeholder}
                                            className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-medium transition-all duration-200 outline-none ${isDark
                                                ? 'bg-[#111315] border-white/10 text-white placeholder:text-gray-500 focus:border-[#6C5DD3]/50 focus:ring-2 focus:ring-[#6C5DD3]/10'
                                                : 'bg-gray-50 border-gray-200 text-[#1B1D21] placeholder:text-gray-400 focus:border-[#6C5DD3]/50 focus:ring-2 focus:ring-[#6C5DD3]/10 focus:bg-white'
                                                }`}
                                        />
                                    )}

                                    {field.type === 'textarea' && (
                                        <textarea
                                            value={formData[field.id] || ''}
                                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                            placeholder={field.placeholder}
                                            rows={4}
                                            className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-medium transition-all duration-200 outline-none resize-none ${isDark
                                                ? 'bg-[#111315] border-white/10 text-white placeholder:text-gray-500 focus:border-[#6C5DD3]/50 focus:ring-2 focus:ring-[#6C5DD3]/10'
                                                : 'bg-gray-50 border-gray-200 text-[#1B1D21] placeholder:text-gray-400 focus:border-[#6C5DD3]/50 focus:ring-2 focus:ring-[#6C5DD3]/10 focus:bg-white'
                                                }`}
                                        />
                                    )}

                                    {field.type === 'select' && (
                                        <div className="flex flex-wrap gap-2">
                                            {field.options?.map((option) => (
                                                <button
                                                    key={option}
                                                    onClick={() => setFormData({ ...formData, [field.id]: option })}
                                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${formData[field.id] === option
                                                        ? 'border-[#6C5DD3] bg-[#6C5DD3]/10 text-[#6C5DD3] shadow-sm'
                                                        : isDark
                                                            ? 'border-white/10 bg-[#111315] text-gray-300 hover:border-white/20 hover:bg-white/5'
                                                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {field.type === 'image' && (
                                        <div className={`mt-2 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-colors ${isDark ? 'border-white/10 bg-[#111315] hover:border-[#6C5DD3]/50' : 'border-gray-200 bg-gray-50 hover:border-[#6C5DD3]/50'
                                            }`}>
                                            {formData[field.id] ? (
                                                <div className="relative w-full max-w-sm rounded-[1rem] overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 group mx-auto">
                                                    <img src={formData[field.id]} alt="Preview" className="w-full h-auto object-cover max-h-64" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                        <button
                                                            onClick={() => setFormData({ ...formData, [field.id]: '' })}
                                                            className="px-4 py-2 bg-red-500 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg"
                                                        >
                                                            <X size={16} />
                                                            Remover Imagem
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/5 text-gray-400' : 'bg-white shadow-sm text-gray-500'}`}>
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        Clique para fazer upload ou arraste a imagem
                                                    </p>
                                                    <p className={`text-xs mb-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        Envie prints (PNG, JPG ou WEBP) do seu portfólio. Múltiplos prints podem ser unidos em uma colagem.
                                                    </p>
                                                    <label className="cursor-pointer bg-[#6C5DD3] hover:bg-[#5b4fbe] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-md">
                                                        <Upload size={16} />
                                                        Selecionar Imagem
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/png, image/jpeg, image/webp"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        setFormData({ ...formData, [field.id]: reader.result as string });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ backgroundColor: config.color }}
                            >
                                {generating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Gerar com IA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Result Card */}
                        <div className={`rounded-[2rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'} p-8`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                        style={{ backgroundColor: config.color }}
                                    >
                                        <Sparkles size={18} />
                                    </div>
                                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                        Resultado
                                    </h3>
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isDark
                                        ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>

                            <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} text-sm leading-relaxed`}>
                                <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleReset}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${isDark
                                    ? 'bg-[#1A1D1F] border border-white/10 text-gray-300 hover:bg-white/5'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <RotateCcw size={16} />
                                Gerar novamente
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/tools')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${isDark
                                    ? 'bg-[#1A1D1F] border border-white/10 text-gray-300 hover:bg-white/5'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <ArrowLeft size={16} />
                                Voltar
                            </button>
                        </div>
                    </div>
                )}

                {/* Bottom spacer */}
                <div className="h-8"></div>
            </main>
        </div>
    );
}
