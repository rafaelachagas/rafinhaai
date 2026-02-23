-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    content TEXT,
    duration_minutes INTEGER,
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_lesson_progress table
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_watched_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON public.user_lesson_progress(lesson_id);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Anyone can view active courses"
    ON public.courses FOR SELECT
    USING (is_active = true OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Only admins can insert courses"
    ON public.courses FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Only admins can update courses"
    ON public.courses FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Only admins can delete courses"
    ON public.courses FOR DELETE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- RLS Policies for modules
CREATE POLICY "Anyone can view modules of active courses"
    ON public.modules FOR SELECT
    USING (
        course_id IN (SELECT id FROM public.courses WHERE is_active = true)
        OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Only admins can insert modules"
    ON public.modules FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Only admins can update modules"
    ON public.modules FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Only admins can delete modules"
    ON public.modules FOR DELETE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- RLS Policies for lessons
CREATE POLICY "Anyone can view published lessons"
    ON public.lessons FOR SELECT
    USING (
        is_published = true
        OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Only admins can insert lessons"
    ON public.lessons FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Only admins can update lessons"
    ON public.lessons FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Only admins can delete lessons"
    ON public.lessons FOR DELETE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- RLS Policies for user_lesson_progress
CREATE POLICY "Users can view their own progress"
    ON public.user_lesson_progress FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Users can insert their own progress"
    ON public.user_lesson_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON public.user_lesson_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_lesson_progress_updated_at BEFORE UPDATE ON public.user_lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
