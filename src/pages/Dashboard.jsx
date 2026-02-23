import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, FileText, Plus, BarChart2, ArrowRight, HandCoins } from 'lucide-react';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatIDR } from '../utils/currency';
import { formatDateID, getLast6Months, isThisMonth } from '../utils/date';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const { t } = useLang();
    const { dark } = useTheme();
    const [cashbook] = useLocalStorage('cashbook_data', []);
    const [invoices] = useLocalStorage('invoice_data', []);
    const [piutang] = useLocalStorage('piutang_data', []);
    const [hutang] = useLocalStorage('hutang_data', []);

    // Calculate monthly stats from cashbook
    const monthlyIncome = cashbook
        .filter(e => e.type === 'income' && isThisMonth(e.date))
        .reduce((s, e) => s + (e.amount || 0), 0);

    const monthlyExpense = cashbook
        .filter(e => e.type === 'expense' && isThisMonth(e.date))
        .reduce((s, e) => s + (e.amount || 0), 0);

    const netProfit = monthlyIncome - monthlyExpense;

    const unpaidInvoices = (invoices || []).filter(inv => inv.status === 'unpaid' || inv.status === 'Belum Bayar');
    const unpaidCount = unpaidInvoices.length;

    // Recent activity: last 10 items from cashbook + invoices merged & sorted
    const allActivity = [
        ...(cashbook || []).map(e => ({
            id: e.id,
            label: e.category,
            sub: e.note,
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
    ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    // Bar chart data: last 6 months income vs expense
    const months = getLast6Months();
    const chartMax = Math.max(
        ...months.map(m => {
            const inc = cashbook.filter(e => e.type === 'income' && new Date(e.date + 'T00:00:00').getMonth() === m.month && new Date(e.date + 'T00:00:00').getFullYear() === m.year).reduce((s, e) => s + e.amount, 0);
            const exp = cashbook.filter(e => e.type === 'expense' && new Date(e.date + 'T00:00:00').getMonth() === m.month && new Date(e.date + 'T00:00:00').getFullYear() === m.year).reduce((s, e) => s + e.amount, 0);
            return Math.max(inc, exp);
        }), 1
    );

    const chartData = months.map(m => {
        const inc = cashbook.filter(e => e.type === 'income' && new Date(e.date + 'T00:00:00').getMonth() === m.month && new Date(e.date + 'T00:00:00').getFullYear() === m.year).reduce((s, e) => s + e.amount, 0);
        const exp = cashbook.filter(e => e.type === 'expense' && new Date(e.date + 'T00:00:00').getMonth() === m.month && new Date(e.date + 'T00:00:00').getFullYear() === m.year).reduce((s, e) => s + e.amount, 0);
        return { ...m, inc, exp, incPct: (inc / chartMax) * 100, expPct: (exp / chartMax) * 100 };
    });

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: dark ? '#F1F5F9' : '#1E293B' }}>
                    {t('nav_home')}
                </h1>
                <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
                    Selamat datang kembali! Ini adalah ringkasan bisnis Anda.
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
                <StatCard title={t('dash_income')} value={monthlyIncome} icon={TrendingUp} color="green" />
                <StatCard title={t('dash_expense')} value={monthlyExpense} icon={TrendingDown} color="red" />
                <StatCard title={t('dash_profit')} value={netProfit} icon={DollarSign} color="purple" />
                <StatCard title={t('dash_unpaid')} value={unpaidCount} icon={FileText} color="amber" prefix="" />
            </div>

            {/* Hutang Piutang Summary */}
            {(piutang.length > 0 || hutang.length > 0) && (() => {
                const totalPiutang = piutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);
                const totalHutang = hutang.filter(e => e.status === 'unpaid').reduce((s, e) => s + (Number(e.amount) || 0), 0);
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        <div
                            onClick={() => navigate('/hutang-piutang')}
                            style={{ background: dark ? '#1E293B' : 'white', borderRadius: 14, padding: '12px 16px', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, borderTop: '3px solid #10B981', cursor: 'pointer', transition: 'all 150ms' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <HandCoins size={14} color="#10B981" />
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#10B981' }}>PIUTANG</p>
                            </div>
                            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B' }}>{formatIDR(totalPiutang)}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: dark ? '#94A3B8' : '#64748B' }}>{piutang.filter(e => e.status === 'unpaid').length} tagihan aktif</p>
                        </div>
                        <div
                            onClick={() => navigate('/hutang-piutang')}
                            style={{ background: dark ? '#1E293B' : 'white', borderRadius: 14, padding: '12px 16px', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, borderTop: '3px solid #EF4444', cursor: 'pointer', transition: 'all 150ms' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <HandCoins size={14} color="#EF4444" />
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#EF4444' }}>HUTANG</p>
                            </div>
                            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B' }}>{formatIDR(totalHutang)}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: dark ? '#94A3B8' : '#64748B' }}>{hutang.filter(e => e.status === 'unpaid').length} tagihan aktif</p>
                        </div>
                    </div>
                );
            })()}

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Bar Chart */}
                <div className="card" style={{ animation: 'none' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: dark ? '#F1F5F9' : '#1E293B' }}>
                        {t('dash_chart')}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
                        {chartData.map((m, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 140 }}>
                                    {/* Income bar */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: `${Math.max(m.incPct, 2)}%`,
                                                background: 'linear-gradient(180deg, #7C3AED, #A78BFA)',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 600ms cubic-bezier(0.4,0,0.2,1)',
                                                minHeight: 2,
                                            }}
                                            title={`Pemasukan: ${formatIDR(m.inc)}`}
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
                    <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#7C3AED' }} />
                            <span style={{ fontSize: 12, color: '#64748B' }}>Pemasukan</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444' }} />
                            <span style={{ fontSize: 12, color: '#64748B' }}>Pengeluaran</span>
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
                            Lihat Semua <ArrowRight size={14} />
                        </button>
                    </div>
                    {unpaidInvoices.length === 0 ? (
                        <EmptyState title="Tidak ada invoice tertunggak" description="Semua invoice sudah dibayar" />
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
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#EF4444' }}>
                                            {formatIDR(inv.grandTotal)}
                                        </p>
                                        <span className="badge badge-danger" style={{ fontSize: 10 }}>Belum Bayar</span>
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
                    <EmptyState title="Belum ada aktivitas" description="Aktivitas bisnis Anda akan muncul di sini" />
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
                                    }}>
                                        {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}{formatIDR(item.amount || 0)}
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
