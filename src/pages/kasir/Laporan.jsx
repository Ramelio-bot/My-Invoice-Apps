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

    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [transactions, setTransactions] = useState([]);
    const [items, setItems] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [activeTab, setActiveTab] = useState('sales'); // sales, expenses
    const [isLoading, setIsLoading] = useState(true);

    const isPlanPro = ['pro', 'ultimate'].includes(effectivePlan) || isAdmin;

    if (!isPlanPro) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
                <span className="text-6xl mb-4">📈</span>
                <h2 className="text-xl font-bold mb-2">{t('kasir_report_pro_limit_title')}</h2>
                <p className="text-slate-500 mb-6">{t('kasir_report_pro_limit_desc')}</p>
                <button onClick={() => navigate('/upgrade')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    {t('upgrade_pro_btn')}
                </button>
            </div>
        );
    }

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, selectedDate, loadData]);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const start = new Date(selectedDate);
            start.setHours(0, 0, 0, 0);
            const startDateStr = start.toISOString();
            
            const end = new Date(selectedDate);
            end.setHours(23, 59, 59, 999);
            const endDateStr = end.toISOString();

            // 1. Load subset of transactions
            const { data: txs, error: txErr } = await supabase
                .from('kasir_transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'paid')
                .gte('created_at', startDateStr)
                .lte('created_at', endDateStr)
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

            // 3. Load Expenses
            const { data: exp, error: expErr } = await supabase
                .from('kasir_expenses')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDateStr)
                .lte('created_at', endDateStr)
                .order('created_at', { ascending: false });

            if (expErr) throw expErr;
            setExpenses(exp || []);
        } catch (err) {
            console.error('Error loading reports:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, selectedDate]);

    const metrics = useMemo(() => {
        let sales = 0;
        let discount = 0;
        let methods = { cash: 0, transfer: 0, qris: 0 };
        let methodCount = { cash: 0, transfer: 0, qris: 0 };
        let products = {};
        let chartDataMap = {};

        // 🛡️ PERTAHANAN 1: Ambil localeCode di luar loop agar stabil saat minifikasi
//         const currentLocale = t('locale_code') === 'locale_code' ? (lang === 'id' ? 'id-ID' : 'en-US') : t('locale_code');

        // 🛡️ PERTAHANAN 2: Pastikan transactions adalah array
        const safeTransactions = Array.isArray(transactions) ? transactions : [];

        safeTransactions.forEach(tx => {
            sales += (tx.total || 0);
            discount += (tx.discount_amount || 0);
            
            if (tx.payment_method && methods[tx.payment_method] !== undefined) {
                methods[tx.payment_method] += (tx.total || 0);
                methodCount[tx.payment_method] += 1;
            }

            const d = new Date(tx.created_at);
            let timeKey = '';
            
            timeKey = `${d.getHours()}:00`;
            // always hours for single day

            if (!chartDataMap[timeKey]) chartDataMap[timeKey] = 0;
            chartDataMap[timeKey] += (tx.total || 0);
        });

        // Urutkan data grafik
        const chartData = Object.keys(chartDataMap).map(k => ({ 
            name: k, 
            total: chartDataMap[k] 
        }));

        chartData.sort((a, b) => parseInt(a.name) - parseInt(b.name));

        // Proses Top Products
        const safeItems = Array.isArray(items) ? items : [];
        safeItems.forEach(item => {
            if (!products[item.product_id]) {
                products[item.product_id] = { 
                    name: item.product_name, 
                    emoji: item.product_emoji, 
                    qty: 0, 
                    revenue: 0 
                };
            }
            products[item.product_id].qty += (item.quantity || 0);
            products[item.product_id].revenue += (item.subtotal || 0);
        });

        // Hitung total expenses
        const totalExpenses = (Array.isArray(expenses) ? expenses : []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

        return {
            sales,
            discount,
            methods,
            methodCount,
            topProducts: Object.values(products).sort((a, b) => b.qty - a.qty).slice(0, 5),
            count: safeTransactions.length,
            chartData,
            totalExpenses
        };
    }, [transactions, items, expenses, t, lang]);

    // === PLAN GUARD === PRO/ULTIMATE only
    if (!canAccessAdvancedKasir() && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{t('kasir_report_pro_limit_title')}</h2>
                <p className="text-slate-500 max-w-md mb-6 whitespace-pre-line">
                    {t('kasir_report_pro_limit_desc')}
                </p>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    {t('upgrade_pro_btn')}
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
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" size={28} />
                        {t('kasir_report_title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('kasir_report_desc')}</p>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2 border-slate-100 shadow-sm">
                    <Calendar size={18} className="text-slate-400" />
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-slate-100 rounded-2xl shimmer-wrapper"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-80 bg-slate-100 rounded-2xl shimmer-wrapper"></div>
                        <div className="space-y-6">
                            <div className="h-40 bg-slate-100 rounded-2xl shimmer-wrapper"></div>
                            <div className="h-40 bg-slate-100 rounded-2xl shimmer-wrapper"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 pb-12">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 text-emerald-100">
                                <DollarSign size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><DollarSign size={16} /></div> {t('kasir_revenue')}
                                </div>
                                <div className="text-3xl font-black text-slate-800 mt-1">
                                    Rp {metrics.sales.toLocaleString(t('locale_code'))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 text-pink-100">
                                <Wallet size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-pink-50 text-pink-500 rounded-lg"><Wallet size={16} /></div> {t('total_expenses', 'Total Pengeluaran')}
                                </div>
                                <div className="text-3xl font-black text-rose-600 mt-1 text-pink-600">
                                    Rp {metrics.totalExpenses.toLocaleString(t('locale_code'))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 text-blue-100">
                                <Calendar size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Calendar size={16} /></div> {t('kasir_transactions')}
                                </div>
                                <div className="text-3xl font-black text-slate-800 mt-1">
                                    {metrics.count} <span className="text-xl font-bold text-slate-400">{t('transactions_short')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 text-orange-100">
                                <Tag size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg"><Tag size={16} /></div> {t('kasir_discount')}
                                </div>
                                <div className="text-3xl font-black text-slate-800 mt-1">
                                    Rp {metrics.discount.toLocaleString(t('locale_code'))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-4 border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'sales'
                                ? 'border-violet-600 text-violet-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {t('kasir_tab_sales', 'Penjualan')}
                        </button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'expenses'
                                ? 'border-violet-600 text-violet-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {t('kasir_tab_expenses', 'Pengeluaran Kasir')}
                        </button>
                    </div>

                    {activeTab === 'sales' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                            {/* Chart */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                                <h3 className="text-md font-bold text-slate-800 mb-6">{t('kasir_chart')}</h3>
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
                                                    formatter={(value) => [`Rp ${value.toLocaleString(t('locale_code'))}`, t('kasir_revenue')]}
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
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-md font-bold text-slate-800 mb-4">{t('kasir_payment_methods')}</h3>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'cash', label: t('kasir_cash'), icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                            { id: 'transfer', label: t('kasir_transfer'), icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
                                            { id: 'qris', label: t('kasir_qris'), icon: QrCode, color: 'text-violet-500', bg: 'bg-violet-50' }
                                        ].map(m => {
                                            const pct = metrics.sales > 0 ? (metrics.methods[m.id] / metrics.sales) * 100 : 0;
                                            return (
                                                <div key={m.id}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-lg ${m.bg} ${m.color}`}><m.icon size={14} /></div>
                                                            <span className="text-sm font-bold text-slate-800">{m.label} <span className="text-xs font-normal text-slate-400">({metrics.methodCount[m.id]} trx)</span></span>
                                                        </div>
                                                        <div className="text-sm font-bold text-slate-800">Rp {metrics.methods[m.id].toLocaleString(t('locale_code'))}</div>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className={`h-full ${m.bg.split(' ')[0].replace('50', '500')}`} style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Top Products */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-md font-bold text-slate-800 mb-4">{t('kasir_top_products')}</h3>

                                    {metrics.topProducts.length === 0 ? (
                                        <div className="text-slate-400 text-sm text-center py-4">{t('kasir_no_sales')}</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {metrics.topProducts.map((p, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                                    <div className="w-6 text-center text-slate-400 text-xs font-bold">#{idx + 1}</div>
                                                    <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-xl border border-slate-200 shadow-sm">
                                                        {p.emoji}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-slate-800 truncate">{p.name}</div>
                                                        <div className="text-xs text-slate-500 font-medium">{p.qty} {t('sold')}</div>
                                                    </div>
                                                    <div className="font-bold text-sm text-violet-600">
                                                        Rp {new Intl.NumberFormat(t('locale_code')).format(parseInt(p.revenue))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                            <div className="p-5 border-b border-slate-100">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <DollarSign className="text-pink-500" size={18} />
                                    {t('kasir_expense_list') || "Daftar Pengeluaran"}
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {expenses.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">
                                        <div className="text-4xl mb-2">💸</div>
                                        <p className="text-sm">{t('no_expense_found') || "Tidak ada pengeluaran di periode ini."}</p>
                                    </div>
                                ) : (
                                    expenses.map((exp) => (
                                        <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{exp.category}</span>
                                                <span className="text-xs italic text-slate-500 mt-0.5">{exp.notes || exp.note || exp.description}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-rose-600">
                                                    - Rp {exp.amount.toLocaleString(t('locale_code'))}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                                    {new Date(exp.created_at).toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
