'use client';

import { useState, useEffect } from 'react';
import {
    Sparkles, ChevronRight, ChevronLeft, PlayCircle, ArrowRight, Play, Clock
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';

export default function Dashboard() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-play slides every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev === 0 ? 1 : 0));
        }, 5000);

        return () => clearInterval(interval);
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

    // Prevent hydration mismatch by only using isDark after mount
    const safeDark = mounted && isDark;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0">
                {/* Custom Header with Profile */}
                <Header
                    profile={profile}
                    unreadCount={unreadCount}
                    onNotificationToggle={() => setNotificationsOpen(!notificationsOpen)}
                    showProfile={true}
                    notificationsOpen={notificationsOpen}
                    recentMessages={recentMessages}
                />

                {/* Slide Banner */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                    {/* Slide Container */}
                    <div className="relative overflow-hidden rounded-[2.5rem]">
                        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                            {/* Slide 1 - IA Tools */}
                            <section className="min-w-full relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] p-10 lg:p-14 text-white">
                                <div className="max-w-md space-y-4 relative z-10">
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-80">INTELIGÊNCIA ARTIFICIAL</p>
                                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                                        Afie suas habilidades com <br /> Rafinha.AI
                                    </h1>
                                    <button
                                        onClick={() => router.push('/dashboard/tools')}
                                        className="mt-4 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-all group"
                                    >
                                        Acessar Ferramentas
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                                <Sparkles className="absolute right-10 top-10 w-32 h-32 opacity-10 rotate-12" />
                            </section>

                            {/* Slide 2 - Formation */}
                            <section className="min-w-full relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] p-10 lg:p-14 text-white">
                                <div className="max-w-md space-y-4 relative z-10">
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-80">FORMAÇÃO</p>
                                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                                        Assista a Formação agora mesmo
                                    </h1>
                                    <button
                                        onClick={() => router.push('/dashboard/courses')}
                                        className="mt-4 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-all group"
                                    >
                                        Assistir Formação
                                        <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                                <Play className="absolute right-10 top-10 w-32 h-32 opacity-10 rotate-12" />
                            </section>
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={() => setCurrentSlide(currentSlide === 0 ? 1 : 0)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all z-20"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentSlide(currentSlide === 0 ? 1 : 0)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full flex items-center justify-center transition-all z-20"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Slide Indicators */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                            <button
                                onClick={() => setCurrentSlide(0)}
                                className={`h-2 rounded-full transition-all ${currentSlide === 0 ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                            />
                            <button
                                onClick={() => setCurrentSlide(1)}
                                className={`h-2 rounded-full transition-all ${currentSlide === 1 ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                            />
                        </div>
                    </div>

                    {/* Stats Sidebar */}
                    <aside className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} rounded-[2.5rem] border p-8 flex flex-col items-center justify-center`}>
                        {/* Progress Circle */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-40 h-40 mb-6">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="80" cy="80" r="70" fill="none" stroke={isDark ? '#2A2D31' : '#F3F4F6'} strokeWidth="12" />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="#6C5DD3"
                                        strokeWidth="12"
                                        strokeDasharray="440"
                                        strokeDashoffset="300"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-4xl font-bold text-[#6C5DD3]">32%</span>
                                </div>
                            </div>
                            <h4 className={`text-lg font-bold text-center ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Bom dia, {profile?.full_name?.split(' ')[0] || 'Aluno'}! 🔥</h4>
                            <p className="text-sm text-gray-400 text-center mt-2">Continue estudando para atingir sua meta!</p>
                            <p className="text-xs text-gray-400 text-center mt-4 px-4">
                                Sua porcentagem será calculada com base nas aulas assistidas
                            </p>
                        </div>
                    </aside>
                </div>

                {/* Course Progress Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ProgressCard label="Vídeos Assistidos" value="2/8" category="IA Master" color="bg-[#6C5DD3]" isDark={isDark} />
                    <ProgressCard label="Créditos IA" value="340/500" category="Rafinha.AI" color="bg-[#FF754C]" isDark={isDark} />
                    <ProgressCard label="Exercícios" value="6/12" category="Treinamento" color="bg-[#3F8CFF]" isDark={isDark} />
                </section>

                {/* Continue Watching Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Continue Assistindo</h3>
                        <div className="flex gap-2">
                            <button className={`p-2 rounded-full border ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-white'} transition-all`}><ArrowRight className="w-4 h-4 rotate-180" /></button>
                            <button className="p-2 rounded-full bg-[#6C5DD3] text-white transition-all"><ArrowRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <VideoCard title="IA para Criadores de Conteúdo" mentor="Leonardo Samsul" image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80" tag="IA & DESIGN" isDark={isDark} />
                        <VideoCard title="Otimizando sua Bio Strategicamente" mentor="Rafael Chagas" image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80" tag="MARKETING" isDark={isDark} />
                        <VideoCard title="Análise de Métricas no Dashboard" mentor="Ana Paula" image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" tag="ESTRATÉGIA" isDark={isDark} />
                    </div>
                </section>
            </main>
        </div>
    );
}

function ProgressCard({ label, value, category, color, isDark }: { label: string, value: string, category: string, color: string, isDark?: boolean }) {
    return (
        <div className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} p-6 rounded-[2rem] border flex items-start gap-4`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${color}`}>
                <PlayCircle size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <h4 className={`text-xl font-bold my-1 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{value}</h4>
                <p className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest">{category}</p>
            </div>
        </div>
    );
}

function VideoCard({ title, mentor, image, tag, isDark }: { title: string, mentor: string, image: string, tag: string, isDark?: boolean }) {
    return (
        <div className="group cursor-pointer">
            <div className="relative aspect-video rounded-[2rem] overflow-hidden mb-4">
                <img src={image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 text-[#6C5DD3] ml-1" />
                    </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-bold">
                    <Clock size={12} className="text-[#6C5DD3]" />
                    12:45 min
                </div>
            </div>
            <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest">{tag}</span>
                <h4 className={`font-bold leading-snug group-hover:text-[#6C5DD3] transition-colors ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{title}</h4>
                <div className="flex items-center gap-2 pt-1">
                    <img src={`https://ui-avatars.com/api/?name=${mentor}&background=random`} className="w-6 h-6 rounded-full" />
                    <span className="text-xs font-medium text-gray-500">{mentor}</span>
                </div>
            </div>
        </div>
    );
}

function LessonRow({ mentor, date, type, desc }: { mentor: string, date: string, type: string, desc: string }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-dashed border-gray-100 rounded-2xl hover:border-[#6C5DD3]/30 transition-all group">
            <div className="flex items-center gap-4">
                <img src={`https://ui-avatars.com/api/?name=${mentor}&background=random`} className="w-10 h-10 rounded-full" />
                <div>
                    <p className="font-bold text-sm">{mentor}</p>
                    <p className="text-[10px] text-gray-400">{date}</p>
                </div>
            </div>
            <div className="mt-2 md:mt-0 px-3 py-1.5 bg-[#F2F0FF] rounded-xl text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest border border-[#6C5DD3]/10">
                {type}
            </div>
            <div className="mt-2 md:mt-0 flex-1 md:px-10 text-xs font-medium text-gray-500 truncate">
                {desc}
            </div>
            <button className="mt-4 md:mt-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-[#6C5DD3] group-hover:text-white transition-all">
                <ArrowRight size={16} />
            </button>
        </div>
    );
}

function MentorItem({ name, role }: { name: string, role: string }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2.5 rounded-2xl transition-all border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-3">
                <img src={`https://ui-avatars.com/api/?name=${name}&background=random`} className="w-10 h-10 rounded-full border border-gray-100" />
                <div>
                    <p className="font-bold text-sm text-[#1B1D21]">{name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{role}</p>
                </div>
            </div>
            <button className="text-[10px] font-bold text-[#6C5DD3] opacity-0 group-hover:opacity-100 transition-opacity hover:underline px-2 py-1 bg-[#6C5DD3]/10 rounded-lg">Follow</button>
        </div>
    );
}

import { MoreVertical, Plus } from 'lucide-react';
