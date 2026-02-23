
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMessages() {
    console.log('Checking messages table...');
    const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .limit(5)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching messages:', error);
    } else {
        console.log('Total messages:', count);
        console.log('Recent messages:', data);
    }

    console.log('\nChecking students count...');
    const { data: students, error: studentError, count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .neq('role', 'admin');

    if (studentError) {
        console.error('Error fetching students:', studentError);
    } else {
        console.log('Total students (non-admins):', studentCount);
        if (students) {
            console.log('Sample students:', students.map(s => ({ id: s.id, role: s.role, email: s.email })));
        }
    }
}

checkMessages();
