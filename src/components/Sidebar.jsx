import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home, BookOpen, Users, FileText, Receipt, Package,
    Tag, ShoppingCart, Calculator, BarChart2, X,
    Zap, HandCoins, Settings2, Store, ChevronDown, Lock, Crown, Shield
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/dashboard', icon: Home, key: 'nav_home', exact: true },
    { to: '/catatan-bisnis', icon: BookOpen, key: 'nav_cashbook' },
    { to: '/laporan', icon: BarChart2, key: 'nav_report' },
    { to: '/klien', icon: Users, key: 'nav_clients' },
    { to: '/invoice', icon: FileText, key: 'nav_invoice' },
    { to: '/kwitansi', icon: Receipt, key: 'nav_receipt' },
    { to: '/tanda-terima', icon: Package, key: 'nav_delivery' },
    { to: '/penawaran-harga', icon: Tag, key: 'nav_quote' },
    { to: '/purchase-order', icon: ShoppingCart, key: 'nav_po' },
    { to: '/hitung-hpp', icon: Calculator, key: 'nav_hpp' },
    { to: '/hutang-piutang', icon: HandCoins, label: 'Hutang & Piutang' },
    { to: '/settings', icon: Settings2, label: 'Pengaturan' },
];

export default function Sidebar({ mobile = false, onClose }) {
    const { t } = useLang();
    const { isPro, isUltimate, getKasirTransactionCount } = usePlan();
    const { effectivePlan, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [kasirExpanded, setKasirExpanded] = useState(false);

    const kasirTxCount = getKasirTransactionCount();
    const kasirTxLeft = Math.max(0, 10 - kasirTxCount);

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
                {navItems.map(({ to, icon: Icon, key, label }) => (
                    <div key={to}>
                        <NavLink
                            to={to}
                            end={to === '/dashboard'}
                            onClick={mobile ? onClose : undefined}
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
                                ...(isActive ? {
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
                            {({ isActive }) => (
                                <>
                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>{key ? t(key) : label}</span>
                                    {key === 'nav_report' && !isPro && (
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                                            background: '#F59E0B', color: 'white', borderRadius: 4,
                                            padding: '1px 6px',
                                        }}>PRO</span>
                                    )}
                                </>
                            )}
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
                                    <Store size={18} strokeWidth={2} className={isUltimate ? 'text-purple-600' : 'text-slate-400'} />
                                    <span>Kasir</span>

                                    {/* Badge status berdasarkan plan */}
                                    {isAdmin ? (
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                                            background: '#7C3AED', color: 'white', borderRadius: 4,
                                            padding: '2px 6px', marginRight: 4, display: 'flex', alignItems: 'center', gap: 2
                                        }}><Shield size={9} /> ADMIN</span>
                                    ) : isUltimate ? (
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                                            background: '#7C3AED', color: 'white', borderRadius: 4,
                                            padding: '2px 6px', marginRight: 4, display: 'flex', alignItems: 'center', gap: 2
                                        }}><Crown size={9} /> ULTIMATE</span>
                                    ) : (
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                                            background: kasirTxLeft > 0 ? '#10B981' : '#EF4444',
                                            color: 'white', borderRadius: 4, padding: '2px 6px', marginRight: 4
                                        }}>
                                            {kasirTxLeft > 0 ? `${kasirTxLeft}/10 sisa` : 'LIMIT'}
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
                                            <span>🖥️ Transaksi POS</span>
                                            {!isUltimate && <Lock size={12} className="text-amber-400" />}
                                        </NavLink>

                                        {/* Sub-menu lain — hanya tampil dan bisa diklik untuk ultimate/admin, tapi tetap kelihatan (disabled) untuk free */}
                                        {[
                                            { path: '/kasir/produk', label: '📦 Manajemen Produk' },
                                            { path: '/kasir/stok', label: '📊 Stok & Inventaris' },
                                            { path: '/kasir/laporan', label: '📈 Laporan Kasir' },
                                            { path: '/kasir/karyawan', label: '👥 Karyawan & Shift' },
                                            { path: '/kasir/pengeluaran', label: '💸 Pengeluaran' }
                                        ].map(sub => (
                                            <div key={sub.path}>
                                                {isUltimate ? (
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
                                                        {sub.label}
                                                    </NavLink>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate('/upgrade')}
                                                        style={{
                                                            width: '100%', textAlign: 'left',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                                            color: '#94A3B8', background: 'transparent', border: 'none',
                                                            cursor: 'pointer', opacity: 0.7
                                                        }}
                                                    >
                                                        <span>{sub.label}</span>
                                                        <Lock size={12} className="text-amber-400" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {/* Prompt upgrade jika free */}
                                        {!isUltimate && (
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
                                                <Crown size={12} /> Upgrade ke ULTIMATE untuk akses penuh
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Upgrade CTA for free users */}
            {!isPro && (
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
        </div>
    );
}
