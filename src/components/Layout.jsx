import { useState } from 'react';
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
    const { t } = useLang();
    const { effectivePlan, user, profile } = useAuth();
    const { isZenMode } = useStore();

    const needsNewUserOnboarding = user && profile && profile.onboarding_completed === false;

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
                    height: 68,
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
                                <span>Kasir</span>
                            </>
                        )}
                    </NavLink>
                )}
            </nav>

            {/* Quick Action FAB (Mobile Only) */}
            {!isZenMode && <QuickActionFAB />}

            <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-bottom-nav { display: none !important; }
          .mobile-menu-btn { display: none !important; }
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
    const navigate = useNavigate();
//     const { t } = useLang();

    const actions = [
        { label: 'Kasir POS', icon: ShoppingCart, to: '/kasir', color: 'bg-emerald-500' },
        { label: 'Buat Invoice', icon: FilePlus, to: '/invoice', color: 'bg-violet-600' },
        { label: 'Catat Pengeluaran', icon: MinusCircle, to: '/kasir/pengeluaran', color: 'bg-rose-500' },
    ];

    return (
        <div className="md:hidden fixed bottom-24 right-5 z-40 flex flex-col items-end gap-3 opacity-50 hover:opacity-100 focus-within:opacity-100 active:opacity-100 transition-opacity duration-300">
            {/* Quick Menu */}
            {isOpen && (
                <div className="flex flex-col items-end gap-3 mb-2 animate-fab-slide-up">
                    {actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                {action.label}
                            </span>
                            <button
                                onClick={() => { setIsOpen(false); navigate(action.to); }}
                                className={`w-12 h-12 ${action.color} text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all`}
                            >
                                <action.icon size={22} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Main FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 ${isOpen ? 'bg-slate-800' : 'bg-indigo-600'} text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all ring-4 ring-white/20`}
            >
                {isOpen ? <X size={28} /> : <Plus size={32} strokeWidth={2.5} />}
            </button>

            {/* Backdrop for FAB */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] -z-10"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
