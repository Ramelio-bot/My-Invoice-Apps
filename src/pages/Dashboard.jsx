import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, FileText, Plus, BarChart2, ArrowRight, HandCoins } from 'lucide-react';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { formatDateID, getLast6Months, isThisMonth } from '../utils/date';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export default function Dashboard() {
    const navigate = useNavigate();
    const { t } = useLang();
    const { dark } = useTheme();
    const { user, loading, effectivePlan } = useAuth();

    const [cashbook, setCashbook] = useState([]); // Removed useLocalStorage
    const [invoices, setInvoices] = useState([]); // Removed useLocalStorage
    const [piutang, setPiutang] = useState([]); // Removed useLocalStorage
    const [hutang, setHutang] = useState([]); // Removed useLocalStorage

    // Supabase state
    const [kasirData, setKasirData] = useState([]);
    const [kasirExpenses, setKasirExpenses] = useState([]);
    const [kasirToday, setKasirToday] = useState({ sales: 0, count: 0 });

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true });
        } else if (user) {
            loadDashboardData();
        }

        const handleSync = () => {
            if (user) loadDashboardData();
        };

        window.addEventListener('invoice-updated', handleSync);
        window.addEventListener('cashbook-updated', handleSync);
        window.addEventListener('kasir-updated', handleSync);

        return () => {
            window.removeEventListener('invoice-updated', handleSync);
            window.removeEventListener('cashbook-updated', handleSync);
            window.removeEventListener('kasir-updated', handleSync);
        };
    }, [user?.id, loading, navigate]);

    const loadDashboardData = async () => {
        try {
            // 1. Fetch Cashbook
            const { data: cbData } = await supabase.from('cashbook').select('*').eq('user_id', user.id);
            setCashbook(cbData || []);

            // 2. Fetch Documents (Invoice, Piutang, Hutang)
            const { data: docData } = await supabase.from('documents').select('*').eq('user_id', user.id);
            if (docData) {
                const invs = docData.filter(d => d.type === 'invoice').map(d => ({
                    id: d.id,
                    number: d.doc_number || (d.data || {}).number,
                    clientName: d.client_name,
                    grandTotal: d.total_amount || (d.data || {}).grandTotal,
                    status: d.status,
                    date: d.created_at?.split('T')[0] || (d.data || {}).date,
                    ...(d.data || {})
                }));
                const pius = docData.filter(d => d.type === 'piutang').map(d => ({
                    id: d.id,
                    name: d.client_name,
                    amount: d.total_amount || (d.data || {}).amount,
                    status: d.status,
                    date: d.created_at?.split('T')[0] || (d.data || {}).date,
                    ...(d.data || {})
                }));
                const huts = docData.filter(d => d.type === 'hutang').map(d => ({
                    id: d.id,
                    name: d.client_name,
                    amount: d.total_amount || (d.data || {}).amount,
                    status: d.status,
                    date: d.created_at?.split('T')[0] || (d.data || {}).date,
                    ...(d.data || {})
                }));
                setInvoices(invs);
                setPiutang(pius);
                setHutang(huts);
            }

            // 3. Fetch Kasir
            const { data: allTxs } = await supabase.from('kasir_transactions').select('*').eq('user_id', user.id);
            setKasirData(allTxs || []);

            const { data: allExps } = await supabase.from('kasir_expenses').select('*').eq('user_id', user.id);
            setKasirExpenses(allExps || []);

            // Today's Kasir
            const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
            const todayTxs = (allTxs || []).filter(t => t.created_at >= startOfDay);
            setKasirToday({
                sales: todayTxs.reduce((sum, t) => sum + t.total, 0),
                count: todayTxs.length
            });
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    };

    // Calculate monthly stats
    const kasirIncomeThisMonth = kasirData
        .filter(t => isThisMonth(t.created_at.split('T')[0]))
        .reduce((sum, t) => sum + t.total, 0);

    const kasirExpenseThisMonth = kasirExpenses
        .filter(e => isThisMonth(e.date))
        .reduce((sum, e) => sum + e.amount, 0);

    const monthlyIncome = (cashbook || [])
        .filter(e => e.type === 'income' && isThisMonth(e.date) && e.category !== 'Penjualan Kasir')
        .reduce((s, e) => s + (Number(e.amount) || 0), 0) + kasirIncomeThisMonth;

    const monthlyExpense = (cashbook || [])
        .filter(e => e.type === 'expense' && isThisMonth(e.date) && e.category !== 'Penjualan Kasir' && e.category !== 'Pengeluaran Kasir')
        .reduce((s, e) => s + (Number(e.amount) || 0), 0) + kasirExpenseThisMonth;

    const netProfit = monthlyIncome - monthlyExpense;

    const unpaidInvoices = (invoices || []).filter(inv => inv.status === 'unpaid' || inv.status === 'Belum Bayar' || inv.status === 'belum_bayar');
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
            label: `Kasir: ${tx.receipt_number}`,
            sub: t('dash_pos_sale'),
            amount: tx.total,
            type: 'income',
            date: tx.created_at.split('T')[0],
            kind: 'kasir',
        })),
        ...(kasirExpenses || []).map(ex => ({
            id: ex.id,
            label: ex.category || 'Pengeluaran Kasir',
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
    const months = getLast6Months();

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

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: dark ? '#F1F5F9' : '#1E293B' }}>
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
                <StatCard title={t('dash_unpaid')} value={unpaidDisplay} color="amber" prefix="" />
            </div>

            {/* Kasir Summary Widget (ULTIMATE ONLY) */}
            {effectivePlan === 'ultimate' && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '16px 20px', background: dark ? '#2E1065' : '#F3E8FF', borderRadius: 16, border: `1px solid ${dark ? '#4C1D95' : '#D8B4FE'}` }}>
                    <div className="min-w-0 flex-1 overflow-hidden" style={{ minWidth: 0 }}>
                        <h3 className="truncate" style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: dark ? '#C4B5FD' : '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dash_kasir_sales')}</h3>
                        <p 
                            title={formatIDR(kasirToday.sales)}
                            style={{ 
                                margin: 0, 
                                fontSize: kasirToday.sales >= 1_000_000_000 ? 18 : 20, 
                                fontWeight: 900, 
                                color: dark ? '#F5F3FF' : '#581C87',
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
                    <div style={{ width: 1, background: dark ? '#4C1D95' : '#D8B4FE' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: dark ? '#C4B5FD' : '#7E22CE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dash_kasir_tx')}</h3>
                        <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: dark ? '#F5F3FF' : '#581C87' }}>{kasirToday.count} <span style={{ fontSize: 14, fontWeight: 600 }}>Trx</span></p>
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
                            style={{ background: dark ? '#1E293B' : 'white', borderRadius: 14, padding: '12px 16px', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, borderTop: '3px solid #10B981', cursor: 'pointer', transition: 'all 150ms', minWidth: 0 }}
                            className="flex-1 overflow-hidden"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }} className="min-w-0 overflow-hidden">
                                <HandCoins size={14} color="#10B981" />
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="truncate">PIUTANG</p>
                            </div>
                            <p 
                                title={formatIDR(totalPiutang)}
                                style={{ 
                                    margin: 0, 
                                    fontSize: totalPiutang >= 1_000_000_000 ? 16 : 18, 
                                    fontWeight: 900, 
                                    color: dark ? '#F1F5F9' : '#1E293B',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '100%',
                                    minWidth: 0
                                }}
                            >
                                {formatCompactCurrency(totalPiutang)}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: dark ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{piutang.filter(e => e.status === 'unpaid').length} {t('dash_active_bills')}</p>
                        </div>
                        <div
                            onClick={() => navigate('/hutang-piutang')}
                            style={{ background: dark ? '#1E293B' : 'white', borderRadius: 14, padding: '12px 16px', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, borderTop: '3px solid #EF4444', cursor: 'pointer', transition: 'all 150ms', minWidth: 0 }}
                            className="flex-1 overflow-hidden"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }} className="min-w-0 overflow-hidden">
                                <HandCoins size={14} color="#EF4444" />
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="truncate">HUTANG</p>
                            </div>
                            <p 
                                title={formatIDR(totalHutang)}
                                style={{ 
                                    margin: 0, 
                                    fontSize: totalHutang >= 1_000_000_000 ? 16 : 18, 
                                    fontWeight: 900, 
                                    color: dark ? '#F1F5F9' : '#1E293B',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '100%',
                                    minWidth: 0
                                }}
                            >
                                {formatCompactCurrency(totalHutang)}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: dark ? '#94A3B8' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hutang.filter(e => e.status === 'unpaid').length} {t('dash_active_bills')}</p>
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
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: dark ? '#F1F5F9' : '#1E293B' }}>
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
                                            title={`Penjualan Kasir: ${formatIDR(m.incKasir)}`}
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
                                            title={`Pemasukan Invoice/Lainnya: ${formatIDR(m.incInv)}`}
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
                                            title={`Pengeluaran: ${formatIDR(m.exp)}`}
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
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>
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
                                    background: dark ? '#0F172A' : '#F8FAFC',
                                }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: dark ? '#E2E8F0' : '#1E293B' }}>
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
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: dark ? '#F1F5F9' : '#1E293B' }}>
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
                                onMouseEnter={e => e.currentTarget.style.background = dark ? '#0F172A' : '#F8FAFC'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                    background: item.type === 'income' ? '#10B981'
                                        : item.type === 'expense' ? '#EF4444' : '#7C3AED',
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dark ? '#E2E8F0' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                                    <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{formatDateID(item.date)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
