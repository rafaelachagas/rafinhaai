'use client';

import { useTheme } from '@/context/ThemeContext';
import { usePathname, useRouter } from 'next/navigation';
import { PhonePopup } from '@/components/PhonePopup';

export function PhoneEnforcer() {
    const { profile } = useTheme();
    const pathname = usePathname();
    const router = useRouter();

    if (!profile) return null;

    // Remove empty phone condition. Wait, empty phone string? Yes.
    // So if profile.phone is falsy
    if (profile.phone) return null;

    // AI Tools routes to protect
    // Basically any route under /dashboard/tools/ EXCEPT the root (catalog)
    const isToolRoute = pathname.startsWith('/dashboard/tools/') && pathname !== '/dashboard/tools';
    const isScriptRoute = pathname.startsWith('/dashboard/scripts');

    if (isToolRoute || isScriptRoute) {
        return (
            <PhonePopup 
                onClose={() => {
                    // Force them away from the tool page if they refuse to put the phone number
                    router.push('/dashboard/tools');
                }} 
            />
        );
    }

    return null;
}
