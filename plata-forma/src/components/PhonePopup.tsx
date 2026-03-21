'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Phone, Check, Loader2, AlertCircle, X } from 'lucide-react';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export function PhonePopup({ onClose }: { onClose: () => void }) {
    const { profile, isDark, refreshProfile } = useTheme();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!profile) return;
        
        if (!phone || !isPossiblePhoneNumber(phone)) {
            setError('Digite um número de telefone válido com DDI e DDD.');
            return;
        }

        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ phone: phone })
            .eq('id', profile.id);

        if (updateError) {
            setError('Erro ao salvar telefone. Tente novamente.');
            setLoading(false);
            return;
        }

        await refreshProfile();
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full max-w-md rounded-[2rem] border overflow-hidden animate-in zoom-in duration-300 ${isDark ? 'bg-[#14171A] border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-xl transition-all z-10 ${isDark ? 'text-gray-400 hover:bg-white/10 text-white' : 'text-gray-400 hover:bg-gray-100 text-gray-600'}`}
                    title="Voltar para Ferramentas"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className={`p-8 pb-4 text-center`}>
                    <div className="w-16 h-16 rounded-2xl bg-[#6C5DD3]/10 flex items-center justify-center mx-auto mb-4">
                        <Phone className="text-[#6C5DD3] w-8 h-8" />
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Cadastre seu Telefone
                    </h2>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Para usar as ferramentas, precisamos do seu número de telefone. Isso nos ajuda a manter sua conta segura.
                    </p>
                </div>

                {/* Form */}
                <div className="p-8 pt-4 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Telefone com DDD (Opcional: outro país)
                        </label>
                        <PhoneInput
                            international
                            defaultCountry="BR"
                            value={phone}
                            onChange={(val) => setPhone((val as string) || '')}
                            className={`w-full px-4 py-4 rounded-xl border text-lg font-medium tracking-wider ${isDark
                                ? 'PhoneInputDark bg-white/5 border-white/10 text-white placeholder-gray-500 focus-within:border-[#6C5DD3]'
                                : 'PhoneInputLight bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus-within:border-[#6C5DD3]'
                            } outline-none focus-within:ring-2 focus-within:ring-[#6C5DD3]/40 transition-all`}
                        />
                        <style dangerouslySetInnerHTML={{__html: `
                            .PhoneInputInput {
                                background: transparent !important;
                                border: none !important;
                                outline: none !important;
                                color: inherit !important;
                            }
                            .PhoneInputCountry {
                                margin-right: 12px;
                            }
                        `}} />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading || !phone || !isPossiblePhoneNumber(phone)}
                        className="w-full bg-[#6C5DD3] hover:bg-[#5B4EC2] text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6C5DD3]/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check size={20} /> Salvar e Continuar</>}
                    </button>

                    <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Seu número não será compartilhado com terceiros.
                    </p>
                </div>
            </div>
        </div>
    );
}
