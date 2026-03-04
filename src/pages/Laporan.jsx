import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Hash, ExternalLink, Download, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { usePlan } from '../context/PlanContext';
import { formatIDR } from '../utils/currency';
import { isThisMonth } from '../utils/date';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import UpgradeModal from '../components/UpgradeModal';

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

export default function Laporan() {
    const { dark } = useTheme();
    const navigate = useNavigate();
    const { isPro } = usePlan();
    const { showToast } = useToast();
    const { lang } = useLang();
    const [cashbook, setCashbook] = useLocalStorage('cashbook_data', []);
    const [invoices, setInvoices] = useLocalStorage('invoice_data', []);
    const { user, canAccessReport } = useAuth();

    const [realData, setRealData] = useState({ invoices: [], kasir: [], cashbook: [] });
    const [isLoading, setIsLoading] = useState(true);

    const now = new Date();
    const [selMonth, setSelMonth] = useState(now.getMonth());
    const [selYear, setSelYear] = useState(now.getFullYear());

    // Slide panel state
    const [panel, setPanel] = useState({ open: false, title: '', items: [], type: 'cashbook' });
    const closePanel = () => setPanel(p => ({ ...p, open: false }));

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        if (!canAccessReport()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Fetch Kasir
            const { data: kasirTx } = await supabase
                .from('kasir_transactions')
                .select('id, user_id, receipt_number, subtotal, discount_amount, total, payment_method, created_at')
                .eq('user_id', user.id);

            // Fetch Invoices (documents)
            const { data: docs } = await supabase
                .from('documents')
                .select('id, user_id, type, number, client_name, total, grand_total, status, date, created_at, data')
                .eq('user_id', user.id)
                .eq('type', 'invoice');

            // Fetch Cashbook
            const { data: cb } = await supabase
                .from('cashbook')
                .select('id, user_id, type, category, description, amount, date, reference_type, created_at')
                .eq('user_id', user.id);

            const fetchedInvoices = docs || [];
            const fetchedKasir = kasirTx || [];
            const fetchedCashbook = cb || [];

            setRealData({ invoices: fetchedInvoices, kasir: fetchedKasir, cashbook: fetchedCashbook });

            // Do not overwrite localStorage with Supabase data to prevent local manual entries from being erased.

        } catch (err) {
            console.error('Error fetching laporan data', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Construct unified entries purely for Omzet (Income) & Expense
    const unifiedEntries = [];

    // Combine local cashbook and Supabase cashbook
    const combinedCashbookMap = new Map();
    [...cashbook, ...(realData.cashbook || [])].forEach(c => {
        if (!combinedCashbookMap.has(c.id)) {
            combinedCashbookMap.set(c.id, c);
        }
    });

    const combinedCashbook = Array.from(combinedCashbookMap.values());

    // Add ordinary cashbook (e.g. expenses, manual income)
    combinedCashbook.forEach(c => {
        // Skip duplicate manual cashbook entries if they overlap Kasir or Invoice
        if (c.reference_type === 'kasir' || c.reference_type === 'invoice') return;

        unifiedEntries.push({
            id: c.id || Math.random().toString(),
            date: c.date,
            type: c.type, // 'income' or 'expense'
            amount: c.amount,
            category: c.category || 'Lainnya',
            note: c.description || c.note
        });
    });

    // Add Invoices (Paid only for Omzet)
    realData.invoices.forEach(inv => {
        if (inv.status === 'paid') {
            unifiedEntries.push({
                id: inv.id,
                date: (inv.created_at || '').substring(0, 10) || new Date().toISOString().substring(0, 10),
                type: 'income',
                amount: inv.grand_total || inv.grandTotal || 0,
                category: 'Invoice Lunas',
                note: `Pembayaran Invoice ${inv.number}`
            });
        }
    });

    // Add Kasir
    realData.kasir.forEach(k => {
        unifiedEntries.push({
            id: k.id,
            date: (k.created_at || '').substring(0, 10) || new Date().toISOString().substring(0, 10),
            type: 'income',
            amount: k.total,
            category: 'Penjualan Kasir',
            note: `Transaksi Kasir ${k.receipt_number}`
        });
    });

    const monthEntries = unifiedEntries.filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return d.getMonth() === selMonth && d.getFullYear() === selYear;
    });

    const totalIncome = monthEntries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = monthEntries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const txCount = monthEntries.length;

    // Group by category
    const incomeByCategory = {};
    const expenseByCategory = {};
    monthEntries.forEach(e => {
        if (e.type === 'income') {
            incomeByCategory[e.category] = (incomeByCategory[e.category] || 0) + e.amount;
        } else {
            expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
        }
    });

    // Invoice status summary
    const allInvoices = realData.invoices || [];
    const invUnpaid = allInvoices.filter(i => i.status === 'unpaid');
    const invPaid = allInvoices.filter(i => i.status === 'paid');
    const invWaiting = allInvoices.filter(i => i.status === 'waiting');

    const openCashPanel = (type, label) => {
        const items = monthEntries.filter(e => e.type === type);
        setPanel({ open: true, title: label, items, type: 'cashbook' });
    };

    const openNetPanel = () => {
        setPanel({ open: true, title: `Ringkasan ${MONTHS_ID[selMonth]} ${selYear}`, items: monthEntries, type: 'cashbook' });
    };

    const openTxPanel = () => {
        setPanel({ open: true, title: 'Semua Transaksi', items: monthEntries, type: 'cashbook' });
    };

    const openInvoicePanel = (status, label, items) => {
        setPanel({ open: true, title: label, items, type: 'invoice' });
    };

    // --- CSV/Excel Export ---
    const exportCSV = () => {
        const rows = [
            ['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Jumlah'],
            ...monthEntries.map(e => [
                e.date, e.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                e.category || '', e.note || '', e.amount,
            ])
        ];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan-${MONTHS_ID[selMonth]}-${selYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportExcel = async () => {
        if (!isPro) {
            showToast(lang === 'ID' ? 'Fitur Export Excel hanya untuk pengguna PRO.' : 'Excel Export is a PRO feature.', 'error', 4000);
            return;
        }
        const { utils, writeFile } = await import('xlsx');
        const ws = utils.aoa_to_sheet([
            ['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Jumlah'],
            ...monthEntries.map(e => [
                e.date, e.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                e.category || '', e.note || '', e.amount,
            ])
        ]);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Laporan');
        writeFile(wb, `Laporan-${MONTHS_ID[selMonth]}-${selYear}.xlsx`);
    };

    const STATUS_MAP = {
        unpaid: { label: 'Belum Bayar', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        paid: { label: 'Lunas', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        waiting: { label: 'Menunggu', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    };

    const card_style = (color, bg) => ({
        card: {
            animation: 'none',
            borderTop: `3px solid ${color}`,
            background: dark ? 'rgba(255,255,255,0.04)' : bg,
            cursor: 'pointer',
            transition: 'transform 150ms, box-shadow 150ms',
        }
    });

    // === PLAN GUARD === FREE user tidak bisa akses laporan
    if (!canAccessReport()) {
        return (
            <div style={{ padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B', marginBottom: 8 }}>
                    Laporan Keuangan — Fitur PRO
                </h2>
                <p style={{ color: dark ? '#94A3B8' : '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                    Pantau omzet, laba, dan riwayat transaksi lengkap.<br />
                    Upgrade ke <strong>PRO</strong> untuk membuka akses laporan keuangan.
                </p>
                <button
                    onClick={() => window.location.href = import.meta.env.VITE_MAYAR_PRO_PAYMENT_URL}
                    style={{ padding: '14px 32px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
                >
                    🚀 Upgrade ke PRO — Rp 99.000/bln
                </button>
                <p style={{ marginTop: 12, fontSize: 13, color: '#94A3B8' }}>Atau coba PRO gratis 14 hari dari halaman <a href="/upgrade" style={{ color: '#7C3AED', fontWeight: 700 }}>Upgrade</a></p>
            </div>
        );
    }

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Laporan</h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="select" style={{ width: 130 }} value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}>
                        {MONTHS_SHORT.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select className="select" style={{ width: 90 }} value={selYear} onChange={e => setSelYear(parseInt(e.target.value))}>
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
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
                {[
                    { label: 'Pemasukan', value: formatIDR(totalIncome), color: '#10B981', bg: '#ECFDF5', icon: TrendingUp, onClick: () => openCashPanel('income', 'Pemasukan') },
                    { label: 'Pengeluaran', value: formatIDR(totalExpense), color: '#EF4444', bg: '#FEF2F2', icon: TrendingDown, onClick: () => openCashPanel('expense', 'Pengeluaran') },
                    { label: 'Laba Bersih', value: formatIDR(netProfit), color: '#7C3AED', bg: '#EDE9FE', icon: DollarSign, onClick: () => openNetPanel() },
                    { label: 'Jumlah Transaksi', value: txCount, color: '#F59E0B', bg: '#FEF3C7', icon: Hash, onClick: () => openTxPanel() },
                ].map(card => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="card"
                            style={{ animation: 'none', borderTop: `3px solid ${card.color}`, background: dark ? `rgba(255,255,255,0.04)` : card.bg, cursor: 'pointer', transition: 'transform 150ms, box-shadow 150ms' }}
                            onClick={card.onClick}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${card.color}30`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748B', fontWeight: 600 }}>{card.label}</p>
                                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: card.color }}>{card.value}</p>
                                </div>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={18} color={card.color} />
                                </div>
                            </div>
                            <p style={{ margin: '8px 0 0', fontSize: 11, color: card.color, fontWeight: 600 }}>Klik untuk detail →</p>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Income by category */}
                <div className="card" style={{ animation: 'none' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Pemasukan per Kategori</h3>
                    {Object.entries(incomeByCategory).length === 0 ? (
                        <p style={{ color: '#94A3B8', fontSize: 13 }}>Tidak ada data pemasukan bulan ini</p>
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
                    <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Pengeluaran per Kategori</h3>
                    {Object.entries(expenseByCategory).length === 0 ? (
                        <p style={{ color: '#94A3B8', fontSize: 13 }}>Tidak ada data pengeluaran bulan ini</p>
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

            {/* Invoice Status — CLICKABLE */}
            <div className="card" style={{ animation: 'none' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Ringkasan Status Invoice</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Belum Bayar', items: invUnpaid, status: 'unpaid', color: '#EF4444' },
                        { label: 'Lunas', items: invPaid, status: 'paid', color: '#10B981' },
                        { label: 'Menunggu', items: invWaiting, status: 'waiting', color: '#F59E0B' },
                        { label: 'Total', items: allInvoices, status: 'all', color: '#7C3AED' },
                    ].map(s => (
                        <div
                            key={s.label}
                            onClick={() => openInvoicePanel(s.status, `Invoice ${s.label}`, s.items)}
                            style={{ textAlign: 'center', padding: '12px 24px', borderRadius: 10, background: dark ? '#0F172A' : '#F8FAFC', cursor: 'pointer', transition: 'transform 150ms, box-shadow 150ms', flex: 1, minWidth: 100, border: `1.5px solid ${s.color}20` }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}25`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                        >
                            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</p>
                            <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: s.color }}>{s.items.length}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Slide-in right panel */}
            {panel.open && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={closePanel}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', zIndex: 900 }}
                    />
                    {/* Panel */}
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '100vw',
                        background: dark ? '#1E293B' : 'white',
                        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
                        zIndex: 901,
                        display: 'flex', flexDirection: 'column',
                        animation: 'slideFromRight 250ms cubic-bezier(0.4,0,0.2,1) forwards',
                    }}>
                        {/* Panel header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${dark ? '#334155' : '#E2E8F0'}` }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: dark ? '#F1F5F9' : '#1E293B' }}>{panel.title}</h2>
                            <button onClick={closePanel} style={{ background: dark ? '#334155' : '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <X size={16} color={dark ? '#CBD5E1' : '#64748B'} />
                            </button>
                        </div>

                        {/* Panel content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                            {panel.items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94A3B8' }}>
                                    <p style={{ fontSize: 15, fontWeight: 600 }}>Tidak ada data</p>
                                </div>
                            ) : panel.type === 'cashbook' ? (
                                // Cashbook items
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {panel.items.sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => (
                                        <div key={item.id} style={{ padding: '12px 14px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, borderLeft: `3px solid ${item.type === 'income' ? '#10B981' : '#EF4444'}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{item.description || item.category}</span>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: item.type === 'income' ? '#10B981' : '#EF4444' }}>
                                                    {item.type === 'income' ? '+' : '-'}{formatIDR(item.amount)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <span style={{ fontSize: 11, color: '#64748B' }}>{item.date}</span>
                                                {item.category && <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>{item.category}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Invoice items — clickable → navigate to /invoice
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {panel.items.map(inv => {
                                        const st = STATUS_MAP[inv.status] || STATUS_MAP.unpaid;
                                        return (
                                            <div
                                                key={inv.id}
                                                onClick={() => { closePanel(); navigate('/invoice', { state: { invoiceId: inv.id } }); }}
                                                style={{ padding: '12px 14px', background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, cursor: 'pointer', transition: 'all 150ms' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = dark ? '#1E293B' : '#EDE9FE'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = dark ? '#0F172A' : '#F8FAFC'; e.currentTarget.style.transform = ''; }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{inv.number}</span>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: st.bg, color: st.color }}>{st.label}</span>
                                                        <ExternalLink size={12} color="#7C3AED" />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 12, color: '#64748B' }}>{inv.clientName || '—'} · {inv.date}</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{formatIDR(inv.grandTotal || 0)}</span>
                                                </div>
                                                <p style={{ margin: '6px 0 0', fontSize: 10, color: '#7C3AED', fontWeight: 600 }}>Klik untuk buka &amp; edit →</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Panel footer */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${dark ? '#334155' : '#E2E8F0'}` }}>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748B', textAlign: 'center' }}>{panel.items.length} item ditemukan</p>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes slideFromRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
