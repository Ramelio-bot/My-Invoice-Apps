import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Inisialisasi Supabase dengan Service Role Key untuk bypass RLS
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.trim() === '') {
    console.error("CRITICAL SECURITY ERROR: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL is missing in environment variables!");
}

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Kunci rahasia untuk validasi webhook dari Mayar
const WEBHOOK_SECRET = process.env.MAYAR_WEBHOOK_SECRET || '';

/**
 * Validates the X-Mayar-Signature header using HMAC-SHA256.
 * Returns true if valid, false otherwise.
 */
export function validateSignature(rawBody, signatureHeader, secret = WEBHOOK_SECRET) {
    if (!secret) {
        throw new Error('MAYAR_WEBHOOK_SECRET is missing');
    }
    if (!signatureHeader) return false;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expectedSig = hmac.digest('hex');

    try {
        const expectedBuf = Buffer.from(expectedSig, 'hex');
        const actualBuf = Buffer.from(signatureHeader, 'hex');
        if (expectedBuf.length !== actualBuf.length) return false;
        return crypto.timingSafeEqual(expectedBuf, actualBuf);
    } catch {
        return false;
    }
}

/**
 * Multi-signal deterministic classifier for Mayar payment payloads.
 * Strictly guarantees:
 * - PRO Monthly (Rp 49.900, slug: my-invoice-pro-bulanan)           -> { plan: 'pro', isYearly: false }
 * - PRO Annual  (Rp 470.400, slug: myinvoice-pro-annual-plan-12-bulan) -> { plan: 'pro', isYearly: true }
 * - ULTIMATE Monthly (Rp 79.900, slug: my-invoice-pro-bulanan-7spr) -> { plan: 'ultimate', isYearly: false }
 * - ULTIMATE Annual  (Rp 767.040, slug: myinvoice-ultimate-annual-plan-12-bulan) -> { plan: 'ultimate', isYearly: true }
 */
export function classifyMayarProduct(mayarData = {}) {
    const productName = String(
        mayarData.productName ||
        mayarData.product?.name ||
        mayarData.name ||
        mayarData.title ||
        mayarData.productDescription ||
        ''
    ).toLowerCase();

    const productLink = String(
        mayarData.link ||
        mayarData.slug ||
        mayarData.product?.link ||
        mayarData.paymentLink ||
        mayarData.paymentUrl ||
        ''
    ).toLowerCase();

    const rawAmount = Number(
        mayarData.amount ||
        mayarData.totalAmount ||
        mayarData.credit ||
        mayarData.nettAmount ||
        0
    );

    // 1. Determine Billing Cycle (Annual 365 days vs Monthly 30 days)
    const isYearlyByText =
        productName.includes('annual') ||
        productName.includes('tahunan') ||
        productName.includes('12 bulan') ||
        productName.includes('1 tahun') ||
        productLink.includes('annual') ||
        productLink.includes('12-bulan');

    const isYearlyByAmount = rawAmount >= 400000;
    const isYearly = isYearlyByText || isYearlyByAmount;

    // 2. Determine Plan ('pro' vs 'ultimate') — Strict Isolation
    // Check explicit ULTIMATE signals first (Name, URL slug '7spr' or 'ultimate', or exact Ultimate price points)
    const isUltimateByName = productName.includes('ultimate');
    const isUltimateBySlug = productLink.includes('ultimate') || productLink.includes('7spr');
    const isExplicitProByName = productName.includes('pro') && !productName.includes('ultimate');
    const isUltimateByAmount =
        !isExplicitProByName &&
        (rawAmount === 79900 ||
         rawAmount === 75900 ||
         rawAmount === 149000 ||
         rawAmount === 767040 ||
         rawAmount === 767000 ||
         rawAmount === 728640 ||
         rawAmount === 1430400);

    const plan = (isUltimateByName || isUltimateBySlug || isUltimateByAmount)
        ? 'ultimate'
        : 'pro';

    return { plan, isYearly, productName, productLink, rawAmount };
}

export default async function handler(req, res) {
    if (!process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL.trim() === '' || !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.trim() === '') {
        console.error("CRITICAL SECURITY ERROR: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in environment variables!");
        return res.status(500).json({ error: "Internal Server Configuration Security Error" });
    }

    if (!process.env.MAYAR_WEBHOOK_SECRET || process.env.MAYAR_WEBHOOK_SECRET.trim() === '') {
        console.error("CRITICAL SECURITY ERROR: MAYAR_WEBHOOK_SECRET is missing in environment variables!");
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
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const mayarData = payload.data || payload || {};

        const status = String(mayarData.status || '').toUpperCase();
        const customerEmail = String(
            mayarData.customerEmail ||
            mayarData.customer?.email ||
            mayarData.email ||
            ''
        ).trim().toLowerCase();
        const trxId = String(mayarData.id || mayarData.transactionId || mayarData.trxId || '').trim();

        // 1. Cek apakah status pembayaran sukses
        const isSuccess = status === 'SUCCESS' || status === 'SETTLED' || status === 'PAID';

        if (isSuccess && customerEmail && trxId) {
            // 2. Tentukan paket ('pro' vs 'ultimate') & durasi (30 vs 365 hari) secara deterministik
            const { plan: newPlan, isYearly } = classifyMayarProduct(mayarData);

            // Idempotency guard: skip if this trx was already processed in mayar_transactions
            const { data: existing, error: fetchError } = await supabase
                .from('mayar_transactions')
                .select('id')
                .eq('trx_id', trxId)
                .maybeSingle();

            if (fetchError) {
                console.error('[WEBHOOK] Idempotency check failed:', fetchError.message || fetchError);
            } else if (existing) {
                console.log('[WEBHOOK] Duplicate webhook skipped for trx:', trxId);
                return res.status(200).json({ message: 'OK_ALREADY_PROCESSED' });
            }

            // 3. Cari user di tabel profiles secara case-insensitive (.ilike)
            const { data: userProfile, error: profileFetchError } = await supabase
                .from('profiles')
                .select('id, email, plan, pro_expires_at')
                .ilike('email', customerEmail)
                .maybeSingle();

            if (profileFetchError) {
                console.warn('[WEBHOOK] Could not fetch profile by email:', profileFetchError.message || profileFetchError);
            }

            const claimedBy = userProfile ? userProfile.id : null;

            // 4. INSERT ke mayar_transactions
            const { error: insertError } = await supabase
                .from('mayar_transactions')
                .insert({
                    trx_id: trxId,
                    email: customerEmail,
                    plan: newPlan,
                    is_yearly: isYearly,
                    status: 'SUCCESS',
                    claimed_by: claimedBy
                });

            if (insertError) {
                console.error('[WEBHOOK] Insert failed (possible duplicate):', insertError.message || insertError);
                return res.status(200).json({ message: 'OK_DUPLICATE_REJECTED' });
            }

            console.log('[WEBHOOK] Insert mayar_transactions success:', customerEmail, '=>', newPlan, 'isYearly:', isYearly, 'claimedBy:', claimedBy);

            // 5. Jika user terdaftar, langsung lakukan auto-upgrade ke tabel profiles sesuai paket yang dibeli
            if (userProfile) {
                const now = new Date();
                const currentExpiry = userProfile.pro_expires_at ? new Date(userProfile.pro_expires_at) : now;
                const baseDate = currentExpiry > now ? currentExpiry : now;
                const daysToAdd = isYearly ? 365 : 30;
                baseDate.setDate(baseDate.getDate() + daysToAdd);

                const { error: profileUpdateError } = await supabase
                    .from('profiles')
                    .update({
                        plan: newPlan,
                        pro_expires_at: baseDate.toISOString(),
                        last_payment_trx_id: trxId,
                        trial_ends_at: null
                    })
                    .eq('id', userProfile.id);

                if (profileUpdateError) {
                    console.error('[WEBHOOK] Auto-upgrade profile failed:', profileUpdateError.message || profileUpdateError);
                } else {
                    console.log('[WEBHOOK] Auto-upgrade profile SUCCESS for:', customerEmail, '=>', newPlan, 'until:', baseDate.toISOString());
                }
            }
        } else {
            console.log('[WEBHOOK] Skipped: not successful or email/trxId missing.', { status, customerEmail, trxId });
        }
    } catch (err) {
        console.error('[WEBHOOK] Critical processing error:', err.message);
    }

    // SELALU kembalikan 200 OK agar Mayar tidak retry tanpa henti
    return res.status(200).json({ message: 'OK' });
}
