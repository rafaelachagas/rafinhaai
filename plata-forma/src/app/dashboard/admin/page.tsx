'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Activity,
    Zap
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';

export default function AdminDashboard() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        salesToday: '1.250'
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

    if (loading || themeLoading) return null;

    return (
        <div className={`flex-1 flex flex-col p-4 lg:p-8 max-w-[1600px] mx-auto w-full min-h-screen ${isDark ? 'bg-[#0F0F0F] text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
            <Header
                profile={profile}
                unreadCount={0}
                searchPlaceholder="Pesquisar em todo o sistema..."
            />

            {/* Central Control Card - ORANGE */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#FF754C] to-[#FF5C00] p-10 lg:p-14 text-white mb-10 shadow-2xl shadow-[#FF754C]/20">
                <div className="max-w-2xl space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest">
                        <Zap size={12} />
                        Central de Controle
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                        Olá, {profile?.full_name?.split(' ')[0] || 'Admin'} 👋
                    </h1>
                    <p className="text-lg opacity-90 leading-relaxed font-medium">
                        Sua plataforma está em pleno crescimento. Confira os últimos dados e interaja com seus alunos.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <button className="px-8 py-4 bg-white text-[#FF754C] rounded-2xl font-bold text-sm shadow-xl hover:scale-105 transition-all">
                            Novo Comunicado
                        </button>
                        <button className="px-8 py-4 bg-white/10 text-white backdrop-blur-md border border-white/20 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all">
                            Logs do Sistema
                        </button>
                    </div>
                </div>
                {/* Abstract Icons for background */}
                <Activity className="absolute right-[-20px] top-[-20px] w-64 h-64 opacity-10 rotate-12" />
                <Users className="absolute right-40 bottom-[-40px] w-48 h-48 opacity-5 -rotate-12" />
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-8 mb-12">
                <AdminStatCard label="TOTAL DE ALUNOS" value={stats.totalUsers.toString()} trend="+5%" icon={<Users size={20} />} color="text-blue-500" bg={isDark ? "bg-blue-500/10" : "bg-blue-50"} isDark={isDark} />
            </div>

        </div>
    );
}

function AdminStatCard({ label, value, trend, icon, color, bg, isDark }: { label: string, value: string, trend: string, icon: any, color: string, bg: string, isDark: boolean }) {
    return (
        <div className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border flex items-start gap-6 shadow-sm hover:shadow-xl transition-all group`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${color} ${bg} font-bold transform group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                    <span className={`text-[10px] font-bold ${isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600'} px-2 py-1 rounded-full`}>{trend}</span>
                </div>
                <h4 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{value}</h4>
            </div>
        </div>
    );
}
