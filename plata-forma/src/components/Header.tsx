'use client';

import { Search, Mail, Bell, Users, LayoutDashboard, Settings, Eye, Zap, Shield, BookOpen, PenTool, Sun, Moon, LogOut, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';

export function Header({
    profile,
    unreadCount,
    onNotificationToggle,
    searchPlaceholder = "Procurar aula ou ferramenta...",
    showProfile = true,
    notificationsOpen = false,
    recentMessages = []
}: {
    profile: any,
    unreadCount: number,
    onNotificationToggle?: () => void,
    searchPlaceholder?: string,
    showProfile?: boolean,
    notificationsOpen?: boolean,
    recentMessages?: any[]
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme, isDark } = useTheme();
    const isAdminRoute = pathname?.startsWith('/dashboard/admin');
    const mailHref = isAdminRoute ? '/dashboard/admin/messages' : '/dashboard/messages';

    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const adminMenuItems = [
        { label: 'Resumo Geral', href: '/dashboard/admin', icon: LayoutDashboard, keywords: 'home dashboard inicio estatisticas resumo' },
        { label: 'Gestão de Usuários', href: '/dashboard/admin/users', icon: Users, keywords: 'alunos membros cadastros acessos' },
        { label: 'Avisos e Comunicados', href: '/dashboard/admin/messages', icon: Mail, keywords: 'email mensagens avisos contato comunicados' },
        { label: 'Configurações', href: '#', icon: Settings, keywords: 'ajustes setup sistema conta' },
        { label: 'Visão do Aluno', href: '/dashboard', icon: Eye, keywords: 'trocar alternar aluno' }
    ];

    const studentMenuItems = [
        { label: 'Painel Inicial', href: '/dashboard', icon: LayoutDashboard, keywords: 'home inicio dashboard' },
        { label: 'Mensagens Recebidas', href: '/dashboard/messages', icon: Mail, keywords: 'avisos comunicados inbox' },
        { label: 'Minhas Aulas', href: '#', icon: BookOpen, keywords: 'cursos videos aulas' },
        { label: 'Tarefas Próximas', href: '#', icon: PenTool, keywords: 'atividades exercicios' },
        { label: 'Minha Comunidade', href: '#', icon: Users, keywords: 'alunos colegas grupo' }
    ];

    const menuItems = isAdminRoute ? adminMenuItems : studentMenuItems;
    const filteredResults = searchQuery.trim() === ''
        ? []
        : menuItems.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
        );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (href: string) => {
        router.push(href);
        setSearchQuery('');
        setShowResults(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <header className="flex items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-2xl" ref={searchRef}>
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'} transition-colors`} size={18} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowResults(true)}
                    className={`w-full ${isDark ? 'bg-[#1A1D1F] border-white/5 text-white placeholder-gray-500' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl py-3.5 pl-11 pr-4 outline-none transition-all focus:ring-2 focus:ring-[#FF754C]/20`}
                />

                {/* Search Results Dropdown */}
                {showResults && filteredResults.length > 0 && (
                    <div className={`absolute top-full left-0 right-0 mt-2 ${isDark ? 'bg-[#1A1D1F] border-white/10 shadow-black/40' : 'bg-white border-gray-100 shadow-2xl'} border rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                            Funcionalidades Encontradas
                        </p>
                        <div className="space-y-1">
                            {filteredResults.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(item.href)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors text-left`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdminRoute ? 'bg-[#FF754C]/10 text-[#FF754C]' : 'bg-[#6C5DD3]/10 text-[#6C5DD3]'}`}>
                                        <item.icon size={16} />
                                    </div>
                                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{item.label}</span>
                                    <span className="ml-auto text-[10px] text-gray-400 font-medium">Navegar</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className={`p-3 ${isDark ? 'bg-[#1A1D1F] border-white/5 text-gray-500 hover:text-yellow-400' : 'bg-white border-gray-100 text-gray-400 hover:text-[#6C5DD3]'} border rounded-2xl transition-all relative`}
                    title={isDark ? "Modo Claro" : "Modo Noturno"}
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <Link href={mailHref} className={`p-3 ${isDark ? 'bg-[#1A1D1F] border-white/5 text-gray-500 hover:text-[#FF754C]' : 'bg-white border-gray-100 text-gray-400 hover:text-[#6C5DD3]'} border rounded-2xl transition-all relative`}>
                    <Mail size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-3 right-3 w-4 h-4 bg-[#FF754C] text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
                {!isAdminRoute && (
                    <div className="relative">
                        <button
                            onClick={onNotificationToggle}
                            className={`p-3 ${isDark ? 'bg-[#1A1D1F] border-white/5 text-gray-500 hover:text-[#FF754C]' : 'bg-white border-gray-100 text-gray-400 hover:text-[#6C5DD3]'} border rounded-2xl transition-all relative`}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-[#FF754C] rounded-full border-2 border-white"></span>}
                        </button>

                        {/* Notifications Dropdown */}
                        {notificationsOpen && (
                            <div className={`absolute right-0 top-full mt-3 w-80 ${isDark ? 'bg-[#1B1D21] border-white/10' : 'bg-white border-gray-100'} rounded-3xl shadow-2xl border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                                <div className={`p-5 border-b ${isDark ? 'border-white/5' : 'border-gray-50'} flex items-center justify-between`}>
                                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Notificações</h3>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {recentMessages.length > 0 ? (
                                        recentMessages.map((msg) => (
                                            <div key={msg.id} className={`p-4 border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50'} last:border-0 transition-all cursor-pointer`}>
                                                <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{msg.subject}</p>
                                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{msg.content.replace(/<[^>]*>?/gm, '')}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-xs">Sem notificações.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Section */}
                {showProfile && (
                    <div ref={profileRef} className="relative">
                        <div
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className={`flex items-center gap-3 pl-4 border-l ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer transition-all rounded-r-2xl py-2 pr-2`}
                        >
                            <div className="text-right hidden sm:block">
                                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{profile?.full_name || 'Usuário'}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {profile?.role === 'admin' ? 'Administrador' : 'Aluno Premium'}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-full border-2 ${isDark ? 'border-white/10' : 'border-[#6C5DD3]/20'} p-0.5 overflow-hidden`}>
                                <img
                                    src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=6C5DD3&color=fff`}
                                    alt="Avatar"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Profile Dropdown Menu */}
                        {showProfileMenu && (
                            <div className={`absolute right-0 mt-3 w-56 ${isDark ? 'bg-[#1B1D21] border-white/10' : 'bg-white border-gray-100'} border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200`}>
                                {isAdminRoute && (
                                    <button
                                        onClick={() => {
                                            router.push('/dashboard');
                                            setShowProfileMenu(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'} transition-all`}
                                    >
                                        <ChevronLeft size={18} className="text-gray-400" />
                                        <span className="text-sm font-medium">Visão do Aluno</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        router.push('/dashboard/settings');
                                        setShowProfileMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 ${isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'} transition-all`}
                                >
                                    <Settings size={18} className="text-gray-400" />
                                    <span className="text-sm font-medium">Ajustes</span>
                                </button>
                                <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-gray-100'} my-1`}></div>
                                <button
                                    onClick={handleLogout}
                                    className={`w-full flex items-center gap-3 px-4 py-3 ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'} transition-all`}
                                >
                                    <LogOut size={18} />
                                    <span className="text-sm font-medium">Sair</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
