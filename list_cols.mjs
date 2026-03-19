import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrzdcqnezhcezitolkuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyemRjcW5lemhjZXppdG9sa3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDkxMjcsImV4cCI6MjA4NzAyNTEyN30.aOlcHD911yhTYtvJnbXysW9z5UQXzk7CwtP9FczuOnM';

async function listColumns() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("--- Detailed Column Check for 'kasir_products' ---");
    
    // Try to select exactly the columns we expect
    const { error: e1 } = await supabase.from('kasir_products').select('product_type').limit(1);
    const { error: e2 } = await supabase.from('kasir_products').select('unit').limit(1);
    const { error: e3 } = await supabase.from('kasir_products').select('min_stock').limit(1);

    console.log("product_type check:", e1 ? "MISSING (" + e1.message + ")" : "EXISTS");
    console.log("unit check:", e2 ? "MISSING (" + e2.message + ")" : "EXISTS");
    console.log("min_stock check:", e3 ? "MISSING (" + e3.message + ")" : "EXISTS");

    if (!e1 && !e2 && !e3) {
        console.log("--- ALL COLUMNS FOUND! ---");
    } else {
        console.log("--- SOME COLUMNS STILL MISSING ---");
    }
}

listColumns();
