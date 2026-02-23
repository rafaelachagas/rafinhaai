
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zldmjdwjmsgqhhhzrwtm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZG1qZHdqbXNncWhoaHpyd3RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTEyNDcyMCwiZXhwIjoyMDg2NzAwNzIwfQ.hqZKd1fyFjufShSuqheKunz18Y0ul4SguV77G9B8D14';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    const columnsToTest = ['updated_at', 'created_at', 'completed_at', 'last_watched_at'];

    for (const col of columnsToTest) {
        const { error } = await supabase
            .from('user_lesson_progress')
            .select(col)
            .limit(1);

        if (error) {
            console.log(`Column ${col}: MISSING (${error.message})`);
        } else {
            console.log(`Column ${col}: PRESENT`);
        }
    }
}

check();
