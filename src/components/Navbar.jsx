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
                <div className="flex flex-row items-center overflow-x-auto md:overflow-visible whitespace-nowrap scrollbar-hide gap-4 px-2 sm:px-4 ml-auto h-full">
                    {/* Trial Chip */}
                    {trialActive && (
                        <button
                            onClick={() => navigate('/upgrade')}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${trialDaysLeft <= 3 ? 'bg-red-100 text-red-600 hover:bg-red-200' : trialDaysLeft <= 7 ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
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
                        <div className="relative ml-2 flex-shrink-0" ref={profileMenuRef}>
                            <button
                                onClick={() => setShowProfileMenu(s => !s)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white hover:ring-2 hover:ring-blue-400 transition ring-2 ring-transparent focus:ring-blue-300 overflow-hidden"
                            >
                                {profile?.company_logo ? (
                                    <img src={profile.company_logo} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} strokeWidth={2.5} />
                                )}
                            </button>

                             {/* Mobile centered control center or Desktop dropdown */}
                             {showProfileMenu && (
                                 <div 
                                     className="fixed inset-0 flex items-center justify-center p-4 z-[9998] md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:p-0"
                                     onClick={() => setShowProfileMenu(false)}
                                 >
                                     <div 
                                         className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden" 
                                         onClick={() => setShowProfileMenu(false)}
                                     />
                                     <div 
                                         ref={profileMenuRef} 
                                         onClick={e => e.stopPropagation()}
                                         className="relative z-[9999] w-full max-w-sm md:w-72 bg-white rounded-[32px] md:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
                                     >
                                         <div className="p-6 md:p-4 border-b border-gray-100 bg-slate-50 md:bg-white text-center md:text-left">
                                             <div className="w-20 h-20 md:w-12 md:h-12 bg-blue-600 rounded-full mx-auto md:mx-0 mb-4 md:mb-2 flex items-center justify-center text-white text-3xl md:text-xl font-bold">
                                                {profile?.company_logo ? (
                                                    <img src={profile.company_logo} alt="L" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    (profile?.full_name?.[0] || 'U').toUpperCase()
                                                )}
                                             </div>
                                             <p className="font-black text-gray-800 text-xl md:text-base truncate">{profile?.full_name || profile?.company_name || 'User'}</p>
                                             <p className="text-base md:text-xs text-gray-500 truncate mt-1 mb-2">{user.email}</p>
                                             <div className="flex justify-center md:justify-start">
                                                {getPlanBadge()}
                                             </div>
                                         </div>
 
                                         <div className="p-4 md:p-2 space-y-4 md:space-y-1">
                                             <button 
                                                 onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} 
                                                 className="w-full flex items-center gap-4 md:gap-3 px-6 py-4 md:px-4 md:py-3 text-lg md:text-sm text-gray-700 bg-slate-50 md:bg-transparent hover:bg-slate-100 md:hover:bg-gray-50 rounded-2xl md:rounded-lg transition text-left font-bold md:font-semibold"
                                             >
                                                 <Settings size={28} className="text-gray-400 md:size-4" /> {t('navbar_profile')}
                                             </button>
 
                                             {effectivePlan !== 'ultimate' && (
                                                 <button 
                                                     onClick={() => { setShowProfileMenu(false); navigate('/upgrade'); }} 
                                                     className="w-full flex items-center gap-4 md:gap-3 px-6 py-4 md:px-4 md:py-3 text-lg md:text-sm text-blue-600 bg-blue-50 md:bg-transparent hover:bg-blue-100 md:hover:bg-blue-50 rounded-2xl md:rounded-lg transition text-left font-black"
                                                 >
                                                     <Star size={28} className="md:size-4" /> {t('navbar_upgrade_plan')}
                                                 </button>
                                             )}
 
                                             {isAdmin && (
                                                 <button 
                                                     onClick={() => { setShowProfileMenu(false); navigate('/admin'); }} 
                                                     className="w-full flex items-center gap-4 md:gap-3 px-6 py-4 md:px-4 md:py-3 text-lg md:text-sm text-red-600 bg-red-50 md:bg-transparent hover:bg-red-100 md:hover:bg-red-50 rounded-2xl md:rounded-lg transition text-left font-black"
                                                 >
                                                     <Shield size={28} className="md:size-4" /> Admin Panel
                                                 </button>
                                             )}
 
                                             <button 
                                                 onClick={handleLogout} 
                                                 className="w-full flex items-center gap-4 md:gap-3 px-6 py-4 md:px-4 md:py-3 text-lg md:text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-2xl md:rounded-lg transition text-left border-t border-gray-100"
                                             >
                                                 <LogOut size={28} className="md:size-4" /> {t('navbar_logout')}
                                             </button>
                                         </div>
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
