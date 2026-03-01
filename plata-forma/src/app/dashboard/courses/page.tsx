'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Play, X, Clock, ChevronRight, ChevronLeft, ArrowLeft, Plus, ThumbsUp, ChevronDown, Check, Volume2 } from 'lucide-react';
import { useRef } from 'react';

interface Course {
    id: string;
    title: string;
    description: string;
    cover_image_url: string;
    modules?: Module[];
}

interface Module {
    id: string;
    title: string;
    description: string;
    cover_image_url: string;
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
    title: string;
    description: string;
    duration_minutes: number;
    is_published: boolean;
}

interface Progress {
    lesson_id: string;
    completed: boolean;
    last_watched_position?: number;
    updated_at?: string;
}

export default function CoursesPage() {
    const router = useRouter();
    const { profile, loading: themeLoading } = useTheme();

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
    const [progress, setProgress] = useState<Progress[]>([]);
    const [myList, setMyList] = useState<Module[]>([]);
    const [likedModules, setLikedModules] = useState<string[]>([]);
    const [likedLessons, setLikedLessons] = useState<string[]>([]);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [scrolledRows, setScrolledRows] = useState<{ [key: string]: boolean }>({});
    const [hoveredModule, setHoveredModule] = useState<Module | null>(null);
    const [hoveredCardRect, setHoveredCardRect] = useState<DOMRect | null>(null);
    const openTimeout = useRef<NodeJS.Timeout | null>(null);
    const closeTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!themeLoading) {
            if (!profile) {
                const checkSession = async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) router.push('/login');
                };
                checkSession();
            } else {
                fetchData();
                setLoading(false);
            }
        }
    }, [profile, themeLoading, router]);

    async function fetchData() {
        if (!profile?.id) return;

        // Fetch courses with modules and lessons
        const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select(`
                *,
                modules (
                    *,
                    lessons (*)
                )
            `)
            .eq('is_active', true)
            .order('order_index')
            .order('order_index', { foreignTable: 'modules' })
            .order('order_index', { foreignTable: 'modules.lessons' });

        if (coursesError) {
            console.error('Error fetching courses:', coursesError);
            return;
        }

        const validCourses = coursesData || [];
        setCourses(validCourses);

        // Fetch user's "Minha Lista"
        const { data: listData, error: listError } = await supabase
            .from('user_module_list')
            .select(`
                module_id,
                modules (
                    *,
                    lessons (*)
                )
            `)
            .eq('user_id', profile.id)
            .order('order_index', { foreignTable: 'modules.lessons' });

        if (listError) {
            console.error('Error fetching My List:', listError);
        } else {
            const formattedList = (listData || [])
                .map((item: any) => item.modules)
                .filter(Boolean);
            setMyList(formattedList);
        }

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id, completed, last_watched_position, updated_at')
            .eq('user_id', profile.id);

        if (progressError) {
            console.error('Error fetching progress:', progressError);
        } else {
            setProgress(progressData || []);
        }

        // Fetch likes
        const { data: moduleLikes } = await supabase
            .from('module_likes')
            .select('module_id')
            .eq('user_id', profile.id);

        const { data: lessonLikes } = await supabase
            .from('lesson_likes')
            .select('lesson_id')
            .eq('user_id', profile.id);

        setLikedModules(moduleLikes?.map((l: any) => l.module_id) || []);
        setLikedLessons(lessonLikes?.map((l: any) => l.lesson_id) || []);
    }

    const handleMouseEnter = (e: React.MouseEvent, module: Module) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
        if (openTimeout.current) clearTimeout(openTimeout.current);

        if (hoveredModule?.id === module.id) return;

        if (hoveredModule) {
            // If already browsing, close previous and open next with a perceivable gap
            setHoveredModule(null);
            openTimeout.current = setTimeout(() => {
                setHoveredCardRect(rect);
                setHoveredModule(module);
            }, 400); // Fluid gap to allow a "close-then-open" feel
        } else {
            // Initial hover
            openTimeout.current = setTimeout(() => {
                setHoveredCardRect(rect);
                setHoveredModule(module);
            }, 300); // Snappier intent check (reduced by half as requested)
        }
    };

    const handleMouseLeave = () => {
        if (openTimeout.current) clearTimeout(openTimeout.current);

        closeTimeout.current = setTimeout(() => {
            setHoveredModule(null);
            setHoveredCardRect(null);
        }, 400); // Slightly longer close buffer
    };

    const handlePreviewMouseEnter = () => {
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };

    const handlePreviewMouseLeave = () => {
        handleMouseLeave();
    };

    const toggleMyList = async (module: Module) => {
        if (!profile?.id) return;

        const isItemInList = myList.some(m => m.id === module.id);

        if (isItemInList) {
            // Remove
            const { error } = await supabase
                .from('user_module_list')
                .delete()
                .eq('user_id', profile.id)
                .eq('module_id', module.id);

            if (!error) {
                setMyList(prev => prev.filter(m => m.id !== module.id));
            }
        } else {
            // Add
            const { error } = await supabase
                .from('user_module_list')
                .insert({
                    user_id: profile.id,
                    module_id: module.id
                });

            if (!error) {
                setMyList(prev => [...prev, module]);
            }
        }
    };

    const toggleLikeModule = async (module: Module) => {
        if (!profile?.id) return;
        const isLiked = likedModules.includes(module.id);

        if (isLiked) {
            await supabase.from('module_likes').delete().eq('user_id', profile.id).eq('module_id', module.id);
            setLikedModules(prev => prev.filter(id => id !== module.id));
        } else {
            await supabase.from('module_likes').insert({ user_id: profile.id, module_id: module.id });
            setLikedModules(prev => [...prev, module.id]);
        }
    };

    const toggleLikeLesson = async (lessonId: string) => {
        if (!profile?.id) return;
        const isLiked = likedLessons.includes(lessonId);

        if (isLiked) {
            await supabase.from('lesson_likes').delete().eq('user_id', profile.id).eq('lesson_id', lessonId);
            setLikedLessons(prev => prev.filter(id => id !== lessonId));
        } else {
            await supabase.from('lesson_likes').insert({ user_id: profile.id, lesson_id: lessonId });
            setLikedLessons(prev => [...prev, lessonId]);
        }
    };

    function scrollCarousel(courseId: string, direction: 'left' | 'right') {
        const container = document.getElementById(`carousel-${courseId}`);
        if (!container) return;

        const scrollAmount = container.clientWidth * 0.85;
        const newPosition = direction === 'left'
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;

        container.scrollTo({ left: Math.max(0, newPosition), behavior: 'smooth' });

        // Use a timeout to update state after scroll finishes or periodically check
        setTimeout(() => {
            setScrolledRows(prev => ({
                ...prev,
                [courseId]: container.scrollLeft > 10 || (direction === 'right')
            }));
        }, 300);
    }

    if (loading || themeLoading) {
        return (
            <div className="min-h-screen bg-[#141414] flex items-center justify-center">
                <div className="text-white">Carregando...</div>
            </div>
        );
    }

    // Calculate hover preview position
    let previewTop = 0;
    let previewLeft = 0;
    let previewWidth = 0;
    if (hoveredModule && hoveredCardRect) {
        previewWidth = hoveredCardRect.width * 1.3;
        const visualWidth = previewWidth * 1.25;
        const horizontalMarginLeft = 75; // Respect sidebar
        const horizontalMarginRight = 40;
        const verticalMargin = 40;

        previewLeft = hoveredCardRect.left - (hoveredCardRect.width * 0.15);
        const halfVisualDiff = (visualWidth - previewWidth) / 2;
        let visualLeft = previewLeft - halfVisualDiff;
        let visualRight = visualLeft + visualWidth;

        // Adjust horizontal position if it hits screen edges (Anchored behavior)
        if (visualLeft < horizontalMarginLeft) {
            previewLeft = horizontalMarginLeft + halfVisualDiff;
        } else if (typeof window !== 'undefined' && visualRight > window.innerWidth - horizontalMarginRight) {
            previewLeft = (window.innerWidth - horizontalMarginRight) - previewWidth - halfVisualDiff;
        }

        // Adjust vertical position if it hits top edge
        previewTop = hoveredCardRect.top - (hoveredCardRect.height * 0.15);
        const visualTop = previewTop - (hoveredCardRect.height * 0.15);
        if (visualTop < verticalMargin) {
            previewTop = verticalMargin + (hoveredCardRect.height * 0.15);
        }
    }

    // Derived state for "Continuar Assistindo"
    const continueWatching = courses.flatMap(course =>
        (course.modules || []).filter(module => {
            const publishedLessons = module.lessons?.filter((l: any) => l.is_published) || [];
            if (publishedLessons.length === 0) return false;

            const completedCount = publishedLessons.filter((l: any) =>
                progress.some(p => p.lesson_id === l.id && p.completed)
            ).length;

            // Started if has any progress record (even if not completed)
            const hasStarted = publishedLessons.some((l: any) =>
                progress.some(p => p.lesson_id === l.id)
            );

            // In progress if at least one record exists but not all finished
            return hasStarted && completedCount < publishedLessons.length;
        })
    );

    // Sort "Continuar Assistindo" by recency
    continueWatching.sort((a, b) => {
        const getLatestDate = (mod: any) => {
            const dates = mod.lessons?.map((l: any) => {
                const prog = progress.find(p => p.lesson_id === l.id);
                return prog?.updated_at ? new Date(prog.updated_at).getTime() : 0;
            }) || [];
            return Math.max(0, ...dates);
        };
        return getLatestDate(b) - getLatestDate(a);
    });

    return (
        <div className="min-h-screen bg-[#141414] text-white">
            {/* Hero Banner with video background */}
            <div className="relative min-h-[70vh] w-full overflow-hidden flex flex-col justify-end">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-[#141414]/20 z-10" />
                {/* Background video */}
                <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src="/documentario-ugc-flix-bg.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                />

                {/* Hero content */}
                <div className="relative z-20 pb-10 px-6 lg:px-12 lg:pl-[120px]">
                    <h1 className="text-4xl lg:text-6xl font-black text-white mb-4">
                        Seja bem-vindo(a) ao futuro!
                    </h1>
                    <p className="text-lg lg:text-xl text-white/90 max-w-2xl mb-6">
                        {courses[0]?.description || 'Continue sua jornada de aprendizado'}
                    </p>
                    {courses[0]?.modules && courses[0].modules.length > 0 && (
                        <button
                            onClick={() => setSelectedModule(courses[0].modules![0])}
                            className="px-8 py-3 bg-white text-black font-bold rounded-md hover:bg-white/90 transition-all flex items-center gap-2"
                        >
                            <Play size={20} fill="currentColor" />
                            Começar Agora
                        </button>
                    )}
                </div>
            </div>

            {/* Multi-Course Sections */}
            <div className="relative z-20 space-y-12 pb-20 pt-10">
                {/* Minha Lista Section */}
                {myList.length > 0 && (
                    <div className="relative group/row px-4 lg:px-12">
                        <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 ml-2 lg:ml-6 group-hover:text-gray-300 transition-colors">
                            Minha Lista
                        </h2>
                        <div className="relative">
                            {/* LEFT arrow */}
                            {scrolledRows['my-list'] && (
                                <>
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                                        style={{ background: 'linear-gradient(to right, #141414, transparent)' }}
                                    />
                                    <button
                                        onClick={() => scrollCarousel('my-list', 'left')}
                                        className="absolute left-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center bg-[#141414]/50 hover:bg-[#141414]/70 transition-all opacity-0 group-hover/row:opacity-100"
                                    >
                                        <ChevronLeft size={36} className="text-white" strokeWidth={2.5} />
                                    </button>
                                </>
                            )}

                            {/* RIGHT arrow */}
                            <div
                                className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                                style={{ background: 'linear-gradient(to left, #141414, transparent)' }}
                            />
                            <button
                                onClick={() => scrollCarousel('my-list', 'right')}
                                className="absolute right-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center bg-[#141414]/50 hover:bg-[#141414]/70 transition-all opacity-0 group-hover/row:opacity-100"
                            >
                                <ChevronRight size={36} className="text-white" strokeWidth={2.5} />
                            </button>

                            {/* Scroll container */}
                            <div
                                id="carousel-my-list"
                                className="flex gap-3 overflow-x-auto py-4 px-2 lg:px-6"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }}
                            >
                                {myList.map((module) => (
                                    <div
                                        key={`mylist-${module.id}`}
                                        onClick={() => setSelectedModule(module)}
                                        onMouseEnter={(e) => handleMouseEnter(e, module)}
                                        onMouseLeave={handleMouseLeave}
                                        className="flex-shrink-0 cursor-pointer group/card hover:scale-105 transition-transform duration-200 w-[70vw] sm:w-[45vw] md:w-[30vw] lg:w-[22vw] xl:w-[15vw]"
                                    >
                                        {/* Horizontal Card for "Minha Lista" */}
                                        <div
                                            className="relative rounded-md overflow-hidden mb-2 bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg"
                                            style={{ width: '100%', aspectRatio: '16/9' }}
                                        >
                                            {module.horizontal_cover_url || module.cover_image_url ? (
                                                <img
                                                    src={module.horizontal_cover_url || module.cover_image_url}
                                                    alt={module.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Play size={24} className="text-white/50" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                                <Play size={24} className="text-white" fill="white" />
                                            </div>
                                        </div>
                                        <h3 className="text-white font-semibold text-xs leading-tight group-hover/card:text-gray-300 transition-colors line-clamp-1">{module.title}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Course rows and Continue Watching insertion */}
                {(() => {
                    const rows = [];
                    const courseItems = courses.map((course) => (
                        <div key={course.id} className="relative group/row px-4 lg:px-12">
                            {/* Course Title */}
                            <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 ml-2 lg:ml-6 group-hover:text-gray-300 transition-colors">
                                {course.title}
                            </h2>

                            {course.modules && course.modules.length > 0 ? (
                                <div className="relative">
                                    {/* LEFT arrow */}
                                    {scrolledRows[course.id] && (
                                        <>
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                                                style={{ background: 'linear-gradient(to right, #141414, transparent)' }}
                                            />
                                            <button
                                                onClick={() => scrollCarousel(course.id, 'left')}
                                                className="absolute left-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center bg-[#141414]/50 hover:bg-[#141414]/70 transition-all opacity-0 group-hover/row:opacity-100"
                                            >
                                                <ChevronLeft size={36} className="text-white" strokeWidth={2.5} />
                                            </button>
                                        </>
                                    )}

                                    {/* RIGHT arrow */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                                        style={{ background: 'linear-gradient(to left, #141414, transparent)' }}
                                    />
                                    <button
                                        onClick={() => scrollCarousel(course.id, 'right')}
                                        className="absolute right-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center bg-[#141414]/50 hover:bg-[#141414]/70 transition-all opacity-0 group-hover/row:opacity-100"
                                    >
                                        <ChevronRight size={36} className="text-white" strokeWidth={2.5} />
                                    </button>

                                    {/* Scroll container */}
                                    <div
                                        id={`carousel-${course.id}`}
                                        className="flex gap-3 overflow-x-auto py-4 px-2 lg:px-6"
                                        style={{
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none',
                                        }}
                                    >
                                        {course.modules.map((module) => {
                                            const publishedLessons = module.lessons?.filter((l: any) => l.is_published) || [];
                                            const completedCount = publishedLessons.filter((l: any) =>
                                                progress.some(p => p.lesson_id === l.id && p.completed)
                                            ).length;
                                            return (
                                                <div
                                                    key={module.id}
                                                    onClick={() => !module.is_locked && setSelectedModule(module)}
                                                    onMouseEnter={(e) => !module.is_locked && handleMouseEnter(e, module)}
                                                    onMouseLeave={handleMouseLeave}
                                                    className="flex-shrink-0 cursor-pointer group/card hover:scale-105 transition-transform duration-200"
                                                    style={{ width: 'calc((100vw - 120px - 5 * 12px) / 6.3)' }}
                                                >
                                                    {/* Card — 642x900 ratio */}
                                                    <div
                                                        className="relative rounded-md overflow-hidden mb-2 bg-gradient-to-br from-purple-600 to-blue-600"
                                                        style={{ width: '100%', aspectRatio: '642/900' }}
                                                    >
                                                        {(module.cover_image_url || module.horizontal_cover_url) ? (
                                                            <img
                                                                src={module.cover_image_url || module.horizontal_cover_url}
                                                                alt={module.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Play size={32} className="text-white/50" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Play size={32} className="text-white" fill="white" />
                                                        </div>
                                                        {completedCount > 0 && (
                                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                                {completedCount}/{publishedLessons.length}
                                                            </div>
                                                        )}
                                                        {module.is_locked && (
                                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                                                <div className="text-center">
                                                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">🔒</div>
                                                                    <p className="text-white text-xs font-bold">Bloqueado</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h3 className="text-white font-semibold text-xs leading-tight group-hover/card:text-gray-300 transition-colors line-clamp-2">{module.title}</h3>
                                                    <p className="text-gray-400 text-xs mt-1">{publishedLessons.length} aulas</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="ml-2 lg:ml-6 text-gray-500 text-sm italic">
                                    Nenhum módulo disponível neste curso.
                                </div>
                            )}
                        </div>
                    ));

                    // Add first two courses
                    rows.push(...courseItems.slice(0, 2));

                    // Add "Continuar Assistindo" if applicable
                    if (continueWatching.length > 0) {
                        rows.push(
                            <div key="continue-watching" className="relative group/row px-4 lg:px-12 mb-8">
                                <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 ml-2 lg:ml-6 group-hover:text-gray-300 transition-colors">
                                    Continuar assistindo como {profile?.full_name?.split(' ')[0] || 'você'}
                                </h2>
                                <div className="relative">
                                    {/* LEFT arrow */}
                                    {scrolledRows['continue-watching'] && (
                                        <>
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                                                style={{ background: 'linear-gradient(to right, #141414, transparent)' }}
                                            />
                                            <button
                                                onClick={() => scrollCarousel('continue-watching', 'left')}
                                                className="absolute left-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center bg-[#141414]/50 hover:bg-[#141414]/70 transition-all opacity-0 group-hover/row:opacity-100"
                                            >
                                                <ChevronLeft size={36} className="text-white" strokeWidth={2.5} />
                                            </button>
                                        </>
                                    )}

                                    {/* RIGHT arrow */}
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                                        style={{ background: 'linear-gradient(to left, #141414, transparent)' }}
                                    />
                                    <button
                                        onClick={() => scrollCarousel('continue-watching', 'right')}
                                        className="absolute right-0 top-0 bottom-0 z-20 w-14 flex items-center justify-center bg-[#141414]/50 hover:bg-[#141414]/70 transition-all opacity-0 group-hover/row:opacity-100"
                                    >
                                        <ChevronRight size={36} className="text-white" strokeWidth={2.5} />
                                    </button>

                                    {/* Scroll container */}
                                    <div
                                        id="carousel-continue-watching"
                                        className="flex gap-3 overflow-x-auto py-4 px-2 lg:px-6"
                                        style={{
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none',
                                        }}
                                    >
                                        {continueWatching.map((module) => {
                                            const publishedLessons = module.lessons?.filter((l: any) => l.is_published) || [];

                                            // Calculate total seconds already completed + current session seconds
                                            let totalSecondsWatched = 0;
                                            let totalModuleSeconds = 0;

                                            publishedLessons.forEach((l: any) => {
                                                const lessonDurationSec = (l.duration_minutes || 0) * 60;
                                                totalModuleSeconds += lessonDurationSec;

                                                const lessonProgress = progress.find(p => p.lesson_id === l.id);
                                                if (lessonProgress) {
                                                    if (lessonProgress.completed) {
                                                        totalSecondsWatched += lessonDurationSec;
                                                    } else if (lessonProgress.last_watched_position) {
                                                        // Cap it to duration to avoid > 100%
                                                        totalSecondsWatched += Math.min(lessonProgress.last_watched_position, lessonDurationSec);
                                                    }
                                                }
                                            });

                                            const progressPercent = totalModuleSeconds > 0
                                                ? Math.round((totalSecondsWatched / totalModuleSeconds) * 100)
                                                : 0;

                                            return (
                                                <div
                                                    key={`continue-${module.id}`}
                                                    onClick={() => !module.is_locked && setSelectedModule(module)}
                                                    onMouseEnter={(e) => !module.is_locked && handleMouseEnter(e, module)}
                                                    onMouseLeave={handleMouseLeave}
                                                    className="flex-shrink-0 cursor-pointer group/card hover:scale-105 transition-transform duration-200"
                                                    style={{ width: 'calc((100vw - 120px - 5 * 12px) / 6.3)' }}
                                                >
                                                    {/* Card — 16:9 ratio */}
                                                    <div
                                                        className="relative rounded-md overflow-hidden mb-2 bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg"
                                                        style={{ width: '100%', aspectRatio: '16/9' }}
                                                    >
                                                        {module.horizontal_cover_url || module.cover_image_url ? (
                                                            <img
                                                                src={module.horizontal_cover_url || module.cover_image_url}
                                                                alt={module.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Play size={24} className="text-white/50" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Play size={24} className="text-white" fill="white" />
                                                        </div>

                                                        {/* Progress Bar (Netflix style) */}
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                                                            <div
                                                                className="h-full bg-red-600 transition-all duration-500"
                                                                style={{ width: `${progressPercent}%` || '0%' }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className="text-white font-semibold text-xs leading-tight group-hover/card:text-gray-300 transition-colors line-clamp-1 flex-1">{module.title}</h3>
                                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{progressPercent}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Add remaining courses
                    rows.push(...courseItems.slice(2));

                    return rows;
                })()}
            </div>

            {/* Module Hover Preview — Netflix style */}
            {hoveredModule && hoveredCardRect && (
                <div
                    key={hoveredModule.id}
                    onMouseEnter={handlePreviewMouseEnter}
                    onMouseLeave={handlePreviewMouseLeave}
                    className="fixed z-[100] bg-[#141414] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 pointer-events-auto animate-in zoom-in-95"
                    style={{
                        top: previewTop,
                        left: previewLeft,
                        width: previewWidth,
                        transform: 'scale(1.25)',
                        transitionTimingFunction: 'cubic-bezier(0.33, 1, 0.68, 1)'
                    }}
                >
                    {/* Preview Banner */}
                    <div className="relative aspect-video w-full">
                        {hoveredModule.preview_video_url ? (
                            <div className="w-full h-full relative">
                                <iframe
                                    src={getVideoEmbedUrl(hoveredModule.preview_video_url, true)}
                                    className="w-full h-full border-0 pointer-events-none"
                                    allow="autoplay"
                                />
                            </div>
                        ) : (hoveredModule.horizontal_cover_url || hoveredModule.cover_image_url) ? (
                            <img
                                src={hoveredModule.horizontal_cover_url || hoveredModule.cover_image_url}
                                alt={hoveredModule.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                <Play size={48} className="text-white/50" fill="white" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent z-10" />
                        <h4 className="absolute bottom-2 left-4 text-white font-bold text-lg drop-shadow-lg z-20">
                            {hoveredModule.title}
                        </h4>
                    </div>

                    {/* Preview Info */}
                    <div className="p-4 bg-[#141414]">
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mb-4">
                            <button
                                onClick={() => {
                                    const firstLessonId = hoveredModule.lessons?.filter(l => l.is_published)[0]?.id;
                                    if (firstLessonId) router.push(`/dashboard/watch/${firstLessonId}`);
                                }}
                                className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-[#e6e6e6] transition-colors"
                                title="Assistir"
                            >
                                <Play size={18} className="text-black fill-black ml-0.5" />
                            </button>
                            <button
                                onClick={() => toggleMyList(hoveredModule)}
                                className={`w-9 h-9 border-2 ${myList.some(m => m.id === hoveredModule.id) ? 'border-white bg-white/20' : 'border-white/40'} rounded-full flex items-center justify-center hover:border-white transition-colors group`}
                                title={myList.some(m => m.id === hoveredModule.id) ? "Remover da minha lista" : "Adicionar à minha lista"}
                            >
                                {myList.some(m => m.id === hoveredModule.id) ? (
                                    <Check size={20} className="text-white" />
                                ) : (
                                    <Plus size={20} className="text-white" />
                                )}
                            </button>
                            <button
                                className="w-9 h-9 border-2 border-white/40 rounded-full flex items-center justify-center hover:border-white transition-colors group"
                                title="Classificar"
                            >
                                <ThumbsUp size={16} className="text-white" />
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedModule(hoveredModule);
                                    setHoveredModule(null);
                                }}
                                className="w-9 h-9 border-2 border-white/40 rounded-full flex items-center justify-center hover:border-white transition-colors group ml-auto"
                                title="Mais informações"
                            >
                                <ChevronDown size={20} className="text-white" />
                            </button>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-sm mb-2">
                            <span className="text-green-500 font-bold">98% Relevante</span>
                            <span className="px-1.5 py-0.5 bg-[#00A650] text-white leading-none text-[10px] rounded-[2px] font-bold">L</span>
                            <span className="text-white">{hoveredModule.lessons?.filter(l => l.is_published).length} Aulas</span>
                            <span className="px-1 text-[10px] border border-white/40 text-white rounded-[2px] leading-tight">HD</span>
                        </div>

                        {/* Description/Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-white/90">
                            {hoveredModule.genres ? (
                                <span>{hoveredModule.genres}</span>
                            ) : (
                                <>
                                    <span>Didático</span>
                                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                                    <span>Inspirador</span>
                                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                                    <span>Prático</span>
                                </>
                            )}
                        </div>

                        {hoveredModule.cast_list && (
                            <div className="mt-2 text-[10px] text-white/60 line-clamp-1">
                                <span className="text-white/40">Elenco:</span> {hoveredModule.cast_list}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom spacer */}
            <div style={{ height: '80px' }} />

            {/* Module Modal */}
            {selectedModule && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Dark Overlay - Handles closing when clicking outside */}
                    <div
                        className="absolute inset-0 bg-black/90 cursor-pointer"
                        onClick={() => setSelectedModule(null)}
                    />

                    {/* Modal Content - Netflix Style */}
                    <div
                        className="bg-[#181818] rounded-[2rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden relative z-10 shadow-2xl"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            div::-webkit-scrollbar {
                                display: none;
                            }
                        ` }} />
                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedModule(null);
                            }}
                            className="absolute top-4 right-4 w-10 h-10 bg-[#181818]/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black transition-colors z-[40]"
                        >
                            <X size={24} className="text-white" />
                        </button>

                        {/* Netflix Hero Banner */}
                        <div className="relative aspect-video w-full bg-black rounded-t-[2rem] overflow-hidden group/hero">
                            {/* Deeper and more nuanced gradients for true Netflix cinematic feel */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/40 to-transparent z-10" />
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10" />

                            {selectedModule?.preview_video_url ? (
                                <div className="absolute inset-0 overflow-hidden rounded-t-[2rem]">
                                    <iframe
                                        src={getVideoEmbedUrl(selectedModule.preview_video_url, true)}
                                        className="w-full h-full border-0 pointer-events-none scale-110"
                                        allow="autoplay"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/hero:scale-105"
                                    style={{
                                        backgroundImage: (selectedModule.horizontal_cover_url || selectedModule.cover_image_url)
                                            ? `url(${selectedModule.horizontal_cover_url || selectedModule.cover_image_url})`
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    }}
                                />
                            )}

                            {/* Hero Controls */}
                            <div className="absolute bottom-12 left-12 z-20 right-12">
                                <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,1)] line-clamp-2 uppercase tracking-tighter">
                                    {selectedModule.title}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            const firstLesson = selectedModule.lessons?.filter((l: any) => l.is_published)[0];
                                            if (firstLesson) router.push(`/dashboard/watch/${firstLesson.id}`);
                                        }}
                                        className="px-8 py-2.5 bg-white text-black text-lg font-bold rounded flex items-center gap-3 hover:bg-white/90 transition-all shadow-xl"
                                    >
                                        <Play size={24} fill="black" />
                                        Assistir
                                    </button>
                                    <button
                                        onClick={() => toggleMyList(selectedModule)}
                                        className="w-11 h-11 border-2 border-white/40 rounded-full flex items-center justify-center hover:border-white hover:bg-white/10 transition-all group/btn"
                                        title="Minha Lista"
                                    >
                                        {myList.some(m => m.id === selectedModule.id) ? (
                                            <Check size={28} className="text-white" />
                                        ) : (
                                            <Plus size={28} className="text-white" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => toggleLikeModule(selectedModule)}
                                        className={`w-11 h-11 border-2 ${likedModules.includes(selectedModule.id) ? 'border-white bg-white/20' : 'border-white/40'} rounded-full flex items-center justify-center hover:border-white hover:bg-white/10 transition-all group/btn`}
                                        title="Classificar"
                                    >
                                        <ThumbsUp size={22} className={`text-white ${likedModules.includes(selectedModule.id) ? 'fill-white' : ''}`} />
                                    </button>

                                    {/* Volume indicator or Mute toggle placeholder like Netflix */}
                                    <div className="ml-auto flex items-center gap-4">
                                        <button className="w-10 h-10 border-2 border-white/40 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-all">
                                            <Volume2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Netflix Metadata & Info */}
                        <div className="px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Metadata Row */}
                                <div className="flex items-center gap-3 text-base text-white/90">
                                    <span className="text-[#46d369] font-bold">98% Relevante</span>
                                    <span className="text-gray-400">{new Date().getFullYear()}</span>
                                    <span className="px-1.5 py-0.5 border border-gray-500 text-gray-300 leading-tight text-[11px] rounded-[2px] font-bold">A16</span>
                                    <span className="text-gray-400">{selectedModule.lessons?.filter((l: any) => l.is_published).length} Aulas</span>
                                    <span className="px-1 text-[10px] border border-white/40 text-white rounded-[2px] leading-tight font-bold">HD</span>
                                </div>

                                {/* Synopsis */}
                                <p className="text-[1.1rem] text-white leading-relaxed max-w-3xl font-medium">
                                    {selectedModule.description || 'Neste envolvente drama policial, um homem de 45 anos se torna o recruta mais velho do LAPD.'}
                                </p>
                            </div>

                            {/* Additional Details */}
                            <div className="text-[13px] space-y-3 leading-tight">
                                <div>
                                    <span className="text-gray-500">Elenco: </span>
                                    <span className="text-white hover:underline cursor-pointer transition-colors">
                                        {selectedModule.cast_list || 'Nathan Fillion, Alyssa Diaz, Richard T. Jones'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Gêneros: </span>
                                    <span className="text-white hover:underline cursor-pointer transition-colors">
                                        {selectedModule.genres || 'Séries dramáticas, Séries de ação e aventura'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Este módulo é: </span>
                                    <span className="text-white hover:underline cursor-pointer transition-colors">
                                        {selectedModule.traits || 'Empolgantes'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Episodes List - Table Style Netflix */}
                        <div className="px-12 pb-12">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold text-white">Episódios</h3>
                                <div className="px-4 py-2 bg-[#2f2f2f] border border-[#4a4a4a] text-sm font-medium rounded text-white flex items-center gap-4 cursor-pointer hover:bg-[#3f3f3f] transition-colors">
                                    Módulo {(() => {
                                        // Find index of selectedModule in the current course
                                        const currentCourse = courses.find(c => c.modules?.some(m => m.id === selectedModule.id));
                                        if (!currentCourse) return 1;
                                        const sortedModules = [...(currentCourse.modules || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                                        return sortedModules.findIndex(m => m.id === selectedModule.id) + 1;
                                    })()}
                                    <ChevronDown size={18} />
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                {selectedModule.lessons?.filter((l: any) => l.is_published)
                                    .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                                    .map((lesson: any, index: number) => {
                                        const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.completed);
                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() => router.push(`/dashboard/watch/${lesson.id}`)}
                                                className="flex items-center gap-8 p-6 rounded-lg hover:bg-[#333333] transition-colors cursor-pointer group border-b border-white/5 last:border-0 min-h-[140px]"
                                            >
                                                {/* Index */}
                                                <div className="w-8 text-2xl font-bold text-[#808080] flex-shrink-0 text-center">
                                                    {index + 1}
                                                </div>

                                                {/* Thumbnail Area */}
                                                <div className="relative w-48 aspect-video rounded-md overflow-hidden bg-[#2a2a2a] flex-shrink-0 shadow-lg border border-white/5">
                                                    {selectedModule.cover_image_url ? (
                                                        <img
                                                            src={selectedModule.cover_image_url}
                                                            className="w-full h-full object-cover opacity-90"
                                                            alt={lesson.title}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Play size={24} className="text-white/20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center">
                                                            <Play size={24} className="text-white ml-1" fill="white" />
                                                        </div>
                                                    </div>
                                                    {isCompleted && (
                                                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg z-20">
                                                            <Check size={14} className="text-white" strokeWidth={4} />
                                                        </div>
                                                    )}
                                                    {isCompleted && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 z-20" />
                                                    )}
                                                </div>

                                                {/* Lesson Content - Netflix Style spacing */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-2 gap-4">
                                                        <h4 className="text-lg font-bold text-white truncate">
                                                            {lesson.title}
                                                        </h4>
                                                        <div className="text-base text-white/80 flex-shrink-0 font-medium whitespace-nowrap">
                                                            {lesson.duration_minutes > 0 ? `${lesson.duration_minutes}min` : ''}
                                                        </div>
                                                    </div>
                                                    <p className="text-[15px] text-[#a3a3a3] line-clamp-3 leading-relaxed font-normal">
                                                        {lesson.description || 'Neste episódio, exploramos os conceitos fundamentais deste tópico com exemplos práticos e demonstrações em tempo real.'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
