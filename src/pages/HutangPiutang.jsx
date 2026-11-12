import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Check, AlertCircle, HandCoins, Download, CheckCircle2, Search, X, Edit3, FileSpreadsheet } from 'lucide-react';

import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { supabase } from '../lib/supabase';
import { useOutlet } from '../context/OutletContext';
import LimitModal from '../components/LimitModal';
import { recordAudit } from '../utils/audit';



const emptyEntry = () => ({
    id: null,
    name: '',
    amount: 0,
    dueDate: '',
    status: 'unpaid',
    notes: '',
    createdAt: todayStr(),
});



export default function HutangPiutang() {
    const {
        isPro, 
        checkHutangPiutangLimit, incrementHutangPiutang, 
        refreshUsage, currentLimits
    } = usePlan();
    const { showToast } = useToast();
    const { isAdmin, user } = useAuth();
    const { t, lang } = useLang();
    const isEn = lang === 'EN';
    const { activeOutlet } = useOutlet();
    const [piutang, setPiutang] = useState([]);
    const [hutang, setHutang] = useState([]);
    const [activeTab, setActiveTab] = useState('piutang');
    const [form, setForm] = useState(emptyEntry());
    const [showForm, setShowForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showPaid, setShowPaid] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // === BILINGUAL ===
    const fetchData = useCallback(async () => {
        if (!user) return;
        let query = supabase
            .from('documents')
            .select('id, type, status, created_at, client_name, total_amount, data, outlet_id')
            .eq('user_id', user.id)
            .in('type', ['piutang', 'hutang']);
        
        if (activeOutlet?.id) {
            query = query.or(`outlet_id.eq.${activeOutlet.id},outlet_id.is.null`);
        }

        const { data, error } = await query;

        if (!error && data) {
            const p = data.filter(d => d.type === 'piutang').map(d => {
                const { id: _ignoredId, ...restData } = d.data || {};
                return {
                    ...restData,
                    name: d.client_name || restData.name || '',
                    amount: Number(d.total_amount ?? d.total ?? restData.amount ?? 0),
                    status: d.status || restData.status || 'unpaid',
                    dueDate: restData.dueDate || restData.due_date || '',
                    date: d.created_at,
                    id: d.id,
                };
            });
            const h = data.filter(d => d.type === 'hutang').map(d => {
                const { id: _ignoredId, ...restData } = d.data || {};
                return {
                    ...restData,
                    name: d.client_name || restData.name || '',
                    amount: Number(d.total_amount ?? d.total ?? restData.amount ?? 0),
                    status: d.status || restData.status || 'unpaid',
                    dueDate: restData.dueDate || restData.due_date || '',
                    date: d.created_at,
                    id: d.id,
                };
            });
            setPiutang(p);
            setHutang(h);
        }
    }, [user, activeOutlet?.id]);

    useEffect(() => {
        if (user) fetchData();
        const handleExternal = () => {
            if (user) fetchData();
        };
        window.addEventListener('external-sync', handleExternal);
        window.addEventListener('focus', handleExternal);
        return () => {
            window.removeEventListener('external-sync', handleExternal);
            window.removeEventListener('focus', handleExternal);
        };
    }, [user, fetchData]);

    const data = activeTab === 'piutang' ? piutang : hutang;
    const setData = activeTab === 'piutang' ? setPiutang : setHutang;

    const text = '#1E293B';
    const sub = '#64748B';
    const card = 'white';
    const bg2 = '#F8FAFC';

    const totalPiutang = piutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalHutang = hutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setHours(23, 59, 59, 999);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const parseDue = (val) => {
        if (!val) return null;
        const raw = String(val).trim();
        const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const overdueItems = data.filter(e => {
        if (e.status !== 'unpaid') return false;
        const due = parseDue(e.dueDate);
        return due && due < now;
    });
    const dueSoonItems = data.filter(e => {
        if (e.status !== 'unpaid') return false;
        const due = parseDue(e.dueDate);
        return due && due >= now && due <= threeDaysFromNow;
    });

    const handleAdd = () => {
        if (!checkHutangPiutangLimit()) {
            showToast(t('hp_limit_reached'), 'warning');
            return;
        }
        setForm(emptyEntry());
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { showToast(t('kl_toast_name_req'), 'error'); return; }
        if (!form.amount || Number(form.amount) <= 0) { showToast(t('hp_col_amount') + ' > 0', 'error'); return; }
        const entry = { ...form, amount: Number(form.amount) };

        // Limit checking for FREE users (only on new entries, not updates)
        const isExistingEntry = Boolean(entry.id && data.some(d => d.id === entry.id));
        if (!isExistingEntry && !isPro && !isAdmin && !checkHutangPiutangLimit()) {
            setShowLimitModal(true);
            return;
        }

        // Persist to Supabase
        const dbEntry = {
            user_id: user.id,
            type: activeTab, // 'piutang' or 'hutang'
            client_name: form.name,
            total_amount: Number(form.amount),
            status: form.status || 'unpaid',
            outlet_id: activeOutlet?.id || null,
            data: { ...form, amount: Number(form.amount) }
        };

        try {
            let finalEntry = null;
            const existing = data.find(d => d.id === entry.id);

            if (existing && existing.id && existing.id.length > 15) { // UUID
                const { data: updated, error } = await supabase.from('documents').update(dbEntry).eq('id', existing.id).eq('user_id', user.id).select().single();
                if (error) throw error;
                finalEntry = {
                    ...entry,
                    id: updated.id,
                    date: updated.created_at,
                    ... (updated.data || {})
                };
                showToast(t('hp_toast_status_updated'), 'success');
            } else {
                // [OPERASI PENGECEKAN GANDA HP]
                const { data: dup } = await supabase.from('documents')
                    .select('id, created_at')
                    .eq('user_id', user.id)
                    .eq('type', activeTab)
                    .eq('doc_number', entry.name) // Use entry.name which is doc_number
                    .maybeSingle();

                if (dup) {
                    const { data: updated, error } = await supabase.from('documents').update(dbEntry).eq('id', dup.id).eq('user_id', user.id).select().single();
                    if (error) throw error;
                    finalEntry = {
                        ...entry,
                        id: updated.id,
                        date: updated.created_at,
                        ... (updated.data || {})
                    };
                    showToast(t('hp_toast_status_updated'), 'success');
                } else {
                    // [OPERASI STRIP ID]
                    delete dbEntry.id;
                    const { data: saved, error } = await supabase.from('documents').insert(dbEntry).select().single();
                    if (error) throw error;
                    if (saved) {
                        finalEntry = {
                            ...entry,
                            id: saved.id,
                            date: saved.created_at,
                            ... (saved.data || {})
                        };
                        incrementHutangPiutang(); 
                        showToast(t('hp_toast_saved'), 'success');
                    }
                }
            }

            if (finalEntry) {
                setData(prev => {
                    const exists = prev.find(d => d.id === finalEntry.id);
                    if (exists) return prev.map(d => d.id === finalEntry.id ? finalEntry : d);
                    return [...prev, finalEntry];
                });

                await syncHPToCashbook(finalEntry, finalEntry.status === 'paid', activeTab);
            }

            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('piutang-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('HutangPiutang sync error:', err);
            showToast(isEn ? "Failed to save! Please check your internet connection." : "Gagal Simpan! Periksa koneksi internet.", 'error');
        }
        setShowForm(false);
    };

    const syncHPToCashbook = async (item, isPaid, entryType = activeTab) => {
        const desc = `Pelunasan ${entryType === 'piutang' ? 'Piutang' : 'Hutang'}: ${item.name} (#${item.id})`;

        if (isPaid) {
            const cashPayload = {
                user_id: user.id,
                date: todayStr(),
                amount: Number(item.amount),
                type: entryType === 'piutang' ? 'income' : 'expense',
                category: entryType === 'piutang' ? 'Pelunasan Piutang' : 'Pelunasan Hutang',
                description: desc,
                reference_id: item.id ? String(item.id) : null,
                document_id: item.id ? String(item.id) : null,
                reference_type: entryType === 'piutang' ? 'piutang_paid' : 'hutang_paid',
                is_automated: true,
                outlet_id: activeOutlet?.id || null
            };

            let existing = null;
            if (item.id) {
                const { data: byRef } = await supabase
                    .from('cashbook')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('reference_id', String(item.id))
                    .maybeSingle();
                existing = byRef;
            }
            if (!existing) {
                const { data: byDesc } = await supabase
                    .from('cashbook')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('description', desc)
                    .maybeSingle();
                existing = byDesc;
            }

            if (existing) {
                await supabase.from('cashbook').update(cashPayload).eq('id', existing.id);
            } else {
                await supabase.from('cashbook').insert([cashPayload]);
            }
        } else {
            if (item.id) {
                await supabase.from('cashbook')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('reference_id', String(item.id));
            }
            await supabase.from('cashbook')
                .delete()
                .eq('user_id', user.id)
                .eq('description', desc);
        }
    };

    const togglePaid = async (id) => {
        
        const existing = data.find(d => d.id === id);
        if (!existing) return;

        const newStatus = existing.status === 'paid' ? 'unpaid' : 'paid';

        // 1. Optimistic UI Update
        setData(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
        showToast(t('hp_toast_status_updated'), 'success');

        // 2. Background Sync
        try {
            const { id: _id, ...rest } = existing;
            await supabase.from('documents').update({
                status: newStatus,
                data: { ...rest, status: newStatus }
            }).eq('id', id).eq('user_id', user.id);

            await syncHPToCashbook(existing, newStatus === 'paid', activeTab);

            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('piutang-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('HutangPiutang toggle sync error:', err);
        }
    };

    const handleDelete = async (id) => {
        const item = data.find(d => d.id === id);
        if (!item) return;

        // 1. Optimistic UI Update
        setData(prev => prev.filter(d => d.id !== id));
        setDeleteConfirm(null);
        showToast(t('hp_toast_deleted'), 'info');

        // 2. Background Sync
        try {
            const desc = `Pelunasan ${activeTab === 'piutang' ? 'Piutang' : 'Hutang'}: ${item.name} (#${item.id})`;
            if (item.id) {
                await supabase.from('cashbook').delete().eq('user_id', user.id).eq('reference_id', String(item.id));
            }
            await supabase.from('cashbook').delete().eq('user_id', user.id).eq('description', desc);

            await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id);
            
            await recordAudit(
                'DELETE', 
                'HutangPiutang', 
                `Deleted ${activeTab} for ${item.name} (Amount: ${item.amount})`, 
                'User Deleted Entry', 
                'warning'
            );

            refreshUsage();
            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('piutang-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('HutangPiutang delete sync error:', err);
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

        const dataToExport = [
            ...piutang.map(i => ({ ...i, type: 'piutang' })),
            ...hutang.map(i => ({ ...i, type: 'hutang' }))
        ];

        const rows = [
            [t('lap_col_date'), t('lap_col_type'), t('hp_col_client'), t('hp_col_amount'), t('form_date'), t('form_valid_until'), t('hp_col_status'), t('hp_col_note')],
            ...dataToExport.map((item, i) => [
                i + 1,
                sanitizeCSV(item.type === 'piutang' ? t('hp_filter_receivable') : t('hp_filter_debt')),
                sanitizeCSV(item.name || '-'),
                item.amount || 0,
                sanitizeCSV(item.date ? new Date(item.date).toLocaleDateString(t('locale_code')) : '-'),
                sanitizeCSV(item.dueDate ? new Date(item.dueDate).toLocaleDateString(t('locale_code')) : '-'),
                sanitizeCSV(item.status === 'paid' ? t('hp_status_paid') : t('hp_status_unpaid')),
                sanitizeCSV((item.notes || '-').replace(/,/g, ';'))
            ])
        ];

        // Summary
        rows.push([]);
        rows.push([t('csv_summary'), '', '', '', '', '', '', '']);
        rows.push([t('hp_summary_receivable') + ` (${t('hp_status_unpaid')})`, '', '', totalPiutang, '', '', '', '']);
        rows.push([t('hp_summary_debt') + ` (${t('hp_status_unpaid')})`, '', '', totalHutang, '', '', '', '']);

        const csvContent = rows.map(r => r.join(',')).join('\n');
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${t('hp_title')}-${todayStr()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = async () => {
        try {
            const { utils, writeFile } = await import('xlsx');

            const piutangRows = [
                ['No', 'Nama Pihak (Klien)', 'Nominal (Rp)', 'Tanggal Catat', 'Jatuh Tempo', 'Status', 'Catatan'],
                ...piutang.map((item, i) => [
                    i + 1,
                    item.name || '-',
                    Number(item.amount || 0),
                    item.date ? new Date(item.date).toLocaleDateString('id-ID') : '-',
                    item.dueDate ? new Date(item.dueDate).toLocaleDateString('id-ID') : '-',
                    item.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS',
                    item.notes || '-'
                ])
            ];

            const hutangRows = [
                ['No', 'Nama Pihak (Vendor / Supplier)', 'Nominal (Rp)', 'Tanggal Catat', 'Jatuh Tempo', 'Status', 'Catatan'],
                ...hutang.map((item, i) => [
                    i + 1,
                    item.name || '-',
                    Number(item.amount || 0),
                    item.date ? new Date(item.date).toLocaleDateString('id-ID') : '-',
                    item.dueDate ? new Date(item.dueDate).toLocaleDateString('id-ID') : '-',
                    item.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS',
                    item.notes || '-'
                ])
            ];

            const wb = utils.book_new();
            const wsPiutang = utils.aoa_to_sheet(piutangRows);
            const wsHutang = utils.aoa_to_sheet(hutangRows);

            utils.book_append_sheet(wb, wsPiutang, 'Daftar Piutang');
            utils.book_append_sheet(wb, wsHutang, 'Daftar Hutang');

            writeFile(wb, `Buku-Hutang-Piutang-${todayStr()}.xlsx`);
            showToast(t('export_success') || 'Data hutang piutang berhasil diekspor ke Excel', 'success');
        } catch (err) {
            console.error('Export Excel Hutang Piutang error:', err);
            showToast('Gagal mengekspor file Excel', 'error');
        }
    };

    const filteredBySearch = data.filter(e => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (e.name || '').toLowerCase().includes(q) || (e.notes || '').toLowerCase().includes(q);
    });
    const unpaid = filteredBySearch.filter(e => e.status === 'unpaid');
    const paid = filteredBySearch.filter(e => e.status === 'paid');

    const TabBtn = ({ value, label, count, color }) => (
        <button
            onClick={() => { setActiveTab(value); setShowForm(false); }}
            style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: activeTab === value ? (value === 'piutang' ? '#ECFDF5' : '#FEF2F2') : bg2,
                color: activeTab === value ? color : sub,
                fontWeight: 700, fontSize: 14, transition: 'all 200ms',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
        >
            {label}
            <span style={{
                background: activeTab === value ? color : '#94A3B8', color: 'white',
                borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 800,
            }}>{count}</span>
        </button>
    );


    return (
        <div className="page-enter" style={{ padding: '20px 16px', maxWidth: 1200, margin: '0 auto', paddingBottom: 'calc(env(safe-area-inset-bottom, 1rem) + 5rem)' }}>
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: text }}>
                    {t('hp_title')}
                </h1>
                <p style={{ margin: 0, color: sub, fontSize: 13 }}>
                    {t('hp_subtitle')}
                </p>
            </div>

            {/* Banners */}
            {overdueItems.length > 0 && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <AlertCircle size={16} color="#EF4444" className="shrink-0" />
                    <span>{overdueItems.length} {t('debt_overdue')}!</span>
                </div>
            )}

            {dueSoonItems.length > 0 && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FCD34D', color: '#B45309', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <AlertCircle size={16} color="#F59E0B" className="shrink-0" />
                    <span>{dueSoonItems.length} {t('debt_due_soon')}.</span>
                </div>
            )}

            {/* Summary cards (Mobile 2-Kolom Ergonomis & Hemat Ruang) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                            {t('hp_summary_receivable')}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {piutang.filter(e => e.status === 'unpaid').length} {t('hp_status_unpaid').toLowerCase()}
                        </span>
                    </div>
                    <p 
                        title={formatIDR(totalPiutang)}
                        className="truncate m-0 text-base sm:text-2xl font-black text-slate-900 dark:text-white font-mono"
                    >
                        {formatCompactCurrency(totalPiutang)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                            {t('hp_summary_debt')}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0">
                            {hutang.filter(e => e.status === 'unpaid').length} {t('hp_status_unpaid').toLowerCase()}
                        </span>
                    </div>
                    <p 
                        title={formatIDR(totalHutang)}
                        className="truncate m-0 text-base sm:text-2xl font-black text-slate-900 dark:text-white font-mono"
                    >
                        {formatCompactCurrency(totalHutang)}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, background: bg2, padding: 4, borderRadius: 12 }}>
                <TabBtn value="piutang" label={t('hp_filter_receivable')} count={piutang.length} color="#10B981" />
                <TabBtn value="hutang" label={t('hp_filter_debt')} count={hutang.length} color="#EF4444" />
            </div>

            {/* Search Bar */}
            <div className="relative mb-3">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder={activeTab === 'piutang' ? (isEn ? 'Search receivable / notes...' : 'Cari piutang / nama / catatan...') : (isEn ? 'Search payable / notes...' : 'Cari hutang / nama / catatan...')} 
                    className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20" 
                />
                {searchQuery && (
                    <button 
                        type="button" 
                        onClick={() => setSearchQuery('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Responsive Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-4">
                <p className="m-0 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {activeTab === 'piutang' ? t('hp_receivable_desc') : t('hp_payable_desc')}
                    {!isPro && !isAdmin && (
                        <span className="font-semibold text-slate-400 ml-1">
                            · {data.length}/{currentLimits?.hutangPiutang || 25} FREE
                        </span>
                    )}
                </p>
                <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                    <label 
                        className={`inline-flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 sm:py-2 rounded-xl cursor-pointer select-none transition-all border ${
                            showPaid 
                                ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        <input 
                            type="checkbox" 
                            checked={showPaid} 
                            onChange={e => setShowPaid(e.target.checked)} 
                            className="w-4 h-4 accent-violet-600 cursor-pointer rounded" 
                        />
                        <span className="font-semibold">{t('show_paid') || 'Tampilkan yang Lunas'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            disabled={piutang.length === 0 && hutang.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />
                            <span className="hidden xs:inline">Excel (.xlsx)</span>
                            <span className="xs:hidden">XLSX</span>
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={piutang.length === 0 && hutang.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={14} className="text-slate-500 shrink-0" />
                            <span className="hidden xs:inline">{t('export') || 'Ekspor CSV'}</span>
                            <span className="xs:hidden">CSV</span>
                        </button>
                        <button 
                            onClick={handleAdd} 
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-slate-900 dark:bg-violet-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:bg-slate-800 dark:hover:bg-violet-700 transition-colors"
                        >
                            <Plus size={15} /> 
                            <span>{t('add') || 'Tambah'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ margin: '0 0 16px', color: '#0F172A', fontSize: 15, fontWeight: 800 }}>
                        {t('hp_add_entry')}
                    </h3>
                    <form onSubmit={handleSave}>
                        <div className="responsive-form-grid" style={{ gap: 12 }}>
                            <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                                <label className="label">{t('hp_col_client')}</label>
                                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('hp_col_client')} required />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="label">{t('hp_col_amount')}</label>
                                <input type="number" min="0" className="input" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="label">{t('form_valid_until')}</label>
                                <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                                <label className="label">{t('hp_col_note')}</label>
                                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('hp_col_note')} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>{t('save')}</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ padding: '8px 20px' }}>{t('cancel')}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: sub }}>
                    <HandCoins size={40} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.4, margin: '0 auto' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{t('no_data')} ({activeTab === 'piutang' ? t('hp_filter_receivable') : t('hp_filter_debt')})</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>{t('hp_add_entry')}</p>
                </div>
            ) : (filteredBySearch.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: sub }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{isEn ? 'No matching records found' : 'Tidak ada catatan yang sesuai dengan pencarian'}</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {/* Unpaid */}
                    {unpaid.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('hp_status_unpaid')}</p>
                            {unpaid.map(entry => (
                                <EntryCard key={entry.id} entry={entry} tab={activeTab} now={now} threeDaysFromNow={threeDaysFromNow}
                                     onTogglePaid={() => togglePaid(entry.id)}
                                     onEdit={() => { setForm(entry); setShowForm(true); }}
                                     onDelete={() => setDeleteConfirm(entry.id)} />
                            ))}
                        </div>
                    )}
                    {/* Paid */}
                    {(showPaid && paid.length > 0) && (
                        <div className="flex flex-col gap-2 mt-2">
                            <p style={{ margin: '8px 0 2px', fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('hp_status_paid')}</p>
                            {paid.map(entry => (
                                <EntryCard key={entry.id} entry={entry} tab={activeTab} now={now} threeDaysFromNow={threeDaysFromNow}
                                     onTogglePaid={() => togglePaid(entry.id)}
                                     onEdit={() => { setForm(entry); setShowForm(true); }}
                                     onDelete={() => setDeleteConfirm(entry.id)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: card, borderRadius: 16, padding: 28, maxWidth: 360, width: 'calc(100% - 32px)', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
                        <AlertCircle size={32} color="#EF4444" style={{ marginBottom: 12 }} />
                        <h3 style={{ margin: '0 0 8px', color: text }}>{t('hp_delete_title')}</h3>
                        <p style={{ margin: '0 0 20px', color: sub }}>{t('hp_delete_body')}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '10px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>{t('delete')}</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', background: bg2, color: text, border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>{t('cancel')}</button>
                        </div>
                    </div>
                </div>
            )}
            {showLimitModal && <LimitModal plan="PRO" feature="Hutang Piutang" onClose={() => setShowLimitModal(false)} />}
        </div>
    );
}

function EntryCard({ entry, tab, now, threeDaysFromNow, onTogglePaid, onEdit, onDelete }) {
    const { t, lang } = useLang();
    const isPaid = entry.status === 'paid';
    const accentColor = tab === 'piutang' ? '#10B981' : '#EF4444';
    const dueObj = entry.dueDate ? new Date(String(entry.dueDate).includes('T') ? entry.dueDate : `${entry.dueDate}T00:00:00`) : null;
    const isOverdue = Boolean(dueObj && !Number.isNaN(dueObj.getTime()) && !isPaid && now && dueObj < now);
    const isSoon = Boolean(dueObj && !Number.isNaN(dueObj.getTime()) && !isPaid && !isOverdue && threeDaysFromNow && dueObj <= threeDaysFromNow);

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all shadow-sm ${
            isOverdue 
                ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        } ${isPaid ? 'opacity-75' : ''}`}>
            {/* Top row: Check toggle + Name + Badges + Amount */}
            <div className="flex items-start gap-2.5 sm:gap-3">
                {/* Check toggle */}
                <button 
                    onClick={onTogglePaid} 
                    type="button"
                    title={isPaid ? (t('mark_unpaid') || 'Tandai Belum Lunas') : (t('mark_paid') || 'Tandai Lunas')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer mt-0.5 ${
                        isPaid 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
                            : 'border-slate-300 dark:border-slate-600 bg-transparent hover:border-emerald-500'
                    }`}
                >
                    {isPaid && <Check size={14} strokeWidth={3.5} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {isPaid && <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />}
                                <p className={`m-0 font-bold text-sm sm:text-base leading-snug truncate ${
                                    isPaid ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                                }`}>
                                    {entry.name}
                                </p>
                            </div>
                            
                            {/* Status Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                {isPaid && (
                                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                        {t('debt_status_paid')}
                                    </span>
                                )}
                                {isOverdue && (
                                    <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                        {t('debt_status_overdue')}
                                    </span>
                                )}
                                {isSoon && (
                                    <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                        {t('debt_status_soon')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Amount */}
                        <p 
                            className="m-0 font-mono font-black text-sm sm:text-base text-right shrink-0"
                            style={{ color: isPaid ? '#10B981' : accentColor }}
                        >
                            {formatIDR(entry.amount)}
                        </p>
                    </div>

                    {/* Bottom Row: Dates, Notes, and Action Buttons */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex-wrap">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                            {entry.createdAt && (
                                <span>{formatDateID(entry.createdAt, lang)}</span>
                            )}
                            {entry.dueDate && (
                                <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                                    {t('hp_tempo_label')}: {formatDateID(entry.dueDate, lang)}
                                </span>
                            )}
                            {entry.notes && (
                                <span className="truncate max-w-[140px] sm:max-w-xs text-slate-400 italic">
                                    "{entry.notes}"
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto shrink-0">
                            <button 
                                onClick={onEdit} 
                                type="button"
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                {t('edit')}
                            </button>
                            <button 
                                onClick={onDelete} 
                                type="button"
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                            >
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
