import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, FileText, BarChart2, Users, Store, Plus, X, ShoppingCart, FilePlus, MinusCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import TrialBanner from './TrialBanner';
import OnboardingModal from './OnboardingModal';
import OnboardingWizard from './OnboardingWizard';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../store/useStore';

// Mobile bottom nav (5 main items)
const mobileNav = [
    { to: '/dashboard', icon: Home, key: 'nav_home' },
    { to: '/catatan-bisnis', icon: BookOpen, key: 'nav_cashbook' },
    { to: '/laporan', icon: BarChart2, key: 'nav_report' },
    { to: '/klien', icon: Users, key: 'nav_clients' },
    { to: '/invoice', icon: FileText, key: 'nav_invoice' },
];

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { t, lang, setLang } = useLang();
    const isEn = lang === 'EN';
    const { effectivePlan, user, profile } = useAuth();
    const { isZenMode } = useStore();

    const needsNewUserOnboarding = user && profile && profile.onboarding_completed === false;

    // Pastikan seluruh sesi aplikasi di dalam Layout terkunci ke Bahasa Indonesia
    useEffect(() => {
        if (lang !== 'ID') {
            if (setLang) setLang('ID');
            try {
                localStorage.setItem('lang', 'ID');
            } catch (err) { void err; }
        }
    }, [lang, setLang]);

    return (
        <div className="overscroll-none" style={{
            display: 'flex',
            height: '100dvh',
            overflow: 'hidden',
            background: '#F8FAFC',
        }}>
            {/* Desktop sidebar */}
            <div className={`desktop-sidebar ${isZenMode ? '-translate-x-full absolute opacity-0' : 'translate-x-0 relative opacity-100'} transition-all duration-300 ease-in-out z-40`} style={{
                width: isZenMode ? 0 : 260,
                flexShrink: 0,
                height: '100%',
                overflow: 'hidden',
            }}>
                <Sidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 500,
                        background: 'rgba(15,23,42,0.5)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setSidebarOpen(false)}
                >
                    <div
                        style={{ width: 280, height: '100%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <Sidebar mobile onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className={`${isZenMode ? 'h-0 -translate-y-full opacity-0 overflow-hidden absolute' : 'h-auto translate-y-0 opacity-100 relative'} transition-all duration-300 ease-in-out w-full z-40 flex flex-col`}>
                    <Navbar onMenuOpen={() => setSidebarOpen(true)} />
                    <TrialBanner />
                </div>

                {needsNewUserOnboarding && <OnboardingWizard />}

                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: isZenMode ? 0 : '0 0 80px 0',
                }}>
                    {children}
                </main>
            </div>

            {/* Mobile bottom tab navigation */}
            <nav
                className={`mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-in-out ${isZenMode ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
                style={{
                    display: 'none',
                    position: 'fixed',
                    bottom: 0, left: 0, right: 0,
                    height: 'calc(68px + env(safe-area-inset-bottom, 0px))',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    background: 'white',
                    borderTop: '1px solid #E2E8F0',
                    zIndex: 400,
                }}
            >
                {mobileNav.map(({ to, icon: Icon, key }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        style={({ isActive }) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            gap: 3,
                            textDecoration: 'none',
                            color: isActive ? '#7C3AED' : '#94A3B8',
                            fontSize: 10,
                            fontWeight: 600,
                            transition: 'color 200ms',
                            padding: '8px 4px',
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                                <span>{t(key)}</span>
                            </>
                        )}
                    </NavLink>
                ))}
                {effectivePlan === 'ultimate' && (
                    <NavLink
                        to="/kasir"
                        style={({ isActive }) => ({
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            flex: 1, gap: 3, textDecoration: 'none',
                            color: isActive ? '#7C3AED' : '#94A3B8', fontSize: 10, fontWeight: 600,
                            transition: 'color 200ms', padding: '8px 4px',
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <Store size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                                <span>{isEn ? 'POS' : 'Kasir'}</span>
                            </>
                        )}
                    </NavLink>
                )}
            </nav>

            {/* Quick Action FAB (Mobile Only - Hidden in Cashier & Zen Mode) */}
            {!isZenMode && !location.pathname.startsWith('/kasir') && <QuickActionFAB />}

            <style>{`
        @media (max-width: 1023px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 1024px) {
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .mobile-bottom-nav { display: flex !important; }
        }
        @media (min-width: 768px) {
          .mobile-bottom-nav { display: none !important; }
        }
        
        @keyframes fab-slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fab-slide-up {
          animation: fab-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
        </div>
    );
}

function QuickActionFAB() {
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState(() => {
        try {
            const saved = localStorage.getItem('quick_fab_pos');
            if (saved) return JSON.parse(saved);
        } catch (err) { void err; }
        return null;
    });
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasMoved: false });
    const navigate = useNavigate();
    const { lang } = useLang();
    const isEn = lang === 'EN';

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        dragRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            initialX: pos?.x ?? (window.innerWidth - 76),
            initialY: pos?.y ?? (window.innerHeight - 150),
            hasMoved: false
        };
    };

    const handleTouchMove = (e) => {
        const touch = e.touches[0];
        const dx = touch.clientX - dragRef.current.startX;
        const dy = touch.clientY - dragRef.current.startY;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
            dragRef.current.hasMoved = true;
            const newX = Math.max(16, Math.min(window.innerWidth - 72, dragRef.current.initialX + dx));
            const newY = Math.max(70, Math.min(window.innerHeight - 130, dragRef.current.initialY + dy));
            setPos({ x: newX, y: newY });
        }
    };

    const handleTouchEnd = () => {
        if (dragRef.current.hasMoved && pos) {
            try {
                localStorage.setItem('quick_fab_pos', JSON.stringify(pos));
            } catch (err) { void err; }
        }
    };

    const actions = [
        { label: isEn ? 'POS Cashier' : 'Kasir POS', icon: ShoppingCart, to: '/kasir', color: 'bg-emerald-600' },
        { label: isEn ? 'Create Invoice' : 'Buat Invoice', icon: FilePlus, to: '/invoice', color: 'bg-slate-900' },
        { label: isEn ? 'Record Expense' : 'Catat Pengeluaran', icon: MinusCircle, to: '/kasir/pengeluaran', color: 'bg-rose-600' },
    ];

    const fabStyle = pos
        ? { position: 'fixed', left: `${pos.x}px`, top: `${pos.y}px`, zIndex: 400 }
        : { position: 'fixed', right: '20px', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', zIndex: 400 };

    return (
        <div 
            className="md:hidden flex flex-col items-end gap-3 transition-opacity duration-200"
            style={fabStyle}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Quick Menu */}
            {isOpen && (
                <div className="flex flex-col items-end gap-2.5 mb-2 animate-fab-slide-up">
                    {actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <span className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap">
                                {action.label}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); navigate(action.to); }}
                                className={`w-11 h-11 ${action.color} text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer`}
                            >
                                <action.icon size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Main FAB (Draggable / Tap) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!dragRef.current.hasMoved) {
                        setIsOpen(!isOpen);
                    }
                }}
                className={`w-13 h-13 ${isOpen ? 'bg-slate-900' : 'bg-slate-950'} text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-90 transition-all border-2 border-white/40 cursor-grab active:cursor-grabbing`}
                title="Tahan & geser untuk pindah posisi"
            >
                {isOpen ? <X size={24} /> : <Plus size={26} strokeWidth={2.5} />}
            </button>

            {/* Backdrop for focus (Mobile Only) */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px] -z-10"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
