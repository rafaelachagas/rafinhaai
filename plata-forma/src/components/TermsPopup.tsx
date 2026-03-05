'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Shield, Check, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function TermsPopup() {
    const { profile, isDark, refreshProfile } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [termsHtml, setTermsHtml] = useState('Carregando termos de uso...');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Determines if we need to show the popup
    useEffect(() => {
        if (!profile) return;

        const checkTerms = async () => {
            // First time login (no check) or > 14 days without active login
            const lastActive = profile.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
            const now = Date.now();
            const daysSinceLastActive = (now - lastActive) / (1000 * 60 * 60 * 24);

            if (!profile.terms_accepted_at || daysSinceLastActive > 14) {
                // Fetch terms from settings table
                const { data, error } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'terms_of_use')
                    .single();

                if (!error && data?.value?.text) {
                    setTermsHtml(data.value.text);
                } else {
                    setTermsHtml('# Termos de Uso\n\nPor favor, leia atentamente e aceite os termos para continuar usando a plataforma.');
                }

                setIsOpen(true);
            } else {
                // Just update last active silently if > 1 day to reduce DB writes
                if (daysSinceLastActive > 1) {
                    await supabase
                        .from('profiles')
                        .update({ last_active_at: new Date().toISOString() })
                        .eq('id', profile.id);
                }
            }
        };

        checkTerms();
    }, [profile]);

    const handleAccept = async () => {
        if (!profile) return;
        setLoading(true);
        setError(null);

        const now = new Date().toISOString();

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                terms_accepted_at: now,
                last_active_at: now
            })
            .eq('id', profile.id);

        if (updateError) {
            setError('Erro ao salvar aceite. Tente novamente.');
            setLoading(false);
            return;
        }

        await refreshProfile();
        setIsOpen(false);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-none" />

            <div className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2rem] border overflow-hidden animate-in zoom-in duration-300 ${isDark ? 'bg-[#120222] border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                {/* Header */}
                <div className={`p-6 border-b flex items-center gap-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="w-12 h-12 rounded-xl bg-[#FF754C] flex items-center justify-center shadow-lg shadow-[#FF754C]/20 flex-shrink-0">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Termos de Uso e Privacidade</h2>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>É necessário aceitar os novos termos para continuar acessando.</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className={`prose max-w-none ${isDark ? 'prose-invert prose-p:text-gray-300' : 'prose-gray prose-p:text-gray-600'} prose-headings:font-bold prose-a:text-[#FF754C]`}>
                        <ReactMarkdown>{termsHtml}</ReactMarkdown>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={`p-6 border-t flex flex-col gap-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium mb-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    <button
                        onClick={handleAccept}
                        disabled={loading}
                        className="w-full bg-[#FF754C] hover:bg-[#e66a45] text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check size={20} /> Li e Aceito os Termos</>}
                    </button>
                    <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Ao aceitar, você concorda com todas as regras listadas acima para o uso da plataforma.
                    </p>
                </div>
            </div>
        </div>
    );
}
