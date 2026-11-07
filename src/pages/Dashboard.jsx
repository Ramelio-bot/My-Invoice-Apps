import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, FileText, Plus, BarChart2, ArrowRight, HandCoins, Users, ShoppingCart } from 'lucide-react';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { formatDateID, getLast6Months, normalizeDateYMD, todayStr } from '../utils/date';
import { isMirrorCashbookRow, isPaidStatus, isUnpaidStatus } from '../utils/accounting';
import { useLang } from '../context/LanguageContext';

import { useAuth } from '../context/AuthContext';
import { useOutlet } from '../context/OutletContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const { t, lang } = useLang();
    const {
        user, loading,
    } = useAuth();
    const { activeOutlet } = useOutlet() || {};
    const { 
        getInvoiceCount, getKasirTransactionCount, getClientCount, 
        getHutangPiutangCount, 
        currentLimits, isUltimate, 
    } = usePlan();

//     const isFree = effectivePlan === 'free';

    const [cashbook, setCashbook] = useState([]); // Removed useLocalStorage
    const [invoices, setInvoices] = useState([]); // Removed useLocalStorage
    const [piutang, setPiutang] = useState([]);
    const [, setHutang] = useState([]);
    const [freshUnpaidInvoices, setFreshUnpaidInvoices] = useState([]); // Fresh from DB for card sync

    // Supabase state
    const [kasirData, setKasirData] = useState([]);
    const [kasirExpenses, setKasirExpenses] = useState([]);
    const [kasirToday, setKasirToday] = useState({ sales: 0, count: 0 });
    const [, setRecentNotes] = useState([]); // Shift notes and cashbook notes
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [posIncome, setPosIncome] = useState(0);
    const [invoiceIncome, setInvoiceIncome] = useState(0);
    const [cbVolume, setCbVolume] = useState(0);
    const [txCounts, setTxCounts] = useState({ income: 0, expense: 0 });
    const [shifts, setShifts] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true });
        } else if (user) {
            fetchDashboardData();
        }

        let debounceTimer;
        const handleSync = () => {
            if (!user) return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchDashboardData();
            }, 100);
        };

        window.addEventListener('data-updated', handleSync);
        window.addEventListener('external-sync', handleSync);
        window.addEventListener('cashbook-updated', handleSync);
        window.addEventListener('invoice-updated', handleSync);
        window.addEventListener('kasir-updated', handleSync);
        window.addEventListener('piutang-updated', handleSync);
        window.addEventListener('focus', handleSync);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') handleSync();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('data-updated', handleSync);
            window.removeEventListener('external-sync', handleSync);
            window.removeEventListener('cashbook-updated', handleSync);
            window.removeEventListener('invoice-updated', handleSync);
            window.removeEventListener('kasir-updated', handleSync);
            window.removeEventListener('piutang-updated', handleSync);
            window.removeEventListener('focus', handleSync);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearTimeout(debounceTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, loading, navigate, activeOutlet?.id]);

    const fetchDashboardData = async () => {
        if (!user) return;
        setIsFetching(true);

        setCashbook([]);
        setKasirData([]);
        setKasirExpenses([]);
        setInvoices([]);
        setPiutang([]);
        setHutang([]);
        setShifts([]);
        setFreshUnpaidInvoices([]);
        
        setTotalIncome(0);
        setTotalExpense(0);
        setTotalProfit(0);
        setPosIncome(0);
        setInvoiceIncome(0);
        setCbVolume(0);
        setTxCounts({ income: 0, expense: 0 });
        setKasirToday({ sales: 0, count: 0 });
        setRecentNotes([]);

        let docData = [];
        const outletId = activeOutlet?.id || null;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const currentMonthStr = `${year}-${month}`;

        const sixMonthsStart = new Date(year, now.getMonth() - 5, 1, 0, 0, 0, 0);
        const sixMonthsStartIso = sixMonthsStart.toISOString();
        const sixMonthsStartYMD = `${sixMonthsStart.getFullYear()}-${String(sixMonthsStart.getMonth() + 1).padStart(2, '0')}-01`;

        try {
            // 1. Prepare Queries (6-month window for chart + current month deduplicated)
            let cbAllQuery = supabase.from('cashbook')
                .select('id, type, amount, date, category, description, outlet_id, created_at, receipt_url, document_id, reference_type, reference_id, is_automated')
                .eq('user_id', user.id)
                .gte('date', sixMonthsStartYMD)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(2000);
            if (outletId) cbAllQuery = cbAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let docAllQuery = supabase.from('documents')
                .select('id, type, doc_number, client_name, total_amount, status, created_at, data, outlet_id')
                .eq('user_id', user.id)
                .in('type', ['invoice', 'inv', 'piutang', 'hutang'])
                .order('created_at', { ascending: false })
                .limit(500);
            if (outletId) docAllQuery = docAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let shiftQuery = supabase.from('kasir_shifts')
                .select('id, employee_name, ended_at, shift_notes, actual_cash, shift_number')
                .eq('user_id', user.id)
                .order('ended_at', { ascending: false }).limit(5);
            if (outletId) shiftQuery = shiftQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let txAllQuery = supabase.from('kasir_transactions')
                .select('id, total, created_at, receipt_number, outlet_id')
                .eq('user_id', user.id)
                .eq('status', 'paid')
                .gte('created_at', sixMonthsStartIso)
                .order('created_at', { ascending: false });
            if (outletId) txAllQuery = txAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let expMonthQuery = supabase.from('kasir_expenses')
                .select('amount, date, created_at, category, description')
                .eq('user_id', user.id)
                .gte('date', `${currentMonthStr}-01`)
                .order('date', { ascending: false });
            if (outletId) expMonthQuery = expMonthQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let cbMonthQuery = supabase.from('cashbook')
                .select('id, type, amount, date, category, description, outlet_id, created_at, receipt_url, document_id, reference_type, reference_id, is_automated')
                .eq('user_id', user.id)
                .gte('date', `${currentMonthStr}-01`)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });
            if (outletId) cbMonthQuery = cbMonthQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let expAllQuery = supabase.from('kasir_expenses')
                .select('id, amount, date, created_at, category, description, outlet_id')
                .eq('user_id', user.id)
                .gte('date', sixMonthsStartYMD)
                .order('date', { ascending: false });
            if (outletId) expAllQuery = expAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            // 2. Parallel Burst Fetch
            const [
                { data: allCb },
                { data: rawDocs },
                { data: shiftsData },
                { data: allKasirTx },
                { data: monthExps },
                { data: monthCb },
                { data: allKExps }
            ] = await Promise.all([
                cbAllQuery, docAllQuery, shiftQuery, txAllQuery, expMonthQuery, cbMonthQuery, expAllQuery
            ]);

            docData = rawDocs || [];

            // 3. Process States with Bulletproof Month Deduplication
            const cbMap = new Map();
            (allCb || []).forEach(item => cbMap.set(item.id, item));
            (monthCb || []).forEach(item => cbMap.set(item.id, item));
            const mergedCb = Array.from(cbMap.values());

            setCashbook(mergedCb);
            if (shiftsData) setShifts(shiftsData);
            if (allKExps) setKasirExpenses(allKExps);
            if (allKasirTx) setKasirData(allKasirTx);

            // 4. Detailed Calculations (Invoices only — never auto-kwitansi)
            const combinedInvoices = docData.filter(d => ['invoice', 'inv'].includes(d.type)).map(d => ({
                ...(d.data || {}),
                id: d.id,
                type: d.type,
                number: d.doc_number || d.data?.doc_number || (d.data || {}).number,
                clientName: d.client_name || d.data?.client_name || d.data?.clientName,
                grandTotal: Number(d.total_amount ?? d.data?.grandTotal ?? d.data?.amount ?? 0),
                status: d.status,
                date: normalizeDateYMD(d.data?.date, d.created_at)
            }));
            setInvoices(combinedInvoices);

            const unpaidInvoices = combinedInvoices.filter(i => isUnpaidStatus(i.status));
            setFreshUnpaidInvoices(unpaidInvoices);

            const piutangList = docData.filter(d => d.type === 'piutang').map(d => ({
                ...(d.data || {}),
                id: d.id,
                name: d.client_name || d.data?.client_name || d.data?.name,
                amount: Number(d.total_amount ?? d.data?.grandTotal ?? d.data?.amount ?? 0),
                status: d.status || 'unpaid',
                date: normalizeDateYMD(d.data?.date, d.created_at)
            }));
            setPiutang(piutangList);

            const hutangList = docData.filter(d => d.type === 'hutang').map(d => ({
                ...(d.data || {}),
                id: d.id,
                name: d.client_name || d.data?.client_name || d.data?.name,
                amount: Number(d.total_amount ?? d.data?.grandTotal ?? d.data?.amount ?? 0),
                status: d.status || 'unpaid',
                date: normalizeDateYMD(d.data?.date, d.created_at)
            }));
            setHutang(hutangList);

            // 5. UNIFIED 4-SOURCE ACCOUNTING ENGINE (100% Parity with Laporan.jsx)
            const unifiedEntries = [
                // 1. POS Sales (paid)
                ...(allKasirTx || []).map(tx => ({
                    date: normalizeDateYMD(null, tx.created_at),
                    type: 'income',
                    amount: Number(tx.total || 0),
                    category: t('laporan_pos_category')
                })),
                // 2. Paid Invoices (invoice / inv only)
                ...combinedInvoices.filter(inv => isPaidStatus(inv.status)).map(inv => ({
                    date: inv.date,
                    type: 'income',
                    amount: Number(inv.grandTotal || 0),
                    category: t('laporan_inv_category')
                })),
                // 3. POS Expenses
                ...(allKExps || []).map(ex => ({
                    date: normalizeDateYMD(ex.date, ex.created_at),
                    type: 'expense',
                    amount: Number(ex.amount || 0),
                    category: ex.category || 'Pengeluaran Kasir'
                })),
                // 4. Direct Cashbook (Business Notes + Standalone Kwitansi + Settled Hutang/Piutang)
                ...mergedCb.filter(c => !isMirrorCashbookRow(c)).map(c => ({
                    date: normalizeDateYMD(c.date, c.created_at),
                    type: c.type,
                    amount: Number(c.amount || 0),
                    category: c.category || (c.type === 'income' ? t('laporan_income') : t('laporan_expense'))
                }))
            ];

            // 6. Monthly Totals & Receivable KPI
            const monthEntries = unifiedEntries.filter(e => e.date && e.date.startsWith(currentMonthStr));
            const monthIncomeEntries = monthEntries.filter(e => e.type === 'income');
            const monthExpenseEntries = monthEntries.filter(e => e.type === 'expense');

            const totalMonthlyIncomeValue = monthIncomeEntries.reduce((s, e) => s + e.amount, 0);
            const totalMonthlyExpenseValue = monthExpenseEntries.reduce((s, e) => s + e.amount, 0);

            const docPiutangValue = piutangList.filter(d => isUnpaidStatus(d.status)).reduce((s, d) => s + (Number(d.amount) || 0), 0);
            const unpaidInvoicesTotalValue = (unpaidInvoices || []).reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
            const totalReceivables = docPiutangValue + unpaidInvoicesTotalValue;

            setTotalIncome(totalMonthlyIncomeValue);
            setTotalExpense(totalMonthlyExpenseValue);
            setTotalProfit(totalMonthlyIncomeValue - totalMonthlyExpenseValue);
            setTxCounts({ income: monthIncomeEntries.length, expense: monthExpenseEntries.length });
            setPosIncome((allKasirTx || []).filter(trx => normalizeDateYMD(null, trx.created_at).startsWith(currentMonthStr)).reduce((s, trx) => s + Number(trx.total || 0), 0));
            setInvoiceIncome(combinedInvoices.filter(i => isPaidStatus(i.status) && i.date && i.date.startsWith(currentMonthStr)).reduce((s, i) => s + Number(i.grandTotal || 0), 0));
            setCbVolume(totalReceivables); 

            // 7. Today POS Activity (Local Timezone Accurate)
            const todayISO = todayStr();
            const todayTxs = (allKasirTx || []).filter(trx => normalizeDateYMD(null, trx.created_at) === todayISO);
            setKasirToday({
                sales: todayTxs.reduce((s, trx) => s + Number(trx.total || 0), 0),
                count: todayTxs.length
            });

            // Update Recent Notes UI (Show most recent from month, not just today)
            const combinedNotes = [
                // 1. Shift Notes
                ...(shiftsData || []).filter(s => s.shift_notes).map(s => ({
                    text: s.shift_notes,
                    source: `Shift: ${s.employee_name}`,
                    date: s.ended_at,
                    type: 'shift'
                })),
                // 2. Manual Cashbook
                ...(monthCb || []).filter(c => c.description).map(c => ({
                    text: c.description,
                    source: c.category || (c.type === 'income' ? t('dash_income') : t('dash_expense')),
                    date: c.date || c.created_at,
                    type: 'cashbook'
                })),
                // 3. POS Expenses (Previously Missing)
                ...(monthExps || []).filter(e => e.description).map(e => ({
                    text: e.description,
                    source: e.category || t('dash_expense'),
                    date: e.date || e.created_at,
                    type: 'pos_expense'
                }))
            ].sort((a, b) => new Date(b.date || b.ended_at) - new Date(a.date || a.ended_at));
            
            // Limit to most recent 5 for processing, UI will slice again
            setRecentNotes(combinedNotes.slice(0, 5));

        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setIsFetching(false);
        }
    };

    const monthlyIncomeValue = totalIncome;
    const monthlyExpenseValue = totalExpense;
    const netProfitValue = totalProfit;

    // FIX VARIABEL HANTU UNTUK UI 
    const posSalesIncome = posIncome || 0;
    const invoicesIncome = invoiceIncome || 0;

    const unpaidInvoices = freshUnpaidInvoices;
    const unpaidPiutangCount = (piutang || []).filter(p => isUnpaidStatus(p.status)).length;
    const totalUnpaidReceivableCount = unpaidInvoices.length + unpaidPiutangCount;

    // Recent activity: last 10 items from direct cashbook + invoices + POS merged & sorted
    const allActivity = [
        ...(cashbook || []).filter(e => !isMirrorCashbookRow(e)).map(e => ({
            id: e.id,
            label: e.category,
            sub: e.description && e.description.length > 30 ? e.description.substring(0, 30) + '...' : e.description || e.notes,
            amount: e.amount,
            type: e.type,
            date: normalizeDateYMD(e.date, e.created_at),
            kind: 'cashbook',
        })),
        ...(invoices || []).map(inv => ({
            id: inv.id,
            label: `Invoice ${inv.number}`,
            sub: inv.clientName,
            amount: inv.grandTotal,
            type: 'invoice',
            date: inv.date,
            kind: 'invoice',
            status: inv.status,
        })),
        ...(kasirData || []).map(tx => ({
            id: tx.id,
            label: `${t('nav_kasir')}: ${tx.receipt_number}`,
            sub: t('dash_pos_sale'),
            amount: tx.total,
            type: 'income',
            date: normalizeDateYMD(null, tx.created_at),
            kind: 'kasir',
        })),
        ...(kasirExpenses || []).map(ex => ({
            id: ex.id,
            label: ex.category || t('nav_kasir_expenses'),
            sub: ex.description,
            amount: ex.amount,
            type: 'expense',
            date: normalizeDateYMD(ex.date, ex.created_at),
            kind: 'kasir_expense',
        }))
    ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    // Bar chart data: last 6 months realized income vs expense (100% consistent with KPIs)
    const months = getLast6Months(lang);

    const getDocumentMonthInc = (m, y) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        return invoices
            .filter(inv => isPaidStatus(inv.status) && inv.date && inv.date.startsWith(monthStr))
            .reduce((s, i) => s + Number(i.grandTotal || 0), 0);
    };

    const getKasirMonthInc = (m, y) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        return kasirData
            .filter(trx => normalizeDateYMD(null, trx.created_at).startsWith(monthStr))
            .reduce((s, trx) => s + Number(trx.total || 0), 0);
    };

    const getKasirMonthExp = (m, y) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        return kasirExpenses
            .filter(e => normalizeDateYMD(e.date, e.created_at).startsWith(monthStr))
            .reduce((s, e) => s + Number(e.amount || 0), 0);
    };

    const getCashbookMonthSum = (type, m, y) => {
        const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
        return cashbook
            .filter(e => e.type === type && !isMirrorCashbookRow(e) && normalizeDateYMD(e.date, e.created_at).startsWith(monthStr))
            .reduce((s, e) => s + Number(e.amount || 0), 0);
    };

    const chartMax = Math.max(
        ...months.map(m => {
            const incManual = getCashbookMonthSum('income', m.month, m.year);
            const incDoc = getDocumentMonthInc(m.month, m.year);
            const incKasir = getKasirMonthInc(m.month, m.year);
            const totalInc = incManual + incDoc + incKasir;
            
            const expManual = getCashbookMonthSum('expense', m.month, m.year);
            const expKasir = getKasirMonthExp(m.month, m.year);
            const totalExp = expManual + expKasir;
            
            return Math.max(totalInc, totalExp);
        }), 1
    );

    const chartData = months.map(m => {
        const incManual = getCashbookMonthSum('income', m.month, m.year);
        const incDoc = getDocumentMonthInc(m.month, m.year);
        const incKasir = getKasirMonthInc(m.month, m.year);
        const totalInc = incManual + incDoc + incKasir;

        const expManual = getCashbookMonthSum('expense', m.month, m.year);
        const expKasir = getKasirMonthExp(m.month, m.year);
        const totalExp = expManual + expKasir;

        return {
            ...m,
            incInv: incManual + incDoc,
            incKasir,
            totalInc,
            exp: totalExp,
            incInvPct: ((incManual + incDoc) / chartMax) * 100,
            incKasirPct: (incKasir / chartMax) * 100,
            expPct: (totalExp / chartMax) * 100
        };
    });

    if (loading || isFetching) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="page-enter" style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto', paddingBottom: 'calc(env(safe-area-inset-bottom, 1rem) + 1.5rem)' }}>
            {/* Menara Pengawas Styles */}
            <style>{`
                @keyframes pulse-red-soft {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { transform: scale(1.01); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .pulse-alert {
                    animation: pulse-red-soft 2s infinite;
                    border: 1.5px solid #EF4444 !important;
                }
            `}</style>

            {/* Header with Sleek Modern Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200/80">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                            {t('nav_home')}
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            {t('period_month')}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {t('dash_welcome')}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => navigate('/catatan-bisnis')}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus size={14} className="text-slate-500" />
                        <span>{t('dash_quick_income') || 'Catat Kas'}</span>
                    </button>
                    <button
                        onClick={() => navigate('/invoice')}
                        className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <FileText size={14} />
                        <span>{t('dash_quick_invoice') || '+ Buat Invoice'}</span>
                    </button>
                </div>
            </div>

            {/* Menara Pengawas (Usage Monitor) - Hidden for Ultimate for "Clean" Look */}
            {!isUltimate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { 
                            label: t('nav_invoice'), 
                            count: getInvoiceCount(), 
                            limit: currentLimits?.invoices || 0, 
                            icon: FileText,
                            color: '#6366F1'
                        },
                        { 
                            label: t('nav_kasir'), 
                            count: getKasirTransactionCount(), 
                            limit: currentLimits?.kasir || 0, 
                            icon: ShoppingCart,
                            color: '#8B5CF6'
                        },
                        { 
                            label: t('nav_clients'), 
                            count: getClientCount(), 
                            limit: currentLimits?.clients || 0, 
                            icon: Users,
                            color: '#EC4899'
                        },
                        { 
                            label: t('nav_piutang'), 
                            count: getHutangPiutangCount(), 
                            limit: currentLimits?.hutangPiutang || 0, 
                            icon: HandCoins,
                            color: '#10B981'
                        }
                    ].map((item, idx) => {
                        const limitVal = item.limit || 1; // Prevent division by zero
                        const percentage = Math.min((item.count / limitVal) * 100, 100);
                        const isHigh = percentage >= 80;
                        const accentColor = isHigh ? '#EF4444' : item.color;
                        
                        return (
                            <div 
                                key={idx} 
                                className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all ${isHigh ? 'pulse-alert' : ''}`}
                                style={{ position: 'relative', overflow: 'hidden' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ padding: 8, background: `${accentColor}15`, color: accentColor, borderRadius: 10 }}>
                                            <item.icon size={18} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: accentColor }}>
                                        {isUltimate ? item.count : `${item.count} / ${item.limit}`}
                                    </span>
                                </div>

                                {/* Progress Bar Container */}
                                <div style={{ height: 8, background: '#F1F5F9', borderRadius: 10, width: '100%', marginBottom: 10 }}>
                                    <div style={{ 
                                        height: '100%', 
                                        width: `${percentage}%`, 
                                        background: accentColor, 
                                        borderRadius: 10,
                                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                                    }} />
                                </div>

                                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: isHigh ? '#EF4444' : '#94A3B8' }}>
                                    {isUltimate 
                                        ? t('unlimited')
                                        : isHigh 
                                            ? t('limit_alert_msg')
                                            : `${t('remaining_quota_msg')} ${item.limit - item.count}`
                                    }
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 4 Clean Minimalist KPI Cards (Matching Approved Mockup) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard 
                    title={t('dash_income')} 
                    value={monthlyIncomeValue} 
                    badge={t('period_month') || 'Bulan Ini'}
                    badgeColor="emerald"
                    color="slate"
                    subtitle={t('dash_income_source') || 'Kasir POS + Invoice + Catatan'}
                    subValue={`${txCounts.income} ${t('transaksi') || 'Transaksi'}`}
                />
                <StatCard 
                    title={t('dash_expense')} 
                    value={monthlyExpenseValue} 
                    badge={t('dash_expense_badge') || 'Beban Usaha'}
                    badgeColor="slate"
                    color="slate"
                    subtitle={t('dash_expense_sub') || 'Operasional & Kasir'}
                    subValue={`${txCounts.expense} ${t('catatan') || 'Catatan'}`}
                />
                <StatCard 
                    title={t('dash_profit') || t('dash_net_profit')} 
                    value={netProfitValue} 
                    badge={monthlyIncomeValue > 0 ? `Margin ${Math.round((netProfitValue / monthlyIncomeValue) * 100)}%` : (t('period_month') || 'Bulan Ini')}
                    badgeColor="violet"
                    color="violet"
                    subtitle={t('dash_profit_sub') || 'Pendapatan - Beban'}
                    subValue={netProfitValue >= 0 ? (t('healthy_status') || 'Surplus') : (t('deficit_status') || 'Defisit')}
                />
                <StatCard 
                    title={t('report_cat_receivable')} 
                    value={cbVolume} 
                    badge={totalUnpaidReceivableCount > 0 ? `${totalUnpaidReceivableCount} ${t('dash_unpaid_badge') || 'Belum Bayar'}` : (t('no_unpaid_badge') || 'Semua Lunas')}
                    badgeColor={totalUnpaidReceivableCount > 0 ? 'amber' : 'slate'}
                    color="slate"
                    subtitle={`${t('lap_summary_for')} ${t('inv_status_unpaid')}`}
                    subValue={totalUnpaidReceivableCount > 0 ? (t('need_followup') || 'Perlu Ditagih') : (t('all_paid') || 'Lunas')}
                    onClick={() => navigate(unpaidInvoices.length === 0 && unpaidPiutangCount > 0 ? '/hutang-piutang' : '/invoice')}
                />
            </div>

            {/* Modern Clean 2-Col Layout: 6-Month Chart & Cashier POS/Mix Module */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
                {/* 6-Month Chart (8 Cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                {t('dash_chart')}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">{t('dash_new_income_desc') || 'Perbandingan arus kas masuk vs arus kas keluar bulanan'}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-violet-600"></span> {t('dash_legend_invoice')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> {t('dash_legend_kasir')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span> {t('dash_legend_expense')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-end gap-4 sm:gap-6 h-44 pt-4 px-2">
                        {chartData.map((m, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                                    {/* Stacked Income (Kasir + Invoice) */}
                                    <div className="w-4 sm:w-6 flex flex-col justify-end h-full">
                                        <div
                                            style={{ height: `${Math.max(m.incKasirPct, 0)}%` }}
                                            className="w-full bg-amber-400 rounded-t-sm transition-all group-hover:bg-amber-500"
                                            title={`${t('dash_legend_kasir')}: ${formatIDR(m.incKasir)}`}
                                        />
                                        <div
                                            style={{ height: `${Math.max(m.incInvPct, 2)}%` }}
                                            className="w-full bg-violet-600 rounded-t-sm transition-all group-hover:bg-violet-700"
                                            title={`${t('dash_legend_invoice')}: ${formatIDR(m.incInv)}`}
                                        />
                                    </div>
                                    {/* Expense Bar */}
                                    <div className="w-4 sm:w-6 flex items-end h-full">
                                        <div
                                            style={{ height: `${Math.max(m.expPct, 2)}%` }}
                                            className="w-full bg-slate-200 rounded-t-sm transition-all group-hover:bg-slate-300"
                                            title={`${t('dash_legend_expense')}: ${formatIDR(m.exp)}`}
                                        />
                                    </div>
                                </div>
                                <span className={`text-[11px] font-semibold ${i === chartData.length - 1 ? 'font-bold text-violet-700' : 'text-slate-400'}`}>
                                    {m.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Module: Live POS Cashier & Revenue Mix (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Kasir Today Clean Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    {t('dash_kasir_sales')}
                                </span>
                            </div>
                            <button
                                onClick={() => navigate('/kasir')}
                                className="text-xs font-bold text-violet-600 hover:text-violet-800 bg-transparent border-none cursor-pointer"
                            >
                                {t('nav_kasir')} →
                            </button>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono">
                            {formatIDR(kasirToday.sales)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                            {kasirToday.count || 0} {t('transaksi_hari_ini') || 'transaksi kasir hari ini'}
                        </p>
                    </div>

                    {/* Revenue Composition Mix */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                            {t('revenue_mix') || 'Komposisi Pendapatan'}
                        </span>
                        
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-600">{t('dash_pos_sales_label') || 'Penjualan POS'}</span>
                                <span className="font-bold text-slate-900 font-mono">{formatIDR(posSalesIncome)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-600">{t('dash_invoices_paid_label') || 'Invoice (Lunas)'}</span>
                                <span className="font-bold text-slate-900 font-mono">{formatIDR(invoicesIncome)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-600">{t('dash_manual_income_label') || 'Catatan Kas & Lainnya'}</span>
                                <span className="font-bold text-slate-900 font-mono">{formatIDR(Math.max(0, monthlyIncomeValue - posSalesIncome - invoicesIncome))}</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                                <div className="bg-amber-400 h-full transition-all" style={{ width: `${(posSalesIncome / (monthlyIncomeValue || 1)) * 100}%` }} title={`POS: ${formatIDR(posSalesIncome)}`} />
                                <div className="bg-violet-600 h-full transition-all" style={{ width: `${(invoicesIncome / (monthlyIncomeValue || 1)) * 100}%` }} title={`Invoice: ${formatIDR(invoicesIncome)}`} />
                                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(Math.max(0, monthlyIncomeValue - posSalesIncome - invoicesIncome) / (monthlyIncomeValue || 1)) * 100}%` }} title={`Catatan: ${formatIDR(Math.max(0, monthlyIncomeValue - posSalesIncome - invoicesIncome))}`} />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic pt-1">{t('revenue_mix_desc')}</p>
                    </div>
                </div>
            </div>

            {/* Unpaid Invoices Table (Clean Minimalist List) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden mb-6">
                <div className="p-5 flex items-center justify-between border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">{t('dash_unpaid_list')}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{t('lap_summary_for')} {t('inv_status_unpaid')}</p>
                    </div>
                    <button
                        onClick={() => navigate('/invoice')}
                        className="text-xs font-bold text-slate-700 hover:text-black bg-transparent border-none cursor-pointer"
                    >
                        {t('view_all')} →
                    </button>
                </div>

                {unpaidInvoices.length === 0 ? (
                    <div className="py-8">
                        <EmptyState title={t('dash_no_unpaid')} description={t('dash_no_unpaid_desc')} />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {unpaidInvoices.slice(0, 5).map(inv => (
                            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition gap-4">
                                <div className="space-y-0.5 min-w-0">
                                    <div className="text-xs font-bold text-slate-900 truncate">{inv.clientName || 'Klien'}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">
                                        {inv.number || 'INV-XXX'} {inv.dueDate ? `• Jatuh tempo ${inv.dueDate}` : ''}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                                        {formatIDR(inv.grandTotal)}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                        {t('dash_unpaid_badge') || 'Belum Lunas'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className={`card ${isFetching ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`} style={{ marginTop: 20, animation: 'none' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#1E293B' }}>
                    {t('dash_recent')}
                </h2>
                {allActivity.length === 0 ? (
                    <EmptyState title={t('dash_no_activity')} description={t('dash_no_activity_desc')} />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {allActivity.map((item, i) => (
                            <div key={item.id || i} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                                borderRadius: 8, transition: 'background 200ms',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                    background: item.type === 'income' ? '#10B981'
                                        : item.type === 'expense' ? '#EF4444' : '#7C3AED',
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {item.label}
                                    </p>
                                    {item.sub && <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{item.sub}</p>}
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{
                                        margin: 0, fontSize: 13, fontWeight: 700,
                                        color: item.type === 'income' ? '#10B981' : item.type === 'expense' ? '#EF4444' : '#7C3AED',
                                    }} title={formatIDR(item.amount || 0)}>
                                        {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}{formatCompactCurrency(item.amount || 0)}
                                    </p>
                                    <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{formatDateID(item.date, lang)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Professional Business Notes Section */}
            <div className="mt-8 bg-white  rounded-2xl border border-slate-200  shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200  flex items-center justify-between bg-slate-50 /50">
                    <h3 className="text-lg font-bold text-slate-800  flex items-center gap-2">
                        <FileText size={20} className="text-violet-600" />
                        {t('dash_ops_log')}
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {shifts && shifts.length > 0 ? shifts.map((shift, idx) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100  bg-white  hover:border-violet-300  transition-colors shadow-sm">
                                <div className="flex-none">
                                    <div className="w-12 h-12 rounded-full bg-violet-100  flex items-center justify-center text-violet-600 font-black text-lg shadow-inner">
                                        {shift.employee_name?.charAt(0)?.toUpperCase() || 'K'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                                        <div>
                                            <h4 className="font-bold text-slate-800  text-base">{shift.employee_name || t('kasir_staff_fallback')}</h4>
                                            <p className="text-xs text-slate-500  font-medium">{new Date(shift.ended_at).toLocaleDateString(t('locale_code') || (lang === 'ID' ? 'id-ID' : 'en-US'))} • Shift {shift.shift_number || '1'}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-50  text-emerald-600  text-xs font-bold rounded-lg border border-emerald-100 ">
                                            {t('dash_cash_label')} {new Intl.NumberFormat(lang === 'ID' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(shift.actual_cash || 0).replace('IDR', 'Rp')}
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-slate-50  rounded-lg border border-slate-100  text-sm text-slate-600  relative">
                                        <span className="absolute -top-2 left-3 bg-slate-50  px-1 text-[10px] font-bold text-slate-400">{t('dash_notes_label')}</span>
                                        <p className="leading-relaxed italic">"{shift.shift_notes || t('dash_no_ops_notes')}"</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-100  rounded-full flex items-center justify-center mb-3">
                                    <FileText size={24} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500  font-medium">{t('dash_no_ops_yet')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="p-6 max-w-[1200px] mx-auto animate-pulse">
            {/* Header Skeleton */}
            <div className="mb-8">
                <div className="h-8 w-48 bg-slate-200 rounded-lg mb-2" />
                <div className="h-4 w-64 bg-slate-100 rounded-lg" />
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-slate-200/60 rounded-xl border border-slate-200" />
                ))}
            </div>

            {/* Evaluation & Revenue Mix Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="h-48 bg-slate-200/50 rounded-xl border border-slate-200" />
                <div className="h-48 bg-slate-100 rounded-xl border border-slate-200" />
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-slate-200/40 rounded-2xl border border-slate-200" />
                ))}
            </div>

            {/* Chart & Unpaid Invoices Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="h-80 bg-slate-100/80 rounded-xl border border-slate-100" />
                <div className="h-80 bg-slate-100/80 rounded-xl border border-slate-100" />
            </div>

            {/* Recent Activity Skeleton */}
            <div className="mt-5 h-64 bg-slate-50 rounded-xl border border-slate-100" />
        </div>
    );
}
// Pancingan untuk Vercel 1 April
