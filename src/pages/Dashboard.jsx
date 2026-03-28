import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, FileText, Plus, BarChart2, ArrowRight, HandCoins } from 'lucide-react';
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
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true });
        } else if (user) {
            fetchDashboardData();
        }

        const handleSync = () => {
            if (user) fetchDashboardData();
        };

        window.addEventListener('data-updated', handleSync); 

        return () => {
            window.removeEventListener('data-updated', handleSync);
        };
    }, [user?.id, loading, navigate, activeOutlet?.id]);

    // Helper: convert UTC ISO timestamp to local YYYY-MM-DD string
    const toLocalDate = (isoStr) => new Date(isoStr).toLocaleDateString('en-CA');

    const fetchDashboardData = async () => {
        if (!user) return;
        setIsFetching(true);
        const outletId = activeOutlet?.id || null;

        try {
            // 1. Fetch Cashbook
            try {
                let cbQuery = supabase.from('cashbook').select('*').eq('user_id', user.id);
                if (outletId) cbQuery = cbQuery.eq('outlet_id', outletId);
                const { data: cbData, error: cbError } = await cbQuery;
                if (!cbError) setCashbook(cbData || []);
            } catch (e) { console.error('Dashboard: Cashbook fetch failed', e); }

            // 2. Fetch Unpaid Invoices
            let unpaid = [];
            try {
                let upQuery = supabase
                    .from('documents')
                    .select('id, status, total_amount, doc_number, client_name, created_at')
                    .eq('user_id', user.id)
                    .eq('type', 'invoice')
                    .eq('status', 'unpaid')
                    .order('created_at', { ascending: false });
                if (outletId) upQuery = upQuery.eq('outlet_id', outletId);
                const { data: freshUnpaid, error: upError } = await upQuery;
                if (!upError) {
                    unpaid = (freshUnpaid || []).map(d => ({
                        id: d.id,
                        number: d.doc_number || (d.data || {}).number,
                        clientName: d.client_name,
                        grandTotal: d.total_amount || (d.data || {}).grandTotal,
                        status: d.status,
                        date: d.created_at ? toLocalDate(d.created_at) : ((d.data || {}).date || ''),
                        ...(d.data || {})
                    }));
                    setFreshUnpaidInvoices(unpaid);
                }
            } catch (e) { console.error('Dashboard: Unpaid fetch failed', e); }

            // 2a. Fetch All Documents
            try {
                let docQuery = supabase.from('documents').select('*').eq('user_id', user.id);
                if (outletId) docQuery = docQuery.eq('outlet_id', outletId);
                const { data: docData, error: docError } = await docQuery;
                
                if (!docError && docData) {
                    const combinedDocs = docData.filter(d => ['invoice', 'kwitansi'].includes(d.type)).map(d => ({
                        id: d.id,
                        type: d.type,
                        number: d.doc_number || (d.data || {}).number,
                        clientName: d.client_name,
                        grandTotal: d.total_amount || (d.data || {}).grandTotal,
                        status: d.status,
                        date: d.created_at ? toLocalDate(d.created_at) : ((d.data || {}).date || ''),
                        ...(d.data || {})
                    }));
                    setInvoices(combinedDocs);

                    setPiutang(docData.filter(d => d.type === 'piutang').map(d => ({
                        id: d.id,
                        name: d.client_name,
                        amount: d.total_amount || (d.data || {}).amount,
                        status: d.status,
                        date: d.created_at ? toLocalDate(d.created_at) : ((d.data || {}).date || ''),
                        ...(d.data || {})
                    })));
                    
                    setHutang(docData.filter(d => d.type === 'hutang').map(d => ({
                        id: d.id,
                        name: d.client_name,
                        amount: d.total_amount || (d.data || {}).amount,
                        status: d.status,
                        date: d.created_at ? toLocalDate(d.created_at) : ((d.data || {}).date || ''),
                        ...(d.data || {})
                    })));
                }
            } catch (e) { console.error('Dashboard: Docs fetch failed', e); }

            //         try {
            // A. Kueri Kasir Shift (Gunakan kolom shift_notes yang baru dibuat)
            const { data: shifts } = await supabase
                .from('kasir_shifts')
                .select('id, employee_name, ended_at, shift_notes')
                .eq('user_id', user.id)
                .order('ended_at', { ascending: false })
                .limit(5);

            // B. Logika Satu Sumber Kebenaran (Total Income)
            // Rumus: Total Pemasukan bulan ini hanya dari Cashbook yang tipenya 'income' 
            // dan BUKAN auto-generated agar tidak double counting.
            const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const { data: cbData } = await supabase.from('cashbook').select('*').eq('user_id', user.id);

            const monthlyIncome = (cbData || [])
                .filter(item => item.type === 'income' && (item.date || '').startsWith(thisMonth))
                .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

            const monthlyExpense = (cbData || [])
                .filter(item => item.type === 'expense' && (item.date || '').startsWith(thisMonth))
                .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

            setTotalIncome(monthlyIncome);
            setTotalExpense(monthlyExpense);
            setTotalProfit(monthlyIncome - monthlyExpense);
            setCashbook(cbData || []);
            
            // C. Fetch Other Data (Unpaid Invoices, Today's Kasir, etc.) for UI helper components
            try {
                let upQuery = supabase
                    .from('documents')
                    .select('id, status, total_amount, doc_number, client_name, created_at')
                    .eq('user_id', user.id)
                    .eq('type', 'invoice')
                    .eq('status', 'unpaid')
                    .order('created_at', { ascending: false });
                if (outletId) upQuery = upQuery.eq('outlet_id', outletId);
                const { data: freshUnpaid } = await upQuery;
                setFreshUnpaidInvoices(freshUnpaid || []);
            } catch (e) {}

            try {
                let txQuery = supabase.from('kasir_transactions').select('*').eq('user_id', user.id);
                if (outletId) txQuery = txQuery.eq('outlet_id', outletId);
                const { data: allTxs } = await txQuery;
                if (allTxs) {
                    setKasirData(allTxs);
                    const todayStr = new Date().toLocaleDateString('en-CA');
                    const todayTxs = allTxs.filter(t => toLocalDate(t.created_at) === todayStr);
                    setKasirToday({
                        sales: todayTxs.reduce((sum, t) => sum + t.total, 0),
                        count: todayTxs.length
                    });
                }
            } catch (e) {}

            try {
                let expQuery = supabase.from('kasir_expenses').select('*').eq('user_id', user.id);
                if (outletId) expQuery = expQuery.eq('outlet_id', outletId);
                const { data: allExps, error: expError } = await expQuery;
                if (!expError) setKasirExpenses(allExps || []);
            } catch (e) { console.error('Dashboard: Kasir Exp fetch failed', e); }

            // Update Recent Notes UI
            const todayStr = new Date().toLocaleDateString('en-CA');
            const combinedNotes = [
                ...(shifts || []).map(s => ({
                    text: s.shift_notes,
                    source: `Shift: ${s.employee_name}`,
                    date: s.ended_at,
                    type: 'shift'
                })),
                ...(cbData || []).filter(c => (c.date || '') === todayStr).map(c => ({
                    text: c.description,
                    source: c.type === 'income' ? t('dash_income') : t('dash_expense'),
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

    const thisMonth = new Date().toISOString().slice(0, 7);
    // HITUNG MURNI DARI CASHBOOK (SINGLE SOURCE)
    const monthlyIncome = cashbook
        .filter(item => item.type === 'income' && item.date.startsWith(thisMonth))
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const monthlyExpense = cashbook
        .filter(item => item.type === 'expense' && item.date.startsWith(thisMonth))
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const netProfit = monthlyIncome - monthlyExpense;

    // FIX VARIABEL HANTU UNTUK UI (Mencegah ReferenceError)
    const kasirIncomeThisMonth = cashbook.filter(c => c.category === 'Penjualan Kasir' && (c.date || '').startsWith(thisMonth)).reduce((s,c) => s + (Number(c.amount) || 0), 0);
    const paidInvoicesTotal = cashbook.filter(c => c.category === 'Invoice Lunas' && (c.date || '').startsWith(thisMonth)).reduce((s,c) => s + (Number(c.amount) || 0), 0);

    const unpaidInvoices = freshUnpaidInvoices;
    const unpaidInvoicesTotal = unpaidInvoices.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
    const totalHutang = (hutang || []).filter(h => h.status !== 'lunas').reduce((s, h) => s + (Number(h.amount) || 0), 0);
    const totalPiutang = (piutang || []).filter(p => p.status !== 'lunas').reduce((s, p) => s + (Number(p.amount) || 0), 0) + unpaidInvoicesTotal;
    
    const unpaidCountCount = unpaidInvoices.length;
    const unpaidDisplay = `${unpaidCountCount}`;

    // Recent activity: last 10 items from cashbook + invoices merged & sorted
    const allActivity = [
        ...(cashbook || []).filter(e => !['Penjualan Kasir', 'Pengeluaran Kasir'].includes(e.category)).map(e => ({
            id: e.id,
            label: e.category,
            sub: e.description || e.notes,
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
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#1E293B' }}>
                    {t('nav_home')}
                </h1>
                <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
                    {t('dash_welcome')}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title={t('dash_income')} value={monthlyIncome} color="green" />
                <StatCard title={t('dash_expense')} value={monthlyExpense} color="red" />
                <StatCard title={t('dash_profit')} value={netProfit} color="purple" />
                <div onClick={() => navigate('/laporan')} className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                            <HandCoins size={18} />
                        </div>
                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">{t('nav_piutang') || 'Hutang Piutang'}</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">{t('piutang') || 'Piutang (Uang Masuk)'}</p>
                            <p className="text-sm font-black text-emerald-600">{formatIDR(totalPiutang)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">{t('hutang') || 'Hutang (Uang Keluar)'}</p>
                            <p className="text-sm font-black text-red-600">{formatIDR(totalHutang)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Evaluation Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div onClick={() => navigate('/kasir/laporan')} className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-violet-100 text-violet-600 rounded-lg group-hover:rotate-12 transition-transform">
                            <FileText size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{t('cb_note') || 'Evaluasi Bisnis Hari Ini'}</span>
                    </div>
                    <div className="space-y-3">
                        {recentNotes.length > 0 ? (
                            recentNotes.slice(0, 2).map((note, i) => (
                                <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <p className="text-sm font-bold text-slate-700 leading-snug">"{note.text}"</p>
                                    <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-black tracking-tighter opacity-70">{note.source} · {new Date(note.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
                            <span>POS Sales</span>
                            <span>{formatIDR(kasirIncomeThisMonth)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                            <span>Invoices (Lunas)</span>
                            <span>{formatIDR(paidInvoicesTotal)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500" style={{ width: `${(kasirIncomeThisMonth / (monthlyIncome || 1)) * 100}%` }} />
                            <div className="h-full bg-violet-500" style={{ width: `${(paidInvoicesTotal / (monthlyIncome || 1)) * 100}%` }} />
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
                        <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dash_kasir_tx')}</h3>
                        <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#581C87' }}>{kasirToday.count} <span style={{ fontSize: 14, fontWeight: 600 }}>{t('transactions_short')}</span></p>
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
                            onClick={() => navigate('/hutang-piutang')}
                            style={{ background: 'white', borderRadius: 14, padding: '12px 16px', border: `1px solid #E2E8F0`, borderTop: '3px solid #10B981', cursor: 'pointer', transition: 'all 150ms', minWidth: 0 }}
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
                            onClick={() => navigate('/hutang-piutang')}
                            style={{ background: 'white', borderRadius: 14, padding: '12px 16px', border: `1px solid #E2E8F0`, borderTop: '3px solid #EF4444', cursor: 'pointer', transition: 'all 150ms', minWidth: 0 }}
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
                        <button onClick={() => navigate('/invoice')} className="btn btn-sm btn-outline">
                            {t('view_all')} <ArrowRight size={14} />
                        </button>
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
