import { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatIDR } from '../utils/currency';

function daysDiff(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    return Math.floor((due - today) / 86400000);
}

export default function NotificationBell() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const [invoices] = useLocalStorage('invoice_data', []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Find invoices with due dates
    const duePending = (invoices || [])
        .filter(inv => inv.dueDate && (inv.status !== 'paid' && inv.status !== 'Lunas'))
        .map(inv => ({ ...inv, diff: daysDiff(inv.dueDate) }))
        .filter(inv => inv.diff <= 3)
        .sort((a, b) => a.diff - b.diff);

    const overdue = duePending.filter(i => i.diff < 0);
    const dueSoon = duePending.filter(i => i.diff >= 0 && i.diff <= 3);
    const count = duePending.length;

    const bg = dark ? '#1E293B' : 'white';
    const border = dark ? '#334155' : '#E2E8F0';
    const text = dark ? '#F1F5F9' : '#0F172A';
    const sub = dark ? '#94A3B8' : '#64748B';

    return (
        <div ref={ref} style={{ position: 'relative' }}>
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
                {count > 0 && (
                    <span style={{
                        position: 'absolute', top: -3, right: -3,
                        width: 16, height: 16, borderRadius: '50%',
                        background: overdue.length > 0 ? '#EF4444' : '#F59E0B',
                        color: 'white', fontSize: 10, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    minWidth: 320, maxWidth: 360, zIndex: 500,
                    animation: 'scaleIn 150ms ease',
                }}>
                    <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${border}` }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: text }}>
                            {lang === 'ID' ? 'Notifikasi Invoice' : 'Invoice Notifications'}
                        </p>
                    </div>

                    <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                        {count === 0 ? (
                            <div style={{ padding: '24px 16px', textAlign: 'center', color: sub, fontSize: 13 }}>
                                {lang === 'ID' ? 'Tidak ada invoice jatuh tempo.' : 'No invoices due soon.'}
                            </div>
                        ) : (
                            <>
                                {overdue.length > 0 && (
                                    <div style={{ padding: '8px 16px 4px' }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1 }}>
                                            {lang === 'ID' ? `${overdue.length} Invoice Jatuh Tempo` : `${overdue.length} Overdue`}
                                        </p>
                                        {overdue.map(inv => (
                                            <button key={inv.id} onClick={() => { setOpen(false); navigate('/invoice'); }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 0', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                                            >
                                                <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>{inv.clientName} · {inv.number}</p>
                                                    <p style={{ margin: 0, fontSize: 12, color: '#EF4444' }}>
                                                        {lang === 'ID' ? `${Math.abs(inv.diff)} hari terlambat` : `${Math.abs(inv.diff)} days overdue`} · {formatIDR(inv.grandTotal)}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {dueSoon.length > 0 && (
                                    <div style={{ padding: '8px 16px 8px', borderTop: overdue.length > 0 ? `1px solid ${border}` : 'none' }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>
                                            {lang === 'ID' ? `${dueSoon.length} Jatuh Tempo Segera` : `${dueSoon.length} Due Soon`}
                                        </p>
                                        {dueSoon.map(inv => (
                                            <button key={inv.id} onClick={() => { setOpen(false); navigate('/invoice'); }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 0', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                                            >
                                                <Clock size={16} color="#F59E0B" style={{ flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>{inv.clientName} · {inv.number}</p>
                                                    <p style={{ margin: 0, fontSize: 12, color: '#F59E0B' }}>
                                                        {inv.diff === 0
                                                            ? (lang === 'ID' ? 'Jatuh tempo hari ini' : 'Due today')
                                                            : (lang === 'ID' ? `${inv.diff} hari lagi` : `In ${inv.diff} days`)
                                                        } · {formatIDR(inv.grandTotal)}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
