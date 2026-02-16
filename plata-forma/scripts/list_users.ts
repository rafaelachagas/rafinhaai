import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listUsers() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, role, full_name')

    if (error) {
        console.error('Error fetching profiles:', error)
        return
    }

    console.log('--- Current Profiles ---')
    console.table(profiles)
}

listUsers()
进展
