import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Moon, Sun, Globe, Zap, Search, User, LogOut, Settings, Shield, Star, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

export default function Navbar({ onMenuOpen }) {
    const { dark, toggle } = useTheme();
    const { lang, toggleLang } = useLang();
    const { isPro } = usePlan();
    const { user, profile, signOut, isAdmin, trialActive, trialDaysLeft, effectivePlan } = useAuth();
    const [showSearch, setShowSearch] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);
    const navigate = useNavigate();

    const isGuest = localStorage.getItem('guest_mode') === 'true';

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

    // Click outside to close profile menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setShowProfileMenu(false);
        await signOut();
        navigate('/');
    };

    const getPlanBadge = () => {
        if (isAdmin) return <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">ADMIN</span>;
        if (effectivePlan === 'ultimate') return <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-bold">ULTIMATE 👑</span>;
        if (effectivePlan === 'pro') {
            if (trialActive) return <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">PRO TRIAL · {trialDaysLeft} hari</span>;
            return <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">PRO ⭐</span>;
        }
        return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">FREE</span>;
    };

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

                    {/* Trial Chip */}
                    {trialActive && trialDaysLeft <= 7 && (
                        <button
                            onClick={() => navigate('/upgrade')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${trialDaysLeft <= 3 ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
                        >
                            <Clock size={14} /> {trialDaysLeft} hari
                        </button>
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

                    {/* Dark/light toggle */}
                    <button onClick={toggle} style={{ background: dark ? '#334155' : '#F1F5F9', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: dark ? '#FCD34D' : '#64748B', transition: 'all 200ms', display: 'flex', alignItems: 'center' }}>
                        {dark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    {/* Auth Area */}
                    {!user ? (
                        <div className="flex items-center gap-2 ml-2 border-l border-gray-200 dark:border-gray-700 pl-4">
                            <Link to="/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Masuk</Link>
                            <Link to="/register" className="text-sm font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition">Daftar</Link>
                        </div>
                    ) : (
                        <div className="relative ml-2" ref={profileMenuRef}>
                            <button
                                onClick={() => setShowProfileMenu(s => !s)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition ring-2 ring-transparent focus:ring-blue-300"
                            >
                                <User size={18} strokeWidth={2.5} />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                        <p className="font-bold text-gray-800 dark:text-white truncate">{profile?.full_name || 'User'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 mb-2">{user.email}</p>
                                        {getPlanBadge()}
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition text-left">
                                            <Settings size={16} className="text-gray-400" /> Profil & Pengaturan
                                        </button>

                                        {effectivePlan !== 'ultimate' && (
                                            <button onClick={() => { setShowProfileMenu(false); navigate('/upgrade'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition text-left font-medium">
                                                <Star size={16} /> Upgrade Plan
                                            </button>
                                        )}

                                        {isAdmin && (
                                            <button onClick={() => { setShowProfileMenu(false); navigate('/admin'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition text-left font-medium">
                                                <Shield size={16} /> Admin Panel
                                            </button>
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition text-left">
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>
        </>
    );
}
