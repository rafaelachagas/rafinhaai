
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLessonColumns() {
    console.log('Fetching a single row from lessons to see column names...');
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('No data found in lessons. Trying to fetch schema info...');
            // In Supabase, if select * returns no data, we can't easily see columns without data or RPC
            // But usually there is data. Let's try to get one row even if it's hidden by RLS (maybe it won't be)
        }
    }
}

checkLessonColumns();
