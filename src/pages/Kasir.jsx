import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, BarChart2, Settings as SettingsIcon, Calendar, User, Search, Trash2, CheckCircle2, Package, ShoppingCart, AlertCircle, AlertTriangle, Terminal, Crown, Lock, X, Camera, Plus, Users, Save, Maximize2, Minimize2 } from 'lucide-react';
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
import { addToOfflineQueue } from '../utils/offlineQueue';

export default function Kasir() {
    const { user, profile, effectivePlan, isAdmin, signOut } = useAuth();
    const {
        getKasirTransactionCount,
        incrementKasirTransaction,
        currentLimits
    } = usePlan();
    const navigate = useNavigate();
    const { t } = useLang();
    const { showToast } = useToast();
    const { activeOutlet } = useOutlet();

    // --- 1. STATES ---
    const [showOutletManagement, setShowOutletManagement] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(t('kasir_all_categories'));
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState([]);
    const [activeShift, setActiveShift] = useState(null);
    const [shiftSummary, setShiftSummary] = useState(null);
    const [isEndShiftConfirmOpen, setIsEndShiftConfirmOpen] = useState(false);
    const [shiftNotes, setShiftNotes] = useState('');
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState({ type: 'nominal', value: 0 });
    const [tax, setTax] = useState(0);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSaveBillOpen, setIsSaveBillOpen] = useState(false);
    const [isOpenBillsOpen, setIsOpenBillsOpen] = useState(false);
    const [billCustomerName, setBillCustomerName] = useState('');
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState({});
    const [isSetupError, setIsSetupError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);
    const [printMode, setPrintMode] = useState('receipt');
    const [isFnbMode, setIsFnbMode] = useState(() => localStorage.getItem('kasir_fnb_mode') !== 'false');
    const [deleteBillConfirm, setDeleteBillConfirm] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showStockAlert, setShowStockAlert] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(24);
    const [totalCount, setTotalCount] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isCartVisible, setIsCartVisible] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // --- 2. REFS & ZUSTAND ---
    const cartRef = useRef(null);
    const { kasirSettings: settings, setKasirSettings: setSettings, kasirOpenBills: savedBills, setKasirOpenBills: setSavedBills, isZenMode, setIsZenMode } = useStore();
    const [tempSettings, setTempSettings] = useState(settings);

    // --- 3. MEMOS ---
    const isPlanPro = useMemo(() => effectivePlan === 'pro' || effectivePlan === 'ultimate' || isAdmin, [effectivePlan, isAdmin]);

    const lowStockProducts = useMemo(() => {
        if (!isPlanPro) return [];
        return products.filter(p => p.stock > 0 && p.stock <= 10);
    }, [products, isPlanPro]);

    const outOfStockProducts = useMemo(() => {
        if (!isPlanPro) return [];
        return products.filter(p => p.stock <= 0);
    }, [products, isPlanPro]);

    const totalPrice = useMemo(() => {
        const sub = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const isPercent = ['persen', 'percent', '%'].includes(discount.type);
        const disc = isPercent ? Math.floor(sub * (discount.value / 100)) : (discount.value || 0);
        const afterDisc = Math.max(0, sub - disc);
        const taxAmt = Math.floor(afterDisc * ((parseFloat(tax) || 0) / 100));
        return (afterDisc + taxAmt) || 0;
    }, [cart, discount, tax]);

    // --- 4. CALLBACKS (HANDLERS) ---
    const updateSettings = useCallback((newSettings) => {
        setSettings(newSettings);
    }, [setSettings]);

    const loadData = useCallback(async (isInitial = false) => {
        if (!user) return;
        try {
            if (isInitial) {
                setIsInitialLoading(true);
                setIsLoading(true);
            }
            setIsSetupError(false);
            
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('id, name')
                .order('name');
            if (!clientsError && clientsData) setClients(clientsData);

            const { data: empData, error: empError } = await supabase
                .from('kasir_employees')
                .select('id, name, role, pin, is_active')
                .eq('is_active', true);
            if (!empError && empData) setEmployees(empData);

            const { data: catData } = await supabase
                .from('kasir_products')
                .select('category')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .not('product_type', 'eq', 'ingredient');
            
            if (catData) {
                const uniqueCats = [t?.('kasir_all_categories') || 'Semua', ...new Set(catData.map(p => p.category).filter(Boolean))];
                setCategories(uniqueCats);
            }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('store_name, store_address, store_phone, store_footer, store_logo_url')
                .eq('id', user.id)
                .maybeSingle();

            if (profileData) {
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
            console.error('Failed to load initial data', err);
            if (err.code === '42P01' || err.message?.includes('does_not_exist')) {
                setIsSetupError(true);
            }
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
        }
    }, [user, t]);

    const loadProducts = useCallback(async () => {
        if (!user) return;
        try {
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('kasir_products')
                .select('id, user_id, name, price, stock, category, emoji, is_active, sku, product_type, image_url', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('is_active', true)
                .not('product_type', 'eq', 'ingredient');

            if (activeOutlet?.id) {
                query = query.or(`outlet_id.eq.${activeOutlet.id},outlet_id.is.null`);
            }

            if (selectedCategory !== t('kasir_all_categories')) {
                query = query.eq('category', selectedCategory);
            }

            if (debouncedSearch) {
                query = query.ilike('name', `%${debouncedSearch}%`);
            }

            const { data, error, count } = await query
                .order('name')
                .range(from, to);

            if (error) throw error;
            
            setProducts(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Failed to load products', err);
        }
    }, [user, currentPage, pageSize, activeOutlet, selectedCategory, debouncedSearch, t]);

    const handleAddToCart = useCallback((product) => {
        if (product.product_type !== 'recipe' && product.stock <= 0) {
            showToast(`${product.name} ${t('kasir_product_out_toast')}`, 'error');
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
    }, [showToast, t]);

    const handleUpdateQty = useCallback((productId, newQty) => {
        if (newQty <= 0) {
            setCart(prev => prev.filter(item => item.id !== productId));
            return;
        }
        const product = products.find(p => p.id === productId);
        if (product && product.product_type !== 'recipe' && newQty > product.stock) {
            return;
        }
        setCart(prev => prev.map(item => item.id === productId ? { ...item, qty: newQty } : item));
    }, [products]);

    const handleRemoveFromCart = useCallback((productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    const handleSaveBill = useCallback(async () => {
        if (!billCustomerName.trim()) return showToast(t('kasir_bill_name_required'), 'error');
        if (!user?.id) {
            showToast(t('login_required'), 'error');
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

            if (error) throw error;

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
            showToast(`${t('kasir_bill_saved')} (${t('kasir_offline_mode')})`, 'warning');
        } finally {
            setIsProcessing(false);
        }
    }, [billCustomerName, cart, user, discount, activeOutlet, savedBills, setSavedBills, showToast, t]);

    const handleLoadBill = useCallback((billId) => {
        const bills = [...savedBills];
        const bill = bills.find(b => b.id === billId);
        if (bill) {
            setCart(bill.items || bill.cart || []);
            if (bill.discount) setDiscount(bill.discount);
            const updatedBills = bills.filter(b => b.id !== billId);
            setSavedBills(updatedBills);
            setIsOpenBillsOpen(false);

            const dbId = bill.dbId || bill.id;
            if (dbId && !String(dbId).startsWith('bill_')) {
                supabase.from('kasir_open_bills').delete().eq('id', dbId).then();
            }

            showToast(t('kasir_bill_loaded'), 'success');
        }
    }, [savedBills, setSavedBills, showToast, t]);

    const handleDeleteBill = useCallback((billId) => {
        setDeleteBillConfirm(billId);
    }, []);

    const handleConfirmDeleteBill = useCallback(() => {
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
    }, [deleteBillConfirm, savedBills, setSavedBills]);

    const confirmEndShift = useCallback(async () => {
        setIsEndShiftConfirmOpen(false);
        if (!activeShift || !user) return;
        try {
            const empId = activeShift?.employeeId || activeShift?.id || null;
            const empName = activeShift?.employeeName || activeShift?.name || 'Kasir';
            const validStartTime = new Date(activeShift.startTime).toISOString();

            const { data: txs } = await supabase
                .from('kasir_transactions')
                .select('total')
                .eq('employee_id', empId)
                .gte('created_at', validStartTime);

            const totalTrx = txs ? txs.length : 0;
            const totalRevenue = txs ? txs.reduce((sum, tx) => sum + (tx.total || 0), 0) : 0;

            const basicShiftData = {
                user_id: user.id,
                employee_id: empId,
                employee_name: empName,
                started_at: validStartTime,
                ended_at: new Date().toISOString(),
                total_transactions: totalTrx,
                total_revenue: totalRevenue
            };

            let { error: shiftErr } = await supabase.from('kasir_shifts').insert({
                ...basicShiftData,
                shift_notes: shiftNotes || null
            });

            if (shiftErr) {
                const { error: fallbackErr } = await supabase.from('kasir_shifts').insert(basicShiftData);
                if (fallbackErr) throw fallbackErr;
            }

            try {
                await supabase.from('activity_logs').insert({
                    user_id: user.id,
                    action: 'END_SHIFT',
                    module: 'Kasir',
                    description: `${t('kasir_shift_closed_by')} ${empName}. ${t('kasir_trx_label')}: ${totalTrx}, ${t('kasir_revenue_label')}: Rp ${totalRevenue.toLocaleString('id-ID')}`
                });
            } catch (err) {
                console.error('Log failure ignored:', err);
            }

            setShiftSummary({ totalTrx, totalRevenue, employeeName: empName, notes: shiftNotes });
            setShiftNotes('');
            localStorage.removeItem('myinvoice_active_staff');
            setActiveShift(null);
            showToast(t('shift_end_success'), 'success');
        } catch (err) {
            console.error('Failed to end shift', err);
            showToast(`${t('kasir_shift_fail')}: ` + (err.message || t('kasir_db_fail')), 'error');
            localStorage.removeItem('myinvoice_active_staff');
            setActiveShift(null);
        }
    }, [activeShift, user, shiftNotes, t, showToast]);

    const handleConfirmPayment = useCallback(async ({ 
        method, 
        cash,
        change,
        customerPhone, 
        memberId: passedMemberId, 
        pointsRedeemed,
        pointsDiscountAmount
    }) => {
        if (isProcessing || !user?.id) return;

        if (!isAdmin && effectivePlan !== 'ultimate') {
            setIsProcessing(true);
            try {
                const { data: serverTs } = await supabase.rpc('get_server_timestamp');
                const now = serverTs ? new Date(serverTs) : new Date();
                const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
                
                const { count, error } = await supabase
                    .from('kasir_transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('status', 'paid')
                    .gte('created_at', startOfMonth);
                    
                if (error) throw error;
                
                const limit = currentLimits?.kasir || 200;
                if (count >= limit) {
                    setIsProcessing(false);
                    setIsPaymentOpen(false);
                    setUpgradeFeatureType('pos_limit');
                    return;
                }
            } catch (err) {
                console.error('Failed to check transaction limit:', err);
                setIsProcessing(false);
                return;
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

        if (!navigator.onLine) {
            const saleData = {
                p_items: cart.map(item => ({
                    product_id: item.id,
                    qty: Math.round(item.qty || 0),
                    price: Math.round(item.price || 0),
                    name: item.name
                })),
                p_total: Math.round(finalTotal || 0),
                p_subtotal: Math.round(subtotal || 0),
                p_payment_method: method,
                p_user_id: user.id,
                p_outlet_id: activeOutlet?.id || null
            };

            const offlineId = addToOfflineQueue(saleData);
            if (offlineId) {
                showToast(t('kasir_offline_saved') || 'Transaksi Disimpan Offline (Antrean)', 'warning');
                const mockReceiptNumber = `OFF-${Date.now().toString().slice(-6)}`;
                const storeSettingsForReceipt = {
                    name: activeOutlet?.name || profile?.store_name || settings?.storeName || 'My Store',
                    address: activeOutlet?.address || profile?.store_address || '',
                    phone: activeOutlet?.phone || profile?.store_phone || '',
                    footer: profile?.store_footer || t('kasir_thanks'),
                    logoUrl: profile?.store_logo_url || localStorage.getItem('company_logo') || null
                };

                const completeTxData = {
                    id: mockReceiptNumber,
                    date: new Date().toISOString(),
                    items: cart,
                    subtotal: Math.round(subtotal),
                    discount_amount: Math.round(discountAmount + (pointsDiscountAmount || 0)),
                    discountAmount: Math.round(discountAmount + (pointsDiscountAmount || 0)),
                    discount_type: discount.type,
                    discount_value: discount.value,
                    tax_amount: Math.floor(Math.max(0, subtotal - (discountAmount || 0)) * ((tax || 0) / 100)),
                    tax_percent: tax,
                    total: Math.round(finalTotal),
                    method: method,
                    cash: cash || 0,
                    change: change || 0,
                    kasir_name: activeShift ? activeShift.employeeName : settings.kasirName,
                    customerPhone: customerPhone || '',
                    storeSettings: storeSettingsForReceipt,
                    points_earned: settings.loyalty_enabled ? Math.round(Math.floor(subtotal / (settings.points_per_amount || 1000))) : 0,
                    points_redeemed: pointsRedeemed || 0,
                    points_discount_amount: (pointsRedeemed || 0) * (settings.points_value || 10),
                    isOffline: true
                };

                setCurrentTransaction(completeTxData);
                setCart([]);
                setDiscount({ type: 'nominal', value: 0 });
                setTax(0);
                setSelectedClient('');
                setIsReceiptOpen(true);
                setIsPaymentOpen(false);
                setIsProcessing(false);
                return;
            }
        }

        try {
            const transactionData = {
                p_items: cart.map(item => ({
                    product_id: item.id,
                    qty: Math.round(item.qty || 0),
                    price: Math.round(item.price || 0),
                    name: item.name
                })),
                p_total: Math.round(finalTotal || 0),
                p_subtotal: Math.round(subtotal || 0),
                p_payment_method: method,
                p_user_id: user.id,
                p_outlet_id: activeOutlet?.id || null
            };

            const { data: rpcData, error: rpcError } = await supabase.rpc('process_sale', transactionData);
            if (rpcError) throw rpcError;
            
            const tx = Array.isArray(rpcData) ? rpcData[0] : rpcData;
            const receiptNumber = tx.receipt_number;

            let profileInfo = profile;
            if (!profileInfo?.store_name) {
                const { data: freshProfile } = await supabase
                    .from('profiles')
                    .select('store_name, store_address, store_phone, store_footer, store_logo_url')
                    .eq('id', user.id)
                    .single();
                profileInfo = freshProfile;
            }

            const storeSettingsForReceipt = {
                name: activeOutlet?.name || profileInfo?.store_name || settings?.storeName || 'My Store',
                address: activeOutlet?.address || profileInfo?.store_address || '',
                phone: activeOutlet?.phone || profileInfo?.store_phone || '',
                footer: profileInfo?.store_footer || t('kasir_thanks'),
                logoUrl: profileInfo?.store_logo_url || localStorage.getItem('company_logo') || null
            };

            const earnedPoints = settings.loyalty_enabled 
                ? Math.round(Math.floor(subtotal / (settings.points_per_amount || 1000))) 
                : 0;

            const memberId = passedMemberId;
            if (memberId) {
                const pointsRedeemedValue = pointsRedeemed || 0;
                const { data: currentMember } = await supabase
                    .from('kasir_members')
                    .select('total_points, total_spent, total_transactions')
                    .eq('id', memberId)
                    .single();

                const isRedeeming = (pointsRedeemedValue || 0) > 0;
                const newPoints = isRedeeming
                    ? Math.max(0, (currentMember?.total_points || 0) - (pointsRedeemedValue || 0))
                    : (currentMember?.total_points || 0) + (earnedPoints || 0);

                await supabase
                    .from('kasir_members')
                    .update({ 
                        total_points: newPoints,
                        total_spent: (currentMember?.total_spent || 0) + subtotal,
                        total_transactions: (currentMember?.total_transactions || 0) + 1
                    })
                    .eq('id', memberId);
                
                if (pointsRedeemedValue > 0) {
                    await supabase.from('kasir_points_history').insert({
                        user_id: user.id,
                        member_id: memberId,
                        transaction_id: tx.id,
                        type: 'redeem',
                        points: pointsRedeemedValue,
                        description: `Redeem for TX ${receiptNumber}`
                    });
                }
                
                if (earnedPoints > 0 && !isRedeeming) {
                    await supabase.from('kasir_points_history').insert({
                        user_id: user.id,
                        member_id: memberId,
                        transaction_id: tx.id,
                        type: 'earn',
                        points: earnedPoints,
                        description: `Earned from TX ${receiptNumber}`
                    });
                }
            }

            if (discount.code) {
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

            setIsPaymentOpen(false);

            const completeTxData = {
                id: tx?.receipt_number || tx?.id || `TX-${Date.now()}`,
                receipt_number: tx?.receipt_number || tx?.id || `TX-${Date.now()}`,
                date: tx?.created_at || new Date().toISOString(),
                items: cart,
                subtotal: tx?.subtotal || tx?.p_subtotal || subtotal || 0,
                discount_amount: tx?.discount_amount || tx?.p_discount_amount || (discountAmount + (pointsDiscountAmount || 0)) || 0,
                discountAmount: tx?.discount_amount || tx?.p_discount_amount || (discountAmount + (pointsDiscountAmount || 0)) || 0,
                discount_type: discount?.type || 'none',
                discount_value: discount?.value || 0,
                tax_amount: tx?.tax_amount || tx?.v_tax_amount || taxAmount || 0,
                tax_percent: tax || 0,
                total: tx?.total || tx?.p_total || finalTotal || 0,
                method: tx?.payment_method || tx?.p_payment_method || method,
                cash: tx?.amount_paid || tx?.v_cash_received || cash || 0,
                change: tx?.change_amount || tx?.v_change_amount || change || 0,
                kasir_name: activeShift ? activeShift.employeeName : settings.kasirName,
                customerPhone: customerPhone || '',
                storeSettings: storeSettingsForReceipt,
                points_earned: earnedPoints,
                points_redeemed: pointsRedeemed || 0,
                points_discount_amount: (pointsRedeemed || 0) * (settings.points_value || 10)
            };

            setCurrentTransaction(completeTxData);
            setCart([]);
            setDiscount({ type: 'nominal', value: 0 });
            setTax(0);
            setSelectedClient('');
            setIsReceiptOpen(true);
            incrementKasirTransaction();
            
            try {
                await supabase.from('cashbook').insert({
                    user_id: user.id,
                    type: 'income',
                    amount: Math.round(finalTotal || 0),
                    description: 'Penjualan - ' + tx.receipt_number,
                    reference_id: tx.id,
                    reference_type: 'kasir_sale',
                    outlet_id: activeOutlet?.id || null
                });
            } catch (syncErr) {
                console.error('Cashbook sync error:', syncErr);
            }

            loadData(false);
            window.dispatchEvent(new Event('kasir-updated'));
            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('Transaction Failed:', err);
            showToast(t('kasir_process_fail') || 'Gagal memproses transaksi.', 'error', 5000);
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, user, isAdmin, effectivePlan, currentLimits, cart, discount, tax, activeOutlet, profile, t, showToast, activeShift, settings, incrementKasirTransaction, loadData]);

    // --- 5. EFFECTS ---
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        loadData(true);
    }, [loadData]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsCartVisible(entry.isIntersecting),
            { threshold: 0.1 }
        );
        if (cartRef.current) observer.observe(cartRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                setShowScanner(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);    // Handle category translation sync
    const lastTAllCats = useRef(t('kasir_all_categories'));
    useEffect(() => {
        const currentAllCats = t('kasir_all_categories');
        if (selectedCategory === lastTAllCats.current) {
            setSelectedCategory(currentAllCats);
        }
        lastTAllCats.current = currentAllCats;
    }, [t, selectedCategory]);

    useEffect(() => {
        const handleRefresh = () => loadData();
        window.addEventListener('kasir-updated', handleRefresh);
        return () => window.removeEventListener('kasir-updated', handleRefresh);
    }, [loadData]);
    const refreshSavedBills = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from('kasir_open_bills').select('*').eq('user_id', user.id);
            if (!error && data) {
                setSavedBills(data.map(b => ({
                    ...b,
                    dbId: b.id,
                    label: b.label || b.customer_name || 'Bill',
                    savedAt: b.created_at
                })));
            }
        } catch (err) {
            console.error('Failed to refresh open bills', err);
        }
    }, [user, setSavedBills]);

    const kasirTxCount = getKasirTransactionCount();
    const kasirTxLeft = Math.max(0, (currentLimits?.kasir || 200) - kasirTxCount);
    const isKasirLocked = !isAdmin && effectivePlan !== 'ultimate' && kasirTxCount >= (currentLimits?.kasir || 200);
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
                    onClick={() => setUpgradeFeatureType('kasir')}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black shadow-lg shadow-violet-200 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Crown size={20} />
                    {t('upgrade_now')}
                </button>
            </div>
        );
    }

    if (!activeShift && employees.length > 0 && !isInitialLoading) {
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
                    {t('kasir_setup_title')}
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto mb-8 text-lg">
                    {t('kasir_setup_desc')}
                </p>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-lg w-full text-left flex flex-col items-center">
                    <Terminal className="text-slate-400 mb-4" size={32} />
                    <p className="text-sm text-center text-slate-500">
                        {t('kasir_setup_note')}
                    </p>
                    <button onClick={() => loadData()} className="mt-6 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-all">
                        {t('kasir_setup_retry')}
                    </button>
                </div>
            </div>
        );
    }


    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);

    if (showOutletManagement) {
        return <OutletManagement onBack={() => setShowOutletManagement(false)} />;
    }

    return (
        <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden relative pb-40">
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
                                    <span className="hidden sm:inline-block bg-violet-100 text-violet-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Ultimate</span>
                                ) : effectivePlan === 'pro' ? (
                                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">PRO</span>
                                ) : null}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {/* Minimalist Outlet Display */}
                        <div className="bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-100 flex items-center gap-2">
                            <Store size={14} className="text-violet-600" />
                            <span className="text-[10px] sm:text-xs font-bold text-slate-600 max-w-[70px] sm:max-w-[100px] truncate">
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
                                title={t('kasir_settings')}
                            >
                                <SettingsIcon size={20} />
                            </button>
                            <button
                                onClick={() => setIsZenMode(!isZenMode)}
                                className={`p-2.5 ${isZenMode ? 'bg-violet-600 text-white animate-pulse' : 'bg-white/80 backdrop-blur text-slate-600 border border-slate-100'} rounded-full shadow-lg transition-all hover:scale-110 active:scale-95`}
                                title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
                            >
                                {isZenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* INFO BAR - MANDATORY HORIZONTAL SCROLL FOR MOBILE */}
            <div className={`${isZenMode ? 'hidden' : 'flex'} flex-row items-center overflow-x-auto whitespace-nowrap scrollbar-hide gap-4 py-2 px-4 bg-slate-50 border-b border-slate-200 text-sm text-slate-800 font-bold transition-all`}>
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
                            className="px-2 py-0.5 sm:px-3 sm:py-1 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-lg transition-all active:scale-95 border border-red-100 flex-shrink-0 text-[10px] sm:text-xs"
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
                
                <div className="hidden md:flex items-center gap-2 text-slate-800 font-bold flex-shrink-0">
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
                        { (currentLimits?.kasir || 200) - kasirTxCount > 0
                            ? <>{t('kasir_limit_msg').replace('{remaining}', (currentLimits?.kasir || 200) - kasirTxCount)}</>
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

            <div className="flex-1 min-h-0 p-2 sm:p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:overflow-hidden">

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
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setCurrentPage(1);
                                }}
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
                        ) : products.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                                <Package size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">{t('kasir_no_products')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20">
                                {products.map(product => {
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

                            {/* [MISSION F5] Pagination UI for Kasir Grid */}
                            {!isLoading && totalCount > pageSize && (
                                <div className="flex items-center justify-between gap-4 mt-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="text-xs text-slate-500 font-bold">
                                        {currentPage} / {Math.ceil(totalCount / pageSize)}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 text-slate-700 transition-all"
                                        >
                                            ⬅️
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                                            className="p-2 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50 text-slate-700 transition-all"
                                        >
                                            ➡️
                                        </button>
                                    </div>
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT: CART */}
                <div ref={cartRef} className="flex flex-col w-full landscape:w-[40%] landscape:min-w-[300px] lg:w-1/3 lg:min-w-[320px] flex-1 landscape:flex-none lg:flex-none min-h-0 landscape:h-full lg:h-full shrink-0 order-last lg:order-none">
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
                                
                                const itemsForKitchen = cart.filter(item => 
                                    (item.category === 'Makanan' || item.category_id === 'Makanan') || 
                                    (item.category === 'Minuman' || item.category_id === 'Minuman')
                                );
                                
                                if (itemsForKitchen.length > 0) {
                                    const mockTransaction = {
                                        id: 'DRAFT-' + Date.now(),
                                        created_at: new Date().toISOString(),
                                        kasir_name: user?.user_metadata?.full_name || 'Kasir',
                                        items: itemsForKitchen,
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
                                } else {
                                    showToast('Tidak ada menu dapur untuk dicetak', 'info');
                                }
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
                total={totalPrice || 0}
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
            {/* Floating Mobile Cart Bar */}
            {cart.length > 0 && !isCartVisible && (
                <div className="md:hidden landscape:hidden fixed bottom-24 left-4 right-4 bg-violet-600 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center z-[60] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold opacity-80 uppercase tracking-wider">{cart.length} {t('kasir_items')}</span>
                        <span className="text-lg font-black tracking-tight">Rp {(totalPrice || 0).toLocaleString(t('locale_code') || 'id-ID')}</span>
                    </div>
                    <button 
                        onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-5 py-2.5 bg-white text-violet-600 font-black rounded-xl text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                    >
                        {t('kasir_review_order')} <ShoppingCart size={16} />
                    </button>
                </div>
            )}
            {/* Floating Toggle Zen Mode 2.0 */}
            <button
                onClick={() => setIsZenMode(!isZenMode)}
                className={`fixed z-[100] transition-all duration-300 active:scale-90 ${isZenMode ? 'top-4 right-4 bg-slate-800 text-white p-3 rounded-full shadow-lg' : 'bottom-28 right-4 bg-white text-slate-800 border shadow-lg p-3 rounded-full'}`}
            >
                {isZenMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button>
        </div>
    );
}
