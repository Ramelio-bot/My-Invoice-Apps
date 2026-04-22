import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const e = fs.readFileSync('.env', 'utf-8');
const s = createClient(e.match(/VITE_SUPABASE_URL=(.+)/)[1].trim(), e.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim());

async function checkCol(table) {
    const { error } = await s.from(table).select('outlet_id').limit(1);
    if (error) {
        console.log(`Table ${table} has NO outlet_id: ${error.message}`);
    } else {
        console.log(`Table ${table} HAS outlet_id`);
    }
}

async function run() {
    await checkCol('cashbook');
    await checkCol('documents');
    await checkCol('kasir_transactions');
    await checkCol('kasir_expenses');
}
run();
