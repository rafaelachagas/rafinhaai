'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTheme, UserRole } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import {
    BarChart3,
    Search,
    MessageCircle,
    Flame,
    Snowflake,
    Coffee,
    CheckCircle2,
    XCircle,
    Loader2,
    Save,
    Settings,
    Users,
    ChevronRight,
    Tag,
    Edit3,
    FileText
} from 'lucide-react';
import { Header } from '@/components/Header';
import ReactMarkdown from 'react-markdown';

interface Profile {
    id: string;
    email: string;
    role: UserRole;
    created_at: string;
    full_name?: string;
    cpf?: string;
    phone?: string;
    terms_accepted_at?: string;
    last_active_at?: string;
    login_count?: number;
    ai_tools_used?: number;
    total_seconds_online?: number;
    ai_seconds_online?: number;
}

export default function CRMPage() {
    const { isDark, profile, loading: themeLoading } = useTheme();
    const router = useRouter();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Ficha de Aluno (Modal) states
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [userNotes, setUserNotes] = useState<any[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [newTags, setNewTags] = useState(''); // comma separated
    const [savingNote, setSavingNote] = useState(false);
    const [termsHistory, setTermsHistory] = useState<any[]>([]);
    const [loadingTermsHistory, setLoadingTermsHistory] = useState(false);

    useEffect(() => {
        if (!themeLoading && (!profile || (profile.role !== 'admin' && profile.role !== 'moderator'))) {
            router.push('/dashboard');
        } else if (profile) {
            fetchData();
        }
    }, [profile, themeLoading, router]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch profiles
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profilesData) {
            setUsers(profilesData as Profile[]);
        }

        setLoading(false);
    };

    const formatTime = (seconds?: number) => {
        if (!seconds) return '0m';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getHealthState = (u: Profile) => {
        const logins = u.login_count || 0;
        const aiUsage = u.ai_tools_used || 0;
        const lastActive = u.last_active_at ? new Date(u.last_active_at).getTime() : 0;
        const daysSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);

        if (aiUsage > 5 && logins > 2 && daysSinceActive < 7) {
            return { label: 'Quente', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Flame, upsell: true };
        } else if (logins > 0 && daysSinceActive < 15) {
            return { label: 'Morno', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Coffee, upsell: false };
        } else {
            return { label: 'Frio / Inativo', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Snowflake, upsell: false };
        }
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return '';
        return phone.replace(/\D/g, ''); // Clear non numbers
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort by HOT first
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const healthA = getHealthState(a).upsell ? 1 : 0;
        const healthB = getHealthState(b).upsell ? 1 : 0;
        return healthB - healthA;
    });

    const openStudentProfile = async (u: Profile) => {
        setSelectedUser(u);
        setLoadingNotes(true);
        setLoadingTermsHistory(true);
        setUserNotes([]);
        setTermsHistory([]);

        // Fetch Notes
        const { data } = await supabase
            .from('crm_notes')
            .select('*')
            .eq('user_id', u.id)
            .order('created_at', { ascending: false });

        if (data) setUserNotes(data);
        setLoadingNotes(false);

        // Fetch terms history
        const { data: tHist } = await supabase
            .from('user_terms_acceptance')
            .select('*')
            .eq('user_id', u.id)
            .order('accepted_at', { ascending: false });

        if (tHist) setTermsHistory(tHist);
        setLoadingTermsHistory(false);
    };

    const handleSaveNote = async () => {
        if (!selectedUser || !newNote.trim() || !profile) return;
        setSavingNote(true);

        const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t);

        const { data, error } = await supabase
            .from('crm_notes')
            .insert({
                user_id: selectedUser.id,
                admin_id: profile.id,
                note: newNote,
                tags: tagsArray
            })
            .select()
            .single();

        if (data && !error) {
            setUserNotes([data, ...userNotes]);
            setNewNote('');
            setNewTags('');
        } else {
            alert('Erro ao salvar anotação.');
        }

        setSavingNote(false);
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Deseja excluir esta anotação?')) return;

        const { error } = await supabase
            .from('crm_notes')
            .delete()
            .eq('id', noteId);

        if (!error) {
            setUserNotes(userNotes.filter(n => n.id !== noteId));
        }
    };

    if (themeLoading || loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0F0F0F]' : 'bg-gray-50'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-[#FF754C]" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F0F] text-white' : 'bg-gray-50 text-gray-900'} font-sans transition-colors duration-300`}>
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col gap-8">
                <Header profile={profile} unreadCount={0} searchPlaceholder="Buscar alunos..." />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#FF754C] text-[10px] font-bold uppercase tracking-widest mb-1">
                            <BarChart3 size={14} /> RELACIONAMENTO & VENDAS
                        </div>
                        <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>CRM de Alunos</h1>
                    </div>
                </div>

                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Oportunidades Quentes (Upsell)', value: users.filter(u => getHealthState(u).upsell).length, icon: Flame, color: 'text-orange-500' },
                                { label: 'Alunos Frios/Risco', value: users.filter(u => getHealthState(u).label.includes('Frio')).length, icon: Snowflake, color: 'text-blue-500' },
                                { label: 'Aceitaram os Termos', value: users.filter(u => u.terms_accepted_at).length, icon: CheckCircle2, color: 'text-green-500' },
                            ].map((stat, i) => (
                                <div key={i} className={`p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                                            <h3 className="text-xl font-bold">{stat.value} / {users.length}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CRM Table */}
                        <div className={`${isDark ? 'bg-[#1B1D21] border-white/5' : 'bg-white border-gray-100'} rounded-3xl border shadow-sm overflow-hidden transition-colors duration-300`}>
                            <div className="p-6 flex flex-col md:flex-row justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar no funil..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full ${isDark ? 'bg-[#0F0F0F] border-white/5 text-white' : 'bg-gray-50 border-gray-100'} border rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF754C]/20 transition-all`}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto mt-2">
                                <table className="w-full text-left">
                                    <thead className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                        <tr>
                                            <th className="px-6 py-4">Aluno</th>
                                            <th className="px-6 py-4">Status / Temperatura</th>
                                            <th className="px-6 py-4 text-center">Termos</th>
                                            <th className="px-6 py-4 text-right">Ações Rápidas</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                                        {sortedUsers.map((user) => {
                                            const health = getHealthState(user);
                                            const HIcon = health.icon;
                                            const phoneNum = formatPhone(user.phone);
                                            return (
                                                <tr
                                                    key={user.id}
                                                    onClick={() => openStudentProfile(user)}
                                                    className={`transition-all cursor-pointer group ${isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-100'}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF754C] to-[#7D1AB8] flex items-center justify-center text-white font-bold text-sm">
                                                                {(user.full_name || user.email || '?')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className={`font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>{user.full_name || 'Usuário sem nome'}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                                                                    {user.phone && (
                                                                        <span className={`text-[10px] font-medium bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md`}>
                                                                            {user.phone}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${health.bg} ${health.color}`}>
                                                            <HIcon size={14} />
                                                            {health.label}
                                                        </div>
                                                        <div className={`mt-1 text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            Logins: {user.login_count || 0} • Tempo: {formatTime(user.total_seconds_online)} • IAs: {user.ai_tools_used || 0}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center">
                                                            {user.terms_accepted_at ? (
                                                                <div className="flex flex-col items-center">
                                                                    <CheckCircle2 size={20} className="text-green-500 mb-1" />
                                                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sim</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center">
                                                                    <XCircle size={20} className="text-red-500 mb-1 opacity-50" />
                                                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Não</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {health.upsell && (
                                                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mr-2 animate-pulse">
                                                                    Upsell VIP
                                                                </span>
                                                            )}
                                                            <a
                                                                href={phoneNum ? `https://wa.me/55${phoneNum}` : '#'}
                                                                target={phoneNum ? "_blank" : "_self"}
                                                                rel="noreferrer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!phoneNum) e.preventDefault();
                                                                }}
                                                                className={`p-2 rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${phoneNum ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20' : isDark ? 'bg-white/5 text-gray-500 cursor-not-allowed border outline-none' : 'bg-gray-100 text-gray-400 cursor-not-allowed border outline-none'}`}
                                                                title={phoneNum ? "Abrir no WhatsApp" : "Usuário sem telefone cadastrado"}
                                                            >
                                                                <MessageCircle size={16} />
                                                            </a>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openStudentProfile(user);
                                                                }}
                                                                className={`p-2 px-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2 border ${isDark ? 'bg-transparent text-gray-300 border-white/10 group-hover:bg-[#FF754C] group-hover:border-[#FF754C] group-hover:text-white' : 'bg-transparent text-gray-600 border-gray-200 group-hover:bg-[#FF754C] group-hover:border-[#FF754C] group-hover:text-white'}`}
                                                            >
                                                                <Edit3 size={16} />
                                                                <span className="hidden lg:inline">Ficha</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {sortedUsers.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <Users size={48} className="mx-auto mb-4 text-gray-600 opacity-20" />
                                                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Nenhum aluno no histórico.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Ficha do Aluno Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedUser(null)}
                    />

                    {/* Sidebar Panel */}
                    <div className={`relative w-full max-w-lg h-full pb-20 md:pb-0 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ${isDark ? 'bg-[#0F0F0F] border-l border-white/10' : 'bg-white border-l border-gray-200'}`}>
                        {/* Header Ficha */}
                        <div className={`p-6 border-b flex items-center justify-between sticky top-0 z-10 ${isDark ? 'bg-[#0F0F0F] border-white/10' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF754C] to-[#7D1AB8] flex items-center justify-center text-white font-bold text-lg">
                                    {(selectedUser.full_name || selectedUser.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedUser.full_name || 'Usuário Sem Nome'}</h3>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        {/* Ficha Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Metricas Rapidas */}
                            <div>
                                <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Desempenho (Health Score)</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Acessos</p>
                                        <h5 className="text-xl font-bold">{selectedUser.login_count || 0}</h5>
                                    </div>
                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tempo Ativo</p>
                                        <h5 className="text-xl font-bold">{formatTime(selectedUser.total_seconds_online)}</h5>
                                    </div>
                                    <div className={`col-span-2 lg:col-span-1 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uso de IA</p>
                                        <h5 className="text-xl font-bold">{selectedUser.ai_tools_used || 0}</h5>
                                    </div>
                                </div>
                            </div>

                            {/* Informações base */}
                            <div>
                                <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Dados de Contato</h4>
                                <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Telefone:</span>
                                        <span className="font-medium text-sm">{selectedUser.phone || 'Não informado'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Termos LGPD:</span>
                                        <span className={`font-bold text-xs px-2 py-1 rounded-md ${selectedUser.terms_accepted_at ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {selectedUser.terms_accepted_at ? 'Aceito' : 'Pendente'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Último acesso:</span>
                                        <span className="font-medium text-sm text-right">
                                            {selectedUser.last_active_at ? new Date(selectedUser.last_active_at).toLocaleDateString() : 'Nunca acessou'}
                                        </span>
                                    </div>
                                </div>

                                {/* Historico de Termos */}
                                {termsHistory.length > 0 && (
                                    <div className="mt-4">
                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Histórico de Aceite dos Termos
                                        </p>
                                        <div className={`space-y-2 max-h-32 overflow-y-auto pr-2 rounded-xl p-3 border ${isDark ? 'bg-[#0F0F0F] border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                            {loadingTermsHistory ? (
                                                <div className="flex justify-center p-2"><Loader2 className="w-4 h-4 animate-spin text-[#FF754C]" /></div>
                                            ) : (
                                                termsHistory.map((hist, idx) => (
                                                    <div key={hist.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Versão {hist.version}</span>
                                                        </div>
                                                        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {new Date(hist.accepted_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`h-px w-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                            {/* Anotações da Equipe (CRM) */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Anotações de Vendas (CRM)
                                    </h4>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${isDark ? 'bg-[#FF754C]/10 text-[#FF754C]' : 'bg-[#FF754C]/10 text-[#FF754C]'}`}>Interno</span>
                                </div>

                                {/* Nova Anotacao */}
                                <div className="mb-6 space-y-3">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Registrar ligação, potencial upsell, objeção..."
                                        className={`w-full p-4 rounded-2xl text-sm resize-none h-24 border outline-none focus:ring-2 focus:ring-[#FF754C]/50 transition-all ${isDark ? 'bg-[#141414] border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
                                    />
                                    <div className="flex gap-2">
                                        <div className={`flex-1 flex items-center gap-2 px-4 rounded-xl border ${isDark ? 'bg-[#141414] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                            <Tag size={16} className="text-gray-400" />
                                            <input
                                                value={newTags}
                                                onChange={(e) => setNewTags(e.target.value)}
                                                type="text"
                                                placeholder="Tags (separadas por vírgula)"
                                                className="w-full bg-transparent text-sm py-3 outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={savingNote || !newNote.trim()}
                                            className="px-6 rounded-xl font-bold text-sm bg-[#FF754C] hover:bg-[#e66a45] text-white transition-all disabled:opacity-50"
                                        >
                                            {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                        </button>
                                    </div>
                                </div>

                                {/* Historico de Anotacoes */}
                                <div className="space-y-4">
                                    {loadingNotes ? (
                                        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[#FF754C]" /></div>
                                    ) : userNotes.length === 0 ? (
                                        <p className={`text-sm text-center py-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Sem histórico de relacionamento.</p>
                                    ) : (
                                        userNotes.map(note => (
                                            <div key={note.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {new Date(note.created_at).toLocaleDateString()} às {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <button onClick={() => handleDeleteNote(note.id)} className="text-red-500 hover:text-red-400 p-1">
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{note.note}</p>
                                                {note.tags && note.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {note.tags.map((t: string, i: number) => (
                                                            <span key={i} className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
