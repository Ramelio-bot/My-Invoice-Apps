import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const e = fs.readFileSync('.env', 'utf-8');
const supabase = createClient(e.match(/VITE_SUPABASE_URL=(.+)/)[1].trim(), e.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim());

async function t() {
    const payload = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'income',
        amount: 500,
        category: 'Test',
        date: '2026-04-22',
        outlet_id: null
    };
    const {data, error} = await supabase.from('cashbook').insert(payload).select().single();
    console.log(error);
}
t();
