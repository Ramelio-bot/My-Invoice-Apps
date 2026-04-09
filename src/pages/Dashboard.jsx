import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, FileText, Plus, BarChart2, ArrowRight, HandCoins, Users, ShoppingCart } from 'lucide-react';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { formatDateID, getLast6Months, isThisMonth } from '../utils/date';
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
        user, loading, effectivePlan, isAdmin,
        canAccessReport, canAccessAdvancedKasir,
        canAccessMultiOutlet, canAccessKaryawan,
        canWhiteLabelStruk, canAccessHPP
    } = useAuth();
    const { activeOutlet } = useOutlet() || {};
    const { 
        getInvoiceCount, getKasirTransactionCount, getClientCount, 
        getHutangPiutangCount, getQuotationCount, getPOCount, getTandaTerimaCount,
        currentLimits, isUltimate, isPro 
    } = usePlan();

    const isFree = effectivePlan === 'free';

    const [cashbook, setCashbook] = useState([]); // Removed useLocalStorage
    const [invoices, setInvoices] = useState([]); // Removed useLocalStorage
    const [piutang, setPiutang] = useState([]); // Removed useLocalStorage
    const [hutang, setHutang] = useState([]); // Removed useLocalStorage
    const [freshUnpaidInvoices, setFreshUnpaidInvoices] = useState([]); // Fresh from DB for card sync

    // Supabase state
    const [kasirData, setKasirData] = useState([]);
    const [kasirExpenses, setKasirExpenses] = useState([]);
    const [kasirToday, setKasirToday] = useState({ sales: 0, count: 0 });
    const [recentNotes, setRecentNotes] = useState([]); // Shift notes and cashbook notes
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [posIncome, setPosIncome] = useState(0);
    const [invoiceIncome, setInvoiceIncome] = useState(0);
    const [cbVolume, setCbVolume] = useState(0); // New State
    const [shifts, setShifts] = useState([]); // Raw shifts for Timeline Card
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
            }, 500);
        };

        window.addEventListener('data-updated', handleSync);

        return () => {
            window.removeEventListener('data-updated', handleSync);
            clearTimeout(debounceTimer);
        };
    }, [user?.id, loading, navigate, activeOutlet?.id]);

    // Helper: convert UTC ISO timestamp to local YYYY-MM-DD string
    const toLocalDate = (isoStr) => new Date(isoStr).toLocaleDateString('en-CA');

    const fetchDashboardData = async () => {
        if (!user) return;
        setIsFetching(true);
        let docData = []; // Primary scope fix
        const outletId = activeOutlet?.id || null;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthISO = startOfMonth.toISOString().split('T')[0] + 'T00:00:00.000Z';

        try {
            // 1. Prepare Queries
            let cbAllQuery = supabase.from('cashbook').select('*').eq('user_id', user.id);
            if (outletId) cbAllQuery = cbAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let docAllQuery = supabase.from('documents').select('*').eq('user_id', user.id);
            if (outletId) docAllQuery = docAllQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let shiftQuery = supabase.from('kasir_shifts')
                .select('id, employee_name, ended_at, shift_notes, actual_cash, shift_number')
                .eq('user_id', user.id)
                .order('ended_at', { ascending: false }).limit(5);

            let txMonthQuery = supabase.from('kasir_transactions').select('total, created_at').eq('user_id', user.id).gte('created_at', startOfMonthISO);
            if (outletId) txMonthQuery = txMonthQuery.eq('outlet_id', outletId);

            let expMonthQuery = supabase.from('kasir_expenses').select('amount, date, category, description').eq('user_id', user.id).gte('date', startOfMonth.toISOString().split('T')[0]);
            if (outletId) expMonthQuery = expMonthQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let cbMonthQuery = supabase.from('cashbook').select('*').eq('user_id', user.id).gte('date', startOfMonth.toISOString().split('T')[0]);
            if (outletId) cbMonthQuery = cbMonthQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let expAllQuery = supabase.from('kasir_expenses').select('*').eq('user_id', user.id);
            if (outletId) expAllQuery = expAllQuery.eq('outlet_id', outletId);

            // 2. Parallel Burst Fetch
            const [
                { data: allCb },
                { data: rawDocs },
                { data: shiftsData },
                { data: monthTxs },
                { data: monthExps },
                { data: monthCb },
                { data: allKExps }
            ] = await Promise.all([
                cbAllQuery, docAllQuery, shiftQuery, txMonthQuery, expMonthQuery, cbMonthQuery, expAllQuery
            ]);

            docData = rawDocs || [];

            // 3. Process States
            if (allCb) setCashbook(allCb);
            if (shiftsData) setShifts(shiftsData);
            if (allKExps) setKasirExpenses(allKExps);

            // 4. Detailed Calculations (No Stale State)
            const combinedInvoices = docData.filter(d => ['invoice', 'kwitansi'].includes(d.type)).map(d => ({
                ...(d.data || {}),
                id: d.id,
                type: d.type,
                number: d.doc_number || (d.data || {}).number,
                clientName: d.client_name,
                grandTotal: d.total_amount || (d.data || {}).grandTotal,
                status: d.status,
                date: d.created_at ? toLocalDate(d.created_at) : ((d.data || {}).date || '')
            }));
            setInvoices(combinedInvoices);

            const unpaidInvoices = combinedInvoices.filter(i => ['unpaid', 'waiting', 'Belum Bayar', 'Menunggu'].includes(i.status));
            setFreshUnpaidInvoices(unpaidInvoices);

            const piutangList = docData.filter(d => d.type === 'piutang').map(d => ({
                ...(d.data || {}),
                id: d.id,
                name: d.client_name,
                amount: d.total_amount || (d.data || {}).amount,
                status: d.status,
                date: d.created_at ? toLocalDate(d.created_at) : ((d.data || {}).date || '')
            }));
            setPiutang(piutangList);

            const hutangList = docData.filter(d => d.type === 'hutang').map(d => ({
                ...(d.data || {}),
                id: d.id,
                name: d.client_name,
                amount: d.total_amount || (d.data || {}).amount,
                status: d.status,
                date: d.created_at ? toLocalDate(d.created_at) : ((d.data || {}).date || '')
            }));
            setHutang(hutangList);

            // 5. Aggregate Logic (Realized vs Accrual)
            const posIncomeVal = (monthTxs || []).reduce((s, t) => s + (t.total || 0), 0);
            const paidInvoicesVal = docData.filter(d => (d.type === 'invoice' || d.type === 'kwitansi') && (d.status === 'paid' || d.status === 'Lunas')).reduce((s, d) => s + (Number(d.total_amount) || 0), 0);
            const manualIncomeOnly = (monthCb || []).filter(c => c.type === 'income' && c.is_automated !== true).reduce((s, c) => s + (Number(c.amount) || 0), 0);
            
            const totalMonthlyIncomeValue = posIncomeVal + manualIncomeOnly + paidInvoicesVal;

            const docPiutangValue = piutangList.filter(d => ['unpaid', 'waiting', 'Belum Bayar', 'Menunggu'].includes(d.status)).reduce((s, d) => s + (Number(d.amount) || 0), 0);
            const unpaidInvoicesTotalValue = unpaidInvoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
            const totalReceivables = docPiutangValue + unpaidInvoicesTotalValue;

            const paidHutangVal = hutangList.filter(d => ['paid', 'Lunas'].includes(d.status)).reduce((s, d) => s + (Number(d.amount) || 0), 0);
            const manualExpenseOnly = (monthCb || []).filter(c => c.type === 'expense' && c.is_automated !== true).reduce((s, c) => s + (Number(c.amount) || 0), 0);
            const totalMonthlyExpenseValue = manualExpenseOnly + paidHutangVal;

            setTotalIncome(totalMonthlyIncomeValue);
            setTotalExpense(totalMonthlyExpenseValue);
            setTotalProfit(totalMonthlyIncomeValue - totalMonthlyExpenseValue);
            setPosIncome(posIncomeVal);
            setInvoiceIncome(paidInvoicesVal);
            setCbVolume(totalReceivables);

            // 6. Today Activity
            const todayISO = now.toLocaleDateString('en-CA');
            const todayTxs = (monthTxs || []).filter(t => t.created_at.startsWith(todayISO));
            setKasirToday({
                sales: todayTxs.reduce((s, t) => s + t.total, 0),
                count: todayTxs.length
            });

            // Update Recent Notes UI
            const todayStr = new Date().toLocaleDateString('en-CA');
            const combinedNotes = [
                ...(shifts || []).map(s => ({
                    text: s.shift_notes,
                    source: `Shift: ${s.employee_name}`,
                    date: s.ended_at,
                    type: 'shift'
                })),
                ...(monthCb || []).filter(c => (c.date || '') === todayStr).map(c => ({
                    text: c.description,
                    source: c.category || (c.type === 'income' ? t('dash_income') : t('dash_expense')),
                    date: c.date,
                    type: 'cashbook'
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));
            setRecentNotes(combinedNotes);

        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setIsFetching(false);
        }
    };

    // Gunakan waktu lokal agar sinkron dengan pergantian tanggal di Indonesia
    const nowTime = new Date();
    const monthlyIncomeValue = totalIncome;
    const monthlyExpenseValue = totalExpense;
    const netProfitValue = totalProfit;

    // FIX VARIABEL HANTU UNTUK UI 
    const posSalesIncome = posIncome || 0;
    const invoicesIncome = invoiceIncome || 0;

    const unpaidInvoices = freshUnpaidInvoices;
    const unpaidInvoicesTotal = unpaidInvoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
    const totalHutang = (hutang || []).filter(h => h.status === 'unpaid' || h.status === 'Belum Bayar').reduce((s, h) => s + (Number(h.amount) || 0), 0);
    const totalPiutang = (piutang || []).filter(p => p.status === 'unpaid' || p.status === 'Belum Bayar').reduce((s, p) => s + (Number(p.amount) || 0), 0) + unpaidInvoicesTotal;

    const unpaidCountCount = unpaidInvoices.length;
    const unpaidDisplay = `${unpaidCountCount}`;

    // Recent activity: last 10 items from cashbook + invoices merged & sorted
    const allActivity = [
        ...(cashbook || []).filter(e => !['Penjualan Kasir', 'Pengeluaran Kasir'].includes(e.category)).map(e => ({
            id: e.id,
            label: e.category,
            sub: e.description && e.description.length > 30 ? e.description.substring(0, 30) + '...' : e.description || e.notes,
            amount: e.amount,
            type: e.type,
            date: e.date,
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
            date: new Date(tx.created_at).toLocaleDateString('en-CA'),
            kind: 'kasir',
        })),
        ...(kasirExpenses || []).map(ex => ({
            id: ex.id,
            label: ex.category || t('nav_kasir_expenses'),
            sub: ex.description,
            amount: ex.amount,
            type: 'expense',
            date: ex.date,
            kind: 'kasir_expense',
        }))
    ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    // Bar chart data: last 6 months income vs expense
    const months = getLast6Months(lang);

    // Helper for kasir monthly income/expense
    const getKasirMonthInc = (m, y) => {
        return kasirData
            .filter(t => new Date(t.created_at).getMonth() === m && new Date(t.created_at).getFullYear() === y)
            .reduce((s, t) => s + t.total, 0);
    };

    const getKasirMonthExp = (m, y) => {
        return kasirExpenses
            .filter(e => new Date(e.date + 'T00:00:00').getMonth() === m && new Date(e.date + 'T00:00:00').getFullYear() === y)
            .reduce((s, e) => s + e.amount, 0);
    };

    const chartMax = Math.max(
        ...months.map(m => {
            const incInv = cashbook.filter(e => e.type === 'income' && e.category !== 'Penjualan Kasir' && new Date(e.date + 'T00:00:00').getMonth() === m.month && new Date(e.date + 'T00:00:00').getFullYear() === m.year).reduce((s, e) => s + e.amount, 0);
            const incKasir = getKasirMonthInc(m.month, m.year);
            const totalInc = incInv + incKasir;
            const expInv = cashbook.filter(e => e.type === 'expense' && e.category !== 'Penjualan Kasir' && e.category !== 'Pengeluaran Kasir' && new Date(e.date + 'T00:00:00').getMonth() === m.month && new Date(e.date + 'T00:00:00').getFullYear() === m.year).reduce((s, e) => s + e.amount, 0);
            const expKasir = getKasirMonthExp(m.month, m.year);
            const totalExp = expInv + expKasir;
            return Math.max(totalInc, totalExp);
        }), 1
    );

    const chartData = months.map(m => {
        const incInv = cashbook.filter(e => e.type === 'income' && e.category !== 'Penjualan Kasir' && new Date(e.date + 'T00:00:00').getMonth() === m.month && new Date(e.date + 'T00:00:00').getFullYear() === m.year).reduce((s, e) => s + e.amount, 0);
        const incKasir = getKasirMonthInc(m.month, m.year);
        const totalInc = incInv + incKasir;
        const expInv = cashbook.filter(e => e.type === 'expense' && e.category !== 'Penjualan Kasir' && e.category !== 'Pengeluaran Kasir' && new Date(e.date + 'T00:00:00').getMonth() === m.month && new Date(e.date + 'T00:00:00').getFullYear() === m.year).reduce((s, e) => s + e.amount, 0);
        const expKasir = getKasirMonthExp(m.month, m.year);
        const totalExp = expInv + expKasir;

        return {
            ...m,
            incInv,
            incKasir,
            totalInc,
            exp: totalExp,
            incInvPct: (incInv / chartMax) * 100,
            incKasirPct: (incKasir / chartMax) * 100,
            expPct: (totalExp / chartMax) * 100
        };
    });

    if (loading || isFetching) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
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

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#1E293B' }}>
                    {t('nav_home')}
                </h1>
                <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
                    {t('dash_welcome')}
                </p>
            </div>

            {/* Menara Pengawas (Usage Monitor) - Hidden for Ultimate for "Clean" Look */}
            {!isUltimate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { 
                            label: t('nav_invoice'), 
                            count: getInvoiceCount(), 
                            limit: currentLimits?.invoices || 30, 
                            icon: FileText,
                            color: '#6366F1'
                        },
                        { 
                            label: t('nav_kasir'), 
                            count: getKasirTransactionCount(), 
                            limit: currentLimits?.kasir || 200, 
                            icon: ShoppingCart,
                            color: '#8B5CF6'
                        },
                        { 
                            label: t('nav_clients'), 
                            count: getClientCount(), 
                            limit: currentLimits?.clients || 50, 
                            icon: Users,
                            color: '#EC4899'
                        },
                        { 
                            label: t('nav_piutang'), 
                            count: getHutangPiutangCount(), 
                            limit: currentLimits?.hutangPiutang || 50, 
                            icon: HandCoins,
                            color: '#10B981'
                        }
                    ].map((item, idx) => {
                        const percentage = Math.min((item.count / item.limit) * 100, 100);
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
                                            ? (t('limit_alert_msg') || 'Batas kuota hampir tercapai! Upgrade PRO') 
                                            : `${t('remaining_quota_msg')} ${item.limit - item.count}`
                                    }
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title={t('dash_income')} value={monthlyIncomeValue} color="green" subtitle={t('period_month')} />
                <StatCard title={t('dash_expense')} value={monthlyExpenseValue} color="red" subtitle={t('period_month')} />
                <StatCard title={t('dash_net_profit')} value={netProfitValue} color="purple" icon={DollarSign} subtitle={t('period_month')} />
                <StatCard 
                    title={t('report_cat_receivable')} 
                    value={cbVolume} 
                    color="purple" 
                    icon={HandCoins} 
                    subtitle={`${t('lap_summary_for')} ${t('inv_status_unpaid')}`}
                />
            </div>

            {/* Business Evaluation Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div onClick={() => navigate('/kasir/laporan')} className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg group-hover:rotate-12 transition-transform">
                            <FileText size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{t('dash_eval_title')}</span>
                    </div>
                    <div className="space-y-3">
                        {recentNotes.length > 0 ? (
                            recentNotes.slice(0, 2).map((note, i) => (
                                <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <p className="text-[10px] text-violet-600 uppercase font-black tracking-widest">{note.source}</p>
                                    <p className="text-sm font-bold text-slate-700 leading-snug">"{note.text && note.text.length > 40 ? note.text.substring(0, 40) + '...' : note.text || '-'}"</p>
                                    <p className="text-[10px] text-slate-400 mt-1.5 opacity-70 font-semibold">{new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm font-medium text-slate-400 italic py-4 text-center">{t('laporan_no_evaluation')}</p>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500" />
                            {t('revenue_mix') || 'Komposisi Pendapatan'}
                        </h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                            <span>{t('dash_pos_sales_label')}</span>
                            <span>{formatIDR(posSalesIncome)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                            <span>{t('dash_invoices_paid_label')}</span>
                            <span>{formatIDR(invoicesIncome)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500" style={{ width: `${(posSalesIncome / (monthlyIncomeValue || 1)) * 100}%` }} />
                            <div className="h-full bg-violet-500" style={{ width: `${(invoicesIncome / (monthlyIncomeValue || 1)) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 italic">{t('revenue_mix_desc')}</p>
                    </div>
                </div>
            </div>

            {/* Kasir Summary Widget (ULTIMATE ONLY) */}
            {effectivePlan === 'ultimate' && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '16px 20px', background: '#F3E8FF', borderRadius: 16, border: `1px solid #D8B4FE` }}>
                    <div className="min-w-0 flex-1 overflow-hidden" style={{ minWidth: 0 }}>
                        <h3 className="truncate" style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dash_kasir_sales')}</h3>
                        <p
                            title={formatIDR(kasirToday.sales)}
                            style={{
                                margin: 0,
                                fontSize: kasirToday.sales >= 1_000_000_000 ? 18 : 20,
                                fontWeight: 900,
                                color: '#581C87',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%',
                                minWidth: 0
                            }}
                        >
                            {formatCompactCurrency(kasirToday.sales)}
                        </p>
                    </div>
                    <div style={{ width: 1, background: '#D8B4FE' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dash_debt_receivable')}</h3>
                        <p
                            title={formatIDR(totalPiutang)}
                            style={{
                                margin: 0,
                                fontSize: totalPiutang >= 1_000_000_000 ? 18 : 20,
                                fontWeight: 900,
                                color: '#581C87',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%',
                                minWidth: 0
                            }}
                        >
                            {formatCompactCurrency(totalPiutang)}
                        </p>
                    </div>
                </div>
            )}

            {/* Hutang Piutang Summary */}
            {(piutang.length > 0 || hutang.length > 0) && (() => {
                const totalPiutang = piutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);
                const totalHutang = hutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        <div
                            style={{ background: 'white', borderRadius: 14, padding: '12px 16px', border: `1px solid #E2E8F0`, borderTop: '3px solid #10B981', minWidth: 0 }}
                            className="flex-1 overflow-hidden"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }} className="min-w-0 overflow-hidden">
                                <HandCoins size={14} color="#10B981" />
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="truncate">
                                    {t('dash_piutang').toUpperCase()}
                                </p>
                            </div>
                            <p
                                title={formatIDR(totalPiutang)}
                                style={{
                                    margin: 0,
                                    fontSize: totalPiutang >= 1_000_000_000 ? 16 : 18,
                                    fontWeight: 900,
                                    color: '#1E293B',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '100%',
                                    minWidth: 0
                                }}
                            >
                                {formatCompactCurrency(totalPiutang)}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{piutang.filter(e => e.status === 'unpaid').length} {t('dash_active_bills')}</p>
                        </div>
                        <div
                            style={{ background: 'white', borderRadius: 14, padding: '12px 16px', border: `1px solid #E2E8F0`, borderTop: '3px solid #EF4444', minWidth: 0 }}
                            className="flex-1 overflow-hidden"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }} className="min-w-0 overflow-hidden">
                                <HandCoins size={14} color="#EF4444" />
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="truncate">
                                    {t('dash_hutang').toUpperCase()}
                                </p>
                            </div>
                            <p
                                title={formatIDR(totalHutang)}
                                style={{
                                    margin: 0,
                                    fontSize: totalHutang >= 1_000_000_000 ? 16 : 18,
                                    fontWeight: 900,
                                    color: '#1E293B',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '100%',
                                    minWidth: 0
                                }}
                            >
                                {formatCompactCurrency(totalHutang)}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hutang.filter(e => e.status === 'unpaid').length} {t('dash_active_bills')}</p>
                        </div>
                    </div>
                );
            })()}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: t('dash_quick_income'), color: '#10B981', bg: '#ECFDF5', to: '/catatan-bisnis' },
                    { label: t('dash_quick_expense'), color: '#EF4444', bg: '#FEF2F2', to: '/catatan-bisnis' },
                    { label: t('dash_quick_invoice'), color: '#7C3AED', bg: '#EDE9FE', to: '/invoice' },
                    { label: t('dash_quick_report'), color: '#3B82F6', bg: '#EFF6FF', to: '/laporan' },
                ].map(({ label, color, bg, to }) => (
                    <button
                        key={label}
                        onClick={() => navigate(to)}
                        className="btn"
                        style={{
                            background: bg, color, border: `1.5px solid ${color}20`,
                            borderRadius: 14, padding: '16px', fontSize: 14, fontWeight: 700,
                            textAlign: 'center', flexDirection: 'column', gap: 4,
                            justifyContent: 'center', width: '100%',
                        }}
                    >
                        <Plus size={18} color={color} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Main 2-col layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Bar Chart */}
                <div className="card" style={{ animation: 'none' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: '#1E293B' }}>
                        {t('dash_chart')}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
                        {chartData.map((m, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 140 }}>
                                    {/* Income bar (Stacked) */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                                        {/* Kasir Income (top stack) */}
                                        <div
                                            style={{
                                                width: '100%',
                                                height: `${Math.max(m.incKasirPct, 0)}%`,
                                                background: 'linear-gradient(180deg, #F59E0B, #FCD34D)', // Amber for Kasir
                                                borderRadius: m.incInvPct > 0 ? '4px 4px 0 0' : '4px 4px 0 0',
                                                transition: 'height 600ms cubic-bezier(0.4,0,0.2,1)',
                                            }}
                                            title={`${t('dash_legend_kasir')}: ${formatIDR(m.incKasir)}`}
                                        />
                                        {/* Invoice/Other Income (bottom stack) */}
                                        <div
                                            style={{
                                                width: '100%',
                                                height: `${Math.max(m.incInvPct, 2)}%`,
                                                background: 'linear-gradient(180deg, #7C3AED, #A78BFA)', // Violet for Invoice
                                                borderRadius: m.incKasirPct > 0 ? '0 0 0 0' : '4px 4px 0 0',
                                                transition: 'height 600ms cubic-bezier(0.4,0,0.2,1)',
                                                minHeight: m.incKasirPct > 0 ? 0 : 2,
                                            }}
                                            title={`${t('dash_legend_invoice')}: ${formatIDR(m.incInv)}`}
                                        />
                                    </div>
                                    {/* Expense bar */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: `${Math.max(m.expPct, 2)}%`,
                                                background: 'linear-gradient(180deg, #EF4444, #FCA5A5)',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 600ms cubic-bezier(0.4,0,0.2,1)',
                                                minHeight: 2,
                                            }}
                                            title={`${t('dash_legend_expense')}: ${formatIDR(m.exp)}`}
                                        />
                                    </div>
                                </div>
                                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: 0 }}>{t('dash_new_income_desc')}</p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#7C3AED' }} />
                            <span style={{ fontSize: 12, color: '#64748B' }}>{t('dash_legend_invoice')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B' }} />
                            <span style={{ fontSize: 12, color: '#64748B' }}>{t('dash_legend_kasir')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444' }} />
                            <span style={{ fontSize: 12, color: '#64748B' }}>{t('dash_legend_expense')}</span>
                        </div>
                    </div>
                </div>

                {/* Unpaid Invoices */}
                <div className="card" style={{ animation: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#1E293B' }}>
                            {t('dash_unpaid_list')}
                        </h2>
                        <span className="text-slate-400 font-bold" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('view_all')}</span>
                    </div>
                    {unpaidInvoices.length === 0 ? (
                        <EmptyState title={t('dash_no_unpaid')} description={t('dash_no_unpaid_desc')} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {unpaidInvoices.slice(0, 5).map(inv => (
                                <div key={inv.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', borderRadius: 10,
                                    background: '#F8FAFC',
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                                            {inv.number || 'INV-XXX'}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{inv.clientName}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: 0 }} className="flex-1 overflow-hidden">
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                color: '#EF4444',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                width: '100%',
                                                minWidth: 0
                                            }}
                                            title={formatIDR(inv.grandTotal)}
                                        >
                                            {formatCompactCurrency(inv.grandTotal)}
                                        </p>
                                        <span className="badge badge-danger" style={{ fontSize: 10 }}>{t('dash_unpaid_badge')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card" style={{ marginTop: 20, animation: 'none' }}>
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
            <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText size={20} className="text-violet-600" />
                        {t('dash_ops_log')}
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {shifts && shifts.length > 0 ? shifts.map((shift, idx) => (
                            <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-500 transition-colors shadow-sm">
                                <div className="flex-none">
                                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-black text-lg shadow-inner">
                                        {shift.employee_name?.charAt(0)?.toUpperCase() || 'K'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{shift.employee_name || t('kasir_staff_fallback')}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(shift.ended_at).toLocaleDateString(t('locale_code') || (lang === 'ID' ? 'id-ID' : 'en-US'))} • Shift {shift.shift_number || '1'}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                            {t('dash_cash_label')} {new Intl.NumberFormat(lang === 'ID' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(shift.actual_cash || 0).replace('IDR', 'Rp')}
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 relative">
                                        <span className="absolute -top-2 left-3 bg-slate-50 dark:bg-slate-900/50 px-1 text-[10px] font-bold text-slate-400">{t('dash_notes_label')}</span>
                                        <p className="leading-relaxed italic">"{shift.shift_notes || t('dash_no_ops_notes')}"</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                    <FileText size={24} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">{t('dash_no_ops_yet')}</p>
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
