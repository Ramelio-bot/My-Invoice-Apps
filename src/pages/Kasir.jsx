import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, BarChart2, Settings as SettingsIcon, Calendar, User, Search, Trash2, CheckCircle2, Package, ShoppingCart, AlertCircle, Terminal, Crown, Lock, X, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

import Cart from '../components/kasir/Cart';
import PaymentModal from '../components/kasir/PaymentModal';
import ReceiptModal from '../components/kasir/ReceiptModal';
import ThermalReceipt from '../components/kasir/ThermalReceipt';
import UpgradeModal from '../components/UpgradeModal';
import LimitModal from '../components/LimitModal';
import KasirPinLogin from '../components/KasirPinLogin';
import BarcodeScanner from '../components/BarcodeScanner';
import { useStore } from '../store/useStore';

export default function Kasir() {
    const { user, effectivePlan, isAdmin } = useAuth();
    const {
        isPro, isUltimate, getKasirTransactionCount,
        checkKasirTransactionLimit, incrementKasirTransaction,
        refreshUsage
    } = usePlan();
    const navigate = useNavigate();
    const { t, lang } = useLang();
    const { showToast } = useToast();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');

    // Shift state
    const [employees, setEmployees] = useState([]);
    const [activeShift, setActiveShift] = useState(null);
    const [shiftSummary, setShiftSummary] = useState(null);
    const [isEndShiftConfirmOpen, setIsEndShiftConfirmOpen] = useState(false);

    const { kasirSettings: settings, setKasirSettings: setSettings, kasirOpenBills: savedBills, setKasirOpenBills: setSavedBills } = useStore();

    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState({ type: 'nominal', value: 0 }); // type: 'nominal' | 'persen'

    // Modals state
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempSettings, setTempSettings] = useState(settings);

    const [isSaveBillOpen, setIsSaveBillOpen] = useState(false);
    const [isOpenBillsOpen, setIsOpenBillsOpen] = useState(false);
    const [billCustomerName, setBillCustomerName] = useState('');
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');

    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSetupError, setIsSetupError] = useState(false);
    const [activeTab, setActiveTab] = useState('products');
    const [isProcessing, setIsProcessing] = useState(false);
    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);
    const [deleteBillConfirm, setDeleteBillConfirm] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showStockAlert, setShowStockAlert] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const isPlanPro = effectivePlan === 'pro' || effectivePlan === 'ultimate' || isAdmin;

    const lowStockProducts = useMemo(() => {
        if (!isPlanPro) return [];
        return products.filter(p => p.stock > 0 && p.stock <= 10);
    }, [products, isPlanPro]);

    const outOfStockProducts = useMemo(() => {
        if (!isPlanPro) return [];
        return products.filter(p => p.stock <= 0);
    }, [products, isPlanPro]);

    // Load data — tersedia untuk semua user (free & ultimate)
    useEffect(() => {
        if (user) {
            loadData();
            setTempSettings(settings);
        }
    }, [user]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setIsSetupError(false);
            const { data, error } = await supabase
                .from('kasir_products')
                .select('id, user_id, name, price, stock, category, emoji, is_active, sku')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            setProducts(data || []);

            // Extract unique categories
            const uniqueCats = ['Semua', ...new Set((data || []).map(p => p.category).filter(Boolean))];
            setCategories(uniqueCats);

            // Fetch Clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('id, name')
                .eq('user_id', user.id)
                .order('name');
            if (!clientsError && clientsData) {
                setClients(clientsData);
            }

            // Fetch Employees
            const { data: empData, error: empError } = await supabase
                .from('kasir_employees')
                .select('id, name, role, pin, is_active')
                .eq('user_id', user.id)
                .eq('is_active', true)
            if (!empError && empData) {
                setEmployees(empData);
            }

            // Fetch Store Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('store_name, store_address, store_phone, store_footer, store_logo_url')
                .eq('id', user.id)
                .single();
            if (!profileError && profileData) {
                // Merge store settings from profile with existing kasirSettings
                setTempSettings(prev => ({
                    ...prev,
                    customStoreName: profileData.store_name,
                    customStoreAddress: profileData.store_address,
                    customStorePhone: profileData.store_phone,
                    customStoreFooter: profileData.store_footer,
                    customStoreLogoUrl: profileData.store_logo_url
                }));
            }
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
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
            const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchCat && matchSearch;
        });
    }, [products, selectedCategory, searchQuery]);

    // Auto-add ke cart jika exact SKU match
    useEffect(() => {
        if (searchQuery.length >= 3) {
            const exactMatch = products.find(
                p => p.sku && p.sku.toUpperCase() === searchQuery.toUpperCase()
            );
            if (exactMatch && exactMatch.stock > 0) {
                handleAddToCart(exactMatch);
                showToast(`${exactMatch.name} ${t('barcode_added') || 'ditambahkan ke cart'}`, 'success');
                setSearchQuery(''); // reset search
            } else if (exactMatch && exactMatch.stock <= 0) {
                showToast(`${exactMatch.name} ${t('stock_out_warning') || 'stok habis!'}`, 'error');
                setSearchQuery('');
            }
        }
    }, [searchQuery, products]);

    // Hitung sisa transaksi bulanan (FREE)
    const isKasirLocked = !checkKasirTransactionLimit();
    const kasirTxCount = getKasirTransactionCount();
    const kasirTxLeft = Math.max(0, 50 - kasirTxCount);

    // Jika limit habis dan bukan ultimate/admin — tampilkan layar lock
    if (isKasirLocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in-up">
                <div className="text-6xl mb-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-full inline-block">🔒</div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    {t('kasir_monthly_limit_title')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-2">
                    {t('kasir_monthly_limit_desc')}
                </p>
                <p className="text-xs text-slate-400 mb-8">{t('kasir_limit_reset')}</p>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                    <Crown size={18} /> {t('sidebar_upgrade_cta')}
                </button>
            </div>
        );
    }

    if (!activeShift && employees.length > 0 && !isLoading) {
        return <KasirPinLogin onLogin={setActiveShift} employees={employees} />;
    }

    if (isSetupError) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 animate-fade-in-up text-center">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-5 rounded-full mb-6 text-amber-600 dark:text-amber-400">
                    <AlertCircle size={48} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                    {t('kasir_setup_title')} {/* FIX-10 */}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8 text-lg">
                    {t('kasir_setup_desc')} {/* FIX-10 */}
                </p>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm max-w-lg w-full text-left flex flex-col items-center">
                    <Terminal className="text-slate-400 mb-4" size={32} />
                    <p className="text-sm text-center text-slate-500">
                        Masuk ke dashboard Supabase Anda, buka <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">SQL Editor</span>, lalu jalankan seluruh baris kode skema terbaru.
                    </p>
                    <button onClick={() => loadData()} className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-bold transition-all">
                        {t('kasir_setup_retry')} {/* FIX-10 */}
                    </button>
                </div>
            </div>
        );
    }

    // --- Handlers ---
    const handleAddToCart = (product) => {
        if (product.stock <= 0) {
            showToast(`${product.name} ${t('stock_out_warning') || 'sudah habis stok!'}`, 'error');
            return;
        }
        if (product.stock <= 3) {
            showToast(`${t('stock_status_low')} ${product.name} ${t('stock_status_low')} ${product.stock}!`, 'warning');
        }
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) {
                    showToast(`Maksimal stok ${product.name} adalah ${product.stock}`, 'error');
                    return prev;
                }
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

    const refreshSavedBills = () => {
        // no-op, tied to Zustand
    };

    const handleSaveBill = () => {
        if (!billCustomerName.trim()) return showToast('Nama/label bill wajib diisi', 'error');
        const bills = [...savedBills];
        const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        bills.push({
            id: `bill_${Date.now()}`,
            label: billCustomerName.trim(),
            items: cart,
            discount,
            total: cartTotal,
            savedAt: new Date().toISOString(),
        });
        setSavedBills(bills);
        setCart([]);
        setDiscount({ type: 'nominal', value: 0 });
        setIsSaveBillOpen(false);
        setBillCustomerName('');
        showToast(t('kasir_bill_saved') || 'Bill tersimpan!', 'success');
    };

    const handleLoadBill = (billId) => {
        const bills = [...savedBills];
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            setCart(bill.items || bill.cart || []);
            if (bill.discount) setDiscount(bill.discount);
            const updatedBills = bills.filter(b => b.id !== billId);
            setSavedBills(updatedBills);
            setIsOpenBillsOpen(false);
            setActiveTab('cart');
            showToast(t('kasir_bill_loaded') || 'Bill dimuat ke keranjang!', 'success');
        }
    };

    const handleDeleteBill = (billId) => {
        setDeleteBillConfirm(billId);
    };

    const handleConfirmDeleteBill = () => {
        if (!deleteBillConfirm) return;
        setSavedBills(savedBills.filter(b => b.id !== deleteBillConfirm));
        setDeleteBillConfirm(null);
    };

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
            return `INV - ${dateStr} -${newCount.toString().padStart(3, '0')} `;
        } catch {
            return `INV - ${dateStr} -${Math.floor(Math.random() * 1000).toString().padStart(3, '0')} `;
        }
    };

    const confirmEndShift = async () => {
        setIsEndShiftConfirmOpen(false);
        try {
            const { data: txs } = await supabase
                .from('kasir_transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('employee_id', activeShift.employeeId)
                .gte('created_at', activeShift.startTime.toISOString());

            const totalTrx = txs ? txs.length : 0;
            // FIX-05: kolom skema adalah 'amount' bukan 'total'
            const totalRevenue = txs ? txs.reduce((sum, tx) => sum + (tx.amount || 0), 0) : 0;

            await supabase.from('kasir_shifts').insert({
                user_id: user.id,
                employee_id: activeShift.employeeId,
                employee_name: activeShift.employeeName,
                started_at: activeShift.startTime.toISOString(),
                ended_at: new Date().toISOString(),
                total_transactions: totalTrx,
                total_revenue: totalRevenue
            });

            setShiftSummary({ totalTrx, totalRevenue, employeeName: activeShift.employeeName });
            setActiveShift(null);
        } catch (err) {
            console.error('Failed to end shift', err);
        }
    };

    const handleConfirmPayment = async ({ method, cash, change, customerPhone, memberId: passedMemberId, foundMember: passedFoundMember }) => {
        if (isProcessing) return; // ← Guard: cegah double-submit

        // Guard: cek limit harian POS
        if (!checkKasirTransactionLimit()) {
            setUpgradeFeatureType('pos_limit');
            return;
        }

        setIsProcessing(true);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discountAmount = discount.type === 'persen'
            ? Math.floor(subtotal * (discount.value / 100))
            : discount.value;
        const total = Math.max(0, subtotal - discountAmount);

        try {
            const receiptNumber = await generateInvoiceNumber();

            // Fetch custom receipt settings from profiles table
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('store_name, store_address, store_phone, store_footer, store_logo_url')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile for receipt settings:', profileError);
            }

            const storeSettingsForReceipt = {
                name: profileData?.store_name || settings.storeName || 'My Store',
                address: profileData?.store_address || '',
                phone: profileData?.store_phone || '',
                footer: profileData?.store_footer || 'Thank you!',
                logoUrl: profileData?.store_logo_url || null
            };

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
                kasir_name: activeShift ? activeShift.employeeName : settings.kasirName,
                store_name: settings.storeName,
                notes: selectedClient || '',
                customer_phone: customerPhone || null,
                employee_id: activeShift ? activeShift.employeeId : null,
                employee_name: activeShift ? activeShift.employeeName : null,
                member_id: discount.member_id || null, // from loyalty state in payment modal
                // FIX-02: konsisten pakai subtotal (sebelum redeem poin) bukan total
                points_earned: Math.floor(subtotal / (settings.points_per_amount || 1000)),
                points_redeemed: discount.type === 'poin' ? Math.floor(discount.value / (settings.points_value || 10)) : 0
            };

            // If loyalty disabled, ignore points
            if (!settings.loyalty_enabled) {
                transactionData.points_earned = 0;
            }

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

            // 3. Kurangi Stok — FIX-03: await + error handling per item
            for (const item of items) {
                try {
                    const { error: rpcError } = await supabase.rpc('decrease_kasir_stock', {
                        product_id: item.product_id,
                        qty: item.quantity
                    });
                    if (rpcError) {
                        console.error(`[CRITICAL] Gagal kurangi stok untuk produk ${item.product_name}:`, rpcError);
                        showToast(`⚠️ Stok ${item.product_name} gagal dikurangi. Cek manual!`, 'error');
                    }
                } catch (rpcErr) {
                    console.error(`[CRITICAL] RPC stock error for ${item.product_name}:`, rpcErr);
                    showToast(`⚠️ Stok ${item.product_name} gagal dikurangi. Cek manual!`, 'error');
                }
            }

            // 3a. Update Loyalty Points
            const memberId = transactionData.member_id || passedMemberId;
            const fMember = passedFoundMember;

            if (memberId) {
                const minSpend = settings.points_per_amount || 1000;
                // FIX-02: pakai subtotal (sebelum redeem poin) agar konsisten
                const pointsEarned = Math.floor(subtotal / minSpend);
                const pointsRedeemed = transactionData.points_redeemed || 0;

                if (pointsEarned > 0 || pointsRedeemed > 0) {
                    const pointsDelta = pointsEarned - pointsRedeemed;
                    if (pointsDelta !== 0) {
                        const { error: rpcError } = await supabase.rpc('add_member_points', {
                            p_member_id: memberId,
                            p_points_to_add: pointsDelta
                        });
                        if (rpcError) console.error('[ERROR] RPC Points update failed:', rpcError);
                    }
                }

                // Insert history for redeemed
                if (pointsRedeemed > 0) {
                    await supabase.from('kasir_points_history').insert({
                        user_id: user.id,
                        member_id: memberId,
                        transaction_id: tx.id,
                        type: 'redeem',
                        points: pointsRedeemed,
                        description: `Redeem for TX ${receiptNumber}`
                    });
                }
                
                // Insert history for earned
                if (pointsEarned > 0) {
                    await supabase.from('kasir_points_history').insert({
                        user_id: user.id,
                        member_id: memberId,
                        transaction_id: tx.id,
                        type: 'earn',
                        points: pointsEarned,
                        description: `Earned from TX ${receiptNumber}`
                    });
                }
            }

            // 3b. Increment Voucher usage count if applicable
            if (discount.code) {
                // Call RPC or simple update? Since we just want to execute a +1 update we can fetch current or best yet use RPC. 
                // Since no RPC is provided for voucher, we can just fetch and update or update raw. Let's do a select + update.
                const { data: vData } = await supabase
                    .from('kasir_vouchers')
                    .select('used_count')
                    .eq('user_id', user.id)
                    .eq('code', discount.code)
                    .single();
                    
                if (vData) {
                    await supabase
                        .from('kasir_vouchers')
                        .update({ used_count: (vData.used_count || 0) + 1 })
                        .eq('user_id', user.id)
                        .eq('code', discount.code);
                }
            }

            // 4. Integrasi ke Cashbook (Pemasukan)
            const clientName = selectedClient || '';
            const descriptionTxt = clientName
                ? `Transaksi Kasir ${receiptNumber} - ${clientName}`
                : `Transaksi Kasir ${receiptNumber}`;

            try {
                const { error: cbErr } = await supabase.from('cashbook').insert({
                    user_id: user.id,
                    type: 'income',
                    category: 'Penjualan Kasir',
                    description: descriptionTxt,
                    amount: parseInt(total.toString().replace(/\D/g, ''), 10),
                    date: new Date().toISOString().split('T')[0]
                });
                if (cbErr) throw cbErr;
            } catch (err) {
                console.error('POS to Cashbook sync error details:', err);
            }

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
                change: tx.change_amount,
                kasir_name: activeShift ? activeShift.employeeName : settings.kasirName,
                customerPhone: customerPhone || '',
                storeSettings: storeSettingsForReceipt,
                points_earned: transactionData.points_earned,
                points_redeemed: transactionData.points_redeemed
            };

            setCurrentTransaction(completeTxData);
            setCart([]);
            setDiscount({ type: 'nominal', value: 0 });
            setSelectedClient('');
            setIsReceiptOpen(true);

            // Tambah counter transaksi untuk FREE user
            incrementKasirTransaction();

            // Reload product data (to reflect new stock)
            loadData();

            // Sync events for Dashboard/Report
            window.dispatchEvent(new Event('kasir-updated'));
            window.dispatchEvent(new Event('cashbook-updated'));

        } catch (err) {
            console.error('Transaction Failed:', err);
            showToast('Gagal memproses transaksi. Coba lagi.', 'error', 5000);
        } finally {
            setIsProcessing(false); // ← Selalu reset setelah selesai
        }
    };

    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);


    return (
        <div className="min-h-full lg:h-full flex flex-col bg-slate-50 dark:bg-slate-900 lg:overflow-hidden">
            {/* HEADER MAJOO STYLE */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0">
                        <Store size={22} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg dark:text-white leading-tight flex items-center gap-2">
                            {t('nav_kasir')}
                            {isAdmin ? (
                                <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                            ) : effectivePlan === 'ultimate' ? (
                                <span className="bg-violet-100 text-violet-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Ultimate 👑</span>
                            ) : effectivePlan === 'pro' ? (
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">PRO ⭐</span>
                            ) : (
                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {t('kasir_badge_free').replace('{used}', kasirTxCount)}
                                </span>
                            )}
                        </h1>
                        <div className="flex text-xs text-slate-500 font-medium items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1"><User size={12} /> {activeShift ? `${activeShift.employeeName} (${activeShift.role})` : settings.kasirName}</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            {activeShift && (
                                <>
                                    <span className="flex items-center gap-1 text-emerald-600"><Calendar size={12} /> {t('shift_started')} {activeShift.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                    <button onClick={() => setIsEndShiftConfirmOpen(true)} className="text-red-500 hover:text-red-600 font-bold">{t('shift_end')}</button>
                                </>
                            )}
                            {!activeShift && (
                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date().toLocaleDateString(lang === 'EN' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Open Bills button */}
                    <button
                        onClick={() => { refreshSavedBills(); setIsOpenBillsOpen(true); }}
                        className="relative flex items-center gap-2 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-xl text-base font-black transition-colors shadow-sm"
                    >
                        📋 {lang === 'EN' ? 'Open Bills' : 'Pesanan Tersimpan'}
                        {savedBills.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow">
                                {savedBills.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setTempSettings(settings); setIsSettingsOpen(true); }}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors"
                    >
                        <SettingsIcon size={16} /> <span>{lang === 'EN' ? 'Settings' : 'Setting'}</span>
                    </button>
                </div>
            </div>

            {/* FREE tier: banner sisa transaksi - hanya untuk FREE user */}
            {effectivePlan === 'free' && !isAdmin && (
                <div className={`px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-semibold shrink-0 ${kasirTxLeft <= 3
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-b border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800'
                    }`}>
                    <span className="flex items-center gap-2">
                        <Lock size={14} />
                        {50 - kasirTxCount > 0
                            ? <>{t('kasir_limit_msg').replace('{remaining}', 50 - kasirTxCount)}</>
                            : <>{t('kasir_tx_used_up')}</>
                        }
                    </span>
                    <button
                        onClick={() => navigate('/upgrade')}
                        className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${kasirTxLeft <= 3
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                            } transition-colors`}
                    >
                        Upgrade PRO →
                    </button>
                </div>
            )}

            {/* Stock Alerts (PRO/ULTIMATE only) */}
            {isPlanPro && (lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                <div className="shrink-0 flex flex-col">
                    {outOfStockProducts.length > 0 && (
                        <div className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-b border-red-200 dark:border-red-800 flex items-center justify-between text-sm font-semibold">
                            <span className="flex items-center gap-2">
                                <AlertCircle size={16} /> {outOfStockProducts.length} {t('stock_out_warning') || 'produk sudah habis stok'}
                            </span>
                            <button onClick={() => setShowStockAlert(true)} className="text-xs font-bold px-3 py-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 rounded-full transition-colors">
                                {t('stock_see_detail') || 'Lihat Detail'}
                            </button>
                        </div>
                    )}
                    {lowStockProducts.length > 0 && (
                        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between text-sm font-semibold">
                            <span className="flex items-center gap-2">
                                <AlertCircle size={16} /> {lowStockProducts.length} {t('stock_low_warning') || 'produk hampir habis stoknya'}
                            </span>
                            <button onClick={() => setShowStockAlert(true)} className="text-xs font-bold px-3 py-1 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full transition-colors">
                                {t('stock_see_detail') || 'Lihat Detail'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 lg:overflow-hidden p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:gap-6">

                {/* MOBILE TAB CONTROLS */}
                <div className="flex lg:hidden bg-slate-200 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex justify-center items-center py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'products'
                            ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        {t('kasir_products')}
                    </button>
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'cart'
                            ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        {t('kasir_cart')}
                        {totalCartItems > 0 && (
                            <span className="bg-violet-600 text-white text-[10px] px-2 py-0.5 rounded-full">{totalCartItems}</span>
                        )}
                    </button>
                </div>

                {/* LEFT: PRODUCTS LIST */}
                <div className={`${activeTab === 'products' ? 'flex' : 'hidden'} lg:flex flex-1 h-full flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden`}>
                    {/* Search & Add */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex gap-2">
                        <div className="relative flex-[3]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_or_sku') || 'Cari produk atau ketik SKU...'}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl px-4 flex items-center justify-center transition-colors shadow-sm"
                            title={t('scan_barcode') || 'Scan Barcode'}
                        >
                            <Camera size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/kasir/produk')}
                            className="px-4 py-2.5 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:hover:bg-violet-800/40 text-violet-600 dark:text-violet-400 font-bold rounded-xl text-sm transition-colors flex items-center gap-2 whitespace-nowrap flex-[1] justify-center"
                        >
                            + <span className="hidden sm:inline">{t('kasir_products')}</span>
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
                                <p className="font-medium">{t('kasir_no_products')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => {
                                    const isOutOfStock = product.stock <= 0;
                                    const isLowStock = product.stock > 0 && product.stock <= 10;
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
                                                <div className="flex flex-col items-end gap-1">
                                                    {isOutOfStock ? (
                                                        <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                            {t('stock_status_out') || 'HABIS'}
                                                        </div>
                                                    ) : isLowStock && isPlanPro ? (
                                                        <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                                            {t('stock_status_low') || 'Sisa'} {product.stock}
                                                        </div>
                                                    ) : (
                                                        <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            Stok: {product.stock}
                                                        </div>
                                                    )}
                                                    {product.sku && (
                                                        <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">{product.sku}</span>
                                                    )}
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
                <div className={`${activeTab === 'cart' ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/3 lg:min-w-[320px] flex-1 lg:h-full lg:max-h-[calc(100dvh-130px)] shrink-0 flex-col`}>
                    {/* Keranjang Majoo Style Header */}
                    <div className="bg-slate-800 text-white rounded-t-2xl p-4 flex justify-between items-center shadow-lg relative z-10 shrink-0">
                        <div className="flex items-center gap-2 font-bold">
                            <ShoppingCart size={18} /> {t('kasir_cart')}
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                            {totalCartItems} Item
                        </div>
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-b-2xl shadow-sm border-x border-b border-slate-200 dark:border-slate-700 lg:overflow-hidden -mt-2 pt-2 flex flex-col min-h-0">
                        <Cart
                            cart={cart}
                            onUpdateQty={handleUpdateQty}
                            onRemoveItem={handleRemoveFromCart}
                            onClear={clearCart}
                            onCheckout={() => setIsPaymentOpen(true)}
                            discount={discount}
                            setDiscount={setDiscount}
                            onSaveBill={() => setIsSaveBillOpen(true)}
                            onShowSavedBills={() => { refreshSavedBills(); setIsOpenBillsOpen(true); }}
                            clients={clients}
                            selectedClient={selectedClient}
                            setSelectedClient={setSelectedClient}
                        />
                    </div>
                </div>
            </div>

            {/* Settings Modal (Inline simple modal) */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden my-4" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="font-bold text-lg dark:text-white">{t('kasir_settings')}</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_store_name')}</label>
                                    <input type="text" value={tempSettings.storeName} onChange={e => setTempSettings({ ...tempSettings, storeName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_cashier_name')}</label>
                                    <input type="text" value={tempSettings.kasirName} onChange={e => setTempSettings({ ...tempSettings, kasirName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_logo_url')}</label>
                                    <input type="text" value={tempSettings.logoUrl || ''} onChange={e => setTempSettings({ ...tempSettings, logoUrl: e.target.value })} placeholder="https://..." className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3 rounded-b-2xl">
                                <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">{t('cancel')}</button>
                                <button onClick={() => { updateSettings(tempSettings); setIsSettingsOpen(false); }} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg">{t('save')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                total={Math.max(0, cart.reduce((sum, item) => sum + (item.price * item.qty), 0) - (discount.type === 'persen' ? Math.floor(cart.reduce((sum, item) => sum + (item.price * item.qty), 0) * (discount.value / 100)) : discount.value))}
                onConfirm={handleConfirmPayment}
                isProcessing={isProcessing}
            />

            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                transaction={currentTransaction}
                settings={settings}
            />

            {/* Save Bill Modal */}
            {isSaveBillOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden my-4" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="font-bold text-lg dark:text-white">{t('kasir_save_bill')}</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nama / Meja Pelanggan</label>
                                    <input type="text" value={billCustomerName} onChange={e => setBillCustomerName(e.target.value)} placeholder="Contoh: Meja 4 / Budi" className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white" />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 flex justify-end gap-3 rounded-b-2xl">
                                <button onClick={() => setIsSaveBillOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">{t('cancel')}</button>
                                <button onClick={handleSaveBill} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-lg shadow-amber-500/30">{t('kasir_save_bill')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Open Bills Panel */}
            {isOpenBillsOpen && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsOpenBillsOpen(false)}
                >
                    <div className="flex min-h-full items-end sm:items-center justify-center p-0 pb-20 sm:p-4">
                        <div
                            className="w-full sm:max-w-md bg-white dark:bg-slate-800 sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] my-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-violet-50 dark:bg-violet-900/20 shrink-0">
                                <div>
                                    <h2 className="font-bold text-lg dark:text-white">📋 {t('kasir_open_bills')}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{savedBills.length} {t('kasir_open_bills_hint')}</p>
                                </div>
                                <button onClick={() => setIsOpenBillsOpen(false)} className="text-slate-400 hover:text-red-500 font-bold p-1">✕</button>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                {savedBills.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-4xl mb-2">📋</p>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">{t('kasir_no_sales')}</p>
                                        <p className="text-xs text-slate-400 mt-1">Klik "Simpan Bill" di keranjang untuk menyimpan</p>
                                    </div>
                                ) : (
                                    savedBills.map(bill => (
                                        <div key={bill.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{bill.label || bill.customerName || 'Open Bill'}</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {new Date(bill.savedAt || bill.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleDeleteBill(bill.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium">{(bill.items || bill.cart || []).length} item</span>
                                                    {bill.total > 0 && <span className="ml-2 font-bold text-violet-600">Rp {bill.total.toLocaleString('id-ID')}</span>}
                                                </div>
                                                <button
                                                    onClick={() => handleLoadBill(bill.id)}
                                                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-sm transition-colors"
                                                >
                                                    Load →
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Alert Modal */}
            {showStockAlert && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowStockAlert(false)}>
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] my-4" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                                <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                    <AlertCircle className="text-amber-500" /> {t('stock_alert_title') || 'Peringatan Stok'}
                                </h2>
                                <button onClick={() => setShowStockAlert(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
                                    <div className="text-center py-6 text-slate-500">
                                        <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500" />
                                        <p>{t('stock_alert_empty') || 'Semua stok produk aman'}</p>
                                    </div>
                                )}

                                {outOfStockProducts.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div> Habis Stok ({outOfStockProducts.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {outOfStockProducts.map(p => (
                                                <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{p.emoji}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-md">{t('stock_status_out') || 'HABIS'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {lowStockProducts.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div> Hampir Habis ({lowStockProducts.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {lowStockProducts.map(p => (
                                                <div key={p.id} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{p.emoji}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-md">{t('stock_status_low') || 'Sisa'} {p.stock}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-3 shrink-0">
                                <button onClick={() => setShowStockAlert(false)} className="flex-1 py-2.5 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors">
                                    {t('cancel')}
                                </button>
                                <button onClick={() => navigate('/kasir/produk')} className="flex-1 py-2.5 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-lg shadow-violet-500/30 flex justify-center items-center gap-2">
                                    <Package size={16} /> {t('stock_manage') || 'Kelola Produk'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <UpgradeModal isOpen={!!upgradeFeatureType} onClose={() => setUpgradeFeatureType(null)} featureType={upgradeFeatureType} />
            <ThermalReceipt transaction={currentTransaction} settings={settings} />

            {/* Delete Bill Confirm Modal */}
            {deleteBillConfirm && (
                <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-4" onClick={e => e.stopPropagation()}>
                            <div className="p-6 text-center">
                                <div className="text-4xl mb-3">🗑️</div>
                                <h3 className="font-bold text-lg dark:text-white mb-1">{t('kasir_delete_bill_title')}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{t('kasir_delete_bill_desc')}</p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={() => setDeleteBillConfirm(null)} className="px-5 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors">{t('cancel')}</button>
                                    <button onClick={handleConfirmDeleteBill} className="px-5 py-2 font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">{t('delete')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showLimitModal && <LimitModal plan="PRO" feature="Kasir" onClose={() => setShowLimitModal(false)} />}

            {/* Shift End Confirm Modal */}
            {isEndShiftConfirmOpen && (
                <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6 animate-fade-in-up my-4" onClick={e => e.stopPropagation()}>
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2">{t('shift_end_confirm')}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Pastikan semua transaksi telah selesai sebelum mengakhiri shift.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsEndShiftConfirmOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">{t('cancel')}</button>
                                <button onClick={confirmEndShift} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors">{t('shift_end')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shift Summary Modal */}
            {shiftSummary && (
                <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-4 sm:p-6 animate-fade-in-up my-4" onClick={e => e.stopPropagation()}>
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white mb-1">{t('shift_summary')}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4 sm:mb-6">{shiftSummary.employeeName}</p>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left space-y-2 sm:space-y-3">
                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <span>{t('shift_total_trx')}</span>
                                    <span className="text-base sm:text-lg font-black">{shiftSummary.totalTrx}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <span>{t('shift_total_revenue')}</span>
                                    <span className="text-base sm:text-lg text-emerald-600 font-black">Rp {shiftSummary.totalRevenue.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <button onClick={() => setShiftSummary(null)} className="w-full py-2.5 sm:py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg transition-transform text-sm sm:text-base">
                                {t('close') || 'Tutup'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    onScan={(barcode) => {
                        const product = products.find(
                            p => p.sku && p.sku.toUpperCase() === barcode.toUpperCase()
                        );
                        if (product) {
                            if (product.stock > 0) {
                                handleAddToCart(product);
                                showToast(`${product.name} ${t('barcode_added') || 'ditambahkan ke cart'}`, 'success');
                            } else {
                                showToast(`${product.name} ${t('stock_out_warning') || 'sudah habis stok!'}`, 'error');
                            }
                        } else {
                            showToast(t('barcode_not_found') || `Produk dengan barcode "${barcode}" tidak ditemukan`, 'error');
                        }
                        setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
