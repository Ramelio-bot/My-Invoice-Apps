import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const e = fs.readFileSync('.env', 'utf-8');
const s = createClient(e.match(/VITE_SUPABASE_URL=(.+)/)[1].trim(), e.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim());

s.from('cashbook').select('does_not_exist_col_123').limit(1).then(res => console.log('FAKE COL ERROR:', res.error));
