import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatIDR } from '../utils/currency';

export default function GlobalSearch({ onClose }) {
    const { dark } = useTheme();
    const { lang } = useLang();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    const [invoices] = useLocalStorage('invoice_data', []);
    const [clients] = useLocalStorage('clients_data', []);
    const [cashbook] = useLocalStorage('cashbook_data', []);

    useEffect(() => { inputRef.current?.focus(); }, []);

    // Escape key closes
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const q = query.toLowerCase().trim();

    const matchedInvoices = q ? (invoices || []).filter(inv =>
        inv.number?.toLowerCase().includes(q) ||
        inv.clientName?.toLowerCase().includes(q) ||
        String(inv.grandTotal || '').includes(q)
    ).slice(0, 5) : [];

    const matchedClients = q ? (clients || []).filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    ).slice(0, 4) : [];

    const matchedTx = q ? (cashbook || []).filter(e =>
        e.category?.toLowerCase().includes(q) ||
        e.note?.toLowerCase().includes(q)
    ).slice(0, 4) : [];

    const hasResults = matchedInvoices.length || matchedClients.length || matchedTx.length;

    const bg = dark ? '#1E293B' : 'white';
    const border = dark ? '#334155' : '#E2E8F0';
    const text = dark ? '#F1F5F9' : '#0F172A';
    const sub = dark ? '#94A3B8' : '#64748B';
    const row = dark ? '#0F172A' : '#F8FAFC';

    const goTo = useCallback((path) => { onClose(); navigate(path); }, [navigate, onClose]);

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 600, padding: '0 16px' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ background: bg, borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', border: `1px solid ${border}`, overflow: 'hidden', animation: 'slideUp 180ms ease' }}>
                    {/* Search input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
                        <Search size={18} color={sub} />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={lang === 'ID' ? 'Cari dokumen, klien, transaksi...' : 'Search documents, clients, transactions...'}
                            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: text, outline: 'none', fontFamily: 'inherit' }}
                        />
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, display: 'flex', borderRadius: 6, padding: 2 }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Results */}
                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {!q && (
                            <p style={{ padding: '32px 16px', textAlign: 'center', color: sub, fontSize: 14, margin: 0 }}>
                                {lang === 'ID' ? 'Ketik untuk mulai mencari...' : 'Type to start searching...'}
                            </p>
                        )}

                        {q && !hasResults && (
                            <p style={{ padding: '32px 16px', textAlign: 'center', color: sub, fontSize: 14, margin: 0 }}>
                                {lang === 'ID' ? 'Tidak ada hasil ditemukan' : 'No results found'}
                            </p>
                        )}

                        {/* Invoices */}
                        {matchedInvoices.length > 0 && (
                            <div>
                                <p style={{ margin: 0, padding: '10px 16px 6px', fontSize: 11, fontWeight: 800, color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {lang === 'ID' ? 'Dokumen' : 'Documents'}
                                </p>
                                {matchedInvoices.map(inv => (
                                    <button key={inv.id} onClick={() => goTo('/invoice')}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 150ms' }}
                                        onMouseEnter={e => e.currentTarget.style.background = row}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <FileText size={15} color="#7C3AED" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.number}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: sub }}>{inv.clientName} · {formatIDR(inv.grandTotal)}</p>
                                        </div>
                                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: inv.status === 'paid' || inv.status === 'Lunas' ? '#D1FAE5' : '#FEF3C7', color: inv.status === 'paid' || inv.status === 'Lunas' ? '#065F46' : '#92400E', fontWeight: 700 }}>
                                            {inv.status}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Clients */}
                        {matchedClients.length > 0 && (
                            <div>
                                <p style={{ margin: 0, padding: '10px 16px 6px', fontSize: 11, fontWeight: 800, color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {lang === 'ID' ? 'Klien' : 'Clients'}
                                </p>
                                {matchedClients.map(c => (
                                    <button key={c.id} onClick={() => goTo('/klien')}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 150ms' }}
                                        onMouseEnter={e => e.currentTarget.style.background = row}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, color: 'white', fontSize: 13 }}>
                                            {c.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: text }}>{c.name}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: sub }}>{c.email || c.phone || ''}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Transactions */}
                        {matchedTx.length > 0 && (
                            <div>
                                <p style={{ margin: 0, padding: '10px 16px 6px', fontSize: 11, fontWeight: 800, color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {lang === 'ID' ? 'Transaksi' : 'Transactions'}
                                </p>
                                {matchedTx.map(e => (
                                    <button key={e.id} onClick={() => goTo('/catatan-bisnis')}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 150ms' }}
                                        onMouseEnter={el => el.currentTarget.style.background = row}
                                        onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: e.type === 'income' ? '#D1FAE5' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <BookOpen size={14} color={e.type === 'income' ? '#10B981' : '#EF4444'} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: text }}>{e.category}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: sub }}>{e.date}{e.note ? ` · ${e.note}` : ''}</p>
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: e.type === 'income' ? '#10B981' : '#EF4444' }}>
                                            {e.type === 'income' ? '+' : '-'}{formatIDR(e.amount)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Bottom padding */}
                        <div style={{ height: 8 }} />
                    </div>

                    {/* Footer hint */}
                    <div style={{ padding: '8px 16px', borderTop: `1px solid ${border}`, display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 11, color: sub }}><kbd style={{ background: dark ? '#334155' : '#F1F5F9', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>Esc</kbd> {lang === 'ID' ? 'Tutup' : 'Close'}</span>
                        <span style={{ fontSize: 11, color: sub }}><kbd style={{ background: dark ? '#334155' : '#F1F5F9', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>↵</kbd> {lang === 'ID' ? 'Buka' : 'Open'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
