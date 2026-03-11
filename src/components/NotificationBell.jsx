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
    const { lang, t } = useLang();
    const { effectivePlan, profile, user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Data states
    const [debts, setDebts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [invoiceCount, setInvoiceCount] = useState(0);
    const [clientCount, setClientCount] = useState(0);

    // Fetch data from Supabase
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            const nowStr = new Date().toISOString().slice(0, 10);

            // 1. Fetch Debts (Piutang & Hutang)
            const { data: dbDocs } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', user.id)
                .in('type', ['piutang', 'hutang'])
                .neq('status', 'paid');
            
            if (dbDocs) {
                const mapped = dbDocs.map(d => ({
                    id: d.id,
                    type: d.type,
                    name: d.client_name,
                    amount: d.total_amount || d.total || d.data?.amount || 0,
                    dueDate: d.data?.dueDate || d.data?.due_date || d.created_at,
                    diff: daysDiff(d.data?.dueDate || d.data?.due_date || d.created_at)
                })).filter(d => d.diff <= 3);
                setDebts(mapped);
            }

            // 2. Fetch Low/No Stock Products (Qty <= 5)
            const { data: dbProducts } = await supabase
                .from('kasir_products')
                .select('*')
                .eq('user_id', user.id)
                .lte('stock', 5)
                .eq('is_active', true);
            if (dbProducts) setLowStock(dbProducts);

            // 3. Fetch current month invoices for free quota tracking
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const { count: invCount } = await supabase
                .from('documents')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('type', 'invoice')
                .gte('created_at', startOfMonth);
            setInvoiceCount(invCount || 0);

            // 4. Fetch clients count
            const { count: cCount } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            setClientCount(cCount || 0);
        };

        fetchData();
        
        // Refresh when events happen
        window.addEventListener('cashbook-updated', fetchData);
        window.addEventListener('invoice-created', fetchData);
        return () => {
            window.removeEventListener('cashbook-updated', fetchData);
            window.removeEventListener('invoice-created', fetchData);
        };
    }, [user]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Process categories
    const overdueDebts = debts.filter(d => d.diff < 0);
    const dueSoonDebts = debts.filter(d => d.diff >= 0);

    const isFree = effectivePlan === 'free';
    const invoiceQuotaWarn = isFree && invoiceCount >= 8; // Warn near 10
    const clientQuotaWarn = isFree && clientCount >= 4; // Warn near 5

    const trialDays = profile?.trial_ends_at
        ? Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000)
        : null;
    const trialWarning = trialDays !== null && trialDays >= 0 && trialDays <= 3;

    const totalCount = 
        debts.length + 
        lowStock.length + 
        (invoiceQuotaWarn ? 1 : 0) + 
        (clientQuotaWarn ? 1 : 0) + 
        (trialWarning ? 1 : 0);

    const hasUrgent = overdueDebts.length > 0 || lowStock.some(p => p.stock === 0) || trialWarning;

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
                <div className="notif-dropdown" style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: -40, // center somewhat on desktop
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    width: 370, maxWidth: 'calc(100vw - 32px)',
                    zIndex: 500,
                    animation: 'scaleIn 150ms ease',
                    transformOrigin: 'top center'
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

                        {/* ── Debts (Hutang/Piutang) ── */}
                        {overdueDebts.length > 0 && (
                            <div style={{ padding: '10px 16px 6px' }}>
                                <SectionHeader label={lang === 'ID' ? `🚨 ${overdueDebts.length} Tertunda` : `🚨 ${overdueDebts.length} Overdue`} color="#EF4444" />
                                {overdueDebts.map(d => (
                                    <NotifRow key={d.id}
                                        icon={AlertCircle} iconColor="#EF4444"
                                        title={`${d.name} (${d.type === 'piutang' ? 'Piutang' : 'Hutang'})`}
                                        sub={lang === 'ID' ? `${Math.abs(d.diff)} hari terlambat · ${formatIDR(d.amount)}` : `${Math.abs(d.diff)} days overdue · ${formatIDR(d.amount)}`}
                                        subColor="#EF4444"
                                        onClick={() => go('/hutang-piutang')}
                                    />
                                ))}
                            </div>
                        )}

                        {dueSoonDebts.length > 0 && (
                            <>
                                {overdueDebts.length > 0 && divider}
                                <div style={{ padding: '10px 16px 6px' }}>
                                    <SectionHeader label={lang === 'ID' ? `⏰ ${dueSoonDebts.length} Jatuh Tempo` : `⏰ ${dueSoonDebts.length} Due Soon`} color="#F59E0B" />
                                    {dueSoonDebts.map(d => (
                                        <NotifRow key={d.id}
                                            icon={Clock} iconColor="#F59E0B"
                                            title={`${d.name} (${d.type === 'piutang' ? 'Piutang' : 'Hutang'})`}
                                            sub={d.diff === 0
                                                ? (lang === 'ID' ? `Hari ini · ${formatIDR(d.amount)}` : `Today · ${formatIDR(d.amount)}`)
                                                : (lang === 'ID' ? `${d.diff} hari lagi · ${formatIDR(d.amount)}` : `In ${d.diff} days · ${formatIDR(d.amount)}`)
                                            }
                                            subColor="#F59E0B"
                                            onClick={() => go('/hutang-piutang')}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── Stok Hampir Habis ── */}
                        {lowStock.length > 0 && (
                            <>
                                {(debts.length > 0) && divider}
                                <div style={{ padding: '10px 16px 6px' }}>
                                    <SectionHeader label={lang === 'ID' ? `📦 ${lowStock.length} Stok Hampir Habis` : `📦 ${lowStock.length} Low Stock`} color="#7C3AED" />
                                    {lowStock.slice(0, 5).map((p, i) => (
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
                                            title={lang === 'ID' ? `Invoice: ${invoiceCount}/10 terpakai` : `Invoices: ${invoiceCount}/10 used`}
                                            sub={lang === 'ID' ? 'Peningkatan ke PRO untuk unlimited' : 'Upgrade to PRO for unlimited'}
                                            subColor="#F59E0B"
                                            onClick={() => go('/upgrade')}
                                        />
                                    )}
                                    {clientQuotaWarn && (
                                        <NotifRow
                                            icon={Zap} iconColor="#F59E0B"
                                            title={lang === 'ID' ? `Klien: ${clientCount}/5 terpakai` : `Clients: ${clientCount}/5 used`}
                                            sub={lang === 'ID' ? 'Peningkatan ke PRO untuk unlimited' : 'Upgrade to PRO for unlimited'}
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
