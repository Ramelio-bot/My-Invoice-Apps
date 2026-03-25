import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Hash, ExternalLink, Download, FileSpreadsheet } from 'lucide-react';
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
    const closePanel = () => setPanel(p => ({ ...p, open: false }));

    useEffect(() => {
        if (user) {
            fetchData();
        }

        const handleInvoiceUpdated = () => {
            if (user) fetchData();
        };

        window.addEventListener('invoice-updated', handleInvoiceUpdated);
        window.addEventListener('cashbook-updated', handleInvoiceUpdated);
        window.addEventListener('kasir-updated', handleInvoiceUpdated);
        return () => {
            window.removeEventListener('invoice-updated', handleInvoiceUpdated);
            window.removeEventListener('cashbook-updated', handleInvoiceUpdated);
            window.removeEventListener('kasir-updated', handleInvoiceUpdated);
        };
    }, [user, activeOutlet?.id]);

    const fetchData = async () => {
        if (!canAccessReport()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const outletId = activeOutlet?.id || null;

            // Fetch Kasir Sales
            let kq = supabase
                .from('kasir_transactions')
                .select('id, user_id, receipt_number, subtotal, discount_amount, total, payment_method, created_at')
                .eq('user_id', user.id);
            if (outletId) kq = kq.eq('outlet_id', outletId);
            const { data: kasirTx, error: kErr } = await kq;
            if (kErr) console.error('Error fetching kasir_transactions:', kErr);

            // Fetch Invoices (documents)
            let dq = supabase
                .from('documents')
                .select('*')
                .eq('user_id', user.id)
                .in('type', ['invoice', 'kwitansi']);
            if (outletId) dq = dq.eq('outlet_id', outletId);
            const { data: docs, error: dErr } = await dq;
            if (dErr) console.error('Error fetching documents:', dErr);

            // Fetch Cashbook
            let cbq = supabase.from('cashbook').select('*').eq('user_id', user.id);
            if (outletId) cbq = cbq.eq('outlet_id', outletId);
            const { data: cb, error: cbErr } = await cbq;
            if (cbErr) console.error('Error fetching cashbook:', cbErr);

            // 4. Fetch kasir_shifts for evaluations
            // 1. Tambahin ini (Wajib ada variabel kExps)
            const { data: kExps } = await supabase.from('kasir_expenses').select('*').eq('user_id', user.id);

            // 2. Ganti kueri shifts lu jadi literal ini
            const { data: shifts } = await supabase
                .from('kasir_shifts')
                .select('shift_notes, employee_name, ended_at')
                .eq('user_id', user.id)
                .not('shift_notes', 'is', null);

            setRealData({
                invoices: docs || [],
                kasir: kasirTx || [],
                cashbook: cb || [],
                kasirExpenses: kExps || [],
                shifts: shifts || []
            });
            setInvoices(docs || []);
            setCashbook(cb || []);

            // Calculate debt summary
            const { data: debtDocs } = await supabase.from('documents').select('total_amount, type, status').eq('user_id', user.id).in('type', ['piutang', 'hutang']);
            const hTotal = (debtDocs || []).filter(d => d.type === 'hutang' && d.status !== 'lunas').reduce((s, d) => s + (d.total_amount || 0), 0);
            const pTotal = (debtDocs || []).filter(d => d.type === 'piutang' && d.status !== 'lunas').reduce((s, d) => s + (d.total_amount || 0), 0);
            setDebts({ hutang: hTotal, piutang: pTotal });

        } catch (err) {
            console.error('Unexpected error in fetchData:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Construct unified entries purely for Omzet (Income) & Expense
    const unifiedEntries = [];

    // Add everything from Supabase Cashbook EXCEPT Kasir units (to avoid double counting with separate tables)
    (realData.cashbook || []).forEach(c => {
        // Use category to filter out kasir since reference_type doesn't exist in schema
        const isPos = c.category === 'Penjualan Kasir' || c.category === 'Pengeluaran Kasir' || c.category === t('lap_pos_sale') || c.category === t('lap_pos_expense');
        if (isPos || c.document_id) return;

        unifiedEntries.push({
            id: c.id || Math.random().toString(),
            date: c.date,
            type: c.type, // 'income' or 'expense'
            amount: Number(c.amount || 0),
            category: c.category || (c.type === 'income' ? t('laporan_income') : t('laporan_expense')),
            note: c.description || t('lap_col_note')
        });
    });

    // Add Kasir from Supabase (Primary source for POS)
    (realData.kasir || []).forEach(k => {
        unifiedEntries.push({
            id: k.id,
            date: (k.created_at || '').substring(0, 10),
            type: 'income',
            amount: Number(k.total || 0),
            category: `[POS] ${t('lap_pos_sale')}`,
            note: `[POS] ${t('lap_pos_sale')} ${k.receipt_number}`
        });
    });

    // Add Kasir Expenses from Supabase
    (realData.kasirExpenses || []).forEach(ex => {
        unifiedEntries.push({
            id: ex.id,
            date: ex.date,
            type: 'expense',
            amount: Number(ex.amount || 0),
            category: ex.category || t('lap_pos_expense'),
            note: `[POS] ${ex.description || t('lap_pos_expense')}`
        });
    });

    // Add Paid Invoices & Kwitansi to Income
    (realData.invoices || []).forEach(inv => {
        if (inv.status === 'paid' || inv.status === 'Lunas') {
            unifiedEntries.push({
                id: inv.id,
                date: (inv.created_at || '').substring(0, 10),
                type: 'income',
                amount: Number(inv.total_amount || 0),
                category: inv.type === 'kwitansi' ? '[Kwitansi]' : '[Invoice]',
                note: `${inv.type === 'kwitansi' ? 'Kwitansi' : 'Invoice'} ${inv.doc_number || inv.number}`
            });
        }
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
    const allInvoices = invoices || [];
    const invUnpaid = allInvoices.filter(i => ['unpaid', 'Belum Bayar', t('inv_status_unpaid')].includes(i.status));
    const invPaid = allInvoices.filter(i => ['paid', 'Lunas', t('inv_status_paid')].includes(i.status));
    const invWaiting = allInvoices.filter(i => ['waiting', 'Menunggu', t('inv_status_waiting')].includes(i.status));

    const openCashPanel = (type, label) => {
        const items = monthEntries.filter(e => e.type === type);
        setPanel({ open: true, title: label, items, type: 'cashbook' });
    };

    const openNetPanel = () => {
        setPanel({ open: true, title: `${t('lap_summary_for')} ${MONTHS[selMonth]} ${selYear}`, items: monthEntries, type: 'cashbook' });
    };

    const openTxPanel = () => {
        setPanel({ open: true, title: t('lap_all_tx'), items: monthEntries, type: 'cashbook' });
    };

    const openInvoicePanel = (status, label, items) => {
        setPanel({ open: true, title: label, items, type: 'invoice' });
    };

    // --- CSV/Excel Export ---
    const exportCSV = () => {
        const rows = [
            [t('lap_col_date'), t('lap_col_type'), t('lap_col_cat'), t('lap_col_note'), t('lap_col_amount')],
            ...monthEntries.map(e => [
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
            ...monthEntries.map(e => [
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

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('laporan_title')}</h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="select" style={{ width: 130 }} value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}>
                        {MONTHS_SHORT[lang?.toLowerCase() || 'id'].map((m, i) => <option key={m} value={i}>{m}</option>)}
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

            {/* Business Evaluation Section */}
            <div className="card" style={{ animation: 'none', background: dark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }}>
                 <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} />
                    {t('cb_note') || 'Evaluasi Bisnis & Catatan Kasir'}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {realData.shifts.filter(s => {
                         const d = new Date(s.ended_at);
                         return d.getMonth() === selMonth && d.getFullYear() === selYear;
                     }).length > 0 ? (
                         realData.shifts.filter(s => {
                            const d = new Date(s.ended_at);
                            return d.getMonth() === selMonth && d.getFullYear() === selYear;
                         }).sort((a,b) => new Date(b.ended_at) - new Date(a.ended_at)).map((s, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                                <p className="text-sm font-bold text-slate-800 mb-3 italic">"{s.shift_notes}"</p>
                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                    <span>{s.employee_name}</span>
                                    <span>{new Date(s.ended_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                         ))
                     ) : (
                         <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                             <p className="text-slate-400 italic text-sm">{t('laporan_no_evaluation') || 'Belum ada evaluasi bisnis di periode ini.'}</p>
                         </div>
                     )}
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
                                    <p style={{ fontSize: 15, fontWeight: 600 }}>{t('laporan_no_data')}</p>
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
                                                <p style={{ margin: '6px 0 0', fontSize: 10, color: '#7C3AED', fontWeight: 600 }}>{t('laporan_click_edit')}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Panel footer */}
                        <div style={{ padding: '16px 24px', borderTop: `1px solid ${dark ? '#334155' : '#E2E8F0'}` }}>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748B', textAlign: 'center' }}>{panel.items.length} {t('laporan_items_found')}</p>
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
