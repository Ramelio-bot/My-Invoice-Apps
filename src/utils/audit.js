import { supabase } from '../lib/supabase';

/**
 * Record an audit log entry to Supabase
 * @param {string} action - 'DELETE', 'UPDATE_STOCK', 'MANUAL_ADJUST', etc.
 * @param {string} module - 'Kasir', 'Invoice', 'Klien', 'CatatanBisnis'
 * @param {string} description - Detailed description (e.g. 'Deleted Invoice #INV-001')
 * @param {string} reason - The user-provided reason
 * @param {string} severity - 'info', 'warning', 'critical'
 * @param {Object} metadata - Optional extra data
 */
export async function recordAudit(action, module, description, reason, severity = 'info', metadata = {}) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('audit_logs').insert({
            user_id: user.id,
            action,
            module,
            description,
            reason: reason || 'N/A',
            severity,
            metadata,
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error('[AUDIT] Failed to record:', error);
        }
    } catch (err) {
        console.error('[AUDIT] Error:', err);
    }
}
