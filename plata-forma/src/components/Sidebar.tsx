'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Sparkles, LayoutDashboard, Mail, BookOpen, PenTool,
    Users, Shield, Settings, LogOut, BarChart3, ArrowLeft, CheckSquare, ChevronRight, ChevronLeft, PlayCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';

// Routes that trigger immersive mode (collapsed dark sidebar, no header)
const IMMERSIVE_ROUTES = ['/dashboard/courses', '/dashboard/watch'];

import { Menu, X as CloseIcon } from 'lucide-react';

function isImmersiveRoute(pathname: string) {
    return IMMERSIVE_ROUTES.some(route => pathname.startsWith(route));
}

// Sidebar state: 'expanded' | 'collapsed' | 'hidden'
type SidebarState = 'expanded' | 'collapsed' | 'hidden';

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isDark } = useTheme();
    const isAdminRoute = pathname.startsWith('/dashboard/admin');
    const immersive = isImmersiveRoute(pathname);

    const forcedDark = immersive ? true : isDark;
    const accentColor = isAdminRoute ? 'bg-[#FF754C]' : 'bg-[#6C5DD3]';
    const accentShadow = isAdminRoute ? 'shadow-[#FF754C]/20' : 'shadow-[#6C5DD3]/20';

    const [sidebarState, setSidebarState] = useState<SidebarState>('collapsed');
    const [peekVisible, setPeekVisible] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Start collapsed when entering immersive mode
    useEffect(() => {
        if (immersive) {
            setSidebarState('collapsed');
        }
    }, [immersive]);

    const isCollapsed = sidebarState === 'collapsed';
    const isHidden = sidebarState === 'hidden';
    const isExpanded = sidebarState === 'expanded';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Header - Only visible on small screens */}
            <div className={`lg:hidden fixed top-0 left-0 right-0 h-16 ${forcedDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100'} border-b flex items-center justify-between px-4 z-[60]`}>
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${accentColor} flex items-center justify-center shadow-lg ${accentShadow}`}>
                        {isAdminRoute ? <Shield className="text-white w-5 h-5" /> : <Sparkles className="text-white w-5 h-5" />}
                    </div>
                    <span className={`font-bold text-lg tracking-tight ${forcedDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        {isAdminRoute ? 'Admin' : 'Rafinha.AI'}
                    </span>
                </div>
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className={`p-2 rounded-xl ${forcedDark ? 'text-gray-400 hover:text-white bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    {isMobileOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar Content */}
            <aside className={`
                lg:hidden fixed top-0 left-0 bottom-0 w-64 ${forcedDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100'} 
                border-r z-[80] transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                p-4 flex flex-col
            `}>
                {/* Mobile Logo Section */}
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className={`w-10 h-10 rounded-xl ${accentColor} flex items-center justify-center shadow-lg ${accentShadow}`}>
                        {isAdminRoute ? <Shield className="text-white w-7 h-7" /> : <Sparkles className="text-white w-7 h-7" />}
                    </div>
                    <span className={`font-bold text-xl tracking-tight ${forcedDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        {isAdminRoute ? 'Painel Admin' : 'Rafinha.AI'}
                    </span>
                </div>

                <div className="space-y-8 flex-1 overflow-y-auto">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
                            {isAdminRoute ? 'Gestão' : 'Visão Geral'}
                        </p>
                        <nav className="space-y-1">
                            {isAdminRoute ? (
                                <>
                                    <NavItem icon={<LayoutDashboard size={24} />} label="Resumo Geral" href="/dashboard/admin" active={pathname === '/dashboard/admin'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                    <NavItem icon={<Users size={24} />} label="Usuários" href="/dashboard/admin/users" active={pathname === '/dashboard/admin/users'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                    <NavItem icon={<BookOpen size={24} />} label="Cursos" href="/dashboard/admin/courses" active={pathname === '/dashboard/admin/courses'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                    <NavItem icon={<Mail size={24} />} label="Avisos/Mensagens" href="/dashboard/admin/messages" active={pathname === '/dashboard/admin/messages'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                </>
                            ) : (
                                <>
                                    <NavItem icon={<LayoutDashboard size={24} />} label="Início" href="/dashboard" active={pathname === '/dashboard'} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                    <NavItem icon={<Mail size={24} />} label="Mensagens" href="/dashboard/messages" active={pathname === '/dashboard/messages'} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                    <NavItem icon={<PlayCircle size={24} />} label="Aulas" href="/dashboard/courses" active={pathname.startsWith('/dashboard/courses') || pathname.startsWith('/dashboard/watch')} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                    <NavItem icon={<PenTool size={24} />} label="Ferramentas" href="#" active={false} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                    <NavItem icon={<CheckSquare size={24} />} label="Tarefas" href="#" active={false} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                                </>
                            )}
                        </nav>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
                            {isAdminRoute ? 'Sistema' : 'Configurações'}
                        </p>
                        <nav className="space-y-1">
                            {isAdmin && !isAdminRoute && (
                                <NavItem icon={<Shield size={24} className="text-[#FF754C]" />} label="Painel Admin" href="/dashboard/admin" active={false} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                            )}
                            {isAdminRoute && (
                                <NavItem icon={<ArrowLeft size={24} />} label="Visão do Aluno" href="/dashboard" active={false} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                            )}
                            <NavItem icon={<Settings size={24} />} label="Ajustes" href="/dashboard/settings" active={pathname === '/dashboard/settings'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} onClick={() => setIsMobileOpen(false)} />
                            <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${forcedDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'}`}>
                                <LogOut size={24} />
                                <span>Sair</span>
                            </button>
                        </nav>
                    </div>
                </div>
            </aside>
            {/* Floating peek trigger — only when hidden */}
            {isHidden && (
                <div
                    className="fixed left-0 top-0 bottom-0 w-4 z-50"
                    onMouseEnter={() => setPeekVisible(true)}
                    onMouseLeave={() => setPeekVisible(false)}
                >
                    {/* Floating arrow button */}
                    <button
                        onClick={() => setSidebarState('collapsed')}
                        onMouseEnter={() => setPeekVisible(true)}
                        className={`
                            absolute left-0 top-1/2 -translate-y-1/2
                            w-8 h-12 bg-[#141414]/90 border border-white/10
                            rounded-r-xl flex items-center justify-center
                            text-gray-400 hover:text-white
                            transition-all duration-300 backdrop-blur-sm
                            ${peekVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                        `}
                        title="Mostrar menu"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Sidebar */}
            <aside className={`
                ${isHidden ? 'w-0 overflow-hidden p-0 border-0 min-w-0' : isCollapsed ? 'w-20' : 'w-64'}
                ${!isHidden && (forcedDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-100')}
                ${isHidden ? 'bg-transparent' : 'border-r'}
                hidden lg:flex flex-col ${isHidden ? '' : 'p-4'} h-screen sticky top-0 transition-all duration-300 relative
                ${immersive ? 'z-40' : ''}
            `}>
                {!isHidden && (
                    <>
                        {/* Toggle Button: expand ↔ collapse */}
                        <button
                            onClick={() => setSidebarState(isCollapsed ? 'expanded' : 'collapsed')}
                            className={`absolute -right-3 top-8 w-6 h-6 ${forcedDark ? 'bg-[#141414] border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-[#6C5DD3]'} border rounded-full flex items-center justify-center shadow-lg transition-all z-10`}
                            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
                        >
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>

                        {/* Hide button: collapse → hidden (only in collapsed state) */}
                        {isCollapsed && (
                            <button
                                onClick={() => setSidebarState('hidden')}
                                className={`absolute -right-3 top-20 w-6 h-6 ${forcedDark ? 'bg-[#141414] border-white/10 text-gray-400 hover:text-red-400' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400'} border rounded-full flex items-center justify-center shadow-lg transition-all z-10`}
                                title="Ocultar menu (tela cheia)"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        )}

                        {/* Logo */}
                        <div className={`flex items-center gap-3 mb-12 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
                            <div className={`w-10 h-10 rounded-xl ${accentColor} flex items-center justify-center shadow-lg ${accentShadow}`}>
                                {isAdminRoute ? <Shield className="text-white w-7 h-7" /> : <Sparkles className="text-white w-7 h-7" />}
                            </div>
                            {!isCollapsed && (
                                <span className={`font-bold text-xl tracking-tight ${forcedDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                    {isAdminRoute ? 'Painel Admin' : 'Rafinha.AI'}
                                </span>
                            )}
                        </div>

                        <div className="space-y-8 flex-1">
                            <div>
                                {!isCollapsed && (
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
                                        {isAdminRoute ? 'Gestão' : 'Visão Geral'}
                                    </p>
                                )}
                                <nav className="space-y-1">
                                    {isAdminRoute ? (
                                        <>
                                            <NavItem icon={<LayoutDashboard size={24} />} label="Resumo Geral" href="/dashboard/admin" active={pathname === '/dashboard/admin'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} isCollapsed={isCollapsed} />
                                            <NavItem icon={<Users size={24} />} label="Usuários" href="/dashboard/admin/users" active={pathname === '/dashboard/admin/users'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} isCollapsed={isCollapsed} />
                                            <NavItem icon={<BookOpen size={24} />} label="Cursos" href="/dashboard/admin/courses" active={pathname === '/dashboard/admin/courses'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} isCollapsed={isCollapsed} />
                                            <NavItem icon={<Mail size={24} />} label="Avisos/Mensagens" href="/dashboard/admin/messages" active={pathname === '/dashboard/admin/messages'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} isCollapsed={isCollapsed} />
                                        </>
                                    ) : (
                                        <>
                                            <NavItem icon={<LayoutDashboard size={24} />} label="Início" href="/dashboard" active={pathname === '/dashboard'} isDark={forcedDark} isCollapsed={isCollapsed} />
                                            <NavItem icon={<Mail size={24} />} label="Mensagens" href="/dashboard/messages" active={pathname === '/dashboard/messages'} isDark={forcedDark} isCollapsed={isCollapsed} />
                                            <NavItem icon={<PlayCircle size={24} />} label="Aulas" href="/dashboard/courses" active={pathname.startsWith('/dashboard/courses') || pathname.startsWith('/dashboard/watch')} isDark={forcedDark} isCollapsed={isCollapsed} />
                                            <NavItem icon={<PenTool size={24} />} label="Ferramentas" href="#" active={false} isDark={forcedDark} isCollapsed={isCollapsed} />
                                            <NavItem icon={<CheckSquare size={24} />} label="Tarefas" href="#" active={false} isDark={forcedDark} isCollapsed={isCollapsed} />
                                        </>
                                    )}
                                </nav>
                            </div>

                            <div>
                                {!isCollapsed && (
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
                                        {isAdminRoute ? 'Sistema' : 'Configurações'}
                                    </p>
                                )}
                                <nav className="space-y-1">
                                    {isAdmin && !isAdminRoute && (
                                        <NavItem
                                            icon={<Shield size={24} className="text-[#FF754C]" />}
                                            label="Painel Admin"
                                            href="/dashboard/admin"
                                            active={false}
                                            isDark={forcedDark}
                                            isCollapsed={isCollapsed}
                                        />
                                    )}
                                    {isAdminRoute && (
                                        <NavItem
                                            icon={<ArrowLeft size={24} />}
                                            label="Visão do Aluno"
                                            href="/dashboard"
                                            active={false}
                                            accentColor={accentColor}
                                            accentShadow={accentShadow}
                                            isDark={forcedDark}
                                            isCollapsed={isCollapsed}
                                        />
                                    )}
                                    <NavItem icon={<Settings size={24} />} label="Ajustes" href="/dashboard/settings" active={pathname === '/dashboard/settings'} accentColor={accentColor} accentShadow={accentShadow} isDark={forcedDark} isCollapsed={isCollapsed} />
                                    <button onClick={handleLogout} className={`w-full flex items-center ${isCollapsed ? 'justify-center px-3 py-4' : 'gap-3 px-4 py-3'} rounded-xl transition-all text-sm font-medium ${forcedDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'}`} title={isCollapsed ? 'Sair' : ''}>
                                        <LogOut size={24} />
                                        {!isCollapsed && <span>Sair</span>}
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Upgrade card */}
                        {!isAdminRoute && !isCollapsed && !immersive && (
                            <div className="mt-auto p-4 bg-[#F2F0FF] rounded-2xl border border-[#6C5DD3]/10">
                                <p className="text-xs font-bold text-[#6C5DD3] mb-1">Upgrade Pro</p>
                                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">Ganhe acesso a todas as ferramentas de IA.</p>
                                <button className="w-full py-2 bg-[#6C5DD3] text-white text-[10px] font-bold rounded-lg hover:bg-[#5a4cb3] transition-colors">
                                    Upgrade Now
                                </button>
                            </div>
                        )}
                    </>
                )}
            </aside>
        </>
    );
}

function NavItem({
    icon,
    label,
    href,
    active,
    accentColor = 'bg-[#6C5DD3]',
    accentShadow = 'shadow-[#6C5DD3]/20',
    isDark = false,
    isCollapsed = false,
    onClick
}: {
    icon: any,
    label: string,
    href: string,
    active: boolean,
    accentColor?: string,
    accentShadow?: string,
    isDark?: boolean,
    isCollapsed?: boolean,
    onClick?: () => void
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-3 py-4' : 'gap-3 px-4 py-3'} rounded-xl transition-all font-bold text-sm ${active
                ? `${accentColor} text-white shadow-lg ${accentShadow}`
                : `${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-[#1B1D21] hover:bg-gray-50'}`
                }`}
            title={isCollapsed ? label : ''}
        >
            {icon}
            {!isCollapsed && <span className="flex-1 text-left">{label}</span>}
        </Link>
    );
}
