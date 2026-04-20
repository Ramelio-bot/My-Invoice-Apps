import { useState, useMemo, useEffect } from "react";
import ReactDOM from 'react-dom';
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { useOutlet } from "../context/OutletContext";
import { usePlan } from "../context/PlanContext";
import { recordAudit } from "../utils/audit";
import UpgradePrompt from "../components/UpgradePrompt";
import DeleteReasonModal from "../components/DeleteReasonModal";
import { CreditCard, DollarSign, ListOrdered, ShoppingBag, Wallet, BarChart2, MessageCircle, Download, Tag, Star, Gift, Trash2, FileText, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCompactCurrency, formatIDR } from "../utils/currency";

export default function LaporanKasir() {
    const { t, lang } = useLang();
    const { effectivePlan, isAdmin, user, canAccessAdvancedKasir } = useAuth();
    const { isPro } = usePlan();
    const { activeOutlet } = useOutlet() || {};
    const { showToast } = useToast();

    const [transactions, setTransactions] = useState([]);
    const [transactionItems, setTransactionItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [txToDelete, setTxToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'expenses'
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [currentPage, setCurrentPage] = useState(1);
    const [periodNotes, setPeriodNotes] = useState([]); // Sales & Expenses combined
    const [panel, setPanel] = useState({ open: false, title: '', items: [] }); // Detail modal state

    // Obsolete getDateRange in favor of selectedDate

    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        if (!user) return;
        if (effectivePlan === 'free' && !isAdmin) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const startDate = new Date(selectedDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(selectedDate);
                endDate.setHours(23, 59, 59, 999);

                let query = supabase
                    .from("kasir_transactions")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("status", "paid")
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString())
                    .order('created_at', { ascending: false });

                if (activeOutlet?.id) query = query.eq('outlet_id', activeOutlet.id);

                const { data, error } = await query;
                if (!error && data) {
                    setTransactions(data);

                    if (data.length > 0) {
                        const txIds = data.map(t => t.id);
                        const { data: itemsData, error: itemsError } = await supabase
                            .from('kasir_transaction_items')
                            .select('*')
                            .in('transaction_id', txIds);

                        if (!itemsError && itemsData) {
                            setTransactionItems(itemsData);
                        } else {
                            setTransactionItems([]);
                        }
                    } else {
                        setTransactionItems([]);
                    }

                    try {
                        const { data: sNotes } = await supabase
                            .from('kasir_shifts')
                            .select('shift_notes, employee_name, ended_at')
                            .eq('user_id', user.id)
                            .neq('shift_notes', '')
                            .gte('ended_at', startDate.toISOString())
                            .lte('ended_at', endDate.toISOString());

                        let cbNotesQuery = supabase
                            .from('cashbook')
                            .select('description, date, type, category, amount')
                            .eq('user_id', user.id)
                            .eq('date', selectedDate);
                        if (activeOutlet?.id) cbNotesQuery = cbNotesQuery.eq('outlet_id', activeOutlet.id);
                        const { data: cbNotes } = await cbNotesQuery;

                        let kExpQuery = supabase
                            .from('kasir_expenses')
                            .select('note, category, amount, created_at')
                            .eq('user_id', user.id)
                            .gte('created_at', startDate.toISOString())
                            .lte('created_at', endDate.toISOString());
                        if (activeOutlet?.id) kExpQuery = kExpQuery.eq('outlet_id', activeOutlet.id);
                        const { data: kExp } = await kExpQuery;

                        const combined = [
                            ...(sNotes || []).map(s => ({
                                text: s.shift_notes,
                                source: `Shift: ${s.employee_name}`,
                                date: s.ended_at,
                                type: 'shift'
                            })),
                            ...(cbNotes || []).map(c => ({
                                text: c.description,
                                category: c.category || (c.type === 'income' ? t('dash_income') : t('dash_expense')),
                                date: c.date,
                                type: 'cashbook',
                                is_expense: c.type === 'expense',
                                is_income: c.type === 'income',
                                amount: c.amount || 0
                            })),
                            ...(kExp || []).map(e => ({
                                text: e.note,
                                category: e.category || 'Operasional',
                                date: e.created_at,
                                type: 'expense',
                                is_expense: true,
                                amount: e.amount || 0
                            }))
                        ].sort((a, b) => new Date(b.date) - new Date(a.date));

                        setPeriodNotes(combined);
                    } catch (e) {
                        console.error('Laporan: Notes fetch failed', e);
                    }
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
        setCurrentPage(1);
    }, [user, selectedDate, effectivePlan, isAdmin, activeOutlet?.id, t]);

    if (effectivePlan === 'free' && !isAdmin) {
        return <UpgradePrompt requiredPlan="pro" />;
    }

    const totalTransactions = transactions?.length || 0;
    const totalRevenue = (transactions || []).reduce((acc, tx) => acc + (tx.total || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalTax = (transactions || []).reduce((acc, tx) => acc + (tx.tax_amount || 0), 0);
    const totalPointsEarned = (transactions || []).reduce((acc, tx) => acc + (tx.points_earned || 0), 0);
    const totalPointsRedeemed = (transactions || []).reduce((acc, tx) => acc + (tx.points_redeemed || 0), 0);

    const allItems = (transactionItems || []).map(item => ({
        name: item.product_name,
        qty: item.quantity,
        price: item.price,
        transaction_id: item.transaction_id
    }));

    const totalItemsSold = allItems.reduce((acc, item) => acc + (item.qty || item.quantity || 1), 0);
    const localeCode = t('locale_code');

    const chartData = useMemo(() => {
        const aggs = (transactions || []).reduce((acc, tx) => {
            const dateObj = new Date(tx.created_at);
            const dateStr = dateObj.toLocaleDateString(localeCode, { day: '2-digit', month: 'short' });
            if (!acc[dateStr]) acc[dateStr] = 0;
            acc[dateStr] += tx.total || 0;
            return acc;
        }, {});
        return Object.entries(aggs).map((entry) => ({ date: entry[0], revenue: entry[1] })).reverse();
    }, [transactions, localeCode]);

    const top5Products = useMemo(() => {
        const productStats = allItems.reduce((acc, item) => {
            const key = item.name || 'Unknown';
            if (!acc[key]) acc[key] = { name: key, qty: 0, revenue: 0 };
            const q = item.qty || item.quantity || 1;
            acc[key].qty += q;
            acc[key].revenue += (item.price || 0) * q;
            return acc;
        }, {});
        return Object.values(productStats).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [allItems]);

    const paymentMethods = useMemo(() => {
        return (transactions || []).reduce((acc, tx) => {
            const method = tx.payment_method || tx.metode || 'Cash';
            if (!acc[method]) acc[method] = { count: 0, revenue: 0 };
            acc[method].count += 1;
            acc[method].revenue += tx.total || 0;
            return acc;
        }, {});
    }, [transactions]);

    const totalExpenses = useMemo(() => {
        return (periodNotes || [])
            .filter(n => n.is_expense)
            .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }, [periodNotes]);

    const peakHours = useMemo(() => {
        return Array(24).fill(0).map((_, hour) => ({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            count: (transactions || []).filter(tx =>
                new Date(tx.created_at).getHours() === hour
            ).length
        })).filter(d => d.hour >= '06:00' && d.hour <= '23:00');
    }, [transactions]);

    const totalPages = Math.ceil((transactions?.length || 0) / ITEMS_PER_PAGE);
    const paginatedTransactions = (transactions || []).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const openTxDetail = (tx) => {
        const items = transactionItems.filter(i => i.transaction_id === tx.id);
        setPanel({
            open: true,
            title: tx.invoice_number || tx.receipt_number || t('transaction_detail'),
            items,
            tx
        });
    };
    const closePanel = () => setPanel({ open: false, title: '', items: [] });

    const shareRekapHarian = () => {
        const dateStr = new Date().toLocaleDateString(t('locale_code'), { year: 'numeric', month: 'long', day: 'numeric' });
        const storeName = user?.user_metadata?.store_name || user?.email || 'My Store';
        const numLoc = t('locale_code');
        
        let reportText = `*${t('rekap_wa_title')} — ${dateStr}*\n${t('rekap_wa_store')}: ${storeName}\n\n`;
        reportText += `*${t('rekap_wa_income')}*\n${t('rekap_wa_tx_count')}: ${totalTransactions}\n`;
        reportText += `${t('rekap_wa_total_income')}: Rp ${totalRevenue.toLocaleString(numLoc)}\n`;
        reportText += `${t('rekap_wa_tax')}: Rp ${totalTax.toLocaleString(numLoc)}\n`;
        reportText += `${t('rekap_wa_pts_earned')}: ${totalPointsEarned.toLocaleString(numLoc)}\n`;
        reportText += `${t('rekap_wa_pts_redeemed')}: ${totalPointsRedeemed.toLocaleString(numLoc)}\n`;
        reportText += `${t('rekap_wa_avg')}: Rp ${avgTransaction.toLocaleString(numLoc, { maximumFractionDigits: 0 })}\n\n`;
        
        if (top5Products.length > 0) {
            reportText += `*${t('rekap_wa_top_products')}*\n`;
            top5Products.slice(0, 3).forEach((p, idx) => {
                reportText += `${idx + 1}. ${p.name} — ${p.qty} ${t('laporan_sold_qty')} — Rp ${p.revenue.toLocaleString(numLoc)}\n`;
            });
            reportText += `\n`;
        }
        
        if (Object.keys(paymentMethods).length > 0) {
            reportText += `*${t('rekap_wa_methods')}*\n`;
            Object.entries(paymentMethods).forEach(([method, data]) => {
                const pct = totalTransactions > 0 ? ((data.count / totalTransactions) * 100).toFixed(0) : 0;
                reportText += `${method}: Rp ${data.revenue.toLocaleString(numLoc)} (${pct}%)\n`;
            });
            reportText += `\n`;
        }

        reportText += `Generated by MyInvoice.space`;
        
        const waUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
        window.open(waUrl, '_blank');
    };

    const handleDeleteTransaction = (tx) => {
        if (isPro) {
            setTxToDelete(tx);
        } else {
            if (window.confirm(t('confirm_delete') || 'Hapus transaksi ini?')) {
                performDeleteTransaction(tx, 'N/A');
            }
        }
    };

    const performDeleteTransaction = async (tx, reason) => {
        setLoading(true);
        try {
            await supabase.from('kasir_transaction_items').delete().eq('transaction_id', tx.id);
            const { error } = await supabase.from('kasir_transactions').delete().eq('id', tx.id).eq('user_id', user.id);
            if (error) throw error;

            if (isPro) {
                const docNum = tx.invoice_number || tx.receipt_number;
                await recordAudit(
                    'DELETE', 
                    'Kasir', 
                    `Deleted Transaction ${docNum} (Amount: ${formatIDR(tx.total)})`, 
                    reason, 
                    tx.total > 5000000 ? 'critical' : 'warning'
                );
            }

            const docNum = tx.invoice_number || tx.receipt_number;
            await supabase.from('cashbook').delete().eq('user_id', user.id).ilike('description', `%${docNum}%`);
            
            setTransactions(prev => prev.filter(t => t.id !== tx.id));
            showToast(t('tx_deleted') || 'Transaksi dihapus', 'success');
            
            window.dispatchEvent(new Event('kasir-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('Delete TX error:', err);
            showToast(t('tx_delete_failed'), 'error');
        } finally {
            setLoading(false);
            setTxToDelete(null);
        }
    };

    const handleExportPDF = () => {
        const periodLabel = selectedDate;

        const printContent = `
            <html>
            <head>
              <title>${t('pdf_report_title')} - ${periodLabel}</title>
              <style>
                body { font-family: 'Arial', sans-serif; padding: 32px; color: #1e293b; }
                h1 { font-size: 22px; font-weight: 900; margin: 0 0 4px; color: #7C3AED; }
                .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; }
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
                .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
                .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
                .stat-value { font-size: 20px; font-weight: 900; color: #1e293b; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
                th { background: #F5F3FF; color: #7C3AED; font-weight: 800; padding: 8px 10px; text-align: left; border-bottom: 2px solid #7C3AED; }
                td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
                tr:nth-child(even) td { background: #f8fafc; }
                .section-title { font-size: 14px; font-weight: 800; margin: 20px 0 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
                @media print { body { padding: 16px; } }
              </style>
            </head>
            <body>
              <h1>${t('pdf_report_title')}</h1>
              <div class="subtitle">${t('pdf_period')}: ${periodLabel} &nbsp;|&nbsp; ${t('pdf_printed_at')}: ${new Date().toLocaleString(t('locale_code'))}</div>
              
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-label">${t('total_transactions')}</div>
                  <div class="stat-value">${totalTransactions}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">${t('total_revenue')}</div>
                  <div class="stat-value">${formatIDR(totalRevenue)}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">${t('avg_per_transaction')}</div>
                  <div class="stat-value">${formatIDR(Math.round(avgTransaction))}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">${t('total_tax')}</div>
                  <div class="stat-value">${formatIDR(totalTax)}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">${t('rekap_wa_pts_earned')}</div>
                  <div class="stat-value">${totalPointsEarned.toLocaleString(t('locale_code'))}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">${t('rekap_wa_pts_redeemed')}</div>
                  <div class="stat-value">${totalPointsRedeemed.toLocaleString(t('locale_code'))}</div>
                </div>
              </div>

              <div class="section-title">${t('top_products')}</div>
              <table>
                <thead><tr><th>${t('col_item')}</th><th>${t('laporan_sold_qty')}</th><th>${t('total_revenue')}</th></tr></thead>
                <tbody>
                  ${top5Products.map(p => `<tr><td>${p.name}</td><td>${p.qty}</td><td>${formatIDR(p.revenue || 0)}</td></tr>`).join('')}
                </tbody>
              </table>

              <div class="section-title">${t('transaction_detail')}</div>
              <table>
                <thead><tr><th>${t('col_time')}</th><th>${t('col_cashier')}</th><th>${t('col_items')}</th><th>${t('col_method')}</th><th>${t('col_total')}</th></tr></thead>
                <tbody>
                  ${transactions.slice(0, 100).map(tx => {
                    const itemsText = transactionItems.filter(item => item.transaction_id === tx.id).length > 0
                        ? transactionItems.filter(item => item.transaction_id === tx.id).map(x => `${x.product_name} (${x.quantity})`).join(', ')
                        : '-';
                    return `
                    <tr>
                      <td>${new Date(tx.created_at).toLocaleString(t('locale_code'), { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
                      <td>${tx.kasir_name || tx.employee_name || '-'}</td>
                      <td>${itemsText}</td>
                      <td>${tx.payment_method || tx.metode || 'Cash'}</td>
                      <td>${formatIDR(tx.total || 0)}</td>
                    </tr>
                  `}).join('')}
                </tbody>
              </table>

              <div class="footer">My Invoice — myinvoice.space &nbsp;|&nbsp; ${t('pdf_footer')}</div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in pb-[calc(1.5rem+env(safe-area-inset-bottom)+8rem)] sm:pb-12">
            {/* STICKY BOTTOM SUMMARY FOR MOBILE */}
            {!loading && transactions.length > 0 && (
                <div className="fixed md:hidden bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-50">
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-violet-50 p-3 rounded-xl border border-violet-100">
                            <span className="text-xs font-black text-violet-700 uppercase tracking-wider text-left">{t('total_revenue')}</span>
                            <span className="text-lg font-black text-violet-700">{formatIDR(totalRevenue)}</span>
                        </div>
                        
                        <div className="flex flex-row items-center overflow-x-auto whitespace-nowrap scrollbar-hide gap-3 pb-1">
                            {Object.entries(paymentMethods).map(([method, data]) => (
                                <div key={method} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold">
                                    <CreditCard size={12} className="text-slate-400" />
                                    <span className="text-slate-500">{method}:</span>
                                    <span className="text-slate-900">{formatIDR(data.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <BarChart2 className="text-violet-600" size={28} />
                        {t('sales_report_title', 'Laporan Penjualan Kasir')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('sales_report_desc', 'Pantau performa penjualan toko kamu')}</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={shareRekapHarian}
                        className="p-2 sm:px-4 sm:py-2 border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg flex items-center gap-2 font-bold text-sm transition-colors"
                    >
                        <MessageCircle size={18} />
                        <span className="hidden sm:inline">{t('share_rekap_wa', 'Kirim Rekap WA')}</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={transactions.length === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8,
                            background: transactions.length === 0 ? '#94A3B8' : '#7C3AED',
                            color: 'white', border: 'none', fontSize: 13, fontWeight: 700,
                            cursor: transactions.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Download size={14} />
                        {t('lap_pos_export_pdf')}
                    </button>
                </div>
            </div>

            {/* Period Filter - Custom Date Picker */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('laporan_pilih_tanggal') || 'Pilih Tanggal Laporan'}</p>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="mt-1 block w-full px-4 py-2 border-2 border-slate-100 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 shadow-inner focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* TAB SWITCHER - ABSOLUTE FORCED VISIBILITY */}
            <div className="relative z-[99999] flex bg-white p-1.5 rounded-2xl w-full max-w-md mx-auto mb-10 shadow-2xl shadow-slate-300/50 border-2 border-slate-100">
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all duration-300 ${activeTab === 'sales' ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 scale-[1.02]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                    <BarChart2 size={20} />
                    {t('tab_sales') || 'Penjualan'}
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all duration-300 ${activeTab === 'expenses' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 scale-[1.02]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                    <Wallet size={20} />
                    {t('tab_expenses') || 'Pengeluaran Kasir'}
                </button>
            </div>

            {/* Obsolete custom filter block */}

            {loading ? (
                <div className="text-center py-12 text-slate-500">{t('loading', 'Memuat...')}</div>
            ) : (
                <>
                    {activeTab === 'sales' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_revenue', 'Total Omzet')}</p>
                                            <h3 title={formatIDR(totalRevenue)} className="text-xl font-black mt-2 text-slate-900 truncate">{formatCompactCurrency(totalRevenue)}</h3>
                                        </div>
                                        <div className="p-2.5 bg-violet-100 rounded-xl text-violet-600 flex-shrink-0 ml-2">
                                            <DollarSign size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-rose-50 p-5 rounded-2xl border-2 border-rose-200 min-w-0 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-1 bg-rose-200 text-rose-700 text-[8px] font-black uppercase rounded-bl-lg">Out</div>
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t('total_expenses_kasir', 'Total Pengeluaran')}</p>
                                            <h3 title={formatIDR(totalExpenses)} className="text-xl font-black mt-2 text-rose-600 truncate">{formatCompactCurrency(totalExpenses)}</h3>
                                        </div>
                                        <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 flex-shrink-0 ml-2">
                                            <Wallet size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_transactions', 'Total Transaksi')}</p>
                                            <h3 className="text-xl font-black mt-2 text-slate-900 truncate">{totalTransactions}</h3>
                                        </div>
                                        <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 flex-shrink-0 ml-2">
                                            <ListOrdered size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('avg_per_transaction', 'Rata-rata/Transaksi')}</p>
                                            <h3 title={formatIDR(avgTransaction)} className="text-xl font-black mt-2 text-slate-900 truncate">{formatCompactCurrency(avgTransaction)}</h3>
                                        </div>
                                        <div className="p-2.5 bg-green-100 rounded-xl text-green-600 flex-shrink-0 ml-2">
                                            <Wallet size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_items_sold', 'Produk Terjual')}</p>
                                            <h3 className="text-xl font-black mt-2 text-slate-900">{totalItemsSold}</h3>
                                        </div>
                                        <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600">
                                            <ShoppingBag size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-500">{t('rekap_wa_tax')}</p>
                                            <h3 className="text-xl font-bold mt-2 text-slate-900 truncate">{formatIDR(totalTax)}</h3>
                                        </div>
                                        <div className="p-3 bg-orange-100 rounded-xl text-orange-600 flex-shrink-0 ml-2">
                                            <Tag size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-500">{t('rekap_wa_pts_earned')}</p>
                                            <h3 className="text-xl font-bold mt-2 text-slate-900 truncate">{totalPointsEarned.toLocaleString(t('locale_code'))}</h3>
                                        </div>
                                        <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 flex-shrink-0 ml-2">
                                            <Star size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-500">{t('rekap_wa_pts_redeemed')}</p>
                                            <h3 className="text-xl font-bold mt-2 text-slate-900 truncate">{totalPointsRedeemed.toLocaleString(t('locale_code'))}</h3>
                                        </div>
                                        <div className="p-3 bg-rose-100 rounded-xl text-rose-600 flex-shrink-0 ml-2">
                                            <Gift size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                    <h3 className="text-base font-bold mb-6 text-slate-800">{t('daily_revenue_chart', 'Grafik Omzet Harian')}</h3>
                                    {chartData.length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-10">{t('no_transaction_data')}</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(v) => `Rp ${(v / 1000).toFixed(0)}k`} width={60} />
                                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(v) => formatIDR(v)} />
                                                <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                    <h3 className="text-base font-bold mb-6 text-slate-800 flex items-center gap-2">
                                        <Star size={18} className="text-amber-500" />
                                        {t('top_products', 'Produk Terlaris')}
                                    </h3>
                                    {top5Products.length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-10">{t('no_transaction_data')}</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {top5Products.map((p, idx) => (
                                                <div key={idx} className="flex justify-between items-center group hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">{idx + 1}</div>
                                                        <span className="font-semibold text-slate-700">{p.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-slate-900">{formatIDR(p.revenue)}</div>
                                                        <div className="text-xs text-slate-500">{p.qty} {t('laporan_sold_qty')}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                                <Wallet className="text-rose-600" size={24} />
                                {t('tab_expenses') || 'Riwayat Pengeluaran Kasir'}
                            </h3>
                            
                            {(periodNotes || []).filter(n => n.is_expense).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {periodNotes.filter(n => n.is_expense).map((note, i) => {
                                        const displayTitle = note.category || (note.type === 'shift' ? note.source : t('dash_expense'));
                                        const displayNote = (note.text && note.text !== note.category && note.text !== '-') ? note.text : '';

                                        return (
                                            <div key={i} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-all border-l-4 border-l-rose-500 flex flex-col justify-between min-h-[140px]">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{displayTitle}</p>
                                                        {displayNote && <p className="text-xs font-bold text-slate-500 leading-relaxed italic mt-1 line-clamp-2">{displayNote}</p>}
                                                    </div>
                                                    {note.amount > 0 && <p className="text-base font-black text-rose-600 ml-2 flex-shrink-0">-{formatIDR(note.amount)}</p>}
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-rose-50 mt-auto">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(note.date).toLocaleDateString(t('locale_code'), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-tighter">{note.type === 'shift' ? 'Shift Note' : 'Expense'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wallet size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold italic">Belum ada pengeluaran kasir pada periode ini.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'sales' && (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mt-8">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-base font-bold text-slate-800">{t('transaction_detail', 'Detail Transaksi')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-4 font-black" style={{ width: 140 }}>{t('col_time')}</th>
                                            <th className="p-4 font-black" style={{ width: 120 }}>{t('col_invoice_no')}</th>
                                            <th className="p-4 font-black text-center" style={{ width: 100 }}>{t('col_status')}</th>
                                            <th className="p-4 font-black" style={{ width: 120 }}>{t('col_cashier')}</th>
                                            <th className="p-4 font-black" style={{ width: 'auto' }}>{t('col_items')}</th>
                                            <th className="p-4 font-black text-center" style={{ width: 100 }}>{t('col_method')}</th>
                                            <th className="p-4 font-black text-right" style={{ width: 110 }}>{t('col_total')}</th>
                                            <th className="p-4 font-black text-center" style={{ width: 60 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {paginatedTransactions.length === 0 ? (
                                            <tr><td colSpan="8" className="p-8 text-center text-slate-500">{t('no_transaction_data')}</td></tr>
                                        ) : (
                                            paginatedTransactions.map((tx) => (
                                                <tr key={tx.id} onClick={() => openTxDetail(tx)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                                    <td className="p-4 text-slate-600">{new Date(tx.created_at).toLocaleString(t('locale_code'), { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                    <td className="p-4 font-bold text-slate-800 truncate">{tx.invoice_number || tx.receipt_number || tx.id?.slice(0, 8) || '-'}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-tighter">{t('status_success', 'Sukses')}</span>
                                                    </td>
                                                    <td className="p-4 text-slate-700 truncate">{tx.kasir_name || tx.employee_name || '-'}</td>
                                                    <td className="p-4 text-slate-600 truncate">
                                                        {transactionItems.filter(item => item.transaction_id === tx.id).map(x => `${x.product_name} (${x.quantity})`).join(', ') || '-'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="px-2 py-1 text-xs font-black rounded bg-slate-100 text-slate-700 border border-slate-200">{tx.payment_method || 'Cash'}</span>
                                                    </td>
                                                    <td className="p-4 text-right font-medium text-slate-900">{formatIDR(tx.total || 0)}</td>
                                                    <td className="p-4 text-center">
                                                        <button onClick={() => handleDeleteTransaction(tx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm gap-4">
                                    <span className="text-slate-500">{t('laporan_page_of').replace('{current}', currentPage).replace('{total}', totalPages)}</span>
                                    <div className="flex gap-2">
                                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 rounded bg-slate-100 disabled:opacity-50">{t('laporan_prev')}</button>
                                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 rounded bg-slate-100 disabled:opacity-50">{t('laporan_next')}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <DeleteReasonModal 
                isOpen={!!txToDelete}
                onClose={() => setTxToDelete(null)}
                onConfirm={(reason) => performDeleteTransaction(txToDelete, reason)}
                itemName={txToDelete ? `${t('nav_kasir_pos')} ${txToDelete.invoice_number || txToDelete.receipt_number}` : ''}
                loading={loading}
            />

            {panel.open && ReactDOM.createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div onClick={closePanel} style={{ position: 'absolute', inset: 0 }} />
                    <div style={{ position: 'relative', background: 'white', borderRadius: '16px', width: '100%', maxWidth: '860px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards' }}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{panel.title}</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{panel.tx?.kasir_name || '-'}</p>
                            </div>
                            <button onClick={closePanel} style={{ width: 36, height: 36, borderRadius: '10px', background: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#F8FAFC' }}>
                            {panel.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{item.product_name}</p>
                                        <p className="text-[11px] text-slate-500 font-bold italic">{item.quantity} x {formatIDR(item.price)}</p>
                                    </div>
                                    <p className="text-base font-black text-violet-700">{formatIDR(item.quantity * item.price)}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '20px 24px', borderTop: '1px solid #E2E8F0', background: 'white' }}>
                            <div className="flex justify-between items-center bg-violet-50 p-4 rounded-xl border border-violet-100">
                                <div>
                                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">{t('col_total')}</p>
                                    <p className="text-xl font-black text-violet-700">{formatIDR(panel.tx?.total || 0)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('col_method')}</p>
                                    <p className="text-sm font-black text-slate-700">{panel.tx?.payment_method || 'Tunai'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes scaleIn {
                    0% { transform: scale(0.9) translateY(20px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
