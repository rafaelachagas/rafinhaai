const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://zldmjdwjmsgqhhhzrwtm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZG1qZHdqbXNncWhoaHpyd3RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTEyNDcyMCwiZXhwIjoyMDg2NzAwNzIwfQ.hqZKd1fyFjufShSuqheKunz18Y0ul4SguV77G9B8D14';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    const sql = fs.readFileSync(path.join(__dirname, 'sql_ai_history.sql'), 'utf8');

    // Split SQL by statements (naive split by ;)
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
            console.error('Error executing statement:', statement);
            console.error(error);
        } else {
            console.log('Successfully executed:', statement.substring(0, 50) + '...');
        }
    }
}

applyMigration();
