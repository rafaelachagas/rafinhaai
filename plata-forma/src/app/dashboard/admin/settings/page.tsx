'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Image, FileText, Upload, Save, Check, Loader2, Trash2, Eye } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';

type SettingsTab = 'pdf' | 'general';

interface PdfSettings {
    logo_url: string;
    footer_roteiro: string;
    footer_analise: string;
    footer_bio: string;
    footer_negociacao: string;
}

const DEFAULT_SETTINGS: PdfSettings = {
    logo_url: '/logo-original-si.png',
    footer_roteiro: 'Roteiro gerado pelo App Profissão do Futuro.',
    footer_analise: 'Análise gerada pelo App Profissão do Futuro.',
    footer_bio: 'Bio gerada pelo App Profissão do Futuro.',
    footer_negociacao: 'Simulação gerada pelo App Profissão do Futuro.',
};

export default function AdminSettingsPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingsTab>('pdf');
    const [settings, setSettings] = useState<PdfSettings>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string>('/logo-original-si.png');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!themeLoading) {
            if (!profile || profile.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            loadSettings();
        }
    }, [profile, themeLoading, router]);

    const loadSettings = async () => {
        try {
            const { data } = await supabase
                .from('platform_settings')
                .select('*')
                .eq('key', 'pdf_settings')
                .single();

            if (data?.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                if (parsed.logo_url) setLogoPreview(parsed.logo_url);
            }
        } catch (error) {
            // Table might not exist yet, use defaults
            console.log('Using default settings');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('platform_settings')
                .upsert({
                    key: 'pdf_settings',
                    value: settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações. A tabela platform_settings pode não existir ainda.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem (PNG, JPG, SVG).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `pdf-logo-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('assets')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;
            setSettings(prev => ({ ...prev, logo_url: publicUrl }));
            setLogoPreview(publicUrl);
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Erro ao fazer upload da logo. Verifique se o bucket "assets" existe no Supabase Storage.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveLogo = () => {
        setSettings(prev => ({ ...prev, logo_url: '' }));
        setLogoPreview('');
    };

    if (themeLoading || !profile) return null;

    const tabs = [
        { id: 'pdf' as SettingsTab, label: 'PDFs & Documentos', icon: <FileText size={18} />, description: 'Logomarca e rodapé dos PDFs gerados' },
        { id: 'general' as SettingsTab, label: 'Geral', icon: <Settings size={18} />, description: 'Configurações gerais da plataforma' },
    ];

    return (
        <div className={`flex-1 flex flex-col p-4 lg:p-8 max-w-[1600px] mx-auto w-full min-h-screen ${isDark ? 'bg-[#0F0F0F] text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
            <Header
                profile={profile}
                unreadCount={0}
                searchPlaceholder="Configurações..."
            />

            {/* Title Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] p-10 lg:p-14 text-white mb-10 shadow-2xl shadow-[#6C5DD3]/20">
                <div className="max-w-2xl space-y-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest">
                        <Settings size={12} />
                        Painel Admin
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                        Configurações ⚙️
                    </h1>
                    <p className="text-lg opacity-90 leading-relaxed font-medium">
                        Personalize os PDFs, logomarca e mensagens da sua plataforma.
                    </p>
                </div>
                <Settings className="absolute right-[-20px] top-[-20px] w-64 h-64 opacity-10 rotate-12" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tabs Sidebar */}
                <div className="lg:col-span-3 space-y-3">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left p-5 rounded-2xl border transition-all ${
                                activeTab === tab.id
                                    ? `${isDark ? 'bg-[#6C5DD3]/10 border-[#6C5DD3]/30' : 'bg-[#6C5DD3]/5 border-[#6C5DD3]/20'} shadow-lg`
                                    : `${isDark ? 'bg-[#1A1D1F] border-white/5 hover:bg-white/5' : 'bg-white border-gray-100 hover:bg-gray-50'}`
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <span className={activeTab === tab.id ? 'text-[#6C5DD3]' : 'text-gray-400'}>{tab.icon}</span>
                                <span className={`font-bold text-sm ${activeTab === tab.id ? (isDark ? 'text-white' : 'text-[#1B1D21]') : 'text-gray-400'}`}>{tab.label}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 ml-8">{tab.description}</p>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                    {activeTab === 'pdf' && (
                        <div className="space-y-8">
                            {/* Logo Upload */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                    <Image size={20} className="inline mr-2 text-[#6C5DD3]" />
                                    Logomarca em PDFs
                                </h3>
                                <p className="text-sm text-gray-400 mb-6">
                                    Esta logo aparece no topo de todos os PDFs gerados pelas ferramentas de IA (Roteiro, Análise, Bio, Simulação).
                                </p>

                                <div className="flex flex-col md:flex-row items-start gap-8">
                                    {/* Preview */}
                                    <div className={`w-full md:w-64 h-40 rounded-2xl border-2 border-dashed flex items-center justify-center ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo Preview" className="max-h-24 max-w-[200px] object-contain" />
                                        ) : (
                                            <div className="text-center">
                                                <Image size={32} className="mx-auto text-gray-300 mb-2" />
                                                <p className="text-xs text-gray-400">Sem logo</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Controls */}
                                    <div className="flex-1 space-y-4">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoUpload}
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6C5DD3] text-white font-bold text-sm hover:bg-[#5B4EC2] transition-all disabled:opacity-50"
                                        >
                                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            {uploading ? 'Enviando...' : 'Enviar Nova Logo'}
                                        </button>

                                        {logoPreview && (
                                            <button
                                                onClick={handleRemoveLogo}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 text-sm font-medium hover:bg-red-500/10 transition-all"
                                            >
                                                <Trash2 size={14} />
                                                Remover Logo
                                            </button>
                                        )}

                                        <div className="space-y-1">
                                            <p className="text-[11px] text-gray-400">• Formatos: PNG, JPG, SVG, WebP</p>
                                            <p className="text-[11px] text-gray-400">• Tamanho máximo: 2MB</p>
                                            <p className="text-[11px] text-gray-400">• Recomendado: fundo transparente, 200x60px</p>
                                        </div>

                                        {/* Manual URL input */}
                                        <div className="space-y-2">
                                            <label className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Ou cole a URL da imagem
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.logo_url}
                                                onChange={(e) => {
                                                    setSettings(prev => ({ ...prev, logo_url: e.target.value }));
                                                    setLogoPreview(e.target.value);
                                                }}
                                                placeholder="/logo-original-si.png"
                                                className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} outline-none focus:ring-2 focus:ring-[#6C5DD3]/40`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Messages */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                    <FileText size={20} className="inline mr-2 text-[#6C5DD3]" />
                                    Mensagem do Rodapé
                                </h3>
                                <p className="text-sm text-gray-400 mb-6">
                                    Texto que aparece no final de cada PDF gerado. Personalize por ferramenta.
                                </p>

                                <div className="space-y-5">
                                    {[
                                        { key: 'footer_roteiro', label: 'Gerador de Roteiro', color: '#6C5DD3' },
                                        { key: 'footer_analise', label: 'Análise de Roteiro', color: '#FF754C' },
                                        { key: 'footer_bio', label: 'Gerador de Bio', color: '#E1306C' },
                                        { key: 'footer_negociacao', label: 'Simulador de Vendas', color: '#10B981' },
                                    ].map(field => (
                                        <div key={field.key} className="space-y-2">
                                            <label className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: field.color }}></div>
                                                <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {field.label}
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={settings[field.key as keyof PdfSettings]}
                                                onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} outline-none focus:ring-2 focus:ring-[#6C5DD3]/40`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PDF Preview */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                    <Eye size={20} className="inline mr-2 text-[#6C5DD3]" />
                                    Pré-visualização do PDF
                                </h3>
                                <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-lg mx-auto shadow-sm">
                                    {/* Logo */}
                                    <div className="flex justify-center mb-6 pb-4 border-b-2 border-gray-100">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="h-12 object-contain" />
                                        ) : (
                                            <div className="h-12 flex items-center text-gray-300 text-sm italic">Sem logo</div>
                                        )}
                                    </div>
                                    {/* Content Placeholder */}
                                    <div className="space-y-3 mb-8">
                                        <div className="h-4 bg-[#6C5DD3]/20 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                                    </div>
                                    {/* Footer */}
                                    <div className="pt-4 border-t border-gray-200 text-center">
                                        <p className="text-[11px] text-gray-400 font-semibold">
                                            {settings.footer_roteiro || 'Mensagem do rodapé aparece aqui.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                <Settings size={20} className="inline mr-2 text-[#6C5DD3]" />
                                Configurações Gerais
                            </h3>
                            <p className="text-sm text-gray-400">
                                Em breve: Nome da plataforma, cores, e-mail de suporte, e mais.
                            </p>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl ${
                                saved
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                    : 'bg-gradient-to-r from-[#6C5DD3] to-[#8B5CF6] text-white hover:scale-[1.02] shadow-[#6C5DD3]/20'
                            } disabled:opacity-50`}
                        >
                            {saving ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : saved ? (
                                <Check size={18} />
                            ) : (
                                <Save size={18} />
                            )}
                            {saving ? 'Salvando...' : saved ? 'Salvo com Sucesso!' : 'Salvar Configurações'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
