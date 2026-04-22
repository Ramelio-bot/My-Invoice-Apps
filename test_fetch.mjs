import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const e = fs.readFileSync('.env', 'utf-8');
const supabase = createClient(e.match(/VITE_SUPABASE_URL=(.+)/)[1].trim(), e.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim());

supabase.from('cashbook').select('*').order('created_at', {ascending: false}).limit(5).then(res => console.log(JSON.stringify(res, null, 2)));
