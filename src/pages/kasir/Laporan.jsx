import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, DollarSign, Tag, ArrowLeft, Wallet, CreditCard, QrCode, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useLang } from '../../context/LanguageContext';

export default function KasirLaporan() {
    const { user, canAccessAdvancedKasir, isAdmin, effectivePlan } = useAuth();
    const navigate = useNavigate();
    const { t, lang } = useLang();

    const [filter, setFilter] = useState('today'); // today, week, month
    const [transactions, setTransactions] = useState([]);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const isPlanPro = ['pro', 'ultimate'].includes(effectivePlan) || isAdmin;

    if (!isPlanPro) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
                <span className="text-6xl mb-4">📈</span>
                <h2 className="text-xl font-bold mb-2 dark:text-white">Laporan Kasir — Fitur PRO</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Upgrade ke PRO untuk melihat laporan transaksi, omzet, dan analitik kasir lengkap.</p>
                <button onClick={() => navigate('/upgrade')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    ⭐ Upgrade ke PRO — Rp 129.000/bln
                </button>
            </div>
        );
    }

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, filter]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const now = new Date();
            let startDateStr = '';

            if (filter === 'today') {
                const start = new Date(now.setHours(0, 0, 0, 0));
                startDateStr = start.toISOString();
            } else if (filter === 'week') {
                const start = new Date(now);
                start.setDate(now.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                startDateStr = start.toISOString();
            } else if (filter === 'month') {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                startDateStr = start.toISOString();
            }

            // 1. Load subset of transactions
            const { data: txs, error: txErr } = await supabase
                .from('kasir_transactions')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDateStr)
                .order('created_at', { ascending: true });

            if (txErr) throw txErr;
            setTransactions(txs || []);

            if (txs && txs.length > 0) {
                // 2. Load tx items for those transactions
                const txIds = txs.map(t => t.id);
                const { data: txItems, error: itemsErr } = await supabase
                    .from('kasir_transaction_items')
                    .select('*')
                    .in('transaction_id', txIds);

                if (itemsErr) throw itemsErr;
                setItems(txItems || []);
            } else {
                setItems([]);
            }
        } catch (err) {
            console.error('Error loading reports:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const metrics = useMemo(() => {
        let sales = 0;
        let discount = 0;
        let methods = { cash: 0, transfer: 0, qris: 0 };
        let methodCount = { cash: 0, transfer: 0, qris: 0 };
        let products = {};
        let chartDataMap = {}; // for sales over time

        transactions.forEach(t => {
            sales += t.total;
            discount += t.discount_amount;
            if (methods[t.payment_method] !== undefined) {
                methods[t.payment_method] += t.total;
                methodCount[t.payment_method] += 1;
            }

            // Chart grouping
            let timeKey = '';
            const d = new Date(t.created_at);
            if (filter === 'today') {
                timeKey = `${d.getHours()}:00`;
            } else {
                timeKey = d.toLocaleDateString(lang === 'EN' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short' });
            }

            if (!chartDataMap[timeKey]) chartDataMap[timeKey] = 0;
            chartDataMap[timeKey] += t.total;
        });

        // Sort chart data
        const chartData = Object.keys(chartDataMap).map(k => ({ name: k, total: chartDataMap[k] }));
        if (filter === 'today') {
            // sort by hour numerically if today
            chartData.sort((a, b) => parseInt(a.name) - parseInt(b.name));
        }

        items.forEach(item => {
            if (!products[item.product_id]) {
                products[item.product_id] = { name: item.product_name, emoji: item.product_emoji, qty: 0, revenue: 0 };
            }
            products[item.product_id].qty += item.quantity;
            products[item.product_id].revenue += item.subtotal;
        });

        const topProducts = Object.values(products)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        return {
            sales,
            discount,
            methods,
            methodCount,
            topProducts,
            count: transactions.length,
            chartData
        };
    }, [transactions, items, filter]);

    // === PLAN GUARD === PRO/ULTIMATE only
    if (!canAccessAdvancedKasir() && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Laporan Kasir — Fitur PRO</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    Pantau grafik penjualan, produk terlaris, dan metode pembayaran.<br />
                    Upgrade ke <strong>PRO</strong> untuk akses laporan kasir lengkap.
                </p>
                <button
                    onClick={() => window.location.href = import.meta.env.VITE_MAYAR_PRO_PAYMENT_URL}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    🚀 Upgrade ke PRO — Rp 129.000/bln
                </button>
                <button onClick={() => navigate('/kasir')} className="mt-3 text-slate-400 hover:text-violet-600 text-sm font-bold transition-colors">
                    ← {t('kasir_back')}
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col animate-fade-in-up overflow-y-auto custom-scrollbar">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
                <div>
                    <button
                        onClick={() => navigate('/kasir')}
                        className="text-slate-500 hover:text-violet-600 mb-2 flex items-center gap-1 text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> {t('kasir_back')}
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" size={28} />
                        {t('kasir_report_title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('kasir_report_desc')}</p>
                </div>

                <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-xl shadow-inner">
                    {[
                        { id: 'today', label: t('kasir_filter_today') },
                        { id: 'week', label: t('kasir_filter_week') },
                        { id: 'month', label: t('kasir_filter_month') }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f.id
                                ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20 flex-1">
                    <div className="animate-spin w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent"></div>
                </div>
            ) : (
                <div className="space-y-6 pb-12">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 text-emerald-100 dark:text-emerald-900/40">
                                <DollarSign size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 rounded-lg"><DollarSign size={16} /></div> {t('kasir_revenue')}
                                </div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                                    Rp {metrics.sales.toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 text-blue-100 dark:text-blue-900/40">
                                <Calendar size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-blue-50 text-blue-500 dark:bg-blue-900/30 rounded-lg"><Calendar size={16} /></div> {t('kasir_transactions')}
                                </div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                                    {metrics.count} <span className="text-xl font-bold text-slate-400">Trx</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 text-orange-100 dark:text-orange-900/40">
                                <Tag size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-orange-50 text-orange-500 dark:bg-orange-900/30 rounded-lg"><Tag size={16} /></div> {t('kasir_discount')}
                                </div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                                    Rp {metrics.discount.toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Chart */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                            <h3 className="text-md font-bold text-slate-800 dark:text-white mb-6">{t('kasir_chart')}</h3>
                            {metrics.chartData.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">{t('kasir_no_sales')}</div>
                            ) : (
                                <div className="flex-1 min-h-[250px] -ml-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tickFormatter={val => `Rp${val / 1000}k`} tick={{ fontSize: 12, fill: '#64748B' }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }}
                                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, t('kasir_revenue')]}
                                            />
                                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                                {metrics.chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill="#7C3AED" />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">

                            {/* Payment Methods */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4">{t('kasir_payment_methods')}</h3>
                                <div className="space-y-4">
                                    {[
                                        { id: 'cash', label: (lang === 'EN' ? 'Cash' : 'Tunai'), icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
                                        { id: 'transfer', label: 'Transfer', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                                        { id: 'qris', label: 'QRIS', icon: QrCode, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/30' }
                                    ].map(m => {
                                        const pct = metrics.sales > 0 ? (metrics.methods[m.id] / metrics.sales) * 100 : 0;
                                        return (
                                            <div key={m.id}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${m.bg} ${m.color}`}><m.icon size={14} /></div>
                                                        <span className="text-sm font-bold dark:text-slate-200">{m.label} <span className="text-xs font-normal text-slate-400">({metrics.methodCount[m.id]} trx)</span></span>
                                                    </div>
                                                    <div className="text-sm font-bold dark:text-white">Rp {metrics.methods[m.id].toLocaleString('id-ID')}</div>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full ${m.bg.split(' ')[0].replace('50', '500')}`} style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4">{t('kasir_top_products')}</h3>

                                {metrics.topProducts.length === 0 ? (
                                    <div className="text-slate-400 text-sm text-center py-4">{t('kasir_no_sales')}</div>
                                ) : (
                                    <div className="space-y-3">
                                        {metrics.topProducts.map((p, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors">
                                                <div className="w-6 text-center text-slate-400 text-xs font-bold">#{idx + 1}</div>
                                                <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg text-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    {p.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{p.name}</div>
                                                    <div className="text-xs text-slate-500 font-medium">{p.qty} {lang === 'EN' ? 'Sold' : 'Terjual'}</div>
                                                </div>
                                                <div className="font-bold text-sm text-violet-600 dark:text-violet-400">
                                                    Rp {p.revenue.toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
