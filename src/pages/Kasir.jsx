import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';

import ProductGrid from '../components/kasir/ProductGrid';
import Cart from '../components/kasir/Cart';
import PaymentModal from '../components/kasir/PaymentModal';
import ReceiptModal from '../components/kasir/ReceiptModal';
import ProductModal from '../components/kasir/ProductModal';
import SalesReport from '../components/kasir/SalesReport';

export default function Kasir() {
    const { effectivePlan } = useAuth();
    const navigate = useNavigate();
    const { lang } = useLang();

    const [products, setProducts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [settings, setSettings] = useState({ storeName: 'Toko Saya', kasirName: 'Admin', logoUrl: '' });

    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState({ type: 'nominal', value: 0 }); // type: 'nominal' | 'persen'

    // Modals state
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);

    const [editingProduct, setEditingProduct] = useState(null);
    const [currentTransaction, setCurrentTransaction] = useState(null);

    // Settings Modal state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempSettings, setTempSettings] = useState(settings);

    // Load data
    useEffect(() => {
        try {
            const storedProducts = JSON.parse(localStorage.getItem('kasir_products') || '[]');
            const storedTransactions = JSON.parse(localStorage.getItem('kasir_transactions') || '[]');
            const storedSettings = JSON.parse(localStorage.getItem('kasir_settings') || 'null');

            setProducts(storedProducts);
            setTransactions(storedTransactions);

            if (storedSettings) {
                setSettings(storedSettings);
                setTempSettings(storedSettings);
            }
        } catch (err) {
            console.error('Failed to load Kasir local data', err);
        }
    }, []);

    // Use this to trigger re-renders & saves simultaneously
    const updateProducts = (newProducts) => {
        setProducts(newProducts);
        localStorage.setItem('kasir_products', JSON.stringify(newProducts));
    };

    const updateTransactions = (newTx) => {
        setTransactions(newTx);
        localStorage.setItem('kasir_transactions', JSON.stringify(newTx));
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
                    {lang === 'ID'
                        ? 'Tingkatkan paket Anda ke ULTIMATE untuk mengakses sistem Point of Sale (POS) offline yang cepat, lengkap dengan manajemen produk, struk cerdas, dan laporan harian.'
                        : 'Upgrade your plan to ULTIMATE to access a lightning-fast offline Point of Sale (POS) system complete with product management, smart receipts, and daily reports.'}
                </p>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
                >
                    {lang === 'ID' ? 'Upgrade ke ULTIMATE' : 'Upgrade to ULTIMATE'}
                </button>
            </div>
        );
    }

    // --- Handlers ---

    const handleAddToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) return prev; // check stock
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
        setCart(prev => prev.map(item => item.id === productId ? { ...item, qty: newQty } : item));
    };

    const handleRemoveFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const clearCart = () => setCart([]);

    const handleSaveProduct = (prodData) => {
        if (prodData.id) {
            // Edit
            updateProducts(products.map(p => p.id === prodData.id ? prodData : p));
        } else {
            // Add
            updateProducts([...products, { ...prodData, id: crypto.randomUUID() }]);
        }
        setIsProductModalOpen(false);
    };

    const handleDeleteProduct = (productId) => {
        if (window.confirm('Yakin ingin menghapus produk ini?')) {
            updateProducts(products.filter(p => p.id !== productId));
            setIsProductModalOpen(false);
        }
    };

    const generateInvoiceNumber = () => {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        try {
            const counterData = JSON.parse(localStorage.getItem('kasir_receipt_counter')) || { date: dateStr, count: 0 };
            let newCount = counterData.count + 1;

            // reset logic if new day
            if (counterData.date !== dateStr) {
                newCount = 1;
            }

            localStorage.setItem('kasir_receipt_counter', JSON.stringify({ date: dateStr, count: newCount }));
            return `INV-${dateStr}-${newCount.toString().padStart(3, '0')}`;
        } catch {
            return `INV-${dateStr}-001`;
        }
    };

    const handleConfirmPayment = ({ method, cash, change }) => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discountAmount = discount.type === 'persen'
            ? Math.floor(subtotal * (discount.value / 100))
            : discount.value;
        const total = Math.max(0, subtotal - discountAmount);

        const newTx = {
            id: generateInvoiceNumber(),
            date: new Date().toISOString(),
            items: [...cart],
            subtotal,
            discount: discount.value,
            discountType: discount.type,
            discountAmount,
            total,
            method,
            cash,
            change
        };

        // Update Transaction history
        updateTransactions([newTx, ...transactions]);

        // Update Stocks
        const updatedProducts = [...products];
        cart.forEach(cartItem => {
            const pIdx = updatedProducts.findIndex(p => p.id === cartItem.id);
            if (pIdx > -1) {
                updatedProducts[pIdx].stock = Math.max(0, updatedProducts[pIdx].stock - cartItem.qty);
            }
        });
        updateProducts(updatedProducts);

        setIsPaymentOpen(false);
        setCart([]);
        setDiscount({ type: 'nominal', value: 0 });

        // Show receipt
        setCurrentTransaction(newTx);
        setIsReceiptOpen(true);
    };

    return (
        <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
                        <Store size={22} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg dark:text-white leading-tight">Kasir My Invoice</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Point of Sale (Offline First)</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsReportOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors"
                    >
                        <BarChart2 size={16} /> <span className="hidden sm:inline">Laporan</span>
                    </button>
                    <button
                        onClick={() => { setTempSettings(settings); setIsSettingsOpen(true); }}
                        className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors"
                    >
                        <SettingsIcon size={16} /> <span className="hidden sm:inline">Pengaturan</span>
                    </button>
                </div>
            </div>

            {/* Main Grid: Left Products, Right Cart */}
            <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col lg:flex-row gap-6">
                <div className="flex-1 lg:w-2/3 h-[50vh] lg:h-full">
                    <ProductGrid
                        products={products}
                        onAddToCart={handleAddToCart}
                        onAddProduct={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                        onEditProduct={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }}
                    />
                </div>
                <div className="w-full lg:w-1/3 min-w-[320px] h-[50vh] lg:h-full shrink-0">
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

            {/* Feature Modals */}
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                product={editingProduct}
                onSave={handleSaveProduct}
                onDelete={handleDeleteProduct}
            />

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

            <SalesReport
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                transactions={transactions}
            />

        </div>
    );
}
