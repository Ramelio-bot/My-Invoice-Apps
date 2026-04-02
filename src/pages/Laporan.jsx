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
    const [cashbook, setCashbook] = useState([]); 
    const [invoices, setInvoices] = useState([]); 
    const { user, canAccessReport } = useAuth();
    const { activeOutlet } = useOutlet() || {};

    const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'expenses'
    const [periodFilter, setPeriodFilter] = useState('today'); // 'today' | 'week' | 'month' | 'year'

    const [realData, setRealData] = useState({ invoices: [], kasir: [], cashbook: [], kasirExpenses: [], shifts: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [debts, setDebts] = useState({ hutang: 0, piutang: 0 });

    const now = new Date();
    const [selMonth, setSelMonth] = useState(now.getMonth());
    const [selYear, setSelYear] = useState(now.getFullYear());
    
    // Date Range Helper
    const getDateRange = () => {
        const today = new Date();
        const toISODate = (d) => d.toISOString().split('T')[0];

        if (periodFilter === 'today') {
            const dateStr = toISODate(today);
            return { start: dateStr, end: dateStr };
        }
        if (periodFilter === 'week') {
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const start = new Date(today);
            start.setDate(diff);
            return { start: toISODate(start), end: toISODate(today) };
        }
        if (periodFilter === 'month') {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: toISODate(start), end: toISODate(today) };
        }
        if (periodFilter === 'year') {
            const start = new Date(today.getFullYear(), 0, 1);
            return { start: toISODate(start), end: toISODate(today) };
        }
        return { start: toISODate(today), end: toISODate(today) };
    };

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
            const range = getDateRange();
            const startTimestamp = `${range.start}T00:00:00.000Z`;
            const endTimestamp = `${range.end}T23:59:59.999Z`;

            // 1. Fetch Cashbook
            let cbQuery = supabase.from('cashbook').select('*').eq('user_id', user.id).gte('date', range.start).lte('date', range.end);
            if (outletId) cbQuery = cbQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: cb } = await cbQuery;
            setCashbook(cb || []);

            // 2. Fetch Invoices
            let dq = supabase.from('documents').select('*').eq('user_id', user.id).in('type', ['invoice', 'kwitansi']).gte('date', range.start).lte('date', range.end);
            if (outletId) dq = dq.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: docs } = await dq;
            setInvoices(docs || []);

            // Fetch Kasir Sales
            let kq = supabase.from('kasir_transactions').select('*').eq('user_id', user.id).gte('created_at', startTimestamp).lte('created_at', endTimestamp);
            if (outletId) kq = kq.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: kasirTx } = await kq;

            // Fetch Kasir Expenses
            let expQ = supabase.from('kasir_expenses').select('*').eq('user_id', user.id).gte('date', range.start).lte('date', range.end);
            if (outletId) expQ = expQ.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: kExps } = await expQ;

            // Fetch shifts
            let shiftQ = supabase.from('kasir_shifts').select('id, employee_name, ended_at, shift_notes').eq('user_id', user.id).gte('ended_at', startTimestamp).lte('ended_at', endTimestamp).order('ended_at', { ascending: false });
            if (outletId) shiftQ = shiftQ.or(`outlet_id.eq.${outletId},outlet_id.is.null`);
            const { data: shifts } = await shiftQ;

            setRealData({
                invoices: docs || [],
                kasir: kasirTx || [],
                cashbook: cb || [],
                kasirExpenses: kExps || [],
                shifts: shifts || []
            });

            // Debt Summary
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
    }, [user, activeOutlet?.id, canAccessReport, periodFilter]);

    useEffect(() => {
        if (user) {
            fetchData();
            window.addEventListener('data-updated', fetchData);
            return () => window.removeEventListener('data-updated', fetchData);
        }
    }, [user, fetchData]);
    
    const unifiedEntries = [
        ...(realData.kasir || []).map(tx => ({
            id: tx.id,
            date: new Date(tx.created_at).toLocaleDateString('en-CA'),
            type: 'income',
            amount: Number(tx.total || 0),
            category: 'Penjualan Kasir',
            note: tx.receipt_number || 'POS'
        })),
        ...(realData.invoices || []).filter(i => i.status === 'paid' || i.status === 'Lunas' || i.status === t('inv_status_paid')).map(inv => ({
            id: inv.id,
            date: inv.date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-CA') : ''),
            type: 'income',
            amount: Number(inv.grandTotal || inv.total_amount || 0),
            category: 'Invoice Lunas',
            note: inv.clientName || inv.client_name || '-'
        })),
        ...(realData.kasirExpenses || []).map(ex => ({
            id: ex.id,
            date: ex.date,
            type: 'expense',
            amount: Number(ex.amount || 0),
            category: ex.category || 'Pengeluaran Kasir',
            note: ex.description || '-'
        })),
        ...(realData.cashbook || []).filter(c => !['Penjualan Kasir', 'Pengeluaran Kasir', 'Invoice Lunas'].includes(c.category)).map(c => ({
            id: c.id,
            date: c.date,
            type: c.type,
            amount: Number(c.amount || 0),
            category: c.category || (c.type === 'income' ? t('laporan_income') : t('laporan_expense')),
            note: c.description || t('lap_col_note')
        }))
    ];

    const filteredEntries = unifiedEntries; 

    const totalIncome = filteredEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = filteredEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const netProfit = totalIncome - totalExpense;
    
    const cashSalesTotal = (realData.kasir || []).filter(tx => (tx.payment_method || tx.metode) === 'Tunai').reduce((s, t) => s + (t.total || 0), 0);
    const cashExpensesTotal = (realData.kasirExpenses || []).reduce((s, e) => s + (e.amount || 0), 0) + (realData.cashbook || []).filter(c => c.type === 'expense').reduce((s, c) => s + (c.amount || 0), 0);
    const laciExpectation = cashSalesTotal - cashExpensesTotal;
    
    const incomeByCategory = {};
    const expenseByCategory = {};
    filteredEntries.forEach(e => {
        if (e.type === 'income') {
            incomeByCategory[e.category] = (incomeByCategory[e.category] || 0) + e.amount;
        } else {
            expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
        }
    });

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
        a.download = `${t('laporan_title')}-${periodFilter}.csv`;
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
        writeFile(wb, `${t('laporan_title')}-${periodFilter}.xlsx`);
    };

    const STATUS_MAP = {
        unpaid: { label: t('inv_status_unpaid'), color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        paid: { label: t('inv_status_paid'), color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        waiting: { label: t('inv_status_waiting'), color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        cancelled: { label: t('inv_status_cancelled'), color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
    };

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
        <>
        <div className="page-enter" style={{ padding: '24px 16px', maxWidth: 1000, margin: '0 auto' }}>
            {/* Header with Tab Switcher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: dark ? '#F8FAFC' : '#0F172A' }}>
                            {t('nav_report')}
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
                            {t('report_desc')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px solid #10B981', background: 'none', color: '#10B981', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            <Download size={14} /> CSV
                        </button>
                        <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: isPro ? '#10B981' : '#94A3B8', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            <FileSpreadsheet size={14} /> Excel {!isPro && '(PRO)'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {['today', 'week', 'month', 'year'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriodFilter(p)}
                            style={{
                                padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                                background: periodFilter === p ? '#7C3AED' : (dark ? '#1E293B' : '#F1F5F9'),
                                color: periodFilter === p ? '#FFFFFF' : (dark ? '#94A3B8' : '#64748B'),
                                border: 'none', cursor: 'pointer', transition: 'all 200ms',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {t(`period_${p}`)}
                        </button>
                    ))}
                </div>

                <div style={{ 
                    display: 'flex', background: dark ? '#1E293B' : '#F1F5F9', padding: 4, borderRadius: 12, 
                    width: 'fit-content' 
                }}>
                    <button
                        onClick={() => setActiveTab('sales')}
                        style={{
                            padding: '8px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: activeTab === 'sales' ? (dark ? '#334155' : '#FFFFFF') : 'transparent',
                            color: activeTab === 'sales' ? '#7C3AED' : '#94A3B8',
                            border: 'none', cursor: 'pointer', transition: 'all 200ms',
                            boxShadow: activeTab === 'sales' && !dark ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        {t('tab_sales')}
                    </button>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        style={{
                            padding: '8px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: activeTab === 'expenses' ? (dark ? '#334155' : '#FFFFFF') : 'transparent',
                            color: activeTab === 'expenses' ? '#7C3AED' : '#94A3B8',
                            border: 'none', cursor: 'pointer', transition: 'all 200ms',
                            boxShadow: activeTab === 'expenses' && !dark ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        {t('tab_expenses')}
                    </button>
                </div>
            </div>

            {/* Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {activeTab === 'sales' ? (
                    <>
                        <StatCard title={t('dash_income')} value={totalIncome} color="green" subtitle={t(`period_${periodFilter}`)} />
                        <StatCard 
                            title={t('laci_expectation')} 
                            value={laciExpectation} 
                            color="purple" 
                            subtitle={t('laci_physical_desc', 'Uang fisik di laci')}
                        />
                        <StatCard title={t('dash_net_profit')} value={netProfit} color="indigo" subtitle={t('after_expenses')} />
                        <StatCard title={t('total_transactions')} value={realData.kasir.length} color="amber" icon={Hash} />
                    </>
                ) : (
                    <>
                        <StatCard title={t('dash_expense')} value={totalExpense} color="red" subtitle={t('total_outflow')} />
                        <StatCard title={t('expense_count')} value={realData.kasirExpenses.length + (realData.cashbook || []).filter(c => c.type === 'expense').length} color="slate" icon={Hash} />
                    </>
                )}
            </div>

            <div className="card" style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: dark ? '#F8FAFC' : '#0F172A' }}>
                        {activeTab === 'sales' ? t('sales_breakdown') : t('expense_breakdown')}
                    </h2>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{periodFilter.toUpperCase()}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(activeTab === 'sales' ? incomeByCategory : expenseByCategory)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, val]) => (
                        <div 
                            key={cat} 
                            onClick={() => setPanel({ open: true, title: cat, items: filteredEntries.filter(e => e.category === cat), type: 'details' })}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', 
                                background: dark ? '#1E293B' : '#F8FAFC', borderRadius: 14, cursor: 'pointer',
                                transition: 'transform 200ms'
                            }}
                            className="hover:scale-[1.01]"
                        >
                            <div style={{ 
                                width: 40, height: 40, borderRadius: 10, background: activeTab === 'sales' ? '#DEF7EC' : '#FDE8E8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                            }}>
                                {activeTab === 'sales' ? <TrendingUp size={20} color="#059669" /> : <TrendingDown size={20} color="#DC2626" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: dark ? '#F1F5F9' : '#1E293B' }}>{cat}</p>
                                <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                                    {Math.round((val / (activeTab === 'sales' ? totalIncome : totalExpense || 1)) * 100)}% {t('of_total')}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: activeTab === 'sales' ? '#10B981' : '#EF4444' }}>
                                    {formatCompactCurrency(val)}
                                </p>
                            </div>
                        </div>
                    ))}
                    {Object.keys(activeTab === 'sales' ? incomeByCategory : expenseByCategory).length === 0 && (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <p style={{ color: '#94A3B8', fontSize: 14 }}>{t('no_data_period')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* MODAL */}
            {panel.open && (() => {
                const totalPages = Math.ceil((panel.items || []).length / itemsPerPage);
                const currentPageNum = typeof currentPage !== 'undefined' ? currentPage : 1; 
                const startIndex = (currentPageNum - 1) * itemsPerPage;
                const paginatedItems = (panel.items || []).slice(startIndex, startIndex + itemsPerPage);

                return (
                    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
                        <div className="flex min-h-full items-start sm:items-center justify-center p-4">
                            <div 
                                className="w-full max-w-4xl bg-slate-50 rounded-2xl shadow-2xl flex flex-col my-4 max-h-[85vh] overflow-hidden scale-in"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center p-5 bg-slate-900 text-white shrink-0">
                                    <div>
                                        <h2 className="text-xl font-black">{panel.title}</h2>
                                        <p className="text-xs font-bold text-slate-300 mt-1">Total: {panel.items.length} transaksi</p>
                                    </div>
                                    <button onClick={closePanel} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 custom-scrollbar">
                                    {paginatedItems.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 font-bold">Tidak ada data ditemukan.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {paginatedItems.map((item, i) => (
                                                <div key={i} style={{ 
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                    padding: '14px 0', borderBottom: i === paginatedItems.length - 1 ? 'none' : `1px solid ${dark ? '#334155' : '#F1F5F9'}` 
                                                }}>
                                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: dark ? '#F1F5F9' : '#1E293B' }}>
                                                            {item.category}
                                                        </p>
                                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {item.note || '-'}
                                                        </p>
                                                        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                                                            {item.date}
                                                        </p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ 
                                                            margin: 0, fontSize: 15, fontWeight: 900, 
                                                            color: item.type === 'income' ? '#10B981' : '#EF4444' 
                                                        }}>
                                                            {item.type === 'income' ? '+' : '-'}{formatIDR(item.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pagination Footer */}
                                {totalPages > 1 && (
                                    <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex justify-between items-center">
                                        <button disabled={currentPageNum === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 font-bold rounded-lg transition-colors">
                                            Sebelumnya
                                        </button>
                                        <span className="text-sm font-bold text-slate-500">Hal {currentPageNum} dari {totalPages}</span>
                                        <button disabled={currentPageNum === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 font-bold rounded-lg transition-colors">
                                            Selanjutnya
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`
                .scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes scaleIn {
                    from { transform: scale(0.95) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </>
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
