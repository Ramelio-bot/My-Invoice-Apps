import { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Clock, HandCoins, Package, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatIDR } from '../utils/currency';

function daysDiff(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    return Math.floor((due - today) / 86400000);
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ label, color }) {
    return (
        <p style={{
            margin: '0 0 6px', fontSize: 10, fontWeight: 800,
            color, textTransform: 'uppercase', letterSpacing: 1,
        }}>{label}</p>
    );
}

// ── Single notification row ────────────────────────────────────────────────────
function NotifRow({ icon: Icon, iconColor, title, sub, subColor, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '8px 0',
                border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
            }}
        >
            <Icon size={16} color={iconColor} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: 13, fontWeight: 700,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{title}</p>
                <p style={{ margin: 0, fontSize: 12, color: subColor || '#94A3B8' }}>{sub}</p>
            </div>
        </button>
    );
}

export default function NotificationBell() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const { effectivePlan, profile } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Data sources
    const [invoices] = useLocalStorage('invoice_data', []);
    const [piutang] = useLocalStorage('piutang_data', []);
    const [hutang] = useLocalStorage('hutang_data', []);
    const [products] = useLocalStorage('kasir_products', []);
    const [clients] = useLocalStorage('clients_data', []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── 1. Invoice jatuh tempo ────────────────────────────────────────────────
    const duePending = (invoices || [])
        .filter(inv => inv.dueDate && (inv.status !== 'paid' && inv.status !== 'Lunas'))
        .map(inv => ({ ...inv, diff: daysDiff(inv.dueDate) }))
        .filter(inv => inv.diff <= 3)
        .sort((a, b) => a.diff - b.diff);
    const overdueInv = duePending.filter(i => i.diff < 0);
    const dueSoonInv = duePending.filter(i => i.diff >= 0 && i.diff <= 3);

    // ── 2. Piutang jatuh tempo (≤ 3 hari) ────────────────────────────────────
    const piutangDue = (piutang || [])
        .filter(p => p.dueDate && p.status !== 'paid')
        .map(p => ({ ...p, diff: daysDiff(p.dueDate) }))
        .filter(p => p.diff <= 3)
        .sort((a, b) => a.diff - b.diff);

    // ── 3. Hutang jatuh tempo (≤ 3 hari) ─────────────────────────────────────
    const hutangDue = (hutang || [])
        .filter(h => h.dueDate && h.status !== 'paid')
        .map(h => ({ ...h, diff: daysDiff(h.dueDate) }))
        .filter(h => h.diff <= 3)
        .sort((a, b) => a.diff - b.diff);

    // ── 4. Stok hampir habis (Kasir) — qty ≤ 5 ───────────────────────────────
    const lowStock = (products || []).filter(p => p.stock !== undefined && p.stock !== null && p.stock <= 5);

    // ── 5. Kuota FREE plan hampir habis ──────────────────────────────────────
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const invoicesThisMonth = (invoices || []).filter(inv => {
        const d = new Date(inv.createdAt || inv.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const isFree = effectivePlan === 'free';
    const invoiceQuotaWarn = isFree && invoicesThisMonth >= 2;   // 2/3 terpakai
    const clientQuotaWarn = isFree && (clients || []).length >= 1; // 1/1 terpakai

    // ── 6. Trial hampir habis ─────────────────────────────────────────────────
    const trialDays = profile?.trial_ends_at
        ? Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000)
        : null;
    const trialWarning = trialDays !== null && trialDays >= 0 && trialDays <= 3;

    // Total badge count
    const totalCount =
        duePending.length +
        piutangDue.length +
        hutangDue.length +
        lowStock.length +
        (invoiceQuotaWarn ? 1 : 0) +
        (clientQuotaWarn ? 1 : 0) +
        (trialWarning ? 1 : 0);

    const hasUrgent = overdueInv.length > 0 || piutangDue.some(p => p.diff < 0) || hutangDue.some(h => h.diff < 0);

    const bg = dark ? '#1E293B' : 'white';
    const border = dark ? '#334155' : '#E2E8F0';
    const text = dark ? '#F1F5F9' : '#0F172A';
    const sub = dark ? '#94A3B8' : '#64748B';

    const divider = <div style={{ height: 1, background: border, margin: '4px 0' }} />;

    const go = (path) => { setOpen(false); navigate(path); };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    position: 'relative',
                    background: dark ? '#334155' : '#F1F5F9',
                    border: 'none', borderRadius: 10,
                    padding: 8, cursor: 'pointer',
                    color: dark ? '#E2E8F0' : '#64748B',
                    display: 'flex', alignItems: 'center',
                    transition: 'all 200ms',
                }}
                title={lang === 'ID' ? 'Notifikasi' : 'Notifications'}
            >
                <Bell size={16} />
                {totalCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -3, right: -3,
                        minWidth: 16, height: 16, borderRadius: 8,
                        background: hasUrgent ? '#EF4444' : '#F59E0B',
                        color: 'white', fontSize: 10, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px',
                    }}>
                        {totalCount > 9 ? '9+' : totalCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    width: 'min(370px, calc(100vw - 32px))',
                    zIndex: 500,
                    animation: 'scaleIn 150ms ease',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '14px 16px 10px',
                        borderBottom: `1px solid ${border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: text }}>
                            {lang === 'ID' ? '🔔 Notifikasi' : '🔔 Notifications'}
                        </p>
                        {totalCount > 0 && (
                            <span style={{
                                background: hasUrgent ? '#FEE2E2' : '#FEF3C7',
                                color: hasUrgent ? '#DC2626' : '#D97706',
                                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                            }}>
                                {totalCount} {lang === 'ID' ? 'baru' : 'new'}
                            </span>
                        )}
                    </div>

                    <div style={{ maxHeight: 420, overflowY: 'auto', scrollbarWidth: 'thin' }}>

                        {/* Empty state */}
                        {totalCount === 0 && (
                            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 10px', display: 'block' }} />
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>
                                    {lang === 'ID' ? 'Semua beres!' : 'All clear!'}
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: sub }}>
                                    {lang === 'ID' ? 'Tidak ada notifikasi saat ini.' : 'No notifications right now.'}
                                </p>
                            </div>
                        )}

                        {/* ── Invoice Terlambat ── */}
                        {overdueInv.length > 0 && (
                            <div style={{ padding: '10px 16px 6px' }}>
                                <SectionHeader label={lang === 'ID' ? `🚨 ${overdueInv.length} Invoice Terlambat` : `🚨 ${overdueInv.length} Overdue Invoice`} color="#EF4444" />
                                {overdueInv.map(inv => (
                                    <NotifRow key={inv.id}
                                        icon={AlertCircle} iconColor="#EF4444"
                                        title={`${inv.clientName} · ${inv.number}`}
                                        sub={lang === 'ID' ? `${Math.abs(inv.diff)} hari terlambat · ${formatIDR(inv.grandTotal)}` : `${Math.abs(inv.diff)} days overdue · ${formatIDR(inv.grandTotal)}`}
                                        subColor="#EF4444"
                                        onClick={() => go('/invoice')}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ── Invoice Jatuh Tempo Segera ── */}
                        {dueSoonInv.length > 0 && (
                            <>
                                {overdueInv.length > 0 && divider}
                                <div style={{ padding: '10px 16px 6px' }}>
                                    <SectionHeader label={lang === 'ID' ? `⏰ ${dueSoonInv.length} Invoice Jatuh Tempo` : `⏰ ${dueSoonInv.length} Invoice Due Soon`} color="#F59E0B" />
                                    {dueSoonInv.map(inv => (
                                        <NotifRow key={inv.id}
                                            icon={Clock} iconColor="#F59E0B"
                                            title={`${inv.clientName} · ${inv.number}`}
                                            sub={inv.diff === 0
                                                ? (lang === 'ID' ? `Jatuh tempo hari ini · ${formatIDR(inv.grandTotal)}` : `Due today · ${formatIDR(inv.grandTotal)}`)
                                                : (lang === 'ID' ? `${inv.diff} hari lagi · ${formatIDR(inv.grandTotal)}` : `In ${inv.diff} days · ${formatIDR(inv.grandTotal)}`)
                                            }
                                            subColor="#F59E0B"
                                            onClick={() => go('/invoice')}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── Piutang Jatuh Tempo ── */}
                        {piutangDue.length > 0 && (
                            <>
                                {(overdueInv.length > 0 || dueSoonInv.length > 0) && divider}
                                <div style={{ padding: '10px 16px 6px' }}>
                                    <SectionHeader label={lang === 'ID' ? `💰 ${piutangDue.length} Piutang Jatuh Tempo` : `💰 ${piutangDue.length} Receivable Due`} color="#10B981" />
                                    {piutangDue.map((p, i) => (
                                        <NotifRow key={i}
                                            icon={HandCoins} iconColor="#10B981"
                                            title={p.name || p.debtorName || (lang === 'ID' ? 'Tagihan Piutang' : 'Receivable')}
                                            sub={p.diff < 0
                                                ? (lang === 'ID' ? `Terlambat ${Math.abs(p.diff)} hari · ${formatIDR(p.amount)}` : `${Math.abs(p.diff)} days overdue · ${formatIDR(p.amount)}`)
                                                : p.diff === 0
                                                    ? (lang === 'ID' ? `Jatuh tempo hari ini · ${formatIDR(p.amount)}` : `Due today · ${formatIDR(p.amount)}`)
                                                    : (lang === 'ID' ? `${p.diff} hari lagi · ${formatIDR(p.amount)}` : `In ${p.diff} days · ${formatIDR(p.amount)}`)
                                            }
                                            subColor={p.diff < 0 ? '#EF4444' : '#10B981'}
                                            onClick={() => go('/hutang-piutang')}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── Hutang Jatuh Tempo ── */}
                        {hutangDue.length > 0 && (
                            <>
                                {(overdueInv.length > 0 || dueSoonInv.length > 0 || piutangDue.length > 0) && divider}
                                <div style={{ padding: '10px 16px 6px' }}>
                                    <SectionHeader label={lang === 'ID' ? `📋 ${hutangDue.length} Hutang Jatuh Tempo` : `📋 ${hutangDue.length} Payable Due`} color="#EF4444" />
                                    {hutangDue.map((h, i) => (
                                        <NotifRow key={i}
                                            icon={HandCoins} iconColor="#EF4444"
                                            title={h.name || h.creditorName || (lang === 'ID' ? 'Tagihan Hutang' : 'Payable')}
                                            sub={h.diff < 0
                                                ? (lang === 'ID' ? `Terlambat ${Math.abs(h.diff)} hari · ${formatIDR(h.amount)}` : `${Math.abs(h.diff)} days overdue · ${formatIDR(h.amount)}`)
                                                : h.diff === 0
                                                    ? (lang === 'ID' ? `Harus dibayar hari ini · ${formatIDR(h.amount)}` : `Pay today · ${formatIDR(h.amount)}`)
                                                    : (lang === 'ID' ? `${h.diff} hari lagi · ${formatIDR(h.amount)}` : `In ${h.diff} days · ${formatIDR(h.amount)}`)
                                            }
                                            subColor={h.diff < 0 ? '#EF4444' : '#F59E0B'}
                                            onClick={() => go('/hutang-piutang')}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── Stok Hampir Habis ── */}
                        {lowStock.length > 0 && (
                            <>
                                {(duePending.length > 0 || piutangDue.length > 0 || hutangDue.length > 0) && divider}
                                <div style={{ padding: '10px 16px 6px' }}>
                                    <SectionHeader label={lang === 'ID' ? `📦 ${lowStock.length} Stok Hampir Habis` : `📦 ${lowStock.length} Low Stock`} color="#7C3AED" />
                                    {lowStock.slice(0, 4).map((p, i) => (
                                        <NotifRow key={i}
                                            icon={Package} iconColor="#7C3AED"
                                            title={p.name}
                                            sub={p.stock === 0
                                                ? (lang === 'ID' ? 'Stok habis!' : 'Out of stock!')
                                                : (lang === 'ID' ? `Sisa ${p.stock} item` : `${p.stock} items left`)
                                            }
                                            subColor={p.stock === 0 ? '#EF4444' : '#7C3AED'}
                                            onClick={() => go('/kasir/produk')}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── Kuota FREE hampir habis ── */}
                        {(invoiceQuotaWarn || clientQuotaWarn) && (
                            <>
                                {(totalCount - (invoiceQuotaWarn ? 1 : 0) - (clientQuotaWarn ? 1 : 0)) > 0 && divider}
                                <div style={{ padding: '10px 16px 6px' }}>
                                    <SectionHeader label={lang === 'ID' ? '⚠️ Kuota Gratis' : '⚠️ Free Quota'} color="#F59E0B" />
                                    {invoiceQuotaWarn && (
                                        <NotifRow
                                            icon={Zap} iconColor="#F59E0B"
                                            title={lang === 'ID' ? `Invoice: ${invoicesThisMonth}/3 terpakai` : `Invoices: ${invoicesThisMonth}/3 used`}
                                            sub={lang === 'ID' ? 'Upgrade PRO untuk unlimited' : 'Upgrade PRO for unlimited'}
                                            subColor="#F59E0B"
                                            onClick={() => go('/upgrade')}
                                        />
                                    )}
                                    {clientQuotaWarn && (
                                        <NotifRow
                                            icon={Zap} iconColor="#F59E0B"
                                            title={lang === 'ID' ? `Klien: ${(clients || []).length}/1 terpakai` : `Clients: ${(clients || []).length}/1 used`}
                                            sub={lang === 'ID' ? 'Upgrade PRO untuk unlimited klien' : 'Upgrade PRO for unlimited clients'}
                                            subColor="#F59E0B"
                                            onClick={() => go('/upgrade')}
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── Trial akan berakhir ── */}
                        {trialWarning && (
                            <>
                                {totalCount > 1 && divider}
                                <div style={{ padding: '10px 16px 6px' }}>
                                    <SectionHeader label={lang === 'ID' ? '⏳ Trial PRO Berakhir' : '⏳ PRO Trial Ending'} color="#7C3AED" />
                                    <NotifRow
                                        icon={Clock} iconColor="#7C3AED"
                                        title={trialDays === 0
                                            ? (lang === 'ID' ? 'Trial berakhir hari ini!' : 'Trial ends today!')
                                            : (lang === 'ID' ? `Trial berakhir dalam ${trialDays} hari` : `Trial ends in ${trialDays} days`)
                                        }
                                        sub={lang === 'ID' ? 'Aktifkan PRO sekarang agar tidak terputus' : 'Activate PRO now to avoid interruption'}
                                        subColor="#7C3AED"
                                        onClick={() => go('/upgrade')}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {totalCount > 0 && (
                        <div style={{
                            padding: '10px 16px',
                            borderTop: `1px solid ${border}`,
                            textAlign: 'center',
                        }}>
                            <p style={{ margin: 0, fontSize: 12, color: sub }}>
                                {lang === 'ID'
                                    ? 'Notifikasi berdasarkan data lokal Anda'
                                    : 'Notifications based on your local data'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
