'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Image, FileText, Upload, Save, Check, Loader2, Trash2, Eye, ScrollText, History, RotateCcw, ChevronDown, ChevronUp, Bold, Italic, Underline, List, Heading, Link2, AlignCenter, AlertCircle, Type } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import ReactMarkdown from 'react-markdown';

type SettingsTab = 'pdf' | 'terms' | 'general';

interface PdfSettings {
    logo_url: string;
    // Footers for all 15 tools
    footer_roteiro: string;
    footer_analise: string;
    footer_bio: string;
    footer_negociacao: string;
    footer_portfolio_analise: string;
    footer_portfolio_criacao: string;
    footer_marca_pessoal: string;
    footer_thecal: string;
    footer_radar: string;
    footer_abordagem_analise: string;
    footer_abordagem_objetiva: string;
    footer_abordagem_storytelling: string;
    footer_abordagem_influencer: string;
    footer_capcut: string;
    footer_analise_video: string;
    footer_ganchos: string;
    // Filenames for all tools
    filename_roteiro: string;
    filename_analise: string;
    filename_bio: string;
    filename_negociacao: string;
    filename_portfolio_analise: string;
    filename_portfolio_criacao: string;
    filename_marca_pessoal: string;
    filename_thecal: string;
    filename_radar: string;
    filename_abordagem_analise: string;
    filename_abordagem_objetiva: string;
    filename_abordagem_storytelling: string;
    filename_abordagem_influencer: string;
    filename_capcut: string;
    filename_analise_video: string;
    filename_ganchos: string;
}

const TOOL_FOOTER_FIELDS = [
    { key: 'roteiro', label: 'Gerador de Roteiro', color: '#6C5DD3' },
    { key: 'analise', label: 'Análise de Roteiro', color: '#8B7AD8' },
    { key: 'bio', label: 'Criação de Bio', color: '#E1306C' },
    { key: 'negociacao', label: 'Simulador de Vendas', color: '#10B981' },
    { key: 'portfolio_analise', label: 'Análise de Portfólio', color: '#D946A8' },
    { key: 'portfolio_criacao', label: 'Criador de Portfólio', color: '#C026D3' },
    { key: 'marca_pessoal', label: 'Marca Pessoal', color: '#A855F7' },
    { key: 'thecal', label: 'Método THECAL', color: '#7C3AED' },
    { key: 'radar', label: 'Radar de Oportunidade', color: '#10B981' },
    { key: 'abordagem_analise', label: 'Análise de Abordagem', color: '#059669' },
    { key: 'abordagem_objetiva', label: 'Abordagem Objetiva', color: '#14B8A6' },
    { key: 'abordagem_storytelling', label: 'Abordagem Storytelling', color: '#0D9488' },
    { key: 'abordagem_influencer', label: 'Abordagem Seu Influencer', color: '#047857' },
    { key: 'capcut', label: 'Sons Estratégicos', color: '#FF754C' },
    { key: 'analise_video', label: 'Análise de Vídeos', color: '#F97316' },
    { key: 'ganchos', label: 'Ideias de Ganchos', color: '#EAB308' },
];

const DEFAULT_SETTINGS: PdfSettings = {
    logo_url: '',
    footer_roteiro: 'Roteiro gerado pelo App Profissão do Futuro.',
    footer_analise: 'Análise gerada pelo App Profissão do Futuro.',
    footer_bio: 'Bio gerada pelo App Profissão do Futuro.',
    footer_negociacao: 'Simulação gerada pelo App Profissão do Futuro.',
    footer_portfolio_analise: 'Análise gerada pelo App Profissão do Futuro.',
    footer_portfolio_criacao: 'Portfólio gerado pelo App Profissão do Futuro.',
    footer_marca_pessoal: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_thecal: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_radar: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_abordagem_analise: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_abordagem_objetiva: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_abordagem_storytelling: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_abordagem_influencer: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_capcut: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_analise_video: 'Conteúdo gerado pelo App Profissão do Futuro.',
    footer_ganchos: 'Conteúdo gerado pelo App Profissão do Futuro.',
    filename_roteiro: 'roteiro',
    filename_analise: 'analise-roteiro',
    filename_bio: 'bio-instagram',
    filename_negociacao: 'simulacao-vendas',
    filename_portfolio_analise: 'analise-portfolio',
    filename_portfolio_criacao: 'portfolio',
    filename_marca_pessoal: 'marca-pessoal',
    filename_thecal: 'thecal',
    filename_radar: 'radar-oportunidade',
    filename_abordagem_analise: 'analise-abordagem',
    filename_abordagem_objetiva: 'abordagem-objetiva',
    filename_abordagem_storytelling: 'abordagem-storytelling',
    filename_abordagem_influencer: 'abordagem-influencer',
    filename_capcut: 'sons-estrategicos',
    filename_analise_video: 'analise-video',
    filename_ganchos: 'ideias-ganchos',
};

interface TermsVersion {
    id: string;
    version: number;
    text: string;
    created_at: string;
    created_by: string;
    is_active: boolean;
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingsTab>('pdf');
    const [settings, setSettings] = useState<PdfSettings>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Terms state
    const [termsText, setTermsText] = useState('');
    const [termsLoading, setTermsLoading] = useState(false);
    const [termsSaving, setTermsSaving] = useState(false);
    const [termsSaved, setTermsSaved] = useState(false);
    const [termsVersions, setTermsVersions] = useState<TermsVersion[]>([]);
    const [showVersions, setShowVersions] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const termsEditorRef = useRef<HTMLTextAreaElement>(null);

    // PDF sections collapse state
    const [showFooters, setShowFooters] = useState(true);
    const [showFilenames, setShowFilenames] = useState(false);

    useEffect(() => {
        if (!themeLoading) {
            if (!profile || profile.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            loadSettings();
        }
    }, [profile, themeLoading, router]);

    // Carrega termos APENAS na primeira vez também, para não perder edições ao trocar de aba interna
    useEffect(() => {
        if (activeTab === 'terms' && !termsText) {
            loadTerms();
        }
    }, [activeTab]);

    // Cache rascunhos em localStorage
    useEffect(() => {
        // Só salva o rascunho se não for o valor inicial vazio
        if (settings !== DEFAULT_SETTINGS) {
            localStorage.setItem('admin_pdf_settings_draft', JSON.stringify(settings));
        }
    }, [settings]);

    useEffect(() => {
        if (termsText) {
            localStorage.setItem('admin_terms_draft', termsText);
        }
    }, [termsText]);

    const loadSettings = async () => {
        try {
            const { data } = await supabase
                .from('platform_settings')
                .select('*')
                .eq('key', 'pdf_settings')
                .single();

            const draft = localStorage.getItem('admin_pdf_settings_draft');
            if (draft) {
                const parsedDraft = JSON.parse(draft);
                setSettings({ ...DEFAULT_SETTINGS, ...parsedDraft });
                if (parsedDraft.logo_url) setLogoPreview(parsedDraft.logo_url);
            } else if (data?.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                if (parsed.logo_url) setLogoPreview(parsed.logo_url);
            }
        } catch (error) {
            console.log('Using default settings');
        }
    };

    const loadTerms = async () => {
        setTermsLoading(true);
        try {
            const draft = localStorage.getItem('admin_terms_draft');
            if (draft) {
                setTermsText(draft);
            } else {
                const { data } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'terms_of_use')
                    .single();

                if (data?.value?.text) {
                    setTermsText(data.value.text);
                }
            }
        } catch (error) {
            console.log('No terms found, using empty');
        }
        setTermsLoading(false);
    };

    const loadTermsVersions = async () => {
        setLoadingVersions(true);
        try {
            const { data, error } = await supabase
                .from('terms_versions')
                .select('*')
                .order('version', { ascending: false })
                .limit(20);

            if (error) console.error("Error loading versions:", error);
            
            if (data) {
                setTermsVersions(data);
            } else {
                setTermsVersions([]);
            }
        } catch (error) {
            console.error('Exception loading versions:', error);
            setTermsVersions([]);
        }
        setLoadingVersions(false);
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
            localStorage.removeItem('admin_pdf_settings_draft');
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTerms = async () => {
        setTermsSaving(true);
        try {
            // 1. Save active terms
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'terms_of_use',
                    value: { text: termsText, updated_at: new Date().toISOString() }
                }, { onConflict: 'key' });

            if (error) throw error;

            // 2. Save version backup
            try {
                // Get current max version
                const { data: maxVer } = await supabase
                    .from('terms_versions')
                    .select('version')
                    .order('version', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const nextVersion = (maxVer?.version || 0) + 1;

                const { error: insertError } = await supabase.from('terms_versions').insert({
                    version: nextVersion,
                    text: termsText,
                    created_by: profile?.email || 'admin',
                    is_active: true,
                    created_at: new Date().toISOString()
                });
                
                if (insertError) console.error("Error inserting version:", insertError);

                // Mark previous versions as inactive
                const { error: updateError } = await supabase
                    .from('terms_versions')
                    .update({ is_active: false })
                    .neq('version', nextVersion);
                    
                if (updateError) console.error("Error updating old versions:", updateError);

                // Reload versions so the new one appears immediately
                loadTermsVersions();

                // 3. Reset terms_accepted_at for all users to force re-acceptance
                await supabase
                    .from('profiles')
                    .update({ terms_accepted_at: null })
                    .neq('role', 'admin');

                localStorage.removeItem('admin_terms_draft');

            } catch (versionError) {
                console.log('Could not save version (table might not exist):', versionError);
            }

            setTermsSaved(true);
            setTimeout(() => setTermsSaved(false), 3000);
        } catch (error) {
            console.error('Error saving terms:', error);
            alert('Erro ao salvar termos de uso.');
        } finally {
            setTermsSaving(false);
        }
    };

    const handleRevertVersion = async (version: TermsVersion) => {
        if (!confirm(`Reverter para a versão ${version.version}? Isso irá substituir os termos atuais.`)) return;

        setTermsText(version.text);
        setShowVersions(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
            alert('Erro ao fazer upload da logo.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveLogo = () => {
        setSettings(prev => ({ ...prev, logo_url: '' }));
        setLogoPreview('');
    };

    // BBCODE toolbar — inserts markdown formatting into the terms editor
    const insertFormatting = (before: string, after: string = '') => {
        const textarea = termsEditorRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = termsText.substring(start, end);
        const newText = termsText.substring(0, start) + before + selectedText + after + termsText.substring(end);

        setTermsText(newText);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            const newPos = start + before.length + selectedText.length + after.length;
            textarea.setSelectionRange(
                selectedText ? newPos : start + before.length,
                selectedText ? newPos : start + before.length
            );
        }, 0);
    };

    if (themeLoading || !profile) return null;

    const tabs = [
        { id: 'pdf' as SettingsTab, label: 'PDFs & Documentos', icon: <FileText size={18} />, description: 'Logomarca, rodapé e nome dos PDFs' },
        { id: 'terms' as SettingsTab, label: 'Termos de Uso', icon: <ScrollText size={18} />, description: 'Editar termos com formatação avançada' },
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
                        Config. Plataforma ⚙️
                    </h1>
                    <p className="text-lg opacity-90 leading-relaxed font-medium">
                        Personalize PDFs, termos de uso, logomarca e mensagens da plataforma.
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
                    {/* ==== PDF TAB ==== */}
                    {activeTab === 'pdf' && (
                        <div className="space-y-8">
                            {/* Logo Upload */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                    <Image size={20} className="inline mr-2 text-[#6C5DD3]" />
                                    Logomarca em PDFs
                                </h3>
                                <p className="text-sm text-gray-400 mb-6">
                                    Esta logo aparece no topo de todos os PDFs gerados pelas ferramentas.
                                </p>

                                <div className="flex flex-col md:flex-row items-start gap-8">
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

                                    <div className="flex-1 space-y-4">
                                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6C5DD3] text-white font-bold text-sm hover:bg-[#5B4EC2] transition-all disabled:opacity-50"
                                        >
                                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            {uploading ? 'Enviando...' : 'Enviar Nova Logo'}
                                        </button>

                                        {logoPreview && (
                                            <button onClick={handleRemoveLogo} className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 text-sm font-medium hover:bg-red-500/10 transition-all">
                                                <Trash2 size={14} /> Remover Logo
                                            </button>
                                        )}

                                        <div className="space-y-1">
                                            <p className="text-[11px] text-gray-400">• Formatos: PNG, JPG, SVG, WebP</p>
                                            <p className="text-[11px] text-gray-400">• Tamanho máximo: 2MB</p>
                                            <p className="text-[11px] text-gray-400">• Recomendado: fundo transparente, 200x60px</p>
                                        </div>

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

                            {/* Footer Messages — Collapsible */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <button onClick={() => setShowFooters(!showFooters)} className="w-full flex items-center justify-between mb-2">
                                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                        <FileText size={20} className="inline mr-2 text-[#6C5DD3]" />
                                        Mensagem do Rodapé (15 ferramentas)
                                    </h3>
                                    {showFooters ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>
                                <p className="text-sm text-gray-400 mb-4">Texto que aparece no final de cada PDF gerado.</p>

                                {showFooters && (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                        {TOOL_FOOTER_FIELDS.map(field => (
                                            <div key={field.key} className="space-y-2">
                                                <label className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: field.color }}></div>
                                                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {field.label}
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={(settings as any)[`footer_${field.key}`] || ''}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, [`footer_${field.key}`]: e.target.value }))}
                                                    className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} outline-none focus:ring-2 focus:ring-[#6C5DD3]/40`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filenames — Collapsible */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <button onClick={() => setShowFilenames(!showFilenames)} className="w-full flex items-center justify-between mb-2">
                                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                        <Type size={20} className="inline mr-2 text-[#6C5DD3]" />
                                        Nome dos Arquivos PDF (15 ferramentas)
                                    </h3>
                                    {showFilenames ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>
                                <p className="text-sm text-gray-400 mb-4">Nome que aparece ao baixar o PDF de cada ferramenta.</p>

                                {showFilenames && (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                        {TOOL_FOOTER_FIELDS.map(field => (
                                            <div key={field.key} className="space-y-2">
                                                <label className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: field.color }}></div>
                                                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {field.label}
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={(settings as any)[`filename_${field.key}`] || ''}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, [`filename_${field.key}`]: e.target.value }))}
                                                    placeholder={`Ex: ${field.key.replace(/_/g, '-')}`}
                                                    className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} outline-none focus:ring-2 focus:ring-[#6C5DD3]/40`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* PDF Preview */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                    <Eye size={20} className="inline mr-2 text-[#6C5DD3]" />
                                    Pré-visualização do PDF
                                </h3>
                                <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-lg mx-auto shadow-sm">
                                    <div className="flex justify-center mb-6 pb-4 border-b-2 border-gray-100">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="h-12 object-contain" />
                                        ) : (
                                            <div className="h-12 flex items-center text-gray-300 text-sm italic">Sem logo</div>
                                        )}
                                    </div>
                                    <div className="space-y-3 mb-8">
                                        <div className="h-4 bg-[#6C5DD3]/20 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                        <div className="h-3 bg-gray-100 rounded w-full"></div>
                                        <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-200 text-center">
                                        <p className="text-[11px] text-gray-400 font-semibold">
                                            {settings.footer_roteiro || 'Mensagem do rodapé aparece aqui.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==== TERMS TAB ==== */}
                    {activeTab === 'terms' && (
                        <div className="space-y-8">
                            {/* Terms Editor */}
                            <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                            <ScrollText size={20} className="inline mr-2 text-[#6C5DD3]" />
                                            Editor de Termos de Uso
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Use a barra de formatação para personalizar os termos. Formato Markdown.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                                showPreview
                                                    ? 'bg-[#6C5DD3] text-white'
                                                    : isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                        >
                                            <Eye size={14} />
                                            {showPreview ? 'Editando' : 'Pré-visualizar'}
                                        </button>
                                        <button
                                            onClick={() => { setShowVersions(!showVersions); if (!showVersions) loadTermsVersions(); }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                                        >
                                            <History size={14} />
                                            Versões
                                        </button>
                                    </div>
                                </div>

                                {/* BBCODE Formatting Toolbar */}
                                {!showPreview && (
                                    <div className={`flex flex-wrap gap-1 p-2 rounded-xl mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                        <button onClick={() => insertFormatting('# ')} title="Título H1" className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            <Heading size={16} />
                                        </button>
                                        <button onClick={() => insertFormatting('## ')} title="Subtítulo H2" className={`p-2 rounded-lg transition-all text-[11px] font-bold ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            H2
                                        </button>
                                        <button onClick={() => insertFormatting('### ')} title="H3" className={`p-2 rounded-lg transition-all text-[11px] font-bold ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            H3
                                        </button>
                                        <div className={`w-px h-6 self-center mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                        <button onClick={() => insertFormatting('**', '**')} title="Negrito" className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            <Bold size={16} />
                                        </button>
                                        <button onClick={() => insertFormatting('*', '*')} title="Itálico" className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            <Italic size={16} />
                                        </button>
                                        <button onClick={() => insertFormatting('<u>', '</u>')} title="Sublinhado" className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            <Underline size={16} />
                                        </button>
                                        <div className={`w-px h-6 self-center mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                        <button onClick={() => insertFormatting('\n- ')} title="Lista" className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            <List size={16} />
                                        </button>
                                        <button onClick={() => insertFormatting('\n1. ')} title="Lista numerada" className={`p-2 rounded-lg transition-all text-[11px] font-bold ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            1.
                                        </button>
                                        <button onClick={() => insertFormatting('[', '](url)')} title="Link" className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            <Link2 size={16} />
                                        </button>
                                        <div className={`w-px h-6 self-center mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                        <button onClick={() => insertFormatting('\n---\n')} title="Separador horizontal" className={`p-2 rounded-lg transition-all text-[11px] font-bold ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            ━━
                                        </button>
                                        <button onClick={() => insertFormatting('\n> ')} title="Citação" className={`p-2 rounded-lg transition-all text-[13px] font-bold ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            ❝
                                        </button>
                                        <button onClick={() => insertFormatting('~~', '~~')} title="Tachado" className={`p-2 rounded-lg transition-all text-[11px] font-bold line-through ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                                            abc
                                        </button>
                                    </div>
                                )}

                                {/* Editor / Preview */}
                                {termsLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#6C5DD3]" />
                                    </div>
                                ) : showPreview ? (
                                    <div className={`min-h-[400px] max-h-[600px] overflow-y-auto p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className={`prose max-w-none ${isDark ? 'prose-invert prose-p:text-gray-300' : 'prose-gray prose-p:text-gray-600'} prose-headings:font-bold prose-a:text-[#FF754C]`}>
                                            <ReactMarkdown>{termsText || '*(Nenhum conteúdo ainda)*'}</ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <textarea
                                        ref={termsEditorRef}
                                        value={termsText}
                                        onChange={(e) => setTermsText(e.target.value)}
                                        placeholder="# Termos de Uso&#10;&#10;Digite os termos de uso aqui usando formatação Markdown...&#10;&#10;## 1. Aceitação&#10;Ao acessar a plataforma, você concorda com..."
                                        rows={20}
                                        className={`w-full px-4 py-4 rounded-xl border text-sm font-mono leading-relaxed resize-y ${isDark
                                            ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                        } outline-none focus:ring-2 focus:ring-[#6C5DD3]/40`}
                                    />
                                )}

                                {/* Save Terms Button */}
                                <div className="flex items-center justify-between mt-6">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={14} className="text-amber-500" />
                                        <p className="text-xs text-gray-400">
                                            Ao salvar, todos os usuários serão obrigados a aceitar os novos termos.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSaveTerms}
                                        disabled={termsSaving}
                                        className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-md ${
                                            termsSaved
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                : 'bg-gradient-to-r from-[#6C5DD3] to-[#8B5CF6] text-white hover:scale-[1.02] shadow-[#6C5DD3]/20'
                                        } disabled:opacity-50`}
                                    >
                                        {termsSaving ? <Loader2 size={16} className="animate-spin" /> : termsSaved ? <Check size={16} /> : <Save size={16} />}
                                        {termsSaving ? 'Salvando...' : termsSaved ? 'Salvo!' : 'Salvar Termos'}
                                    </button>
                                </div>
                            </div>

                            {/* Version History */}
                            {showVersions && (
                                <div className={`p-8 rounded-[2.5rem] border ${isDark ? 'bg-[#1A1D1F] border-white/5' : 'bg-white border-gray-100'}`}>
                                    <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                        <History size={20} className="inline mr-2 text-[#6C5DD3]" />
                                        Histórico de Versões
                                    </h3>

                                    {loadingVersions ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#6C5DD3]" />
                                        </div>
                                    ) : termsVersions.length === 0 ? (
                                        <div className={`text-center py-10 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <History className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                                            <p className="text-sm font-bold opacity-80 mb-1">Nenhuma versão salva ainda.</p>
                                            <p className="text-xs text-gray-500">Salve seus termos de uso para registrar a primeira versão no histórico.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                            {termsVersions.map((version) => (
                                                <div key={version.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                                                    version.is_active
                                                        ? isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                                                        : isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                                                }`}>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                                Versão {version.version}
                                                            </span>
                                                            {version.is_active && (
                                                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                                    Ativa
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(version.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            {' · '}{version.created_by}
                                                        </p>
                                                    </div>
                                                    {!version.is_active && (
                                                        <button
                                                            onClick={() => handleRevertVersion(version)}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#6C5DD3] hover:bg-[#6C5DD3]/10 transition-all"
                                                        >
                                                            <RotateCcw size={14} />
                                                            Reverter
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ==== GENERAL TAB ==== */}
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

                    {/* Save Button (PDF tab) */}
                    {activeTab === 'pdf' && (
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
                                {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
                                {saving ? 'Salvando...' : saved ? 'Salvo com Sucesso!' : 'Salvar Configurações'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
