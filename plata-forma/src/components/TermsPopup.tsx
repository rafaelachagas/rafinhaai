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
    const [isExpired, setIsExpired] = useState(false);
    const [isRevoked, setIsRevoked] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Determines if we need to show the popup or if access is expired
    useEffect(() => {
        if (!profile) return;

        // Verifica se a conta foi revogada (Estorno/Chargeback)
        if (profile.hotmart_status === 'revoked') {
            setIsRevoked(true);
            setIsOpen(true);
            return;
        }

        // Verifica se expirou primeiro
        if (profile.access_expires_at) {
            const expiryDate = new Date(profile.access_expires_at).getTime();
            if (expiryDate < Date.now()) {
                setIsExpired(true);
                setIsOpen(true);
                return; // Para a execução se o acesso expirou
            }
        }

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

    if (isExpired) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-none" />
                <div className={`relative w-full max-w-lg flex flex-col rounded-[2.5rem] border overflow-hidden animate-in zoom-in duration-300 shadow-2xl ${isDark ? 'bg-[#120222] border-red-500/20' : 'bg-white border-red-100'}`}>
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto shadow-inner shadow-red-500/20">
                            <AlertCircle className="text-red-500 w-10 h-10" />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Acesso Expirado</h2>
                            <p className={`text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Seu período de 1 ano de acesso à Plataforma Profissão do Futuro chegou ao fim. 
                                Para continuar acessando os conteúdos e ferramentas, por favor, realize a renovação do seu plano.
                            </p>
                        </div>
                        <div className="pt-4">
                            <a
                                href="https://pay.hotmart.com/G95062680D?off=s4p88ht4"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-600 hover:from-rose-600 hover:to-red-700 text-white py-4 px-8 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-red-500/25"
                            >
                                Renovar meu acesso agora
                            </a>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Já renovou? O sistema atualizará seu acesso automaticamente em alguns instantes. Recarregue a página.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (isRevoked) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-none" />
                <div className={`relative w-full max-w-lg flex flex-col rounded-[2.5rem] border overflow-hidden animate-in zoom-in duration-300 shadow-2xl ${isDark ? 'bg-[#120222] border-red-500/20' : 'bg-white border-red-100'}`}>
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto shadow-inner shadow-red-500/20">
                            <Shield className="text-red-500 w-10 h-10" />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Acesso Revogado</h2>
                            <p className={`text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Sua conta se encontra suspensa ou revogada de nossa plataforma devido a um reembolso, cancelamento, alteração no status de pagamento ou conduta indevida. 
                            </p>
                        </div>
                        <div className="pt-4">
                            <a
                                href="https://pay.hotmart.com/G95062680D?off=s4p88ht4"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-600 hover:from-rose-600 hover:to-red-700 text-white py-4 px-8 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-red-500/25"
                            >
                                Adquirir Novo Acesso
                            </a>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Se acreditar que isso é um engano, por favor entre em contato com o suporte.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

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
