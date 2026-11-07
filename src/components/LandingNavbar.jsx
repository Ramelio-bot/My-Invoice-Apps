import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X, ArrowRight } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function LandingNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { lang, t } = useLang();
    const isEn = lang === 'EN';
    const { user } = useAuth();
    
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        if (location.pathname === '/') {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            navigate(`/?scroll=${id}`);
        }
    };

    const handleNavAction = (type) => {
        setMobileMenuOpen(false);
        if (user) {
            navigate('/dashboard');
        } else {
            navigate(type === 'login' ? '/login' : '/register');
        }
    };

    return (
        <header 
            className={`fixed top-0 left-0 w-full z-[100] transition-all duration-200 ${
                scrolled 
                    ? 'bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-xs py-3.5' 
                    : 'bg-white/80 backdrop-blur-xs border-b border-zinc-100 py-4'
            }`}
        >
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                
                {/* Brand Logo matching review mockup */}
                <Link to="/" className="flex items-center gap-2.5 no-underline group select-none">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shadow-xs group-hover:bg-black transition-colors">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4v16a1 1 0 0 0 1.45.89L8 19.5l2.55 1.39a1 1 0 0 0 .9 0L14 19.5l2.55 1.39a1 1 0 0 0 .9 0L20 19.5V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/>
                            <path d="M8 8h8"/>
                            <path d="M8 12h8"/>
                            <path d="M8 16h5"/>
                        </svg>
                    </div>
                    <span className="text-xl font-black tracking-tight text-zinc-950 group-hover:text-black transition-colors" style={{ letterSpacing: '-0.03em' }}>
                        MyInvoice
                    </span>
                </Link>

                {/* Center Navigation Links */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
                    <Link 
                        to="/aplikasi-kasir-offline" 
                        className={`no-underline transition-colors hover:text-zinc-950 ${location.pathname === '/aplikasi-kasir-offline' ? 'text-zinc-950 font-bold' : ''}`}
                    >
                        {isEn ? 'Cashier' : 'Kasir'}
                    </Link>
                    <Link 
                        to="/buat-invoice-gratis" 
                        className={`no-underline transition-colors hover:text-zinc-950 ${location.pathname === '/buat-invoice-gratis' ? 'text-zinc-950 font-bold' : ''}`}
                    >
                        Invoice
                    </Link>
                    <button 
                        onClick={() => scrollTo('pricing')} 
                        className="bg-transparent border-none p-0 text-sm font-semibold text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors"
                    >
                        {isEn ? 'Pricing' : 'Harga'}
                    </button>
                    <Link 
                        to="/blog" 
                        className={`no-underline transition-colors hover:text-zinc-950 ${location.pathname === '/blog' ? 'text-zinc-950 font-bold' : ''}`}
                    >
                        Blog
                    </Link>
                </nav>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-3">
                    {/* Language Switch - Hidden temporarily per user request */}
                    {/* <button 
                        onClick={toggleLang} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors border-none bg-transparent cursor-pointer" 
                        title={isEn ? "Switch Language" : "Ganti Bahasa"}
                    >
                        <Globe size={13} />
                        <span>{lang.toUpperCase()}</span>
                    </button> */}

                    {user ? (
                        <Link 
                            to="/dashboard" 
                            className="px-4 py-2 rounded-full bg-zinc-950 hover:bg-black text-white text-xs font-bold shadow-xs transition-all no-underline"
                        >
                            {isEn ? 'To Dashboard' : 'Ke Dashboard'}
                        </Link>
                    ) : (
                        <>
                            <button 
                                onClick={() => handleNavAction('login')} 
                                className="hidden sm:inline-block bg-transparent border-none px-3 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-950 cursor-pointer transition-colors"
                            >
                                {t('landing_nav_login') || (isEn ? 'Login' : 'Masuk')}
                            </button>
                            <button 
                                onClick={() => handleNavAction('register')} 
                                className="px-5 py-2.5 rounded-full bg-zinc-950 hover:bg-black text-white text-xs font-bold tracking-tight shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                {isEn ? 'Get Started' : 'Mulai Gratis'}
                            </button>
                        </>
                    )}

                    {/* Mobile Hamburger Toggle */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                        className="md:hidden p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 border-none bg-transparent cursor-pointer transition-colors"
                        aria-label={isEn ? "Toggle Menu" : "Buka Menu"}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-zinc-200/80 bg-white px-6 py-6 shadow-xl animate-in slide-in-from-top duration-200">
                    <div className="flex flex-col gap-4 text-base font-bold text-zinc-800">
                        <Link 
                            to="/aplikasi-kasir-offline" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="no-underline py-2 text-zinc-800 hover:text-black flex items-center justify-between"
                        >
                            <span>{isEn ? 'Offline POS Cashier' : 'Kasir POS Offline'}</span>
                            <ArrowRight size={16} className="text-zinc-400" />
                        </Link>
                        <Link 
                            to="/buat-invoice-gratis" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="no-underline py-2 text-zinc-800 hover:text-black flex items-center justify-between"
                        >
                            <span>{isEn ? 'Invoice & Billing Maker' : 'Pembuat Faktur & Invoice'}</span>
                            <ArrowRight size={16} className="text-zinc-400" />
                        </Link>
                        <button 
                            onClick={() => scrollTo('pricing')} 
                            className="w-full text-left bg-transparent border-none py-2 text-base font-bold text-zinc-800 hover:text-black cursor-pointer flex items-center justify-between"
                        >
                            <span>{isEn ? 'Pricing Plans' : 'Daftar Harga'}</span>
                            <ArrowRight size={16} className="text-zinc-400" />
                        </button>
                        <Link 
                            to="/blog" 
                            onClick={() => setMobileMenuOpen(false)}
                            className="no-underline py-2 text-zinc-800 hover:text-black flex items-center justify-between"
                        >
                            <span>{isEn ? 'Business Blog & Guides' : 'Blog Bisnis & Tutorial'}</span>
                            <ArrowRight size={16} className="text-zinc-400" />
                        </Link>

                        <div className="h-[1px] bg-zinc-100 my-2" />

                        {user ? (
                            <Link 
                                to="/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full py-3 text-center rounded-xl bg-zinc-950 text-white font-bold no-underline text-sm shadow-xs"
                            >
                                {isEn ? 'Open Dashboard' : 'Buka Dashboard'}
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                <button 
                                    onClick={() => handleNavAction('login')}
                                    className="w-full py-3 rounded-xl border border-zinc-200 text-zinc-800 font-bold text-sm bg-white cursor-pointer"
                                >
                                    {isEn ? 'Sign In' : 'Masuk Akun'}
                                </button>
                                <button 
                                    onClick={() => handleNavAction('register')}
                                    className="w-full py-3 rounded-xl bg-zinc-950 text-white font-bold text-sm shadow-xs cursor-pointer"
                                >
                                    {isEn ? 'Get Started Free — No Credit Card' : 'Mulai Gratis — Tanpa Kartu Kredit'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
