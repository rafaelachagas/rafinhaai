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
    phone?: string | null;
    terms_accepted_at?: string | null;
    last_active_at?: string | null;
    login_count?: number;
    ai_tools_used?: number;
    access_expires_at?: string;
    total_seconds_online?: number;
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

                        // Registrar acessos intermitentes (limite de 1 hora para não floodar o banco)
                        const lastActive = profileData.last_active_at ? new Date(profileData.last_active_at).getTime() : 0;
                        const now = Date.now();
                        const timeSinceLastActive = now - lastActive;

                        if (timeSinceLastActive > 1000 * 60 * 60) { // +1 hora
                            const newLoginCount = (profileData.login_count || 0) + 1;
                            // Salva no banco de forma silenciosa e "fire-and-forget"
                            supabase.from('profiles').update({
                                last_active_at: new Date().toISOString(),
                                login_count: newLoginCount
                            }).eq('id', profileData.id).then();
                        }
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

    // Time tracking effect
    useEffect(() => {
        if (!profile) return;

        let intervalId = setInterval(() => {
            if (document.visibilityState === 'visible' && !window.location.pathname.startsWith('/dashboard/admin')) {
                supabase.rpc('increment_time_online', {
                    p_user_id: profile.id,
                    p_seconds: 10
                }).then();
                setProfile(prev => prev ? { ...prev, total_seconds_online: (prev.total_seconds_online || 0) + 10 } : null);
            }
        }, 10000); // 10 seconds

        return () => clearInterval(intervalId);
    }, [profile]);

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
