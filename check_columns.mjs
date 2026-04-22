import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const e = fs.readFileSync('.env', 'utf-8');
const s = createClient(e.match(/VITE_SUPABASE_URL=(.+)/)[1].trim(), e.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim());

async function checkColumns(table) {
    const { data, error } = await s.from(table).select('*').limit(1);
    if (error) {
        console.log(`Table ${table} error:`, error.message);
    } else {
        console.log(`Table ${table} columns:`, data[0] ? Object.keys(data[0]) : 'Empty table');
    }
}

async function run() {
    await checkColumns('cashbook');
    await checkColumns('documents');
    await checkColumns('kasir_transactions');
    await checkColumns('kasir_expenses');
}
run();
