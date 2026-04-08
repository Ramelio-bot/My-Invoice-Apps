import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipe() {
    console.log("Wiping non-POS automated entries from cashbook...");
    const adminCategories = ['Kwitansi', 'Invoice Lunas', 'Lunas', 'Pembayaran Piutang', 'Pembayaran Hutang'];
    
    const { error } = await supabase.from('cashbook').delete().in('category', adminCategories);
    
    if (error) {
        console.error("Wipe failed:", error);
    } else {
        console.log("Wipe completed successfully. Audit counter reset.");
    }
    process.exit(0);
}

wipe();
