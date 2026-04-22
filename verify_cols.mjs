import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const e = fs.readFileSync('.env', 'utf-8');
const s = createClient(e.match(/VITE_SUPABASE_URL=(.+)/)[1].trim(), e.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim());

async function check() {
    const { data: cols, error: err } = await s.rpc('get_columns_for_table', { table_name: 'cashbook' });
    if(err) {
        console.log("RPC failed:", err.message);
        // Fallback: insert a bogus column to see the error message
        const { error } = await s.from('cashbook').select('non_existent_col').limit(1);
        console.log("Error when selecting non-existent:", error?.message);
        const { error: e2 } = await s.from('cashbook').select('outlet_id').limit(1);
        console.log("Error when selecting outlet_id:", e2?.message);
    } else {
        console.log("Cols:", cols);
    }
}
check();
