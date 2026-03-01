'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Bot, PenTool, Eye, Instagram, Search, Briefcase, UserCheck, BookOpen,
    Compass, MessageSquare, Zap, Heart, Users, Music, Video, Lightbulb,
    Sparkles, ArrowRight, Target, LayoutGrid
} from 'lucide-react';

const TOOL_CATEGORIES = [
    {
        id: 'roteiros',
        title: '📝 Roteiros',
        subtitle: 'Crie e analise roteiros que convertem',
        tools: [
            {
                id: 'roteiro',
                title: 'Gerador de Roteiros',
                description: 'Responda um formulário rápido e receba seu roteiro estruturado com o método GGPTSBPC.',
                icon: PenTool,
                color: 'text-[#6C5DD3]',
                bgLight: 'bg-[#6C5DD3]/10',
                bgDark: 'bg-[#6C5DD3]/20',
                href: '/dashboard/tools/roteiro',
                highlight: true,
            },
            {
                id: 'analise-roteiro',
                title: 'Análise de Roteiros',
                description: 'Cole seu texto e a IA aponta os pontos fortes, pontos de melhoria e entrega uma versão otimizada.',
                icon: Eye,
                color: 'text-[#8B7AD8]',
                bgLight: 'bg-[#8B7AD8]/10',
                bgDark: 'bg-[#8B7AD8]/20',
                href: '/dashboard/tools/analise',
            },
        ],
    },
    {
        id: 'bio-portfolio',
        title: '🎨 Bio & Portfólio',
        subtitle: 'Construa sua presença profissional irresistível',
        tools: [
            {
                id: 'bio',
                title: 'Criação de Bio',
                description: 'Transforma sua bio numa vitrine irresistível, focada em gerar autoridade e conversão.',
                icon: Instagram,
                color: 'text-[#E1306C]',
                bgLight: 'bg-[#E1306C]/10',
                bgDark: 'bg-[#E1306C]/20',
                href: '/dashboard/tools/bio',
            },
            {
                id: 'portfolio-analise',
                title: 'Análise de Portfólio',
                description: 'Receba feedback direto de marcas e entenda exatamente o que está travando o seu formato atual.',
                icon: Search,
                color: 'text-[#D946A8]',
                bgLight: 'bg-[#D946A8]/10',
                bgDark: 'bg-[#D946A8]/20',
                href: '/dashboard/tools/portfolio-analise',
            },
            {
                id: 'portfolio-criacao',
                title: 'Criador de Portfólio',
                description: 'Saia do zero com ideias prontas e estruturadas pra apresentar seu trabalho de forma profissional.',
                icon: Briefcase,
                color: 'text-[#C026D3]',
                bgLight: 'bg-[#C026D3]/10',
                bgDark: 'bg-[#C026D3]/20',
                href: '/dashboard/tools/portfolio-criacao',
            },
            {
                id: 'marca-pessoal',
                title: 'Marca Pessoal',
                description: 'Ajuste sua imagem, tom de voz e posicionamento estratégico para virar referência no seu nicho.',
                icon: UserCheck,
                color: 'text-[#A855F7]',
                bgLight: 'bg-[#A855F7]/10',
                bgDark: 'bg-[#A855F7]/20',
                href: '/dashboard/tools/marca-pessoal',
            },
            {
                id: 'thecal',
                title: 'Método THECAL',
                description: 'Aprimore os fundamentos THECAL (Thumbnail, Hook, Edição, Copy, Autenticidade, Leveza) nos seus posts.',
                icon: BookOpen,
                color: 'text-[#7C3AED]',
                bgLight: 'bg-[#7C3AED]/10',
                bgDark: 'bg-[#7C3AED]/20',
                href: '/dashboard/tools/thecal',
            },
        ],
    },
    {
        id: 'abordagens',
        title: '🤝 Abordagens',
        subtitle: 'Conquiste marcas com mensagens certeiras',
        tools: [
            {
                id: 'radar',
                title: 'Radar de Oportunidade',
                description: 'Descubra onde caçar campanhas e as marcas certas para o seu perfil e momento atual.',
                icon: Compass,
                color: 'text-[#10B981]',
                bgLight: 'bg-[#10B981]/10',
                bgDark: 'bg-[#10B981]/20',
                href: '/dashboard/tools/radar',
            },
            {
                id: 'abordagem-analise',
                title: 'Análise de Abordagem',
                description: 'Receba um diagnóstico de por que a marca não respondeu à sua mensagem e como corrigi-la.',
                icon: MessageSquare,
                color: 'text-[#059669]',
                bgLight: 'bg-[#059669]/10',
                bgDark: 'bg-[#059669]/20',
                href: '/dashboard/tools/abordagem-analise',
            },
            {
                id: 'abordagem-objetiva',
                title: 'Abordagem Objetiva',
                description: 'Gere um pitch de vendas curto, direto e impossível de ignorar para as marcas.',
                icon: Zap,
                color: 'text-[#14B8A6]',
                bgLight: 'bg-[#14B8A6]/10',
                bgDark: 'bg-[#14B8A6]/20',
                href: '/dashboard/tools/abordagem-objetiva',
            },
            {
                id: 'abordagem-storytelling',
                title: 'Abordagem Storytelling',
                description: 'Crie um pitch baseado numa história real que gera conexão emocional e atrai clientes.',
                icon: Heart,
                color: 'text-[#0D9488]',
                bgLight: 'bg-[#0D9488]/10',
                bgDark: 'bg-[#0D9488]/20',
                href: '/dashboard/tools/abordagem-storytelling',
            },
            {
                id: 'abordagem-influencer',
                title: 'Abordagem "Seu Influencer"',
                description: 'Mensagem otimizada especificamente para aplicar em campanhas dentro das plataformas UGC.',
                icon: Users,
                color: 'text-[#047857]',
                bgLight: 'bg-[#047857]/10',
                bgDark: 'bg-[#047857]/20',
                href: '/dashboard/tools/abordagem-influencer',
            },
        ],
    },
    {
        id: 'videos',
        title: '🎬 Vídeos & Conteúdo',
        subtitle: 'Produza conteúdo de alto impacto visual',
        tools: [
            {
                id: 'capcut',
                title: 'Sons Estratégicos',
                description: 'Receba uma seleção inteligente de sons e decupagem sugerida para aumentar a retenção visual.',
                icon: Music,
                color: 'text-[#FF754C]',
                bgLight: 'bg-[#FF754C]/10',
                bgDark: 'bg-[#FF754C]/20',
                href: '/dashboard/tools/capcut',
            },
            {
                id: 'analise-video',
                title: 'Análise de Vídeos',
                description: 'Submeta a prévia do seu vídeo e receba um diagnóstico profundo focado na conversão.',
                icon: Video,
                color: 'text-[#F97316]',
                bgLight: 'bg-[#F97316]/10',
                bgDark: 'bg-[#F97316]/20',
                href: '/dashboard/tools/analise-video',
            },
            {
                id: 'ganchos',
                title: 'Ideias de Ganchos',
                description: 'Gere frases contraintuitivas e takes visuais para prender a atenção do público nos 3 segundos iniciais.',
                icon: Lightbulb,
                color: 'text-[#EAB308]',
                bgLight: 'bg-[#EAB308]/10',
                bgDark: 'bg-[#EAB308]/20',
                href: '/dashboard/tools/ganchos',
            },
        ],
    },
];

export default function ToolsPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

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

    if (loading || themeLoading) return null;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header
                    profile={profile}
                    unreadCount={unreadCount}
                    onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)}
                    showProfile={true}
                    notificationsOpen={notificationsOpen}
                    recentMessages={recentMessages}
                    searchPlaceholder="Procurar ferramenta..."
                />

                {/* Hero Banner */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6C5DD3] via-[#8E82E3] to-[#FF754C] p-10 lg:p-14 text-white shadow-2xl shadow-[#6C5DD3]/20">
                    <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
                    <div className="max-w-xl space-y-5 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-inner">
                            <Bot size={14} className="text-yellow-300 drop-shadow-md" />
                            <span>Central de Ferramentas IA</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
                            15 ferramentas de IA pra você dominar o jogo
                        </h1>
                        <p className="text-white/90 text-lg max-w-lg font-medium">
                            Do roteiro à abordagem, do portfólio ao gancho — tudo estruturado com a metodologia Rafinha.AI pra você criar, analisar e converter.
                        </p>
                    </div>
                    <Sparkles className="absolute right-10 top-10 w-40 h-40 opacity-20 rotate-12 drop-shadow-2xl" />
                    <Target className="absolute right-32 bottom-0 w-32 h-32 opacity-20 -rotate-12 drop-shadow-2xl" />
                </div>

                {/* Category Tabs */}
                <div className="flex bg-transparent overflow-x-auto no-scrollbar py-2">
                    <div className={`flex gap-2 p-1 rounded-2xl w-max ${isDark ? 'bg-white/5' : 'bg-gray-100/50'}`}>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'all'
                                ? isDark ? 'bg-[#2A2E33] text-[#6C5DD3] shadow-sm' : 'bg-white text-[#6C5DD3] shadow-sm'
                                : isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                                }`}
                        >
                            <LayoutGrid size={16} />
                            Todos
                        </button>
                        {TOOL_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveTab(cat.id)}
                                className={`flex items-center whitespace-nowrap gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === cat.id
                                    ? isDark ? 'bg-[#2A2E33] text-[#6C5DD3] shadow-sm' : 'bg-white text-[#6C5DD3] shadow-sm'
                                    : isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                                    }`}
                            >
                                {cat.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tool Categories */}
                <div className="space-y-12">
                    {TOOL_CATEGORIES.filter(cat => activeTab === 'all' || activeTab === cat.id).map((category) => (
                        <div key={category.id} className="space-y-6">
                            {/* Only show category title if viewing all */}
                            {activeTab === 'all' && (
                                <div className="flex items-end gap-4 ml-2">
                                    <div>
                                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                            {category.title.split(' ').slice(1).join(' ')} {/* Remove emoji for cleaner look */}
                                        </h2>
                                        <p className={`text-sm font-medium mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {category.subtitle}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
                                {category.tools.map((tool) => (
                                    <ToolCard
                                        key={tool.id}
                                        title={tool.title}
                                        description={tool.description}
                                        icon={tool.icon}
                                        color={tool.color}
                                        bgLight={tool.bgLight}
                                        bgDark={tool.bgDark}
                                        isDark={isDark}
                                        action="Acessar"
                                        onClick={() => router.push(tool.href)}
                                        highlight={tool.highlight}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom spacer */}
                <div className="h-8"></div>
            </main>
        </div>
    );
}

function ToolCard({ title, description, icon: Icon, color, bgLight, bgDark, isDark, action, onClick, highlight = false }: any) {
    const iconBg = isDark ? bgDark : bgLight;

    return (
        <div
            onClick={onClick}
            className={`group flex flex-col p-6 rounded-3xl border ${isDark ? 'bg-[#14171A] border-white/5 hover:border-white/10 hover:bg-[#1A1D21]' : 'bg-white border-gray-100/80 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/40'} transition-all duration-300 relative overflow-hidden cursor-pointer`}
        >
            {highlight && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF754C]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            )}

            <div className="flex items-start justify-between mb-5 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} ${iconBg} transition-all duration-300 group-hover:scale-105`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
                {/* Minimalist AI Indicator instead of heavy badge */}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'} opacity-60`}>
                    <Sparkles size={10} />
                    <span>IA</span>
                </div>
            </div>

            <h3 className={`text-base font-bold mb-2 relative z-10 ${isDark ? 'text-gray-100 group-hover:text-white' : 'text-[#1B1D21] group-hover:text-[#6C5DD3]'} transition-colors leading-snug`}>
                {title}
            </h3>

            <p className={`text-[13px] font-medium mb-6 flex-1 leading-relaxed relative z-10 ${isDark ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-500'} transition-colors line-clamp-3`}>
                {description}
            </p>

            <div className={`flex items-center pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-50'} relative z-10`}>
                <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-400 group-hover:text-[#6C5DD3]'} flex items-center gap-2 transition-all`}>
                    {action}
                    <ArrowRight size={13} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </span>
            </div>
        </div>
    );
}
