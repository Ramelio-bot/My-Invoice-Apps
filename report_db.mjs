import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrzdcqnezhcezitolkuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyemRjcW5lemhjZXppdG9sa3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDkxMjcsImV4cCI6MjA4NzAyNTEyN30.aOlcHD911yhTYtvJnbXysW9z5UQXzk7CwtP9FczuOnM';

async function generateReport() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("--- FINAL DIAGNOSTIC REPORT ---");
    console.log("Supabase URL:", supabaseUrl);
    
    // Check table existence and columns via a trick (select * with 0 rows)
    const { data: colsData, error: colsErr } = await supabase.from('kasir_products').select('*').limit(0);
    
    if (colsErr) {
        console.error("CRITICAL ERROR: Could not access 'kasir_products' table.");
        console.error("Message:", colsErr.message);
        console.error("Code:", colsErr.code);
        return;
    }

    // PostgREST might not return keys for empty select * in some cases, so let's try a specific error-triggering select
    const testCols = ['product_type', 'unit', 'min_stock', 'user_id', 'sku'];
    for (const col of testCols) {
        const { error } = await supabase.from('kasir_products').select(col).limit(1);
        if (error) {
            console.log(`Column [${col}]: NOT FOUND (Error: ${error.message})`);
        } else {
            console.log(`Column [${col}]: EXISTS`);
        }
    }
}

generateReport();
