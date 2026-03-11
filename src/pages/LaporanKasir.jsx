import { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import UpgradePrompt from "../components/UpgradePrompt";
import { CreditCard, DollarSign, ListOrdered, ShoppingBag, Wallet, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function LaporanKasir() {
    const { t } = useLang();
    const { effectivePlan, isAdmin, user } = useAuth();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("today"); // today, week, month, all

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
                let query = supabase
                    .from("kasir_transactions")
                    .select("*")
                    .eq("user_id", user.id)
                    .order('created_at', { ascending: false });

                // add period filters based on standard local start/end times
                const now = new Date();

                // Ambil tanggal hari ini dalam format YYYY-MM-DD (menyesuaikan timezone lokal)
                const todayStr = now.toLocaleDateString('en-CA');

                if (period === "today") {
                    query = query.gte("created_at", `${todayStr}T00:00:00`);
                } else if (period === "week") {
                    const start = new Date(now);
                    start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)); // start of week
                    const weekStr = start.toLocaleDateString('en-CA');
                    query = query.gte("created_at", `${weekStr}T00:00:00`);
                } else if (period === "month") {
                    // start of month in local timezone: YYYY-MM-01
                    const monthStr = `${todayStr.slice(0, 7)}-01`;
                    query = query.gte("created_at", `${monthStr}T00:00:00`);
                }

                const { data, error } = await query;
                if (!error && data) {
                    setTransactions(data);
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
        setCurrentPage(1); // reset pagination
    }, [user, period, effectivePlan, isAdmin]);

    if (effectivePlan === 'free' && !isAdmin) {
        return <UpgradePrompt requiredPlan="pro" />;
    }

    // metrics
    const totalTransactions = transactions.length;
    const totalRevenue = transactions.reduce((acc, tx) => acc + (tx.total || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const allItems = transactions.flatMap(tx => {
        try {
            return typeof tx.items === 'string' ? JSON.parse(tx.items) : (tx.items || []);
        } catch {
            return [];
        }
    });

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

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BarChart2 className="text-violet-600" size={28} />
                        {t('sales_report_title', 'Laporan Penjualan Kasir')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('sales_report_desc', 'Pantau performa penjualan toko kamu')}</p>
                </div>

                {/* Filters */}
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 font-medium text-sm text-slate-700 dark:text-slate-300"
                >
                    <option value="today">{t('period_today', 'Hari Ini')}</option>
                    <option value="week">{t('period_week', 'Minggu Ini')}</option>
                    <option value="month">{t('period_month', 'Bulan Ini')}</option>
                    <option value="all">{t('period_custom', 'Kustom')}</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">{t('loading', 'Memuat...')}</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('total_revenue', 'Total Omzet')}</p>
                                    <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
                                        Rp {totalRevenue.toLocaleString('id-ID')}
                                    </h3>
                                </div>
                                <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-xl text-violet-600 dark:text-violet-400">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('total_transactions', 'Total Transaksi')}</p>
                                    <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
                                        {totalTransactions}
                                    </h3>
                                </div>
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                                    <ListOrdered size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('avg_per_transaction', 'Rata-rata/Transaksi')}</p>
                                    <h3 className="text-xl font-bold mt-2 text-slate-900 dark:text-white">
                                        Rp {avgTransaction.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                    </h3>
                                </div>
                                <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl text-green-600 dark:text-green-400">
                                    <Wallet size={20} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('total_items_sold', 'Produk Terjual')}</p>
                                    <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
                                        {totalItemsSold}
                                    </h3>
                                </div>
                                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
                                    <ShoppingBag size={20} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Chart */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-base font-bold mb-6 text-slate-800 dark:text-white">{t('daily_revenue_chart', 'Grafik Omzet Harian')}</h3>
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
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-base font-bold mb-6 text-slate-800 dark:text-white">{t('top_products', 'Produk Terlaris')}</h3>
                            {top5Products.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-10">{t('no_transaction_data')}</p>
                            ) : (
                                <div className="space-y-4">
                                    {top5Products.map((p, idx) => (
                                        <div key={idx} className="flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 -mx-2 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-300">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-slate-900 dark:text-white">Rp {p.revenue.toLocaleString('id-ID')}</div>
                                                <div className="text-xs text-slate-500">{p.qty} terjual</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Peak Hours Chart */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-base font-bold mb-6 text-slate-800 dark:text-white">{t('peak_hours', 'Jam Tersibuk')}</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.3} />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} interval="preserveStartEnd" minTickGap={20} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(v) => `${v} transaksi`} labelFormatter={(l) => `Jam ${l}`} />
                                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-base font-bold mb-6 text-slate-800 dark:text-white">{t('payment_methods', 'Metode Pembayaran')}</h3>
                            {Object.entries(paymentMethods).length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-10">{t('no_transaction_data')}</p>
                            ) : (
                                <div className="space-y-5">
                                    {Object.entries(paymentMethods).sort((a, b) => b[1].count - a[1].count).map(([method, data]) => {
                                        const pct = totalTransactions > 0 ? (data.count / totalTransactions) * 100 : 0;
                                        return (
                                            <div key={method}>
                                                <div className="flex justify-between text-sm mb-1.5 font-medium">
                                                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                        <CreditCard size={14} className="text-slate-400" /> {method}
                                                    </span>
                                                    <span className="text-slate-900 dark:text-white">{data.count} tx ({pct.toFixed(1)}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
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
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">{t('transaction_detail', 'Detail Transaksi')}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-semibold">Waktu</th>
                                        <th className="p-4 font-semibold">No. Invoice</th>
                                        <th className="p-4 font-semibold">Kasir</th>
                                        <th className="p-4 font-semibold max-w-xs">Items</th>
                                        <th className="p-4 font-semibold text-center">Metode</th>
                                        <th className="p-4 font-semibold text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
                                    {paginatedTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-500">{t('no_transaction_data')}</td>
                                        </tr>
                                    ) : (
                                        paginatedTransactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 text-slate-600 dark:text-slate-300">
                                                    {new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="p-4 font-medium text-slate-900 dark:text-slate-200">{tx.invoice_number || '-'}</td>
                                                <td className="p-4 text-slate-600 dark:text-slate-300">{tx.cashier_name || '-'}</td>
                                                <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={(() => {
                                                    try {
                                                        const it = typeof tx.items === 'string' ? JSON.parse(tx.items) : (tx.items || []);
                                                        return it.length > 0 ? it.map(x => `${x.name} (${x.qty || x.quantity || 1})`).join(', ') : '-';
                                                    } catch {
                                                        return '-';
                                                    }
                                                })()}>
                                                    {(() => {
                                                        try {
                                                            const it = typeof tx.items === 'string' ? JSON.parse(tx.items) : (tx.items || []);
                                                            return it.length > 0 ? it.map(x => `${x.name} (${x.qty || x.quantity || 1})`).join(', ') : '-';
                                                        } catch {
                                                            return '-';
                                                        }
                                                    })()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                        {tx.payment_method || tx.metode || 'Cash'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-medium text-slate-900 dark:text-white">
                                                    Rp {(tx.total || 0).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm gap-4">
                                <span className="text-slate-500 whitespace-nowrap">Halaman {currentPage} dari {totalPages}</span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                                    >
                                        Next
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
