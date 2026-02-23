-- Create module_likes table
CREATE TABLE IF NOT EXISTS public.module_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- Create lesson_likes table
CREATE TABLE IF NOT EXISTS public.lesson_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.module_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_likes ENABLE ROW LEVEL SECURITY;

-- Policies for module_likes
CREATE POLICY "Users can view all module likes" ON public.module_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own module likes" ON public.module_likes FOR ALL USING (auth.uid() = user_id);

-- Policies for lesson_likes
CREATE POLICY "Users can view all lesson likes" ON public.lesson_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own lesson likes" ON public.lesson_likes FOR ALL USING (auth.uid() = user_id);
