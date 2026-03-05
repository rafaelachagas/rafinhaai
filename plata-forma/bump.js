const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    await supabase.from('profiles').update({ login_count: 1, last_active_at: new Date().toISOString() }).eq('login_count', 0);
    console.log('Bumped login counts for existing 0-access profiles.');
}
run();
