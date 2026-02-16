'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={toggleTheme}
            type="button"
            className={`fixed bottom-6 right-6 p-4 rounded-2xl border transition-all duration-300 z-[100] cursor-pointer shadow-lg hover:scale-110 active:scale-95 ${isDark
                    ? 'bg-[#120222] border-white/10 text-[#B42AF0] shadow-violet-950/20 hover:bg-[#1a052d]'
                    : 'bg-white border-gray-200 text-[#B42AF0] shadow-purple-500/10 hover:shadow-purple-500/20'
                }`}
            title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
    );
}
