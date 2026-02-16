import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    console.log('--- DIAGNÓSTICO DE BANCO DE DADOS ---');
    console.log('URL:', supabaseUrl);

    try {
        // Tenta pegar uma linha da tabela profiles
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Erro ao consultar a tabela profiles:', error.message);

            // Tenta ver se a tabela existe pelo menos
            const { error: tableError } = await supabaseAdmin
                .from('profiles')
                .select('count')
                .limit(1);

            if (tableError) {
                console.error('A tabela profiles parece não existir ou está inacessível:', tableError.message);
            }
            return;
        }

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log('Colunas encontradas na tabela profiles:', columns);

            const hasFullName = columns.includes('full_name');
            const hasCpf = columns.includes('cpf');

            console.log('Possui full_name?', hasFullName ? '✅ SIM' : '❌ NÃO');
            console.log('Possui cpf?', hasCpf ? '✅ SIM' : '❌ NÃO');
        } else {
            console.log('A tabela profiles está vazia. Vou tentar obter a estrutura de outra forma...');
            // Se estiver vazia, tentar um insert e rollback não é fácil aqui, mas podemos tentar um select de colunas específicas
            const { error: testError } = await supabaseAdmin.from('profiles').select('full_name, cpf').limit(1);
            if (testError) {
                console.log('Erro ao tentar selecionar full_name/cpf:', testError.message);
            } else {
                console.log('As colunas parecem existir (select individual funcionou).');
            }
        }
    } catch (err) {
        console.error('Erro inesperado:', err);
    }
}

checkColumns();
