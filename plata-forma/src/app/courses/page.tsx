'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Play, X, Clock, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';

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
    is_locked: boolean;
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
}

export default function CoursesPage() {
    const router = useRouter();
    const { profile, loading: themeLoading } = useTheme();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);

    useEffect(() => {
        // Force dark mode
        document.documentElement.style.backgroundColor = '#000000';
        document.body.style.backgroundColor = '#000000';

        return () => {
            document.documentElement.style.backgroundColor = '';
            document.body.style.backgroundColor = '';
        };
    }, []);

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
            .order('order_index');

        if (coursesError) {
            console.error('Error fetching courses:', coursesError);
            return;
        }

        setCourses(coursesData || []);

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id, completed')
            .eq('user_id', profile.id);

        if (progressError) {
            console.error('Error fetching progress:', progressError);
            return;
        }

        setProgress(progressData || []);
    }

    function scrollCarousel(courseId: string, direction: 'left' | 'right') {
        const container = document.getElementById(`carousel-${courseId}`);
        if (!container) return;

        const scrollAmount = 300;
        const newPosition = direction === 'left'
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;

        container.scrollTo({ left: newPosition, behavior: 'smooth' });
    }

    if (loading || themeLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Back to Dashboard Button */}
            <button
                onClick={() => router.push('/dashboard')}
                className="fixed top-6 left-6 z-50 flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Dashboard</span>
            </button>

            {/* Hero Banner */}
            <div className="relative h-[70vh] w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: courses[0]?.cover_image_url
                            ? `url(${courses[0].cover_image_url})`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                />
                <div className="absolute bottom-0 left-0 right-0 z-20 p-8 lg:p-16 max-w-[1600px] mx-auto">
                    <h1 className="text-4xl lg:text-6xl font-black text-white mb-4">
                        {courses[0]?.title || 'Seus Cursos'}
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

            {/* Course Sections */}
            <div className="relative z-20 -mt-32 pb-20">
                {courses.map((course) => (
                    <div key={course.id} className="mb-12">
                        <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
                            {/* Course Title */}
                            <h2 className="text-2xl font-bold text-white mb-6">
                                {course.title}
                            </h2>

                            {/* Carousel Container */}
                            <div className="relative group">
                                {/* Left Arrow */}
                                <button
                                    onClick={() => scrollCarousel(course.id, 'left')}
                                    className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black"
                                >
                                    <ChevronLeft size={32} className="text-white" />
                                </button>

                                {/* Cards Carousel */}
                                <div
                                    id={`carousel-${course.id}`}
                                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {course.modules?.map((module) => {
                                        const publishedLessons = module.lessons?.filter(l => l.is_published) || [];
                                        const completedCount = publishedLessons.filter(l =>
                                            progress.some(p => p.lesson_id === l.id && p.completed)
                                        ).length;

                                        return (
                                            <div
                                                key={module.id}
                                                onClick={() => !module.is_locked && setSelectedModule(module)}
                                                className="flex-shrink-0 w-[280px] cursor-pointer group/card"
                                            >
                                                {/* Card Image */}
                                                <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-purple-600 to-blue-600">
                                                    {module.cover_image_url ? (
                                                        <img
                                                            src={module.cover_image_url}
                                                            alt={module.title}
                                                            className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Play size={48} className="text-white/50" />
                                                        </div>
                                                    )}

                                                    {/* Overlay on Hover */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Play size={48} className="text-white" fill="white" />
                                                    </div>

                                                    {/* Progress Badge */}
                                                    {completedCount > 0 && (
                                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                            {completedCount}/{publishedLessons.length}
                                                        </div>
                                                    )}

                                                    {/* Locked Badge */}
                                                    {module.is_locked && (
                                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                                            <div className="text-center">
                                                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                    🔒
                                                                </div>
                                                                <p className="text-white text-sm font-bold">Bloqueado</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Title */}
                                                <h3 className="text-white font-semibold text-sm group-hover/card:text-gray-300 transition-colors">
                                                    {module.title}
                                                </h3>
                                                <p className="text-gray-400 text-xs mt-1">
                                                    {publishedLessons.length} aulas
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Arrow */}
                                <button
                                    onClick={() => scrollCarousel(course.id, 'right')}
                                    className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black"
                                >
                                    <ChevronRight size={32} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Module Modal */}
            {selectedModule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
                    <div className="bg-[#181818] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedModule(null)}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/80 rounded-full flex items-center justify-center hover:bg-black transition-colors z-10"
                        >
                            <X size={24} className="text-white" />
                        </button>

                        {/* Module Banner */}
                        <div className="relative h-[300px] w-full">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent z-10" />
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: selectedModule.cover_image_url
                                        ? `url(${selectedModule.cover_image_url})`
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    {selectedModule.title}
                                </h2>
                                <p className="text-white/80">
                                    {selectedModule.description}
                                </p>
                            </div>
                        </div>

                        {/* Episodes/Lessons List */}
                        <div className="p-8">
                            <h3 className="text-white text-xl font-bold mb-4">Aulas</h3>
                            <div className="space-y-3">
                                {selectedModule.lessons?.filter(l => l.is_published).map((lesson, index) => {
                                    const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.completed);

                                    return (
                                        <div
                                            key={lesson.id}
                                            onClick={() => router.push(`/watch/${lesson.id}`)}
                                            className="flex gap-4 p-4 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors cursor-pointer group"
                                        >
                                            {/* Episode Number */}
                                            <div className="flex-shrink-0 w-8 h-8 bg-[#3a3a3a] rounded flex items-center justify-center text-white font-bold">
                                                {isCompleted ? '✓' : index + 1}
                                            </div>

                                            {/* Lesson Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h4 className="text-white font-semibold group-hover:text-gray-300">
                                                        {lesson.title}
                                                    </h4>
                                                    {lesson.duration_minutes && (
                                                        <span className="text-gray-400 text-sm flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {lesson.duration_minutes}min
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm line-clamp-2">
                                                    {lesson.description}
                                                </p>
                                            </div>

                                            {/* Play Icon */}
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play size={16} className="text-white" fill="white" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
