CREATE TABLE IF NOT EXISTS public.ai_content_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    output_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_content_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own AI history" 
    ON public.ai_content_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI history" 
    ON public.ai_content_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI history" 
    ON public.ai_content_history FOR DELETE
    USING (auth.uid() = user_id);
