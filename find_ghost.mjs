import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function findGhost() {
    const target = 448500;
    console.log(`Searching for amount: ${target}...`);

    const tables = ['documents', 'kasir_transactions', 'cashbook', 'kasir_expenses'];
    
    for (const table of tables) {
        let query = supabase.from(table).select('*');
        if (table === 'documents') query = query.or(`total_amount.eq.${target},data->>grandTotal.eq.${target}`);
        else if (table === 'kasir_transactions') query = query.eq('total', target);
        else if (table === 'cashbook' || table === 'kasir_expenses') query = query.eq('amount', target);

        const { data, error } = await query;
        if (error) console.error(`Error searching ${table}:`, error.message);
        if (data && data.length > 0) {
            console.log(`FOUND in ${table}:`, JSON.stringify(data, null, 2));
        }
    }
}

findGhost();
