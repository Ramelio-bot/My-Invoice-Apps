import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Hash, ExternalLink, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePlan } from '../context/PlanContext';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { isThisMonth } from '../utils/date';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import { useOutlet } from '../context/OutletContext';
import UpgradeModal from '../components/UpgradeModal';
import StatCard from '../components/StatCard';

const MONTHS_SHORT = {
    id: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'],
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
};



export default function Laporan() {
    const { dark } = useTheme();
    const navigate = useNavigate();
    const { isPro } = usePlan();
    const { showToast } = useToast();
    const { lang, t } = useLang();
    const [cashbook, setCashbook] = useState([]); // Removed useLocalStorage
    const [invoices, setInvoices] = useState([]); // Removed useLocalStorage
    const { user, canAccessReport } = useAuth();
    const { activeOutlet } = useOutlet() || {};

    const [timeFilter, setTimeFilter] = useState('month'); // 'today', 'week', 'month'

    const [realData, setRealData] = useState({ invoices: [], kasir: [], cashbook: [], kasirExpenses: [], shifts: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [debts, setDebts] = useState({ hutang: 0, piutang: 0 });

    const now = new Date();
    const [selMonth, setSelMonth] = useState(now.getMonth());
    const [selYear, setSelYear] = useState(now.getFullYear());

    const MONTHS = useMemo(() => [
        t('lap_month_jan'), t('lap_month_feb'), t('lap_month_mar'), t('lap_month_apr'),
        t('lap_month_may'), t('lap_month_jun'), t('lap_month_jul'), t('lap_month_aug'),
        t('lap_month_sep'), t('lap_month_oct'), t('lap_month_nov'), t('lap_month_dec')
    ], [t]);

    // Slide panel state
    const [panel, setPanel] = useState({ open: false, title: '', items: [], type: 'cashbook' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const closePanel = () => { setPanel(p => ({ ...p, open: false })); setCurrentPage(1); };

    const fetchData = useCallback(async () => {
        if (!canAccessReport()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const outletId = activeOutlet?.id || null;

            // 1. Fetch Cashbook
            let cbQuery = supabase.from('cashbook').select('*').eq('user_id', user.id);
            if (outletId) cbQuery = cbQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: cb } = await cbQuery;
            setCashbook(cb || []);

            // 2. Fetch Invoices
            let dq = supabase.from('documents').select('*').eq('user_id', user.id).in('type', ['invoice', 'kwitansi']);
            if (outletId) dq = dq.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: docs } = await dq;
            setInvoices(docs || []);

            // Fetch Kasir Sales
            let kq = supabase.from('kasir_transactions').select('*').eq('user_id', user.id);
            if (outletId) kq = kq.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: kasirTx } = await kq;

            // Fetch Kasir Expenses
            let expQ = supabase.from('kasir_expenses').select('*').eq('user_id', user.id);
            if (outletId) expQ = expQ.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: kExps } = await expQ;

            // Fetch shifts
            let shiftQ = supabase.from('kasir_shifts').select('id, employee_name, ended_at, shift_notes').eq('user_id', user.id).order('ended_at', { ascending: false });
            if (outletId) shiftQ = shiftQ.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: shifts } = await shiftQ;

            setRealData({
                invoices: docs || [],
                kasir: kasirTx || [],
                cashbook: cb || [],
                kasirExpenses: kExps || [],
                shifts: shifts || []
            });

            // Debt Summary (Perbaikan status === unpaid)
            let debtQ = supabase.from('documents').select('total_amount, type, status').eq('user_id', user.id).in('type', ['piutang', 'hutang']);
            if (outletId) debtQ = debtQ.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: debtDocs } = await debtQ;
            
            const hTotal = (debtDocs || []).filter(d => d.type === 'hutang' && d.status === 'unpaid').reduce((s, d) => s + (d.total_amount || 0), 0);
            const pTotal = (debtDocs || []).filter(d => d.type === 'piutang' && d.status === 'unpaid').reduce((s, d) => s + (d.total_amount || 0), 0);
            setDebts({ hutang: hTotal, piutang: pTotal });

        } catch (err) {
            console.error('Laporan: fetchData failed', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, activeOutlet?.id, canAccessReport]);

    useEffect(() => {
        if (user) {
            fetchData();
            window.addEventListener('data-updated', fetchData);
            return () => window.removeEventListener('data-updated', fetchData);
        }
    }, [user, fetchData]);
    // GABUNGKAN SEMUA SUMBER DATA (Kasir, Invoice Lunas, Cashbook Manual) AGAR TIDAK ADA YANG TERLEWAT
    const unifiedEntries = [
        // 1. Data Penjualan Kasir
        ...(realData.kasir || []).map(tx => ({
            id: tx.id,
            date: new Date(tx.created_at).toLocaleDateString('en-CA'),
            type: 'income',
            amount: Number(tx.total || 0),
            category: 'Penjualan Kasir',
            note: tx.receipt_number || 'POS'
        })),
        // 2. Data Invoice Lunas
        ...(realData.invoices || []).filter(i => i.status === 'paid' || i.status === 'Lunas' || i.status === t('inv_status_paid')).map(inv => ({
            id: inv.id,
            date: inv.date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-CA') : ''),
            type: 'income',
            amount: Number(inv.grandTotal || inv.total_amount || 0),
            category: 'Invoice Lunas',
            note: inv.clientName || inv.client_name || '-'
        })),
        // 3. Data Pengeluaran Kasir
        ...(realData.kasirExpenses || []).map(ex => ({
            id: ex.id,
            date: ex.date,
            type: 'expense',
            amount: Number(ex.amount || 0),
            category: ex.category || 'Pengeluaran Kasir',
            note: ex.description || '-'
        })),
        // 4. Data Cashbook Manual (Hutang Piutang Lunas & Input Manual, hindari duplikat)
        ...(realData.cashbook || []).filter(c => !['Penjualan Kasir', 'Pengeluaran Kasir', 'Invoice Lunas'].includes(c.category)).map(c => ({
            id: c.id,
            date: c.date,
            type: c.type,
            amount: Number(c.amount || 0),
            category: c.category || (c.type === 'income' ? t('laporan_income') : t('laporan_expense')),
            note: c.description || t('lap_col_note')
        }))
    ];

    const todayStr = new Date().toLocaleDateString('en-CA');
    const getWeekRange = () => {
        const now = new Date();
        const day = now.getDay() || 7; 
        const start = new Date(now);
        start.setDate(now.getDate() - day + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start: start.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA') };
    };

    const filteredEntries = unifiedEntries.filter(e => {
        const eDate = e.date || '';
        if (timeFilter === 'today') return eDate === todayStr;
        if (timeFilter === 'week') {
            const { start, end } = getWeekRange();
            return eDate >= start && eDate <= end;
        }
        const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
        return eDate.startsWith(monthStr);
    });

    const totalIncome = filteredEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = filteredEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const txCount = filteredEntries.length;

    // Group by category
    const incomeByCategory = {};
    const expenseByCategory = {};
    filteredEntries.forEach(e => {
        if (e.type === 'income') {
            incomeByCategory[e.category] = (incomeByCategory[e.category] || 0) + e.amount;
        } else {
            expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
        }
    });

    // Invoice status summary
    const allInvoices = invoices || [];
    const invUnpaid = allInvoices.filter(i => ['unpaid', 'Belum Bayar', t('inv_status_unpaid')].includes(i.status));
    const invPaid = allInvoices.filter(i => ['paid', 'Lunas', t('inv_status_paid')].includes(i.status));
    const invWaiting = allInvoices.filter(i => ['waiting', 'Menunggu', t('inv_status_waiting')].includes(i.status));

    const openCashPanel = (type, label) => {
        const items = filteredEntries.filter(e => e.type === type);
        setPanel({ open: true, title: label, items, type: 'cashbook' });
    };

    const openNetPanel = () => {
        setPanel({ open: true, title: `${t('lap_summary_for')} ${MONTHS[selMonth]} ${selYear}`, items: filteredEntries, type: 'cashbook' });
    };

    const openTxPanel = () => {
        setPanel({ open: true, title: t('lap_all_tx'), items: filteredEntries, type: 'cashbook' });
    };

    const openInvoicePanel = (status, label, items) => {
        setPanel({ open: true, title: label, items, type: 'invoice' });
    };

    // --- CSV/Excel Export ---
    const exportCSV = () => {
        const rows = [
            [t('lap_col_date'), t('lap_col_type'), t('lap_col_cat'), t('lap_col_note'), t('lap_col_amount')],
            ...filteredEntries.map(e => [
                e.date, e.type === 'income' ? t('laporan_income') : t('laporan_expense'),
                e.category || '', e.note || '', e.amount,
            ])
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${t('laporan_title')}-${MONTHS[selMonth]}-${selYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportExcel = async () => {
        if (!isPro) {
            showToast(t('laporan_excel_pro'), 'error', 4000);
            return;
        }
        const { utils, writeFile } = await import('xlsx');
        const ws = utils.aoa_to_sheet([
            [t('lap_col_date'), t('lap_col_type'), t('lap_col_cat'), t('lap_col_note'), t('lap_col_amount')],
            ...filteredEntries.map(e => [
                e.date, e.type === 'income' ? t('laporan_income') : t('laporan_expense'),
                e.category || '', e.note || '', e.amount,
            ])
        ]);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Laporan');
        writeFile(wb, `${t('laporan_title')}-${MONTHS[selMonth]}-${selYear}.xlsx`);
    };

    const STATUS_MAP = {
        unpaid: { label: t('inv_status_unpaid'), color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        paid: { label: t('inv_status_paid'), color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        waiting: { label: t('inv_status_waiting'), color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        cancelled: { label: t('inv_status_cancelled'), color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
    };

    const card_style = (color, bg) => ({
        card: {
            animation: 'none',
            borderTop: `3px solid ${color}`,
            background: dark ? 'rgba(255,255,255,0.04)' : bg,
            cursor: 'pointer',
            transition: 'transform 150ms, box-shadow 150ms',
            minWidth: 0
        }
    });

    const getFontSize = (val) => {
        const str = String(val);
        if (str.length > 12) return 18;
        if (str.length > 10) return 20;
        return 22;
    };

    // === PLAN GUARD === FREE user tidak bisa akses laporan
    if (!canAccessReport()) {
        return (
            <div style={{ padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B', marginBottom: 8 }}>
                    {t('lap_pro_title')}
                </h2>
                <p style={{ color: dark ? '#94A3B8' : '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                    {t('lap_pro_desc')}
                </p>
                <button
                    onClick={() => window.location.href = 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan'}
                    style={{ padding: '14px 32px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
                >
                    {t('lap_pro_cta')}
                </button>
                <p style={{ marginTop: 12, fontSize: 13, color: '#94A3B8' }}>{t('lap_pro_trial')} <a href="/upgrade" style={{ color: '#7C3AED', fontWeight: 700 }}>{t('landing_nav_pricing')}</a></p>
            </div>
        );
    }

    if (isLoading) {
        return <LaporanSkeleton />;
    }

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('laporan_title')}</h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="select" style={{ width: 140, fontWeight: 'bold', color: '#7C3AED' }} value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
                        <option value="today">{t('filter_today') || 'Hari Ini'}</option>
                        <option value="week">{t('filter_week') || 'Minggu Ini'}</option>
                        <option value="month">{t('filter_month') || 'Bulan Pilihan'}</option>
                    </select>
                    {timeFilter === 'month' && (
                        <>
                            <select className="select" style={{ width: 130 }} value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}>
                                {MONTHS_SHORT[lang?.toLowerCase() || 'id'].map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                            <select className="select" style={{ width: 90 }} value={selYear} onChange={e => setSelYear(parseInt(e.target.value))}>
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </>
                    )}
                    <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px solid #10B981', background: 'none', color: '#10B981', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        <Download size={14} /> CSV
                    </button>
                    <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: isPro ? '#10B981' : '#94A3B8', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        <FileSpreadsheet size={14} /> Excel {!isPro && '(PRO)'}
                    </button>
                </div>
            </div>

            {/* Metric cards — CLICKABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <StatCard 
                    title={t('laporan_income')} 
                    value={totalIncome} 
                    icon={TrendingUp} 
                    color="green" 
                    onClick={() => openCashPanel('income', t('laporan_income'))}
                    subtitle={t('laporan_click_detail')}
                />
                <StatCard 
                    title={t('laporan_expense')} 
                    value={totalExpense} 
                    icon={TrendingDown} 
                    color="red" 
                    onClick={() => openCashPanel('expense', t('laporan_expense'))}
                    subtitle={t('laporan_click_detail')}
                />
                <StatCard 
                    title={t('laporan_net')} 
                    value={netProfit} 
                    icon={DollarSign} 
                    color="purple" 
                    onClick={() => openNetPanel()}
                    subtitle={t('laporan_click_detail')}
                />
                <StatCard 
                    title={t('laporan_tx_count')} 
                    value={String(txCount)} 
                    icon={Hash} 
                    color="amber" 
                    onClick={() => openTxPanel()}
                    subtitle={t('laporan_click_detail')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* Income by category */}
                <div className="card" style={{ animation: 'none' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('laporan_income_by_cat')}</h3>
                    {Object.entries(incomeByCategory).length === 0 ? (
                        <p style={{ color: '#94A3B8', fontSize: 13 }}>{t('laporan_no_income')}</p>
                    ) : (
                        Object.entries(incomeByCategory)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, val]) => (
                                <div key={cat} style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{formatIDR(val)}</span>
                                    </div>
                                    <div style={{ height: 6, background: dark ? '#334155' : '#F1F5F9', borderRadius: 3 }}>
                                        <div style={{ height: '100%', width: `${totalIncome > 0 ? (val / totalIncome) * 100 : 0}%`, background: '#10B981', borderRadius: 3, transition: 'width 600ms' }} />
                                    </div>
                                </div>
                            ))
                    )}
                </div>

                {/* Expense by category */}
                <div className="card" style={{ animation: 'none' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('laporan_expense_by_cat')}</h3>
                    {Object.entries(expenseByCategory).length === 0 ? (
                        <p style={{ color: '#94A3B8', fontSize: 13 }}>{t('laporan_no_expense')}</p>
                    ) : (
                        Object.entries(expenseByCategory)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, val]) => (
                                <div key={cat} style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>{formatIDR(val)}</span>
                                    </div>
                                    <div style={{ height: 6, background: dark ? '#334155' : '#F1F5F9', borderRadius: 3 }}>
                                        <div style={{ height: '100%', width: `${totalExpense > 0 ? (val / totalExpense) * 100 : 0}%`, background: '#EF4444', borderRadius: 3, transition: 'width 600ms' }} />
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

    {/* PROFESSIONAL WHITE CENTERED MODAL (Invoice Style) */}
    {panel.open && (() => {
        const totalPages = Math.ceil(panel.items.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentItems = panel.items.slice(startIndex, startIndex + itemsPerPage);

        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                {/* Backdrop: Standard Slate Fade */}
                <div onClick={closePanel} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)' }} />
                
                {/* Clean White Modal Box */}
                <div style={{ 
                    position: 'relative', width: '100%', maxWidth: '860px', maxHeight: '90vh', 
                    background: 'white', borderRadius: '16px', 
                    boxShadow: '0 24px 64px rgba(0,0,0,0.4)', 
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', 
                    animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards' 
                }}>
                    {/* Header: Clean Light */}
                    <div style={{ 
                        padding: '18px 24px', borderBottom: '1px solid #E2E8F0', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        background: 'white', zIndex: 10
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B' }}>{panel.title.toUpperCase()}</h2>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                                {panel.items.length} {t('laporan_tx_found') || 'Transactions Found'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={closePanel} style={{ 
                                padding: '8px 16px', borderRadius: '8px', background: '#F1F5F9', 
                                border: 'none', color: '#475569', fontSize: 13, fontWeight: 700, 
                                cursor: 'pointer', transition: 'all 0.2s' 
                            }}>
                                {t('doc_close')}
                            </button>
                        </div>
                    </div>

                    {/* Transaction List: Clean Hierarchy */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8FAFC' }}>
                        {currentItems.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
                                <p style={{ fontSize: 16, fontWeight: 600 }}>{t('no_data_period')}</p>
                            </div>
                        ) : panel.type === 'cashbook' ? (
                            currentItems.map(item => {
                                // Redundancy Fix
                                const displayNote = (item.note && item.note !== item.category && item.note !== '-') ? item.note : '';

                                return (
                                    <div key={item.id} style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                        padding: '16px 20px', background: 'white', borderRadius: '12px', 
                                        border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{item.category}</p>
                                            {displayNote && (
                                                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
                                                    {displayNote}
                                                </p>
                                            )}
                                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                                {item.date}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: item.type === 'income' ? '#10B981' : '#EF4444' }}>
                                                {item.type === 'income' ? '+' : '-'}{formatIDR(item.amount)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            currentItems.map(inv => {
                                const st = STATUS_MAP[inv.status] || STATUS_MAP.unpaid;
                                return (
                                    <div key={inv.id} onClick={() => { closePanel(); navigate('/invoice', { state: { invoiceId: inv.id } }); }} style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                        padding: '16px 20px', background: 'white', borderRadius: '12px', 
                                        border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{inv.number}</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>{inv.clientName || '-'} &middot; {inv.date}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#7C3AED' }}>{formatIDR(inv.grandTotal || 0)}</p>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: st.bg, color: st.color, textTransform: 'uppercase' }}>{st.label}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer: Light Pagination */}
                    {totalPages > 1 && (
                        <div style={{ 
                            padding: '16px 24px', borderTop: '1px solid #E2E8F0', 
                            background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                        }}>
                            <button 
                                disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} 
                                style={{ 
                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', 
                                    background: currentPage === 1 ? 'transparent' : '#F8FAFC', 
                                    color: currentPage === 1 ? '#CBD5E1' : '#64748B', 
                                    fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13 
                                }}
                            >
                                Sebelumnya
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Halaman {currentPage} / {totalPages}</span>
                            <button 
                                disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} 
                                style={{ 
                                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', 
                                    background: currentPage === totalPages ? 'transparent' : '#F8FAFC', 
                                    color: currentPage === totalPages ? '#CBD5E1' : '#64748B', 
                                    fontWeight: 700, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 13 
                                }}
                            >
                                Selanjutnya
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    })()}

    <style>{`
        @keyframes scaleIn {
            0% { transform: scale(0.9) translateY(20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
    `}</style>
        </div>
    );
}

function LaporanSkeleton() {
    return (
        <div className="p-6 max-w-[1200px] mx-auto animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="h-8 w-48 bg-slate-200 rounded-lg" />
                <div className="flex gap-2">
                    <div className="h-10 w-32 bg-slate-100 rounded-lg" />
                    <div className="h-10 w-24 bg-slate-100 rounded-lg" />
                </div>
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-slate-200/50 rounded-xl border border-slate-100" />
                ))}
            </div>

            {/* Charts/Categories Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="h-64 bg-slate-100 rounded-xl border border-slate-100" />
                <div className="h-64 bg-slate-100 rounded-xl border border-slate-100" />
            </div>

            {/* Evaluation Skeleton */}
            <div className="h-48 bg-slate-100/50 rounded-xl border border-slate-200" />
        </div>
    );
}
