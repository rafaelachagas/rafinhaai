'use client';

import { Sidebar } from '@/components/Sidebar';
import { RealtimeNotifier } from '@/components/RealtimeNotifier';
import { useTheme } from '@/context/ThemeContext';
import { usePathname } from 'next/navigation';

const IMMERSIVE_ROUTES = ['/dashboard/courses', '/dashboard/watch'];

function isImmersiveRoute(pathname: string) {
    return IMMERSIVE_ROUTES.some(route => pathname.startsWith(route));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading, isDark } = useTheme();
    const pathname = usePathname();
    const immersive = isImmersiveRoute(pathname);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-[#6C5DD3] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isAdmin = profile?.role === 'admin';

    // In immersive mode: black background regardless of theme
    const bgClass = immersive
        ? 'bg-[#141414] text-white'
        : isDark
            ? 'bg-[#0F0F0F] text-white'
            : 'bg-gray-50 text-[#1B1D21]';

    return (
        <div className={`min-h-screen ${bgClass} font-sans flex transition-colors duration-300`}>
            <Sidebar isAdmin={isAdmin} />
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {children}
            </div>
            <RealtimeNotifier />
        </div>
    );
}
