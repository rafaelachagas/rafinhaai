'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle2, Check, Play, ChevronRight, Clock } from 'lucide-react';

interface Lesson {
    id: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    video_url: string;
    content: string;
    duration_minutes: number;
    is_published: boolean;
    module_id: string;
}

interface Module {
    id: string;
    title: string;
    course_id: string;
    lessons?: Lesson[];
}

interface Progress {
    lesson_id: string;
    completed: boolean;
}

export default function LessonPage() {
    const router = useRouter();
    const params = useParams();
    const { profile, loading: themeLoading } = useTheme();
    const [loading, setLoading] = useState(true);
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [module, setModule] = useState<Module | null>(null);
    const [allLessons, setAllLessons] = useState<Lesson[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);

    const lessonId = params.lessonId as string;

    useEffect(() => {
        // Force dark mode for immersive experience
        document.documentElement.style.backgroundColor = '#000000';
        document.body.style.backgroundColor = '#000000';

        return () => {
            // Cleanup on unmount
            document.documentElement.style.backgroundColor = '';
            document.body.style.backgroundColor = '';
        };
    }, []);

    useEffect(() => {
        if (!themeLoading && profile) {
            fetchLessonData();
        } else if (!themeLoading && !profile) {
            const checkSession = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) router.push('/login');
            };
            checkSession();
        }
    }, [profile, themeLoading, lessonId]);

    async function fetchLessonData() {
        if (!profile?.id || !lessonId) return;

        // Fetch lesson
        const { data: lessonData, error: lessonError } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();

        if (lessonError || !lessonData) {
            console.error('Error fetching lesson:', lessonError);
            router.push('/dashboard/courses');
            return;
        }

        setLesson(lessonData);

        // Fetch module with all lessons
        const { data: moduleData, error: moduleError } = await supabase
            .from('modules')
            .select(`
                *,
                lessons (*)
            `)
            .eq('id', lessonData.module_id)
            .single();

        if (moduleError || !moduleData) {
            console.error('Error fetching module:', moduleError);
            return;
        }

        setModule(moduleData);
        setAllLessons(moduleData.lessons?.filter((l: Lesson) => l.is_published).sort((a: any, b: any) => a.order_index - b.order_index) || []);

        // Fetch user progress
        const { data: progressData } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id, completed')
            .eq('user_id', profile.id);

        setProgress(progressData || []);
        setLoading(false);
    }

    async function markAsCompleted() {
        if (!profile?.id || !lessonId) return;

        const { error } = await supabase
            .from('user_lesson_progress')
            .upsert({
                user_id: profile.id,
                lesson_id: lessonId,
                completed: true,
                completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,lesson_id' });

        if (error) {
            console.error('Error marking lesson as completed:', error);
            return;
        }

        // Refresh progress
        fetchLessonData();
    }

    function getYouTubeEmbedUrl(url: string) {
        if (!url) return '';

        // Handle different YouTube URL formats
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
        if (videoIdMatch && videoIdMatch[1]) {
            return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
        }

        return url;
    }

    function goToNextLesson() {
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        if (currentIndex < allLessons.length - 1) {
            router.push(`/watch/${allLessons[currentIndex + 1].id}`);
        }
    }

    if (loading || themeLoading || !lesson) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Carregando...</div>
            </div>
        );
    }

    const isCompleted = progress.some(p => p.lesson_id === lessonId && p.completed);
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    const hasNextLesson = currentIndex < allLessons.length - 1;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Back Button - Floating */}
            <button
                onClick={() => router.push('/dashboard/courses')}
                className="fixed top-6 left-6 z-50 flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Voltar</span>
            </button>

            {/* Video Player - Full Width */}
            <div className="w-full bg-black">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-16 pb-6">
                    {/* Lesson Info - Refined Header */}
                    <div className="mb-6">
                        <p className="text-xs text-[#6C5DD3] mb-1 uppercase tracking-wider font-semibold opacity-70">{module?.title}</p>
                        <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                            {lesson.title}
                        </h1>
                    </div>

                    <div className="aspect-video bg-black shadow-2xl rounded-xl overflow-hidden border border-white/5">
                        {lesson.video_url ? (
                            <iframe
                                src={getYouTubeEmbedUrl(lesson.video_url)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <Play size={64} className="mx-auto mb-4 text-white/30" />
                                    <p className="text-white/50">Vídeo não disponível</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Below Video */}
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pb-12">
                {/* Action Buttons - Now above content */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {!isCompleted ? (
                        <button
                            onClick={markAsCompleted}
                            className="px-6 py-3 bg-white text-black font-bold rounded-md hover:bg-gray-200 transition-all flex items-center gap-2"
                        >
                            <CheckCircle2 size={20} />
                            Marcar como Concluída
                        </button>
                    ) : (
                        <div className="px-6 py-3 bg-green-600 text-white font-bold rounded-md flex items-center gap-2">
                            <CheckCircle2 size={20} />
                            Aula Concluída
                        </div>
                    )}
                    {hasNextLesson && (
                        <button
                            onClick={goToNextLesson}
                            className="px-6 py-3 bg-[#2a2a2a] text-white font-bold rounded-md hover:bg-[#3a3a3a] transition-all flex items-center gap-2"
                        >
                            Próxima Aula
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>

                {/* Lesson Description - Now below buttons */}
                {lesson.description && (
                    <div className="mb-10 max-w-4xl">
                        <p className="text-gray-300 text-lg leading-relaxed">
                            {lesson.description}
                        </p>
                    </div>
                )}


                {/* Main Content Box (Content + Extras) */}
                {lesson.content && (
                    <div className="mb-12 bg-[#0F0F0F] rounded-xl p-8 border border-white/5 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-[#6C5DD3] rounded-full"></div>
                            Sobre esta aula
                        </h3>
                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {lesson.content}
                        </p>
                    </div>
                )}

                {/* Episodes List */}
                <div className="bg-[#181818] rounded-xl p-8 border border-white/5 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">Aulas do Módulo</h3>
                    <div className="space-y-3">
                        {allLessons.map((l, index) => {
                            const lessonCompleted = progress.some(p => p.lesson_id === l.id && p.completed);
                            const isCurrent = l.id === lessonId;

                            return (
                                <div
                                    key={l.id}
                                    onClick={() => router.push(`/watch/${l.id}`)}
                                    className={`flex items-start gap-6 p-4 rounded-xl transition-all cursor-pointer group ${isCurrent
                                        ? 'bg-white/5 border border-white/10 ring-1 ring-white/10'
                                        : 'hover:bg-white/[0.02] border border-transparent'
                                        }`}
                                >
                                    {/* Lesson Number */}
                                    <div className="flex-shrink-0 w-6 pt-1 text-center font-bold text-lg text-white/40">
                                        {index + 1}
                                    </div>

                                    {/* Thumbnail Placeholder */}
                                    <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 group-hover:border-[#6C5DD3]/50 transition-colors">
                                        {l.thumbnail_url ? (
                                            <img src={l.thumbnail_url} alt={l.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Play size={20} className={`${isCurrent ? 'text-[#6C5DD3]' : 'text-white/20'} group-hover:scale-110 transition-transform`} fill={isCurrent ? 'currentColor' : 'none'} />
                                            </div>
                                        )}
                                        {l.thumbnail_url && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                <Play size={20} className="text-white fill-white" />
                                            </div>
                                        )}
                                        {lessonCompleted && (
                                            <div className="absolute top-1 right-1 bg-green-600 rounded-full p-0.5">
                                                <Check size={10} className="text-white" strokeWidth={4} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Lesson Info */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <h4 className={`font-bold text-lg truncate ${isCurrent ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                                {l.title}
                                            </h4>
                                            {l.duration_minutes && (
                                                <span className="flex-shrink-0 text-white/40 text-xs font-medium flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {l.duration_minutes}min
                                                </span>
                                            )}
                                        </div>
                                        {l.description && (
                                            <p className="text-white/40 text-sm line-clamp-2 leading-relaxed">
                                                {l.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
