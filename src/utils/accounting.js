/**
 * Shared accounting deduplication rules across Dashboard, Laporan, and POS Reports.
 *
 * Cashbook stores both direct entries (manual Business Notes, standalone Kwitansi,
 * settled Hutang/Piutang) and mirror entries generated from POS sales, POS expenses,
 * and Paid Invoices so users can view a complete ledger in Catatan Bisnis.
 *
 * When aggregating realized Income/Expense alongside `kasir_transactions`,
 * `kasir_expenses`, and paid `documents` (`invoice`/`inv`), mirror rows in `cashbook`
 * must be excluded so every Rupiah is counted exactly once.
 */
const MIRROR_CASHBOOK_CATEGORIES = new Set([
    'Penjualan Kasir',
    'Pengeluaran Kasir',
    'Operasional Kasir',
    'Cashier Expenses',
]);

const MIRROR_REFERENCE_TYPES = new Set([
    'kasir_sale',
    'kasir_expense',
    'invoice_paid',
]);

export function isMirrorCashbookRow(row) {
    if (!row) return false;
    if (MIRROR_CASHBOOK_CATEGORIES.has(row.category)) return true;
    if (MIRROR_REFERENCE_TYPES.has(row.reference_type)) return true;
    const desc = row.description || row.note || '';
    if (row.is_automated && /^Invoice\s+\S+/i.test(desc)) return true;
    if (/^Invoice\s+\S+\s+-\s+.+-\s+(Lunas|Paid)$/i.test(desc)) return true;
    return false;
}

export function isUnpaidStatus(status) {
    return ['unpaid', 'waiting', 'Belum Bayar', 'Menunggu'].includes(status);
}

export function isPaidStatus(status) {
    return ['paid', 'Lunas'].includes(status);
}
