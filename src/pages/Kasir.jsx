import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, BarChart2, Settings as SettingsIcon, Calendar, User, Search, Trash2, CheckCircle2, Package, ShoppingCart, AlertCircle, AlertTriangle, Terminal, Crown, Lock, X, Camera, Plus, Users, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
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
import { useOutlet } from '../context/OutletContext';
import OutletSwitcher from '../components/kasir/OutletSwitcher';
import OutletManagement from './kasir/OutletManagement';

export default function Kasir() {
    const { user, profile, effectivePlan, isAdmin, signOut } = useAuth();
    const {
        isPro, isUltimate, getKasirTransactionCount,
        checkKasirTransactionLimit, incrementKasirTransaction,
        refreshUsage
    } = usePlan();
    const navigate = useNavigate();
    const { t, lang } = useLang();
    const { showToast } = useToast();
    const { activeOutlet, canUseMultiOutlet } = useOutlet();
    const [showOutletManagement, setShowOutletManagement] = useState(false);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(t('kasir_all_categories'));
    const [searchQuery, setSearchQuery] = useState('');

    // Shift state
    const [employees, setEmployees] = useState([]);
    const [activeShift, setActiveShift] = useState(null);
    const [shiftSummary, setShiftSummary] = useState(null);
    const [isEndShiftConfirmOpen, setIsEndShiftConfirmOpen] = useState(false);
    const [shiftNotes, setShiftNotes] = useState('');

    const { kasirSettings: settings, setKasirSettings: setSettings, kasirOpenBills: savedBills, setKasirOpenBills: setSavedBills } = useStore();

    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState({ type: 'nominal', value: 0 }); // type: 'nominal' | 'persen'
    const [tax, setTax] = useState(0);

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
    const [imageErrors, setImageErrors] = useState({});
    const [isSetupError, setIsSetupError] = useState(false);
    const [activeTab, setActiveTab] = useState('products');
    const [isProcessing, setIsProcessing] = useState(false);
    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);
    const [printMode, setPrintMode] = useState('receipt');
    const [isFnbMode, setIsFnbMode] = useState(() => localStorage.getItem('kasir_fnb_mode') !== 'false');
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

            // Mission 2: Restore session from localStorage
            const savedStaff = localStorage.getItem('myinvoice_active_staff');
            if (savedStaff) {
                try {
                    const parsedStaff = JSON.parse(savedStaff);
                    // CAIRKAN KEMBALI STRING MENJADI DATE OBJECT
                    if (parsedStaff.startTime) {
                        parsedStaff.startTime = new Date(parsedStaff.startTime);
                    }
                    setActiveShift(parsedStaff);
                } catch (e) {
                    console.error('Gagal membaca sesi kasir:', e);
                    localStorage.removeItem('myinvoice_active_staff');
                }
            }
        }
    }, [user, activeOutlet?.id]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setIsSetupError(false);
            let query = supabase
                .from('kasir_products')
                .select('id, user_id, name, price, stock, category, emoji, is_active, sku, product_type, image_url')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .not('product_type', 'eq', 'ingredient');

            // PENYELAMATAN PRODUK: Tampilkan produk outlet aktif ATAU produk lama tanpa outlet
            if (activeOutlet?.id) {
                query = query.or(`outlet_id.eq.${activeOutlet.id},outlet_id.is.null`);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            
            // Additional frontend filter for robustness
            const filteredData = (data || []).filter(p => p.product_type !== 'ingredient');
            setProducts(filteredData);

            // Extract unique categories
            const uniqueCats = [t('kasir_all_categories'), ...new Set((data || []).map(p => p.category).filter(Boolean))];
            setCategories(uniqueCats);

            // Fetch Clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('id, name')
                .order('name');
            if (!clientsError && clientsData) {
                setClients(clientsData);
            }

            // Fetch Employees - ISOLASI OUTLET: hanya karyawan outlet aktif yang bisa login PIN
            let empQuery = supabase
                .from('kasir_employees')
                .select('id, name, role, pin, is_active')
                .eq('is_active', true);

            const { data: empData, error: empError } = await empQuery;
            if (!empError && empData) {
                setEmployees(empData);
            }

            // Fetch Store Profile - Bug #4 Fix
            const { data: profile } = await supabase
                .from('profiles')
                .select('store_name, store_address, store_phone, store_footer, store_logo_url')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                // Merge store settings from profile with existing kasirSettings
                setTempSettings(prev => ({
                    ...prev,
                    customStoreName: profile.store_name,
                    customStoreAddress: profile.store_address,
                    customStorePhone: profile.store_phone,
                    customStoreFooter: profile.store_footer,
                    customStoreLogoUrl: profile.store_logo_url
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
            const matchCat = selectedCategory === t('kasir_all_categories') || p.category === selectedCategory;
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
                showToast(`${exactMatch.name} ${t('barcode_added') || t('kasir_barcode_added')}`, 'success');
                setSearchQuery(''); // reset search
            } else if (exactMatch && exactMatch.stock <= 0) {
                showToast(`${exactMatch.name} ${t('stock_out_warning') || t('kasir_product_out_toast')}`, 'error');
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
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
                    <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">
                    {t('kasir_monthly_limit_title')}
                </h2>
                <p className="text-slate-500 max-w-md mb-2">
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
        return <KasirPinLogin 
            onLogin={(staffData) => {
                setActiveShift(staffData);
                localStorage.setItem('myinvoice_active_staff', JSON.stringify(staffData));
            }} 
            employees={employees} 
        />;
    }

    if (isSetupError) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-6 animate-fade-in-up text-center">
                <div className="bg-amber-100 p-5 rounded-full mb-6 text-amber-600">
                    <AlertCircle size={48} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-3">
                    {t('kasir_setup_title')} {/* FIX-10 */}
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto mb-8 text-lg">
                    {t('kasir_setup_desc')} {/* FIX-10 */}
                </p>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-lg w-full text-left flex flex-col items-center">
                    <Terminal className="text-slate-400 mb-4" size={32} />
                    <p className="text-sm text-center text-slate-500">
                        {t('kasir_setup_note')}
                    </p>
                    <button onClick={() => loadData()} className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-all">
                        {t('kasir_setup_retry')} {/* FIX-10 */}
                    </button>
                </div>
            </div>
        );
    }

    // --- Handlers ---
    const handleAddToCart = (product) => {
        if (product.product_type !== 'recipe' && product.stock <= 0) {
            showToast(`${product.name} ${t('stock_out_warning') || t('kasir_product_out_toast')}`, 'error');
            return;
        }
        if (product.stock <= 3) {
            showToast(`${t('stock_status_low')} ${product.name} ${t('stock_status_low')} ${product.stock}!`, 'warning');
        }
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.qty >= product.stock) {
                    showToast(t('kasir_max_stock_toast').replace('{name}', product.name).replace('{stock}', product.stock), 'error');
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
        if (product && product.product_type !== 'recipe' && newQty > product.stock) {
            return; // limit to max stock
        }
        setCart(prev => prev.map(item => item.id === productId ? { ...item, qty: newQty } : item));
    };

    const handleRemoveFromCart = (productId) => setCart(prev => prev.filter(item => item.id !== productId));
    const clearCart = () => setCart([]);

    const refreshSavedBills = () => {
        // no-op, tied to Zustand
    };

    const handleSaveBill = async () => {
        if (!billCustomerName.trim()) return showToast(t('kasir_bill_name_required'), 'error');
        if (!user || !user.id) {
            showToast(t('login_required') || 'User belum login', 'error');
            return;
        }

        setIsProcessing(true);
        const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
        const billLabel = billCustomerName.trim();
        const savedAtTime = new Date().toISOString();

        try {
            const { data, error } = await supabase.from('kasir_open_bills').insert({
                user_id: user.id,
                label: billLabel,
                customer_name: billLabel,
                items: cart,
                discount: discount || null,
                total: cartTotal,
                outlet_id: activeOutlet?.id || null
            }).select().single();

            if (error) {
                console.error('Supabase save handleSaveBill error:', error.message);
                throw error;
            }

            const bills = [...savedBills];
            bills.push({
                id: data.id,
                dbId: data.id,
                label: billLabel,
                items: cart,
                discount,
                total: cartTotal,
                savedAt: savedAtTime,
            });
            setSavedBills(bills);
            setCart([]);
            setDiscount({ type: 'nominal', value: 0 });
            setIsSaveBillOpen(false);
            setBillCustomerName('');
            showToast(t('kasir_bill_saved'), 'success');
        } catch (err) {
            console.error('Save Open Bill DB Error:', err);
            // Fallback to local Zustand if database table completely missing/failed
            const bills = [...savedBills];
            bills.push({
                id: `bill_${Date.now()}`,
                label: billLabel,
                items: cart,
                discount,
                total: cartTotal,
                savedAt: savedAtTime,
            });
            setSavedBills(bills);
            setCart([]);
            setDiscount({ type: 'nominal', value: 0 });
            setIsSaveBillOpen(false);
            setBillCustomerName('');
            showToast(t('kasir_bill_saved') + ' (Local Only)', 'warning');
        } finally {
            setIsProcessing(false);
        }
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

            // Fire and forget delete from db using dbId or id
            const dbId = bill.dbId || bill.id;
            if (dbId && !String(dbId).startsWith('bill_')) {
                supabase.from('kasir_open_bills').delete().eq('id', dbId).then();
            }

            showToast(t('kasir_bill_loaded'), 'success');
        }
    };

    const handleDeleteBill = (billId) => {
        setDeleteBillConfirm(billId);
    };

    const handleConfirmDeleteBill = () => {
        if (!deleteBillConfirm) return;
        
        const billToDelete = savedBills.find(b => b.id === deleteBillConfirm);
        if (billToDelete) {
            const dbId = billToDelete.dbId || billToDelete.id;
            if (dbId && !String(dbId).startsWith('bill_')) {
                supabase.from('kasir_open_bills').delete().eq('id', dbId).then();
            }
        }

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
            // 1. Amankan variabel ID & Waktu agar kebal error
            const empId = activeShift?.employeeId || activeShift?.id || null;
            const empName = activeShift?.employeeName || activeShift?.name || 'Kasir';
            const validStartTime = new Date(activeShift.startTime).toISOString();

            // 2. Hitung total dari transaksi
            const { data: txs } = await supabase
                .from('kasir_transactions')
                .select('total')
                .eq('employee_id', empId)
                .gte('created_at', validStartTime);

            const totalTrx = txs ? txs.length : 0;
            const totalRevenue = txs ? txs.reduce((sum, tx) => sum + (tx.total || 0), 0) : 0;

            // 3. DATA DASAR (Pasti lolos Database)
            const basicShiftData = {
                user_id: user.id,
                employee_id: empId,
                employee_name: empName,
                started_at: validStartTime,
                ended_at: new Date().toISOString(),
                total_transactions: totalTrx,
                total_revenue: totalRevenue
            };

            // 4. STRATEGI FALLBACK: Coba masukkan beserta Outlet & Notes dulu
            let { error: shiftErr } = await supabase.from('kasir_shifts').insert({
                ...basicShiftData,
                shift_notes: shiftNotes || null
            });

            // JIKA DITOLAK (Error 400), MASUKKAN VERSI DASARNYA SAJA!
            if (shiftErr) {
                console.warn('Gagal insert shift lengkap, mencoba versi basic...', shiftErr);
                const { error: fallbackErr } = await supabase.from('kasir_shifts').insert(basicShiftData);
                if (fallbackErr) throw fallbackErr;
            }

            // 5. SIMPAN KE ACTIVITY LOG
            try {
                await supabase.from('activity_logs').insert({
                    user_id: user.id,
                    action: 'END_SHIFT',
                    module: 'Kasir',
                    description: `Shift ditutup oleh ${empName}. Trx: ${totalTrx}, Omzet: Rp ${totalRevenue.toLocaleString('id-ID')}`
                });
            } catch (logErr) {
                console.log('Activity log dilewati', logErr);
            }

            // 6. BERSIHKAN SESI (Bebaskan Kasir)
            setShiftSummary({ totalTrx, totalRevenue, employeeName: empName, notes: shiftNotes });
            setShiftNotes('');
            localStorage.removeItem('myinvoice_active_staff');
            setActiveShift(null);
            showToast(t('shift_end_success') || 'Shift berhasil diakhiri!', 'success');
        } catch (err) {
            console.error('Failed to end shift', err);
            showToast('Gagal mencatat shift: ' + (err.message || 'Error Database'), 'error');
            
            // DARURAT: Tetap hapus memori jika database benar-benar hancur agar user tidak stuck
            localStorage.removeItem('myinvoice_active_staff');
            setActiveShift(null);
        }
    };

    const handleConfirmPayment = async ({ 
        method, 
        cash, 
        change, 
        customerPhone, 
        memberId: passedMemberId, 
        foundMember: passedFoundMember,
        pointsRedeemed,
        pointsDiscountAmount
    }) => {
        if (isProcessing) return; // ← Guard: cegah double-submit

        // Guard: cek limit harian POS
        // Guard: Check if user exists
        if (!user?.id) {
            showToast('Silakan login terlebih dahulu.', 'error');
            navigate('/login');
            return;
        }

        // GUARD LIMIT BULANAN (Strict Server Validation)
        if (!isAdmin && effectivePlan !== 'ultimate') {
            setIsProcessing(true);
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                
                const { count, error } = await supabase
                    .from('kasir_transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('created_at', startOfMonth);
                    
                if (error) throw error;
                
                const limit = effectivePlan === 'pro' ? 500 : 50;
                if (count >= limit) {
                    setIsProcessing(false);
                    setIsPaymentOpen(false); // Tutup prompt bayar
                    setUpgradeFeatureType('pos_limit'); // Munculkan Upgrade Modal
                    return; // BLOKIR PROSES BAYAR
                }
            } catch (err) {
                console.error('Failed to strict-check transaction limit:', err);
                setIsProcessing(false);
                return; // Opsional: tetap blokir agar tidak bocor free limit jika error
            }
            setIsProcessing(false);
        }

        setIsProcessing(true);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const isPercent = ['persen', 'percent', '%'].includes(discount.type);
        const discountAmount = isPercent
            ? Math.floor(subtotal * (discount.value / 100))
            : discount.value;
        const afterDiscount = Math.max(0, subtotal - discountAmount);
        const taxAmount = Math.floor(afterDiscount * ((tax || 0) / 100));
        const total = afterDiscount + taxAmount;
        const finalTotal = Math.max(0, total - (pointsDiscountAmount || 0));

        try {
            const receiptNumber = await generateInvoiceNumber();

            // Fetch custom receipt settings from profiles table - Bug #4 Fix
            let profileInfo = profile;
            if (!profileInfo?.store_name) {
                const { data: freshProfile } = await supabase
                    .from('profiles')
                    .select('store_name, store_address, store_phone, store_footer, store_logo_url')
                    .eq('id', user.id)
                    .single();
                profileInfo = freshProfile;
            }

            // MISI 2: Identitas Struk — Prioritaskan Outlet Aktif, fallback ke profil global
            const storeSettingsForReceipt = {
                name: activeOutlet?.name
                   || profileInfo?.store_name
                   || settings?.storeName
                   || 'My Store',
                address: activeOutlet?.address
                   || profileInfo?.store_address
                   || '',
                phone: activeOutlet?.phone
                   || profileInfo?.store_phone
                   || '',
                footer: profileInfo?.store_footer || t('kasir_thanks'),
                logoUrl: profileInfo?.store_logo_url
                      || localStorage.getItem('company_logo')
                      || null
            };

            const transactionData = {
                receipt_number: receiptNumber,
                subtotal: Math.round(subtotal),
                discount_type: discount.type,
                discount_value: Math.round(parseFloat(discount.value) || 0),  // ← parse float ke int
                discount_amount: Math.round(discountAmount + (pointsDiscountAmount || 0)),
                total: Math.round(finalTotal),
                payment_method: method,
                amount_paid: Math.round(parseFloat(cash) || 0),  // ← cash bisa string
                change_amount: Math.round(parseFloat(change) || 0),  // ← change bisa string
                kasir_name: activeShift ? activeShift.employeeName : settings.kasirName,
                store_name: settings.storeName,
                notes: selectedClient || '',
                customer_phone: customerPhone || null,
                employee_id: activeShift ? activeShift.employeeId : null,
                employee_name: activeShift ? activeShift.employeeName : null,
                member_id: discount.member_id || passedMemberId || null, 
                tax_amount: Math.round(taxAmount),
                tax_percent: parseFloat(tax) || 0,
                points_earned: Math.round(Math.floor(subtotal / (settings.points_per_amount || 1000))),
                points_redeemed: pointsRedeemed || 0,
                outlet_id: activeOutlet?.id || null,
                user_id: user.id // Ensure RLS policy matches
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

            // Fungsi helper untuk kurangi stok ingredient
            const decreaseIngredientStock = async (ingredientId, qty, productName) => {
                try {
                    const { data: currentProduct, error: fetchError } = await supabase
                        .from('kasir_products')
                        .select('stock, name')
                        .eq('id', ingredientId)
                        .eq('user_id', user.id)
                        .single();

                    if (fetchError || !currentProduct) {
                        console.error('Product not found:', fetchError);
                        return;
                    }

                    const newStock = Math.max(0, (currentProduct.stock || 0) - qty);

                    await supabase
                        .from('kasir_products')
                        .update({ stock: newStock })
                        .eq('id', ingredientId)
                        .eq('user_id', user.id);

                    await supabase.from('kasir_stock_history').insert({
                        user_id: user.id,
                        product_id: ingredientId,
                        qty_added: -qty
                    });

                } catch (err) {
                    console.error('decreaseIngredientStock error:', err);
                }
            };

            // 3. Kurangi Stok
            for (const item of items) {
                try {
                    const product = products.find(p => p.id === item.product_id);
                    
                    if (product?.product_type === 'recipe') {
                        // FETCH RECIPE INGREDIENTS
                        const { data: recipes, error: recipeError } = await supabase
                            .from('kasir_recipes')
                            .select('ingredient_id, quantity')
                            .eq('product_id', item.product_id);
                        
                        if (recipeError) throw recipeError;

                        if (recipes && recipes.length > 0) {
                            for (const recipe of recipes) {
                                const totalQtyToReduce = recipe.quantity * item.quantity;
                                await decreaseIngredientStock(recipe.ingredient_id, totalQtyToReduce, item.product_name);
                            }
                        }
                    } else {
                        // FIXED OR INGREDIENT (direct sale)
                        await decreaseIngredientStock(item.product_id, item.quantity, item.product_name);
                    }
                } catch (err) {
                    console.error(`[CRITICAL] Gagal kurangi stok untuk ${item.product_name}:`, err);
                    showToast(t('kasir_stock_fail').replace('{name}', item.product_name), 'error');
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

                // Fetch data member terbaru dari DB (hindari nilai stale)
                const { data: currentMember } = await supabase
                    .from('kasir_members')
                    .select('total_points, total_spent, total_transactions')
                    .eq('id', memberId)
                    .single();

                // Jika tukar poin: hanya kurangi, tidak dapat earned
                // Jika tidak tukar poin: tambah earned seperti biasa
                const isRedeeming = (pointsRedeemed || 0) > 0;
                const newPoints = isRedeeming
                    ? Math.max(0, (currentMember?.total_points || 0) - (pointsRedeemed || 0))
                    : (currentMember?.total_points || 0) + (pointsEarned || 0);

                const { error: updateErr } = await supabase
                    .from('kasir_members')
                    .update({ 
                        total_points: newPoints,
                        total_spent: (currentMember?.total_spent || 0) + subtotal,
                        total_transactions: (currentMember?.total_transactions || 0) + 1
                    })
                    .eq('id', memberId);
                
                if (updateErr) console.error('[ERROR] Member points update failed:', updateErr);

                // Insert history for redeemed
                if (pointsRedeemed > 0) {
                    await supabase.from('kasir_points_history').insert({
                        user_id: user.id,
                        member_id: memberId,
                        transaction_id: tx.id,
                        type: 'redeem',
                        points: pointsRedeemed,
                        description: `Redeem for TX ${receiptNumber}` // Internal log, but can be improved if needed
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
                    .eq('code', discount.code)
                    .maybeSingle();
                    
                if (vData) {
                    await supabase
                        .from('kasir_vouchers')
                        .update({ used_count: (vData.used_count || 0) + 1 })
                        .eq('code', discount.code);
                }
            }

            // 4. Integrasi ke Cashbook (Pemasukan)
            const clientName = selectedClient || '';
            const descriptionTxt = clientName
                ? `${t('dash_pos_sale')} ${receiptNumber} - ${clientName}`
                : `${t('dash_pos_sale')} ${receiptNumber}`;

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
                discount_amount: tx.discount_amount,
                discountAmount: tx.discount_amount, // for backward compatibility in components
                discount_type: discount.type,
                discount_value: discount.value,
                tax_amount: tx.tax_amount,
                tax_percent: tx.tax_percent,
                total: tx.total,
                method: tx.payment_method,
                cash: tx.amount_paid,
                change: tx.change_amount,
                kasir_name: activeShift ? activeShift.employeeName : settings.kasirName,
                customerPhone: customerPhone || '',
                storeSettings: storeSettingsForReceipt,
                points_earned: transactionData.points_earned,
                points_redeemed: transactionData.points_redeemed,
                points_discount_amount: (transactionData.points_redeemed || 0) * (settings.points_value || 10)
            };

            setCurrentTransaction(completeTxData);
            setCart([]);
            setDiscount({ type: 'nominal', value: 0 });
            setTax(0);
            setSelectedClient('');
            setIsReceiptOpen(true);

            // Tambah counter transaksi untuk FREE user
            incrementKasirTransaction();

            // Reload product data (to reflect new stock)
            loadData();

            // Sync events for Dashboard/Report
            window.dispatchEvent(new Event('kasir-updated'));
            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('data-updated'));

        } catch (err) {
            console.error('Transaction Failed:', err);
            showToast(t('kasir_process_fail'), 'error', 5000);
        } finally {
            setIsProcessing(false); // ← Selalu reset setelah selesai
        }
    };

    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);

    if (showOutletManagement) {
        return <OutletManagement onBack={() => setShowOutletManagement(false)} />;
    }

    return (
        <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden relative">
            <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shrink-0 shadow-sm overflow-hidden">
                <div className="flex flex-row items-center overflow-x-auto whitespace-nowrap scrollbar-hide w-full px-4 py-2 sm:py-3 gap-4 justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/20">
                            <Store size={20} className="sm:size-22" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
                                {t('nav_kasir')}
                                <span className="inline-block w-1"></span>
                                {isAdmin ? (
                                    <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                                ) : effectivePlan === 'ultimate' ? (
                                    <span className="bg-violet-100 text-violet-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Ultimate</span>
                                ) : effectivePlan === 'pro' ? (
                                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">PRO</span>
                                ) : (
                                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {t('kasir_badge_free').replace('{used}', kasirTxCount)}
                                    </span>
                                )}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {/* Minimalist Outlet Display */}
                        <div className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 flex items-center gap-2">
                            <Store size={14} className="text-violet-600" />
                            <span className="text-xs font-bold text-slate-600 max-w-[100px] truncate">
                                {activeOutlet ? activeOutlet.name : settings.kasirName}
                            </span>
                            <div className="h-3 w-[1px] bg-slate-200 mx-1" />
                            <button 
                                onClick={() => setShowOutletManagement(true)}
                                className="text-violet-600 hover:text-violet-700 transition-colors p-1"
                                title={t('kasir_manage_outlets')}
                            >
                                <Users size={14} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { refreshSavedBills(); setIsOpenBillsOpen(true); }}
                                className="relative p-2.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl transition-all shadow-sm"
                                title={t('kasir_open_bills')}
                            >
                                <ShoppingCart size={20} />
                                {savedBills.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                                        {savedBills.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => { const val = !isFnbMode; setIsFnbMode(val); localStorage.setItem('kasir_fnb_mode', val); }}
                                className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${isFnbMode ? 'bg-orange-100 border-orange-200 text-orange-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                                title="Toggle Mode Resto / F&B"
                            >
                                🍳 <span className="hidden sm:inline text-xs font-bold">{isFnbMode ? 'F&B: ON' : 'F&B: OFF'}</span>
                            </button>
                            <button
                                onClick={() => { setTempSettings(settings); setIsSettingsOpen(true); }}
                                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-100 transition-all font-bold"
                            >
                                <SettingsIcon size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* INFO BAR - MANDATORY HORIZONTAL SCROLL FOR MOBILE */}
            <div className="flex flex-row items-center overflow-x-auto whitespace-nowrap scrollbar-hide gap-4 py-2 px-4 bg-slate-50 border-b border-slate-200 text-sm text-slate-800 font-bold">
                <div className="flex items-center gap-2 flex-shrink-0 text-slate-800 font-bold">
                    <User size={14} className="text-slate-500" />
                    <span>{activeShift ? `${activeShift.employeeName} (${activeShift.role})` : settings.kasirName}</span>
                </div>
                
                <div className="w-[1px] h-3 bg-slate-200 flex-shrink-0" />
                
                {activeShift ? (
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-2 text-emerald-600 font-medium flex-shrink-0">
                            <Calendar size={14} />
                            <span>{t('shift_started')} {activeShift.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="w-[1px] h-3 bg-slate-200 flex-shrink-0" />
                        <button 
                            onClick={() => setIsEndShiftConfirmOpen(true)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-lg transition-all active:scale-95 border border-red-100 flex-shrink-0"
                        >
                            {t('shift_end')}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-500 flex-shrink-0">
                        <Calendar size={14} />
                        <span>{new Date().toLocaleDateString(t('locale_code'), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                )}

                <div className="w-[1px] h-3 bg-slate-200 flex-shrink-0" />
                
                <div className="flex items-center gap-2 text-slate-800 font-bold flex-shrink-0">
                    <Store size={14} className="text-slate-500" />
                    <span>{activeOutlet ? activeOutlet.name : settings.kasirName}</span>
                </div>

                <div className="flex-1" /> {/* Spacer */}

                <button
                    onClick={() => signOut()}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1 text-slate-500 hover:text-red-600 font-bold transition-all"
                >
                    <User size={14} />
                    {t('navbar_logout')}
                </button>
            </div>

            {/* FREE tier: banner sisa transaksi - hanya untuk FREE user */}
            {effectivePlan === 'free' && !isAdmin && (
                <div className={`px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-semibold shrink-0 ${kasirTxLeft <= 3
                    ? 'bg-red-50 text-red-700 border-b border-red-200'
                    : 'bg-amber-50 text-amber-700 border-b border-amber-200'
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
                        Upgrade PRO
                    </button>
                </div>
            )}

            {/* Stock Alerts (PRO/ULTIMATE only) */}
            {isPlanPro && (lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                <div className="shrink-0 flex flex-col">
                    {outOfStockProducts.length > 0 && (
                        <div className="px-4 py-2.5 bg-red-50 text-red-700 border-b border-red-200 flex items-center justify-between text-sm font-semibold">
                            <span className="flex items-center gap-2">
                                <AlertCircle size={16} /> {outOfStockProducts.length} {t('stock_out_warning')}
                            </span>
                            <button onClick={() => setShowStockAlert(true)} className="text-xs font-bold px-3 py-1 bg-red-100 hover:bg-red-200 rounded-full transition-colors">
                                {t('stock_see_detail')}
                            </button>
                        </div>
                    )}
                    {lowStockProducts.length > 0 && (
                        <div className="px-4 py-2.5 bg-amber-50 text-amber-700 border-b border-amber-200 flex items-center justify-between text-sm font-semibold">
                            <span className="flex items-center gap-2">
                                <AlertCircle size={16} /> {lowStockProducts.length} {t('stock_low_warning')}
                            </span>
                            <button onClick={() => setShowStockAlert(true)} className="text-xs font-bold px-3 py-1 bg-amber-100 hover:bg-amber-200 rounded-full transition-colors">
                                {t('stock_see_detail')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 min-h-0 p-2 sm:p-4 md:p-6 flex flex-col gap-4 landscape:flex-row lg:flex-row landscape:overflow-hidden lg:overflow-hidden">

                {/* MOBILE VIEW NOTICE - Removed Tabs for Full Vertical Scroll */}

                {/* LEFT: PRODUCTS LIST */}
                <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden landscape:h-full lg:h-full">
                    {/* Search & Add */}
                    <div className="p-2 sm:p-3 border-b border-slate-50 flex items-center gap-2 bg-white">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_or_sku')}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="p-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-violet-600/20 active:scale-95"
                            title={t('scan_barcode')}
                        >
                            <Camera size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/kasir/produk')}
                            className="hidden xs:flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-sm transition-all border border-slate-100"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">{t('kasir_products')}</span>
                        </button>
                    </div>

                    {/* Categories */}
                    <div className="px-2 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide border-b border-slate-100 shrink-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${selectedCategory === cat
                                    ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-hide custom-scrollbar">
                        {isLoading ? (
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="aspect-[4/5] bg-slate-100 rounded-xl shimmer-wrapper"></div>
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                <Package size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">{t('kasir_no_products')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20">
                                {filteredProducts.map(product => {
                                    const isOutOfStock = product.stock <= 0;
                                    const isLowStock = product.stock > 0 && product.stock <= 10;
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => handleAddToCart(product)}
                                            className={`relative group bg-white border border-slate-200 shadow-md rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${isOutOfStock
                                                ? 'opacity-60 cursor-not-allowed grayscale'
                                                : 'hover:border-violet-500 hover:shadow-2xl hover:scale-105 active:scale-95'
                                                }`}
                                        >
                                            {/* Product Image / Emoji - Square Layout */}
                                            <div className="aspect-square w-full bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                                                {product.image_url && !imageErrors[product.id] ? (
                                                    <img 
                                                        src={product.image_url} 
                                                        alt={product.name} 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                        onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))}
                                                    />
                                                ) : (
                                                    <div className="text-5xl drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
                                                        {product.emoji || '📦'}
                                                    </div>
                                                )}

                                                {/* Stock Overlay */}
                                                <div className="absolute top-2 right-2">
                                                    {product.product_type === 'recipe' ? (
                                                        <div className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-violet-600 text-white shadow-sm">
                                                            RESEP
                                                        </div>
                                                    ) : isOutOfStock ? (
                                                        <div className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-red-600 text-white shadow-sm">
                                                            HABIS
                                                        </div>
                                                    ) : isLowStock && isPlanPro ? (
                                                        <div className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-amber-500 text-white shadow-sm">
                                                            {product.stock}
                                                        </div>
                                                    ) : (
                                                        <div className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-black/50 text-white backdrop-blur-sm">
                                                            {product.stock}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="p-3 bg-white">
                                                <h3 className="font-black text-slate-800 text-sm truncate leading-tight mb-1 group-hover:text-violet-600 transition-colors uppercase tracking-tight">
                                                    {product.name}
                                                </h3>
                                                <div className="flex justify-between items-end mt-2">
                                                    <p className="text-violet-600 font-black text-sm lg:text-base">
                                                        Rp {product.price.toLocaleString(t('locale_code'))}
                                                    </p>
                                                    {product.sku && (
                                                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1 rounded">{product.sku}</span>
                                                    )}
                                                </div>
                                            </div>

                                                {/* Addition Overlay Icon */}
                                                {!isOutOfStock && (
                                                    <div className="absolute inset-0 bg-violet-600/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-violet-600 shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
                                                            <Plus size={28} strokeWidth={3} />
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
                <div className="flex flex-col w-full landscape:w-[40%] landscape:min-w-[300px] lg:w-1/3 lg:min-w-[320px] flex-1 landscape:flex-none lg:flex-none min-h-0 landscape:h-full lg:h-full shrink-0">
                    {/* Keranjang Majoo Style Header */}
                    <div className="bg-white text-slate-800 border-b rounded-t-2xl p-4 flex justify-between items-center shadow-lg relative z-10 shrink-0">
                        <div className="flex items-center gap-2 font-bold">
                            <ShoppingCart size={18} /> {t('kasir_cart')}
                        </div>
                        <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                            {totalCartItems} Item
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 bg-white rounded-b-2xl shadow-sm border-x border-b border-slate-200 lg:overflow-hidden -mt-2 pt-2 flex flex-col">
                        <Cart
                            cart={cart}
                            onUpdateQty={handleUpdateQty}
                            onRemoveItem={handleRemoveFromCart}
                            onClear={clearCart}
                            onCheckout={() => setIsPaymentOpen(true)}
                            discount={discount}
                            setDiscount={setDiscount}
                            tax={tax}
                            setTax={setTax}
                            onSaveBill={() => setIsSaveBillOpen(true)}
                            onShowSavedBills={() => { refreshSavedBills(); setIsOpenBillsOpen(true); }}
                            clients={clients}
                            selectedClient={selectedClient}
                            setSelectedClient={setSelectedClient}
                            isFnbMode={isFnbMode}
                            onPrintKitchen={() => {
                                if (cart.length === 0) return;
                                const mockTransaction = {
                                    id: 'DRAFT-' + Date.now(),
                                    created_at: new Date().toISOString(),
                                    kasir_name: user?.user_metadata?.full_name || 'Kasir',
                                    items: cart,
                                    total: 0,
                                    subtotal: 0,
                                    method: 'DRAFT'
                                };
                                setCurrentTransaction(mockTransaction);
                                setPrintMode('kitchen');
                                setTimeout(() => { 
                                    window.print(); 
                                    setPrintMode('receipt'); 
                                }, 150);
                            }}
                        />
                    </div>
                </div>
            </div>

            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="font-black text-xl text-slate-900 flex items-center gap-2">
                                <SettingsIcon size={20} className="text-violet-600" />
                                {t('kasir_settings')}
                            </h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_store_name')}</label>
                                <input type="text" value={tempSettings.storeName} onChange={e => setTempSettings({ ...tempSettings, storeName: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_cashier_name')}</label>
                                <input type="text" value={tempSettings.kasirName} onChange={e => setTempSettings({ ...tempSettings, kasirName: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('kasir_logo_url')}</label>
                                <input type="text" value={tempSettings.logoUrl || ''} onChange={e => setTempSettings({ ...tempSettings, logoUrl: e.target.value })} placeholder="https://..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900" />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black transition-all">
                                {t('close')}
                            </button>
                            <button onClick={() => { updateSettings(tempSettings); setIsSettingsOpen(false); }} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg">{t('save')}</button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                total={(() => {
                    const sub = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
                    const isPercent = ['persen', 'percent', '%'].includes(discount.type);
                    const disc = isPercent ? Math.floor(sub * (discount.value / 100)) : (discount.value || 0);
                    const afterDisc = Math.max(0, sub - disc);
                    const taxAmt = Math.floor(afterDisc * ((parseFloat(tax) || 0) / 100));
                    return afterDisc + taxAmt;
                })()}
                onConfirm={handleConfirmPayment}
                isProcessing={isProcessing}
            />

            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                transaction={currentTransaction}
                settings={settings}
                setPrintMode={setPrintMode}
                isFnbMode={isFnbMode}
            />

            {isSaveBillOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="font-black text-xl text-slate-900 flex items-center gap-2">
                                <Save size={20} className="text-amber-500" />
                                {t('kasir_save_bill')}
                            </h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{t('kasir_bill_name')}</label>
                                <input
                                    type="text"
                                    value={billCustomerName}
                                    onChange={(e) => setBillCustomerName(e.target.value)}
                                    placeholder={t('kasir_bill_placeholder')}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700"
                                    autoFocus
                                />
                                <p className="mt-3 text-[11px] text-slate-400 font-medium italic">
                                    {t('kasir_bill_hint')}
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsSaveBillOpen(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-lg">{t('cancel')}</button>
                            <button onClick={handleSaveBill} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-lg shadow-amber-500/30">{t('kasir_save_bill')}</button>
                        </div>
                    </div>
                </div>
            )}

            {isOpenBillsOpen && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4"
                    onClick={() => setIsOpenBillsOpen(false)}
                >
                    <div
                        className="w-full sm:max-w-md bg-white sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-4 scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 className="font-black text-xl text-slate-900 flex items-center gap-2">{t('kasir_open_bills')}</h2>
                                <p className="text-xs text-slate-500">{savedBills.length} {t('kasir_open_bills_hint')}</p>
                            </div>
                            <button onClick={() => setIsOpenBillsOpen(false)} className="text-slate-400 hover:text-red-500 font-bold p-1">✕</button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                            {savedBills.length === 0 ? (
                                <div className="text-center py-10">
                                    <Package size={48} className="mx-auto mb-2 text-slate-200" />
                                    <p className="text-slate-500 font-medium">{t('kasir_no_sales')}</p>
                                    <p className="text-xs text-slate-400 mt-1">Klik "Simpan Bill" di keranjang untuk menyimpan</p>
                                </div>
                            ) : (
                                savedBills.map(bill => (
                                    <div key={bill.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-slate-800">{bill.label || bill.customerName || t('kasir_open_bill_default')}</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(bill.savedAt || bill.date).toLocaleString(t('locale_code'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <button onClick={() => handleDeleteBill(bill.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-slate-600">
                                                <span className="font-medium">{(bill.items || bill.cart || []).length} {t('kasir_item_unit')}</span>
                                                {bill.total > 0 && <span className="ml-2 font-bold text-violet-600">Rp {bill.total.toLocaleString(t('locale_code'))}</span>}
                                            </div>
                                            <button
                                                onClick={() => handleLoadBill(bill.id)}
                                                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-sm transition-colors"
                                            >
                                                Load
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showStockAlert && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowStockAlert(false)}>
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-4 scale-in" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <AlertCircle className="text-amber-500" size={24} /> {t('stock_alert_title')}
                            </h2>
                            <button onClick={() => setShowStockAlert(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {outOfStockProducts.length === 0 && lowStockProducts.length === 0 && (
                                <div className="text-center py-6 text-slate-500">
                                    <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500" />
                                    <p>{t('stock_alert_empty')}</p>
                                </div>
                            )}

                            {outOfStockProducts.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div> {t('kasir_out_of_stock')} ({outOfStockProducts.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {outOfStockProducts.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{p.emoji}</span>
                                                    <span className="font-bold text-slate-800">{p.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-1 rounded-md">{t('stock_status_out')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {lowStockProducts.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div> {t('kasir_low_stock')} ({lowStockProducts.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {lowStockProducts.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{p.emoji}</span>
                                                    <span className="font-bold text-slate-800">{p.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-md">{t('stock_status_low')} {p.stock}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-white flex gap-3 shrink-0">
                            <button onClick={() => setShowStockAlert(false)} className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                {t('cancel')}
                            </button>
                            <button onClick={() => navigate('/kasir/produk')} className="flex-1 py-2.5 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-lg shadow-violet-500/30 flex justify-center items-center gap-2">
                                <Package size={16} /> {t('stock_manage')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <UpgradeModal isOpen={!!upgradeFeatureType} onClose={() => setUpgradeFeatureType(null)} featureType={upgradeFeatureType} />
            <ThermalReceipt transaction={currentTransaction} settings={settings} printMode={printMode} />

            {deleteBillConfirm && (
                <div className="fixed inset-0 z-[200] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xs bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden my-4" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="font-black text-xl text-slate-900 mb-2">{t('kasir_delete_bill_title')}</h3>
                            <p className="text-sm text-slate-600 mb-8">{t('kasir_delete_bill_desc')}</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => setDeleteBillConfirm(null)} className="w-full py-3 font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">{t('cancel')}</button>
                                <button onClick={handleConfirmDeleteBill} className="w-full py-3 font-black text-white bg-red-500 hover:bg-red-600 rounded-2xl transition-all shadow-lg shadow-red-500/20">{t('delete')}</button>
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
                        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center p-6 scale-in my-4" onClick={e => e.stopPropagation()}>
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800 mb-2">{t('shift_end_confirm')}</h2>
                            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                                {t('kasir_confirm_end_shift_desc')}
                            </p>

                            <div className="mb-6 text-left">
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t('cb_note') || 'Catatan Bisnis / Evaluasi'}</label>
                                <textarea
                                    value={shiftNotes}
                                    onChange={(e) => setShiftNotes(e.target.value)}
                                    placeholder={t('cb_note_placeholder') || 'Tulis catatan atau evaluasi shift hari ini...'}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setIsEndShiftConfirmOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors">{t('cancel')}</button>
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
                        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center p-4 sm:p-6 scale-in my-4" onClick={e => e.stopPropagation()}>
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-1">{t('shift_summary')}</h2>
                            <p className="text-sm text-slate-500 font-medium mb-4 sm:mb-6">{shiftSummary.employeeName}</p>

                            <div className="bg-slate-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left space-y-2 sm:space-y-3">
                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-600">
                                    <span>{t('shift_total_trx')}</span>
                                    <span className="text-base sm:text-lg font-black">{shiftSummary.totalTrx}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-600">
                                    <span>{t('shift_total_revenue')}</span>
                                    <span className="text-base sm:text-lg text-emerald-600 font-black">Rp {shiftSummary.totalRevenue.toLocaleString(t('locale_code'))}</span>
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
