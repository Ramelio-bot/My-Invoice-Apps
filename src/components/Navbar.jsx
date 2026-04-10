import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, Zap, Search, User, LogOut, Settings, Shield, Star, Clock } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

export default function Navbar({ onMenuOpen }) {
    const { lang, toggleLang, t } = useLang();
    const { isPro } = usePlan();
    const { user, profile, signOut, isAdmin, trialActive, trialDaysLeft, effectivePlan } = useAuth();
    const [showSearch, setShowSearch] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);
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
        if (isAdmin) return <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0">ADMIN</span>;
        if (effectivePlan === 'ultimate') return <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0">ULTIMATE</span>;
        if (effectivePlan === 'pro') {
            if (trialActive) return <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0">PRO TRIAL · {trialDaysLeft} {t('navbar_trial_days')}</span>;
            return <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0">PRO</span>;
        }
        return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0">FREE</span>;
    };

    const closeSearch = useCallback(() => setShowSearch(false), []);

    return (
        <>
            {showSearch && <GlobalSearch onClose={closeSearch} />}

            <header style={{
                height: '64px',
                borderBottom: '1px solid #E2E8F0',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                position: 'sticky',
                top: 0,
                zIndex: 10000,
                flexShrink: 0,
            }}>
                {/* Left: mobile menu */}
                <div className="flex-shrink-0 flex items-center gap-3">
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
                {/* Right: controls - MANDATORY HORIZONTAL SCROLL ON MOBILE */}
                <div className="flex flex-row items-center gap-2 sm:gap-4 px-2 sm:px-4 ml-auto h-full overflow-visible"> 
                    
                    {/* Tombol Menu Mobile (Hamburger) - Muncul HANYA di Mobile */}
                    <button
                        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        onClick={onMenuOpen}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>

                    {/* Trial Chip */}
                    {trialActive && (
                        <button
                            onClick={() => navigate('/upgrade')}
                            className={`flex-shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${trialDaysLeft <= 3 ? 'bg-red-100 text-red-600 hover:bg-red-200' : trialDaysLeft <= 7 ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        >
                            <Clock size={14} /> {trialDaysLeft} {t('navbar_trial_days')}
                        </button>
                    )}

                    {/* Search button */}
                    <button
                        onClick={() => setShowSearch(s => !s)}
                        title={`${t('search_tooltip')} (Ctrl+K)`}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
                        style={{ 
                            background: '#F1F5F9', 
                            border: 'none', 
                            color: '#374151',
                        }}
                    >
                        <Search size={14} />
                        <span className="hidden sm:inline">{t('search_tooltip')}</span>
                        <kbd className="hidden md:inline-block ml-1 text-[10px] opacity-50">⌃K</kbd>
                    </button>

                    {/* Notification bell */}
                    <div className="flex-shrink-0">
                        <NotificationBell />
                    </div>

                    {/* Language toggle */}
                    <button 
                        onClick={toggleLang} 
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
                        style={{ 
                            background: '#F1F5F9', 
                            border: 'none', 
                            color: '#374151',
                        }}
                    >
                        <Globe size={14} /> {lang}
                    </button>


                    {/* Auth Area */}
                    {!user ? (
                        <div className="flex-shrink-0 flex items-center gap-2 ml-2 border-l border-gray-200 pl-4">
                            <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition flex-shrink-0">{t('navbar_login')}</Link>
                            <Link to="/register" className="text-sm font-semibold bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition flex-shrink-0">{t('navbar_register')}</Link>
                        </div>
                    ) : (
                        <div className="relative flex-shrink-0 ml-2" ref={profileMenuRef}>
                            <button
                                onClick={() => setShowProfileMenu(true)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 ring-2 ring-white shadow-md overflow-hidden"
                            >
                                {profile?.company_logo ? (
                                    <img src={profile.company_logo} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-white" />
                                )}
                            </button>

                            {showProfileMenu && (
                                <>
                                    {/* BACKDROP BLUR - Menutup SELURUH layar termasuk Navbar */}
                                    <div 
                                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10001]" 
                                        onClick={() => setShowProfileMenu(false)}
                                    />

                                    {/* POP-UP MENU: Center on Mobile, Dropdown on Desktop */}
                                    <div className="fixed inset-0 flex items-center justify-center z-[10002] md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:block">
                                        <div 
                                            className="w-[90%] max-w-sm md:w-72 bg-white rounded-[32px] md:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {/* Handle Bar untuk Mobile */}
                                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 md:hidden" />

                                            <div className="p-8 md:p-5 border-b border-gray-50 text-center md:text-left">
                                                <div className="w-20 h-20 mx-auto md:mx-0 mb-4 md:mb-2 rounded-full border-4 border-blue-50 overflow-hidden flex items-center justify-center bg-blue-600 text-white text-3xl md:hidden">
                                                     {profile?.company_logo ? (
                                                         <img src={profile.company_logo} alt="L" className="w-full h-full object-cover" />
                                                     ) : (
                                                         (profile?.full_name?.[0] || 'U').toUpperCase()
                                                     )}
                                                </div>
                                                <p className="font-black text-gray-900 text-2xl md:text-base truncate">{profile?.full_name || profile?.company_name || 'User'}</p>
                                                <p className="text-base md:text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>

                                            <div className="p-4 md:p-2 space-y-4 md:space-y-1">
                                                <button 
                                                    onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} 
                                                    className="w-full flex items-center gap-6 md:gap-3 px-6 py-5 md:px-4 md:py-3 text-xl md:text-sm text-gray-700 hover:bg-gray-50 rounded-2xl md:rounded-lg transition-all text-left font-bold"
                                                >
                                                    <Settings size={24} className="text-blue-500 md:size-4" /> {t('navbar_profile')}
                                                </button>
                                                <button 
                                                    onClick={handleLogout} 
                                                    className="w-full flex items-center gap-6 md:gap-3 px-6 py-5 md:px-4 md:py-3 text-xl md:text-sm text-red-600 hover:bg-red-50 rounded-2xl md:rounded-lg transition-all text-left font-bold"
                                                >
                                                    <LogOut size={24} className="md:size-4" /> {t('navbar_logout')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </header>
        </>
    );
}
