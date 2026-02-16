'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useTheme, UserRole } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    Shield,
    Mail,
    Calendar,
    ChevronLeft,
    Loader2,
    X,
    Check,
    Lock,
    Eye,
    EyeOff,
    Trash2
} from 'lucide-react';
import { createUser, deleteUser, updateUserRole } from '@/app/actions/admin';

interface Profile {
    id: string;
    email: string;
    role: UserRole;
    created_at: string;
    full_name?: string;
}

export default function UserManagementPage() {
    const { isDark, profile, loading: themeLoading } = useTheme();
    const router = useRouter();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form states
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('user');
    const [showPassword, setShowPassword] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!themeLoading && (!profile || (profile.role !== 'admin' && profile.role !== 'moderator'))) {
            router.push('/dashboard');
        } else if (profile) {
            fetchUsers();
        }
    }, [profile, themeLoading, router]);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setUsers(data as Profile[]);
        }
        setLoading(false);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);

        const result = await createUser(newUserEmail, newUserName, newUserPassword, newUserRole);

        if (result.success) {
            setIsAddModalOpen(false);
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('user');
            fetchUsers();
        } else {
            setFormError(result.error || 'Erro ao criar usuário');
        }
        setFormLoading(false);
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita.')) return;

        if (!profile) return;
        const result = await deleteUser(userId, userEmail, profile.id);
        if (result.success) {
            fetchUsers();
        } else {
            alert('Erro ao excluir usuário: ' + result.error);
        }
    };

    const updateRole = async (userId: string, userEmail: string, newRole: UserRole) => {
        if (!profile) return;

        const result = await updateUserRole(userId, userEmail, newRole, profile.id);

        if (!result.success) {
            alert(result.error);
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (themeLoading || (loading && users.length === 0)) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0A0113]' : 'bg-gray-50'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-[#B42AF0]" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'} selection:bg-purple-500/30 p-4 md:p-8`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/admin')}
                            className={`p-2 rounded-xl border transition-colors ${isDark ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
                            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Gerencie acessos e permissões da plataforma.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20"
                    >
                        <UserPlus size={20} />
                        Novo Usuário
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'Total de Membros', value: users.length, icon: Users, color: 'text-blue-500' },
                        { label: 'Administradores', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-red-500' },
                        { label: 'Novos Hoje', value: users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length, icon: Calendar, color: 'text-green-500' },
                    ].map((stat, i) => (
                        <div key={i} className={`p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                                    <h3 className="text-xl font-bold">{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className={`p-4 rounded-[2rem] border mb-6 flex flex-col md:flex-row gap-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition-all ${isDark ? 'bg-[#0A0113] border-white/10 focus:border-[#B42AF0]/50' : 'bg-gray-50 border-gray-100 focus:border-[#B42AF0]/50'}`}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className={`p-3 rounded-xl border flex items-center gap-2 transition-colors ${isDark ? 'bg-[#0A0113] border-white/10 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                            <Filter size={18} />
                            Filtros
                        </button>
                    </div>
                </div>

                {/* Users List */}
                <div className={`overflow-hidden rounded-[2rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                <tr>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Cargo</th>
                                    <th className="px-6 py-4">Cadastro</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B42AF0] to-[#7D1AB8] flex items-center justify-center text-white font-bold text-sm">
                                                    {(user.full_name || user.email || '?')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{user.full_name || 'Usuário sem nome'}</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => updateRole(user.id, user.email, e.target.value as UserRole)}
                                                disabled={user.role === 'admin'}
                                                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border bg-transparent outline-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${user.role === 'admin'
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : user.role === 'moderator'
                                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        : 'bg-[#B42AF0]/10 text-[#B42AF0] border-[#B42AF0]/20'
                                                    }`}
                                            >
                                                <option value="user" className={isDark ? 'bg-[#0A0113]' : 'bg-white'}>Aluno</option>
                                                <option value="moderator" className={isDark ? 'bg-[#0A0113]' : 'bg-white'}>Moderador</option>
                                            </select>
                                            {user.role === 'admin' && (
                                                <div className="mt-1 flex items-center gap-1 text-[8px] text-gray-500 font-bold uppercase pointer-events-none">
                                                    <Lock size={8} /> Admin Imutável
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <Calendar size={14} />
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                                    disabled={user.role === 'admin'}
                                                    className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-500' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                                                    title={user.role === 'admin' ? "Administradores só podem ser excluídos via Supabase" : "Excluir Usuário"}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <Users size={48} className="mx-auto mb-4 text-gray-600 opacity-20" />
                                            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Nenhum usuário encontrado.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !formLoading && setIsAddModalOpen(false)} />
                    <div className={`w-full max-w-md relative rounded-[2.5rem] p-8 border animate-in zoom-in duration-300 ${isDark ? 'bg-[#120222] border-white/10' : 'bg-white border-gray-100 shadow-2xl'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Criar Novo Usuário</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full" disabled={formLoading}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-2">
                                <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Nome Completo
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-[#B42AF0]/50' : 'bg-gray-50 border-gray-100 focus:border-[#B42AF0]/50'}`}
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    E-mail
                                </label>
                                <input
                                    required
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-[#B42AF0]/50' : 'bg-gray-50 border-gray-100 focus:border-[#B42AF0]/50'}`}
                                    placeholder="email@exemplo.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Senha Inicial
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        className={`w-full px-4 py-3 pr-11 rounded-xl border outline-none transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-[#B42AF0]/50' : 'bg-gray-50 border-gray-100 focus:border-[#B42AF0]/50'}`}
                                        placeholder="No mínimo 6 caracteres"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Cargo
                                </label>
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all appearance-none cursor-pointer ${isDark ? 'bg-white/5 border-white/10 focus:border-[#B42AF0]/50' : 'bg-gray-50 border-gray-100 focus:border-[#B42AF0]/50'}`}
                                >
                                    <option value="user">Aluno</option>
                                    <option value="moderator">Moderador</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            {formError && (
                                <p className="text-red-500 text-xs px-2">{formError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={formLoading}
                                className="w-full bg-[#B42AF0] hover:bg-[#A21FDC] py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus size={18} /> Criar Usuário</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
