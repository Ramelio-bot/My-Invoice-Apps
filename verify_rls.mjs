import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const e = fs.readFileSync('.env', 'utf-8');
const s = createClient(e.match(/VITE_SUPABASE_URL=(.+)/)[1].trim(), e.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim());

async function diagnose() {
    const testPayload = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'income',
        amount: 1000,
        category: 'Test',
        date: new Date().toISOString().split('T')[0]
    };
    
    console.log('Testing insert to see if RLS is fixed...');
    const { error: insError } = await s.from('cashbook').insert(testPayload);
    if (insError) {
        console.log('INSERT ERROR:', insError.code, insError.message);
    } else {
        console.log('INSERT SUCCESS');
    }
}

diagnose();
