import { supabase } from '../lib/supabase';

/**
 * Record an audit log entry to Supabase.
 * 
 * ROOT PAYLOAD hanya berisi kolom yang PASTI ada di schema:
 *   user_id, action, module, details (JSONB)
 * 
 * Semua data tambahan (description, reason, severity, metadata) dimasukkan
 * ke dalam `details` (JSONB) agar tidak memicu HTTP 400 "Schema Mismatch".
 * 
 * @param {string} action - 'DELETE', 'UPDATE_STOCK', 'MANUAL_ADJUST', etc.
 * @param {string} module - 'Kasir', 'Invoice', 'Klien', 'CatatanBisnis', etc.
 * @param {string} description - Detailed description (e.g. 'Deleted Invoice #INV-001')
 * @param {string} reason - The user-provided reason for the action
 * @param {string} severity - 'info', 'warning', 'critical'
 * @param {Object} metadata - Optional extra data (amounts, IDs, etc.)
 */
export async function recordAudit(action, module, description, reason, severity = 'info', metadata = {}) {
    try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            console.warn('[AUDIT] Skipped — user not authenticated.');
            return;
        }

        // ✅ ROOT PAYLOAD AMAN: Hanya kolom yang dijamin ada di tabel audit_logs.
        // ❌ JANGAN tambahkan kolom lain di sini (akan memicu 400 Bad Request!).
        // Semua data ekstra masuk ke dalam `details` (JSONB) di bawah.
        const payload = {
            user_id: user.id,
            action: action,
            module: module,
            details: {
                description: description || '',
                reason: reason || 'N/A',
                severity: severity || 'info',
                timestamp: new Date().toISOString(),
                ...metadata
            }
        };

        const { error } = await supabase.from('audit_logs').insert(payload);

        if (error) {
            // Log lengkap untuk debugging: tampilkan payload dan error detail
            console.error('[AUDIT] INSERT Failed — Payload:', JSON.stringify(payload, null, 2));
            console.error('[AUDIT] Supabase Error:', error.code, error.message, error.details);
        }
    } catch (err) {
        console.error('[AUDIT] Unexpected Error:', err);
    }
}
