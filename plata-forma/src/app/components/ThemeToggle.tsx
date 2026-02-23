'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isImmersive = pathname.includes('/dashboard/courses') || pathname.includes('/dashboard/watch');

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isImmersive) return null;

    return (
        <button
            onClick={toggleTheme}
            type="button"
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 9999,
                backgroundColor: isDark ? '#B42AF0' : '#7D1AB8',
                color: 'white',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
    );
}
