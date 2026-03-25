import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { useOutlet } from "../context/OutletContext";
import UpgradePrompt from "../components/UpgradePrompt";
import { CreditCard, DollarSign, ListOrdered, ShoppingBag, Wallet, BarChart2, MessageCircle, Download, Tag, Star, Gift } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCompactCurrency, formatIDR } from "../utils/currency";

export default function LaporanKasir() {
    const { t, lang } = useLang();
    const { effectivePlan, isAdmin, user, canAccessAdvancedKasir } = useAuth();
    const { activeOutlet } = useOutlet() || {};

    const [transactions, setTransactions] = useState([]);
    const [transactionItems, setTransactionItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState('today'); // 'today' | 'week' | 'month' | 'custom'
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const getDateRange = () => {
        const now = new Date();
        const toISODate = (d) => d.toISOString().split('T')[0];

        if (periodFilter === 'today') {
            const today = toISODate(now);
            return { start: today, end: today };
        }
        if (periodFilter === 'week') {
            const day = now.getDay();
            const diffToMonday = (day === 0 ? -6 : 1 - day);
            const monday = new Date(now);
            monday.setDate(now.getDate() + diffToMonday);
            return { start: toISODate(monday), end: toISODate(now) };
        }
        if (periodFilter === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: toISODate(start), end: toISODate(now) };
        }
        if (periodFilter === 'custom' && customStart && customEnd) {
            return { start: customStart, end: customEnd };
        }
        return { start: toISODate(now), end: toISODate(now) };
    };

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
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
                const range = getDateRange();
                // FIX-04: Timezone fix — pakai local Date object, bukan hardcode T00:00:00 tanpa offset
                const startDate = new Date(range.start);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(range.end);
                endDate.setHours(23, 59, 59, 999);

                let query = supabase
                    .from("kasir_transactions")
                    .select("*")
                    .eq("user_id", user.id)
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString())
                    .order('created_at', { ascending: false });

                // Multi-outlet isolation
                if (activeOutlet?.id) query = query.eq('outlet_id', activeOutlet.id);

                const { data, error } = await query;
                if (!error && data) {
                    setTransactions(data);

                    if (data.length > 0) {
                        const txIds = data.map(t => t.id);
                        // FIX-06: txIds sudah aman (berasal dari query .eq('user_id', user.id) di atas)
                        // Tidak perlu filter user_id tambahan karena kasir_transaction_items tidak punya kolom user_id
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
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
        setCurrentPage(1); // reset pagination
    }, [user, periodFilter, customStart, customEnd, effectivePlan, isAdmin, activeOutlet?.id]);

    if (effectivePlan === 'free' && !isAdmin) {
        return <UpgradePrompt requiredPlan="pro" />;
    }

    // metrics
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((acc, tx) => acc + (tx.total || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // NEW METRICS v5
    const totalTax = transactions.reduce((acc, tx) => acc + (tx.tax_amount || 0), 0);
    const totalPointsEarned = transactions.reduce((acc, tx) => acc + (tx.points_earned || 0), 0);
    const totalPointsRedeemed = transactions.reduce((acc, tx) => acc + (tx.points_redeemed || 0), 0);
    const totalDiscountAmount = transactions.reduce((acc, tx) => acc + (tx.discount_amount || 0), 0);

    const allItems = transactionItems.map(item => ({
        name: item.product_name,
        qty: item.quantity,
        price: item.price,
        transaction_id: item.transaction_id
    }));

    const totalItemsSold = allItems.reduce((acc, item) => acc + (item.qty || item.quantity || 1), 0);

    // chart revenue
    const chartData = useMemo(() => {
        const aggs = transactions.reduce((acc, tx) => {
            const dateStr = new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            if (!acc[dateStr]) acc[dateStr] = 0;
            acc[dateStr] += tx.total || 0;
            return acc;
        }, {});
        return Object.entries(aggs).map(([date, revenue]) => ({ date, revenue })).reverse();
    }, [transactions]);

    // top 5
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

    // payment methods
    const paymentMethods = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            const method = tx.payment_method || tx.metode || 'Cash';
            if (!acc[method]) acc[method] = { count: 0, revenue: 0 };
            acc[method].count += 1;
            acc[method].revenue += tx.total || 0;
            return acc;
        }, {});
    }, [transactions]);

    // peak hours
    const peakHours = useMemo(() => {
        return Array(24).fill(0).map((_, hour) => ({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            count: transactions.filter(tx =>
                new Date(tx.created_at).getHours() === hour
            ).length
        })).filter(d => d.hour >= '06:00' && d.hour <= '23:00');
    }, [transactions]);

    // pagination
    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = transactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const shareRekapHarian = () => {
        const dateStr = new Date().toLocaleDateString(lang === 'ID' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const storeName = user?.user_metadata?.store_name || user?.email || 'My Store';
        const numLoc = lang === 'ID' ? 'id-ID' : 'en-US';
        
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

    const handleExportPDF = () => {
        const periodLabel = {
            today: t('period_today'),
            week: t('period_week'),
            month: t('period_month'),
            custom: t('period_custom')
        }[periodFilter] || periodFilter;

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
              <div class="subtitle">${t('pdf_period')}: ${periodLabel} &nbsp;|&nbsp; ${t('pdf_printed_at')}: ${new Date().toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US')}</div>
              
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
                  <div class="stat-label">${lang === 'ID' ? 'Total Pajak' : 'Total Tax'}</div>
                  <div class="stat-value">${formatIDR(totalTax)}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">${t('rekap_wa_pts_earned')}</div>
                  <div class="stat-value">${totalPointsEarned.toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US')}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">${t('rekap_wa_pts_redeemed')}</div>
                  <div class="stat-value">${totalPointsRedeemed.toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US')}</div>
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
                      <td>${new Date(tx.created_at).toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</td>
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

            {/* Period Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { key: 'today',  label: t('period_today') },
                    { key: 'week',   label: t('period_week') },
                    { key: 'month',  label: t('period_month') },
                    { key: 'custom', label: t('period_custom') },
                ].map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setPeriodFilter(opt.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            periodFilter === opt.key
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-violet-400'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Custom date range (hanya muncul jika filter = custom) */}
            {periodFilter === 'custom' && (
                <div className="flex flex-wrap gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            {t('lap_pos_from_date')}
                        </label>
                        <input
                            type="date"
                            value={customStart}
                            onChange={e => setCustomStart(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            {t('lap_pos_to_date')}
                        </label>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-slate-500">{t('loading', 'Memuat...')}</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-500">{t('total_revenue', 'Total Omzet')}</p>
                                    <h3 
                                        title={formatIDR(totalRevenue)}
                                        className="text-2xl font-bold mt-2 text-slate-900 truncate"
                                    >
                                        {formatCompactCurrency(totalRevenue)}
                                    </h3>
                                </div>
                                <div className="p-3 bg-violet-100 rounded-xl text-violet-600 flex-shrink-0 ml-2">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-500">{t('total_transactions', 'Total Transaksi')}</p>
                                    <h3 className="text-2xl font-bold mt-2 text-slate-900 truncate">
                                        {totalTransactions}
                                    </h3>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-xl text-blue-600 flex-shrink-0 ml-2">
                                    <ListOrdered size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-500">{t('avg_per_transaction', 'Rata-rata/Transaksi')}</p>
                                    <h3 
                                        title={formatIDR(avgTransaction)}
                                        className="text-xl font-bold mt-2 text-slate-900 truncate"
                                    >
                                        {formatCompactCurrency(avgTransaction)}
                                    </h3>
                                </div>
                                <div className="p-3 bg-green-100 rounded-xl text-green-600 flex-shrink-0 ml-2">
                                    <Wallet size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{t('total_items_sold', 'Produk Terjual')}</p>
                                    <h3 className="text-2xl font-bold mt-2 text-slate-900">
                                        {totalItemsSold}
                                    </h3>
                                </div>
                                <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                                    <ShoppingBag size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Secondary Summary Cards v5 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 min-w-0">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-500">{t('rekap_wa_tax')}</p>
                                    <h3 className="text-xl font-bold mt-2 text-slate-900 truncate">
                                        {formatIDR(totalTax)}
                                    </h3>
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
                                    <h3 className="text-xl font-bold mt-2 text-slate-900 truncate">
                                        {totalPointsEarned.toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US')}
                                    </h3>
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
                                    <h3 className="text-xl font-bold mt-2 text-slate-900 truncate">
                                        {totalPointsRedeemed.toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US')}
                                    </h3>
                                </div>
                                <div className="p-3 bg-rose-100 rounded-xl text-rose-600 flex-shrink-0 ml-2">
                                    <Gift size={20} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h3 className="text-base font-bold mb-6 text-slate-800">{t('daily_revenue_chart', 'Grafik Omzet Harian')}</h3>
                            {chartData.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-10">{t('no_transaction_data', 'Belum ada transaksi di periode ini')}</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.3} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                        <YAxis
                                            axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }}
                                            tickFormatter={(v) => `Rp ${(v / 1000).toFixed(0)}k`}
                                            width={60}
                                        />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(v) => `Rp ${v.toLocaleString('id-ID')}`} />
                                        <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Top Products */}
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
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-semibold text-slate-700">{p.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-slate-900">Rp {p.revenue.toLocaleString('id-ID')}</div>
                                                <div className="text-xs text-slate-500">{p.qty} {t('laporan_sold_qty')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Peak Hours Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h3 className="text-base font-bold mb-6 text-slate-800">{t('lap_pos_chart_peak')}</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.3} />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} interval="preserveStartEnd" minTickGap={20} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(v) => `${v} tx`} labelFormatter={(l) => `Jam ${l}`} />
                                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200">
                            <h3 className="text-base font-bold mb-6 text-slate-800">{t('payment_methods', 'Metode Pembayaran')}</h3>
                            {Object.entries(paymentMethods).length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-10">{t('no_transaction_data')}</p>
                            ) : (
                                <div className="space-y-5">
                                    {Object.entries(paymentMethods).sort((a, b) => b[1].count - a[1].count).map(([method, data]) => {
                                        const pct = totalTransactions > 0 ? (data.count / totalTransactions) * 100 : 0;
                                        return (
                                            <div key={method}>
                                                <div className="flex justify-between text-sm mb-1.5 font-medium">
                                                    <span className="text-slate-700 flex items-center gap-2">
                                                        <CreditCard size={14} className="text-slate-400" /> {method}
                                                    </span>
                                                    <span className="text-slate-900">{data.count} tx ({pct.toFixed(1)}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                </div>
                                                <div className="text-right text-xs text-slate-500 mt-1">Rp {data.revenue.toLocaleString('id-ID')}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-800">{t('transaction_detail', 'Detail Transaksi')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                                        <th className="p-4 font-black" style={{ width: 140 }}>{t('col_time')}</th>
                                        <th className="p-4 font-black" style={{ width: 120 }}>{t('col_invoice_no')}</th>
                                        <th className="p-4 font-black" style={{ width: 120 }}>{t('col_cashier')}</th>
                                        <th className="p-4 font-black" style={{ width: 'auto' }}>{t('col_items')}</th>
                                        <th className="p-4 font-black text-center" style={{ width: 100 }}>{t('col_method')}</th>
                                        <th className="p-4 font-black text-right" style={{ width: 110 }}>{t('col_total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {paginatedTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-500">{t('no_transaction_data')}</td>
                                        </tr>
                                    ) : (
                                        paginatedTransactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 text-slate-600">
                                                    {new Date(tx.created_at).toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="p-4 font-bold text-slate-800 truncate">{tx.invoice_number || tx.receipt_number || tx.id?.slice(0, 8) || '-'}</td>
                                                <td className="p-4 text-slate-700 truncate">{tx.kasir_name || tx.employee_name || tx.cashier_name || '-'}</td>
                                                <td className="p-4 text-slate-600" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                    {transactionItems.filter(item => item.transaction_id === tx.id).length > 0
                                                        ? transactionItems.filter(item => item.transaction_id === tx.id).map(x => `${x.product_name} (${x.quantity})`).join(', ')
                                                        : '-'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-1 text-xs font-black rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                        {tx.payment_method || tx.metode || 'Cash'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-medium text-slate-900">
                                                    {formatIDR(tx.total || 0)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm gap-4">
                                <span className="text-slate-500 whitespace-nowrap">
                                    {t('laporan_page_of').replace('{current}', currentPage).replace('{total}', totalPages)}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 disabled:opacity-50"
                                    >
                                        {t('laporan_prev')}
                                    </button>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 disabled:opacity-50"
                                    >
                                        {t('laporan_next')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
