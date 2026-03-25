import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, FileText, BarChart2, Users, Store } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GuestBanner from './GuestBanner';
import TrialBanner from './TrialBanner';
import OnboardingModal from './OnboardingModal';
import OnboardingWizard from './OnboardingWizard';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Mobile bottom nav (5 main items)
const mobileNav = [
    { to: '/dashboard', icon: Home, key: 'nav_home' },
    { to: '/catatan-bisnis', icon: BookOpen, key: 'nav_cashbook' },
    { to: '/klien', icon: Users, key: 'nav_clients' },
    { to: '/invoice', icon: FileText, key: 'nav_invoice' },
    { to: '/laporan', icon: BarChart2, key: 'nav_report' },
];

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Show onboarding if guest and not yet done
    const isGuest = localStorage.getItem('guest_mode') === 'true';
    const needsOnboard = isGuest && !localStorage.getItem('onboarding_done');
    const { dark } = useTheme();
    const { t } = useLang();
    const { effectivePlan, user, profile } = useAuth();

    const needsNewUserOnboarding = user && profile && profile.onboarding_completed === false;

    return (
        <div className="flex overflow-hidden h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
            {/* Desktop sidebar */}
            <div className="desktop-sidebar" style={{
                width: 260,
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
                <Navbar onMenuOpen={() => setSidebarOpen(true)} />
                <TrialBanner />
                <GuestBanner />

                {needsNewUserOnboarding && <OnboardingWizard />}

                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 0 80px 0',
                }}>
                    {children}
                </main>
            </div>

            {/* Mobile bottom tab navigation */}
            <nav
                className="mobile-bottom-nav fixed bottom-0 left-0 right-0 h-[68px] z-[400] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex"
                style={{ display: 'none' }}
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
      `}</style>
        </div>
    );
}
