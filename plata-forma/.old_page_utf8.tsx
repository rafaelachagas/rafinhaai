'use client';

import { useState, useEffect } from 'react';
import {
    Sparkles, BookOpen, PenTool, BarChart3, MessageSquare, LogOut,
    ChevronRight, PlayCircle, Settings, Users, LayoutDashboard,
    Bell, Search, Mail, Filter, MoreVertical, Play, Clock, ArrowRight
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function Dashboard() {
    const router = useRouter();
    const { isDark, profile, loading: themeLoading } = useTheme();
    const [loading, setLoading] = useState(true);

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-[#6C5DD3] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isAdmin = profile?.role === 'admin';

    return (
        <div className="min-h-screen bg-[#F7F8FA] text-[#1B1D21] font-sans flex">

            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-100 hidden lg:flex flex-col p-6 h-screen sticky top-0">
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="w-10 h-10 rounded-xl bg-[#6C5DD3] flex items-center justify-center shadow-lg shadow-[#6C5DD3]/20">
                        <Sparkles className="text-white w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-[#1B1D21]">Rafinha.AI</span>
                </div>

                <div className="space-y-8 flex-1">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Overview</p>
                        <nav className="space-y-1">
                            <NavItem icon={<LayoutDashboard size={20} />} label="In├¡cio" active />
                            <NavItem icon={<Mail size={20} />} label="Mensagens" />
                            <NavItem icon={<BookOpen size={20} />} label="Aulas" />
                            <NavItem icon={<PenTool size={20} />} label="Tarefas" />
                            <NavItem icon={<Users size={20} />} label="Comunidade" />
                        </nav>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Configura├º├Áes</p>
                        <nav className="space-y-1">
                            <NavItem icon={<Settings size={20} />} label="Ajustes" />
                            <Link href="#" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all text-sm font-medium">
                                <LogOut size={20} />
                                <span>Sair</span>
                            </Link>
                        </nav>
                    </div>
                </div>

                {/* Trial Box or Banner simplified */}
                <div className="mt-auto p-4 bg-[#F2F0FF] rounded-2xl border border-[#6C5DD3]/10">
                    <p className="text-xs font-bold text-[#6C5DD3] mb-1">Upgrade Pro</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-3">Ganhe acesso a todas as ferramentas de IA.</p>
                    <button className="w-full py-2 bg-[#6C5DD3] text-white text-[10px] font-bold rounded-lg hover:bg-[#5a4cb3] transition-colors">
                        Upgrade Now
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 max-w-[1200px] mx-auto">
                {/* Search Header */}
                <header className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Procurar aula ou ferramenta..."
                            className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]/20 transition-all font-medium"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-[#6C5DD3] transition-all">
                            <Mail size={20} />
                        </button>
                        <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-500 hover:text-[#6C5DD3] transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Welcome Banner */}
                <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] p-10 lg:p-14 text-white">
                    <div className="max-w-md space-y-4">
                        <p className="text-sm font-bold uppercase tracking-widest opacity-80">Online Course</p>
                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                            Afie suas habilidades com <br /> Rafinha.AI
                        </h1>
                        <button className="mt-4 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-all group">
                            Estudar Agora
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    {/* Abstract Sparkle Icons similar to the screenshot */}
                    <Sparkles className="absolute right-10 top-10 w-32 h-32 opacity-10 rotate-12" />
                    <Sparkles className="absolute right-40 bottom-10 w-20 h-20 opacity-5 -rotate-12" />
                </section>

                {/* Course Quick Access */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ProgressCard label="V├¡deos Assistidos" value="2/8" category="IA Master" color="bg-[#6C5DD3]" />
                    <ProgressCard label="Cr├®ditos IA" value="340/500" category="Rafinha.AI" color="bg-[#FF754C]" />
                    <ProgressCard label="Exerc├¡cios" value="6/12" category="Treinamento" color="bg-[#3F8CFF]" />
                </section>

                {/* Continue Watching Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Continue Assistindo</h3>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-full border border-gray-200 hover:bg-white transition-all"><ArrowRight className="w-4 h-4 rotate-180" /></button>
                            <button className="p-2 rounded-full bg-[#6C5DD3] text-white transition-all"><ArrowRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <VideoCard
                            title="IA para Criadores de Conte├║do"
                            mentor="Leonardo Samsul"
                            image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                            tag="IA & DESIGN"
                        />
                        <VideoCard
                            title="Otimizando sua Bio Strategicamente"
                            mentor="Rafael Chagas"
                            image="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80"
                            tag="MARKETING"
                        />
                        <VideoCard
                            title="An├ílise de M├®tricas no Dashboard"
                            mentor="Ana Paula"
                            image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                            tag="ESTRAT├ëGIA"
                        />
                    </div>
                </section>

                {/* Progress Table / List */}
                <section className="bg-white rounded-[2.5rem] border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold">Resumo das Aulas</h3>
                        <button className="text-[#6C5DD3] text-sm font-bold hover:underline">Ver todas</button>
                    </div>
                    <div className="space-y-6">
                        <LessonRow mentor="Padhang Satrio" date="16/02/2026" type="IA Design" desc="Entendendo o fluxo de IA no CRM" />
                        <LessonRow mentor="Zakir Horizontal" date="15/02/2026" type="Marketing" desc="Copywriting para an├║ncios de alta convers├úo" />
                        <LessonRow mentor="Leonardo Samsul" date="14/02/2026" type="Vendas" desc="Fechamento psicol├│gico com leads frios" />
                    </div>
                </section>
            </main>

            {/* RIGHT SIDEBAR - STATS */}
            <aside className="w-80 bg-white border-l border-gray-100 hidden xl:flex flex-col p-8 h-screen sticky top-0 overflow-y-auto">
                {/* User Profile */}
                <div className="flex items-center gap-4 mb-10 self-end">
                    <div className="text-right">
                        <p className="font-bold text-sm text-[#1B1D21]">{profile?.full_name || 'Usu├írio'}</p>
                        <p className="text-[10px] font-medium text-gray-400 font-bold uppercase tracking-wider">{isAdmin ? 'Admin' : 'Aluno Premium'}</p>
                    </div>
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#6C5DD3] p-0.5">
                            <img src="https://ui-avatars.com/api/?name=User&background=6C5DD3&color=fff" className="w-full h-full rounded-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF754C] rounded-full flex items-center justify-center border-2 border-white text-[10px] font-bold text-white">
                            ­ƒöÑ
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg">Statistic</h3>
                            <button><MoreVertical size={16} className="text-gray-400" /></button>
                        </div>

                        <div className="flex flex-col items-center py-6 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - 0.32)} className="text-[#6C5DD3] rounded-full" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold">32%</span>
                                </div>
                            </div>
                            <p className="font-bold text-sm">Bom dia, {profile?.full_name?.split(' ')[0] || 'Aluno'}! ­ƒöÑ</p>
                            <p className="text-[10px] text-gray-400 mt-1">Continue estudando para atingir sua meta.</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg">Seus Mentores</h3>
                            <button className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">+</button>
                        </div>
                        <div className="space-y-5">
                            <MentorItem name="Rafael Chagas" role="IA & Strategy" />
                            <MentorItem name="Zakir Horizontal" role="Copywriting" />
                            <MentorItem name="Leonardo Samsul" role="Video Design" />
                        </div>
                        <button className="w-full mt-6 py-3 border border-gray-100 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all">
                            Ver Todos os Mentores
                        </button>
                    </div>
                </div>
            </aside>

        </div>
    );
}

// COMPONENTES AUXILIARES LOCAIS

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${active ? 'bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20' : 'text-gray-400 hover:text-[#1B1D21] hover:bg-gray-50'}`}>
            {icon}
            <span className="flex-1 text-left">{label}</span>
        </button>
    );
}

function ProgressCard({ label, value, category, color }: { label: string, value: string, category: string, color: string }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${color}`}>
                <PlayCircle size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <h4 className="text-xl font-bold my-1">{value}</h4>
                <p className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest">{category}</p>
            </div>
        </div>
    );
}

function VideoCard({ title, mentor, image, tag }: { title: string, mentor: string, image: string, tag: string }) {
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
                <h4 className="font-bold leading-snug group-hover:text-[#6C5DD3] transition-colors">{title}</h4>
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
        <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-2xl transition-all">
            <div className="flex items-center gap-3">
                <img src={`https://ui-avatars.com/api/?name=${name}&background=random`} className="w-10 h-10 rounded-full" />
                <div>
                    <p className="font-bold text-sm">{name}</p>
                    <p className="text-[10px] text-gray-400">{role}</p>
                </div>
            </div>
            <button className="text-[10px] font-bold text-[#6C5DD3] hover:underline">Follow</button>
        </div>
    );
}
