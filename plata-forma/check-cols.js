
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zldmjdwjmsgqhhhzrwtm.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZG1qZHdqbXNncWhoaHpyd3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjQ3MjAsImV4cCI6MjA4NjcwMDcyMH0.BLcK7ria8p-Gs5UOLshT8UfaVXwbx82j7Ts4FyS5arY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    console.log('Fetching a single row to see column names...');
    const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('No data found in user_lesson_progress.');
            // Try to insert a dummy row (might fail due to RLS but we might see column errors)
            console.log('Trying to insert a sample row...');
            const { error: insertError } = await supabase
                .from('user_lesson_progress')
                .insert({
                    user_id: '00000000-0000-0000-0000-000000000000',
                    lesson_id: '00000000-0000-0000-0000-000000000000',
                    last_position_seconds: 10
                });
            if (insertError) {
                console.log('Insert error (might contain column info):', insertError.message);
            }
        }
    }
}

checkColumns();
