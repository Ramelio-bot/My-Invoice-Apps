import { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, BookOpen, Users, FileText, Receipt, Package,
    Tag, ShoppingCart, Calculator, BarChart2, X,
    Zap, HandCoins, Settings2, Store, ChevronDown, Lock, Crown, Shield, LifeBuoy,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import UpgradeModal from './UpgradeModal';
import { supabase } from '../lib/supabase';

// nav_delivery=Tanda Terima, nav_quote=Penawaran Harga, nav_po=Purchase Order
// nav_hpp=Hitung HPP (ULTIMATE), nav_piutang=Hutang Piutang (PRO)
const navItems = [
    { to: '/dashboard', icon: Home, key: 'nav_home', exact: true, level: 'FREE' },
    { to: '/catatan-bisnis', icon: BookOpen, key: 'nav_cashbook', level: 'FREE' },
    { to: '/laporan-kasir', icon: BarChart2, key: 'sidebar_sales_report', level: 'PRO' },
    { to: '/hitung-hpp', icon: Calculator, key: 'nav_hpp', level: 'ULTIMATE' },
    { to: '/laporan', icon: BarChart2, key: 'nav_report', level: 'PRO' },
    { to: '/klien', icon: Users, key: 'nav_clients', level: 'FREE' },
    { to: '/invoice', icon: FileText, key: 'nav_invoice', level: 'FREE' },
    { to: '/kwitansi', icon: Receipt, key: 'nav_receipt', level: 'FREE' },
    { to: '/tanda-terima', icon: Package, key: 'nav_delivery', level: 'FREE' },
    { to: '/penawaran-harga', icon: Tag, key: 'nav_quote', level: 'FREE' },
    { to: '/purchase-order', icon: ShoppingCart, key: 'nav_po', level: 'FREE' },
    { to: '/hutang-piutang', icon: HandCoins, key: 'nav_piutang', level: 'FREE' },
    { to: '/settings', icon: Settings2, key: 'nav_settings', level: 'FREE' },
];

export default function Sidebar({ mobile = false, onClose }) {
    const { t, lang } = useLang();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        getInvoiceCount, getKwitansiCount,
        getHutangPiutangCount, getQuotationCount, getPOCount, getTandaTerimaCount,
        getKasirTransactionCount, getKasirDailyCount, getClientCount, getProductCount, refreshUsage,
        getCashbookCount
    } = usePlan();
    const { 
        user, profile, logout, trialActive, trialDaysLeft, 
        effectivePlan, isAdmin, canStartTrial,
        canAccessReport, canAccessAdvancedKasir
    } = useAuth();
    const navigate = useNavigate();
    const [kasirExpanded, setKasirExpanded] = useState(false);
    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);

    const [collapsed, setCollapsed] = useState(
        () => !mobile && localStorage.getItem('sidebar_collapsed') === 'true'
    );

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebar_collapsed', next);
    };

    const [lowStockCount, setLowStockCount] = useState(0);
    const [outOfStockCount, setOutOfStockCount] = useState(0);
    const [debtAlertCount, setDebtAlertCount] = useState(0);

    // Helpers
    const isPlanPro = isAdmin || effectivePlan === 'pro' || effectivePlan === 'ultimate';
    const isPlanUltimate = isAdmin || effectivePlan === 'ultimate';

    const canAccessItem = (level) => {
        if (!level || level === 'FREE') return true;
        if (level === 'PRO') return isPlanPro;
        if (level === 'ULTIMATE') return isPlanUltimate;
        return true;
    };

    useEffect(() => {
        if (!user) return;

        const fetchDebtAlerts = async () => {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', user.id)
                .in('type', ['piutang', 'hutang'])
                .neq('status', 'paid');

            if (!error && data) {
                let count = 0;

                data
                    .forEach(d => {
                        const due = new Date(d.data?.dueDate || d.data?.due_date || d.created_at);
                        if (due <= threeDaysFromNow) {
                            count++;
                        }
                    });
                setDebtAlertCount(count);
            }
        };

        // Fetch initially
        fetchDebtAlerts();

        // Listen for cashbook-updated events which might mean debts are paid
        window.addEventListener('cashbook-updated', fetchDebtAlerts);
        return () => window.removeEventListener('cashbook-updated', fetchDebtAlerts);

    }, [user]);

    // Auto-expand Kasir menu if on a kasir route
    const location = useLocation();
    useEffect(() => {
        if (location.pathname.startsWith('/kasir')) {
            setKasirExpanded(true);
        }
    }, [location.pathname]);

    const badgeStyle = (level) => ({
        fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
        color: 'white',
        background: level === 'ULTIMATE' ? '#7C3AED' : '#3B82F6',
        marginLeft: 'auto', flexShrink: 0
    });

    const isFree = effectivePlan === 'free' && !isAdmin;

    const kasirTxCount = getKasirTransactionCount();
    const kasirTxLeft = Math.max(0, 50 - kasirTxCount);

    const invoicesCount = getInvoiceCount();
    const kwitansiCount = getKwitansiCount();
    const hpCount = getHutangPiutangCount();
    const quoteCount = getQuotationCount();
    const poCount = getPOCount();
    const ttrCount = getTandaTerimaCount();

    const clientCount = getClientCount();
    const productCount = getProductCount();

    const invoiceText = isFree ? ` (${invoicesCount}/10)` : '';
    const kwitansiText = isFree ? ` (${kwitansiCount}/10)` : '';
    const clientText = isFree ? ` (${clientCount}/5)` : '';
    const productText = isFree ? ` (${productCount}/5)` : '';
    const hpText = isFree ? ` (${hpCount}/10)` : '';
    const quoteText = isFree ? ` (${quoteCount}/5)` : '';
    const poText = isFree ? ` (${poCount}/5)` : '';
    const ttrText = isFree ? ` (${ttrCount}/5)` : '';

    // Add Cashbook text
    const cashbookCount = getCashbookCount ? getCashbookCount() : 0;
    const cashbookText = isFree ? ` (${cashbookCount}/20)` : '';

    useEffect(() => {
        if (!user || (!isPlanPro)) return;
        const fetchStockAlerts = async () => {
            const { count: lowCount } = await supabase
                .from('kasir_products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .lte('stock', 10)
                .gt('stock', 0)
                .eq('is_active', true);

            const { count: outCount } = await supabase
                .from('kasir_products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('stock', 0)
                .eq('is_active', true);

            setLowStockCount(lowCount || 0);
            setOutOfStockCount(outCount || 0);
        };
        fetchStockAlerts();
    }, [user, isPlanPro]);

    const totalAlerts = lowStockCount + outOfStockCount;

    return (
        <div style={{
            width: mobile ? '100%' : (collapsed ? '64px' : '260px'),
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--sidebar-bg, white)',
            borderRight: '1px solid var(--sidebar-border, #E2E8F0)',
            overflow: 'hidden',
            transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
            className="sidebar relative"
        >
            {/* Collapse Toggle Desktop */}
            {!mobile && (
                <button
                    onClick={toggleCollapse}
                    className="hidden lg:flex absolute -right-3 top-20 bg-white border border-slate-200 rounded-full w-6 h-6 items-center justify-center cursor-pointer z-50 text-slate-500 hover:text-violet-600 shadow-sm"
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
                </button>
            )}

            {/* Logo area */}
            <div style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '0' : '0 20px',
                borderBottom: '1px solid #E2E8F0',
                flexShrink: 0,
            }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                    title={collapsed ? "My Invoice" : "Back to Home"}
                >
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <FileText size={16} color="white" strokeWidth={2.5} />
                    </div>
                    {!collapsed && (
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                            My Invoice
                        </span>
                    )}
                </div>
                {/* Admin badge */}
                {isAdmin && !collapsed && (
                    <span style={{
                        fontSize: 10, fontWeight: 800, background: '#7C3AED',
                        color: 'white', borderRadius: 6, padding: '2px 8px',
                        display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap'
                    }}>
                        <Shield size={10} /> ADMIN
                    </span>
                )}
                {mobile && (
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '12px 0' : '12px 12px' }} className="scrollbar-hide">
                {navItems.map(({ to, icon: Icon, key, label, level }) => (
                    <div key={to}>
                        <NavLink
                            to={to}
                            end={to === '/dashboard'}
                            onClick={!canAccessItem(level) ? (e) => {
                                e.preventDefault();
                                if (key === 'nav_hpp') setUpgradeFeatureType('hpp');
                                else setUpgradeFeatureType(level === 'ULTIMATE' ? 'ultimate_locked' : 'report');
                            } : (mobile ? onClose : undefined)}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                gap: collapsed ? 0 : 10,
                                padding: collapsed ? '10px 0' : '10px 12px',
                                borderRadius: collapsed ? 0 : 10,
                                marginBottom: 2,
                                fontSize: 14,
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: canAccessItem(level) ? 1 : 0.65,
                                ...(isActive && canAccessItem(level) ? {
                                    background: collapsed ? '#EDE9FE' : '#EDE9FE',
                                    color: '#7C3AED',
                                    borderLeft: collapsed ? 'none' : '3px solid #7C3AED',
                                    paddingLeft: collapsed ? 0 : 9,
                                    borderRight: collapsed ? '3px solid #7C3AED' : 'none'
                                } : {
                                    color: '#475569',
                                    borderLeft: '3px solid transparent',
                                    paddingLeft: collapsed ? 0 : 9,
                                })
                            })}
                            className="sidebar-link"
                            title={collapsed ? t(key) || label : undefined}
                        >
                            {({ isActive }) => {
                                const isInvoice = key === 'nav_invoice';
                                const isReceipt = key === 'nav_receipt';
                                const isClient = key === 'nav_clients' || key === 'nav_kasir_customers';
                                const isProduk = key === 'nav_kasir_products';
                                const isHP = key === 'nav_piutang';
                                const isTTR = key === 'nav_delivery';
                                const isQuote = key === 'nav_quote';
                                const isPO = key === 'nav_po';
                                const locked = !isAdmin && level !== 'FREE' && 
                                               ((level === 'PRO' && !isPlanPro) || 
                                                (level === 'ULTIMATE' && !isPlanUltimate));

                                return (
                                    <>
                                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                                        {!collapsed && (
                                            <span className="flex-1 truncate">
                                                {key ? t(key) || label : label}
                                                {isInvoice && invoiceText}
                                                {isReceipt && kwitansiText}
                                                {isClient && clientText}
                                                {isProduk && productText}
                                                {isHP && hpText}
                                                {isTTR && ttrText}
                                                {isQuote && quoteText}
                                                {isPO && poText}
                                                {key === 'nav_cashbook' && cashbookText}
                                            </span>
                                        )}
                                        {/* Plan access badge for restricted items */}
                                        {locked && !collapsed && (
                                            <>
                                                <span style={badgeStyle(level)}>{t(`plan_${level.toLowerCase()}`)}</span>
                                                <Lock size={11} style={{ color: level === 'ULTIMATE' ? '#7C3AED' : '#3B82F6', flexShrink: 0 }} />
                                            </>
                                        )}
                                        {/* Plan access badge for unlocked PRO/ULTIMATE items */}
                                        {!locked && level === 'ULTIMATE' && !collapsed && (
                                            <span style={{
                                                fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
                                                color: '#7C3AED', background: '#EDE9FE', flexShrink: 0,
                                                border: '1px solid #C4B5FD'
                                            }}>{t('plan_ultimate')}</span>
                                        )}
                                        {!locked && level === 'PRO' && !collapsed && (
                                            <span style={{
                                                fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
                                                color: '#3B82F6', background: '#EFF6FF', flexShrink: 0,
                                                border: '1px solid #BFDBFE'
                                            }}>{t('plan_pro')}</span>
                                        )}
                                        {/* Soft locks: limits reached */}
                                        {!locked && isInvoice && isFree && !trialActive && invoicesCount >= 10 && !collapsed && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && isReceipt && isFree && !trialActive && kwitansiCount >= 10 && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && isClient && isFree && !trialActive && clientCount >= 5 && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && isProduk && isFree && !trialActive && productCount >= 5 && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && isHP && isFree && !trialActive && hpCount >= 10 && !collapsed && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && (isTTR || isQuote || isPO) && isFree && !trialActive && (
                                            (isTTR && ttrCount >= 5) || (isQuote && quoteCount >= 5) || (isPO && poCount >= 5)
                                        ) && !collapsed && (
                                                <Lock size={12} className="text-amber-500 ml-auto" />
                                            )}
                                        {/* Report lock */}
                                        {!locked && key === 'nav_report' && !canAccessReport() && !trialActive && !collapsed && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                    </>
                                );
                            }}
                        </NavLink>

                        {/* Kasir Dropdown — ditampilkan untuk SEMUA user, dengan keterangan status */}
                        {key === 'nav_cashbook' && (
                            <div style={{ marginBottom: 2 }}>
                                <button
                                    onClick={() => collapsed ? (navigate('/kasir'), setCollapsed(false)) : setKasirExpanded(!kasirExpanded)}
                                    style={{
                                        width: '100%',
                                        display: 'flex', alignItems: 'center', 
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        gap: collapsed ? 0 : 10,
                                        padding: collapsed ? '10px 0' : '10px 12px', borderRadius: collapsed ? 0 : 10,
                                        fontSize: 14, fontWeight: 600,
                                        background: kasirExpanded && !collapsed ? '#F8FAFC' : 'transparent',
                                        color: '#475569', border: 'none', cursor: 'pointer',
                                        borderLeft: '3px solid transparent', paddingLeft: collapsed ? 0 : 9,
                                        transition: 'all 200ms'
                                    }}
                                    className="hover:bg-slate-50"
                                    title={collapsed ? t('nav_kasir') : undefined}
                                >
                                    <Store size={18} strokeWidth={2} className={`${isPlanUltimate ? 'text-purple-600' : isPlanPro ? 'text-blue-500' : 'text-slate-400'} flex-shrink-0`} />
                                    {!collapsed && (
                                        <>
                                            <span className="truncate">{t('nav_kasir')}</span>
                                            {totalAlerts > 0 && isPlanPro && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700,
                                                    background: '#EF4444', color: 'white', borderRadius: 4,
                                                    padding: '1px 5px', marginLeft: 4
                                                }}>
                                                    {totalAlerts}
                                                </span>
                                            )}

                                            {/* Badge status berdasarkan plan */}
                                            {isAdmin ? (
                                                <span style={{
                                                    marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                                                    background: '#7C3AED', color: 'white', borderRadius: 4,
                                                    padding: '2px 6px', marginRight: 4, display: 'flex', alignItems: 'center', gap: 2
                                                }}><Shield size={9} /> ADMIN</span>
                                            ) : isPlanUltimate ? (
                                                <span style={{
                                                    marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                                                    background: '#7C3AED', color: 'white', borderRadius: 4,
                                                    padding: '2px 6px', marginRight: 4, display: 'flex', alignItems: 'center', gap: 2
                                                }}><Crown size={9} /> {t('plan_ultimate')}</span>
                                            ) : isPlanPro ? (
                                                <span style={{
                                                    marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                                                    background: '#3B82F6', color: 'white', borderRadius: 4,
                                                    padding: '2px 6px', marginRight: 4, display: 'flex', alignItems: 'center', gap: 2
                                                }}><Zap size={9} /> {t('plan_pro')}</span>
                                            ) : null}
                                            <ChevronDown size={16} style={{ transition: 'transform 200ms', transform: kasirExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                        </>
                                    )}
                                </button>

                                <div style={{
                                    overflow: 'hidden',
                                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                    maxHeight: (kasirExpanded && !collapsed) ? 1000 : 0,
                                    opacity: (kasirExpanded && !collapsed) ? 1 : 0
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0 4px 34px' }}>
                                        {/* Utama: Transaksi POS — semua user bisa akses tapi dibatasi */}
                                        <NavLink
                                            to="/kasir"
                                            end
                                            onClick={mobile ? onClose : undefined}
                                            style={({ isActive }) => ({
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                                textDecoration: 'none', transition: 'all 200ms',
                                                color: isActive ? '#7C3AED' : '#64748B',
                                                background: isActive ? '#EDE9FE' : 'transparent'
                                            })}
                                            className="hover:text-violet-600"
                                        >
                                            <span>{t('nav_kasir_pos')}</span>
                                            {effectivePlan === 'free' && kasirTxLeft <= 0 && !trialActive && <Lock size={12} className="text-amber-400" />}
                                        </NavLink>

                                        {/* Sub-menu lain — lock sesuai level plan */}
                                        {[
                                            { path: '/kasir/produk', key: 'nav_kasir_products', level: 'FREE' },
                                            { path: '/kasir/gudang', key: 'nav_kasir_gudang', level: 'FREE' },
                                            { path: '/kasir/stok', key: 'nav_kasir_stock', level: 'PRO' },
                                            { path: '/kasir/laporan', key: 'nav_kasir_report', level: 'PRO' },
                                            { path: '/kasir-members', key: 'nav_kasir_members', level: 'ULTIMATE' },
                                            { path: '/kasir/karyawan', key: 'nav_kasir_employees', level: 'PRO' },
                                            { path: '/klien', key: 'nav_kasir_customers', level: 'FREE' },
                                            { path: '/kasir/pengeluaran', key: 'nav_kasir_expenses', level: 'PRO' }
                                        ].map(sub => {
                                            let canAccess = true;
                                            if (sub.level === 'PRO') canAccess = isPlanPro;
                                            if (sub.level === 'ULTIMATE') canAccess = isPlanUltimate;

                                            return (
                                                <div key={sub.path}>
                                                    {canAccess ? (
                                                        <NavLink
                                                            to={sub.path}
                                                            end={sub.path === '/kasir'}
                                                            onClick={mobile ? onClose : undefined}
                                                            style={({ isActive }) => ({
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                                                textDecoration: 'none', transition: 'all 200ms',
                                                                color: isActive ? '#7C3AED' : '#64748B',
                                                                background: isActive ? '#EDE9FE' : 'transparent'
                                                            })}
                                                            className="hover:text-violet-600"
                                                        >
                                                            {t(sub.key)}
                                                        </NavLink>
                                                    ) : (
                                                        <button
                                            onClick={() => setUpgradeFeatureType(sub.level === 'ULTIMATE' ? 'ultimate_locked' : 'advanced_kasir')}
                                                            style={{
                                                                width: '100%', textAlign: 'left',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                                                color: '#94A3B8', background: 'transparent', border: 'none',
                                                                cursor: 'pointer', opacity: 0.7
                                                            }}
                                                        >
                                                            <span>{t(sub.key)} <span style={{ fontSize: 9, background: sub.level === 'ULTIMATE' ? '#7C3AED' : '#F59E0B', color: 'white', padding: '1px 4px', borderRadius: 3, marginLeft: 4 }}>{sub.level}</span></span>
                                                            <Lock size={12} className={sub.level === 'ULTIMATE' ? 'text-violet-500' : 'text-amber-500'} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Prompt upgrade hanya untuk FREE user */}
                                        {effectivePlan === 'free' && !isAdmin && (
                                            <button
                                                onClick={() => navigate('/upgrade')}
                                                style={{
                                                    margin: '6px 0 2px', padding: '7px 12px', borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #7C3AED22, #5B21B611)',
                                                    border: '1px solid #7C3AED44', cursor: 'pointer',
                                                    fontSize: 11, fontWeight: 700, color: '#7C3AED',
                                                    display: 'flex', alignItems: 'center', gap: 6
                                                }}
                                            >
                                                <Crown size={12} /> {t('nav_kasir_upgrade')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Help / Bantuan — pinned to bottom of nav */}
            <div style={{ padding: collapsed ? '0' : '0 12px 8px', flexShrink: 0 }}>
                <NavLink
                    to="/bantuan"
                    onClick={mobile ? onClose : undefined}
                    style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', 
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : 10,
                        padding: collapsed ? '10px 0' : '10px 12px',
                        borderRadius: collapsed ? 0 : 10,
                        fontSize: 14, fontWeight: 600, textDecoration: 'none',
                        transition: 'all 200ms',
                        ...(isActive ? {
                            background: collapsed ? '#EDE9FE' : '#EDE9FE',
                            color: '#7C3AED',
                            borderLeft: collapsed ? 'none' : '3px solid #7C3AED',
                            paddingLeft: collapsed ? 0 : 9,
                            borderRight: collapsed ? '3px solid #7C3AED' : 'none'
                        } : {
                            color: '#475569',
                            borderLeft: '3px solid transparent', paddingLeft: collapsed ? 0 : 9,
                        })
                    })}
                    className="sidebar-link"
                    title={collapsed ? t('nav_help') : undefined}
                >
                    <LifeBuoy size={18} strokeWidth={2} className="flex-shrink-0" />
                    {!collapsed && <span style={{ flex: 1 }}>{t('nav_help')}</span>}
                </NavLink>
            </div>

            {/* Upgrade CTA — hanya untuk FREE user */}
            {!isPlanPro && !collapsed && (
                <div style={{ padding: '12px 16px', flexShrink: 0 }}>
                    <div
                        onClick={() => navigate('/upgrade')}
                        style={{
                            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            {canStartTrial ? (
                                <Zap size={18} color="#FCD34D" fill="#FCD34D" />
                            ) : (
                                <Crown size={18} color="#FCD34D" fill="#FCD34D" />
                            )}
                            <span style={{ fontSize: 13, fontWeight: 900, color: 'white', letterSpacing: '0.3px' }}>
                                {trialActive ? t('upgrade_trial_active') : (canStartTrial ? (lang === 'ID' ? '🔥 AKTIFKAN TRIAL' : '🔥 ACTIVATE TRIAL') : t('sidebar_upgrade_cta'))}
                            </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.4' }}>
                            {trialActive 
                              ? (lang === 'ID' ? `Nikmati fitur PRO selama ${trialDaysLeft} hari lagi.` : `Enjoy PRO features for ${trialDaysLeft} more days.`)
                              : (canStartTrial 
                                  ? (lang === 'ID' ? 'Klik untuk aktifkan 14 hari PRO Gratis!' : 'Click to activate 14 days PRO for Free!')
                                  : (lang === 'ID' ? 'Unlimited produk, laporan & tanpa watermark' : 'Unlimited products, reports & no watermark'))
                            }
                        </p>
                        <div style={{
                            marginTop: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 8,
                            padding: '6px 12px', textAlign: 'center',
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                                {lang === 'ID' ? 'Rp 129.000/bulan' : 'Rp 129,000/month'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Upgrade CTA ICON only when collapsed */}
            {!isPlanPro && collapsed && (
                <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
                    <button 
                        onClick={() => navigate('/upgrade')}
                        style={{ 
                            width: 36, height: 36, borderRadius: 10, 
                            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
                        }}
                        title={t('sidebar_upgrade_cta')}
                    >
                        <Zap size={18} color="#FCD34D" fill="#FCD34D" />
                    </button>
                </div>
            )}

            {/* Footer */}
            <div style={{
                padding: collapsed ? '12px 0' : '12px 20px', 
                fontSize: 10, color: '#94A3B8',
                borderTop: '1px solid #E2E8F0', flexShrink: 0,
                textAlign: 'center',
                whiteSpace: 'nowrap'
            }}>
                {collapsed ? '© 26' : '© 2026 MyInvoice.space'}
            </div>
            <UpgradeModal
                isOpen={!!upgradeFeatureType}
                onClose={() => setUpgradeFeatureType(null)}
                featureType={upgradeFeatureType}
                planType={['hpp', 'ultimate_locked'].includes(upgradeFeatureType) ? 'ULTIMATE' : 'PRO'}
            />
        </div>
    );
}
