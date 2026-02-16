'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Theme = 'light' | 'dark';
export type UserRole = 'user' | 'moderator' | 'admin';

interface UserProfile {
    id: string;
    email: string | null;
    role: UserRole;
    full_name?: string | null;
}

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
    profile: UserProfile | null;
    loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Initial theme setup
        const savedTheme = localStorage.getItem('theme_preference') as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(isSystemDark ? 'dark' : 'light');
        }

        // 2. Auth & Profile setup
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData as UserProfile);
                }
            }
            setLoading(false);
        };

        fetchProfile();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData as UserProfile);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme_preference', newTheme);
    };

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark',
        profile,
        loading
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
