'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, CheckCircle2, Check, Play, ChevronRight, Clock, ThumbsUp, Download, FileText, Image as ImageIcon, BookOpen, Upload } from 'lucide-react';
import { bbcodeToHtml } from '@/utils/bbcode';
import VideoPlayer from '@/components/VideoPlayer';

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
    attachments?: any[];
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
    last_watched_position?: number;
    updated_at?: string;
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
    const [likedLessons, setLikedLessons] = useState<string[]>([]);

    const lessonId = params.lessonId as string;

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

        const { data: moduleData, error: moduleError } = await supabase
            .from('modules')
            .select(`*, lessons (*)`)
            .eq('id', lessonData.module_id)
            .order('order_index', { foreignTable: 'lessons' })
            .single();

        if (moduleError || !moduleData) {
            console.error('Error fetching module:', moduleError);
            return;
        }

        setModule(moduleData);
        setAllLessons(
            moduleData.lessons
                ?.filter((l: Lesson) => l.is_published)
                .sort((a: any, b: any) => a.order_index - b.order_index) || []
        );

        const { data: progressData } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id, completed, last_watched_position')
            .eq('user_id', profile.id);

        setProgress(progressData || []);

        // Fetch likes
        const { data: likesData } = await supabase
            .from('lesson_likes')
            .select('lesson_id')
            .eq('user_id', profile.id);

        setLikedLessons(likesData?.map((l: any) => l.lesson_id) || []);

        setLoading(false);

        // Auto-track: Create a record if it doesn't exist
        if (profile?.id && lessonId && !progressData?.some(p => p.lesson_id === lessonId)) {
            await supabase
                .from('user_lesson_progress')
                .upsert({
                    user_id: profile.id,
                    lesson_id: lessonId,
                    completed: false
                }, { onConflict: 'user_id,lesson_id' });
        }
    }

    async function handleVideoProgress(seconds: number) {
        if (!profile?.id || !lessonId) return;

        // Update progress in Supabase periodically (debounced or throttled)
        // For simplicity, we can do it here, but ideally we throttle it.
        // Let's do it every ~10% of the video or just periodically.
        if (Math.floor(seconds) % 5 === 0) { // Every 5 seconds
            await supabase
                .from('user_lesson_progress')
                .upsert({
                    user_id: profile.id,
                    lesson_id: lessonId,
                    last_watched_position: seconds
                }, { onConflict: 'user_id,lesson_id' });
        }
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

        fetchLessonData();
    }

    function getYouTubeEmbedUrl(url: string) {
        if (!url) return '';
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
        if (videoIdMatch && videoIdMatch[1]) {
            return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
        }
        return url;
    }

    function goToNextLesson() {
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        if (currentIndex < allLessons.length - 1) {
            router.push(`/dashboard/watch/${allLessons[currentIndex + 1].id}`);
        }
    }

    function goToPreviousLesson() {
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        if (currentIndex > 0) {
            router.push(`/dashboard/watch/${allLessons[currentIndex - 1].id}`);
        }
    }

    async function toggleLike() {
        if (!profile?.id || !lessonId) return;
        const isLiked = likedLessons.includes(lessonId);

        if (isLiked) {
            await supabase.from('lesson_likes').delete().eq('user_id', profile.id).eq('lesson_id', lessonId);
            setLikedLessons(prev => prev.filter(id => id !== lessonId));
        } else {
            await supabase.from('lesson_likes').insert({ user_id: profile.id, lesson_id: lessonId });
            setLikedLessons(prev => [...prev, lessonId]);
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
    const hasPreviousLesson = currentIndex > 0;
    const hasNextLesson = currentIndex < allLessons.length - 1;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Back Button - Floating */}
            <button
                onClick={() => router.push('/dashboard/courses')}
                className="fixed top-20 lg:top-6 left-4 lg:left-24 z-50 flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Voltar</span>
            </button>

            {/* Video Player - Full Width */}
            <div className="w-full bg-black">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-12 pt-20 lg:pt-16 pb-6">
                    {/* Lesson Info - Refined Header */}
                    <div className={lesson.video_url?.trim() ? "mb-6" : "mb-12 pt-12"}>
                        <p className="text-xs text-[#6C5DD3] mb-1 uppercase tracking-wider font-semibold opacity-70">{module?.title}</p>
                        <h1 className={`${lesson.video_url?.trim() ? "text-xl lg:text-2xl" : "text-3xl lg:text-5xl"} font-bold text-white tracking-tight`}>
                            {lesson.title}
                        </h1>
                    </div>

                    {lesson.video_url?.trim() && (
                        <div className="aspect-video bg-black shadow-2xl rounded-xl overflow-hidden border border-white/5">
                            <VideoPlayer
                                videoUrl={lesson.video_url}
                                initialPosition={progress.find(p => p.lesson_id === lessonId)?.last_watched_position || 0}
                                onProgress={handleVideoProgress}
                                onComplete={markAsCompleted}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Content Below Video */}
            <div className="max-w-[1600px] mx-auto px-4 lg:px-12 pb-12">
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
                    {hasPreviousLesson && (
                        <button
                            onClick={goToPreviousLesson}
                            className="px-6 py-3 bg-[#2a2a2a] text-white font-bold rounded-md hover:bg-[#3a3a3a] transition-all flex items-center gap-2"
                        >
                            <ArrowLeft size={20} />
                            Aula Anterior
                        </button>
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
                    <button
                        onClick={toggleLike}
                        className={`px-4 py-3 border-2 ${likedLessons.includes(lessonId) ? 'border-white bg-white/20' : 'border-white/20 hover:border-white'} rounded-md transition-all flex items-center gap-2`}
                    >
                        <ThumbsUp size={20} className={likedLessons.includes(lessonId) ? 'fill-white' : ''} />
                    </button>
                </div>

                {/* Lesson Description - Now below buttons */}
                {lesson.description && (
                    <div className="mb-10 max-w-4xl">
                        <div
                            className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: bbcodeToHtml(lesson.description) }}
                        />
                    </div>
                )}


                {/* Main Content Box (Content + Extras) */}
                {(lesson.content || (lesson.attachments && lesson.attachments.length > 0)) && (
                    <div className="mb-12 bg-[#0F0F0F] rounded-xl p-8 border border-white/5 shadow-xl">
                        {lesson.content && (
                            <div className="mb-0">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-[#6C5DD3] rounded-full"></div>
                                    Conteúdo da Aula
                                </h3>
                                <div
                                    className="mb-0 text-gray-300 leading-relaxed prose prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: bbcodeToHtml(lesson.content) }}
                                />
                            </div>
                        )}

                        {lesson.content && lesson.attachments && lesson.attachments.length > 0 && (
                            <hr className="my-10 border-white/5" />
                        )}

                        {lesson.attachments && lesson.attachments.length > 0 && (
                            <div className="mb-0">
                                <h4 className="text-lg font-bold text-white mb-6">
                                    Materiais Extras
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {lesson.attachments.map((file: any) => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[#6C5DD3]/10 text-[#6C5DD3] rounded-lg">
                                                    {file.type === 'pdf' ? <BookOpen size={20} /> : <ImageIcon size={20} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-[#6C5DD3] transition-colors line-clamp-1">{file.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">{file.size || 'Arquivo'}</p>
                                                </div>
                                            </div>
                                            <Upload size={18} className="text-gray-500 group-hover:text-white transition-colors rotate-180" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                    onClick={() => router.push(`/dashboard/watch/${l.id}`)}
                                    className={`flex items-start gap-6 p-4 rounded-xl transition-all cursor-pointer group ${isCurrent
                                        ? 'bg-white/5 border border-white/10 ring-1 ring-white/10'
                                        : 'hover:bg-white/[0.02] border border-transparent'
                                        }`}
                                >
                                    {/* Lesson Number */}
                                    <div className="flex-shrink-0 w-6 pt-1 text-center font-bold text-lg text-white/40 hidden sm:block">
                                        {index + 1}
                                    </div>

                                    {/* Thumbnail Placeholder */}
                                    <div className="relative w-24 sm:w-32 h-16 sm:h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 group-hover:border-[#6C5DD3]/50 transition-colors">
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
                                            <span className="flex-shrink-0 text-white/40 text-xs font-medium flex items-center gap-1.5">
                                                {l.duration_minutes > 0 && (
                                                    <>
                                                        <Clock size={12} />
                                                        {l.duration_minutes}min
                                                    </>
                                                )}
                                            </span>
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
