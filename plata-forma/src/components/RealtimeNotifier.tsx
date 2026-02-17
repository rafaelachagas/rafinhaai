'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';

export function RealtimeNotifier() {
    const { profile } = useTheme();
    const [toast, setToast] = useState<{ msg: string, subject: string } | null>(null);

    const playPremiumSound = () => {
        try {
            // Som mais curto e discreto
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
            audio.volume = 0.15;
            audio.play().catch(() => {
                console.log('Autoplay do som bloqueado pelo navegador.');
            });
        } catch (e) {
            console.error('Erro ao tocar áudio premium:', e);
        }
    };

    useEffect(() => {
        if (!profile?.id) return;

        console.log('📡 [Global Realtime] Iniciando monitoramento...');

        const channel = supabase.channel(`global-notifs-${profile.id.substring(0, 8)}`);

        channel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as any;

                    // Só notifica se for para esse usuário e não tiver sido enviado por ele
                    if ((newMsg.recipient_id === profile.id || !newMsg.recipient_id) && newMsg.sender_id !== profile.id) {
                        console.log('🔔 [Global] Nova mensagem recebida!');
                        setToast({
                            subject: newMsg.subject,
                            msg: newMsg.content.replace(/<[^>]*>?/gm, '').substring(0, 50)
                        });
                        playPremiumSound();
                        setTimeout(() => setToast(null), 6000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id]);

    if (!toast) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-right duration-500">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-72 flex gap-4 items-start ring-1 ring-black/5">
                <div className="w-10 h-10 rounded-xl bg-[#6C5DD3] flex items-center justify-center text-white flex-shrink-0">
                    <Mail size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest mb-1">Novo Aviso</p>
                    <h4 className="text-xs font-bold text-[#1B1D21] truncate">{toast.subject}</h4>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{toast.msg}</p>
                </div>
                <button onClick={() => setToast(null)} className="text-gray-300 hover:text-gray-500">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

import { Mail, X } from 'lucide-react';
