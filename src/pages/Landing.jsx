import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FileText, Receipt, Calculator, BookOpen, BarChart2, Package, Store,
    Globe, Monitor, CheckCircle, ChevronDown, ChevronUp, Menu, X,
    Zap, Shield, Smartphone, ArrowRight, Star, AlertCircle,
    Users, Tag, Scan, MessageCircle, RefreshCw, Briefcase, CreditCard,
    TrendingUp, FilePlus, Download, Layout, Palette, Mail, Phone, Send,
    Sun, Moon
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// --- Fade-in hook ---
function useFadeIn(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
}

// --- Section wrapper with fade ---
function FadeSection({ children, style, id }) {
    const [ref, visible] = useFadeIn();
    return (
        <div id={id} ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 600ms ease, transform 600ms ease',
            ...style,
        }}>
            {children}
        </div>
    );
}

// --- Star rating ---
function Stars({ n }) {
    return (
        <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
            {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < n ? "#F59E0B" : "none"} color={i < n ? "#F59E0B" : "#CBD5E1"} />
            ))}
        </div>
    );
}

export default function Landing() {
    const navigate = useNavigate();
    const { lang, toggleLang, t } = useLang();
    const { dark, toggle: toggleTheme } = useTheme();
    const { user, profile } = useAuth();
    
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isLegalOpen, setIsLegalOpen] = useState(false);
    const legalRef = useRef(null);
    const [activeFeatureTab, setActiveFeatureTab] = useState('ALL');
    const [openFaq, setOpenFaq] = useState(null);
    const [billing, setBilling] = useState('monthly');
    
    const productRef = useRef(null);

    // Navbar scroll effect
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Click outside for mega menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (productRef.current && !productRef.current.contains(event.target)) {
                setIsProductOpen(false);
            }
            if (legalRef.current && !legalRef.current.contains(event.target)) {
                setIsLegalOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        setIsProductOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleNavAction = (type) => {
        if (user) navigate('/dashboard');
        else navigate(type === 'login' ? '/login' : '/register');
    };

    const PURPLE = '#7C3AED';
    const DEEP_PURPLE = '#5B21B6';
    const NAV_BG = scrolled ? (dark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)') : 'transparent';

    const MegaColumn = ({ title, items }) => (
        <div className="flex-1 min-w-[200px]">
            <h4 className="text-[13px] font-extrabold text-primary uppercase tracking-widest mb-4">{title}</h4>
            <div className="flex flex-col gap-4">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 cursor-pointer group" onClick={() => handleNavAction('register')}>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/20">
                            <item.icon size={16} className="text-primary" />
                        </div>
                        <div>
                            <p className="m-0 text-sm font-bold transition-colors group-hover:text-primary" style={{ color: dark ? '#F8FAFC' : '#0F172A' }}>{item.label}</p>
                            <p className="m-0 text-xs transition-colors" style={{ color: dark ? '#94A3B8' : '#475569' }}>{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div data-landing="true" style={{ background: 'var(--landing-bg)', color: 'var(--landing-text)', transition: 'colors 300ms', minHeight: '100vh', fontFamily: 'var(--font-family-sans, sans-serif)', selectionBackground: 'var(--color-primary)', selectionColor: '#fff' }}>

            {/* --- NAVBAR --- */}
            <header 
                className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}
                style={{ 
                    background: scrolled ? 'var(--landing-navbar-bg)' : 'transparent',
                    borderBottom: scrolled ? '1px solid var(--landing-border)' : '1px solid transparent',
                    backdropFilter: scrolled ? 'blur(12px)' : 'none'
                }}
            >
                <div style={{ maxWidth: 1250, margin: '0 auto', padding: '0 24px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 no-underline">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                            <FileText size={20} color="white" />
                        </div>
                        <span 
                            className="text-2xl font-black tracking-tight"
                            style={{ color: 'var(--landing-text)' }}
                        >
                            My Invoice
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="landing-desktop-nav">
                        {/* Products Dropdown */}
                        <div style={{ position: 'relative' }} ref={productRef}>
                            <button 
                                onMouseEnter={() => setIsProductOpen(true)}
                                onClick={() => setIsProductOpen(!isProductOpen)}
                                className="bg-transparent border-none cursor-pointer hover:text-primary dark:hover:text-primary text-[15px] font-semibold px-4 py-2 flex items-center gap-1 transition-colors"
                                style={{ color: dark ? '#CBD5E1' : '#374151' }}
                            >
                                {t('landing_nav_products')} <ChevronDown size={14} className={`transition-transform duration-200 ${isProductOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Mega Menu */}
                            {isProductOpen && (
                                <div 
                                    onMouseLeave={() => setIsProductOpen(false)}
                                    className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] rounded-3xl p-8 pb-20 mt-3 shadow-2xl border flex gap-8 animate-in fade-in slide-in-from-top-4 duration-200"
                                    style={{ 
                                        background: dark ? '#1E293B' : 'white',
                                        borderColor: dark ? '#334155' : '#F1F5F9'
                                    }}
                                >
                                    <MegaColumn title={t('landing_mega_col1')} items={[
                                        { icon: FileText, label: t('landing_mega_col1_inv'), desc: t('landing_mega_col1_inv_d') },
                                        { icon: Receipt, label: t('landing_mega_col1_kw'), desc: t('landing_mega_col1_kw_d') },
                                        { icon: Package, label: t('landing_mega_col1_tt'), desc: t('landing_mega_col1_tt_d') },
                                        { icon: Briefcase, label: t('landing_mega_col1_sph'), desc: t('landing_mega_col1_sph_d') },
                                        { icon: Download, label: t('landing_mega_col1_po'), desc: t('landing_mega_col1_po_d') },
                                        { icon: CreditCard, label: t('landing_mega_col1_hp'), desc: t('landing_mega_col1_hp_d') },
                                    ]} />
                                    <MegaColumn title={t('landing_mega_col2')} items={[
                                        { icon: Store, label: t('landing_mega_col2_pos'), desc: t('landing_mega_col2_pos_d') },
                                        { icon: Package, label: t('landing_mega_col2_prod'), desc: t('landing_mega_col2_prod_d') },
                                        { icon: Users, label: t('landing_mega_col2_emp'), desc: t('landing_mega_col2_emp_d') },
                                        { icon: Scan, label: t('landing_mega_col2_scan'), desc: t('landing_mega_col2_scan_d') },
                                        { icon: Tag, label: t('landing_mega_col2_voc'), desc: t('landing_mega_col2_voc_d') },
                                        { icon: Star, label: t('landing_mega_col2_loy'), desc: t('landing_mega_col2_loy_d') },
                                    ]} />
                                    <MegaColumn title={t('landing_mega_col3')} items={[
                                        { icon: BarChart2, label: t('landing_mega_col3_fin'), desc: t('landing_mega_col3_fin_d') },
                                        { icon: TrendingUp, label: t('landing_mega_col3_pos'), desc: t('landing_mega_col3_pos_d') },
                                        { icon: BookOpen, label: t('landing_mega_col3_note'), desc: t('landing_mega_col3_note_d') },
                                        { icon: FilePlus, label: t('landing_mega_col3_exp'), desc: t('landing_mega_col3_exp_d') },
                                        { icon: Layout, label: t('landing_mega_col3_multi'), desc: t('landing_mega_col3_multi_d') },
                                        { icon: Palette, label: t('landing_mega_col3_white'), desc: t('landing_mega_col3_white_d') },
                                    ]} />
                                    <div className="absolute bottom-0 left-0 right-0 px-8 py-3 rounded-b-3xl text-center border-t" style={{ background: dark ? '#0F172A' : '#F8FAFC', borderColor: dark ? '#334155' : '#F1F5F9' }}>
                                        <button onClick={() => handleNavAction('register')} className="bg-transparent border-none text-primary text-[13px] font-bold cursor-pointer hover:underline">
                                            {t('landing_mega_cta')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {['features', 'pricing', 'faq', 'contact'].map(id => (
                            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#CBD5E1' : '#374151', fontSize: 15, fontWeight: 600, padding: '8px 16px', transition: 'color 200ms' }}>
                                {t(`landing_nav_${id}`)}
                            </button>
                        ))}

                        {/* Legal Dropdown */}
                        <div style={{ position: 'relative' }} ref={legalRef}>
                            <button
                                onMouseEnter={() => setIsLegalOpen(true)}
                                onClick={() => setIsLegalOpen(!isLegalOpen)}
                                className="bg-transparent border-none cursor-pointer text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-[15px] font-semibold px-4 py-2 flex items-center gap-1 transition-colors"
                            >
                                {lang === 'ID' ? 'Legal' : 'Legal'}
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isLegalOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isLegalOpen && (
                                <div
                                    onMouseLeave={() => setIsLegalOpen(false)}
                                    className="absolute top-full right-0 w-56 bg-white dark:bg-gray-800 rounded-2xl p-3 mt-3 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 duration-200"
                                    style={{ zIndex: 999 }}
                                >
                                    <Link
                                        to="/privacy"
                                        onClick={() => setIsLegalOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors no-underline group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Shield size={15} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="m-0 text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                {lang === 'ID' ? 'Kebijakan Privasi' : 'Privacy Policy'}
                                            </p>
                                            <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                                                {lang === 'ID' ? 'Perlindungan data Anda' : 'How we protect your data'}
                                            </p>
                                        </div>
                                    </Link>
                                    <Link
                                        to="/terms"
                                        onClick={() => setIsLegalOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors no-underline group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <FileText size={15} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="m-0 text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                {lang === 'ID' ? 'Syarat & Ketentuan' : 'Terms of Service'}
                                            </p>
                                            <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                                                {lang === 'ID' ? 'Aturan penggunaan layanan' : 'Rules for using our service'}
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Navbar Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={toggleLang} style={{
                            width: 38, height: 38, borderRadius: 10, border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`,
                            background: 'none', cursor: 'pointer', color: dark ? 'white' : '#1E293B',
                            fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {lang === 'ID' ? 'ID' : 'EN'}
                        </button>

                        <button onClick={toggleTheme} style={{
                            width: 38, height: 38, borderRadius: 10, border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`,
                            background: 'none', cursor: 'pointer', color: dark ? '#FCD34D' : '#64748B',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms'
                        }}>
                            {dark ? <Sun size={18} fill="#FCD34D" /> : <Moon size={18} />}
                        </button>

                        <button onClick={() => handleNavAction('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontSize: 15, fontWeight: 700, padding: '8px 16px' }} className="landing-desktop-nav">
                            {t('landing_nav_login')}
                        </button>
                        <button onClick={() => handleNavAction('register')} className="bg-primary border-none rounded-xl px-6 py-3 cursor-pointer text-white text-[15px] font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all active:scale-95">
                            {t('landing_nav_register')}
                        </button>

                        {/* Mobile Menu Button */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', background: 'none', border: 'none', color: dark ? 'white' : '#0F172A', cursor: 'pointer' }} className="landing-mobile-menu-btn">
                            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                {mobileMenuOpen && (
                    <div className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 p-5 pb-10 flex flex-col gap-1 max-h-[calc(100vh-80px)] overflow-y-auto animate-in slide-in-from-top-full duration-300">
                        {/* Mobile Accordion Products */}
                        <div className="border-b border-gray-100 dark:border-gray-800">
                           <button onClick={() => setIsProductOpen(!isProductOpen)} className="flex justify-between items-center w-full py-4 bg-transparent border-none text-gray-900 dark:text-white text-base font-bold">
                                {t('landing_nav_products')} <ChevronDown size={18} className={`transition-transform ${isProductOpen ? 'rotate-180' : ''}`} />
                           </button>
                           {isProductOpen && (
                               <div className="pb-5 flex flex-col gap-3">
                                   {[
                                       t('landing_mega_col1_inv'), t('landing_mega_col1_kw'), t('landing_mega_col2_pos'),
                                       t('landing_mega_col2_prod'), t('landing_mega_col3_fin')
                                   ].map(p => (
                                       <span key={p} className="text-sm text-gray-500 dark:text-gray-400 font-semibold">• {p}</span>
                                   ))}
                               </div>
                           )}
                        </div>
                        {['features', 'pricing', 'faq', 'contact'].map(id => (
                            <button key={id} onClick={() => scrollTo(id)} className="text-left py-4 bg-transparent border-none text-gray-900 dark:text-white text-base font-bold border-b border-gray-100 dark:border-gray-800">
                                {t(`landing_nav_${id}`)}
                            </button>
                        ))}
                      {/* Mobile Toggle & Theme Toggle */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl border-none cursor-pointer flex items-center justify-center transition-colors"
                            style={{ background: 'var(--landing-bg-alt)', color: 'var(--landing-text)' }}
                        >
                            {dark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                        <div className="flex flex-col gap-3 mt-6">
                            <button onClick={() => handleNavAction('login')} className="w-full py-3.5 rounded-xl border-[1.5px] border-primary text-primary text-base font-bold bg-transparent active:scale-95 transition-all">
                                {t('landing_nav_login')}
                            </button>
                            <button onClick={() => handleNavAction('register')} className="w-full py-3.5 rounded-xl border-none text-white text-base font-bold bg-primary active:scale-95 transition-all">
                                {t('landing_nav_register')}
                            </button>
                        </div>
                    </div>
                )}
            </header>            {/* --- HERO SECTION --- */}
            <section className="relative pt-40 pb-24 px-6 overflow-hidden" style={{ background: 'var(--landing-bg)' }}>
                {/* Decorative background blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-[1200px] mx-auto relative z-10 text-center">
                    <FadeSection>
                        {/* Free Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: 'var(--landing-bg-alt)', border: '1px solid var(--landing-border)' }}>
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[13px] font-bold" style={{ color: 'var(--landing-text)' }}>{t('landing_hero_badge')}</span>
                        </div>

                        <h1 className="text-[clamp(40px,6vw,72px)] font-black mb-8 tracking-tight leading-[1.05]" style={{ color: 'var(--landing-text)' }}>
                            {t('landing_hero_title')}
                        </h1>
                        <p className="text-xl mb-12 max-w-[700px] mx-auto leading-relaxed" style={{ color: 'var(--landing-text-muted)' }}>
                            {t('landing_hero_sub')}
                        </p>

                        <div className="flex gap-4 justify-center flex-wrap">
                            <button onClick={() => handleNavAction('register')} className="bg-primary text-white border-none rounded-2xl px-10 py-4.5 text-lg font-extrabold cursor-pointer flex items-center gap-2.5 shadow-xl shadow-primary/40 transition-all hover:-translate-y-0.5 active:scale-95 hover:bg-primary-dark">
                                {t('landing_hero_cta1')} <ArrowRight size={20} />
                            </button>
                            <button onClick={() => scrollTo('features')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-10 py-4.5 text-lg font-bold cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95">
                                {t('landing_hero_cta2')}
                            </button>
                        </div>

                        {/* Mega Stats Bar */}
                        <div className="mt-20 p-8 rounded-[32px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 backdrop-blur-sm" style={{ background: 'var(--landing-bg-alt)', border: '1px solid var(--landing-border)' }}>
                            {[
                                { key: 'users', icon: Users, color: '#3B82F6' },
                                { key: 'docs', icon: FilePlus, color: '#10B981' },
                                { key: 'uptime', icon: Monitor, color: '#F59E0B' },
                                { key: 'satisfaction', icon: Star, color: '#EC4899' },
                            ].map(s => (
                                <div key={s.key} className="text-left border-b md:border-b-0 md:border-r px-4 last:border-0 pb-6 md:pb-0" style={{ borderColor: 'var(--landing-border)' }}>
                                    <h4 className="m-0 text-2xl font-black leading-tight" style={{ color: 'var(--landing-text)' }}>{t(`landing_stats_${s.key}`)}</h4>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <s.icon size={14} style={{ color: s.color }} />
                                        <span className="text-[13px] font-bold" style={{ color: 'var(--landing-text-muted)' }}>
                                            {t(`landing_stats_${s.key}`)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FadeSection>
                </div>

                <style>{`
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translate(-50%, 10px); }
                        to { opacity: 1; transform: translate(-50%, 0); }
                    }
                    @media (max-width: 768px) {
                        .landing-desktop-nav { display: none !important; }
                        .landing-mobile-menu-btn { display: block !important; }
                        .hero-stat-col { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 16px; }
                        .hero-stat-col:last-child { border-bottom: none; }
                    }
                `}</style>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className="py-24 px-6 transition-colors" style={{ background: 'var(--landing-bg-alt)' }}>
                <div className="max-w-[1200px] mx-auto">
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5 leading-tight" style={{ color: 'var(--landing-text)' }}>{t('features_title')}</h2>
                        <p className="text-lg max-w-[600px] mx-auto mb-12" style={{ color: 'var(--landing-text-muted)' }}>{t('features_sub')}</p>
                        {/* Feature Tabs */}
                        <div className="flex gap-3 justify-center mb-16 flex-wrap">
                            {['ALL', 'FREE', 'PRO', 'ULTIMATE'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFeatureTab(tab)}
                                    className={`px-6 py-2.5 rounded-full border-none text-[14px] font-bold cursor-pointer transition-all duration-200 ${
                                        activeFeatureTab === tab 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                        : ''
                                    }`}
                                    style={activeFeatureTab !== tab ? { background: 'var(--landing-bg-alt)', color: 'var(--landing-text)' } : {}}
                                >
                                    {t(`landing_feat_filter_${tab.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </FadeSection>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                        {/* FEATURE LIST (Simplified for space, total 22 items) */}
                        { [
                            // FREE
                            { id: 'inv', plan: 'FREE', icon: FileText, t: t('landing_mega_col1_inv'), d: t('landing_mega_col1_inv_d'), limit: '10/bln' },
                            { id: 'kw', plan: 'FREE', icon: Receipt, t: t('landing_mega_col1_kw'), d: t('landing_mega_col1_kw_d'), limit: '10/bln' },
                            { id: 'tt', plan: 'FREE', icon: Package, t: t('landing_mega_col1_tt'), d: t('landing_mega_col1_tt_d'), limit: '5/bln' },
                            { id: 'sph', plan: 'FREE', icon: Briefcase, t: t('landing_mega_col1_sph'), d: t('landing_mega_col1_sph_d'), limit: '5/bln' },
                            { id: 'po', plan: 'FREE', icon: Download, t: t('landing_mega_col1_po'), d: t('landing_mega_col1_po_d'), limit: '5/bln' },
                            { id: 'hp', plan: 'FREE', icon: CreditCard, t: t('landing_mega_col1_hp'), d: t('landing_mega_col1_hp_d'), limit: '10/bln' },
                            { id: 'cb', plan: 'FREE', icon: BookOpen, t: t('landing_mega_col3_note'), d: t('landing_mega_col3_note_d'), limit: '20/bln' },
                            { id: 'pos', plan: 'FREE', icon: Store, t: t('landing_mega_col2_pos'), d: t('landing_mega_col2_pos_d'), limit: '50 trx/bln' },
                            { id: 'cli', plan: 'FREE', icon: Users, t: t('nav_clients'), d: t('kl_total_doc'), limit: '5 klien' },
                            { id: 'prod', plan: 'FREE', icon: Package, t: t('landing_mega_col2_prod'), d: t('landing_mega_col2_prod_d'), limit: 'Unlimited' },
                            { id: 'rep', plan: 'FREE', icon: BarChart2, t: t('landing_mega_col3_fin'), d: t('landing_mega_col3_fin_d'), limit: '✓' },
                            // PRO
                            { id: 'inf', plan: 'PRO', icon: Zap, t: t('EN' ? 'Unlimited All' : 'Unlimited Semua'), d: 'Invoice, kwitansi, PO, SPH tanpa batas' },
                            { id: 'wa', plan: 'PRO', icon: MessageCircle, t: t('share_wa'), d: 'Share invoice & struk ke WA klien' },
                            { id: 'csv', plan: 'PRO', icon: FilePlus, t: t('landing_mega_col3_exp'), d: 'Download laporan format PDF/Excel' },
                            { id: 'scan', plan: 'PRO', icon: Scan, t: t('landing_mega_col2_scan'), d: 'Scan barcode produk via kamera HP' },
                            { id: 'emp', plan: 'PRO', icon: Users, t: t('landing_mega_col2_emp'), d: 'Manajemen kasir per karyawan' },
                            { id: 'voc', plan: 'PRO', icon: Tag, t: t('landing_mega_col2_voc'), d: 'Buat kode diskon pelanggan' },
                            { id: 'repf', plan: 'PRO', icon: TrendingUp, t: t('landing_mega_col3_pos'), d: 'Omzet, produk terlaris, per kasir' },
                            // ULTIMATE
                            { id: 'loy', plan: 'ULTIMATE', icon: Star, t: t('landing_mega_col2_loy'), d: 'Program poin pelanggan otomatis' },
                            { id: 'hpp', plan: 'ULTIMATE', icon: Calculator, t: t('nav_hpp'), d: 'Hitung harga pokok penjualan akurat' },
                            { id: 'multi', plan: 'ULTIMATE', icon: Layout, t: t('landing_mega_col3_multi'), d: 'Kelola banyak cabang dalam 1 akun' },
                            { id: 'white', plan: 'ULTIMATE', icon: Palette, t: t('landing_mega_col3_white'), d: 'Hapus branding, pakai logo sendiri' },
                        ].filter(f => activeFeatureTab === 'ALL' || f.plan === activeFeatureTab).map((feat, idx) => (
                            <FadeSection key={feat.id} style={{ transitionDelay: `${idx * 50}ms` }}>
                                <div className="p-6 rounded-3xl h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow group" style={{ background: 'var(--landing-bg-card)', border: '1px solid var(--landing-border)' }}>
                                    <div className="flex justify-between items-start">
                                        <div className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                                            <feat.icon size={22} className="text-primary" />
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                                            feat.plan === 'FREE' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            feat.plan === 'PRO' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                                        }`}>{feat.plan}</span>
                                    </div>
                                    <h4 className="m-0 text-base font-extrabold" style={{ color: 'var(--landing-text)' }}>{feat.t}</h4>
                                    <p className="m-0 text-[13px] leading-relaxed flex-grow" style={{ color: 'var(--landing-text-muted)' }}>{feat.d}</p>
                                    {feat.limit && (
                                        <div className="mt-3 flex items-center gap-1 text-[12px] font-bold text-primary">
                                            <Zap size={12} fill="currentColor" /> {feat.limit}
                                        </div>
                                    )}
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="py-24 px-6 transition-colors" style={{ background: 'var(--landing-bg)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 80 }}>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5" style={{ color: 'var(--landing-text)' }}>{t('landing_how_title')}</h2>
                    </FadeSection>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative">
                        {[
                            { step: '1', t: t('landing_how_step1_t'), d: t('landing_how_step1_d'), icon: FilePlus, color: '#7C3AED' },
                            { step: '2', t: t('landing_how_step2_t'), d: t('landing_how_step2_d'), icon: Layout, color: '#3B82F6' },
                            { step: '3', t: t('landing_how_step3_t'), d: t('landing_how_step3_d'), icon: Package, color: '#10B981' },
                            { step: '4', t: t('landing_how_step4_t'), d: t('landing_how_step4_d'), icon: TrendingUp, color: '#F59E0B' },
                        ].map((s, idx) => (
                            <div key={idx} className="text-center relative">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md" style={{ background: 'var(--landing-bg-card)', border: '1px solid var(--landing-border)' }}>
                                    <s.icon size={32} style={{ color: s.color }} />
                                    <div className="absolute -top-2.5 right-[calc(50%-50px)] w-8 h-8 rounded-full flex items-center justify-center text-base font-black text-white shadow-lg" style={{ background: s.color, boxShadow: `0 4px 12px ${s.color}40` }}>
                                        {s.step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-extrabold mb-3" style={{ color: 'var(--landing-text)' }}>{s.t}</h3>
                                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--landing-text-muted)' }}>{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-24 px-6 transition-colors relative" style={{ background: 'var(--landing-bg-alt)' }}>
                <div className="max-w-[1250px] mx-auto">
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5 leading-tight" style={{ color: 'var(--landing-text)' }}>{t('pricing_title')}</h2>
                        <p className="text-lg max-w-[650px] mx-auto mb-10" style={{ color: 'var(--landing-text-muted)' }}>{t('pricing_subtitle')}</p>
                        
                        {/* Billing Toggle */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: dark ? '#1E293B' : '#F1F5F9', borderRadius: 100, padding: 4, gap: 0, border: '1px solid var(--landing-border)' }}>
                            <button
                                onClick={() => setBilling('monthly')}
                                style={{
                                    padding: '10px 24px', borderRadius: 100, border: 'none', cursor: 'pointer',
                                    background: billing === 'monthly' ? (dark ? '#334155' : 'white') : 'transparent',
                                    color: billing === 'monthly' ? 'var(--color-primary)' : 'var(--landing-text-muted)',
                                    fontWeight: 700, fontSize: 14,
                                    boxShadow: billing === 'monthly' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
                                }}
                            >
                                {t('upgrade_monthly')}
                            </button>
                            <button
                                onClick={() => setBilling('yearly')}
                                style={{
                                    padding: '10px 24px', borderRadius: 100, border: 'none', cursor: 'pointer',
                                    background: billing === 'yearly' ? 'var(--color-primary)' : 'transparent',
                                    color: billing === 'yearly' ? 'white' : 'var(--landing-text-muted)',
                                    fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                                    boxShadow: billing === 'yearly' ? '0 8px 20px rgba(124,58,237,0.3)' : 'none',
                                    transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
                                }}
                            >
                                {t('upgrade_yearly')}
                                <span style={{ background: billing === 'yearly' ? 'rgba(255,255,255,0.25)' : 'var(--color-primary-light)', color: billing === 'yearly' ? 'white' : 'var(--color-primary)', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 900 }}>
                                    {t('upgrade_save_20')}
                                </span>
                            </button>
                        </div>
                    </FadeSection>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'stretch' }}>
                        {/* FREE PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div className="p-10 rounded-3xl h-full flex flex-col shadow-sm" style={{ background: 'var(--landing-bg-card)', border: '1px solid var(--landing-border)' }}>
                                <div className="text-sm font-extrabold mb-3" style={{ color: 'var(--landing-text-muted)' }}>FREE</div>
                                <div className="text-4xl font-black mb-2" style={{ color: 'var(--landing-text)' }}>Rp 0<span className="text-base font-semibold" style={{ color: 'var(--landing-text-muted)' }}>/bln</span></div>
                                <p className="text-sm mb-8" style={{ color: 'var(--landing-text-muted)' }}>Cocok untuk memulai bisnis kecil.</p>
                                <div className="flex flex-col gap-4 mb-10 flex-grow">
                                    {[1, 2, 3, 4, 5, 6].map((num) => (
                                        <div key={num} className="flex gap-3 items-center text-sm" style={{ color: 'var(--landing-text-muted)' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--landing-text-light)', opacity: 0.5 }} /> {t(`upgrade_feat_free_${num}`)}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleNavAction('register')} className="w-full py-4 rounded-xl border-2 bg-transparent text-base font-bold cursor-pointer transition-colors active:scale-95" style={{ borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }}>
                                    Mulai Gratis
                                </button>
                            </div>
                        </FadeSection>

                        {/* PRO PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div className="p-10 rounded-[32px] border-2 border-primary h-full relative flex flex-col shadow-xl shadow-primary/10 transition-transform hover:-translate-y-1" style={{ background: 'rgba(124, 58, 237, 0.03)' }}>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1.5 rounded-full text-[12px] font-black tracking-wider shadow-lg">{t('landing_pricing_badge_popular')}</div>
                                <div className="text-sm font-extrabold text-primary mb-3 uppercase tracking-wider">PRO</div>
                                <div className="text-4xl font-black mb-1" style={{ color: 'var(--landing-text)' }}>
                                    {billing === 'yearly' ? 'Rp 103.200' : 'Rp 129rb'}
                                    <span className="text-base font-semibold" style={{ color: 'var(--landing-text-muted)' }}>/bln</span>
                                </div>
                                {billing === 'yearly' && <div className="text-[11px] font-bold text-primary mb-2">(Total Rp 1.238.400 / tahun)</div>}
                                <p className="text-sm mb-8 font-medium" style={{ color: 'var(--landing-text-muted)' }}>Solusi profesional tanpa batas.</p>
                                <div className="flex flex-col gap-4 mb-10 flex-grow">
                                    {[1, 2, 3, 4, 5, 6].map((num) => (
                                        <div key={num} className="flex gap-3 items-center text-sm font-bold" style={{ color: 'var(--landing-text)' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} /> {t(`upgrade_feat_pro_${num}`)}
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => {
                                        const url = billing === 'yearly' 
                                            ? 'https://my-invoice.myr.id/pl/myinvoice-pro-annual-plan-12-bulan'
                                            : import.meta.env.VITE_MAYAR_PRO_PAYMENT_URL;
                                        window.location.href = url;
                                    }} 
                                    className="w-full py-4 rounded-xl border-none bg-primary text-white text-base font-black cursor-pointer shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95"
                                >
                                    Pilih PRO
                                </button>
                            </div>
                        </FadeSection>

                        {/* ULTIMATE PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div className="p-10 rounded-3xl h-full flex flex-col shadow-sm" style={{ background: 'var(--landing-bg-card)', border: '1px solid var(--landing-border)' }}>
                                <div className="text-sm font-extrabold text-amber-500 mb-3 tracking-wider uppercase">ULTIMATE</div>
                                <div className="text-4xl font-black mb-1" style={{ color: 'var(--landing-text)' }}>
                                    {billing === 'yearly' ? 'Rp 119.200' : 'Rp 149rb'}
                                    <span className="text-base font-semibold" style={{ color: 'var(--landing-text-muted)' }}>/bln</span>
                                </div>
                                {billing === 'yearly' && <div className="text-[11px] font-bold text-amber-500 mb-2">(Total Rp 1.430.400 / tahun)</div>}
                                <p className="text-sm mb-8" style={{ color: 'var(--landing-text-muted)' }}>Branding penuh untuk multi-cabang.</p>
                                <div className="flex flex-col gap-4 mb-10 flex-grow">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <div key={num} className="flex gap-3 items-center text-sm" style={{ color: 'var(--landing-text-muted)' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} /> {t(`upgrade_feat_ult_${num}`)}
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => {
                                        const url = billing === 'yearly'
                                            ? 'https://my-invoice.myr.id/pl/myinvoice-ultimate-annual-plan-12-bulan'
                                            : import.meta.env.VITE_MAYAR_ULTIMATE_PAYMENT_URL;
                                        window.location.href = url;
                                    }} 
                                    className="w-full py-4 rounded-xl border-2 bg-transparent text-base font-bold cursor-pointer transition-colors active:scale-95" 
                                    style={{ borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }}
                                >
                                    Pilih ULTIMATE
                                </button>
                            </div>
                        </FadeSection>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: 'var(--landing-text-muted)', fontWeight: 600 }}>{t('landing_pricing_guarantee')}</p>
                </div>
            </section>

            {/* --- TESTIMONIALS --- */}
            <section className="py-24 px-0 transition-colors overflow-hidden" style={{ background: 'var(--landing-bg)' }}>
                <div className="max-w-[1200px] mx-auto px-6 mb-12 text-center">
                    <FadeSection>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5 leading-tight" style={{ color: 'var(--landing-text)' }}>{t('testimonials_title')}</h2>
                    </FadeSection>
                </div>
                
                <div className="relative flex overflow-hidden group">
                    <div className="flex animate-marquee whitespace-nowrap gap-6 py-4 px-3 hover:[animation-play-state:paused]">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <div key={num} className="w-[350px] p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300" style={{ background: 'var(--landing-bg-card)', border: '1px solid var(--landing-border)' }}>
                                        <div className="flex gap-1 mb-6">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                                            ))}
                                        </div>
                                        <p className="text-[15px] leading-relaxed italic mb-8 whitespace-normal h-[72px] line-clamp-3" style={{ color: 'var(--landing-text-muted)' }}>
                                            "{t(`landing_testi${num}_text`)}"
                                        </p>
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10">
                                                <img 
                                                    src={`/testimonials/testi${num}.png`} 
                                                    alt={t(`landing_testi${num}_name`)} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h5 className="m-0 text-[15px] font-extrabold" style={{ color: 'var(--landing-text)' }}>{t(`landing_testi${num}_name`)}</h5>
                                                <p className="m-0 text-[13px] font-medium opacity-60" style={{ color: 'var(--landing-text-muted)' }}>{t(`landing_testi${num}_role`)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* --- FAQ SECTION --- */}
            <section id="faq" className="py-24 px-6 transition-colors" style={{ background: 'var(--landing-bg-alt)' }}>
                <div className="max-w-[800px] mx-auto">
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5 leading-tight" style={{ color: 'var(--landing-text)' }}>{t('landing_nav_faq')}</h2>
                    </FadeSection>
                    <div className="flex flex-col gap-3">
                        {[1,2,3,4,5,6,7,8].map(num => (
                            <FadeSection key={num}>
                                <div className="rounded-2xl transition-all duration-300" style={{ background: openFaq === num ? 'var(--landing-bg-card)' : 'transparent', border: `1px solid ${openFaq === num ? 'var(--landing-border)' : 'transparent'}` }}>
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === num ? null : num)}
                                        className="w-full px-6 py-5 text-left bg-transparent border-none flex justify-between items-center cursor-pointer group"
                                    >
                                        <span className={`text-[17px] font-bold transition-colors ${openFaq === num ? 'text-primary' : ''}`} style={{ color: openFaq === num ? 'var(--color-primary)' : 'var(--landing-text)' }}>{t(`landing_faq_q${num}`)}</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${openFaq === num ? 'bg-primary/10 rotate-180' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                            <ChevronDown size={18} className={openFaq === num ? 'text-primary' : 'text-gray-400'} />
                                        </div>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === num ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="px-6 pb-6 text-[15px] leading-relaxed" style={{ color: 'var(--landing-text-muted)' }}>
                                            {t(`landing_faq_a${num}`)}
                                        </div>
                                    </div>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>
            {/* --- CONTACT SECTION --- */}
            <section id="contact" className="py-24 px-6 transition-colors" style={{ background: 'var(--landing-bg)' }}>
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <FadeSection>
                            <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-6 leading-tight" style={{ color: 'var(--landing-text)' }}>{t('landing_contact_title')}</h2>
                            <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_contact_sub')}</p>
                            
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-4 items-center group">
                                    <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 dark:bg-[#25D366]/20 flex items-center justify-center text-[#25D366] transition-transform group-hover:scale-110">
                                        <MessageCircle size={28} fill="currentColor" fillOpacity="0.2" />
                                    </div>
                                    <div>
                                        <h4 className="m-0 text-base font-extrabold" style={{ color: 'var(--landing-text)' }}>WhatsApp Support</h4>
                                        <p className="m-0" style={{ color: 'var(--landing-text-muted)' }}>+62 812-3340-8142</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center group">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                        <Mail size={28} />
                                    </div>
                                    <div>
                                        <h4 className="m-0 text-base font-extrabold" style={{ color: 'var(--landing-text)' }}>Email Business</h4>
                                        <p className="m-0" style={{ color: 'var(--landing-text-muted)' }}>hello.myinvoice@gmail.com</p>
                                    </div>
                                </div>
                            </div>
                        </FadeSection>
                        <FadeSection>
                            <form className="p-10 rounded-[32px] shadow-xl border flex flex-col gap-5" style={{ background: 'var(--landing-bg-card)', borderColor: 'var(--landing-border)' }}>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold" style={{ color: 'var(--landing-text)' }}>{t('landing_contact_name')}</label>
                                    <input type="text" placeholder="John Doe" className="px-5 py-4 rounded-xl border-[1.5px] outline-none focus:border-primary transition-colors" style={{ background: 'var(--landing-input-bg)', borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold" style={{ color: 'var(--landing-text)' }}>{t('landing_contact_email')}</label>
                                    <input type="email" placeholder="john@example.com" className="px-5 py-4 rounded-xl border-[1.5px] outline-none focus:border-primary transition-colors" style={{ background: 'var(--landing-input-bg)', borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold" style={{ color: 'var(--landing-text)' }}>{t('landing_contact_message')}</label>
                                    <textarea rows="4" placeholder="Halo, saya ingin bertanya tentang..." className="px-5 py-4 rounded-xl border-[1.5px] outline-none focus:border-primary transition-colors resize-none" style={{ background: 'var(--landing-input-bg)', borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }}></textarea>
                                </div>
                                <button type="button" className="bg-primary text-white border-none rounded-xl py-4.5 text-base font-black cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:bg-primary-dark active:scale-[0.98] transition-all mt-2">
                                    {t('landing_contact_send')} <Send size={18} />
                                </button>
                            </form>
                        </FadeSection>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-24 px-6 bg-primary text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
                <FadeSection>
                    <h2 className="text-[clamp(32px,5vw,56px)] font-black text-white mb-6 tracking-tight leading-tight">{t('landing_final_cta')}</h2>
                    <p className="text-lg text-white/80 mb-12 max-w-[600px] mx-auto">{t('landing_footer_tagline')}</p>
                    <button onClick={() => handleNavAction('register')} className="bg-white text-primary border-none rounded-2xl px-12 py-5 text-xl font-black cursor-pointer shadow-2xl shadow-black/10 transition-transform hover:scale-105 active:scale-95">
                        {t('landing_final_btn')}
                    </button>
                </FadeSection>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-24 px-6 border-t transition-colors" style={{ background: dark ? 'var(--landing-bg-alt)' : 'var(--landing-bg)', borderColor: 'var(--landing-border)' }}>
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 text-left">
                        {/* Col 1: Brand */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <span className="text-2xl font-black" style={{ color: 'var(--landing-text)' }}>My Invoice</span>
                            </div>
                            <p className="max-w-xs leading-relaxed m-0" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_tagline')}</p>
                        </div>

                        {/* Col 2: Info */}
                        <div>
                            <h5 className="text-[16px] font-black mb-6 uppercase tracking-wider opacity-40" style={{ color: 'var(--landing-text)' }}>{t('landing_footer_info')}</h5>
                            <div className="flex flex-col gap-4 text-[15px] font-bold">
                                <span onClick={() => scrollTo('faq')} className="cursor-pointer hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_nav_faq')}</span>
                                <a href="https://artikel.myinvoice.space/" target="_blank" rel="noreferrer" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_blog')}</a>
                            </div>
                        </div>

                        {/* Col 3: Legal */}
                        <div>
                            <h5 className="text-[16px] font-black mb-6 uppercase tracking-wider opacity-40" style={{ color: 'var(--landing-text)' }}>{t('landing_footer_legal')}</h5>
                            <div className="flex flex-col gap-4 text-[15px] font-bold">
                                <Link to="/privacy" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_policy')}</Link>
                                <Link to="/terms" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_terms')}</Link>
                            </div>
                        </div>

                        {/* Col 4: Partner */}
                        <div>
                            <h5 className="text-[16px] font-black mb-6 uppercase tracking-wider opacity-40" style={{ color: 'var(--landing-text)' }}>{t('landing_footer_partner')}</h5>
                            <div className="flex flex-col gap-4 text-[15px] font-bold">
                                <div className="flex flex-col gap-1">
                                    <span className="opacity-50" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_affiliate')}</span>
                                    <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">{t('landing_footer_coming_soon')}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="opacity-50" style={{ color: 'var(--landing-text-muted)' }}>
                                        {t('landing_footer_career') || 'Career'}
                                    </span>
                                    <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                                        {t('landing_footer_coming_soon') || 'Coming Soon'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t text-center" style={{ borderColor: 'var(--landing-border)' }}>
                        <p className="m-0 text-sm font-bold opacity-60" style={{ color: 'var(--landing-text)' }}>
                            © 2026 myinvoice.space
                        </p>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 40s linear infinite;
                }
            `}</style>

        </div>
    );
}
