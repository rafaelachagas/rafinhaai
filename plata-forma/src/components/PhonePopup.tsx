'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase/client';
import { Phone, Check, Loader2, AlertCircle, X } from 'lucide-react';

export function PhonePopup({ onClose }: { onClose: () => void }) {
    const { profile, isDark, refreshProfile } = useTheme();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Format phone number as user types
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
    };

    const handleSave = async () => {
        if (!profile) return;
        
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
            setError('Digite um número de telefone válido com DDD.');
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
                            Telefone com DDD
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="(11) 99999-9999"
                            maxLength={16}
                            className={`w-full px-4 py-4 rounded-xl border text-lg font-medium tracking-wider ${isDark
                                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-[#6C5DD3]'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#6C5DD3]'
                            } outline-none focus:ring-2 focus:ring-[#6C5DD3]/40 transition-all`}
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading || phone.replace(/\D/g, '').length < 10}
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
