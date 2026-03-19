import { useState, useEffect } from 'react';
import { PackageSearch, Plus, AlertTriangle, ArrowLeft, CheckCircle2, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLang } from '../../context/LanguageContext';

export default function KasirStok() {
    const { user, canAccessAdvancedKasir, isAdmin, effectivePlan } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, lang } = useLang();

    const [products, setProducts] = useState([]);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSchemaOutdated, setIsSchemaOutdated] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [qtyToAdd, setQtyToAdd] = useState('');
    const [notes, setNotes] = useState('');

    const isPlanPro = ['pro', 'ultimate'].includes(effectivePlan) || isAdmin;

    // PRO guard — must be after hooks
    if (!isPlanPro) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
                <span className="text-6xl mb-4">🔒</span>
                <h2 className="text-xl font-bold mb-2 dark:text-white">Stok & Inventaris — Fitur PRO</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Upgrade ke PRO untuk mengakses manajemen stok & inventaris.</p>
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
    }, [user]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            // Load products
            let { data: prodData, error: prodErr } = await supabase
                .from('kasir_products')
                .select('id, name, stock, category, emoji, is_active, product_type')
                .eq('is_active', true)
                .order('name');

            if (prodErr && (prodErr.code === '42703' || prodErr.code === 'PGRST204' || prodErr.message?.includes('does not exist'))) {
                console.warn('Stok: New columns missing, falling back...');
                setIsSchemaOutdated(true);
                const { data: fallback, error: fErr } = await supabase
                    .from('kasir_products')
                    .select('id, name, stock, category, emoji, is_active')
                    .eq('is_active', true)
                    .order('name');
                if (fErr) throw fErr;
                prodData = (fallback || []).map(p => ({ ...p, product_type: 'fixed' }));
                prodErr = null;
            } else if (prodErr) {
                throw prodErr;
            }

            setProducts(prodData || []);

            // Load history
            const { data: histData, error: histErr } = await supabase
                .from('kasir_stock_history')
                .select('id, product_id, product_name, qty_added, notes, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!histErr && histData) {
                setHistory(histData);
            }
        } catch (err) {
            console.error('Error loading stock data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        const product = products.find(p => p.id === selectedProductId);
        
        // Proteksi Wajib: Tolak tipe recipe
        if (product?.product_type === 'recipe') {
            showToast('Menu Resep tidak bisa ditambah stok manual. Tambah stok di Bahan Baku-nya!', 'error');
            return;
        }

        if (!selectedProductId || !qtyToAdd || qtyToAdd <= 0) return;

        try {
            if (!product) return;

            const newStock = product.stock + parseInt(qtyToAdd, 10);

            // 1. Update product stock
            const { error: updateErr } = await supabase
                .from('kasir_products')
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq('id', product.id);

            if (updateErr) throw updateErr;

            // 2. Insert into history
            const { error: histErr } = await supabase
                .from('kasir_stock_history')
                .insert({
                    product_id: product.id,
                    product_name: product.name,
                    qty_added: parseInt(qtyToAdd, 10),
                    notes: notes || 'Stok masuk manual'
                });

            setIsModalOpen(false);
            setQtyToAdd('');
            setNotes('');
            setSelectedProductId('');
            loadData();
            showToast('Stok berhasil ditambahkan!', 'success');

        } catch (err) {
            console.error('Error adding stock:', err);
            showToast('Gagal menambah stok. Coba lagi.', 'error', 5000);
        }
    };

    // Filter low stock hanya untuk fixed dan ingredient
    const lowStockProducts = products
        .filter(p => p.product_type === 'fixed' || p.product_type === 'ingredient')
        .filter(p => p.stock < 5);

    // === PLAN GUARD === PRO/ULTIMATE only
    if (!canAccessAdvancedKasir() && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Manajemen Stok Lanjutan — Fitur PRO</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    Kelola stok barang dan riwayat pengisian stok dengan mudah.<br />
                    Upgrade ke <strong>PRO</strong> untuk akses manajemen stok lengkap.
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
        <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col animate-fade-in-up">
            {isSchemaOutdated && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-4 animate-pulse">
                    <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-amber-900 dark:text-amber-100 uppercase text-xs tracking-wider mb-1">Database Outdated</h3>
                        <p className="text-sm text-amber-800 dark:text-amber-300">Aplikasi mendeteksi database lama. Fitur <b>Bahan Baku</b> tidak akan muncul sampai SQL dijalankan. Cek <code>SQL_FIX_TOTAL.md</code>.</p>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <button
                        onClick={() => navigate('/kasir')}
                        className="text-slate-500 hover:text-violet-600 mb-2 flex items-center gap-1 text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> {t('kasir_back')}
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <PackageSearch className="text-blue-500" size={28} />
                        {t('kasir_stock_title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('kasir_stock_desc')}</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> {t('kasir_add_stock')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">

                {/* LEFT COLUMN: Alerts & History */}
                <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full pr-2">

                    {/* Alerts */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900/50 overflow-hidden">
                        <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-3 border-b border-orange-100 dark:border-orange-900/50 flex align-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
                            <AlertTriangle size={20} /> {t('kasir_stock_low')} (&lt; 5)
                        </div>
                        <div className="p-4">
                            {lowStockProducts.length === 0 ? (
                                <div className="text-sm text-slate-500 flex items-center gap-2 py-2">
                                    <CheckCircle2 size={16} className="text-emerald-500" /> {t('kasir_stock_safe')}
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {lowStockProducts.map(p => (
                                        <li key={p.id} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2 font-medium dark:text-slate-300">
                                                <span>{p.emoji}</span> {p.name}
                                            </div>
                                            <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 px-2 py-0.5 rounded-md font-bold text-xs">
                                                {lang === 'EN' ? 'Left' : 'Sisa'} {p.stock}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col min-h-[300px]">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white">
                            {t('kasir_stock_history')}
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                            {history.length === 0 ? (
                                <div className="text-sm text-slate-500 text-center py-4">{lang === 'EN' ? 'No stock entry history yet.' : 'Belum ada riwayat stok masuk.'}</div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map(h => (
                                        <div key={h.id} className="border-l-2 border-blue-500 pl-3 pb-1">
                                            <div className="text-xs text-slate-400 mb-0.5">{new Date(h.created_at).toLocaleDateString(lang === 'EN' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-sm font-bold dark:text-white flex justify-between">
                                                <span>{h.product_name}</span>
                                                <span className="text-blue-600 dark:text-blue-400">+{h.qty_added} pcs</span>
                                            </div>
                                            {h.notes && <div className="text-xs text-slate-500 mt-0.5">{h.notes}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: All Products Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white flex justify-between items-center">
                        {t('kasir_all_products')}
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-md text-xs font-bold">
                            {products.filter(p => p.product_type === 'ingredient' || p.product_type === 'fixed').length} item
                        </span>
                    </div>
                    <div className="relative group flex-1">
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white dark:from-slate-800 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="overflow-x-auto pb-4 scrollbar-thin h-full">
                            <table className="w-full text-left text-sm min-w-[500px]">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0 z-20">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Nama Produk</th>
                                        <th className="px-5 py-3 font-medium">Stok</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {isLoading ? (
                                        <tr><td colSpan="4" className="text-center py-10"><div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div></td></tr>
                                    ) : products.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-slate-400">{t('kasir_no_products')}</td></tr>
                                    ) : (
                                        products
                                            .filter(p => p.product_type === 'ingredient' || p.product_type === 'fixed') // Filter Utama: Hanya Ingredient & Fixed
                                            .map(p => {
                                                const isLow = p.stock < 5;
                                                return (
                                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-5 py-3 font-medium dark:text-slate-200 flex items-center gap-2 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="shrink-0">{p.emoji}</span> 
                                                                <span className="truncate" title={p.name}>{p.name}</span>
                                                                {p.product_type === 'ingredient' ? (
                                                                    <span className="shrink-0 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-bold uppercase">Bahan</span>
                                                                ) : (
                                                                    <span className="shrink-0 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold uppercase">Retail</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 font-bold dark:text-white whitespace-nowrap">
                                                            {p.stock} pcs
                                                        </td>
                                                        <td className="px-5 py-3 whitespace-nowrap">
                                                            {isLow ? (
                                                                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-bold"><AlertTriangle size={14} /> Rendah</span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold"><CheckCircle2 size={14} /> Aman</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <button
                                                                onClick={() => { setSelectedProductId(p.id); setIsModalOpen(true); }}
                                                                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors dark:hover:bg-blue-900/30 dark:text-blue-400"
                                                            >
                                                                + {t('kasir_stock_label')}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            {/* Add Stock Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <h2 className="text-lg font-bold dark:text-white">Tambah Stok Masuk</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-1 rounded-lg transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleAddStock} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Produk</label>
                                <select
                                    required
                                    value={selectedProductId}
                                    onChange={e => setSelectedProductId(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="" disabled>-- Pilih Produk --</option>
                                    {products
                                        .filter(p => p.product_type === 'ingredient' || p.product_type === 'fixed') // Filter Modal: Hapus recipe
                                        .map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.product_type === 'ingredient' ? '📦 [BAHAN] ' : '🛍️ [RETAIL] '} 
                                                {p.name} ({lang === 'EN' ? 'Left' : 'Sisa'}: {p.stock})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Masuk (pcs)</label>
                                <input
                                    type="number" required min="1"
                                    value={qtyToAdd}
                                    onChange={e => setQtyToAdd(e.target.value)}
                                    placeholder="Misal: 50"
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Catatan (Opsional)</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Misal: Restock dari supplier"
                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all">
                                    <Save size={18} /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
