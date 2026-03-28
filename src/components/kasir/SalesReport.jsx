import { useState, useMemo } from 'react';
import { X, Calendar, TrendingUp, DollarSign, Tag, CreditCard, Wallet, QrCode } from 'lucide-react';

export default function SalesReport({ isOpen, onClose, transactions }) {
    const [filter, setFilter] = useState('today'); // today, week, month, all

    const filteredData = useMemo(() => {
        const now = new Date();

        return transactions.filter(t => {
            const d = new Date(t.date);
            if (filter === 'today') {
                return d.toDateString() === now.toDateString();
            } else if (filter === 'week') {
                const diff = now - d;
                return diff <= 7 * 24 * 60 * 60 * 1000;
            } else if (filter === 'month') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [transactions, filter]);

    const metrics = useMemo(() => {
        let sales = 0;
        let discount = 0;
        let methods = { cash: 0, transfer: 0, qris: 0 };
        let methodCount = { cash: 0, transfer: 0, qris: 0 };
        let products = {};

        filteredData.forEach(t => {
            sales += t.total;
            discount += t.discountAmount;
            if (methods[t.method] !== undefined) {
                methods[t.method] += t.total;
                methodCount[t.method] += 1;
            }

            t.items.forEach(item => {
                if (!products[item.name]) {
                    products[item.name] = { qty: 0, revenue: 0, emoji: item.emoji };
                }
                products[item.name].qty += item.qty;
                products[item.name].revenue += (item.price * item.qty);
            });
        });

        const topProducts = Object.entries(products)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        return { sales, discount, methods, methodCount, topProducts, count: filteredData.length };
    }, [filteredData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div
                className="w-full max-w-3xl bg-slate-100 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden scale-in flex flex-col h-[85vh] md:h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="text-violet-500" /> Laporan Penjualan
                    </h2>
                    <div className="flex items-center gap-3">
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="today">Hari Ini</option>
                            <option value="week">7 Hari Terakhir</option>
                            <option value="month">Bulan Ini</option>
                            <option value="all">Semua Waktu</option>
                        </select>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-slate-500">Total Transaksi</span>
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Calendar size={18} /></div>
                            </div>
                            <div className="text-2xl font-black">{metrics.count}</div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-slate-500">Total Pendapatan</span>
                                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><DollarSign size={18} /></div>
                            </div>
                            <div className="text-2xl font-black">Rp {metrics.sales.toLocaleString('id-ID')}</div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-slate-500">Total Diskon</span>
                                <div className="p-2 bg-orange-50 text-orange-500 rounded-lg"><Tag size={18} /></div>
                            </div>
                            <div className="text-2xl font-black">Rp {metrics.discount.toLocaleString('id-ID')}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Metode Pembayaran */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                            <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                                Metode Pembayaran
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { id: 'cash', label: 'Tunai', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                    { id: 'transfer', label: 'Transfer Bank', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
                                    { id: 'qris', label: 'QRIS', icon: QrCode, color: 'text-violet-500', bg: 'bg-violet-50' }
                                ].map(m => (
                                    <div key={m.id} className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${m.bg} ${m.color}`}>
                                            <m.icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold">{m.label}</div>
                                            <div className="text-xs text-slate-500">{metrics.methodCount[m.id]} Transaksi</div>
                                        </div>
                                        <div className="font-bold">
                                            Rp {metrics.methods[m.id].toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Produk Terlaris */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200">
                            <h3 className="text-md font-bold text-slate-800 mb-4">
                                Produk Terlaris
                            </h3>
                            {metrics.topProducts.length === 0 ? (
                                <div className="text-center py-6 text-slate-400">Belum ada data penjualan.</div>
                            ) : (
                                <div className="space-y-3">
                                    {metrics.topProducts.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="w-8 text-center text-slate-400 text-xs font-bold">#{idx + 1}</div>
                                            <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-lg text-xl border border-slate-100">
                                                {p.emoji}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold truncate">{p.name}</div>
                                                <div className="text-xs text-slate-500">{p.qty} Terjual</div>
                                            </div>
                                            <div className="font-bold text-sm">
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
        </div>
    );
}
