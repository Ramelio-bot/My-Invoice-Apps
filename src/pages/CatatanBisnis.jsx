import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Trash2, PlusCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import { formatDateID, todayStr, isToday, isThisWeek, isThisMonth } from '../utils/date';
import EmptyState from '../components/EmptyState';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const INCOME_CATEGORIES = [
    'Penjualan Produk', 'Pembayaran Jasa', 'Uang Muka/DP', 'Invoice Lunas', 'Lain-lain'
];
const EXPENSE_CATEGORIES = [
    'Bahan Baku', 'Gaji', 'Sewa Tempat', 'Listrik & Air', 'Transport',
    'Marketing', 'Peralatan', 'Pajak', 'Pengiriman', 'Lain-lain'
];

export default function CatatanBisnis() {
    const { dark } = useTheme();
    const { t } = useLang();
    const { showToast } = useToast();
    const { isPro, checkTransactionLimit, incrementTransaction, getDailyTransactionCount } = usePlan();
    const navigate = useNavigate();

    const [entries, setEntries] = useLocalStorage('cashbook_data', []);
    const [tab, setTab] = useState('income');
    const [filter, setFilter] = useState('all');
    const [form, setForm] = useState({ amount: '', category: '', note: '', date: todayStr() });

    const dailyCount = getDailyTransactionCount();
    const canAdd = checkTransactionLimit();

    // Summary
    const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // Filtered entries
    const filtered = useMemo(() => {
        return entries
            .filter(e => {
                if (filter === 'today') return isToday(e.date);
                if (filter === 'week') return isThisWeek(e.date);
                if (filter === 'month') return isThisMonth(e.date);
                return true;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [entries, filter]);

    // Group by date
    const grouped = useMemo(() => {
        const groups = {};
        filtered.forEach(e => {
            if (!groups[e.date]) groups[e.date] = [];
            groups[e.date].push(e);
        });
        return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
    }, [filtered]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canAdd) {
            showToast('Batas 10 transaksi hari ini tercapai. Upgrade PRO untuk unlimited.', 'warning');
            navigate('/upgrade');
            return;
        }
        const amount = parseFloat(form.amount.replace(/[^\d]/g, ''));
        if (!amount || !form.category) {
            showToast('Nominal dan kategori wajib diisi', 'error');
            return;
        }
        const entry = {
            id: Date.now().toString(),
            type: tab,
            amount,
            category: form.category,
            note: form.note,
            date: form.date,
            createdAt: new Date().toISOString(),
        };
        setEntries(prev => [entry, ...prev]);
        incrementTransaction();
        setForm({ amount: '', category: '', note: '', date: todayStr() });
        showToast(t('saved'), 'success');
    };

    const handleDelete = (id) => {
        setEntries(prev => prev.filter(e => e.id !== id));
        showToast('Transaksi dihapus', 'info');
    };

    const formatAmountDisplay = (val) => {
        const num = val.replace(/[^\d]/g, '');
        if (!num) return '';
        return new Intl.NumberFormat('id-ID').format(parseInt(num));
    };

    const isIncome = tab === 'income';
    const accentColor = isIncome ? '#10B981' : '#EF4444';

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px', color: dark ? '#F1F5F9' : '#1E293B' }}>
                {t('nav_cashbook')}
            </h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: t('cb_income'), value: totalIncome, color: '#10B981', bg: '#ECFDF5' },
                    { label: t('cb_expense'), value: totalExpense, color: '#EF4444', bg: '#FEF2F2' },
                    { label: t('cb_balance'), value: netBalance, color: '#7C3AED', bg: '#EDE9FE' },
                ].map(item => (
                    <div key={item.label} className="card" style={{ animation: 'none', borderTop: `3px solid ${item.color}` }}>
                        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#64748B' }}>{item.label}</p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: item.color }}>
                            {formatIDR(item.value)}
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20, alignItems: 'start' }}>
                {/* Add Transaction Form */}
                <div className="card" style={{ animation: 'none', position: 'sticky', top: 80 }}>
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

                    {/* Free limit banner */}
                    {!isPro && (
                        <div className="upgrade-banner" style={{ marginBottom: 16 }}>
                            <span style={{ color: '#5B21B6', fontSize: 12, fontWeight: 600 }}>
                                {dailyCount}/10 {t('cb_limit')}
                            </span>
                            <button onClick={() => navigate('/upgrade')} className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}>
                                PRO
                            </button>
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
                                <option value="">-- Pilih Kategori --</option>
                                {(isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
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
                                placeholder="Keterangan (opsional)"
                            />
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
                            style={{
                                width: '100%', background: accentColor, color: 'white',
                                padding: '12px', fontSize: 15, justifyContent: 'center',
                            }}
                        >
                            <PlusCircle size={18} />
                            {t('save')} {isIncome ? t('cb_income') : t('cb_expense')}
                        </button>
                    </form>
                </div>

                {/* Transaction List */}
                <div>
                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {[
                            { key: 'all', label: t('cb_filter_all') },
                            { key: 'today', label: t('cb_filter_today') },
                            { key: 'week', label: t('cb_filter_week') },
                            { key: 'month', label: t('cb_filter_month') },
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

                    {grouped.length === 0 ? (
                        <EmptyState title="Belum ada transaksi" description="Tambahkan transaksi pertama Anda" />
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
                                                position: 'relative',
                                            }}
                                            onMouseEnter={e => {
                                                const btn = e.currentTarget.querySelector('.delete-btn');
                                                if (btn) btn.style.opacity = '1';
                                            }}
                                            onMouseLeave={e => {
                                                const btn = e.currentTarget.querySelector('.delete-btn');
                                                if (btn) btn.style.opacity = '0';
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
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: dark ? '#E2E8F0' : '#1E293B' }}>
                                                    {entry.category}
                                                </p>
                                                {entry.note && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{entry.note}</p>}
                                            </div>
                                            <span style={{
                                                fontSize: 15, fontWeight: 800,
                                                color: entry.type === 'income' ? '#10B981' : '#EF4444',
                                            }}>
                                                {entry.type === 'income' ? '+' : '-'}{formatIDR(entry.amount)}
                                            </span>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(entry.id)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#EF4444', opacity: 0, transition: 'opacity 200ms',
                                                    padding: 4, borderRadius: 6,
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
        </div>
    );
}
