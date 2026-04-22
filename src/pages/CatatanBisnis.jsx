import { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, PlusCircle, X, Image as ImageIcon, EyeIcon, ArrowRight, Download } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { formatDateID, todayStr, isToday, isThisWeek, isThisMonth } from '../utils/date';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LimitModal from '../components/LimitModal';
import { recordAudit } from '../utils/audit';
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
    const { dark } = useTheme();
    const { t, lang } = useLang();
    const { showToast } = useToast();
    const { isPro, isFree, checkCashbookLimit, getCashbookCount, currentLimits } = usePlan();
    const navigate = useNavigate();
    const { user, effectivePlan, isAdmin, canAccessMultiOutlet } = useAuth();
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

    const fetchEntries = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('cashbook')
                .select('id, type, amount, date, category, description, outlet_id, created_at, receipt_url, document_id')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

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
                    reference_type: d.document_id,
                    createdAt: d.created_at,
                    source: d.document_id ? 'auto' : 'manual'
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
    };

    useEffect(() => {
        if (user) {
            fetchEntries();
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
    }, [user]);

    // Summary
    const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const netBalance = totalIncome - totalExpense;

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
        
        // [OPERASI SADAP DATA] — Outlet Validation Guard
        if (canAccessMultiOutlet() && !activeOutlet?.id) {
            alert("SENSING: Active Outlet tidak terdeteksi! Sistem tidak boleh berjalan tanpa jangkar (Outlet ID).");
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
            outlet_id: activeOutlet?.id || null
        };

        if (form.bukti) {
            payload.receipt_url = form.bukti;
        }

        // [OPERASI STRIP ID] — Bersihkan Payload secara Total
        delete payload.id;

        console.log("Payload to Supabase:", payload);

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

            // [OPERASI SADAP DATA] — Extreme Logging
            console.log("ISI DATA YANG DIKIRIM:", payload);
            console.log("RESPON SERVER:", { savedData, error });

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
            }
        } catch (error) {
            console.error('Cashbook save error:', error);
            showToast("KESALAHAN SISTEM: " + error.message, 'error');
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

    const performDelete = async (id, reason) => {
        const item = entries.find(e => e.id === id);
        if (!item) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('cashbook').delete().eq('id', id).eq('user_id', user.id);
            // [SINKRONISASI KEMATIAN]
            // If this is an automated POS transaction, delete the source as well
            if (item.category === 'Penjualan Kasir' || item.is_automated) {
                // Try to extract receipt number from description: "Penjualan POS [RECEIPT_NUMBER] ..."
                const match = item.description?.match(/(POS-\d+|RCW-\d+|INV-\d+|[A-Z0-9-]{6,})/); 
                const receiptNum = match ? match[0] : null;
                
                if (receiptNum) {
                    // We don't wait for this to finish to avoid blocking, but we fire the delete
                    await supabase.from('kasir_transactions').delete().eq('receipt_number', receiptNum).eq('user_id', user.id);
                }
            }

            setEntries(prev => prev.filter(e => e.id !== id));
            showToast(t('cb_toast_deleted'), 'info');
            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('Cashbook delete error:', err);
            showToast(t('cb_toast_delete_fail'), 'error');
        } finally {
            setLoading(false);
            setDeleteConfirm(null);
        }
    };

    const handleExportCSV = () => {
        const rows = [
            [t('cb_col_date'), t('cb_csv_type'), t('cb_col_cat'), t('cb_col_note'), `${t('cb_col_amount')} (Rp)`],
            ...filtered.map(e => [
                e.date,
                e.type === 'income' ? t('cb_type_income') : t('cb_type_expense'),
                e.category || '-',
                (e.note || '-').replace(/,/g, ';'), // avoid commas in CSV
                e.amount
            ])
        ];

        // Summary rows
        rows.push([]);
        rows.push([t('cb_csv_summary'), '', '', '', '']);
        rows.push([t('cb_income'), '', '', '', totalIncome]);
        rows.push([t('cb_expense'), '', '', '', totalExpense]);
        rows.push([t('cb_csv_balance'), '', '', '', netBalance]);

        const csvContent = rows.map(r => r.join(',')).join('\n');
        const BOM = '\uFEFF'; // UTF-8 BOM agar Excel bisa baca huruf Indonesia
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CatatanBisnis-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatAmountDisplay = (val) => {
        const num = val.replace(/[^\d]/g, '');
        if (!num) return '';
        return new Intl.NumberFormat(t('locale_code')).format(parseInt(num));
    };

    const isIncome = tab === 'income';
    const accentColor = isIncome ? '#10B981' : '#EF4444';


    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px', color: dark ? '#F1F5F9' : '#1E293B' }}>
                {t('nav_cashbook')}
            </h1>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                {/* Add Transaction Form */}
                <div className="lg:col-span-1 card h-fit lg:sticky lg:top-20" style={{ animation: 'none' }}>
                {/* 267:                 <div className="card" style={{ animation: 'none', position: 'sticky', top: 80 }}> */}
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderRadius: 12, overflow: 'hidden', marginBottom: 20, border: '1.5px solid #E2E8F0' }}>
                        {[
                            { key: 'income', label: t('cb_income'), color: '#10B981', bg: '#ECFDF5' },
                            { key: 'expense', label: t('cb_expense'), color: '#EF4444', bg: '#FEF2F2' },
                        ].map(({ key, label, color, bg }) => (
                            <button
                                key={key}
                                onClick={() => { setTab(key); setForm(f => ({ ...f, category: '' })); }}
                                style={{
                                    flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontWeight: 700, fontSize: 14,
                                    background: tab === key ? bg : 'transparent',
                                    color: tab === key ? color : '#94A3B8',
                                    transition: 'all 200ms',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Monthly limit banner (Manual entry only) */}
                    {isFree && (
                        <div className="upgrade-banner" style={{
                            marginBottom: 16,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            background: getCashbookCount() >= (currentLimits?.cashbook || 50) ? '#FEF2F2' : '#F5F3FF',
                            borderRadius: '10px',
                            border: `1px solid ${getCashbookCount() >= (currentLimits?.cashbook || 50) ? '#FECACA' : '#DDD6FE'}`
                        }}>
                            <span style={{ color: getCashbookCount() >= (currentLimits?.cashbook || 50) ? '#B91C1C' : '#5B21B6', fontSize: 13, fontWeight: 700 }}>
                                {getCashbookCount()}/{currentLimits?.cashbook || 50} {t('cb_limit_banner')}
                            </span>
                            {getCashbookCount() >= (currentLimits?.cashbook || 50) ? (
                                <button onClick={() => navigate('/upgrade')} className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: 12, background: '#EF4444' }}>
                                    LIMIT
                                </button>
                            ) : (
                                <button onClick={() => navigate('/upgrade')} className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}>
                                    PRO
                                </button>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="label">{t('cb_amount')} (Rp)</label>
                            <input
                                className="input"
                                value={form.amount}
                                onChange={e => setForm(f => ({ ...f, amount: formatAmountDisplay(e.target.value) }))}
                                placeholder="0"
                                style={{ fontSize: 24, fontWeight: 800, color: accentColor, textAlign: 'right' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">{t('cb_category')}</label>
                            <select
                                className="select"
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                required
                            >
                                <option value="">{t('cb_select_category')}</option>
                                {(isIncome ? INCOME_CATEGORIES(t) : EXPENSE_CATEGORIES(t)).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">{t('cb_note')}</label>
                            <input
                                className="input"
                                value={form.note}
                                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                                placeholder={t('cb_note_placeholder')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">{t('cb_upload_receipt')}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #7C3AED', background: 'none', color: '#7C3AED', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                                >
                                    <ImageIcon size={14} /> {form.bukti ? t('cb_change_receipt') : t('cb_upload_btn')}
                                </button>
                                {form.bukti && (
                                    <img src={form.bukti} alt="Bukti" style={{ height: 40, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1.5px solid #E2E8F0' }} onClick={() => setBuktiBig(form.bukti)} />
                                )}
                                <input
                                    ref={fileRef} type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    style={{ display: 'none' }}
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
                        <div className="form-group">
                            <label className="label">{t('cb_date')}</label>
                            <input
                                type="date"
                                className="input"
                                value={form.date}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn"
                            disabled={!checkCashbookLimit()}
                            style={{
                                width: '100%',
                                background: !checkCashbookLimit() ? '#CBD5E1' : accentColor,
                                color: 'white',
                                padding: '12px', fontSize: 15, justifyContent: 'center',
                                cursor: !checkCashbookLimit() ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {!checkCashbookLimit() && <Lock size={16} style={{ marginRight: 6 }} />}
                            {t('save')} {isIncome ? t('cb_income') : t('cb_expense')}
                        </button>
                    </form>
                </div>

                {/* Transaction List */}
                <div className="lg:col-span-2">
                    {/* Date filter + type filter */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {[
                                { key: 'all', label: t('cb_filter_all') },
                                { key: 'today', label: t('period_today') },
                                { key: 'week', label: t('period_week') },
                                { key: 'month', label: t('period_month') },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className="btn btn-sm"
                                    style={{
                                        background: filter === key ? '#7C3AED' : (dark ? '#334155' : '#F1F5F9'),
                                        color: filter === key ? 'white' : (dark ? '#94A3B8' : '#475569'),
                                        border: 'none',
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleExportCSV}
                            disabled={filtered.length === 0}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 8,
                                border: '1.5px solid #10B981',
                                background: 'none', color: '#10B981',
                                fontSize: 13, fontWeight: 700,
                                cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: filtered.length === 0 ? 0.5 : 1
                            }}
                        >
                            <Download size={14} />
                            {t('cb_export_csv')}
                        </button>
                        {/* Type filter (Semua / Pemasukan / Pengeluaran) */}
                        <div style={{ display: 'flex', gap: 4 }}>
                            {[
                                { key: 'all', label: t('cb_type_all') },
                                { key: 'income', label: t('cb_income') },
                                { key: 'expense', label: t('cb_expense') },
                            ].map(({ key, label }) => {
                                const typeColor = { income: '#10B981', expense: '#EF4444', all: '#7C3AED' }[key];
                                return (
                                    <button key={key} onClick={() => setTypeFilter(key)}
                                        style={{
                                            padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${typeFilter === key ? typeColor : (dark ? '#334155' : '#E2E8F0')}`,
                                            background: typeFilter === key ? typeColor : 'none',
                                            color: typeFilter === key ? 'white' : (dark ? '#94A3B8' : '#64748B'),
                                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                                            transition: 'all 150ms',
                                        }}>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }}>
                            <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <p style={{ color: '#64748B', fontSize: 14, fontWeight: 600 }}>{t('cb_loading')}</p>
                        </div>
                    ) : grouped.length === 0 ? (
                        <EmptyState title={t('cb_empty_title')} description={t('cb_empty_desc')} />
                    ) : (
                        grouped.map(([date, items]) => {
                            const dayTotal = items.reduce((s, e) => s + (e.type === 'income' ? e.amount : -e.amount), 0);
                            return (
                                <div key={date} style={{ marginBottom: 16 }}>
                                    {/* Date group header */}
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '8px 12px', borderRadius: 8,
                                        background: dark ? '#1E293B' : '#F1F5F9',
                                        marginBottom: 6,
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: dark ? '#94A3B8' : '#475569' }}>
                                            {formatDateID(date)}
                                        </span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: dayTotal >= 0 ? '#10B981' : '#EF4444' }}>
                                            {dayTotal >= 0 ? '+' : ''}{formatIDR(dayTotal)}
                                        </span>
                                    </div>

                                    {/* Items */}
                                    {items.map(entry => (
                                        <div
                                            key={entry.id}
                                            className="card"
                                            style={{
                                                animation: 'none', padding: '14px 16px', marginBottom: 6,
                                                display: 'flex', alignItems: 'center', gap: 12,
                                            }}
                                        >
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                                background: entry.type === 'income' ? '#ECFDF5' : '#FEF2F2',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {entry.type === 'income'
                                                    ? <ArrowUp size={18} color="#10B981" />
                                                    : <ArrowDown size={18} color="#EF4444" />
                                                }
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: dark ? '#E2E8F0' : '#1E293B' }}>
                                                        {entry.category}
                                                    </p>
                                                    {/* Auto source badge */}
                                                    {entry.source === 'auto' && (
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 100,
                                                            background: 'rgba(16,185,129,0.12)', color: '#10B981',
                                                            letterSpacing: 0.5, textTransform: 'uppercase',
                                                        }}>
                                                            Auto
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.note && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{entry.note.length > 30 ? entry.note.substring(0, 30) + '...' : entry.note}</p>}
                                                {entry.sourceLabel && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>{entry.sourceLabel}</p>}
                                            </div>
                                            {entry.bukti && (
                                                <img
                                                    src={entry.bukti} alt="Bukti"
                                                    onClick={() => setBuktiBig(entry.bukti)}
                                                    style={{ height: 44, width: 44, borderRadius: 8, objectFit: 'cover', cursor: 'pointer', border: '1.5px solid #E2E8F0', flexShrink: 0 }}
                                                />
                                            )}
                                            <span style={{
                                                fontSize: 15, fontWeight: 800,
                                                color: entry.type === 'income' ? '#10B981' : '#EF4444',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {entry.type === 'income' ? '+' : '-'}{formatIDR(entry.amount)}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(entry)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#EF4444', padding: 4, borderRadius: 6,
                                                    display: 'flex', alignItems: 'center', flexShrink: 0,
                                                    transition: 'opacity 200ms',
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
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
                itemName={`${deleteConfirm?.type === 'income' ? t('cb_income') : t('cb_expense')}: ${deleteConfirm?.category}`}
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
