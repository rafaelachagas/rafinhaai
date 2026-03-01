'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import {
    Plus, Edit2, Trash2, Lock, Unlock, ChevronDown, ChevronRight,
    BookOpen, Play, Eye, EyeOff, GripVertical, Upload, X, Clock, Check,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
    Undo, Redo, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import { bbcodeToHtml, htmlToBbcode } from '@/utils/bbcode';

interface Course {
    id: string;
    title: string;
    description: string;
    is_active: boolean;
    order_index: number;
    modules?: Module[];
}

interface Module {
    id: string;
    course_id: string;
    title: string;
    description: string;
    cover_image_url?: string;
    horizontal_cover_url?: string;
    preview_video_url?: string;
    is_locked: boolean;
    order_index: number;
    genres?: string;
    traits?: string;
    cast_list?: string;
    lessons?: Lesson[];
}

interface Lesson {
    id: string;
    module_id: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    video_url: string;
    duration_minutes: number;
    is_published: boolean;
    order_index: number;
}

export default function AdminCoursesPage() {
    const router = useRouter();
    const { profile, loading: themeLoading, isDark } = useTheme();
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    function getVideoEmbedUrl(url: string, isPreview: boolean = false) {
        if (!url) return '';

        // YouTube
        const ytIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
        if (ytIdMatch && ytIdMatch[1]) {
            const ytId = ytIdMatch[1];
            let embedUrl = `https://www.youtube.com/embed/${ytId}`;
            if (isPreview) {
                // Aggressive muting: mute=1 AND volume=0
                embedUrl += `?autoplay=1&mute=1&volume=0&controls=0&loop=1&playlist=${ytId}&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`;
            } else {
                embedUrl += `?autoplay=1`;
            }
            return embedUrl;
        }

        // Hotmart
        if (url.includes('hotmart.com/')) {
            let embedUrl = url;
            const connector = embedUrl.includes('?') ? '&' : '?';
            if (isPreview) {
                // background=1 is often used for silent autoplay, muted=true/1 for silence
                embedUrl += `${connector}autoplay=1&muted=true&muted=1&mute=1&volume=0&background=1&controls=0&title=0&hidelogo=1&start=25`;
            } else {
                embedUrl += `${connector}autoplay=1`;
            }
            return embedUrl;
        }

        return url;
    }

    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    // Modal states
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!themeLoading) {
            if (!profile) {
                router.push('/login');
            } else if (profile.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchCourses();
                setLoading(false);
            }
        }
    }, [profile, themeLoading, router]);

    async function fetchCourses() {
        const { data: coursesData, error } = await supabase
            .from('courses')
            .select(`
                *,
                modules (
                    *,
                    lessons (*)
                )
            `)
            .order('order_index')
            .order('order_index', { foreignTable: 'modules' })
            .order('order_index', { foreignTable: 'modules.lessons' });

        if (error) {
            console.error('Error fetching courses:', error);
            return;
        }

        setCourses(coursesData || []);
    }

    function toggleCourse(courseId: string) {
        setExpandedCourses(prev => {
            const next = new Set(prev);
            if (next.has(courseId)) next.delete(courseId);
            else next.add(courseId);
            return next;
        });
    }

    function toggleModule(moduleId: string) {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    }

    async function deleteCourse(id: string) {
        setConfirmDialog({
            isOpen: true,
            title: 'Excluir Curso',
            message: 'Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita e removerá todos os módulos e aulas associados.',
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('courses').delete().eq('id', id);
                if (error) {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Erro ao excluir',
                        message: 'Não foi possível excluir o curso. Verifique se ele possui módulos vinculados ou tente novamente.',
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
                        type: 'info'
                    });
                } else {
                    fetchCourses();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    }

    async function deleteModule(id: string) {
        setConfirmDialog({
            isOpen: true,
            title: 'Excluir Módulo',
            message: 'Tem certeza que deseja excluir este módulo? Esta ação não pode ser desfeita e removerá todas as aulas associadas.',
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('modules').delete().eq('id', id);
                if (error) {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Erro ao excluir',
                        message: 'Erro ao excluir módulo: ' + error.message,
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
                        type: 'info'
                    });
                } else {
                    fetchCourses();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    }

    async function deleteLesson(id: string) {
        setConfirmDialog({
            isOpen: true,
            title: 'Excluir Aula',
            message: 'Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.',
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('lessons').delete().eq('id', id);
                if (error) {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Erro ao excluir',
                        message: 'Erro ao excluir aula: ' + error.message,
                        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
                        type: 'info'
                    });
                } else {
                    fetchCourses();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    }

    async function toggleModuleLock(module: Module) {
        const { error } = await supabase
            .from('modules')
            .update({ is_locked: !module.is_locked })
            .eq('id', module.id);

        if (error) {
            setConfirmDialog({
                isOpen: true,
                title: 'Erro',
                message: 'Erro ao atualizar módulo: ' + error.message,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
                type: 'info'
            });
            return;
        }
        fetchCourses();
    }

    async function handleReorderModules(courseId: string, reorderedModules: Module[]) {
        if (isReordering) return;
        setIsReordering(true);

        // Update local state first for immediate UI feedback
        setCourses(prev => prev.map(c => {
            if (c.id === courseId) {
                return { ...c, modules: reorderedModules };
            }
            return c;
        }));

        // Update each module's order_index in Supabase
        try {
            const updates = reorderedModules.map((m, index) =>
                supabase
                    .from('modules')
                    .update({ order_index: index })
                    .eq('id', m.id)
            );

            const results = await Promise.all(updates);
            const firstError = results.find(r => r.error)?.error;

            if (firstError) throw firstError;
        } catch (error: any) {
            console.error('Error reordering modules:', error);
            setConfirmDialog({
                isOpen: true,
                title: 'Erro de Reordenação',
                message: 'Erro ao reordenar módulos: ' + error.message,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
                type: 'info'
            });
            fetchCourses();
        } finally {
            setIsReordering(false);
        }
    }

    async function handleReorderCourses(reorderedCourses: Course[]) {
        if (isReordering) return;
        setIsReordering(true);

        // Update local state first
        setCourses(reorderedCourses);

        // Update each course's order_index in Supabase
        try {
            const updates = reorderedCourses.map((c, index) =>
                supabase
                    .from('courses')
                    .update({ order_index: index })
                    .eq('id', c.id)
            );

            const results = await Promise.all(updates);
            const firstError = results.find(r => r.error)?.error;

            if (firstError) throw firstError;
        } catch (error: any) {
            console.error('Error reordering courses:', error);
            setConfirmDialog({
                isOpen: true,
                title: 'Erro de Reordenação',
                message: 'Erro ao reordenar cursos: ' + error.message,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
                type: 'info'
            });
            fetchCourses();
        } finally {
            setIsReordering(false);
        }
    }

    async function handleReorderLessons(moduleId: string, reorderedLessons: Lesson[]) {
        if (isReordering) return;
        setIsReordering(true);

        // Update local state first
        setCourses(prev => prev.map(c => {
            return {
                ...c,
                modules: c.modules?.map(m => {
                    if (m.id === moduleId) {
                        return { ...m, lessons: reorderedLessons };
                    }
                    return m;
                })
            };
        }));

        // Update each lesson's order_index in Supabase
        try {
            const updates = reorderedLessons.map((l, index) =>
                supabase
                    .from('lessons')
                    .update({ order_index: index })
                    .eq('id', l.id)
            );

            const results = await Promise.all(updates);
            const firstError = results.find(r => r.error)?.error;

            if (firstError) throw firstError;
        } catch (error: any) {
            console.error('Error reordering lessons:', error);
            setConfirmDialog({
                isOpen: true,
                title: 'Erro de Reordenação',
                message: 'Erro ao reordenar aulas: ' + error.message,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
                type: 'info'
            });
            fetchCourses();
        } finally {
            setIsReordering(false);
        }
    }

    async function toggleLessonPublish(lesson: Lesson) {
        const { error } = await supabase
            .from('lessons')
            .update({ is_published: !lesson.is_published })
            .eq('id', lesson.id);

        if (error) {
            setConfirmDialog({
                isOpen: true,
                title: 'Erro',
                message: 'Erro ao atualizar aula: ' + error.message,
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
                type: 'info'
            });
            return;
        }
        fetchCourses();
    }

    if (loading || themeLoading) return null;

    const safeDark = mounted && isDark;

    return (
        <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto w-full">
            <main className="flex-1 p-4 lg:p-8 flex flex-col gap-8 w-full min-w-0 pt-20 lg:pt-8">
                <Header profile={profile} unreadCount={0} />

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl lg:text-4xl font-black tracking-tight ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                            Gerenciar Cursos
                        </h1>
                        <p className="text-gray-500">Crie e organize cursos, módulos e aulas</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCourse(null);
                            setShowCourseModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-[#6C5DD3]/20 transition-all w-full sm:w-auto"
                    >
                        <Plus size={18} />
                        Novo Curso
                    </button>
                </div>

                {/* Courses List */}
                <div className="space-y-8">
                    {courses.length === 0 ? (
                        <div className={`${safeDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border p-12 text-center`}>
                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className={`text-xl font-bold mb-2 ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                Nenhum curso criado
                            </h3>
                            <p className="text-gray-500 mb-6">Comece criando seu primeiro curso</p>
                            <button
                                onClick={() => setShowCourseModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] text-white rounded-2xl font-bold text-sm inline-flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Criar Primeiro Curso
                            </button>
                        </div>
                    ) : (
                        courses.map((course) => (
                            <div
                                key={course.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('courseId', course.id);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const draggedId = e.dataTransfer.getData('courseId');
                                    if (!draggedId || draggedId === course.id) return;
                                    const reordered = [...courses];
                                    const draggedIndex = reordered.findIndex(c => c.id === draggedId);
                                    const targetIndex = reordered.findIndex(c => c.id === course.id);
                                    const [removed] = reordered.splice(draggedIndex, 1);
                                    reordered.splice(targetIndex, 0, removed);
                                    handleReorderCourses(reordered);
                                }}
                            >
                                <CourseCard
                                    course={course}
                                    safeDark={safeDark}
                                    expanded={expandedCourses.has(course.id)}
                                    onToggle={() => toggleCourse(course.id)}
                                    onEdit={() => {
                                        setEditingCourse(course);
                                        setShowCourseModal(true);
                                    }}
                                    onDelete={() => deleteCourse(course.id)}
                                    onAddModule={() => {
                                        setSelectedCourseId(course.id);
                                        setEditingModule(null);
                                        setShowModuleModal(true);
                                    }}
                                    expandedModules={expandedModules}
                                    onToggleModule={toggleModule}
                                    onEditModule={(module: Module) => {
                                        setEditingModule(module);
                                        setShowModuleModal(true);
                                    }}
                                    onDeleteModule={deleteModule}
                                    onToggleModuleLock={toggleModuleLock}
                                    onAddLesson={(moduleId: string) => {
                                        setSelectedModuleId(moduleId);
                                        setEditingLesson(null);
                                        setShowLessonModal(true);
                                    }}
                                    onEditLesson={(lesson: Lesson) => {
                                        setEditingLesson(lesson);
                                        setShowLessonModal(true);
                                    }}
                                    onDeleteLesson={deleteLesson}
                                    onToggleLessonPublish={toggleLessonPublish}
                                    onReorderModules={handleReorderModules}
                                    onReorderLessons={handleReorderLessons}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* Modals */}
                {showCourseModal && (
                    <CourseModal
                        safeDark={safeDark}
                        course={editingCourse}
                        onClose={() => setShowCourseModal(false)}
                        onSave={() => {
                            setShowCourseModal(false);
                            fetchCourses();
                        }}
                        setConfirmDialog={setConfirmDialog}
                    />
                )}

                {showModuleModal && (
                    <ModuleModal
                        safeDark={safeDark}
                        module={editingModule}
                        courseId={selectedCourseId}
                        onClose={() => setShowModuleModal(false)}
                        onSave={() => {
                            setShowModuleModal(false);
                            fetchCourses();
                        }}
                        getVideoEmbedUrl={getVideoEmbedUrl}
                        setConfirmDialog={setConfirmDialog}
                    />
                )}

                {showLessonModal && (
                    <LessonModal
                        safeDark={safeDark}
                        lesson={editingLesson}
                        moduleId={selectedModuleId}
                        onClose={() => setShowLessonModal(false)}
                        onSave={() => {
                            setShowLessonModal(false);
                            fetchCourses();
                        }}
                        getVideoEmbedUrl={getVideoEmbedUrl}
                        setConfirmDialog={setConfirmDialog}
                        nextOrderIndex={
                            courses
                                .flatMap(c => c.modules || [])
                                .find(m => m.id === selectedModuleId)
                                ?.lessons?.length || 0
                        }
                    />
                )}

                {confirmDialog.isOpen && (
                    <ConfirmationModal
                        safeDark={safeDark}
                        title={confirmDialog.title}
                        message={confirmDialog.message}
                        onConfirm={confirmDialog.onConfirm}
                        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                        type={confirmDialog.type}
                    />
                )}
            </main>
        </div>
    );
}

// CourseCard Component
function CourseCard({ course, safeDark, expanded, onToggle, onEdit, onDelete, onAddModule, expandedModules, onToggleModule, onEditModule, onDeleteModule, onToggleModuleLock, onAddLesson, onEditLesson, onDeleteLesson, onToggleLessonPublish, onReorderModules, onReorderLessons }: any) {
    const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
    const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, moduleId: string) => {
        setDraggedModuleId(moduleId);
        e.dataTransfer.setData('moduleId', moduleId);
    };

    const handleLessonDragStart = (e: React.DragEvent, lessonId: string, moduleId: string) => {
        setDraggedLessonId(lessonId);
        e.dataTransfer.setData('lessonId', lessonId);
        e.dataTransfer.setData('fromModuleId', moduleId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetModuleId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('moduleId') || draggedModuleId;
        if (!draggedId || draggedId === targetModuleId) return;

        const modules = [...(course.modules || [])];
        const draggedIndex = modules.findIndex(m => m.id === draggedId);
        const targetIndex = modules.findIndex(m => m.id === targetModuleId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = modules.splice(draggedIndex, 1);
        modules.splice(targetIndex, 0, removed);

        onReorderModules(course.id, modules);
        setDraggedModuleId(null);
    };

    const handleLessonDrop = (e: React.DragEvent, targetLessonId: string, moduleId: string) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('lessonId') || draggedLessonId;
        const fromModuleId = e.dataTransfer.getData('fromModuleId');

        if (!draggedId || fromModuleId !== moduleId || draggedId === targetLessonId) return;

        const module = course.modules?.find((m: any) => m.id === moduleId);
        if (!module || !module.lessons) return;

        const lessons = [...module.lessons];
        const draggedIndex = lessons.findIndex(l => l.id === draggedId);
        const targetIndex = lessons.findIndex(l => l.id === targetLessonId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = lessons.splice(draggedIndex, 1);
        lessons.splice(targetIndex, 0, removed);

        onReorderLessons(moduleId, lessons);
        setDraggedLessonId(null);
    };

    return (
        <div
            onClick={onToggle}
            className={`${safeDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border p-6 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] group/card`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-1 text-gray-300 cursor-grab active:cursor-grabbing">
                            <GripVertical size={20} />
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggle(); }}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <h3 className={`text-xl font-bold ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                            {course.title}
                        </h3>
                        {!course.is_active && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">
                                Inativo
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm ml-9">{(course.description || '').slice(0, 200)}</p>
                    <div className="flex items-center gap-2 mt-3 ml-9 text-sm text-gray-400">
                        <BookOpen size={16} />
                        <span>{course.modules?.length || 0} módulos</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddModule(); }}
                        className="p-2 hover:bg-[#6C5DD3]/10 text-[#6C5DD3] rounded-xl transition-all"
                        title="Adicionar Módulo"
                    >
                        <Plus size={20} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500"
                        title="Editar Curso"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                        title="Deletar Curso"
                    >
                        <Trash2 size={20} />
                    </button>
                    <ChevronDown
                        size={24}
                        className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Modules */}
            {expanded && course.modules && course.modules.length > 0 && (
                <div className="mt-6 ml-9 space-y-6">
                    {course.modules.map((module: Module) => (
                        <ModuleCard
                            key={module.id}
                            module={module}
                            safeDark={safeDark}
                            expanded={expandedModules.has(module.id)}
                            onToggle={() => onToggleModule(module.id)}
                            onEdit={() => onEditModule(module)}
                            onDelete={() => onDeleteModule(module.id)}
                            onToggleLock={onToggleModuleLock}
                            onAddLesson={() => onAddLesson(module.id)}
                            onEditLesson={onEditLesson}
                            onDeleteLesson={onDeleteLesson}
                            onToggleLessonPublish={onToggleLessonPublish}
                            draggable
                            onDragStart={(e: React.DragEvent) => handleDragStart(e, module.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e: React.DragEvent) => handleDrop(e, module.id)}
                            isDragging={draggedModuleId === module.id}
                            onLessonDragStart={handleLessonDragStart}
                            onLessonDrop={handleLessonDrop}
                            draggedLessonId={draggedLessonId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ModuleCard Component
function ModuleCard({
    module, safeDark, expanded, onToggle, onEdit, onDelete, onToggleLock,
    onAddLesson, onEditLesson, onDeleteLesson, onToggleLessonPublish,
    draggable, onDragStart, onDragOver, onDrop, isDragging,
    onLessonDragStart, onLessonDrop, draggedLessonId
}: any) {
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`${safeDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] group/card ${isDragging ? 'opacity-50 scale-[0.98] border-dashed border-[#6C5DD3]' : ''}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <GripVertical size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            <h4 className={`font-bold ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                                {module.title}
                            </h4>
                            {module.is_locked && (
                                <Lock size={14} className="text-gray-400" />
                            )}
                        </div>
                        <p className="text-gray-500 text-sm ml-9">{(module.description || '').slice(0, 200)}</p>
                        <div className="flex items-center gap-2 mt-2 ml-9 text-xs text-gray-400">
                            <Play size={14} />
                            <span>{module.lessons?.length || 0} aulas</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddLesson(); }}
                        className="p-2 hover:bg-[#6C5DD3]/10 text-[#6C5DD3] rounded-xl transition-all"
                        title="Adicionar Aula"
                    >
                        <Plus size={18} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500"
                        title={module.is_locked ? 'Desbloquear Módulo' : 'Bloquear Módulo'}
                    >
                        {module.is_locked ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500"
                        title="Editar Módulo"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                        title="Deletar Módulo"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Lessons */}
            {expanded && module.lessons && module.lessons.length > 0 && (
                <div className="mt-4 ml-12 space-y-2">
                    {module.lessons.map((lesson: Lesson) => (
                        <div
                            key={lesson.id}
                            draggable
                            onDragStart={(e) => onLessonDragStart(e, lesson.id, module.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => onLessonDrop(e, lesson.id, module.id)}
                            onClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                            className={`${safeDark ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100'} p-5 rounded-xl border flex items-center justify-between group transition-all cursor-pointer hover:shadow-md active:scale-[0.99] ${draggedLessonId === lesson.id ? 'opacity-50 scale-[0.98] border-dashed border-[#6C5DD3]' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-gray-300 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={16} />
                                </div>
                                <Play size={14} className="text-gray-400" />
                                <span className={`font-medium ${safeDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {lesson.title}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${safeDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                                    {lesson.duration_minutes || 0} min
                                </span>
                                {!lesson.is_published && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">
                                        Rascunho
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggleLessonPublish(lesson); }}
                                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all"
                                    title={lesson.is_published ? "Despublicar" : "Publicar"}
                                >
                                    {lesson.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEditLesson(lesson); }}
                                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson.id); }}
                                    className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// LessonCard Component
function LessonCard({ lesson, safeDark, onEdit, onDelete, onTogglePublish }: any) {
    return (
        <div className={`${safeDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} rounded-xl border p-5 flex items-center justify-between`}>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <Play size={14} className="text-gray-400" />
                    <span className={`font-medium text-sm ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        {lesson.title}
                    </span>
                    {!lesson.is_published && (
                        <span className="px-2 py-0.5 bg-yellow-100 rounded-full text-[10px] font-bold text-yellow-600">
                            Rascunho
                        </span>
                    )}
                </div>
                <span className="text-xs text-gray-400 ml-5">{lesson.duration_minutes || 0} min</span>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onTogglePublish}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                    title={lesson.is_published ? 'Despublicar' : 'Publicar'}
                >
                    {lesson.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                    onClick={onEdit}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-500"
                    title="Editar"
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                    title="Deletar"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

// Course Modal Component
function CourseModal({ safeDark, course, onClose, onSave, setConfirmDialog }: any) {
    const [title, setTitle] = useState(course?.title || '');
    const [description, setDescription] = useState(course?.description || '');
    const [isActive, setIsActive] = useState(course?.is_active ?? true);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!title.trim()) {
            setConfirmDialog({
                isOpen: true,
                title: 'Campo Obrigatório',
                message: 'Por favor, preencha o título do curso',
                onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                type: 'info'
            });
            return;
        }

        setSaving(true);

        const finalDescription = description.slice(0, 200);

        if (course) {
            // Update
            const { error } = await supabase
                .from('courses')
                .update({ title, description: finalDescription, is_active: isActive })
                .eq('id', course.id);

            if (error) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Erro',
                    message: 'Erro ao atualizar curso: ' + error.message,
                    onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                    type: 'info'
                });
                setSaving(false);
                return;
            }
        } else {
            // Create
            const { error } = await supabase
                .from('courses')
                .insert({ title, description: finalDescription, is_active: isActive });

            if (error) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Erro',
                    message: 'Erro ao criar curso: ' + error.message,
                    onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                    type: 'info'
                });
                setSaving(false);
                return;
            }
        }

        setSaving(false);
        onSave();
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${safeDark ? 'bg-[#1B1D21] border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border p-8 max-w-2xl w-full relative`}>
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                    <X size={24} />
                </button>
                <h2 className={`text-2xl font-bold mb-6 ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                    {course ? 'Editar Curso' : 'Novo Curso'}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none`}
                            placeholder="Nome do curso"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                            rows={4}
                            maxLength={200}
                            className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none resize-y min-h-[100px]`}
                            placeholder="Descrição do curso"
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-[10px] ${description.length >= 200 ? 'text-red-500' : 'text-gray-400'}`}>
                                {description.length}/200
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-500">
                            Curso ativo (visível para alunos)
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] text-white rounded-xl font-bold text-sm hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Module Modal Component
function ModuleModal({ safeDark, module, courseId, onClose, onSave, getVideoEmbedUrl, setConfirmDialog }: any) {
    const [title, setTitle] = useState(module?.title || '');
    const [description, setDescription] = useState(module?.description || '');
    const [coverImageUrl, setCoverImageUrl] = useState(module?.cover_image_url || '');
    const [horizontalCoverUrl, setHorizontalCoverUrl] = useState(module?.horizontal_cover_url || '');
    const [previewVideoUrl, setPreviewVideoUrl] = useState(module?.preview_video_url || '');
    const [castList, setCastList] = useState(module?.cast_list || '');
    const [genres, setGenres] = useState(module?.genres || '');
    const [traits, setTraits] = useState(module?.traits || '');
    const [isLocked, setIsLocked] = useState(module?.is_locked ?? false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingHorizontal, setUploadingHorizontal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const horizontalFileInputRef = useRef<HTMLInputElement>(null);

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, isHorizontal: boolean) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (isHorizontal) setUploadingHorizontal(true);
        else setUploading(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('course-assets')
            .upload(filePath, file);

        if (uploadError) {
            setConfirmDialog({
                isOpen: true,
                title: 'Erro de Upload',
                message: 'Erro ao fazer upload: ' + uploadError.message,
                onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                type: 'info'
            });
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('course-assets')
                .getPublicUrl(filePath);

            if (isHorizontal) setHorizontalCoverUrl(publicUrl);
            else setCoverImageUrl(publicUrl);
        }

        if (isHorizontal) setUploadingHorizontal(false);
        else setUploading(false);
    }

    async function handleSave() {
        if (!title.trim()) {
            setConfirmDialog({
                isOpen: true,
                title: 'Campo Obrigatório',
                message: 'Por favor, preencha o título do módulo',
                onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                type: 'info'
            });
            return;
        }

        setSaving(true);

        const finalDescription = (description || '').slice(0, 200);

        const data = {
            title,
            description: finalDescription,
            cover_image_url: coverImageUrl,
            horizontal_cover_url: horizontalCoverUrl,
            preview_video_url: previewVideoUrl,
            cast_list: castList,
            genres,
            traits,
            is_locked: isLocked
        };

        if (module) {
            const { error } = await supabase
                .from('modules')
                .update(data)
                .eq('id', module.id);

            if (error) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Erro',
                    message: 'Erro ao atualizar módulo: ' + error.message,
                    onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                    type: 'info'
                });
                setSaving(false);
                return;
            }
        } else {
            const { error } = await supabase
                .from('modules')
                .insert({ ...data, course_id: courseId });

            if (error) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Erro',
                    message: 'Erro ao criar módulo: ' + error.message,
                    onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                    type: 'info'
                });
                setSaving(false);
                return;
            }
        }

        setSaving(false);
        onSave();
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${safeDark ? 'bg-[#1B1D21] border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative`}>
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                    <X size={24} />
                </button>
                <h2 className={`text-2xl font-bold mb-6 ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                    {module ? 'Editar Módulo' : 'Novo Módulo'}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none`}
                            placeholder="Nome do módulo"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                            maxLength={200}
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none resize-y min-h-[100px]`}
                            placeholder="Breve descrição do que será ensinado"
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-[10px] ${description.length >= 200 ? 'text-red-500' : 'text-gray-400'}`}>
                                {description.length}/200
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Elenco (Cast)</label>
                        <input
                            type="text"
                            value={castList}
                            onChange={(e) => setCastList(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none`}
                            placeholder="ex: João Silva, Maria Oliveira"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Gêneros (separados por vírgula)</label>
                        <input
                            type="text"
                            value={genres}
                            onChange={(e) => setGenres(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none`}
                            placeholder="ex: Suspense, Drama, Ação"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2">Características (Traits)</label>
                        <input
                            type="text"
                            value={traits}
                            onChange={(e) => setTraits(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none`}
                            placeholder="ex: Empolgantes, Inspirador"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-500">Capa Vertical (Pôster)</label>
                            <span className="text-[10px] text-gray-400 font-medium">Recomendado: 642x900</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={coverImageUrl}
                                    onChange={(e) => setCoverImageUrl(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none`}
                                    placeholder="URL da imagem vertical..."
                                />
                                {coverImageUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setCoverImageUrl('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, false)}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-4 py-3 bg-[#6C5DD3]/10 text-[#6C5DD3] rounded-xl hover:bg-[#6C5DD3]/20 transition-colors flex items-center gap-2 font-bold text-sm min-w-[120px] justify-center"
                            >
                                {uploading ? (
                                    <div className="w-4 h-4 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-500">Capa Horizontal (Netflix)</label>
                            <span className="text-[10px] text-gray-400 font-medium">Recomendado: 1280x720 (16:9)</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={horizontalCoverUrl}
                                    onChange={(e) => setHorizontalCoverUrl(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none`}
                                    placeholder="URL da imagem horizontal..."
                                />
                                {horizontalCoverUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setHorizontalCoverUrl('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <input
                                ref={horizontalFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, true)}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => horizontalFileInputRef.current?.click()}
                                disabled={uploadingHorizontal}
                                className="px-4 py-3 bg-[#6C5DD3]/10 text-[#6C5DD3] rounded-xl hover:bg-[#6C5DD3]/20 transition-colors flex items-center gap-2 font-bold text-sm min-w-[120px] justify-center"
                            >
                                {uploadingHorizontal ? (
                                    <div className="w-4 h-4 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-500">URL do Vídeo de Preview (YouTube/Hotmart)</label>
                            <span className="text-[10px] text-gray-400 font-medium">Recomendado: 16:9</span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={previewVideoUrl}
                                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                                className={`w-full px-4 py-3 rounded-xl border ${safeDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#6C5DD3]/20 outline-none`}
                                placeholder="Link do vídeo (YouTube ou Hotmart embed)"
                            />
                            {previewVideoUrl && (
                                <button
                                    type="button"
                                    onClick={() => setPreviewVideoUrl('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {previewVideoUrl && (
                        <div className="aspect-video w-full rounded-[2rem] overflow-hidden bg-black border border-white/10">
                            <iframe
                                src={getVideoEmbedUrl(previewVideoUrl, true)}
                                className="w-full h-full"
                                allow="autoplay"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isLocked"
                            checked={isLocked}
                            onChange={(e) => setIsLocked(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300"
                        />
                        <label htmlFor="isLocked" className="text-sm font-medium text-gray-500">
                            Módulo bloqueado (requer conclusão de módulos anteriores)
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className={`flex-1 px-6 py-3 border rounded-xl font-bold text-sm transition-colors ${safeDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] text-white rounded-xl font-bold text-sm hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Confirmation Modal Component
function ConfirmationModal({ safeDark, title, message, onConfirm, onCancel, type = 'danger' }: any) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className={`${safeDark ? 'bg-[#1B1D21] border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200`}>
                <h3 className={`text-xl font-bold mb-4 ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                    {title}
                </h3>
                <p className={`mb-8 ${safeDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {message}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${safeDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {type === 'info' ? 'Entendi' : 'Cancelar'}
                    </button>
                    {type !== 'info' && (
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 px-6 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                        >
                            Confirmar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Toolbar Button Component
function ToolbarButton({ onClick, icon, title, safeDark, disabled = false }: any) {
    const handlePointerDown = (e: React.PointerEvent) => {
        // Prevent focus loss from editor
        e.preventDefault();
        if (!disabled && onClick) {
            onClick();
        }
    };

    return (
        <button
            type="button"
            onPointerDown={handlePointerDown}
            disabled={disabled}
            className={`p-1.5 rounded transition-all flex items-center justify-center ${disabled
                ? 'opacity-30 cursor-not-allowed'
                : safeDark
                    ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                }`}
            title={title}
        >
            {icon}
        </button>
    );
}

// Lesson Modal Component
function LessonModal({ safeDark, lesson, moduleId, onClose, onSave, setConfirmDialog, nextOrderIndex }: any) {
    const [title, setTitle] = useState(lesson?.title || '');
    const [description, setDescription] = useState(lesson?.description || '');
    const [thumbnailUrl, setThumbnailUrl] = useState(lesson?.thumbnail_url || '');
    const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
    const [durationMinutes, setDurationMinutes] = useState(lesson?.duration_minutes || '');
    const [isPublished, setIsPublished] = useState(lesson?.is_published ?? false);
    const [attachments, setAttachments] = useState<any[]>(lesson?.attachments || []);
    const [uploading, setUploading] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize editor content once to avoid reset on re-renders
    useEffect(() => {
        if (editorRef.current && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = bbcodeToHtml(lesson?.content || '');
        }
    }, [lesson?.content]);

    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
    const bbcodeFileInputRef = useRef<HTMLInputElement>(null);
    const [bbcodeTag, setBbcodeTag] = useState('');

    async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingThumbnail(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `lesson-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('course-assets')
            .upload(filePath, file);

        if (uploadError) {
            setConfirmDialog({
                isOpen: true,
                title: 'Erro de Upload',
                message: 'Erro ao fazer upload: ' + uploadError.message,
                onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                type: 'info'
            });
        } else {
            const { data: { publicUrl } } = supabase.storage
                .from('course-assets')
                .getPublicUrl(filePath);

            setThumbnailUrl(publicUrl);
        }

        setUploadingThumbnail(false);
    }

    async function handleFileUpload(file: File, isBBCode: boolean = false) {
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `lessons/${moduleId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('course-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('course-assets')
                .getPublicUrl(filePath);

            if (isBBCode) {
                const tag = bbcodeTag;
                const editor = editorRef.current;
                if (!editor) return;

                editor.focus();
                if (tag === 'img') {
                    document.execCommand('insertImage', false, publicUrl);
                } else if (tag === 'pdf') {
                    const html = `<div contenteditable="false" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-weight: bold; color: #ef4444; margin: 10px 0;">[Arquivo PDF Anexado: ${file.name}]</div>`;
                    document.execCommand('insertHTML', false, html);
                }
            } else {
                const newAttachment = {
                    id: Math.random().toString(36).substring(7),
                    name: file.name,
                    url: publicUrl,
                    type: file.type.includes('pdf') ? 'pdf' : 'image',
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
                };
                setAttachments(prev => [...prev, newAttachment]);
            }
        } catch (error: any) {
            console.error('Erro no upload:', error);
            alert('Falha ao fazer upload do arquivo.');
        } finally {
            setUploading(false);
        }
    }

    function applyFormatting(command: string, value: string = '') {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();

        // Ensure standard tags instead of spans with styles
        // @ts-ignore - document.execCommand types can be picky
        document.execCommand('styleWithCSS', false, false);

        if (command === 'img' || command === 'pdf') {
            setBbcodeTag(command);
            bbcodeFileInputRef.current?.click();
            return;
        }

        if (command === 'url') {
            const url = prompt('Digite a URL:');
            if (url) document.execCommand('createLink', false, url);
        } else if (command === 'list') {
            document.execCommand('insertUnorderedList', false);
        } else if (command === 'orderedList') {
            document.execCommand('insertOrderedList', false);
        } else if (command === 'left' || command === 'center' || command === 'right') {
            document.execCommand(`justify${command.charAt(0).toUpperCase() + command.slice(1)}`, false);
        } else if (command === 'b') {
            document.execCommand('bold', false);
        } else if (command === 'i') {
            document.execCommand('italic', false);
        } else if (command === 'u') {
            document.execCommand('underline', false);
        } else {
            document.execCommand(command, false, value);
        }

    }

    async function handleSave() {
        if (!title.trim()) {
            setConfirmDialog({
                isOpen: true,
                title: 'Campo Obrigatório',
                message: 'Por favor, preencha o título da aula',
                onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                type: 'info'
            });
            return;
        }

        // Ensure description is limited to 200 chars on save
        const finalDescription = (description || '').slice(0, 200);

        setSaving(true);

        const data = {
            title,
            description: finalDescription,
            thumbnail_url: thumbnailUrl,
            content: htmlToBbcode(editorRef.current?.innerHTML || ''),
            attachments,
            video_url: videoUrl,
            duration_minutes: durationMinutes ? parseInt(durationMinutes as string) : null,
            is_published: isPublished
        };

        if (lesson) {
            const { error } = await supabase
                .from('lessons')
                .update(data)
                .eq('id', lesson.id);

            if (error) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Erro',
                    message: 'Erro ao atualizar aula: ' + error.message,
                    onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                    type: 'info'
                });
                setSaving(false);
                return;
            }
        } else {
            const { error } = await supabase
                .from('lessons')
                .insert({ ...data, module_id: moduleId, order_index: nextOrderIndex });

            if (error) {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Erro',
                    message: 'Erro ao criar aula: ' + error.message,
                    onConfirm: () => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false })),
                    type: 'info'
                });
                setSaving(false);
                return;
            }
        }

        setSaving(false);
        onSave();
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${safeDark ? 'bg-[#1B1D21] border-white/10' : 'bg-white border-gray-100'} rounded-[2rem] border max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden shadow-2xl shadow-black/40 animate-in zoom-in-95 duration-200`}>
                {/* Fixed Header */}
                <div className={`p-8 pb-4 flex items-center justify-between border-b ${safeDark ? 'border-white/5' : 'border-gray-50'}`}>
                    <h2 className={`text-2xl font-black ${safeDark ? 'text-white' : 'text-[#1B1D21]'}`}>
                        {lesson ? 'Editar Aula' : 'Nova Aula'}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all ${safeDark ? 'hover:bg-white/5 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className={`flex-1 overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar-lesson`}>
                    <style jsx>{`
                        .custom-scrollbar-lesson::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar-lesson::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar-lesson::-webkit-scrollbar-thumb {
                            background: ${safeDark ? '#3F3F46' : '#E4E4E7'};
                            border-radius: 10px;
                        }
                        .custom-scrollbar-lesson::-webkit-scrollbar-thumb:hover {
                            background: ${safeDark ? '#52525B' : '#D4D4D8'};
                        }
                        
                        /* Editor List Styles - Matching Student View (Prose) */
                        .editor-content ul {
                            list-style-type: disc !important;
                            padding-left: 1.5rem !important;
                            margin-top: 1.25rem !important;
                            margin-bottom: 1.25rem !important;
                        }
                        .editor-content ol {
                            list-style-type: decimal !important;
                            padding-left: 1.5rem !important;
                            margin-top: 1.25rem !important;
                            margin-bottom: 1.25rem !important;
                        }
                        .editor-content li {
                            display: list-item !important;
                            margin-bottom: 0.5rem !important;
                            padding-left: 0.375rem !important;
                        }
                        .editor-content ul li::marker {
                            color: #6C5DD3 !important;
                        }
                        .editor-content ol li::marker {
                            color: #6C5DD3 !important;
                        }
                        .editor-content strong, .editor-content b {
                            color: ${safeDark ? '#FFFFFF' : '#111827'} !important;
                            font-weight: 700 !important;
                        }
                    `}</style>
                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`w-full px-5 py-4 rounded-2xl border transition-all ${safeDark ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-[#6C5DD3]/50' : 'bg-white border-gray-200 focus:border-[#6C5DD3]'} outline-none focus:ring-4 focus:ring-[#6C5DD3]/10`}
                                placeholder="Nome da aula"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                                maxLength={200}
                                rows={2}
                                className={`w-full px-5 py-4 rounded-2xl border transition-all ${safeDark ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-[#6C5DD3]/50' : 'bg-white border-gray-200 focus:border-[#6C5DD3]'} outline-none focus:ring-4 focus:ring-[#6C5DD3]/10 resize-none min-h-[100px]`}
                                placeholder="Descrição curta (exibida no painel de seleção)"
                            />
                            <div className="flex justify-end mt-2">
                                <span className={`text-[10px] font-bold tracking-wider ${description.length >= 200 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {description.length} / 200
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Lesson Cover Upload */}
                    <div className="pt-6 border-t border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Capa da Aula</label>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">PNG, JPEG ou GIF</span>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    className={`w-full px-5 py-4 rounded-2xl border transition-all ${safeDark ? 'bg-white/5 border-white/10 text-white focus:bg-white/10' : 'bg-white border-gray-200 focus:border-[#6C5DD3]'} outline-none focus:ring-4 focus:ring-[#6C5DD3]/10`}
                                    placeholder="URL da imagem..."
                                />
                                {thumbnailUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setThumbnailUrl('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <input
                                ref={thumbnailFileInputRef}
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/gif"
                                onChange={handleThumbnailUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => thumbnailFileInputRef.current?.click()}
                                disabled={uploadingThumbnail}
                                className={`px-6 py-4 ${safeDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-2xl transition-all flex items-center gap-3 font-bold text-sm min-w-[140px] justify-center border ${safeDark ? 'border-white/5' : 'border-gray-200'}`}
                            >
                                {uploadingThumbnail ? (
                                    <div className="w-5 h-5 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                        {thumbnailUrl && (
                            <div className="mt-4 relative aspect-video w-full max-w-[320px] rounded-2xl overflow-hidden border-2 border-[#6C5DD3]/20 shadow-xl shadow-black/20">
                                <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="pt-6 border-t border-white/5">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Conteúdo (BBCode)</label>
                        <div className={`rounded-2xl border ${safeDark ? 'border-white/10 bg-[#0F0F0F]' : 'border-gray-200 bg-white'} overflow-hidden shadow-xl`}>
                            <div className={`flex flex-wrap items-center gap-1 p-3 border-b ${safeDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-1 px-1 border-r border-gray-200 dark:border-white/10 mr-1">
                                    <ToolbarButton onClick={() => applyFormatting('b')} icon={<Bold size={18} />} title="Negrito" safeDark={safeDark} />
                                    <ToolbarButton onClick={() => applyFormatting('i')} icon={<Italic size={18} />} title="Itálico" safeDark={safeDark} />
                                    <ToolbarButton onClick={() => applyFormatting('u')} icon={<Underline size={18} />} title="Sublinhado" safeDark={safeDark} />
                                </div>
                                <div className="flex items-center gap-1 px-1 border-r border-gray-200 dark:border-white/10 mr-1">
                                    <ToolbarButton onClick={() => applyFormatting('left')} icon={<AlignLeft size={18} />} title="Esquerda" safeDark={safeDark} />
                                    <ToolbarButton onClick={() => applyFormatting('center')} icon={<AlignCenter size={18} />} title="Centro" safeDark={safeDark} />
                                    <ToolbarButton onClick={() => applyFormatting('right')} icon={<AlignRight size={18} />} title="Direita" safeDark={safeDark} />
                                </div>
                                <div className="flex items-center gap-1 px-1 border-r border-gray-200 dark:border-white/10 mr-1">
                                    <ToolbarButton onClick={() => applyFormatting('list')} icon={<List size={18} />} title="Lista com Marcadores" safeDark={safeDark} />
                                    <ToolbarButton onClick={() => applyFormatting('orderedList')} icon={<ListOrdered size={18} />} title="Lista Numerada" safeDark={safeDark} />
                                </div>
                                <div className="flex items-center gap-1 px-1 border-r border-gray-200 dark:border-white/10 mr-1">
                                    <ToolbarButton onClick={() => applyFormatting('url')} icon={<LinkIcon size={18} />} title="Link" safeDark={safeDark} />
                                    <ToolbarButton onClick={() => applyFormatting('img')} icon={<ImageIcon size={18} />} title="Imagem" safeDark={safeDark} />
                                    <ToolbarButton onClick={() => applyFormatting('pdf')} icon={<span className="text-[10px] font-bold text-red-500">PDF</span>} title="Anexar PDF" safeDark={safeDark} />
                                </div>
                                <div className="flex items-center gap-1 px-1">
                                    <ToolbarButton onClick={() => { }} icon={<Undo size={18} className="opacity-20" />} title="Desfazer" safeDark={safeDark} disabled />
                                    <ToolbarButton onClick={() => { }} icon={<Redo size={18} className="opacity-20" />} title="Refazer" safeDark={safeDark} disabled />
                                </div>
                            </div>
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onFocus={() => {
                                    document.execCommand('defaultParagraphSeparator', false, 'div');
                                }}
                                className={`w-full px-12 py-10 bg-transparent outline-none resize-y min-h-[450px] text-lg leading-relaxed editor-content ${safeDark ? 'text-gray-300' : 'text-gray-700'} focus:ring-0`}
                                style={{
                                    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
                                    wordBreak: 'break-word'
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Este conteúdo será exibido de forma estruturada para o aluno.</p>
                    </div>

                    {/* Materiais Extras Section */}
                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className={`text-xs font-bold uppercase tracking-widest ${safeDark ? 'text-gray-400' : 'text-gray-500'}`}>Materiais Extras</h3>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Arquivos para download</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${safeDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-[#6C5DD3]/10 hover:bg-[#6C5DD3]/20 text-[#6C5DD3]'
                                    }`}
                            >
                                {uploading ? 'Enviando...' : <><Upload size={14} /> Adicionar Arquivo</>}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file);
                                }}
                            />
                            {/* Hidden BBCode File Input */}
                            <input
                                type="file"
                                ref={bbcodeFileInputRef}
                                className="hidden"
                                accept={bbcodeTag === 'img' ? 'image/*' : 'application/pdf'}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, true);
                                }}
                            />
                        </div>

                        {attachments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {attachments.map((file: any) => (
                                    <div
                                        key={file.id}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${safeDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-100 hover:border-[#6C5DD3]/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${file.type === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {file.type === 'pdf' ? <BookOpen size={20} /> : <ImageIcon size={20} />}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${safeDark ? 'text-white' : 'text-gray-700'} truncate max-w-[250px]`}>
                                                    {file.name}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{file.size}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`p-2 rounded-xl transition-all ${safeDark ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-[#6C5DD3]'}`}
                                                title="Ver arquivo"
                                            >
                                                <Eye size={18} />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setAttachments(prev => prev.filter(a => a.id !== file.id))}
                                                className={`p-2 rounded-xl transition-all text-red-400 hover:bg-red-500/10 hover:text-red-500`}
                                                title="Remover"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`text-center py-10 rounded-2xl border-2 border-dashed ${safeDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'
                                }`}>
                                <div className="w-12 h-12 rounded-2xl bg-gray-500/10 flex items-center justify-center mx-auto mb-3">
                                    <BookOpen className="text-gray-500/40" size={24} />
                                </div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nenhum material de apoio</p>
                            </div>
                        )}
                    </div>

                    {/* Technical Info Section */}
                    <div className="pt-6 border-t border-white/5 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">URL do Vídeo</label>
                            <div className="relative">
                                <Play className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="url"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    className={`w-full pl-12 pr-5 py-4 rounded-2xl border transition-all ${safeDark ? 'bg-white/5 border-white/10 text-white focus:bg-white/10' : 'bg-white border-gray-200 focus:border-[#6C5DD3]'} outline-none focus:ring-4 focus:ring-[#6C5DD3]/10`}
                                    placeholder="https://youtube.com/watch?v=..."
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Duração (minutos)</label>
                                <div className="relative">
                                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="number"
                                        value={durationMinutes}
                                        onChange={(e) => setDurationMinutes(e.target.value)}
                                        className={`w-full pl-12 pr-5 py-4 rounded-2xl border transition-all ${safeDark ? 'bg-white/5 border-white/10 text-white focus:bg-white/10' : 'bg-white border-gray-200 focus:border-[#6C5DD3]'} outline-none focus:ring-4 focus:ring-[#6C5DD3]/10`}
                                        placeholder="30"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 flex items-end">
                                <div
                                    onClick={() => setIsPublished(!isPublished)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isPublished
                                        ? (safeDark ? 'bg-[#6C5DD3]/10 border-[#6C5DD3]/50 text-[#6C5DD3]' : 'bg-[#6C5DD3]/5 border-[#6C5DD3] text-[#6C5DD3]')
                                        : (safeDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white border-gray-200 text-gray-400')
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isPublished
                                        ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white'
                                        : 'border-current'
                                        }`}>
                                        {isPublished && <Check size={14} strokeWidth={4} />}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {isPublished ? 'Publicada' : 'Rascunho'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className={`p-8 lg:px-12 py-6 border-t ${safeDark ? 'bg-[#1B1D21] border-white/5' : 'bg-gray-50 border-gray-100'} flex gap-4`}>
                    <button
                        onClick={onClose}
                        className={`flex-1 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border transition-all ${safeDark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300'}`}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-[#6C5DD3] to-[#8E82E3] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl hover:shadow-[#6C5DD3]/40 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Salvar Aula'}
                    </button>
                </div>
            </div>
        </div>
    );
}
