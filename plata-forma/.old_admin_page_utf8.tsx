'use client';

import { useState, useEffect } from 'react';
import {
    Sparkles,
    BarChart3,
    Users,
    Target,
    ShieldCheck,
    ArrowLeft,
    Shield,
    Settings,
    TrendingUp,
    Activity,
    ChevronRight,
    LayoutDashboard,
    LogOut,
    Sun,
    Moon,
    Bell
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function AdminDashboard() {
    const router = useRouter();
    const { isDark, toggleTheme, profile, loading: themeLoading } = useTheme();
    const [loading, setLoading] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        growth: '+12%'
    });

    useEffect(() => {
        const checkAdmin = async () => {
            if (!themeLoading) {
                if (!profile || profile.role !== 'admin') {
                    router.push('/dashboard');
                } else {
                    const { count } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true });

                    setStats(prev => ({ ...prev, totalUsers: count || 0 }));
                    setLoading(false);
                }
            }
        };
        checkAdmin();
    }, [profile, themeLoading, router]);

    if (loading || themeLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0A0113]' : 'bg-gray-50'}`}>
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'} selection:bg-red-500/30 font-sans`}>
            {/* Sidebar - Desktop */}
            <aside className={`fixed left-0 top-0 h-full w-64 ${isDark ? 'bg-white/[0.02] border-r border-white/5' : 'bg-white border-r border-gray-200'} hidden lg:flex flex-col p-6`}>
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Painel Admin</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-white/5 text-white active cursor-pointer">
                        <LayoutDashboard size={20} />
                        <span>Resumo Geral</span>
                    </Link>
                    <Link href="/dashboard/admin/users" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                        <Users size={20} />
                        <span>Gest├úo de Usu├írios</span>
                    </Link>
                    <Link href="/dashboard/admin/stats" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                        <BarChart3 size={20} />
                        <span>M├®tricas de Vendas</span>
                    </Link>
                    <Link href="/dashboard/admin/settings" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                        <Settings size={20} />
                        <span>Configura├º├Áes</span>
                    </Link>
                </nav>

                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-400 hover:bg-blue-400/10 transition-all text-sm mt-auto mb-2">
                    <ArrowLeft size={16} />
                    Vis├úo do Aluno
                </Link>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 p-4 lg:p-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest mb-2">
                            <Shield size={14} />
                            Administrador da Plataforma
                        </div>
                        <h2 className="text-3xl font-bold">Ol├í, {profile?.full_name?.split(' ')[0]} ­ƒæï</h2>
                        <p className="text-gray-400">Aqui est├í o pulso atual da sua plataforma.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <button className={`p-2 rounded-xl border transition-colors relative cursor-pointer ${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'}`}>
                                <Bell size={18} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-transparent"></span>
                            </button>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <Users className="w-6 h-6 text-gray-400" />
                            </button>

                            {userMenuOpen && (
                                <div className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 ${isDark ? 'bg-[#120222] border-white/10' : 'bg-white border-gray-100'}`}>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => router.push('/dashboard/profile')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer ${isDark ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                                        >
                                            <ShieldCheck size={18} className="text-red-400" />
                                            Meu Perfil
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await supabase.auth.signOut();
                                                router.push('/login');
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer ${isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                                        >
                                            <LogOut size={18} />
                                            Sair (Logout)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Platform Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total de Alunos', value: stats.totalUsers.toString(), icon: Users, color: 'text-blue-400', trend: '+5% este m├¬s' },
                        { label: 'Lucro Estimado', value: 'R$ 12.450', icon: TrendingUp, color: 'text-emerald-400', trend: '+15.2%' },
                        { label: 'Engajamento', value: '78%', icon: Activity, color: 'text-purple-400', trend: 'Est├ível' },
                        { label: 'Convers├úo', value: '3.2%', icon: Target, color: 'text-amber-400', trend: '+0.4%' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{stat.trend}</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Section Title */}
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Gest├úo R├ípida
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/dashboard/admin/users" className="group relative bg-white/5 border border-white/5 hover:border-red-500/20 rounded-3xl p-8 transition-all hover:-translate-y-1 overflow-hidden cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                                <Users className="text-white w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Gest├úo de Usu├írios</h4>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-sm">
                                Controle total sobre acessos, cargos e novos cadastros. Gerencie permiss├Áes de Aluno, Moderador e Admin.
                            </p>
                            <div className="flex items-center text-xs font-bold uppercase tracking-widest text-red-500 gap-2">
                                Acessar Painel <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/admin/settings" className="group relative bg-white/5 border border-white/5 hover:border-blue-500/20 rounded-3xl p-8 transition-all hover:-translate-y-1 overflow-hidden cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                                <Settings className="text-white w-7 h-7" />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Configura├º├Áes Globais</h4>
                            <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-sm">
                                Ajuste par├ómetros do sistema, integra├º├Áes com Hotmart e chaves da IA do Google.
                            </p>
                            <div className="flex items-center text-xs font-bold uppercase tracking-widest text-blue-500 gap-2">
                                Configurar <ChevronRight size={16} />
                            </div>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}

