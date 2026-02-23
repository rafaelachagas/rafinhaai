'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Activity,
    Zap,
    ThumbsUp
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function AdminDashboard() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        salesToday: '1.250',
        totalLikes: 0
    });
    const [moduleLikesData, setModuleLikesData] = useState<any[]>([]);
    const [lessonLikesData, setLessonLikesData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!themeLoading) {
                if (!profile || profile.role !== 'admin') {
                    router.push('/dashboard');
                } else {
                    try {
                        const { count: userCount } = await supabase
                            .from('profiles')
                            .select('*', { count: 'exact', head: true });

                        // Fetch Module Likes
                        const { data: mData } = await supabase
                            .from('modules')
                            .select(`
                                title,
                                module_likes (count)
                            `);

                        const formattedMData = mData?.map((m: any) => ({
                            name: m.title,
                            likes: m.module_likes[0]?.count || 0
                        })).sort((a, b) => b.likes - a.likes).slice(0, 10) || [];

                        // Fetch Lesson Likes
                        const { data: lData } = await supabase
                            .from('lessons')
                            .select(`
                                title,
                                lesson_likes (count)
                            `);

                        const formattedLData = lData?.map((l: any) => ({
                            name: l.title,
                            likes: l.lesson_likes[0]?.count || 0
                        })).sort((a, b) => b.likes - a.likes).slice(0, 10) || [];

                        setStats({
                            totalUsers: userCount || 0,
                            salesToday: '1.250',
                            totalLikes: formattedMData.reduce((acc, curr) => acc + curr.likes, 0) + formattedLData.reduce((acc, curr) => acc + curr.likes, 0)
                        });
                        setModuleLikesData(formattedMData);
                        setLessonLikesData(formattedLData);

                        // Fetch Recent Activity (CRM)
                        const { data: recentM } = await supabase
                            .from('module_likes')
                            .select('created_at, profiles(full_name, email), modules(title)')
                            .order('created_at', { ascending: false })
                            .limit(5);

                        const { data: recentL } = await supabase
                            .from('lesson_likes')
                            .select('created_at, profiles(full_name, email), lessons(title)')
                            .order('created_at', { ascending: false })
                            .limit(5);

                        const combined = [
                            ...(recentM || []).map((m: any) => ({
                                type: 'module',
                                user: m.profiles.full_name || m.profiles.email,
                                content: m.modules.title,
                                date: m.created_at
                            })),
                            ...(recentL || []).map((l: any) => ({
                                type: 'lesson',
                                user: l.profiles.full_name || l.profiles.email,
                                content: l.lessons.title,
                                date: l.created_at
                            }))
                        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

                        setRecentActivity(combined);
                    } catch (error) {
                        console.error('Error fetching admin data:', error);
                    } finally {
                        setLoading(false);
                    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <AdminStatCard label="TOTAL DE ALUNOS" value={stats.totalUsers.toString()} trend="+5%" icon={<Users size={20} />} color="text-blue-500" bg={isDark ? "bg-blue-500/10" : "bg-blue-50"} isDark={isDark} />
                <AdminStatCard label="TOTAL DE CURTIDAS" value={stats.totalLikes.toString()} trend="+12%" icon={<ThumbsUp size={20} />} color="text-orange-500" bg={isDark ? "bg-orange-500/10" : "bg-orange-50"} isDark={isDark} />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Module Likes Chart */}
                <div className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-sm`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Activity className="text-blue-500" size={20} />
                        Módulos Mais Curtidos
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={moduleLikesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                                <XAxis dataKey="name" hide />
                                <YAxis stroke={isDark ? "#666" : "#999"} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1B1D21' : '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="likes" radius={[4, 4, 0, 0]}>
                                    {moduleLikesData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(${200 + index * 20}, 70%, 50%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lesson Likes Chart */}
                <div className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-sm`}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="text-orange-500" size={20} />
                        Aulas Mais Curtidas
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lessonLikesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                                <XAxis dataKey="name" hide />
                                <YAxis stroke={isDark ? "#666" : "#999"} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1B1D21' : '#fff',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="likes" radius={[4, 4, 0, 0]}>
                                    {lessonLikesData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(${30 + index * 15}, 80%, 50%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table (CRM) */}
            <div className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} p-8 rounded-[2.5rem] border shadow-sm mb-12`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Users className="text-purple-500" size={20} />
                    Atividade Recente (Mini CRM)
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <tr className="border-b border-gray-100/10">
                                <th className="pb-4 px-2">Usuário</th>
                                <th className="pb-4 px-2">Tipo</th>
                                <th className="pb-4 px-2">Conteúdo</th>
                                <th className="pb-4 px-2 text-right">Data</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                            {recentActivity.map((activity, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-2 font-medium">{activity.user}</td>
                                    <td className="py-4 px-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${activity.type === 'module' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                                            }`}>
                                            {activity.type === 'module' ? 'Módulo' : 'Aula'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-2 text-sm opacity-80">{activity.content}</td>
                                    <td className="py-4 px-2 text-right text-xs opacity-60">
                                        {new Date(activity.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
