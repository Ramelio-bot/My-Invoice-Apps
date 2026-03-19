import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://xrzdcqnezhcezitolkuu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyemRjcW5lemhjZXppdG9sa3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDkxMjcsImV4cCI6MjA4NzAyNTEyN30.aOlcHD911yhTYtvJnbXysW9z5UQXzk7CwtP9FczuOnM'
);

async function checkSchema() {
    console.log(`--- Checking at: ${new Date().toISOString()} ---`);
    
    // Check if product_type exists by trying to select it
    const { error: colErr } = await supabase.from('kasir_products').select('product_type').limit(1);
    if (colErr && colErr.message.includes('column kasir_products.product_type does not exist')) {
        console.log('FAIL: Column [product_type] STILL DOES NOT EXIST.');
    } else if (colErr) {
        console.log('UNKNWON ERROR:', colErr.message);
    } else {
        console.log('SUCCESS: Column [product_type] IS PRESENT!');
    }

    // Try dummy insert ONLY with name
    const { data: insData, error: insErr } = await supabase.from('kasir_products').insert({ name: 'Diagnostic Test Product' }).select();
    if (insErr) {
        console.error('Insert fallback failed:', insErr.message);
    } else {
        console.log('Insert SUCCESS (only name):', insData[0].id);
        // clean up
        await supabase.from('kasir_products').delete().eq('id', insData[0].id);
    }
}

checkSchema();
