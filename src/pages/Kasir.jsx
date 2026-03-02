import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, BarChart2, Settings as SettingsIcon, Calendar, User, Search, Trash2, CheckCircle2, Package, ShoppingCart, AlertCircle, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

import Cart from '../components/kasir/Cart';
import PaymentModal from '../components/kasir/PaymentModal';
import ReceiptModal from '../components/kasir/ReceiptModal';

export default function Kasir() {
    const { user, effectivePlan } = useAuth();
    const navigate = useNavigate();
    const { lang } = useLang();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');

    const [settings, setSettings] = useState({ storeName: 'Toko Saya', kasirName: 'Admin', logoUrl: '' });

    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState({ type: 'nominal', value: 0 }); // type: 'nominal' | 'persen'

    // Modals state
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempSettings, setTempSettings] = useState(settings);

    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSetupError, setIsSetupError] = useState(false);

    // Load data from Supabase
    useEffect(() => {
        if (user && effectivePlan === 'ultimate') {
            loadData();

            const storedSettings = JSON.parse(localStorage.getItem('kasir_settings') || 'null');
            if (storedSettings) {
                setSettings(storedSettings);
                setTempSettings(storedSettings);
            }
        }
    }, [user, effectivePlan]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setIsSetupError(false);
            const { data, error } = await supabase
                .from('kasir_products')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            setProducts(data || []);

            // Extract unique categories
            const uniqueCats = ['Semua', ...new Set((data || []).map(p => p.category).filter(Boolean))];
            setCategories(uniqueCats);
        } catch (err) {
            console.error('Failed to load kasir products', err);
            if (err.code === '42P01' || err.message?.includes('does not exist')) {
                setIsSetupError(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('kasir_settings', JSON.stringify(newSettings));
    };

    // Guard Clause for Plan
    if (effectivePlan !== 'ultimate') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in-up">
                <div className="text-6xl mb-4 p-4 bg-violet-100 dark:bg-violet-900/30 rounded-full inline-block">👑</div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    {lang === 'ID' ? 'Fitur Kasir Khusus ULTIMATE' : 'POS Feature is ULTIMATE Only'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                    Upgrade paket Anda ke ULTIMATE untuk mengakses sistem Point of Sale (POS), Manajemen Inventaris, dan Ekosistem Bisnis Terpadu.
                </p>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    Upgrade ke ULTIMATE
                </button>
            </div>
        );
    }

    if (isSetupError) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 animate-fade-in-up text-center">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-5 rounded-full mb-6 text-amber-600 dark:text-amber-400">
                    <AlertCircle size={48} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                    Sedang Menyiapkan Modul Kasir...
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8 text-lg">
                    Database untuk fitur Kasir V2 sepertinya belum disiapkan. <br />
                    Tolong pastikan Anda telah menjalankan tabel SQL terbaru untuk Kasir di Supabase.
                </p>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm max-w-lg w-full text-left flex flex-col items-center">
                    <Terminal className="text-slate-400 mb-4" size={32} />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                        Tindakan Diperlukan:
                    </p>
                    <p className="text-sm text-center text-slate-500">
                        Masuk ke dashboard Supabase Anda, buka fitur <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">SQL Editor</span>, lalu jalankan (Run) seluruh baris kode yang ada di laporan panduan.
                    </p>
                    <button onClick={() => loadData()} className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-bold transition-all">
                        Coba Muat Ulang
                    </button>
                </div>
            </div>
        );
    }

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
            const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [products, selectedCategory, searchQuery]);

    // --- Handlers ---
    const handleAddToCart = (product) => {
        if (product.stock <= 0) return;
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) return prev; // check stock validation
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const handleUpdateQty = (productId, newQty) => {
        if (newQty <= 0) {
            handleRemoveFromCart(productId);
            return;
        }
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock) {
            return; // limit to max stock
        }
        setCart(prev => prev.map(item => item.id === productId ? { ...item, qty: newQty } : item));
    };

    const handleRemoveFromCart = (productId) => setCart(prev => prev.filter(item => item.id !== productId));
    const clearCart = () => setCart([]);

    const generateInvoiceNumber = async () => {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Count transactions today
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

        try {
            const { count } = await supabase
                .from('kasir_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startOfDay);

            const newCount = (count || 0) + 1;
            return `INV-${dateStr}-${newCount.toString().padStart(3, '0')}`;
        } catch {
            return `INV-${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        }
    };

    const handleConfirmPayment = async ({ method, cash, change }) => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discountAmount = discount.type === 'persen'
            ? Math.floor(subtotal * (discount.value / 100))
            : discount.value;
        const total = Math.max(0, subtotal - discountAmount);

        try {
            const receiptNumber = await generateInvoiceNumber();

            const transactionData = {
                user_id: user.id,
                receipt_number: receiptNumber,
                subtotal,
                discount_type: discount.type,
                discount_value: discount.value,
                discount_amount: discountAmount,
                total,
                payment_method: method,
                amount_paid: cash || 0,
                change_amount: change || 0,
                kasir_name: settings.kasirName,
                store_name: settings.storeName
            };

            // 1. Simpan transaksi
            const { data: tx, error: txError } = await supabase
                .from('kasir_transactions')
                .insert(transactionData)
                .select()
                .single();

            if (txError) throw txError;

            // 2. Simpan items
            const items = cart.map(item => ({
                transaction_id: tx.id,
                product_id: item.id,
                product_name: item.name,
                product_emoji: item.emoji,
                price: item.price,
                quantity: item.qty,
                subtotal: item.price * item.qty
            }));

            const { error: itemsError } = await supabase
                .from('kasir_transaction_items')
                .insert(items);

            if (itemsError) throw itemsError;

            // 3. Kurangi Stok
            for (const item of items) {
                await supabase.rpc('decrease_kasir_stock', {
                    product_id: item.product_id,
                    qty: item.quantity
                });
            }

            // 4. Integrasi ke Cashbook (Pemasukan)
            await supabase.from('cashbook').insert({
                user_id: user.id,
                type: 'income',
                category: 'Penjualan Kasir',
                description: `Transaksi Kasir ${tx.receipt_number}`,
                amount: total,
                date: new Date().toISOString().split('T')[0],
                reference_id: tx.id,
                reference_type: 'kasir_transaction'
            });

            setIsPaymentOpen(false);

            const completeTxData = {
                id: tx.receipt_number,
                date: tx.created_at,
                items: cart,
                subtotal: tx.subtotal,
                discountAmount: tx.discount_amount,
                total: tx.total,
                method: tx.payment_method,
                cash: tx.amount_paid,
                change: tx.change_amount
            };

            setCurrentTransaction(completeTxData);
            setCart([]);
            setDiscount({ type: 'nominal', value: 0 });
            setIsReceiptOpen(true);

            // Reload product data (to reflect new stock)
            loadData();

        } catch (err) {
            console.error('Transaction Failed:', err);
            alert('Gagal memproses transaksi.');
        }
    };

    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* HEADER MAJOO STYLE */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0">
                        <Store size={22} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg dark:text-white leading-tight flex items-center gap-2">
                            Kasir <span className="bg-violet-100 text-violet-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Ultimate</span>
                        </h1>
                        <div className="flex text-xs text-slate-500 font-medium items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1"><User size={12} /> {settings.kasirName}</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <button
                        onClick={() => { setTempSettings(settings); setIsSettingsOpen(true); }}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors"
                    >
                        <SettingsIcon size={16} /> <span>Setting</span>
                    </button>
                </div>
            </div>

            {/* Main Grid: Left Products, Right Cart */}
            <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col lg:flex-row gap-6">

                {/* LEFT: PRODUCTS LIST */}
                <div className="flex-1 h-[50vh] lg:h-full flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Search & Add */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari produk..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/kasir/produk')}
                            className="px-4 py-2.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:hover:bg-violet-800/40 text-violet-600 dark:text-violet-400 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            + Produk
                        </button>
                    </div>

                    {/* Categories */}
                    <div className="px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar border-b border-slate-100 dark:border-slate-700 shrink-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent"></div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Package size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">Tidak ada produk ditemukan.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => {
                                    const isOutOfStock = product.stock <= 0;
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => handleAddToCart(product)}
                                            className={`relative group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 cursor-pointer transition-all ${isOutOfStock
                                                ? 'opacity-60 cursor-not-allowed grayscale'
                                                : 'hover:border-violet-500 hover:shadow-lg hover:-translate-y-1'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="text-4xl">{product.emoji}</div>
                                                <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isOutOfStock ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                    Stok: {product.stock}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{product.name}</h3>
                                            <p className="text-violet-600 dark:text-violet-400 font-black mt-1">Rp {product.price.toLocaleString('id-ID')}</p>

                                            {!isOutOfStock && (
                                                <div className="absolute inset-x-0 bottom-0 top-0 bg-violet-600/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg text-violet-600 dark:text-violet-400">
                                                        <Store size={24} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: CART */}
                <div className="w-full lg:w-1/3 min-w-[320px] h-[50vh] lg:h-full shrink-0 flex flex-col">
                    {/* Keranjang Majoo Style Header */}
                    <div className="bg-slate-800 text-white rounded-t-2xl p-4 flex justify-between items-center shadow-lg relative z-10">
                        <div className="flex items-center gap-2 font-bold">
                            <ShoppingCart size={18} /> Keranjang
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                            {totalCartItems} Item
                        </div>
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-b-2xl shadow-sm border-x border-b border-slate-200 dark:border-slate-700 overflow-hidden -mt-2 pt-2 flex flex-col">
                        <Cart
                            cart={cart}
                            onUpdateQty={handleUpdateQty}
                            onRemoveItem={handleRemoveFromCart}
                            onClear={clearCart}
                            onCheckout={() => setIsPaymentOpen(true)}
                            discount={discount}
                            setDiscount={setDiscount}
                        />
                    </div>
                </div>
            </div>

            {/* Settings Modal (Inline simple modal) */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="font-bold text-lg dark:text-white">Pengaturan Kasir</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Toko</label>
                                <input type="text" value={tempSettings.storeName} onChange={e => setTempSettings({ ...tempSettings, storeName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Kasir</label>
                                <input type="text" value={tempSettings.kasirName} onChange={e => setTempSettings({ ...tempSettings, kasirName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">URL Logo Toko (opsional)</label>
                                <input type="text" value={tempSettings.logoUrl || ''} onChange={e => setTempSettings({ ...tempSettings, logoUrl: e.target.value })} placeholder="https://..." className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Batal</button>
                            <button onClick={() => { updateSettings(tempSettings); setIsSettingsOpen(false); }} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                total={Math.max(0, cart.reduce((sum, item) => sum + (item.price * item.qty), 0) - (discount.type === 'persen' ? Math.floor(cart.reduce((sum, item) => sum + (item.price * item.qty), 0) * (discount.value / 100)) : discount.value))}
                onConfirm={handleConfirmPayment}
            />

            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                transaction={currentTransaction}
                settings={settings}
            />

        </div>
    );
}
