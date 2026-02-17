'use client';

import { useState, useEffect } from 'react';
import { Sparkles, BookOpen, PenTool, BarChart3, MessageSquare, LogOut, ChevronRight, PlayCircle, Settings, Users, LayoutDashboard, Bell, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    href?: string;
}

const NavItem = ({ icon, label, active, onClick, href }: NavItemProps) => {
    const baseClasses = "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm group transition-all duration-300 cursor-pointer relative overflow-hidden";
    const activeClasses = "text-white bg-white/10 shadow-[0_0_20px_rgba(180,42,240,0.15)] border border-white/10";
    const inactiveClasses = "text-gray-400 hover:text-white";

    const content = (
        <>
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#B42AF0]/0 via-[#B42AF0]/5 to-[#B42AF0]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-[#B42AF0]' : ''}`}>
                {icon}
            </div>
            <span className="flex-1 text-left font-medium tracking-wide relative z-10">{label}</span>
            <ChevronRight className={`w-4 h-4 transition-all duration-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ${active ? 'opacity-100 translate-x-0 text-[#B42AF0]' : ''}`} />

            {/* Active Indicator Dot */}
            {active && (
                <div className="absolute left-0 w-1 h-6 bg-[#B42AF0] rounded-r-full shadow-[0_0_10px_#B42AF0]" />
            )}
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
    const { isDark, profile, loading: themeLoading } = useTheme();
    const [loading, setLoading] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        if (!themeLoading) {
            if (!profile) {
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

    const tools = [
        {
            title: 'Formação',
            desc: 'Área de aulas e conteúdos da formação.',
            icon: BookOpen,
            color: 'bg-blue-600',
            status: 'Acessar'
        },
        {
            title: 'Criar Roteiros',
            desc: 'IA para criar roteiros de alta conversão.',
            icon: PenTool,
            color: 'bg-purple-600',
            status: 'Usar IA',
            link: '/dashboard/scripts'
        },
        {
            title: 'Análise de Vídeos',
            desc: 'Envie a transcrição para análise de IA.',
            icon: PlayCircle,
            color: 'bg-pink-600',
            status: 'Analisar'
        },
        {
            title: 'Negociações',
            desc: 'Gerencie seus contatos e fechamentos.',
            icon: MessageSquare,
            color: 'bg-emerald-600',
            status: 'Ver Leads'
        },
        {
            title: 'Gerar Bio',
            desc: 'Sua bio estratégica gerada por IA.',
            icon: Sparkles,
            color: 'bg-amber-600',
            status: 'Gerar'
        }
    ];

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'} selection:bg-[#B42AF0]/30 font-sans`}>
            {/* Sidebar - Desktop */}
            <aside className={`fixed left-0 top-0 h-full w-72 ${isDark ? 'bg-[#0A0113]/80 backdrop-blur-xl border-r border-white/5' : 'bg-white/80 backdrop-blur-xl border-r border-gray-100'} hidden lg:flex flex-col p-8 z-40 transition-all duration-500`}>
                <div className="flex items-center gap-4 mb-12 px-2">
                    <div className="relative group">
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-[#B42AF0] to-[#7D1AB8] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-11 h-11 rounded-2xl bg-[#120222] flex items-center justify-center border border-white/10 overflow-hidden">
                            <Sparkles className="text-[#B42AF0] w-6 h-6 animate-pulse" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Rafinha<span className="text-[#B42AF0]">.AI</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B42AF0]/60 -mt-1">Premium Member</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Início" active href="/dashboard" />
                    <NavItem icon={<MessageSquare size={20} />} label="Scripts AI" href="/dashboard/scripts" />
                    <NavItem icon={<PlayCircle size={20} />} label="Vídeos" />
                    <NavItem icon={<BarChart3 size={20} />} label="Estatísticas" />
                    <NavItem icon={<Settings size={20} />} label="Configurações" />
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all text-sm mt-auto w-full group"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Sair
                </button>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 p-4 lg:p-10 min-h-screen relative overflow-hidden">
                {/* Background Glows for life-like feel */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#B42AF0]/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#7D1AB8]/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8 relative z-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#B42AF0] font-bold text-xs uppercase tracking-[0.3em] mb-1">
                            <div className="w-8 h-[1px] bg-[#B42AF0]/30" />
                            Painel de Controle
                        </div>
                        <h2 className="text-4xl font-black tracking-tight flex items-baseline gap-3">
                            Olá, {profile?.full_name?.split(' ')[0] || 'Aluno'}
                            <span className="text-2xl animate-bounce">👋</span>
                        </h2>
                        <p className="text-gray-400 font-medium">Você tem <span className="text-white">5 novos conteúdos</span> para explorar hoje.</p>
                    </div>

                    <div className="flex items-center gap-6 bg-[#120222]/40 backdrop-blur-md border border-white/5 p-2 rounded-3xl self-start lg:self-center">
                        <div className="flex items-center gap-3 pl-4 pr-2">
                            <div className="text-right">
                                <p className="text-xs font-bold text-white uppercase tracking-wider">{profile?.full_name || 'Usuário'}</p>
                                <p className="text-[10px] text-[#B42AF0] font-black uppercase tracking-[0.1em]">
                                    {isAdmin ? '🛡️ Admin Master' : '⭐ Aluno Premium'}
                                </p>
                            </div>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#B42AF0] to-[#7D1AB8] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#B42AF0]/20 relative overflow-hidden group cursor-pointer"
                            >
                                <Users className="w-5 h-5 text-white relative z-10" />
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>

                        <div className="h-8 w-[1px] bg-white/10" />

                        <div className="flex items-center gap-2 pr-2">
                            <button className={`p-3 rounded-2xl transition-all relative overflow-hidden group cursor-pointer ${isDark ? 'bg-white/5 text-gray-400 hover:text-white' : 'bg-gray-100'}`}>
                                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                                <span className="absolute top-3 right-3 w-2 h-2 bg-[#B42AF0] rounded-full shadow-[0_0_8px_#B42AF0] border-2 border-[#120222]"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                    <div className={`absolute right-10 top-24 w-64 rounded-3xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-4 duration-300 ${isDark ? 'bg-[#120222]/90 backdrop-blur-xl border-white/10' : 'bg-white border-gray-100'}`}>
                        <div className="p-3 space-y-1">
                            {isAdmin && (
                                <button
                                    onClick={() => router.push('/dashboard/admin')}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all cursor-pointer group ${isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Settings size={18} className="text-red-400" />
                                    </div>
                                    Painel Admin
                                </button>
                            )}
                            <button
                                onClick={() => router.push('/dashboard/profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all cursor-pointer group ${isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50'}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-[#B42AF0]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={18} className="text-[#B42AF0]" />
                                </div>
                                Meu Perfil
                            </button>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button
                                onClick={handleLogout}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all cursor-pointer group ${isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50'}`}
                            >
                                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                                Sair (Logout)
                            </button>
                        </div>
                    </div>
                )}

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
                    {[
                        { label: 'Score de Execução', value: '85', sub: '+12%', icon: BarChart3, color: 'text-emerald-400' },
                        { label: 'Aulas Assistidas', value: '12/24', sub: '50%', icon: BookOpen, color: 'text-blue-400' },
                        { label: 'Créditos IA', value: '1,240', sub: 'Gemini', icon: Sparkles, color: 'text-[#B42AF0]' },
                    ].map((stat, i) => (
                        <div key={i} className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-white/10 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-500" />
                            <div className="relative bg-[#120222]/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 transition-all duration-500 group-hover:-translate-y-2 group-hover:bg-[#120222]/60 overflow-hidden">
                                <stat.icon className="absolute -right-4 -bottom-4 w-32 h-32 text-white/[0.02] -rotate-12 group-hover:rotate-0 transition-transform duration-700" />

                                <div className="flex justify-between items-center mb-6">
                                    <div className="p-3 rounded-2xl bg-[#B42AF0]/10 border border-[#B42AF0]/20">
                                        <stat.icon className="w-6 h-6 text-[#B42AF0]" />
                                    </div>
                                    <div className={`text-xs font-black px-2 py-1 rounded-lg bg-white/5 border border-white/10 ${stat.color}`}>
                                        {stat.sub}
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tools Section */}
                <div className="space-y-8 relative z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            Ferramentas Exclusivas
                            <span className="text-[10px] bg-[#B42AF0]/10 text-[#B42AF0] px-3 py-1 rounded-full border border-[#B42AF0]/20 font-black uppercase tracking-widest">Acesso Vitalício</span>
                        </h3>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#B42AF0] animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-white/10" />
                            <div className="w-2 h-2 rounded-full bg-white/10" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tools.map((tool, i) => (
                            <Link
                                key={i}
                                href={tool.link || '#'}
                                className="group relative bg-[#120222]/20 border border-white/5 hover:border-[#B42AF0]/30 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 overflow-hidden cursor-pointer backdrop-blur-sm"
                            >
                                {/* Glow Effect on Card */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#B42AF0]/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl ${tool.color} flex items-center justify-center mb-8 shadow-2xl shadow-black/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                        <tool.icon className="text-white w-7 h-7" />
                                    </div>

                                    <h4 className="text-2xl font-black mb-3 tracking-tight group-hover:text-[#B42AF0] transition-colors">{tool.title}</h4>
                                    <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                                        {tool.desc}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-[#B42AF0]">Ativar Ferramenta</span>
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#B42AF0] group-hover:text-white transition-all duration-300 border border-white/5 group-hover:border-transparent">
                                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
