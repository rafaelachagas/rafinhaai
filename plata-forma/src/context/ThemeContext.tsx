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
    avatar_url?: string | null;
}

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
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

        // 2. Auth & Profile setup - Only ONE source of truth
        const handleAuthChange = async (event: string, session: any) => {
            if (session?.user) {
                try {
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profileData) {
                        setProfile(profileData as UserProfile);
                    } else if (profileError) {
                        console.error('Error fetching profile:', profileError);
                    }
                } catch (err) {
                    console.error('Unexpected error fetching profile:', err);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        };

        // Listen for auth changes (this also handles initial session)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            handleAuthChange(event, session);
        });

        // Fallback: If onAuthStateChange doesn't trigger immediately, check session
        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) handleAuthChange('INITIAL', session);
            else setLoading(false);
        };
        initSession();

        return () => subscription.unsubscribe();
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme_preference', newTheme);
    };

    const refreshProfile = async () => {
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
    };

    const value = {
        theme,
        toggleTheme,
        isDark: theme === 'dark',
        profile,
        loading,
        refreshProfile
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
