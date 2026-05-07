import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
function NotifRow({ icon: Icon, iconColor, title, sub, subColor, onClick, dark }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '12px 16px',
                borderBottom: `1px solid ${dark ? '#334155' : '#F1F5F9'}`,
                background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = dark ? '#334155' : '#F8FAFC'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
            {Icon && <Icon size={16} color={iconColor} style={{ flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: 13, fontWeight: 700,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: dark ? '#F1F5F9' : '#0F172A'
                }}>{title}</p>
                {sub && <p style={{ margin: 0, fontSize: 12, color: subColor || (dark ? '#94A3B8' : '#64748B') }}>{sub}</p>}
            </div>
        </button>
    );
}

export default function NotificationBell() {
    const { dark } = useTheme();
    const { t } = useLang();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Data states
    const [debts, setDebts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [] = useState(0);
    const [] = useState(0);

    // Fetch data from Supabase
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
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
                    setDebts(mapped.sort((a, b) => a.diff - b.diff));
                }

                // 2. Fetch Low/No Stock Products (Qty <= 10)
                const { data: dbProducts } = await supabase
                    .from('kasir_products')
                    .select('id, name, stock')
                    .eq('user_id', user.id)
                    .lte('stock', 10)
                    .eq('is_active', true);
                if (dbProducts) setLowStock(dbProducts.sort((a, b) => a.stock - b.stock));
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
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

    const go = (path) => { setOpen(false); navigate(path); };
    // Build flat notifications list
    const notifications = [];

    debts.forEach(d => {
        const typeStr = d.type === 'piutang' ? 'Piutang' : 'Hutang';
        const emoji = d.diff < 0 ? '🚨' : '⚠️';
        const title = `${emoji} ${typeStr} "${d.name}"`;
        
        let sub = '';
        if (d.diff < 0) {
            sub = t('notif_debt_overdue');
        } else if (d.diff === 0 || d.diff === 1) {
            sub = t('notif_debt_due');
        } else {
            sub = t('notif_debt_due_days').replace('{n}', d.diff);
        }

        notifications.push({
            id: `debt-${d.id}`,
            title,
            sub,
            onClick: () => go('/hutang-piutang')
        });
    });

    lowStock.forEach(p => {
        const title = `📦 Produk "${p.name}"`;
        let sub = '';
        if (p.stock === 0) {
            sub = t('notif_stock_out');
        } else {
            sub = t('notif_stock_low').replace('{n}', p.stock);
        }

        notifications.push({
            id: `stock-${p.id}`,
            title,
            sub,
            onClick: () => go('/kasir/produk')
        });
    });

    const totalCount = notifications.length;

    const bg = dark ? '#1E293B' : 'white';
    const border = dark ? '#334155' : '#E2E8F0';
    const text = dark ? '#F1F5F9' : '#0F172A';
    const subColor = dark ? '#94A3B8' : '#64748B';

//     const divider = <div style={{ height: 1, background: border, margin: '4px 0' }} />;



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
                title={t('notif_title')}
            >
                <Bell size={16} />
                {totalCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -3, right: -3,
                        minWidth: 16, height: 16, borderRadius: 8,
                        background: '#EF4444',
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
                            🔔 {t('notif_title')} {totalCount > 0 ? `(${totalCount})` : ''}
                        </p>
                    </div>

                    <div style={{ maxHeight: 420, overflowY: 'auto', scrollbarWidth: 'thin' }}>

                        {/* Empty state */}
                        {totalCount === 0 && (
                            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                <CheckCircle size={32} color="#10B981" style={{ margin: '0 auto 10px', display: 'block' }} />
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>
                                    {t('notif_empty')}
                                </p>
                            </div>
                        )}

                        {/* List format */}
                        {notifications.length > 0 && (
                            <div style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                                {notifications.map(n => (
                                    <NotifRow 
                                        key={n.id}
                                        dark={dark}
                                        title={n.title}
                                        sub={n.sub}
                                        onClick={n.onClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {totalCount > 0 && (
                        <div style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                        }}>
                            <p style={{ margin: 0, fontSize: 12, color: subColor }}>
                                {t('notif_local_data_hint')}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
