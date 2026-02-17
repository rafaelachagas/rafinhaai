'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Send, Users, User, Mail, Search, AlertCircle, CheckCircle2,
    MessageCircle, Trash2, Bold, Italic, Link as LinkIcon,
    Underline as UnderlineIcon, List, AlignLeft, AlignCenter, AlignRight,
    AtSign, Image, Eye, Clock, X, ChevronRight, Undo, Redo, Paperclip
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';

export default function AdminMessagesPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
    const [unreadCount, setUnreadCount] = useState(0);
    const [previewContent, setPreviewContent] = useState('');

    // Form states
    const [subject, setSubject] = useState('');
    const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userResults, setUserResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    // History states
    const [sentMessages, setSentMessages] = useState<any[]>([]);
    const [selectedSentMsg, setSelectedSentMsg] = useState<any | null>(null);
    const [searchHistory, setSearchHistory] = useState('');

    const searchRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!themeLoading) {
            if (!profile || profile.role !== 'admin') {
                router.push('/dashboard');
            } else {
                setLoading(false);
                fetchSentHistory();
                fetchUnreadCount();
            }
        }
    }, [router, profile, themeLoading]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 2) searchUsers();
            else setUserResults([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    async function searchUsers() {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .neq('role', 'admin')
            .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            .limit(10);

        if (data) {
            setUserResults(data);
            setShowResults(true);
        }
    }

    async function fetchUnreadCount() {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .or(`recipient_id.eq.${profile?.id},recipient_id.is.null`)
            .eq('is_read', false);

        if (count !== null) setUnreadCount(count);
    }

    async function fetchSentHistory() {
        const { data } = await supabase
            .from('messages')
            .select('*, recipient:recipient_id(full_name, email)')
            .eq('sender_id', profile?.id)
            .order('created_at', { ascending: false });

        // Admin vê TODAS as mensagens, incluindo as que foram "deletadas" pelos alunos
        if (data) setSentMessages(data);
    }

    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value || undefined);
        updatePreview();
        if (editorRef.current) editorRef.current.focus();
    };

    const updatePreview = () => {
        if (editorRef.current) {
            setPreviewContent(editorRef.current.innerHTML);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imgHtml = `<img src="${event.target?.result}" style="max-width: 100%; border-radius: 12px; margin: 10px 0;" />`;
            execCommand('insertHTML', imgHtml);
            updatePreview();
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const contentHtml = editorRef.current?.innerHTML || '';

        if (!subject.trim()) {
            setStatus({ type: 'error', msg: 'O assunto é obrigatório.' });
            return;
        }

        if (!contentHtml || contentHtml === '<br>') {
            setStatus({ type: 'error', msg: 'A mensagem não pode estar vazia.' });
            return;
        }

        setSending(true);
        setStatus(null);

        try {
            if (recipientType === 'specific' && !selectedUser) {
                setStatus({ type: 'error', msg: 'Selecione um aluno primeiro.' });
                setSending(false);
                return;
            }

            if (recipientType === 'all') {
                const { data: students, error: fetchError } = await supabase
                    .from('profiles')
                    .select('id')
                    .neq('role', 'admin');

                if (fetchError) throw fetchError;

                if (students && students.length > 0) {
                    const messagesToInsert = students.map(student => ({
                        sender_id: profile?.id,
                        recipient_id: student.id,
                        subject,
                        content: contentHtml
                    }));
                    const { error: insertError } = await supabase.from('messages').insert(messagesToInsert);
                    if (insertError) throw insertError;
                }
            } else {
                const { error } = await supabase.from('messages').insert({
                    sender_id: profile?.id,
                    recipient_id: selectedUser.id,
                    subject,
                    content: contentHtml
                });
                if (error) throw error;
            }

            setStatus({ type: 'success', msg: 'Mensagem enviada com sucesso!' });
            setSubject('');
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
            setPreviewContent('');
            setSelectedUser(null);
            setSearchTerm('');
            fetchSentHistory();
        } catch (error: any) {
            setStatus({ type: 'error', msg: error.message || 'Erro ao enviar.' });
        } finally {
            setSending(false);
        }
    };

    const filteredHistory = sentMessages.filter(msg => {
        const query = searchHistory.toLowerCase();
        return (
            (msg.subject || '').toLowerCase().includes(query) ||
            (msg.recipient?.full_name || 'Broadcast').toLowerCase().includes(query) ||
            (msg.recipient?.email || '').toLowerCase().includes(query)
        );
    });

    if (loading || themeLoading) return null;

    return (
        <main className={`flex-1 p-4 lg:p-8 flex flex-col gap-8 max-w-[1240px] mx-auto w-full min-h-screen ${isDark ? 'bg-[#0F0F0F] text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
            <Header profile={profile} unreadCount={0} />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-[#FF754C] text-[10px] font-bold uppercase tracking-widest mb-1">
                        <MessageCircle size={14} /> CENTRAL DE COMUNICAÇÃO
                    </div>
                    <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>Avisos/Mensagens</h1>
                </div>

                <div className={`flex p-1.5 ${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100 shadow-sm'} rounded-2xl border self-start`}>
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'send' ? 'bg-[#FF754C] text-white shadow-lg shadow-[#FF754C]/20' : 'text-gray-400 hover:text-[#1B1D21]'}`}
                    >
                        NOVO COMUNICADO
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-[#FF754C] text-white shadow-lg shadow-[#FF754C]/20' : 'text-gray-400 hover:text-[#1B1D21]'}`}
                    >
                        HISTÓRICO
                    </button>
                </div>
            </div>

            {activeTab === 'send' ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    <section className={`xl:col-span-8 ${isDark ? 'bg-[#1A1D1F] border-white/10' : 'bg-white border-gray-100 shadow-sm'} rounded-[2.5rem] p-8 xl:p-10 border flex flex-col gap-8`}>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormGroup label="Para Quem?" icon={<Users size={18} />} isDark={isDark}>
                                    <div className={`flex gap-2 p-1 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-2xl mt-2`}>
                                        <button
                                            type="button"
                                            onClick={() => setRecipientType('all')}
                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${recipientType === 'all' ? `${isDark ? 'bg-white/10 text-[#FF754C]' : 'bg-white text-[#FF754C] shadow-sm'}` : 'text-gray-400'}`}
                                        >
                                            Todos os Alunos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRecipientType('specific')}
                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${recipientType === 'specific' ? `${isDark ? 'bg-white/10 text-[#FF754C]' : 'bg-white text-[#FF754C] shadow-sm'}` : 'text-gray-400'}`}
                                        >
                                            Aluno Específico
                                        </button>
                                    </div>
                                    {recipientType === 'specific' && (
                                        <div className="mt-4 relative" ref={searchRef}>
                                            {selectedUser ? (
                                                <div className="flex items-center justify-between p-3 bg-[#FF754C]/5 border border-[#FF754C]/20 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#FF754C] flex items-center justify-center text-white text-xs font-bold">
                                                            {selectedUser.full_name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold">{selectedUser.full_name}</p>
                                                            <p className="text-[10px] text-gray-400">{selectedUser.email}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-white rounded-lg transition-all text-gray-400">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                    <input
                                                        type="text"
                                                        placeholder="Pesquisar por nome ou e-mail..."
                                                        className={`w-full ${isDark ? 'bg-white/5 text-white placeholder:text-gray-500' : 'bg-gray-50 text-gray-900'} border-none rounded-2xl py-3 px-4 text-xs font-medium focus:ring-2 focus:ring-[#FF754C]/20 outline-none`}
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                    {showResults && userResults.length > 0 && (
                                                        <div className={`absolute top-full left-0 right-0 mt-2 ${isDark ? 'bg-[#1A1D1F] border-white/10' : 'bg-white border-gray-100'} rounded-2xl shadow-2xl border z-50 overflow-hidden max-h-60 overflow-y-auto`}>
                                                            {userResults.map(user => (
                                                                <button
                                                                    key={user.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedUser(user);
                                                                        setShowResults(false);
                                                                        setSearchTerm('');
                                                                    }}
                                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-all text-left border-b border-gray-50 last:border-0"
                                                                >
                                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                                                                        {user.full_name[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-bold">{user.full_name}</p>
                                                                        <p className="text-[10px] text-gray-400">{user.email}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </FormGroup>

                                <FormGroup label="Assunto" icon={<Mail size={18} />} isDark={isDark}>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Digite o assunto do comunicado..."
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100/50'} border rounded-2xl py-4 px-5 text-sm outline-none focus:ring-2 focus:ring-[#FF754C]/20 transition-all mt-2 font-medium`}
                                    />
                                </FormGroup>
                            </div>

                            <FormGroup label="Conteúdo da Mensagem" icon={<MessageCircle size={18} />} isDark={isDark}>
                                <div className={`mt-2 border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50/30'} rounded-3xl overflow-hidden`}>
                                    <div className={`flex flex-wrap items-center gap-1 p-3 ${isDark ? 'bg-[#1A1D1F] border-white/10' : 'bg-white border-gray-100'} border-b overflow-x-auto`}>
                                        <EditorBtn icon={<Bold size={16} />} onClick={() => execCommand('bold')} title="Negrito" isDark={isDark} />
                                        <EditorBtn icon={<Italic size={16} />} onClick={() => execCommand('italic')} title="Itálico" isDark={isDark} />
                                        <EditorBtn icon={<UnderlineIcon size={16} />} onClick={() => execCommand('underline')} title="Sublinhado" isDark={isDark} />
                                        <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-100'} mx-1`}></div>
                                        <EditorBtn icon={<AlignLeft size={16} />} onClick={() => execCommand('justifyLeft')} title="Alinhar Esquerda" isDark={isDark} />
                                        <EditorBtn icon={<AlignCenter size={16} />} onClick={() => execCommand('justifyCenter')} title="Centralizar" isDark={isDark} />
                                        <EditorBtn icon={<AlignRight size={16} />} onClick={() => execCommand('justifyRight')} title="Alinhar Direita" isDark={isDark} />
                                        <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-100'} mx-1`}></div>
                                        <EditorBtn icon={<List size={16} />} onClick={() => execCommand('insertUnorderedList')} title="Lista" isDark={isDark} />
                                        <EditorBtn icon={<LinkIcon size={16} />} onClick={() => {
                                            const url = prompt('Cole o link aqui:');
                                            if (url) execCommand('createLink', url);
                                        }} title="Inserir Link" isDark={isDark} />
                                        <EditorBtn icon={<Image size={16} />} onClick={() => fileInputRef.current?.click()} title="Inserir Imagem" isDark={isDark} />
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                                        <div className="flex-1"></div>
                                        <EditorBtn icon={<Undo size={16} />} onClick={() => execCommand('undo')} title="Desfazer" isDark={isDark} />
                                        <EditorBtn icon={<Redo size={16} />} onClick={() => execCommand('redo')} title="Refazer" isDark={isDark} />
                                    </div>
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        className={`min-h-[300px] p-8 outline-none ${isDark ? 'bg-[#0A0113] text-white' : 'bg-white text-gray-900'} font-serif text-lg leading-relaxed dashboard-editor prose prose-sm max-w-none`}
                                        onInput={updatePreview}
                                    />
                                </div>
                            </FormGroup>

                            <div className="flex items-center justify-between">
                                {status && (
                                    <div className={`flex items-center gap-2 text-xs font-bold ${status.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                        {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                        {status.msg}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className={`ml-auto px-10 py-4 bg-[#FF754C] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#FF754C]/20 hover:bg-[#e66a45] transition-all flex items-center gap-2 ${sending ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {sending ? 'ENVIANDO...' : 'ENVIAR AGORA'}
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </section>

                    <aside className="xl:col-span-4 flex flex-col gap-8">
                        <div className={`${isDark ? 'bg-[#1A1D1F] border-white/10 shadow-black/40' : 'bg-white border-gray-100 shadow-sm'} rounded-[2.5rem] p-8 border`}>
                            <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                <Eye className="text-[#FF754C]" size={20} />
                                Visualização
                            </h3>
                            <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-3xl p-6 min-h-[400px] flex flex-col`}>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#FF754C] flex items-center justify-center text-white">
                                            <Mail size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className={`h-4 ${subject ? '' : 'w-2/3 bg-gray-200 animate-pulse'} rounded-full mb-1 font-bold text-sm ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                                {subject || ''}
                                            </div>
                                            <div className="h-3 w-1/3 bg-gray-200 rounded-full opacity-50"></div>
                                        </div>
                                    </div>
                                    <div className="pt-4 space-y-2">
                                        <div className="h-3 w-full bg-gray-200 rounded-full opacity-30"></div>
                                        <div className="h-3 w-full bg-gray-200 rounded-full opacity-30"></div>
                                        <div className="h-3 w-3/4 bg-gray-200 rounded-full opacity-30"></div>
                                    </div>
                                </div>
                                <div className={`flex-1 mt-8 p-4 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-100 text-gray-900'} rounded-2xl border shadow-sm prose prose-xs max-w-none overflow-y-auto max-h-[400px]`}
                                    dangerouslySetInnerHTML={{ __html: previewContent || `<p class="${isDark ? 'text-gray-500' : 'text-gray-300'}">Sua mensagem aparecerá aqui...</p>` }}
                                />
                            </div>
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100 shadow-sm'} rounded-[2.5rem] border p-10 transition-colors duration-300`}>
                        <HistorySection
                            history={filteredHistory}
                            onSearch={setSearchHistory}
                            onSelect={setSelectedSentMsg}
                            isDark={isDark}
                        />
                    </div>
                </div>
            )}

            {/* Sent Message Detail Modal */}
            {selectedSentMsg && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className={`${isDark ? 'bg-[#1A1D1F] border-white/10 shadow-black/60' : 'bg-white border-gray-200'} w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border`}>
                        <div className={`p-8 border-b ${isDark ? 'border-white/10 bg-white/5' : 'bg-gray-50 border-gray-50/50'} flex items-center justify-between`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#FF754C] flex items-center justify-center text-white shadow-lg shadow-[#FF754C]/20">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'} line-clamp-1`}>{selectedSentMsg.subject}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        Enviada para: {selectedSentMsg.recipient?.full_name || 'Todos os Alunos'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSentMsg(null)}
                                className={`p-3 rounded-2xl ${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:text-[#FF754C]' : 'bg-white border-gray-100 text-gray-400 hover:text-[#FF754C]'} hover:shadow-md transition-all border`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            <div className={`flex items-center gap-2 mb-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${isDark ? 'bg-white/5' : 'bg-gray-50'} w-fit px-3 py-1 rounded-full`}>
                                <Clock size={12} />
                                Enviada em: {new Date(selectedSentMsg.created_at).toLocaleString('pt-BR')}
                            </div>

                            <div
                                className={`prose prose-orange max-w-none ${isDark ? 'text-white/90' : 'text-[#1B1D21]'} leading-relaxed`}
                                dangerouslySetInnerHTML={{ __html: selectedSentMsg.content }}
                            />
                        </div>

                        <div className={`p-8 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-50 bg-gray-50/30'} flex justify-end`}>
                            <button
                                onClick={() => setSelectedSentMsg(null)}
                                className={`px-8 py-3 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#1B1D21] text-white hover:bg-black'} rounded-2xl font-bold text-xs transition-all shadow-lg`}
                            >
                                FECHAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

// SHARED COMPONENTS
function FormGroup({ label, icon, children, isDark }: { label: string, icon: any, children: React.ReactNode, isDark?: boolean }) {
    return (
        <div className="flex flex-col">
            <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                {icon} {label}
            </label>
            {children}
        </div>
    );
}

function EditorBtn({ icon, onClick, title, isDark }: { icon: any, onClick: () => void, title: string, isDark?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-[#FF754C]'}`}
            title={title}
        >
            {icon}
        </button>
    );
}

function HistorySection({ history, onSearch, onSelect, isDark }: { history: any[], onSearch: (val: string) => void, onSelect: (msg: any) => void, isDark?: boolean }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mensagens Enviadas</h2>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Filtrar histórico..."
                        className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-none text-gray-900'} rounded-xl py-2 pl-9 pr-4 text-xs font-medium outline-none border`}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {history.map((msg) => (
                    <div
                        key={msg.id}
                        onClick={() => onSelect(msg)}
                        className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10 hover:border-[#FF754C]/50' : 'bg-white border-gray-100 hover:border-[#FF754C]/30 hover:shadow-[#FF754C]/10'} transition-all hover:shadow-xl group cursor-pointer`}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-center group-hover:bg-[#FF754C]/10 transition-colors`}>
                                <User size={14} className="text-gray-400 group-hover:text-[#FF754C]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${isDark ? 'group-hover:text-white' : 'group-hover:text-[#1B1D21]'}`}>{msg.recipient?.full_name || 'Broadcast'}</p>
                                <p className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <h4 className={`font-bold text-sm mb-2 truncate ${isDark ? 'text-white group-hover:text-[#FF754C]' : 'group-hover:text-[#FF754C]'} transition-colors`}>{msg.subject}</h4>
                        <div className="text-[10px] text-gray-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: msg.content.replace(/<img.*?>/g, '[Imagem]') }} />
                    </div>
                ))}
            </div>
        </div>
    );
}
