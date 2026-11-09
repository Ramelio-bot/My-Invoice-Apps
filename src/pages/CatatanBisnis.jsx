import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, Trash2, PlusCircle, X, Image as ImageIcon, EyeIcon, ArrowRight, Download, Lock, FileSpreadsheet } from 'lucide-react';

import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import { formatDateID, todayStr, isThisWeek, isThisMonth } from '../utils/date';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LimitModal from '../components/LimitModal';

import DeleteReasonModal from '../components/DeleteReasonModal';
import { useOutlet } from '../context/OutletContext';

const INCOME_CATEGORIES = (t) => [
    t('cb_cat_sale'), t('cb_cat_service'), t('cb_cat_dp'), t('cb_cat_inv'), t('cb_cat_other')
];
const EXPENSE_CATEGORIES = (t) => [
    t('cb_cat_raw'), t('cb_cat_salary'), t('cb_cat_rent'), t('cb_cat_util'), t('cb_cat_trans'),
    t('cb_cat_market'), t('cb_cat_tools'), t('cb_cat_tax'), t('cb_cat_ship'), t('cb_cat_other')
];

export default function CatatanBisnis() {
    const { t, lang } = useLang();
    const isEn = lang === 'EN';
    const { showToast } = useToast();
    const { isPro, isFree, checkCashbookLimit, getCashbookCount, currentLimits } = usePlan();
    const navigate = useNavigate();
    const { user, canAccessMultiOutlet } = useAuth();
    const { activeOutlet } = useOutlet() || {};

    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('income');
    const [filter, setFilter] = useState('all');
    // Riwayat type filter: 'all' | 'income' | 'expense'
    const [typeFilter, setTypeFilter] = useState('all');
    const [form, setForm] = useState({ amount: '', category: '', note: '', date: todayStr(), bukti: null });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [buktiBig, setBuktiBig] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const fileRef = useRef(null);

    const fetchEntries = useCallback(async (isInitial = false) => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        if (isInitial) setIsLoading(true);
        try {
            let query = supabase
                .from('cashbook')
                .select('id, type, amount, date, category, description, outlet_id, created_at, receipt_url, document_id, reference_type, reference_id, is_automated')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (activeOutlet?.id) {
                query = query.or(`outlet_id.eq.${activeOutlet.id},outlet_id.is.null`);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const mapped = data.map(d => ({
                    id: d.id,
                    type: d.type,
                    amount: d.amount,
                    category: d.category,
                    note: d.description,
                    date: d.date,
                    bukti: d.receipt_url,
                    reference_type: d.reference_type || null,
                    reference_id: d.reference_id || d.document_id || null,
                    is_automated: Boolean(d.is_automated),
                    createdAt: d.created_at,
                    source: (d.is_automated || d.document_id || d.reference_type) ? 'auto' : 'manual'
                }));
                setEntries(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch cashbook:', err);
            showToast(t('cb_toast_load_fail'), 'error');
            setEntries([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, activeOutlet?.id, t, showToast]);

    useEffect(() => {
        if (user) {
            fetchEntries(true);
        }

        // Listener untuk Auto-Refresh jika ada update dari komponen/halaman lain
        const handleAutoRefresh = () => {
            if (user) fetchEntries();
        };

        window.addEventListener('cashbook-updated', handleAutoRefresh);
        window.addEventListener('data-updated', handleAutoRefresh);

        return () => {
            window.removeEventListener('cashbook-updated', handleAutoRefresh);
            window.removeEventListener('data-updated', handleAutoRefresh);
        };
    }, [user, fetchEntries]);

    // Filtered entries (date + type)
    const filtered = useMemo(() => {
        return entries
            .filter(e => {
                const dateMatch = (() => {
                    if (filter === 'today') return e.date === todayStr();
                    if (filter === 'week') return isThisWeek(e.date);
                    if (filter === 'month') return isThisMonth(e.date);
                    return true;
                })();
                const typeMatch = typeFilter === 'all' ? true : e.type === typeFilter;
                return dateMatch && typeMatch;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [entries, filter, typeFilter]);

    // Group by date
    const grouped = useMemo(() => {
        const groups = {};
        filtered.forEach(e => {
            if (!groups[e.date]) groups[e.date] = [];
            groups[e.date].push(e);
        });
        return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
    }, [filtered]);

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        
        // [GUARD] Cegah Double-Submission / Race Condition
        if (loading) return;
        
        // [OPERASI SADAP DATA] — Outlet Validation Guard
        if (canAccessMultiOutlet() && !activeOutlet?.id) {
            showToast(isEn ? "Active Outlet not detected! Please select an outlet first." : "Active Outlet tidak terdeteksi! Silakan pilih outlet terlebih dahulu.", 'error');
            return;
        }

        if (!checkCashbookLimit()) {
            showToast(t('cb_toast_limit'), 'warning');
            navigate('/upgrade');
            return;
        }
        const cleanAmount = parseInt(form.amount.toString().replace(/\D/g, ''), 10);
        if (!cleanAmount || !form.category) {
            showToast(t('cb_toast_required'), 'error');
            return;
        }

        // Persist to Supabase with Absolute User Integrity
        const formattedDate = form.date || todayStr(); 
        
        if (!user || !user.id) {
            showToast(t('auth_error_not_logged_in'), 'error');
            return;
        }

        const payload = {
            user_id: user.id,
            type: tab === 'income' ? 'income' : 'expense',
            amount: cleanAmount,
            category: form.category,
            description: form.note || null,
            date: formattedDate,
            // [OPERASI SARINGAN OUTLET MURNI] — Hanya kirim UUID sah
            outlet_id: (activeOutlet?.id && activeOutlet.id.length > 30) ? activeOutlet.id : null,
            is_automated: false // Explicitly manual entry
        };

        if (form.bukti) {
            payload.receipt_url = form.bukti;
        }

        // [OPERASI STRIP ID] — Bersihkan Payload secara Total
        delete payload.id;

        setLoading(true);
        try {
            let res;
            if (editingId) {
                // Mode Update/Edit (Jangkar ID terpasang)
                res = await supabase
                    .from('cashbook')
                    .update(payload)
                    .eq('id', editingId)
                    .select()
                    .single();
            } else {
                // Mode Insert (Kesucian ID Database)
                res = await supabase
                    .from('cashbook')
                    .insert(payload)
                    .select()
                    .single();
            }

            const { data: savedData, error } = res;

            // [OPERASI SADAP DATA] — Dihapus untuk production

            if (error) throw error;

            if (savedData) {
                const mapped = {
                    id: savedData.id,
                    type: savedData.type,
                    amount: savedData.amount,
                    category: savedData.category,
                    note: savedData.description,
                    date: savedData.date,
                    bukti: savedData.receipt_url,
                    createdAt: savedData.created_at,
                    source: 'manual'
                };
                
                if (editingId) {
                    setEntries(prev => prev.map(e => e.id === editingId ? mapped : e));
                    setEditingId(null);
                } else {
                    setEntries(prev => [mapped, ...prev]);
                }
                
                setForm({ amount: '', category: '', note: '', date: todayStr(), bukti: null });
                if (fileRef.current) fileRef.current.value = '';
                showToast(t('cb_toast_saved'), 'success');
                
                // Pemicu sync untuk Dashboard tanpa memicu refresh list di sini
                // (Catatan: fetchEntries() tidak lagi membabi buta karena kita update state lokal)
                window.dispatchEvent(new Event('external-sync'));
                window.dispatchEvent(new Event('cashbook-updated'));
                window.dispatchEvent(new Event('data-updated'));
            }
        } catch (error) {
            console.error('Cashbook save error detail:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                payload
            });
            showToast((isEn ? "SYSTEM ERROR (409/Conflict): " : "KESALAHAN SISTEM (409/Conflict): ") + (error.message || "Unique Constraint Violation"), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (item) => {
        if (isPro) {
            setDeleteConfirm(item);
        } else {
            if (window.confirm(t('confirm_delete') || 'Hapus catatan ini?')) {
                performDelete(item.id, 'N/A');
            }
        }
    };

    const performDelete = async (id, _reason) => {
        const item = entries.find(e => e.id === id);
        if (!item) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('cashbook').delete().eq('id', id).eq('user_id', user.id);
            if (error) throw error;

            const noteStr = item.note || '';

            // 1. POS Sale mirror -> delete POS transaction
            if (item.reference_type === 'kasir_sale' || item.category === 'Penjualan Kasir') {
                if (item.reference_id) {
                    await supabase.from('kasir_transaction_items').delete().eq('transaction_id', item.reference_id).eq('user_id', user.id);
                    await supabase.from('kasir_transactions').delete().eq('id', item.reference_id).eq('user_id', user.id);
                } else {
                    const match = noteStr.match(/(POS-\d+|RCW-\d+|SIM-\d+|TRX-\d+|[A-Z0-9-]{6,})/);
                    const receiptNum = match ? match[0] : null;
                    if (receiptNum) {
                        await supabase.from('kasir_transactions').delete().eq('receipt_number', receiptNum).eq('user_id', user.id);
                    }
                }
            }
            // 2. POS Expense mirror -> delete POS expense
            else if (item.reference_type === 'kasir_expense' || ['Pengeluaran Kasir', 'Operasional Kasir', 'Cashier Expenses'].includes(item.category)) {
                if (item.reference_id) {
                    await supabase.from('kasir_expenses').delete().eq('id', item.reference_id).eq('user_id', user.id);
                } else {
                    await supabase.from('kasir_expenses')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('amount', item.amount)
                        .eq('date', item.date);
                }
            }
            // 3. Paid Invoice mirror -> revert Invoice status back to unpaid
            else if (item.reference_type === 'invoice_paid' || /^Invoice\s+\S+/i.test(noteStr)) {
                if (item.reference_id) {
                    await supabase.from('documents')
                        .update({ status: 'unpaid' })
                        .eq('id', item.reference_id)
                        .eq('user_id', user.id);
                } else {
                    const invMatch = noteStr.match(/^Invoice\s+(\S+)/i);
                    if (invMatch?.[1]) {
                        await supabase.from('documents')
                            .update({ status: 'unpaid' })
                            .eq('doc_number', invMatch[1])
                            .in('type', ['invoice', 'inv'])
                            .eq('user_id', user.id);
                    }
                }
            }
            // 4. Settled Hutang/Piutang mirror -> revert HP status back to unpaid
            else if (['piutang_paid', 'hutang_paid'].includes(item.reference_type) || /^Pelunasan (Piutang|Hutang):/i.test(noteStr)) {
                const hpIdMatch = noteStr.match(/\(#([0-9a-f-]{20,})\)/i);
                const targetHpId = item.reference_id || hpIdMatch?.[1];
                if (targetHpId) {
                    await supabase.from('documents')
                        .update({ status: 'unpaid' })
                        .eq('id', targetHpId)
                        .eq('user_id', user.id);
                }
            }
            // 5. Standalone Kwitansi mirror -> delete linked Kwitansi document
            else if (item.reference_type === 'kwitansi_manual' || /^Pemasukan: Kwitansi #/i.test(noteStr)) {
                if (item.reference_id) {
                    await supabase.from('documents').delete().eq('id', item.reference_id).eq('user_id', user.id);
                } else {
                    const kwtMatch = noteStr.match(/Kwitansi #(\S+)/i);
                    if (kwtMatch?.[1]) {
                        await supabase.from('documents')
                            .delete()
                            .eq('doc_number', kwtMatch[1])
                            .in('type', ['kw', 'kwitansi'])
                            .eq('user_id', user.id);
                    }
                }
            }

            setEntries(prev => prev.filter(e => e.id !== id));
            
            showToast(t('cb_toast_deleted') || 'Data berhasil dihapus', 'success');
            
            window.dispatchEvent(new Event('external-sync'));
            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('invoice-updated'));
            window.dispatchEvent(new Event('piutang-updated'));
            window.dispatchEvent(new Event('kasir-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('Cashbook delete error:', err);
            showToast(t('cb_toast_delete_fail') || 'Gagal menghapus data', 'error');
        } finally {
            setLoading(false);
            setDeleteConfirm(null);
        }
    };

    const handleExportCSV = () => {
        const sanitizeCSV = (text) => {
            if (!text) return '-';
            let clean = String(text).replace(/"/g, '""');
            if (/^[=+\-@]/.test(clean)) return "'" + clean;
            clean = clean.replace(/[\r\n]+/g, ' ');
            return clean;
        };

        const filteredIncome = filtered.filter(e => e.type === 'income').reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const filteredExpense = filtered.filter(e => e.type === 'expense').reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const filteredNet = filteredIncome - filteredExpense;

        const rows = [
            [t('cb_col_date'), t('cb_csv_type'), t('cb_col_cat'), t('cb_col_note'), `${t('cb_col_amount')} (Rp)`],
            ...filtered.map(e => [
                sanitizeCSV(e.date),
                sanitizeCSV(e.type === 'income' ? t('cb_income') : t('cb_expense')),
                sanitizeCSV(e.category),
                sanitizeCSV((e.note || '-').replace(/,/g, ';')),
                e.type === 'expense' ? `-${e.amount}` : e.amount
            ])
        ];

        rows.push([t('cb_csv_summary'), '', '', '', '']);
        rows.push([t('cb_income'), '', '', '', filteredIncome]);
        rows.push([t('cb_expense'), '', '', '', filteredExpense]);
        rows.push([t('cb_csv_balance'), '', '', '', filteredNet]);

        const csvContent = rows.map(r => r.join(',')).join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CatatanBisnis-${todayStr()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = async () => {
        if (!filtered || filtered.length === 0) {
            showToast(isEn ? 'No transaction data to export' : 'Tidak ada data transaksi untuk diekspor', 'info');
            return;
        }
        try {
            const { utils, writeFile } = await import('xlsx');

            const filteredIncome = filtered.filter(e => e.type === 'income').reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const filteredExpense = filtered.filter(e => e.type === 'expense').reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const filteredNet = filteredIncome - filteredExpense;

            const rows = [
                ['No', 'Tanggal', 'Tipe Mutasi', 'Kategori', 'Keterangan', 'Pemasukan (Rp)', 'Pengeluaran (Rp)'],
                ...filtered.map((e, i) => [
                    i + 1,
                    e.date || '-',
                    e.type === 'income' ? (isEn ? 'Income' : 'Pemasukan') : (isEn ? 'Expense' : 'Pengeluaran'),
                    e.category || '-',
                    e.note || '-',
                    e.type === 'income' ? Number(e.amount || 0) : 0,
                    e.type === 'expense' ? Number(e.amount || 0) : 0
                ]),
                [],
                ['RINGKASAN ARUS KAS', '', '', '', '', '', ''],
                ['Total Pemasukan', '', '', '', '', filteredIncome, ''],
                ['Total Pengeluaran', '', '', '', '', '', filteredExpense],
                ['Saldo Bersih (Net Cashflow)', '', '', '', '', '', filteredNet]
            ];

            const wb = utils.book_new();
            const ws = utils.aoa_to_sheet(rows);
            utils.book_append_sheet(wb, ws, 'Buku Kas & Mutasi');
            writeFile(wb, `Catatan-Bisnis-Kas-${todayStr()}.xlsx`);
            showToast(isEn ? 'Cashbook exported to Excel successfully' : 'Buku kas berhasil diekspor ke Excel', 'success');
        } catch (err) {
            console.error('Export Excel error:', err);
            showToast(isEn ? 'Failed to export Excel' : 'Gagal mengekspor file Excel', 'error');
        }
    };

    const formatAmountDisplay = (val) => {
        const num = val.replace(/[^\d]/g, '');
        if (!num) return '';
        return new Intl.NumberFormat(t('locale_code')).format(parseInt(num));
    };

    const isIncome = tab === 'income';


    return (
        <div className="page-enter max-w-6xl mx-auto p-4 md:p-8 space-y-6">
            
            {/* HEADER & ACTION BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                            {t('nav_cashbook')}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {isEn ? "Cashbook Ledger" : "Buku Kas & Mutasi"}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {isEn ? "Record manual operational income and expenses alongside automated cashier receipts." : "Pencatatan arus kas masuk dan beban operasional toko secara rapi dan otomatis."}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={filtered.length === 0}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isEn ? "Export Excel (.xlsx)" : "Ekspor Excel (.xlsx)"}
                    >
                        <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />
                        <span className="hidden xs:inline">Excel (.xlsx)</span>
                        <span className="xs:hidden">XLSX</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleExportCSV}
                        disabled={filtered.length === 0}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('cb_export_csv')}
                    >
                        <Download size={14} className="text-slate-500 shrink-0" />
                        <span>CSV</span>
                    </button>
                </div>
            </div>

            {/* 2-COLUMN MODERN LAYOUT: FORM DI KIRI + LEDGER FEED DI KANAN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* PANEL FORMULIR KIRI (4 COLS) */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 lg:sticky lg:top-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {editingId ? (isEn ? "Edit Transaction" : "Ubah Transaksi") : (isEn ? "New Transaction" : "Form Transaksi")}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">
                            {editingId ? (isEn ? "Editing Mode" : "Mode Sunting") : (isEn ? "Auto Saved" : "Tersimpan Otomatis")}
                        </span>
                    </div>

                    {/* SEGMENTED TOGGLE (CLEAN & MINIMALIST) */}
                    <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                            type="button"
                            onClick={() => { setTab('income'); setForm(f => ({ ...f, category: '' })); }}
                            className={`py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                                isIncome 
                                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            + {t('cb_income')}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTab('expense'); setForm(f => ({ ...f, category: '' })); }}
                            className={`py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                                !isIncome 
                                    ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-2xs' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            - {t('cb_expense')}
                        </button>
                    </div>

                    {/* MONTHLY LIMIT BANNER (FREE PLAN) */}
                    {isFree && (
                        <div className="p-3 rounded-xl border border-violet-100 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/30 flex items-center justify-between text-xs">
                            <span className="font-semibold text-violet-800 dark:text-violet-300">
                                {getCashbookCount()}/{currentLimits?.cashbook || 20} {t('cb_limit_banner')}
                            </span>
                            <button
                                type="button"
                                onClick={() => navigate('/upgrade')}
                                className="text-[11px] font-bold text-violet-700 dark:text-violet-400 underline hover:text-violet-900"
                            >
                                Upgrade PRO
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* INPUT NOMINAL */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                {t('cb_amount')} (Rp)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                    Rp
                                </span>
                                <input
                                    value={form.amount}
                                    onChange={e => setForm(f => ({ ...f, amount: formatAmountDisplay(e.target.value) }))}
                                    placeholder="0"
                                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-base font-bold mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-400 ${
                                        isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                    }`}
                                    required
                                />
                            </div>
                        </div>

                        {/* KATEGORI */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                {t('cb_category')}
                            </label>
                            <select
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                                required
                            >
                                <option value="">{t('cb_select_category')}</option>
                                {(isIncome ? INCOME_CATEGORIES(t) : EXPENSE_CATEGORIES(t)).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* CATATAN KETERANGAN */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                {t('cb_note')}
                            </label>
                            <input
                                value={form.note}
                                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                                placeholder={t('cb_note_placeholder')}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                            />
                        </div>

                        {/* TANGGAL */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                {t('cb_date')}
                            </label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                            />
                        </div>

                        {/* UPLOAD STRUK / BUKTI */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                {t('cb_upload_receipt')}
                            </label>
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <ImageIcon size={14} className="text-slate-400" />
                                    <span>{form.bukti ? t('cb_change_receipt') : t('cb_upload_btn')}</span>
                                </button>
                                {form.bukti && (
                                    <img
                                        src={form.bukti}
                                        alt="Bukti"
                                        onClick={() => setBuktiBig(form.bukti)}
                                        className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = ev => setForm(f => ({ ...f, bukti: ev.target.result }));
                                        reader.readAsDataURL(file);
                                    }}
                                />
                            </div>
                        </div>

                        {/* TOMBOL SIMPAN */}
                        <div className="pt-2 space-y-2">
                            <button
                                type="submit"
                                disabled={!checkCashbookLimit() || loading}
                                className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {!checkCashbookLimit() && <Lock size={14} />}
                                <span>{editingId ? (isEn ? "Update Transaction" : "Perbarui Transaksi") : (isIncome ? `Simpan ${t('cb_income')}` : `Simpan ${t('cb_expense')}`)}</span>
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setForm({ amount: '', category: '', note: '', date: todayStr(), bukti: null });
                                    }}
                                    className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {isEn ? "Cancel Edit" : "Batal Sunting"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* PANEL BUKU KAS KANAN (8 COLS - BANK LEDGER STYLE) */}
                <div className="lg:col-span-8 space-y-4">
                    
                    {/* CONSOLIDATED FILTER TOOLBAR */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                        {/* PERIOD FILTERS */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {[
                                { key: 'all', label: t('cb_filter_all') },
                                { key: 'today', label: t('period_today') },
                                { key: 'week', label: t('period_week') },
                                { key: 'month', label: t('period_month') },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        filter === key
                                            ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-2xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* TYPE FILTERS */}
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Tipe:</span>
                            {[
                                { key: 'all', label: t('cb_type_all') },
                                { key: 'income', label: t('cb_income') },
                                { key: 'expense', label: t('cb_expense') },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setTypeFilter(key)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        typeFilter === key
                                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TRANSACTIONS FEED */}
                    {isLoading ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
                            <div className="w-8 h-8 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs font-semibold text-slate-400">{t('cb_loading')}</p>
                        </div>
                    ) : grouped.length === 0 ? (
                        <EmptyState title={t('cb_empty_title')} description={t('cb_empty_desc')} />
                    ) : (
                        grouped.map(([date, items]) => {
                            const dayTotal = items.reduce((s, e) => s + (e.type === 'income' ? e.amount : -e.amount), 0);
                            return (
                                <div key={date} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden mb-4">
                                    {/* DATE GROUP HEADER */}
                                    <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <span>{formatDateID(date, lang)}</span>
                                        <span className={`mono font-bold ${dayTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {dayTotal >= 0 ? '+' : ''}{formatIDR(dayTotal)}
                                        </span>
                                    </div>

                                    {/* ITEMS LEDGER DIVIDER */}
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {items.map(entry => (
                                            <div
                                                key={entry.id}
                                                className="p-4 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    {/* DIRECTION BADGE */}
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                                        entry.type === 'income'
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                                                    }`}>
                                                        {entry.type === 'income' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                                {entry.category}
                                                            </span>
                                                            {entry.source === 'auto' ? (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                                    POS KASIR
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                                                                    MANUAL
                                                                </span>
                                                            )}
                                                            {entry.bukti && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBuktiBig(entry.bukti)}
                                                                    className="text-[10px] text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
                                                                >
                                                                    Lihat Struk
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                            {entry.note || (entry.source === 'auto' ? "Transaksi otomatis dari kasir" : "Catatan kas harian")}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0 ml-3">
                                                    <div className={`text-xs font-black mono ${
                                                        entry.type === 'income'
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                        {entry.type === 'income' ? '+' : '-'}{formatIDR(entry.amount)}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2 mt-0.5">
                                                        {entry.source !== 'auto' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingId(entry.id);
                                                                    setTab(entry.type);
                                                                    setForm({
                                                                        amount: String(entry.amount),
                                                                        category: entry.category,
                                                                        note: entry.note || '',
                                                                        date: entry.date,
                                                                        bukti: entry.bukti || null
                                                                    });
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                                className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold transition-colors cursor-pointer"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(entry)}
                                                            className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Royal Audit Log Deletion Modal */}
            <DeleteReasonModal 
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={(reason) => performDelete(deleteConfirm.id, reason)}
                itemName={`${deleteConfirm?.type === 'income' ? t('cb_income') : t('cb_expense')}: ${deleteConfirm?.note || deleteConfirm?.category || t('cb_this_record')}`}
                loading={loading}
            />

            {/* Bukti Besar Modal */}
            {buktiBig && (
                <div
                    onClick={() => setBuktiBig(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
                >
                    <img src={buktiBig} alt="Bukti" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} />
                    <button onClick={() => setBuktiBig(null)} style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 10, cursor: 'pointer', color: 'white' }}>
                        <X size={20} />
                    </button>
                </div>
            )}
            {showLimitModal && <LimitModal plan="PRO" feature="Catatan Bisnis" onClose={() => setShowLimitModal(false)} />}
        </div>
    );
}
