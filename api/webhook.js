import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase dengan Service Role Key untuk bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
    // HEALTH CHECK: Jika dipanggil dengan GET, kembalikan status OK
    // Ini berguna untuk memastikan endpoint bisa diakses via browser
    if (req.method === 'GET') {
        return res.status(200).json({ 
            status: 'API is ACTIVE', 
            message: 'Send a POST request with Mayar webhook payload to process billing.' 
        });
    }

    // Pastikan hanya menerima request POST untuk webhook
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // PROTEKSI PARSING: Pastikan req.body diparse jika berupa string
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        console.log('--- MAYAR WEBHOOK START ---');
        console.log('Full Payload:', JSON.stringify(payload, null, 2));

        // UBAH LOGIKA PARSING: Data dari Mayar dibungkus dalam objek "data"
        const mayarData = payload.data || {};
        console.log('Extracted Data:', JSON.stringify(mayarData, null, 2));

        // Gunakan nama variabel yang persis sesuai JSON Mayar
        const status = mayarData.status; // 'SUCCESS'
        const customerEmail = (mayarData.customerEmail || '').trim();
        const productName = (mayarData.productName || '').toLowerCase();
        const trxId = mayarData.id;

        console.log('Parsed Variables:', { status, customerEmail, productName, trxId });

        // 1. Cek apakah status pembayaran sukses
        const isSuccess = status === 'SUCCESS' || status === 'settled';

        if (isSuccess && customerEmail) {
            // 2. Tentukan paket
            const newPlan = productName.includes('ultimate') ? 'ultimate' : 'pro';
            const customerName = mayarData.customerName || 'Customer';
            
            console.log(`Upserting profile for email: ${customerEmail} with plan: ${newPlan}`);

            // 3. UPSERT database Supabase
            // Menggunakan .upsert() agar jika email TIDAK ADA, maka akan INSERT otomatis.
            // onConflict: 'email' memastikan jika email ADA, maka akan UPDATE.
            const { data: upsertResult, error } = await supabase
                .from('profiles')
                .upsert({ 
                    email: customerEmail,
                    plan: newPlan,
                    full_name: customerName,
                    last_payment_trx_id: trxId,
                    updated_at: new Date().toISOString()
                }, { 
                    onConflict: 'email',
                    ignoreDuplicates: false 
                })
                .select();

            if (error) {
                console.error('[SUPABASE ERROR] Upsert profile failed:', error);
            } else {
                console.log('[SUPABASE SUCCESS] Upsert response:', JSON.stringify(upsertResult, null, 2));
                console.log(`Successfully processed billing for ${customerEmail} (${newPlan} plan).`);
            }
        } else {
            console.log('Payment not successful or email missing, skipping update.');
        }

        console.log('--- MAYAR WEBHOOK END ---');
    } catch (err) {
        console.error('[CRITICAL] Webhook processing error:', err.message);
    }

    // SELALU kembalikan 200 OK
    return res.status(200).json({ message: 'OK' });
}