import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home, BookOpen, Users, FileText, Receipt, Package,
    Tag, ShoppingCart, Calculator, BarChart2, X,
    Zap, HandCoins, Settings2, Store, ChevronDown, Lock, Crown, Shield, LifeBuoy
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import UpgradeModal from './UpgradeModal';

// nav_delivery=Tanda Terima, nav_quote=Penawaran Harga, nav_po=Purchase Order
// nav_hpp=Hitung HPP (ULTIMATE), nav_piutang=Hutang Piutang (PRO)
const navItems = [
    { to: '/dashboard', icon: Home, key: 'nav_home', exact: true, level: 'FREE' },
    { to: '/catatan-bisnis', icon: BookOpen, key: 'nav_cashbook', level: 'FREE' },
    { to: '/hitung-hpp', icon: Calculator, key: 'nav_hpp', level: 'ULTIMATE' },
    { to: '/laporan', icon: BarChart2, key: 'nav_report', level: 'PRO' },
    { to: '/klien', icon: Users, key: 'nav_clients', level: 'FREE' },
    { to: '/invoice', icon: FileText, key: 'nav_invoice', level: 'FREE' },
    { to: '/kwitansi', icon: Receipt, key: 'nav_receipt', level: 'FREE' },
    { to: '/tanda-terima', icon: Package, key: 'nav_delivery', level: 'FREE' },
    { to: '/penawaran-harga', icon: Tag, key: 'nav_quote', level: 'FREE' },
    { to: '/purchase-order', icon: ShoppingCart, key: 'nav_po', level: 'FREE' },
    { to: '/hutang-piutang', icon: HandCoins, key: 'nav_piutang', level: 'FREE' },
    { to: '/settings', icon: Settings2, label: 'Pengaturan', level: 'FREE' },
];

export default function Sidebar({ mobile = false, onClose }) {
    const { t } = useLang();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkInvoiceKwitansiLimit, incrementInvoiceKwitansi, getInvoiceKwitansiCount,
        getHutangPiutangCount, getQuotationCount, getPOCount, getTandaTerimaCount,
        getKasirTransactionCount, getKasirDailyCount, getClientCount, getProductCount, refreshUsage,
        getCashbookCount
    } = usePlan();
    const { effectivePlan, isAdmin, canAccessReport, canAccessAdvancedKasir, canAccessKaryawan, canAccessHPP } = useAuth();
    const navigate = useNavigate();
    const [kasirExpanded, setKasirExpanded] = useState(false);
    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);

    // Helpers
    const isPlanPro = effectivePlan === 'pro' || effectivePlan === 'ultimate' || isAdmin;
    const isPlanUltimate = effectivePlan === 'ultimate' || isAdmin;

    const canAccessItem = (level) => {
        if (!level || level === 'FREE') return true;
        if (level === 'PRO') return isPlanPro;
        if (level === 'ULTIMATE') return isPlanUltimate;
        return true;
    };

    const badgeStyle = (level) => ({
        fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
        color: 'white',
        background: level === 'ULTIMATE' ? '#7C3AED' : '#3B82F6',
        marginLeft: 'auto', flexShrink: 0
    });

    const isFree = effectivePlan === 'free' && !isAdmin;

    const kasirTxCount = getKasirTransactionCount();
    const kasirTxDailyCount = getKasirDailyCount ? getKasirDailyCount() : 0;
    const kasirTxLeft = Math.max(0, 10 - kasirTxDailyCount);

    const invoicesCount = getInvoiceKwitansiCount();
    const hpCount = getHutangPiutangCount();
    const quoteCount = getQuotationCount();
    const poCount = getPOCount();
    const ttrCount = getTandaTerimaCount();

    const clientCount = getClientCount();
    const productCount = getProductCount();

    const invoiceText = isFree ? ` (${invoicesCount}/10)` : '';
    const clientText = isFree ? ` (${clientCount}/5)` : '';
    const productText = isFree ? ` (${productCount}/5)` : '';
    const hpText = isFree ? ` (${hpCount}/10)` : '';
    const quoteText = isFree ? ` (${quoteCount}/5)` : '';
    const poText = isFree ? ` (${poCount}/5)` : '';
    const ttrText = isFree ? ` (${ttrCount}/5)` : '';

    // Add Cashbook text
    const cashbookCount = getCashbookCount ? getCashbookCount() : 0;
    const cashbookText = isFree ? ` (${cashbookCount}/20)` : '';

    return (
        <div style={{
            width: mobile ? '100%' : '260px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--sidebar-bg, white)',
            borderRight: '1px solid var(--sidebar-border, #E2E8F0)',
            overflow: 'hidden',
        }}
            className="sidebar dark:bg-card-dark dark:border-slate-700"
        >
            {/* Logo area */}
            <div style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                borderBottom: '1px solid #E2E8F0',
                flexShrink: 0,
            }} className="dark:border-slate-700">
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                    title="Back to Home"
                >
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FileText size={16} color="white" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.5px' }}>
                        My Invoice
                    </span>
                </div>
                {/* Admin badge */}
                {isAdmin && (
                    <span style={{
                        fontSize: 10, fontWeight: 800, background: '#7C3AED',
                        color: 'white', borderRadius: 6, padding: '2px 8px',
                        display: 'flex', alignItems: 'center', gap: 3
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
            <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
                {navItems.map(({ to, icon: Icon, key, label, level }) => (
                    <div key={to}>
                        <NavLink
                            to={to}
                            end={to === '/dashboard'}
                            onClick={!canAccessItem(level) ? (e) => {
                                e.preventDefault();
                                if (key === 'nav_hpp') setUpgradeFeatureType('hpp');
                                else setUpgradeFeatureType(level === 'ULTIMATE' ? 'karyawan' : 'report');
                            } : (mobile ? onClose : undefined)}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 10,
                                marginBottom: 2,
                                fontSize: 14,
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                                opacity: canAccessItem(level) ? 1 : 0.65,
                                ...(isActive && canAccessItem(level) ? {
                                    background: '#EDE9FE',
                                    color: '#7C3AED',
                                    borderLeft: '3px solid #7C3AED',
                                    paddingLeft: 9,
                                } : {
                                    color: '#475569',
                                    borderLeft: '3px solid transparent',
                                    paddingLeft: 9,
                                })
                            })}
                            className="sidebar-link"
                        >
                            {({ isActive }) => {
                                const isInvoice = key === 'nav_invoice';
                                const isClient = key === 'nav_clients' || key === 'nav_kasir_customers';
                                const isProduk = key === 'nav_kasir_products';
                                const isHP = key === 'nav_piutang';
                                const isTTR = key === 'nav_delivery';
                                const isQuote = key === 'nav_quote';
                                const isPO = key === 'nav_po';
                                const locked = !canAccessItem(level);

                                return (
                                    <>
                                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                        <span style={{ flex: 1 }}>
                                            {key ? t(key) || label : label}
                                            {isInvoice && invoiceText}
                                            {isClient && clientText}
                                            {isProduk && productText}
                                            {isHP && hpText}
                                            {isTTR && ttrText}
                                            {isQuote && quoteText}
                                            {isPO && poText}
                                            {key === 'nav_cashbook' && cashbookText}
                                        </span>
                                        {/* Lock badge + icon for restricted items */}
                                        {locked && (
                                            <>
                                                <span style={badgeStyle(level)}>{level}</span>
                                                <Lock size={11} style={{ color: level === 'ULTIMATE' ? '#7C3AED' : '#3B82F6', flexShrink: 0 }} />
                                            </>
                                        )}
                                        {/* Plan access badge for unlocked PRO/ULTIMATE items */}
                                        {!locked && level === 'ULTIMATE' && (
                                            <span style={{
                                                fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
                                                color: '#7C3AED', background: '#EDE9FE', flexShrink: 0,
                                                border: '1px solid #C4B5FD'
                                            }}>ULTIMATE</span>
                                        )}
                                        {!locked && level === 'PRO' && (
                                            <span style={{
                                                fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
                                                color: '#3B82F6', background: '#EFF6FF', flexShrink: 0,
                                                border: '1px solid #BFDBFE'
                                            }}>PRO</span>
                                        )}
                                        {/* Soft locks: limits reached */}
                                        {!locked && isInvoice && isFree && invoicesCount >= 10 && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && isClient && isFree && clientCount >= 5 && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && isProduk && isFree && productCount >= 5 && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && isHP && isFree && hpCount >= 10 && (
                                            <Lock size={12} className="text-amber-500 ml-auto" />
                                        )}
                                        {!locked && (isTTR || isQuote || isPO) && isFree && (
                                            (isTTR && ttrCount >= 5) || (isQuote && quoteCount >= 5) || (isPO && poCount >= 5)
                                        ) && (
                                                <Lock size={12} className="text-amber-500 ml-auto" />
                                            )}
                                        {/* Report lock */}
                                        {!locked && key === 'nav_report' && !canAccessReport() && (
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
                                    onClick={() => setKasirExpanded(!kasirExpanded)}
                                    style={{
                                        width: '100%',
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 12px', borderRadius: 10,
                                        fontSize: 14, fontWeight: 600,
                                        background: kasirExpanded ? 'var(--sidebar-hover, #F8FAFC)' : 'transparent',
                                        color: '#475569', border: 'none', cursor: 'pointer',
                                        borderLeft: '3px solid transparent', paddingLeft: 9,
                                        transition: 'all 200ms'
                                    }}
                                    className="dark:bg-slate-800/50 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <Store size={18} strokeWidth={2} className={isPlanUltimate ? 'text-purple-600' : isPlanPro ? 'text-blue-500' : 'text-slate-400'} />
                                    <span>{t('nav_kasir')}</span>

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
                                            background: '#F59E0B', color: 'white', borderRadius: 4,
                                            padding: '2px 6px', marginRight: 4, display: 'flex', alignItems: 'center', gap: 2
                                        }}><Zap size={9} /> PRO</span>
                                    ) : isPlanPro ? (
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                                            background: '#3B82F6', color: 'white', borderRadius: 4,
                                            padding: '2px 6px', marginRight: 4, display: 'flex', alignItems: 'center', gap: 2
                                        }}><Zap size={9} /> PRO</span>
                                    ) : (
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                                            background: (10 - kasirTxDailyCount) > 0 ? '#10B981' : '#EF4444',
                                            color: 'white', borderRadius: 4, padding: '2px 6px', marginRight: 4
                                        }}>
                                            {`${kasirTxDailyCount}/10`}
                                        </span>
                                    )}
                                    <ChevronDown size={16} style={{ transition: 'transform 200ms', transform: kasirExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </button>

                                <div style={{
                                    overflow: 'hidden',
                                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                    maxHeight: kasirExpanded ? 400 : 0,
                                    opacity: kasirExpanded ? 1 : 0
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
                                            className="hover:text-violet-600 dark:hover:text-violet-400 dark:text-slate-400"
                                        >
                                            <span>{t('nav_kasir_pos')}</span>
                                            {effectivePlan === 'free' && kasirTxLeft <= 0 && <Lock size={12} className="text-amber-400" />}
                                        </NavLink>

                                        {/* Sub-menu lain — lock sesuai level plan */}
                                        {[
                                            { path: '/kasir/produk', key: 'nav_kasir_products', level: 'FREE' },
                                            { path: '/kasir/stok', key: 'nav_kasir_stock', level: 'PRO' },
                                            { path: '/kasir/laporan', key: 'nav_kasir_report', level: 'PRO' },
                                            { path: '/kasir/karyawan', key: 'nav_kasir_employees', level: 'ULTIMATE' },
                                            { path: '/klien', key: 'nav_kasir_customers', level: 'FREE' },
                                            { path: '/kasir/pengeluaran', key: 'nav_kasir_expenses', level: 'PRO' }
                                        ].map(sub => {
                                            let canAccess = true;
                                            if (sub.level === 'PRO') canAccess = canAccessAdvancedKasir();
                                            if (sub.level === 'ULTIMATE') canAccess = canAccessKaryawan();

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
                                                            className="hover:text-violet-600 dark:hover:text-violet-400 dark:text-slate-400"
                                                        >
                                                            {t(sub.key)}
                                                        </NavLink>
                                                    ) : (
                                                        <button
                                                            onClick={() => setUpgradeFeatureType('advanced_kasir')}
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
            <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
                <NavLink
                    to="/bantuan"
                    onClick={mobile ? onClose : undefined}
                    style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        fontSize: 14, fontWeight: 600, textDecoration: 'none',
                        transition: 'all 200ms',
                        ...(isActive ? {
                            background: '#EDE9FE', color: '#7C3AED',
                            borderLeft: '3px solid #7C3AED', paddingLeft: 9,
                        } : {
                            color: '#475569',
                            borderLeft: '3px solid transparent', paddingLeft: 9,
                        })
                    })}
                    className="sidebar-link"
                >
                    <LifeBuoy size={18} strokeWidth={2} />
                    <span style={{ flex: 1 }}>{t('nav_help')}</span>
                </NavLink>
            </div>

            {/* Upgrade CTA — hanya untuk FREE user */}
            {!isPlanPro && (
                <div style={{ padding: '12px 16px', flexShrink: 0 }}>
                    <div
                        onClick={() => navigate('/upgrade')}
                        style={{
                            background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                            borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Zap size={16} color="#FCD34D" fill="#FCD34D" />
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Upgrade ke PRO</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.4' }}>
                            Unlimited dokumen, laporan, & tanpa watermark
                        </p>
                        <div style={{
                            marginTop: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 8,
                            padding: '6px 12px', textAlign: 'center',
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Rp 99.000/bulan</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{
                padding: '12px 20px', fontSize: 11, color: '#94A3B8',
                borderTop: '1px solid #E2E8F0', flexShrink: 0,
            }} className="dark:border-slate-700">
                © 2026 MyInvoice.space
            </div>
            <UpgradeModal
                isOpen={!!upgradeFeatureType}
                onClose={() => setUpgradeFeatureType(null)}
                featureType={upgradeFeatureType}
                planType={['karyawan', 'hpp', 'ultimate_locked'].includes(upgradeFeatureType) ? 'ULTIMATE' : 'PRO'}
            />
        </div>
    );
}
