import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase dengan Service Role Key untuk bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
    // Pastikan hanya menerima request POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;
        console.log('Mayar Webhook received:', JSON.stringify(payload, null, 2));

        // Ekstrak data fundamental dari payload Mayar
        const status = payload.status; // 'SUCCESS' atau 'settled'
        const customerEmail = payload.customer?.email;
        const productName = (payload.product_name || '').toLowerCase();
        const paymentLink = (payload.payment_link || '').toLowerCase();
        const trxId = payload.id; // ID transaksi unik dari Mayar

        // 1. Cek apakah status pembayaran sukses
        const isSuccess = status === 'SUCCESS' || status === 'settled';

        if (isSuccess && customerEmail) {
            // 2. Tentukan paket berdasarkan nama produk atau link
            // Jika ada kata 'ultimate', set ultimate. Selain itu set pro.
            const newPlan = (productName.includes('ultimate') || paymentLink.includes('ultimate')) 
                ? 'ultimate' 
                : 'pro';

            console.log(`Processing plan upgrade for ${customerEmail} to ${newPlan}`);

            // 3. Update tabel profiles berdasarkan email
            // Kita juga update last_payment_trx_id untuk audit/mencegah proses ganda jika perlu
            const { data, error } = await supabase
                .from('profiles')
                .update({ 
                    plan: newPlan,
                    last_payment_trx_id: trxId,
                    updated_at: new Date().toISOString()
                })
                .eq('email', customerEmail);

            if (error) {
                console.error('Error updating profile plan:', error);
            } else {
                console.log(`Successfully updated ${customerEmail} to ${newPlan} plan.`);
            }
        } else {
            console.log('Payment not successful or email missing, skipping update.');
        }

    } catch (err) {
        console.error('Webhook processing error:', err.message);
    }

    // SELALU kembalikan 200 OK agar Mayar berhenti melakukan retry
    return res.status(200).json({ message: 'OK' });
}
