import { useState, useEffect, Fragment } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, BookOpen, Users, FileText, Receipt, Package,
    Tag, ShoppingCart, Calculator, BarChart2, X,
    Zap, HandCoins, Settings2, Store, ChevronDown, Lock, Crown, Shield, LifeBuoy,
    ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';

import UpgradeModal from './UpgradeModal';
import { supabase } from '../lib/supabase';
import { useWorkspaceMode } from '../utils/workspaceMode';

// nav_delivery=Tanda Terima, nav_quote=Penawaran Harga, nav_po=Purchase Order
// nav_hpp=Hitung HPP (ULTIMATE), nav_piutang=Hutang Piutang (PRO)
// Extra docs sub-items (Surat Jalan, Penawaran Harga, Purchase Order)
const extraDocsItems = [
    { to: '/tanda-terima', icon: Package, key: 'nav_delivery', level: 'FREE' },
    { to: '/penawaran-harga', icon: Tag, key: 'nav_quote', level: 'FREE' },
    { to: '/purchase-order', icon: ShoppingCart, key: 'nav_po', level: 'FREE' },
];

// Structured navigation sections
const navSections = [
    {
        titleKey: 'nav_section_ops',
        items: [
            { to: '/dashboard', icon: Home, key: 'nav_home', exact: true, level: 'FREE' },
            { to: '/catatan-bisnis', icon: BookOpen, key: 'nav_cashbook', level: 'FREE' },
        ]
    },
    {
        titleKey: 'nav_section_docs',
        items: [
            { to: '/invoice', icon: FileText, key: 'nav_invoice', level: 'FREE' },
            { to: '/kwitansi', icon: Receipt, key: 'nav_receipt', level: 'FREE' },
        ]
    },
    {
        titleKey: 'nav_section_finance',
        items: [
            { to: '/hutang-piutang', icon: HandCoins, key: 'nav_piutang', level: 'FREE' },
            { to: '/klien', icon: Users, key: 'nav_clients', level: 'FREE' },
        ]
    },
    {
        titleKey: 'nav_section_analytics',
        items: [
            { to: '/laporan', icon: BarChart2, key: 'nav_report', level: 'PRO' },
            { to: '/hitung-hpp', icon: Calculator, key: 'nav_hpp', level: 'ULTIMATE' },
        ]
    },
    {
        titleKey: null,
        items: [
            { to: '/settings', icon: Settings2, key: 'nav_settings', level: 'FREE' },
        ]
    }
];

export default function Sidebar({ mobile = false, onClose }) {
    const { t } = useLang();
    const {
        getInvoiceCount, getKwitansiCount,
        getKasirTransactionCount, getClientCount, getProductCount, 
        getCashbookCount, getHutangPiutangCount, getQuotationCount, getPOCount, getTandaTerimaCount,
        currentLimits
    } = usePlan();
    const { 
        user, profile, trialActive, trialDaysLeft, 
        effectivePlan, isAdmin,
        canAccessReport,
        canStartTrial, 
    } = useAuth();
    const navigate = useNavigate();
    const [workspaceMode, updateWorkspaceMode] = useWorkspaceMode(user?.id);
    const [kasirExpanded, setKasirExpanded] = useState(false);
    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);
    const [showExtraKasirMenu, setShowExtraKasirMenu] = useState(false);
    const [showExtraDocs, setShowExtraDocs] = useState(false);

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
    const [_debtAlertCount, setDebtAlertCount] = useState(0);

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

    // Auto-expand Kasir / Docs menus if on matching route or focus mode
    const location = useLocation();
    useEffect(() => {
        if (location.pathname.startsWith('/kasir') || workspaceMode === 'pos') {
            setKasirExpanded(true);
        }
        if (['/kasir/gudang', '/kasir/stok', '/kasir-members', '/kasir/karyawan', '/kasir/pengeluaran', '/audit-log'].includes(location.pathname)) {
            setShowExtraKasirMenu(true);
        }
        if (['/tanda-terima', '/penawaran-harga', '/purchase-order'].includes(location.pathname) || workspaceMode === 'b2b') {
            setShowExtraDocs(true);
        }
    }, [location.pathname, workspaceMode]);

    const badgeStyle = (level) => ({
        fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
        color: 'white',
        background: level === 'ULTIMATE' ? '#7C3AED' : '#3B82F6',
        marginLeft: 'auto', flexShrink: 0
    });

    const isFree = effectivePlan === 'free' && !isAdmin;

    const kasirTxCount = getKasirTransactionCount();
    const kasirLimit = currentLimits?.kasir || 50;
    const kasirTxLeft = Math.max(0, kasirLimit - kasirTxCount);

    const invoicesCount = getInvoiceCount();
    const kwitansiCount = getKwitansiCount();
    const hpCount = getHutangPiutangCount();

    const quoteCount = getQuotationCount();
    const poCount = getPOCount();
    const ttrCount = getTandaTerimaCount();

    const clientCount = getClientCount();
    const productCount = getProductCount();


    const invoiceText = isFree ? ` (${invoicesCount}/${currentLimits?.invoices || 10})` : '';
    const kwitansiText = isFree ? ` (${kwitansiCount}/${currentLimits?.kwitansi || 10})` : '';
    const clientText = isFree ? ` (${clientCount}/${currentLimits?.clients || 10})` : '';
    const productText = isFree ? ` (${productCount}/${currentLimits?.products || 20})` : '';
    const hpText = isFree ? ` (${hpCount}/${currentLimits?.hutangPiutang || 10})` : '';
    const quoteText = isFree ? ` (${quoteCount}/${currentLimits?.quotation || 5})` : '';
    const poText = isFree ? ` (${poCount}/${currentLimits?.po || 5})` : '';
    const ttrText = isFree ? ` (${ttrCount}/${currentLimits?.tandaTerima || 5})` : '';

    // Add Cashbook text
    const cashbookCount = getCashbookCount ? getCashbookCount() : 0;
    const cashbookText = isFree ? ` (${cashbookCount}/${currentLimits?.cashbook || 20})` : '';

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

    const renderNavLink = (item, isSubItem = false) => {
        const { to, icon: Icon, label, level, key, exact } = item;
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
            <NavLink
                key={to}
                to={to}
                end={exact || to === '/dashboard'}
                onClick={!canAccessItem(level) ? (e) => {
                    e.preventDefault();
                    if (key === 'nav_hpp') setUpgradeFeatureType('hpp');
                    else setUpgradeFeatureType(level === 'ULTIMATE' ? 'ultimate_locked' : 'report');
                } : (mobile ? onClose : undefined)}
                style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : (isSubItem ? 8 : 10),
                    padding: collapsed ? '10px 0' : (isSubItem ? '7px 12px 7px 22px' : '9px 12px'),
                    borderRadius: collapsed ? 0 : 10,
                    marginBottom: 2,
                    fontSize: isSubItem ? 13 : 14,
                    fontWeight: isSubItem ? 500 : 600,
                    textDecoration: 'none',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: canAccessItem(level) ? 1 : 0.65,
                    ...(isActive && canAccessItem(level) ? {
                        background: '#EDE9FE',
                        color: '#7C3AED',
                        borderLeft: collapsed ? 'none' : '3px solid #7C3AED',
                        paddingLeft: collapsed ? 0 : (isSubItem ? 19 : 9),
                        borderRight: collapsed ? '3px solid #7C3AED' : 'none'
                    } : {
                        color: '#475569',
                        borderLeft: '3px solid transparent',
                        paddingLeft: collapsed ? 0 : (isSubItem ? 19 : 9),
                    })
                })}
                className="sidebar-link hover:text-violet-600"
                title={collapsed ? t(key) || label : undefined}
            >
                {({ isActive }) => (
                    <>
                        <Icon size={isSubItem ? 16 : 18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
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
                        {!locked && isInvoice && isFree && !trialActive && invoicesCount >= (currentLimits?.invoices || 10) && !collapsed && (
                            <Lock size={12} className="text-amber-500 ml-auto" />
                        )}
                        {!locked && isReceipt && isFree && !trialActive && kwitansiCount >= (currentLimits?.kwitansi || 10) && (
                            <Lock size={12} className="text-amber-500 ml-auto" />
                        )}
                        {!locked && isClient && isFree && !trialActive && clientCount >= (currentLimits?.clients || 10) && (
                            <Lock size={12} className="text-amber-500 ml-auto" />
                        )}
                        {!locked && isProduk && isFree && !trialActive && productCount >= (currentLimits?.products || 20) && (
                            <Lock size={12} className="text-amber-500 ml-auto" />
                        )}
                        {!locked && isHP && isFree && !trialActive && hpCount >= (currentLimits?.hutangPiutang || 10) && !collapsed && (
                            <Lock size={12} className="text-amber-500 ml-auto" />
                        )}
                        {!locked && (isTTR || isQuote || isPO) && isFree && !trialActive && (
                            (isTTR && ttrCount >= (currentLimits?.tandaTerima || 5)) || 
                            (isQuote && quoteCount >= (currentLimits?.quotation || 5)) || 
                            (isPO && poCount >= (currentLimits?.po || 5))
                        ) && !collapsed && (
                            <Lock size={12} className="text-amber-500 ml-auto" />
                        )}
                        {/* Report lock */}
                        {!locked && key === 'nav_report' && !canAccessReport() && !trialActive && !collapsed && (
                            <Lock size={12} className="text-amber-500 ml-auto" />
                        )}
                    </>
                )}
            </NavLink>
        );
    };

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
                    title={collapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
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
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', overflow: 'hidden' }}
                    onClick={() => navigate('/')}
                    title={collapsed ? "My Invoice" : "Kembali ke Beranda"}
                >
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, overflow: 'hidden'
                    }}>
                        {profile?.company_logo ? (
                            <img src={profile.company_logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <FileText size={16} color="white" strokeWidth={2.5} />
                        )}
                    </div>
                    {!collapsed && (
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            My Invoice
                        </span>
                    )}
                </div>
                {/* Admin badge */}
                {isAdmin && !collapsed && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, background: '#7C3AED', color: 'white', borderRadius: 4, padding: '2px 6px', marginRight: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Shield size={10} /> {t('common_admin')}
                    </span>
                )}
                {mobile && (
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                        <X size={20} />
                    </button>
                )}
            </div>

            {!collapsed && (
                <div style={{ padding: '8px 12px 4px', flexShrink: 0 }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3,
                        background: '#F1F5F9', padding: 3, borderRadius: 10, border: '1px solid #E2E8F0'
                    }}>
                        {[
                            { id: 'all', label: 'Semua' },
                            { id: 'b2b', label: 'Faktur B2B' },
                            { id: 'pos', label: 'Kasir POS' }
                        ].map((tab) => {
                            const active = workspaceMode === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => updateWorkspaceMode(tab.id)}
                                    style={{
                                        border: 'none', borderRadius: 7, padding: '5px 4px',
                                        fontSize: 10, fontWeight: 800, cursor: 'pointer',
                                        background: active ? '#FFFFFF' : 'transparent',
                                        color: active ? '#7C3AED' : '#64748B',
                                        boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                                        transition: 'all 150ms'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 0' : '8px 12px' }} className="scrollbar-hide">
                {navSections
                    .filter((sec) => {
                        if (workspaceMode === 'pos' && (sec.titleKey === 'nav_section_docs' || sec.titleKey === 'nav_section_finance')) {
                            return false;
                        }
                        return true;
                    })
                    .map((sec, sIdx) => (
                    <div key={sec.titleKey || `section-${sIdx}`} style={{ marginBottom: collapsed ? 8 : 12 }}>
                        {!collapsed && sec.titleKey && (
                            <div style={{
                                padding: '8px 12px 4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: '#94A3B8'
                            }}>
                                {t(sec.titleKey)}
                            </div>
                        )}
                        {sec.items
                            .filter((item) => !(workspaceMode === 'b2b' && item.key === 'nav_hpp'))
                            .map(item => (
                            <Fragment key={item.to}>
                                {renderNavLink(item)}

                                {/* Kasir Dropdown in Operasional section */}
                                {item.key === 'nav_cashbook' && workspaceMode !== 'b2b' && (
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

                                        {/* Sub-menu utama (3 Akses Primer Kasir) */}
                                        {[
                                            { path: '/kasir/produk', key: 'nav_kasir_products', level: 'FREE' },
                                            { path: '/kasir/laporan', key: 'nav_kasir_report', level: 'PRO' },
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

                                        {/* Toggle Opsi Kasir Tambahan (Agar tidak memanjang 10 item) */}
                                        <button
                                            type="button"
                                            onClick={() => setShowExtraKasirMenu(!showExtraKasirMenu)}
                                            style={{
                                                width: '100%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '6px 12px', borderRadius: 6,
                                                fontSize: 11, fontWeight: 700,
                                                color: '#64748B', background: 'transparent', border: 'none',
                                                cursor: 'pointer', marginTop: 2,
                                                transition: 'all 150ms'
                                            }}
                                            className="hover:bg-slate-100 hover:text-slate-900"
                                        >
                                            <span>{showExtraKasirMenu ? (t('nav_kasir_less') || "Sembunyikan Menu") : (t('nav_kasir_more') || "+ Menu Kasir Lainnya")}</span>
                                            <ChevronDown size={13} style={{ transition: 'transform 200ms', transform: showExtraKasirMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                        </button>

                                        {/* Sub-menu tambahan (Gudang, Stok, Member, Karyawan, Pengeluaran, Audit) */}
                                        {showExtraKasirMenu && [
                                            { path: '/kasir/gudang', key: 'nav_kasir_gudang', level: 'FREE' },
                                            { path: '/kasir/stok', key: 'nav_kasir_stock', level: 'PRO' },
                                            { path: '/kasir-members', key: 'nav_kasir_members', level: 'ULTIMATE' },
                                            { path: '/kasir/karyawan', key: 'nav_kasir_employees', level: 'PRO' },
                                            { path: '/kasir/pengeluaran', key: 'nav_kasir_expenses', level: 'PRO' },
                                            { path: '/audit-log', key: 'nav_audit_log', level: 'PRO' }
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
                                                                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
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
                                                                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                                                                color: '#94A3B8', background: 'transparent', border: 'none',
                                                                cursor: 'pointer', opacity: 0.7
                                                            }}
                                                        >
                                                            <span>{t(sub.key)} <span style={{ fontSize: 9, background: sub.level === 'ULTIMATE' ? '#7C3AED' : '#F59E0B', color: 'white', padding: '1px 4px', borderRadius: 3, marginLeft: 4 }}>{sub.level}</span></span>
                                                            <Lock size={11} className={sub.level === 'ULTIMATE' ? 'text-violet-500' : 'text-amber-500'} />
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
                            </Fragment>
                        ))}

                        {/* In DOKUMEN BISNIS section: Extra collapsible docs (Surat Jalan, SPH, PO) */}
                        {sec.titleKey === 'nav_section_docs' && (
                            <div style={{ marginTop: 2 }}>
                                {!collapsed && (
                                    <button
                                        type="button"
                                        onClick={() => setShowExtraDocs(!showExtraDocs)}
                                        style={{
                                            width: '100%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '6px 12px', borderRadius: 8,
                                            fontSize: 11, fontWeight: 700,
                                            color: '#64748B', background: 'transparent', border: 'none',
                                            cursor: 'pointer', margin: '2px 0 2px',
                                            transition: 'all 150ms'
                                        }}
                                        className="hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        <span>{showExtraDocs ? (t('nav_docs_less') || 'Sembunyikan Dokumen') : (t('nav_docs_more') || '+ Dokumen Lain (Surat Jalan, SPH, PO)')}</span>
                                        <ChevronDown size={13} style={{ transition: 'transform 200ms', transform: showExtraDocs ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                    </button>
                                )}
                                {(showExtraDocs || (collapsed && ['/tanda-terima', '/penawaran-harga', '/purchase-order'].includes(location.pathname))) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {extraDocsItems.map(docItem => renderNavLink(docItem, !collapsed))}
                                    </div>
                                )}
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
                                {trialActive ? t('upgrade_trial_active') : (canStartTrial ? t('upgrade_activate_trial_btn') : t('sidebar_upgrade_cta'))}
                            </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.4' }}>
                            {trialActive 
                              ? t('trial_enjoy_pro').replace('{days}', trialDaysLeft)
                              : (profile?.trial_ends_at === null
                                  ? t('trial_activate_hint')
                                  : t('trial_benefit_short'))}
                        </p>
                        <div style={{
                            marginTop: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 8,
                            padding: '6px 12px', textAlign: 'center',
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                                {t('upgrade_pro_price_monthly')}
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
