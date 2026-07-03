import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Inisialisasi Supabase dengan Service Role Key untuk bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Kunci rahasia untuk validasi webhook dari Mayar
const WEBHOOK_SECRET = process.env.MAYAR_WEBHOOK_SECRET || '';

/**
 * Validates the X-Mayar-Signature header using HMAC-SHA256.
 * Returns true if valid, false otherwise.
 */
function validateSignature(rawBody, signatureHeader) {
    if (!WEBHOOK_SECRET) {
        throw new Error('MAYAR_WEBHOOK_SECRET is missing');
    }
    if (!signatureHeader) return false;

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(rawBody);
    const expectedSig = hmac.digest('hex');

    // Safe comparison using timingSafeEqual to prevent timing attacks
    try {
        const expectedBuf = Buffer.from(expectedSig, 'hex');
        const actualBuf = Buffer.from(signatureHeader, 'hex');
        if (expectedBuf.length !== actualBuf.length) return false;
        return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
        return false;
    }
}

export default async function handler(req, res) {
    if (!process.env.MAYAR_WEBHOOK_SECRET || process.env.MAYAR_WEBHOOK_SECRET.trim() === '') {
        console.error("🚨 CRITICAL SECURITY ERROR: MAYAR_WEBHOOK_SECRET is missing in environment variables!");
        return res.status(500).json({ error: "Internal Server Configuration Security Error" });
    }

    // HEALTH CHECK: Jika dipanggil dengan GET, kembalikan status OK
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

    // === SECURITY: Validate X-Mayar-Signature ===
    const signatureHeader = req.headers['x-mayar-signature'] || '';
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    if (!validateSignature(rawBody, signatureHeader)) {
        console.warn('[SECURITY] Invalid or missing X-Mayar-Signature. Request rejected.');
        return res.status(401).json({ message: 'Unauthorized: Invalid signature.' });
    }
    console.log('[SECURITY] Signature validated OK.');

    try {
        // PROTEKSI PARSING: Pastikan req.body diparse jika berupa string
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        // Data dari Mayar dibungkus dalam objek "data"
        const mayarData = payload.data || {};

        const status = mayarData.status;
        const customerEmail = (mayarData.customerEmail || '').trim().toLowerCase();
        const productName = (mayarData.productName || '').toLowerCase();
        const trxId = mayarData.id;

        // 1. Cek apakah status pembayaran sukses
        const isSuccess = status === 'SUCCESS' || status === 'settled';

        if (isSuccess && customerEmail) {
            // 2. Tentukan paket
            const newPlan = productName.includes('ultimate') ? 'ultimate' : 'pro';
            const customerName = mayarData.customerName || 'Customer';

            // 3. UPSERT database Supabase
            const { data: upsertResult, error } = await supabase
                .from('profiles')
                .upsert({
                    email: customerEmail,
                    full_name: customerName,
                    plan: newPlan,
                    last_payment_trx_id: trxId,
                    last_payment_id: trxId,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'email',
                    ignoreDuplicates: false
                })
                .select();

            if (error === null) {
                console.log('[WEBHOOK] Upsert plan success:', customerEmail, '=>', newPlan);
            } else {
                console.error('[WEBHOOK] Upsert failed:', error.message || error);
            }
        } else {
            console.log('[WEBHOOK] Skipped: not successful or email missing.');
        }
    } catch (err) {
        console.error('[WEBHOOK] Critical processing error:', err.message);
    }

    // SELALU kembalikan 200 OK agar Mayar tidak retry
    return res.status(200).json({ message: 'OK' });
}