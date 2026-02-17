'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    Sparkles, LayoutDashboard, Mail, BookOpen, PenTool,
    Users, Shield, Settings, LogOut, BarChart3, ArrowLeft, CheckSquare, ChevronRight, ChevronLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isDark } = useTheme();
    const isAdminRoute = pathname.startsWith('/dashboard/admin');
    const accentColor = isAdminRoute ? 'bg-[#FF754C]' : 'bg-[#6C5DD3]';
    const accentShadow = isAdminRoute ? 'shadow-[#FF754C]/20' : 'shadow-[#6C5DD3]/20';
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <aside className={`${isCollapsed ? 'w-24' : 'w-64'} ${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} border-r hidden lg:flex flex-col p-6 h-screen sticky top-0 transition-all duration-300 relative`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`absolute -right-3 top-8 w-6 h-6 ${isDark ? 'bg-[#1B1D21] border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-[#6C5DD3]'} border rounded-full flex items-center justify-center shadow-lg transition-all z-10`}
                title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={`flex items-center gap-3 mb-12 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
                <div className={`w-10 h-10 rounded-xl ${accentColor} flex items-center justify-center shadow-lg ${accentShadow}`}>
                    {isAdminRoute ? <Shield className="text-white w-7 h-7" /> : <Sparkles className="text-white w-7 h-7" />}
                </div>
                {!isCollapsed && (
                    <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
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
                                <NavItem icon={<LayoutDashboard size={24} />} label="Resumo Geral" href="/dashboard/admin" active={pathname === '/dashboard/admin'} accentColor={accentColor} accentShadow={accentShadow} isDark={isDark} isCollapsed={isCollapsed} />
                                <NavItem icon={<Users size={24} />} label="Usuários" href="/dashboard/admin/users" active={pathname === '/dashboard/admin/users'} accentColor={accentColor} accentShadow={accentShadow} isDark={isDark} isCollapsed={isCollapsed} />
                                <NavItem icon={<Mail size={24} />} label="Avisos/Mensagens" href="/dashboard/admin/messages" active={pathname === '/dashboard/admin/messages'} accentColor={accentColor} accentShadow={accentShadow} isDark={isDark} isCollapsed={isCollapsed} />
                            </>
                        ) : (
                            <>
                                <NavItem icon={<LayoutDashboard size={24} />} label="Início" href="/dashboard" active={pathname === '/dashboard'} isDark={isDark} isCollapsed={isCollapsed} />
                                <NavItem icon={<Mail size={24} />} label="Mensagens" href="/dashboard/messages" active={pathname === '/dashboard/messages'} isDark={isDark} isCollapsed={isCollapsed} />
                                <NavItem icon={<BookOpen size={24} />} label="Aulas" href="#" active={false} isDark={isDark} isCollapsed={isCollapsed} />
                                <NavItem icon={<PenTool size={24} />} label="Ferramentas" href="#" active={false} isDark={isDark} isCollapsed={isCollapsed} />
                                <NavItem icon={<CheckSquare size={24} />} label="Tarefas" href="#" active={false} isDark={isDark} isCollapsed={isCollapsed} />
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
                                isDark={isDark}
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
                                isDark={isDark}
                                isCollapsed={isCollapsed}
                            />
                        )}
                        <NavItem icon={<Settings size={24} />} label="Ajustes" href="/dashboard/settings" active={pathname === '/dashboard/settings'} accentColor={accentColor} accentShadow={accentShadow} isDark={isDark} isCollapsed={isCollapsed} />
                        <button onClick={handleLogout} className={`w-full flex items-center ${isCollapsed ? 'justify-center px-3 py-4' : 'gap-3 px-4 py-3'} rounded-xl transition-all text-sm font-medium ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'}`} title={isCollapsed ? 'Sair' : ''}>
                            <LogOut size={24} />
                            {!isCollapsed && <span>Sair</span>}
                        </button>
                    </nav>
                </div>
            </div>

            {!isAdminRoute && !isCollapsed && (
                <div className="mt-auto p-4 bg-[#F2F0FF] rounded-2xl border border-[#6C5DD3]/10">
                    <p className="text-xs font-bold text-[#6C5DD3] mb-1">Upgrade Pro</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-3">Ganhe acesso a todas as ferramentas de IA.</p>
                    <button className="w-full py-2 bg-[#6C5DD3] text-white text-[10px] font-bold rounded-lg hover:bg-[#5a4cb3] transition-colors">
                        Upgrade Now
                    </button>
                </div>
            )}
        </aside>
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
    isCollapsed = false
}: {
    icon: any,
    label: string,
    href: string,
    active: boolean,
    accentColor?: string,
    accentShadow?: string,
    isDark?: boolean,
    isCollapsed?: boolean
}) {
    return (
        <Link
            href={href}
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
