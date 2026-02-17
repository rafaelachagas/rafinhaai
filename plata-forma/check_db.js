
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('URL or Service Key missing in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .limit(10);

    if (pError) console.error('Profiles Error:', pError);
    else console.log('Profiles Sample:', profiles);

    const { data: messages, error: mError } = await supabase
        .from('messages')
        .select('id, created_at, subject, sender_id, recipient_id')
        .order('created_at', { ascending: false })
        .limit(5);

    if (mError) console.error('Messages Error:', mError);
    else console.log('Recent Messages:', messages);
}

check();
