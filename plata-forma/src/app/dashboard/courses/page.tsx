'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import { Play, Clock, CheckCircle2, Lock, BookOpen, Award, TrendingUp } from 'lucide-react';

export default function CoursesPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .or(`recipient_id.eq.${profile?.id},recipient_id.is.null`)
            .eq('is_read', false);

        if (count !== null) setUnreadCount(count);
    }

    if (loading || themeLoading) return null;

    const safeDark = mounted && isDark;

    // Mock data - substituir por dados reais do Supabase
    const modules = [
        {
            id: 1,
            title: 'Módulo 1: Fundamentos',
            description: 'Aprenda os conceitos básicos e fundamentos essenciais',
            progress: 75,
            totalLessons: 12,
            completedLessons: 9,
            duration: '2h 30min',
            isLocked: false,
            lessons: [
                { id: 1, title: 'Introdução ao Curso', duration: '15min', completed: true },
                { id: 2, title: 'Configuração do Ambiente', duration: '20min', completed: true },
                { id: 3, title: 'Primeiros Passos', duration: '25min', completed: true },
            ]
        },
        {
            id: 2,
            title: 'Módulo 2: Intermediário',
            description: 'Desenvolva habilidades intermediárias e práticas',
            progress: 40,
            totalLessons: 15,
            completedLessons: 6,
            duration: '3h 15min',
            isLocked: false,
            lessons: []
        },
        {
            id: 3,
            title: 'Módulo 3: Avançado',
            description: 'Domine técnicas avançadas e especializadas',
            progress: 0,
            totalLessons: 10,
            completedLessons: 0,
            duration: '2h 45min',
            isLocked: true,
            lessons: []
        },
    ];

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                <Header profile={profile} unreadCount={unreadCount} />

                {/* Page Header */}
                <div className="space-y-2">
                    <h1 className={`text-3xl lg:text-4xl font-black tracking-tight ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        Meus Cursos
                    </h1>
                    <p className="text-gray-500">Continue sua jornada de aprendizado</p>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`${safeDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border p-6 space-y-3`}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#8E82E3] flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total de Aulas</p>
                            <p className={`text-2xl font-bold ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>37</p>
                        </div>
                    </div>

                    <div className={`${safeDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border p-6 space-y-3`}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Concluídas</p>
                            <p className={`text-2xl font-bold ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>15</p>
                        </div>
                    </div>

                    <div className={`${safeDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border p-6 space-y-3`}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B42AF0] to-[#7D1AB8] flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Progresso Geral</p>
                            <p className={`text-2xl font-bold ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>38%</p>
                        </div>
                    </div>
                </div>

                {/* Modules List */}
                <div className="space-y-6">
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            className={`${safeDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} rounded-[2.5rem] border p-8 space-y-6`}
                        >
                            {/* Module Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h2 className={`text-2xl font-bold ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                            {module.title}
                                        </h2>
                                        {module.isLocked && (
                                            <div className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-1.5">
                                                <Lock size={14} className="text-gray-500" />
                                                <span className="text-xs font-bold text-gray-500">Bloqueado</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-500">{module.description}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen size={16} />
                                            <span>{module.totalLessons} aulas</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={16} />
                                            <span>{module.duration}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 size={16} />
                                            <span>{module.completedLessons}/{module.totalLessons} concluídas</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Circle */}
                                <div className="relative w-24 h-24">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke={safeDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="url(#gradient)"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 40}`}
                                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - module.progress / 100)}`}
                                            strokeLinecap="round"
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#6C5DD3" />
                                                <stop offset="100%" stopColor="#8E82E3" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-lg font-bold ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                            {module.progress}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className={`h-2 ${safeDark ? 'bg-white/10' : 'bg-gray-100'} rounded-full overflow-hidden`}>
                                    <div
                                        className="h-full bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] transition-all duration-500"
                                        style={{ width: `${module.progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Continue Button */}
                            <button
                                disabled={module.isLocked}
                                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${module.isLocked
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] text-white hover:shadow-xl hover:shadow-[#6C5DD3]/20 active:scale-[0.98]'
                                    }`}
                            >
                                {module.isLocked ? (
                                    <>
                                        <Lock size={18} />
                                        Bloqueado
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} />
                                        {module.progress > 0 ? 'Continuar Assistindo' : 'Começar Módulo'}
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Achievement Banner */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#B42AF0] to-[#7D1AB8] p-10 text-white">
                    <div className="max-w-md space-y-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <Award className="w-6 h-6" />
                            <p className="text-sm font-bold uppercase tracking-widest opacity-80">Conquista</p>
                        </div>
                        <h2 className="text-3xl font-bold leading-tight">
                            Continue aprendendo e desbloqueie certificados!
                        </h2>
                        <p className="text-white/80">
                            Complete todos os módulos para receber seu certificado de conclusão.
                        </p>
                    </div>
                    <Award className="absolute right-10 top-10 w-32 h-32 opacity-10 rotate-12" />
                </div>
            </main>
        </div>
    );
}
