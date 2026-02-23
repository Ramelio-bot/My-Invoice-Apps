import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Globe, DollarSign, Zap, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];

export default function Navbar({ onMenuOpen }) {
    const { dark, toggle } = useTheme();
    const { lang, toggleLang } = useLang();
    const { isPro } = usePlan();
    const [currency, setCurrency] = useLocalStorage('currency', 'IDR');
    const [showCurrency, setShowCurrency] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const navigate = useNavigate();

    // Ctrl+K shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearch(s => !s);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const closeSearch = useCallback(() => setShowSearch(false), []);

    return (
        <>
            {showSearch && <GlobalSearch onClose={closeSearch} />}

            <header style={{
                height: '64px',
                borderBottom: '1px solid #E2E8F0',
                background: dark ? '#1E293B' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                flexShrink: 0,
            }} className="dark:border-slate-700">
                {/* Left: mobile menu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        className="mobile-menu-btn"
                        onClick={onMenuOpen}
                        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#64748B' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Right: controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>

                    {/* PRO badge */}
                    {isPro && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                            <Zap size={12} fill="currentColor" /> PRO
                        </div>
                    )}

                    {/* Search button */}
                    <button
                        onClick={() => setShowSearch(s => !s)}
                        title={`${lang === 'ID' ? 'Cari' : 'Search'} (Ctrl+K)`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: dark ? '#334155' : '#F1F5F9', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: dark ? '#E2E8F0' : '#374151', transition: 'all 200ms' }}
                    >
                        <Search size={14} />
                        <span className="search-label" style={{ fontSize: 13 }}>{lang === 'ID' ? 'Cari' : 'Search'}</span>
                        <kbd style={{ fontSize: 10, background: dark ? '#475569' : '#E2E8F0', borderRadius: 4, padding: '1px 4px', fontFamily: 'monospace', color: dark ? '#94A3B8' : '#64748B' }}>⌃K</kbd>
                    </button>

                    {/* Notification bell */}
                    <NotificationBell />

                    {/* Language toggle */}
                    <button onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 6, background: dark ? '#334155' : '#F1F5F9', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: dark ? '#E2E8F0' : '#374151', transition: 'all 200ms' }}>
                        <Globe size={14} /> {lang}
                    </button>

                    {/* Currency selector */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowCurrency(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: dark ? '#334155' : '#F1F5F9', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: dark ? '#E2E8F0' : '#374151', transition: 'all 200ms' }}>
                            <DollarSign size={14} /> {currency}
                        </button>
                        {showCurrency && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: dark ? '#1E293B' : 'white', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, borderRadius: 12, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 100 }}>
                                {CURRENCIES.map(c => (
                                    <button key={c} onClick={() => { setCurrency(c); setShowCurrency(false); }}
                                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: c === currency ? '#EDE9FE' : 'transparent', color: c === currency ? '#7C3AED' : (dark ? '#E2E8F0' : '#374151') }}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dark/light toggle */}
                    <button onClick={toggle} style={{ background: dark ? '#334155' : '#F1F5F9', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: dark ? '#FCD34D' : '#64748B', transition: 'all 200ms', display: 'flex', alignItems: 'center' }}>
                        {dark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </header>
        </>
    );
}
