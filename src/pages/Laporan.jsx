import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, TrendingUp, TrendingDown, DollarSign, Hash, ExternalLink, Download, FileSpreadsheet, FileText, BarChart2, ShieldCheck, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import { formatIDR } from '../utils/currency';
import { normalizeDateYMD, todayStr as getTodayStr } from '../utils/date';
import { isMirrorCashbookRow, isPaidStatus, isUnpaidStatus } from '../utils/accounting';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import { useOutlet } from '../context/OutletContext';
import UpgradeModal from '../components/UpgradeModal';
import OwnerPinGuard from '../components/OwnerPinGuard';
import StatCard from '../components/StatCard';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


const MONTHS_SHORT = {
    id: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'],
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
};

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

export default function Laporan() {
    const { dark } = useTheme();
    const navigate = useNavigate();
    const { isPro } = usePlan();
    const { showToast } = useToast();
    const { lang, t } = useLang();
    const isEn = lang === 'EN';
    const { user, canAccessReport } = useAuth();
    const { activeOutlet } = useOutlet() || {};

    const [timeFilter, setTimeFilter] = useState('month'); // 'today', 'week', 'month'

    const [realData, setRealData] = useState({ invoices: [], kasir: [], cashbook: [], kasirExpenses: [], shifts: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [, setDebts] = useState({ hutang: 0, piutang: 0 });

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

    const fetchData = useCallback(async (isInitial = false) => {
        if (!canAccessReport()) {
            setIsLoading(false);
            return;
        }

        if (isInitial) setIsLoading(true);
        try {
            const outletId = activeOutlet?.id || null;
            
            // Calculate local-timezone accurate bounds for selected month (widened when today/week is active)
            const monthStartLocal = new Date(selYear, selMonth, 1, 0, 0, 0, 0);
            const monthEndLocal = new Date(selYear, selMonth + 1, 0, 23, 59, 59, 999);

            const nowLocal = new Date();
            const weekStartLocal = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() - 7, 0, 0, 0, 0);
            const todayEndLocal = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), 23, 59, 59, 999);

            const queryStartLocal = timeFilter === 'month'
                ? monthStartLocal
                : new Date(Math.min(monthStartLocal.getTime(), weekStartLocal.getTime()));
            const queryEndLocal = timeFilter === 'month'
                ? monthEndLocal
                : new Date(Math.max(monthEndLocal.getTime(), todayEndLocal.getTime()));

            const startYMD = queryStartLocal.toLocaleDateString('en-CA');
            const endYMD = queryEndLocal.toLocaleDateString('en-CA');
            const startIso = queryStartLocal.toISOString();
            const endIso = queryEndLocal.toISOString();

            let cbQuery = supabase.from('cashbook')
                .select('id, type, amount, date, created_at, category, description, outlet_id, reference_type, reference_id, is_automated')
                .eq('user_id', user.id)
                .gte('date', startYMD)
                .lte('date', endYMD)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });
            if (outletId) cbQuery = cbQuery.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let dq = supabase.from('documents')
                .select('id, type, doc_number, client_name, total_amount, status, created_at, data, outlet_id')
                .eq('user_id', user.id)
                .in('type', ['invoice', 'inv'])
                .order('created_at', { ascending: false })
                .limit(500);
            if (outletId) dq = dq.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let kq = supabase.from('kasir_transactions')
                .select('id, total, created_at, receipt_number, payment_method, outlet_id')
                .eq('user_id', user.id)
                .eq('status', 'paid')
                .gte('created_at', startIso)
                .lte('created_at', endIso)
                .order('created_at', { ascending: false });
            if (outletId) kq = kq.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let expQ = supabase.from('kasir_expenses')
                .select('id, amount, created_at, date, category, description, outlet_id')
                .eq('user_id', user.id)
                .gte('date', startYMD)
                .lte('date', endYMD)
                .order('date', { ascending: false });
            if (outletId) expQ = expQ.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let shiftQ = supabase.from('kasir_shifts')
                .select('id, employee_name, ended_at, shift_notes')
                .eq('user_id', user.id)
                .gte('ended_at', startIso)
                .lte('ended_at', endIso)
                .order('ended_at', { ascending: false });
            if (outletId) shiftQ = shiftQ.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            let debtQ = supabase.from('documents')
                .select('id, type, doc_number, client_name, total_amount, status, created_at, data, outlet_id')
                .eq('user_id', user.id)
                .in('type', ['piutang', 'hutang'])
                .limit(500);
            if (outletId) debtQ = debtQ.or(`outlet_id.eq.${outletId},outlet_id.is.null`);

            // 2. Parallel Burst Fetch
            const [
                { data: cb },
                { data: docs },
                { data: kasirTx },
                { data: kExps },
                { data: shifts },
                { data: debtDocs }
            ] = await Promise.all([
                cbQuery, dq, kq, expQ, shiftQ, debtQ
            ]);

            setRealData({
                invoices: docs || [],
                kasir: kasirTx || [],
                cashbook: cb || [],
                kasirExpenses: kExps || [],
                shifts: shifts || [],
                documents: debtDocs || []
            });
            
            const hTotal = (debtDocs || []).filter(d => d.type === 'hutang' && isUnpaidStatus(d.status)).reduce((s, d) => s + Number(d.total_amount ?? d.data?.grandTotal ?? d.data?.amount ?? 0), 0);
            const pTotal = (debtDocs || []).filter(d => d.type === 'piutang' && isUnpaidStatus(d.status)).reduce((s, d) => s + Number(d.total_amount ?? d.data?.grandTotal ?? d.data?.amount ?? 0), 0);
            setDebts({ hutang: hTotal, piutang: pTotal });

        } catch (err) {
            console.error('Laporan: fetchData failed', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, activeOutlet?.id, canAccessReport, selMonth, selYear, timeFilter]);

    useEffect(() => {
        if (!user) return;
        
        fetchData(true);

        let debounceTimer;
        const handleSync = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchData();
            }, 300);
        };

        window.addEventListener('data-updated', handleSync);
        window.addEventListener('external-sync', handleSync);
        window.addEventListener('cashbook-updated', handleSync);
        window.addEventListener('invoice-updated', handleSync);
        window.addEventListener('kasir-updated', handleSync);
        window.addEventListener('piutang-updated', handleSync);
        window.addEventListener('focus', handleSync);
        return () => {
            window.removeEventListener('data-updated', handleSync);
            window.removeEventListener('external-sync', handleSync);
            window.removeEventListener('cashbook-updated', handleSync);
            window.removeEventListener('invoice-updated', handleSync);
            window.removeEventListener('kasir-updated', handleSync);
            window.removeEventListener('piutang-updated', handleSync);
            window.removeEventListener('focus', handleSync);
            clearTimeout(debounceTimer);
        };
    }, [user, fetchData]);

    // UNIFIED 4-SOURCE ACCOUNTING ENGINE (100% Parity with Dashboard.jsx)
    const unifiedEntries = useMemo(() => [
        // 1. POS Sales (paid)
        ...(realData.kasir || []).map(tx => ({
            id: tx.id,
            date: normalizeDateYMD(null, tx.created_at),
            type: 'income',
            amount: Number(tx.total || 0),
            category: t('laporan_pos_category'),
            note: tx.receipt_number || 'POS',
            raw_date: tx.created_at || tx.date
        })),
        // 2. Paid Invoices (invoice / inv only — never auto-kwitansi)
        ...(realData.invoices || []).filter(inv => isPaidStatus(inv.status)).map(inv => ({
            id: inv.id,
            date: normalizeDateYMD(inv.data?.date, inv.created_at),
            type: 'income',
            amount: Number(inv.total_amount ?? inv.data?.grandTotal ?? inv.data?.amount ?? 0),
            category: t('laporan_inv_category'),
            note: inv.client_name || inv.data?.clientName || inv.data?.client_name || '-',
            raw_date: inv.created_at || inv.data?.date
        })),
        // 3. POS Expenses
        ...(realData.kasirExpenses || []).map(ex => ({
            id: ex.id,
            date: normalizeDateYMD(ex.date, ex.created_at),
            type: 'expense',
            amount: Number(ex.amount || 0),
            category: ex.category || 'Pengeluaran Kasir',
            note: ex.description || '-',
            raw_date: ex.created_at || ex.date
        })),
        // 4. Direct Cashbook (Business Notes + Standalone Kwitansi + Settled Hutang/Piutang)
        ...(realData.cashbook || []).filter(c => !isMirrorCashbookRow(c)).map(c => ({
            id: c.id,
            date: normalizeDateYMD(c.date, c.created_at),
            type: c.type,
            amount: Number(c.amount || 0),
            category: c.category || (c.type === 'income' ? t('laporan_income') : t('laporan_expense')),
            note: c.description || t('lap_col_note'),
            raw_date: c.created_at || c.date
        }))
    ], [realData, t]);

    const todayStr = getTodayStr();
    
    const getWeekRange = useCallback(() => {
        const now = new Date();
        const day = now.getDay() || 7; 
        const start = new Date(now);
        start.setDate(now.getDate() - day + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start: start.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA') };
    }, []);

    const filteredEntries = useMemo(() => unifiedEntries.filter(e => {
        const eDate = e.date || '';
        if (timeFilter === 'today') return eDate === todayStr;
        if (timeFilter === 'week') {
            const { start, end } = getWeekRange();
            return eDate >= start && eDate <= end;
        }
        const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
        return eDate.startsWith(monthStr);
    }), [unifiedEntries, timeFilter, todayStr, selMonth, selYear, getWeekRange]);

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

    // Rekapitulasi Pajak & Kepatuhan UMKM (PP 55/2022)
    const taxSummary = useMemo(() => {
        let ppnTotal = 0;
        let pphTotal = 0;
        (realData.invoices || []).forEach(inv => {
            if (isPaidStatus(inv.status)) {
                const invDate = normalizeDateYMD(inv.data?.date, inv.created_at) || '';
                let inPeriod = false;
                if (timeFilter === 'today') {
                    inPeriod = (invDate === todayStr);
                } else if (timeFilter === 'week') {
                    const { start, end } = getWeekRange();
                    inPeriod = (invDate >= start && invDate <= end);
                } else {
                    const monthStr = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
                    inPeriod = invDate.startsWith(monthStr);
                }
                if (inPeriod) {
                    const d = inv.data || {};
                    if (d.ppnAmt) ppnTotal += Number(d.ppnAmt) || 0;
                    if (d.pphAmt) pphTotal += Number(d.pphAmt) || 0;
                }
            }
        });
        const pp55Rate = 0.005; // 0.5% PPh Final UMKM
        const estPphFinal = Math.round(totalIncome * pp55Rate);
        const thresholdPP55 = 500000000; // Rp 500 Jt
        const isExempt = totalIncome <= thresholdPP55;

        return {
            grossTurnover: totalIncome,
            estPphFinal,
            ppnTotal,
            pphTotal,
            isExempt,
            thresholdPP55
        };
    }, [realData.invoices, totalIncome, timeFilter, todayStr, selMonth, selYear, getWeekRange]);



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


    // --- CSV/Excel Export ---
    const sanitizeCSV = (text) => {
        if (!text) return '-';
        let clean = String(text).replace(/"/g, '""');
        if (/^[=+\-@]/.test(clean)) return "'" + clean;
        clean = clean.replace(/[\r\n]+/g, ' ');
        return clean;
    };

    const exportCSV = () => {
        const rows = [
            [t('lap_col_date'), t('lap_col_type'), t('lap_col_cat'), t('lap_col_note'), t('lap_col_amount')],
            ...filteredEntries.map(e => [
                sanitizeCSV(e.date), sanitizeCSV(e.type === 'income' ? t('laporan_income') : t('laporan_expense')),
                sanitizeCSV(e.category || ''), sanitizeCSV(e.note || ''), e.amount,
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
            ['Timestamp (UTC)', t('lap_col_date'), t('lap_col_type'), t('lap_col_cat'), t('lap_col_note'), t('lap_col_amount')],
            ...filteredEntries.map(e => [
                sanitizeCSV(e.raw_date ? new Date(e.raw_date).toISOString() : ''),
                sanitizeCSV(e.date), sanitizeCSV(e.type === 'income' ? t('laporan_income') : t('laporan_expense')),
                sanitizeCSV(e.category || ''), sanitizeCSV(e.note || ''), e.amount,
            ])
        ]);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Laporan');
        writeFile(wb, `${t('laporan_title')}-${MONTHS[selMonth]}-${selYear}.xlsx`);
    };

    const exportPDF = async () => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // 1. Header (Corporate Look)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(31, 41, 55); // charcoal
            doc.text("MyInvoice.space", 14, 20);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.setTextColor(124, 58, 237); // violet brand color
            doc.text((t('laporan_title') || "LAPORAN KEUANGAN").toUpperCase(), 14, 26);

            // Divider line
            doc.setDrawColor(124, 58, 237);
            doc.setLineWidth(0.5);
            doc.line(14, 29, 196, 29);

            // Metadata info
            const isEn = lang?.toLowerCase() === 'en';
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(75, 85, 99);
            doc.text(isEn ? `Outlet: ${activeOutlet?.name || "All Outlets"}` : `Outlet: ${activeOutlet?.name || "Semua Outlet"}`, 14, 37);
            doc.text(isEn ? `Period: ${MONTHS[selMonth]} ${selYear}` : `Periode: ${MONTHS[selMonth]} ${selYear}`, 14, 42);
            doc.text(isEn ? `Printed: ${new Date().toLocaleString()}` : `Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 47);

            // 2. Financial Summary (3 boxes)
            // Draw box for Pemasukan
            doc.setFillColor(240, 253, 244); // light green (emerald-50)
            doc.rect(14, 53, 56, 22, 'F');
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(22, 101, 52); // green-800
            doc.text(isEn ? "TOTAL INCOME" : "TOTAL PEMASUKAN", 18, 60);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(formatIDR(totalIncome), 18, 68);

            // Draw box for Pengeluaran
            doc.setFillColor(254, 242, 242); // light red (red-50)
            doc.rect(75, 53, 56, 22, 'F');
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(153, 27, 27); // red-800
            doc.text(isEn ? "TOTAL EXPENSE" : "TOTAL PENGELUARAN", 79, 60);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(formatIDR(totalExpense), 79, 68);

            // Draw box for Bersih
            doc.setFillColor(243, 232, 255); // light purple (purple-50)
            doc.rect(136, 53, 60, 22, 'F');
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(107, 33, 168); // purple-800
            doc.text(isEn ? "NET BALANCE" : "SALDO BERSIH", 140, 60);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(formatIDR(netProfit), 140, 68);

            // 3. Financial Ledger Table Data
            const sortedEntries = [...filteredEntries].sort((a, b) => {
                const dateA = new Date(a.raw_date || a.date);
                const dateB = new Date(b.raw_date || b.date);
                return dateA - dateB;
            });

            let balance = 0;
            const tableRows = sortedEntries.map((e, index) => {
                const isIncome = e.type === 'income';
                const debet = isIncome ? formatIDR(e.amount) : '-';
                const kredit = !isIncome ? formatIDR(e.amount) : '-';
                balance += isIncome ? e.amount : -e.amount;
                
                const desc = e.category + (e.note && e.note !== '-' && e.note !== e.category ? ` - ${e.note}` : '');
                
                return [
                    index + 1,
                    e.date,
                    desc,
                    debet,
                    kredit,
                    formatIDR(balance)
                ];
            });

            const headers = [
                isEn ? 'No' : 'No',
                isEn ? 'Date' : 'Tanggal',
                isEn ? 'Description' : 'Keterangan',
                isEn ? 'Debit' : 'Debet',
                isEn ? 'Credit' : 'Kredit',
                isEn ? 'Balance' : 'Saldo'
            ];

            autoTable(doc, {
                startY: 83,
                head: [headers],
                body: tableRows,
                theme: 'striped',
                headStyles: {
                    fillColor: [31, 41, 55], // charcoal
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9,
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { halign: 'left', cellWidth: 24 },
                    2: { halign: 'left' },
                    3: { halign: 'right', cellWidth: 32 },
                    4: { halign: 'right', cellWidth: 32 },
                    5: { halign: 'right', cellWidth: 34 }
                },
                styles: {
                    fontSize: 8.5,
                    cellPadding: 3,
                    valign: 'middle'
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251] // light gray
                }
            });

            doc.save(`${t('laporan_title')}-${MONTHS[selMonth]}-${selYear}.pdf`);
            showToast(isEn ? 'PDF exported successfully' : 'PDF berhasil diekspor', 'success');
        } catch (err) {
            console.error('Error exporting PDF:', err);
            showToast(isEn ? 'Failed to export PDF' : 'Gagal mengekspor PDF', 'error');
        }
    };


    const STATUS_MAP = {
        unpaid: { label: t('inv_status_unpaid'), color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        paid: { label: t('inv_status_paid'), color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        waiting: { label: t('inv_status_waiting'), color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        cancelled: { label: t('inv_status_cancelled'), color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
    };


    // === PLAN GUARD === FREE user tidak bisa akses laporan
    if (!canAccessReport()) {
        return (
            <div style={{ padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
                <div style={{ marginBottom: 16 }} className="flex justify-center text-slate-300"><BarChart2 size={56} /></div>
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
        <OwnerPinGuard>
        <div className="page-enter" style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto', position: 'relative', paddingBottom: 'calc(env(safe-area-inset-bottom, 1rem) + 1.5rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('laporan_title')}</h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="select" style={{ width: '100%', maxWidth: 140, fontWeight: 'bold', color: '#7C3AED', minHeight: '44px' }} value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', overflow: 'hidden', height: 42, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <button
                            onClick={exportCSV}
                            className="hover:bg-slate-50 transition-colors"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: '100%', border: 'none', background: 'transparent', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRight: '1px solid #E2E8F0' }}
                        >
                            <Download size={14} className="text-slate-500" /> CSV
                        </button>
                        <button
                            onClick={exportExcel}
                            className="hover:bg-slate-50 transition-colors"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: '100%', border: 'none', background: 'transparent', color: isPro ? '#334155' : '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRight: '1px solid #E2E8F0' }}
                        >
                            <FileSpreadsheet size={14} className={isPro ? "text-emerald-600" : "text-slate-400"} /> Excel {!isPro && '(PRO)'}
                        </button>
                        <button
                            onClick={exportPDF}
                            className="hover:bg-slate-50 transition-colors"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: '100%', border: 'none', background: 'transparent', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                        >
                            <FileText size={14} className="text-slate-700" /> PDF
                        </button>
                    </div>
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
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{formatIDR(val)}</span>
                                    </div>
                                    <div style={{ height: 6, background: dark ? '#334155' : '#F1F5F9', borderRadius: 3 }}>
                                        <div style={{ height: '100%', width: `${totalIncome > 0 ? (val / totalIncome) * 100 : 0}%`, background: '#0F172A', borderRadius: 3, transition: 'width 600ms' }} />
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
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{formatIDR(val)}</span>
                                    </div>
                                    <div style={{ height: 6, background: dark ? '#334155' : '#F1F5F9', borderRadius: 3 }}>
                                        <div style={{ height: '100%', width: `${totalExpense > 0 ? (val / totalExpense) * 100 : 0}%`, background: '#64748B', borderRadius: 3, transition: 'width 600ms' }} />
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Rekapitulasi Pajak & Kepatuhan UMKM (PP 55/2022) */}
            <div className="card mb-6" style={{ background: dark ? '#1E1B4B' : 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%)', border: '1.5px solid #DDD6FE', borderRadius: 20, padding: '24px 28px', animation: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ display: 'inline-flex', padding: 6, borderRadius: 10, background: '#7C3AED', color: 'white' }}>
                                <ShieldCheck size={18} />
                            </span>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: dark ? '#F5F3FF' : '#1E1B4B' }}>
                                {isEn ? 'Tax Summary & MSME Compliance (PP 55 / 2022)' : 'Rekapitulasi Pajak & Kepatuhan UMKM (PP 55 / 2022)'}
                            </h3>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: dark ? '#C4B5FD' : '#6B7280' }}>
                            {isEn
                                ? 'Automated tax estimates for Indonesian small businesses and corporate B2B withholding'
                                : 'Estimasi kepatuhan pajak usaha UMKM, PPh Final 0.5%, PPN, dan bukti potong PPh 23'}
                        </p>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9999, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', fontSize: 12, fontWeight: 700 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                        {isEn ? 'PP 55/2022 Compliant' : 'Sesuai PP 55 / 2022'}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 16 }}>
                    <div style={{ background: dark ? '#0F172A' : 'white', padding: '16px 18px', borderRadius: 14, border: '1px solid #E9D5FF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: dark ? '#94A3B8' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            {isEn ? 'Gross Turnover (Omset Bruto)' : 'Omset Bruto Masa Ini'}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: dark ? '#F1F5F9' : '#0F172A', fontFamily: 'monospace' }}>
                            {formatIDR(taxSummary.grossTurnover)}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                            {isEn ? 'Total paid sales + invoices' : 'Total pemasukan invoice & kasir'}
                        </div>
                    </div>

                    <div style={{ background: dark ? '#0F172A' : 'white', padding: '16px 18px', borderRadius: 14, border: '1px solid #E9D5FF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: dark ? '#94A3B8' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            {isEn ? 'Est. PPh Final UMKM (0.5%)' : 'Estimasi PPh Final 0.5%'}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED', fontFamily: 'monospace' }}>
                            {formatIDR(taxSummary.estPphFinal)}
                        </div>
                        <div style={{ fontSize: 11, color: '#8B5CF6', marginTop: 4, fontWeight: 600 }}>
                            {isEn ? '0.5% × Gross Turnover' : 'Tarif PP 55/2022 (0.5%)'}
                        </div>
                    </div>

                    <div style={{ background: dark ? '#0F172A' : 'white', padding: '16px 18px', borderRadius: 14, border: '1px solid #E9D5FF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: dark ? '#94A3B8' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            {isEn ? 'PPN Collected (11% / 12%)' : 'PPN Terkumpul (11%/12%)'}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: dark ? '#F1F5F9' : '#0F172A', fontFamily: 'monospace' }}>
                            {formatIDR(taxSummary.ppnTotal)}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                            {isEn ? 'From paid invoices with VAT' : 'Dari invoice ber-PPN yang lunas'}
                        </div>
                    </div>

                    <div style={{ background: dark ? '#0F172A' : 'white', padding: '16px 18px', borderRadius: 14, border: '1px solid #E9D5FF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: dark ? '#94A3B8' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                            {isEn ? 'PPh 23 Withheld by Clients' : 'PPh 23 Dipotong Klien'}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', fontFamily: 'monospace' }}>
                            {formatIDR(taxSummary.pphTotal)}
                        </div>
                        <div style={{ fontSize: 11, color: '#047857', marginTop: 4 }}>
                            {isEn ? 'Client must provide withholding slip' : 'Klien wajib setor bukti potong (Bupot)'}
                        </div>
                    </div>
                </div>

                <div style={{ background: dark ? '#2E1065' : '#F5F3FF', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Info size={16} className="text-violet-600 shrink-0" />
                    <p style={{ margin: 0, fontSize: 12, color: dark ? '#DDD6FE' : '#5B21B6', lineHeight: 1.5 }}>
                        {isEn
                            ? 'Tip: Under Indonesian Government Regulation PP 55/2022, individual taxpayers (WPOP) running MSMEs are exempt from 0.5% PPh Final for gross annual turnover up to Rp 500,000,000 per tax year.'
                            : 'Catatan Kepatuhan: Berdasarkan PP 55/2022 Pasal 60, Wajib Pajak Orang Pribadi (WPOP) UMKM mendapat fasilitas bebas PPh Final 0.5% untuk omset bruto kumulatif sampai dengan Rp 500 Juta per tahun pajak.'}
                    </p>
                </div>
            </div>

            {/* EMERGENCY PORTAL MODAL (Full Screen Coverage) */}
            {panel.open && ReactDOM.createPortal(
                (() => {
                    const totalPages = Math.ceil(panel.items.length / itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const currentItems = panel.items.slice(startIndex, startIndex + itemsPerPage);

                    return (
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.75)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9999999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            boxSizing: 'border-box'
                        }}>
                            <div onClick={closePanel} style={{ position: 'absolute', inset: 0 }} />
                            
                            <div style={{ 
                                position: 'relative',
                                background: 'white', 
                                borderRadius: '16px', 
                                width: '100%', 
                                maxWidth: '860px', 
                                maxHeight: '85vh', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                boxShadow: '0 24px 64px rgba(0,0,0,0.5)', 
                                overflow: 'hidden', 
                                animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards' 
                            }}>
                                {/* Fixed Header */}
                                <div style={{ 
                                    padding: '18px 24px', 
                                    borderBottom: '1px solid #E2E8F0', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    flexShrink: 0,
                                    background: 'white',
                                    zIndex: 10
                                }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B' }}>{panel.title.toUpperCase()}</h2>
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>{panel.items.length} {t('laporan_tx_found') || 'Transactions'}</p>
                                    </div>
                                    <button onClick={closePanel} style={{ width: 36, height: 36, borderRadius: '10px', background: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#64748B' }}>
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Scrollable Content List */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8FAFC' }}>
                                    {currentItems.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
                                            <p style={{ fontSize: 16, fontWeight: 600 }}>{t('no_data_period')}</p>
                                        </div>
                                    ) : panel.type === 'cashbook' ? (
                                        currentItems.map(item => {
                                            // Hierarchy Cleanup
                                            const displayNote = (item.note && item.note !== item.category && item.note !== '-') ? item.note : '';
                                            
                                            return (
                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{item.category}</p>
                                                        {displayNote && (
                                                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B', fontWeight: 600, fontStyle: 'italic' }}>
                                                                {displayNote}
                                                            </p>
                                                        )}
                                                        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>{item.date}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: item.type === 'income' ? '#10B981' : '#EF4444' }}>
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
                                                <div key={inv.id} onClick={() => { closePanel(); navigate('/invoice', { state: { invoiceId: inv.id } }); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{inv.number}</p>
                                                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B', fontWeight: 600 }}>{inv.clientName || '-'} • {inv.date}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(inv.grandTotal || 0)}</p>
                                                        <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: '100px', background: st.bg, color: st.color, textTransform: 'uppercase' }}>{st.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Footer: Pagination Professional */}
                                {totalPages > 1 && (
                                    <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: currentPage === 1 ? 'transparent' : '#F8FAFC', color: currentPage === 1 ? '#CBD5E1' : '#64748B', fontWeight: 700, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                                            {t('onboard_back') || 'Previous'}
                                        </button>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{t('page_label') || 'Page'} {currentPage} / {totalPages}</span>
                                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: currentPage === totalPages ? 'transparent' : '#F8FAFC', color: currentPage === totalPages ? '#CBD5E1' : '#64748B', fontWeight: 700, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                                            {t('onboard_next') || 'Next'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })(),
                document.body
            )}

            <style>{`
                @keyframes scaleIn {
                    0% { transform: scale(0.9) translateY(20px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
        </OwnerPinGuard>
    );
}


