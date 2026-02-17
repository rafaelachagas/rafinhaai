'use client';

import { useState, useEffect } from 'react';
import {
    Mail, Filter, Play, CheckCircle2, Clock, Search, ChevronRight, Star, Trash2, AlertCircle, X, Check
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';

export default function MessagesPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'unread' | 'read' | 'starred'>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    useEffect(() => {
        if (!themeLoading) {
            if (!profile) {
                const checkSession = async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) router.push('/login');
                };
                checkSession();
            } else {
                fetchMessages();

                // Realtime local opcional para atualizar a lista instantaneamente sem som (o global cuida do som/toast)
                const channel = supabase.channel(`messages-list-${profile.id.substring(0, 8)}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                        const newMsg = payload.new as any;
                        if (newMsg.recipient_id === profile.id || !newMsg.recipient_id) {
                            setMessages(prev => [newMsg, ...prev]);
                            setUnreadCount(prev => prev + 1);
                        }
                    })
                    .subscribe();

                return () => { supabase.removeChannel(channel); };
            }
        }
    }, [profile, themeLoading, router]);

    async function fetchMessages() {
        if (!profile?.id) return;
        setLoading(true);

        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`recipient_id.eq.${profile?.id},recipient_id.is.null`)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (data) {
            setMessages(data);
            setUnreadCount(data.filter(m => !m.is_read).length);
        }
        setLoading(false);
    }

    const markAsRead = async (msg: any) => {
        if (!msg.is_read) {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', msg.id);

            if (!error) {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        }
        setSelectedMessage(msg);
    };

    const toggleStar = async (msg: any, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const newStarred = !msg.is_starred;
        const { error } = await supabase
            .from('messages')
            .update({ is_starred: newStarred })
            .eq('id', msg.id);

        if (!error) {
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_starred: newStarred } : m));
            if (selectedMessage?.id === msg.id) {
                setSelectedMessage({ ...selectedMessage, is_starred: newStarred });
            }
        }
    };

    const handleDelete = async (msgId: string) => {
        const { error } = await supabase
            .from('messages')
            .update({ is_deleted: true })
            .eq('id', msgId);

        if (!error) {
            setMessages(prev => prev.filter(m => m.id !== msgId));
            if (selectedMessage?.id === msgId) {
                setSelectedMessage(null);
            }
        }
        setDeleteConfirmId(null);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredMessages.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredMessages.map(m => m.id));
        }
    };

    const toggleSelectMessage = (msgId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIds.includes(msgId)) {
            setSelectedIds(prev => prev.filter(id => id !== msgId));
        } else {
            setSelectedIds(prev => [...prev, msgId]);
        }
    };

    const handleBulkMarkAsRead = async () => {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', selectedIds);

        if (!error) {
            setMessages(prev => prev.map(m =>
                selectedIds.includes(m.id) ? { ...m, is_read: true } : m
            ));
            setUnreadCount(prev => Math.max(0, prev - selectedIds.filter(id => {
                const msg = messages.find(m => m.id === id);
                return msg && !msg.is_read;
            }).length));
            setSelectedIds([]);
            setSelectionMode(false);
        }
    };

    const handleBulkDelete = async () => {
        const { error } = await supabase
            .from('messages')
            .update({ is_deleted: true })
            .in('id', selectedIds);

        if (!error) {
            setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
            if (selectedMessage && selectedIds.includes(selectedMessage.id)) {
                setSelectedMessage(null);
            }
            setSelectedIds([]);
            setSelectionMode(false);
        }
        setShowBulkDeleteConfirm(false);
    };

    if (loading || themeLoading) return null;

    const filteredMessages = messages.filter(msg => {
        const subject = (msg.subject || '').toLowerCase();
        const content = (msg.content || '').replace(/<[^>]*>?/gm, '').toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesSearch = subject.includes(query) || content.includes(query);

        if (filterType === 'unread') return matchesSearch && !msg.is_read;
        if (filterType === 'read') return matchesSearch && msg.is_read;
        if (filterType === 'starred') return matchesSearch && msg.is_starred;
        return matchesSearch;
    });

    return (
        <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full">
            <Header profile={profile} unreadCount={unreadCount} />

            <div className="flex flex-col xl:flex-row gap-8 flex-1 min-h-[600px]">
                {/* Message List Column */}
                <div className="w-full xl:w-[400px] flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Minhas Mensagens</h2>
                            <p className="text-sm text-gray-500">Comunicações oficiais da administração.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {!selectionMode ? (
                                <>
                                    <button
                                        onClick={() => setSelectionMode(true)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                                    >
                                        Selecionar
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                                            className={`p-2.5 border rounded-xl transition-all flex items-center gap-2 ${isFilterOpen || filterType !== 'all' ? 'bg-[#6C5DD3] text-white' : `${isDark ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-white text-gray-500 border-gray-200'}`}`}
                                        >
                                            <Filter size={18} />
                                            {filterType !== 'all' && <span className="text-[10px] font-bold uppercase">{filterType}</span>}
                                        </button>

                                        {isFilterOpen && (
                                            <div className={`absolute right-0 mt-2 w-48 ${isDark ? 'bg-[#1A1D1F] border-white/10' : 'bg-white border-gray-100'} border rounded-2xl shadow-xl z-10 p-2 animate-in zoom-in-95 duration-200`}>
                                                {[
                                                    { id: 'all', label: 'Todas' },
                                                    { id: 'unread', label: 'Não Lidas' },
                                                    { id: 'read', label: 'Lidas' },
                                                    { id: 'starred', label: 'Favoritas' }
                                                ].map((type) => (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => {
                                                            setFilterType(type.id as any);
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === type.id ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]' : `${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50'}`}`}
                                                    >
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleSelectAll}
                                        className="px-4 py-2 bg-[#6C5DD3] text-white rounded-xl text-xs font-bold hover:bg-[#5a4ec2] transition-all flex items-center gap-2"
                                    >
                                        <Check size={14} />
                                        {selectedIds.length === filteredMessages.length ? 'Desmarcar' : 'Selecionar'} Todas
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectionMode(false);
                                            setSelectedIds([]);
                                        }}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar nas mensagens..."
                            className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-gray-100 text-gray-900'} border rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#6C5DD3]/10 outline-none`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {filteredMessages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => selectionMode ? toggleSelectMessage(msg.id, { stopPropagation: () => { } } as React.MouseEvent) : markAsRead(msg)}
                                className={`p-4 rounded-3xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] relative ${selectedMessage?.id === msg.id && !selectionMode ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-xl shadow-[#6C5DD3]/20' : `${isDark ? 'bg-white/5 border-white/10 hover:border-[#6C5DD3]/30' : 'bg-white border-gray-100 hover:border-[#6C5DD3]/30'}`} ${selectedIds.includes(msg.id) ? 'ring-2 ring-[#6C5DD3]' : ''}`}
                            >
                                {selectionMode && (
                                    <div
                                        onClick={(e) => toggleSelectMessage(msg.id, e)}
                                        className="absolute top-4 left-4 z-10 cursor-pointer"
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.includes(msg.id)
                                            ? 'bg-[#6C5DD3] border-[#6C5DD3]'
                                            : 'border-gray-300 bg-white hover:border-[#6C5DD3]'
                                            }`}>
                                            {selectedIds.includes(msg.id) && <Check size={14} className="text-white" />}
                                        </div>
                                    </div>
                                )}
                                {!selectionMode && (
                                    <button
                                        onClick={(e) => toggleStar(msg, e)}
                                        className={`absolute top-4 right-4 transition-all ${msg.is_starred ? 'text-yellow-400 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
                                    >
                                        <Star size={16} fill={msg.is_starred ? 'currentColor' : 'none'} />
                                    </button>
                                )}
                                <div className={`flex justify-between items-start mb-2 ${selectionMode ? 'ml-8' : ''}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedMessage?.id === msg.id ? 'text-white/70' : 'text-[#6C5DD3]'}`}>
                                        Oficial
                                    </span>
                                    <span className={`text-[10px] font-medium ${selectedMessage?.id === msg.id ? 'text-white/50' : 'text-gray-400'} mr-6`}>
                                        {new Date(msg.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className={`font-bold text-sm leading-tight mb-1 truncate ${selectedMessage?.id === msg.id ? 'text-white' : `${isDark ? 'text-white' : 'text-[#1B1D21]'}`}`}>{msg.subject}</h4>
                                <p className={`text-[10px] line-clamp-1 ${selectedMessage?.id === msg.id ? 'text-white/70' : 'text-gray-400'}`}>
                                    {msg.content.replace(/<[^>]*>?/gm, '')}
                                </p>
                                {!msg.is_read && selectedMessage?.id !== msg.id && (
                                    <div className="mt-2 w-1.5 h-1.5 bg-[#FF754C] rounded-full"></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectionMode && selectedIds.length > 0 && (
                        <div className="bg-[#6C5DD3] text-white rounded-2xl p-4 flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-4 duration-200">
                            <span className="text-sm font-bold">{selectedIds.length} selecionada(s)</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkMarkAsRead}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                >
                                    <CheckCircle2 size={14} />
                                    Marcar como Lidas
                                </button>
                                <button
                                    onClick={() => setShowBulkDeleteConfirm(true)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    Excluir
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Message Detail Column */}
                <div className={`flex-1 ${isDark ? 'bg-[#1A1D1F] border-white/10' : 'bg-white border-gray-100'} rounded-[2.5rem] border p-8 xl:p-12 shadow-sm flex flex-col min-h-[500px]`}>
                    {selectedMessage ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                            <div className={`flex items-start justify-between mb-10 pb-8 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-lg bg-[#FF754C]/10 flex items-center justify-center text-[#FF754C]">
                                            <Mail size={16} />
                                        </div>
                                        <span className="text-[10px] font-bold text-[#FF754C] uppercase tracking-[0.2em]">Mensagem Importante</span>
                                    </div>
                                    <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{selectedMessage.subject}</h2>
                                    <div className="flex items-center gap-4 pt-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">R</div>
                                            <span className="text-xs font-bold text-gray-400">Rafinha.AI</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                                            <Clock size={14} />
                                            {new Date(selectedMessage.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => toggleStar(selectedMessage, e)}
                                        className={`p-3 border ${isDark ? 'border-white/10' : 'border-gray-100'} rounded-2xl transition-all ${selectedMessage.is_starred ? 'text-yellow-500 bg-yellow-50 border-yellow-100' : `text-gray-400 hover:text-yellow-500 ${isDark ? 'hover:bg-yellow-500/10' : 'hover:bg-yellow-50'}`}`}
                                        title="Favoritar"
                                    >
                                        <Star size={20} fill={selectedMessage.is_starred ? 'currentColor' : 'none'} />
                                    </button>
                                    <button
                                        onClick={() => markAsRead(selectedMessage)}
                                        className={`p-3 border ${isDark ? 'border-white/10' : 'border-gray-100'} rounded-2xl transition-all ${selectedMessage.is_read ? 'text-green-500 bg-green-50 border-green-100' : `text-gray-400 hover:text-green-500 ${isDark ? 'hover:bg-green-500/10' : 'hover:bg-green-50'}`}`}
                                        title="Marcar como lida"
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(selectedMessage.id)}
                                        className="p-3 border border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                        title="Excluir"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div
                                className="flex-1 prose prose-sm max-w-none text-[#1B1D21] leading-relaxed prose-p:mb-4 prose-headings:font-bold prose-a:text-[#6C5DD3] prose-strong:text-[#1B1D21] dashboard-message-content overflow-y-auto pr-4"
                                dangerouslySetInnerHTML={{ __html: selectedMessage.content }}
                            />

                            <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-between bg-gray-50/50 -mx-8 -mb-8 px-8 py-6 rounded-b-[2.5rem]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500">Mensagem Oficial do Sistema</p>
                                </div>
                                <button
                                    onClick={() => markAsRead(selectedMessage)}
                                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
                                >
                                    Ciente
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                            <div className={`w-24 h-24 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-[2rem] flex items-center justify-center ${isDark ? 'text-gray-600' : 'text-gray-200'}`}>
                                <Mail size={48} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Nenhuma mensagem selecionada</h3>
                                <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'} max-w-[280px] mt-2`}>Selecione uma comunicação ao lado para visualizar o conteúdo completo.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900">Excluir Mensagem</h3>
                                <p className="text-sm text-gray-500 mt-1">Esta ação não pode ser desfeita</p>
                            </div>
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-8">
                            Tem certeza que deseja apagar esta mensagem? Ela será removida permanentemente da sua caixa de entrada.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {showBulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900">Excluir {selectedIds.length} Mensagens</h3>
                                <p className="text-sm text-gray-500 mt-1">Esta ação não pode ser desfeita</p>
                            </div>
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-8">
                            Tem certeza que deseja apagar permanentemente <strong>{selectedIds.length} mensagem{selectedIds.length > 1 ? 's' : ''}</strong>? {selectedIds.length > 1 ? 'Elas serão removidas' : 'Ela será removida'} permanentemente da sua caixa de entrada.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkDeleteConfirm(false)}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                Sim, Excluir {selectedIds.length > 1 ? 'Todas' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
