import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking kasir_shifts...");
    const { data: shifts, error: shiftsError } = await supabase
        .from('kasir_shifts')
        .select('*')
        .limit(1);
    
    if (shiftsError) {
        console.error("Error fetching kasir_shifts:", shiftsError);
    } else {
        console.log("kasir_shifts columns if row exists:", shifts && shifts.length > 0 ? Object.keys(shifts[0]) : "No rows, but query succeeded");
    }

    console.log("\nChecking cashbook...");
    const { data: cb, error: cbError } = await supabase
        .from('cashbook')
        .select('*')
        .limit(1);
    
    if (cbError) {
        console.error("Error fetching cashbook:", cbError);
    } else {
        console.log("cashbook columns if row exists:", cb && cb.length > 0 ? Object.keys(cb[0]) : "No rows, but query succeeded");
    }
}

checkSchema();
