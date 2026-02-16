'use client';

import { useState, useEffect } from 'react';
import { Sparkles, BookOpen, PenTool, BarChart3, MessageSquare, LogOut, ChevronRight, PlayCircle, Settings, Users, LayoutDashboard, Target, Sun, Moon, Bell, Search, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

// Helper component for navigation items (assuming it's defined elsewhere or will be added)
interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    href?: string;
}

const NavItem = ({ icon, label, active, onClick, href }: NavItemProps) => {
    const baseClasses = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm group transition-all";
    const activeClasses = "text-white bg-white/5";
    const inactiveClasses = "text-gray-400 hover:text-white hover:bg-white/5";

    const content = (
        <>
            {icon}
            <span className="flex-1 text-left">{label}</span>
            <ChevronRight className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 ${active ? 'opacity-100' : ''}`} />
        </>
    );

    if (href) {
        return (
            <Link href={href} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
            {content}
        </button>
    );
};


export default function Dashboard() {
    const router = useRouter();
    const { isDark, toggleTheme, profile, loading: themeLoading } = useTheme();
    const [loading, setLoading] = useState(true);
    const [adminStats, setAdminStats] = useState({ totalUsers: 0 });

    useEffect(() => {
        if (!themeLoading) {
            if (!profile) {
                // Se não tem perfil, verifica se tem sessão
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (!session) router.push('/login');
                    else setLoading(false);
                });
            } else {
                setLoading(false);
            }
        }
    }, [router, profile, themeLoading]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading || themeLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0A0113]' : 'bg-gray-50'}`}>
                <div className="w-8 h-8 border-4 border-[#B42AF0] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isAdmin = profile?.role === 'admin';
    const isModerator = profile?.role === 'moderator' || isAdmin;

    const tools = [
        {
            title: 'Formação',
            desc: 'Área de aulas e conteúdos da formação.',
            icon: BookOpen,
            color: 'bg-blue-500',
            status: 'Acessar'
        },
        {
            title: 'Criar Roteiros',
            desc: 'IA para criar roteiros de alta conversão.',
            icon: PenTool, // Keeping PenTool as it was in original and is now imported
            color: 'bg-purple-500',
            status: 'Usar IA',
            link: '/dashboard/scripts'
        },
        {
            title: 'Análise de Vídeos',
            desc: 'Envie a transcrição para análise de IA.',
            icon: PlayCircle,
            color: 'bg-pink-500',
            status: 'Analisar'
        },
        {
            title: 'Negociações',
            desc: 'Gerencie seus contatos e fechamentos.',
            icon: MessageSquare,
            color: 'bg-emerald-500',
            status: 'Ver Leads'
        },
        {
            title: 'Gerar Bio',
            desc: 'Sua bio estratégica gerada por IA.',
            icon: Sparkles,
            color: 'bg-amber-500',
            status: 'Gerar'
        }
    ];

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'} selection:bg-purple-500/30 font-sans`}>
            {/* Sidebar - Desktop */}
            <aside className={`fixed left-0 top-0 h-full w-64 ${isDark ? 'bg-white/[0.02] border-r border-white/5' : 'bg-white border-r border-gray-200'} hidden lg:flex flex-col p-6`}>
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Sparkles className="text-white w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">PlataForma</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Início" active href="/dashboard" />
                    {isModerator && (
                        <NavItem
                            icon={<Users size={20} />}
                            label="Gestão de Usuários"
                            onClick={() => router.push('/dashboard/admin/users')}
                        />
                    )}
                    <NavItem icon={<MessageSquare size={20} />} label="Scripts AI" href="/dashboard/scripts" />
                    <NavItem icon={<PlayCircle size={20} />} label="Vídeos" />
                    <NavItem icon={<BarChart3 size={20} />} label="Estatísticas" />
                    <NavItem icon={<Settings size={20} />} label="Configurações" />
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all text-sm mt-auto w-full"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </button>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 p-4 lg:p-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Olá, {profile?.full_name || profile?.email?.split('@')[0] || 'Aluno(a)'} 👋</h2>
                        <p className="text-gray-400">Pronto para a sua próxima grande venda?</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            {profile?.role && (
                                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isAdmin
                                    ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                    : isModerator
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                        : 'bg-[#B42AF0]/10 border-[#B42AF0]/20 text-[#B42AF0]'
                                    }`}>
                                    <ShieldCheck size={12} />
                                    {profile.role === 'admin' ? 'Administrador' : profile.role === 'moderator' ? 'Moderador' : 'Aluno'}
                                </div>
                            )}
                            {isAdmin && (
                                <Link
                                    href="/dashboard/admin"
                                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                >
                                    <Settings size={12} />
                                    Painel Admin
                                </Link>
                            )}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-xl border transition-colors ${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'}`}
                            >
                                {isDark ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button className={`p-2 rounded-xl border transition-colors relative ${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'}`}>
                                <Bell size={18} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-[#B42AF0] rounded-full border-2 border-transparent"></span>
                            </button>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">Plano Premium</p>
                            <p className="text-xs text-purple-400">Ativo via Hotmart</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-400" />
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="mb-8">
                    <h1 className={`text-2xl md:text-3xl font-bold mb-2 transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Olá, {profile?.full_name?.split(' ')[0] || 'Aluno(a)'} 👋
                    </h1>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        Bem-vindo de volta! O que vamos criar hoje?
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: 'Score de Execução', value: '85', sub: '+12% este mês', icon: BarChart3 },
                        { label: 'Aulas Assistidas', value: '12/24', sub: 'Módulo 3 em progresso', icon: BookOpen },
                        { label: 'Créditos IA', value: '1,240', sub: 'Modelo Gemini Flash', icon: Sparkles },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 rounded-xl bg-white/5">
                                    <stat.icon className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold">{stat.value}</h3>
                                <span className="text-xs text-emerald-400">{stat.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tools Section */}
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Ferramentas da Formação
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">Beta</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tools.map((tool, i) => (
                        <Link
                            key={i}
                            href={tool.link || '#'}
                            className="group relative bg-white/5 border border-white/5 hover:border-white/20 rounded-3xl p-6 transition-all hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Subtle gradient hover effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-2xl ${tool.color} flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                                    <tool.icon className="text-white w-6 h-6" />
                                </div>
                                <h4 className="text-lg font-bold mb-2">{tool.title}</h4>
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                    {tool.desc}
                                </p>
                                <div className="w-full py-3 rounded-xl bg-white/5 group-hover:bg-white/10 text-white font-medium text-sm transition-all border border-white/5 flex items-center justify-center gap-2 group-hover:text-purple-400">
                                    {tool.status}
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
