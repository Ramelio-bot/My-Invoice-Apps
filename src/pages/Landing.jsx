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
    const [activeFeatureTab, setActiveFeatureTab] = useState('ALL');
    const [openFaq, setOpenFaq] = useState(null);
    
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
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        setIsProductOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const enterAsGuest = () => {
        localStorage.setItem('guest_mode', 'true');
        navigate('/dashboard');
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
                        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/20">
                            <item.icon size={16} className="text-primary" />
                        </div>
                        <div>
                            <p className="m-0 text-sm font-bold text-gray-900 dark:text-white transition-colors group-hover:text-primary">{item.label}</p>
                            <p className="m-0 text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 min-h-screen font-sans selection:bg-primary selection:text-white">

            {/* --- NAVBAR --- */}
            <header className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm' : 'bg-transparent border-b border-transparent'}`}>
                <div style={{ maxWidth: 1250, margin: '0 auto', padding: '0 24px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 no-underline">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                            <FileText size={20} color="white" />
                        </div>
                        <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
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
                                className="bg-transparent border-none cursor-pointer text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-[15px] font-semibold px-4 py-2 flex items-center gap-1 transition-colors"
                            >
                                {t('landing_nav_products')} <ChevronDown size={14} className={`transition-transform duration-200 ${isProductOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Mega Menu */}
                            {isProductOpen && (
                                <div 
                                    onMouseLeave={() => setIsProductOpen(false)}
                                    className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] bg-white dark:bg-gray-800 rounded-3xl p-8 mt-3 shadow-2xl border border-gray-100 dark:border-gray-700 flex gap-8 animate-in fade-in slide-in-from-top-4 duration-200"
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
                                    <div className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-900/50 px-8 py-3 rounded-b-3xl text-center border-t border-gray-100 dark:border-gray-700">
                                        <button onClick={() => handleNavAction('register')} className="bg-transparent border-none text-primary text-[13px] font-bold cursor-pointer hover:underline">
                                            {t('landing_mega_cta')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {['features', 'pricing', 'faq', 'contact'].map(id => (
                            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#CBD5E1' : '#475569', fontSize: 15, fontWeight: 600, padding: '8px 16px', transition: 'color 200ms' }}>
                                {t(`landing_nav_${id}`)}
                            </button>
                        ))}
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
            </header>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-40 pb-24 px-6 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Decorative Blobs */}
                <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-primary blur-[150px] opacity-10 pointer-events-none" />
                <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-500 blur-[180px] opacity-8 pointer-events-none" />

                <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <FadeSection>
                        {/* Free Badge */}
                        <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/20 px-5 py-2 rounded-full mb-8">
                            <Zap size={14} className="text-primary fill-primary" />
                            <span className="text-[14px] font-extrabold text-primary tracking-wide uppercase">GRATIS SELAMANYA UNTUK MEMULAI</span>
                        </div>

                        <h1 style={{ 
                            fontSize: 'clamp(40px, 6vw, 76px)', fontWeight: 900, 
                            color: dark ? 'white' : '#0F172A', lineHeight: 1.1, 
                            letterSpacing: '-2px', maxWidth: 900, margin: '0 auto 32px' 
                        }}>
                            {t('landing_hero_title')}
                        </h1>
                        <p style={{ 
                            fontSize: 'clamp(17px, 2.5vw, 22px)', color: dark ? '#94A3B8' : '#475569', 
                            lineHeight: 1.6, maxWidth: 650, margin: '0 auto 48px', fontWeight: 500 
                        }}>
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

                        {/* Guest Mode Shortcut */}
                        <p style={{ marginTop: 24 }}>
                            <button onClick={enterAsGuest} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 13, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                                {lang === 'ID' ? 'Coba Demo Guest (tanpa login)' : 'Try Guest Demo (no login)'}
                            </button>
                        </p>

                        {/* Mega Stats Bar */}
                        <div className="mt-20 p-8 rounded-[32px] bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 backdrop-blur-sm">
                            {[
                                { key: 'users', icon: Users, color: '#3B82F6' },
                                { key: 'docs', icon: FilePlus, color: '#10B981' },
                                { key: 'uptime', icon: Monitor, color: '#F59E0B' },
                                { key: 'satisfaction', icon: Star, color: '#EC4899' },
                            ].map(s => (
                                <div key={s.key} className="text-left border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 px-4 last:border-0 pb-6 md:pb-0">
                                    <h4 className="m-0 text-2xl font-black text-gray-900 dark:text-white leading-tight">{t(`landing_stats_${s.key}`)}</h4>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <s.icon size={14} style={{ color: s.color }} />
                                        <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">
                                            {s.key === 'users' ? (lang === 'ID' ? 'Pengguna Aktif' : 'Active Users') : 
                                             s.key === 'docs' ? (lang === 'ID' ? 'Dokumen Terkirim' : 'Documents Sent') :
                                             s.key === 'uptime' ? (lang === 'ID' ? 'Uptime Server' : 'Server Uptime') :
                                             (lang === 'ID' ? 'Kepuasan Pengguna' : 'User Satisfaction')}
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
            <section id="features" className="py-24 px-6 bg-gray-50 dark:bg-gray-800 transition-colors">
                <div className="max-w-[1200px] mx-auto">
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5 text-gray-900 dark:text-white leading-tight">{t('features_title')}</h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto mb-12">{t('features_sub')}</p>
                        {/* Feature Tabs */}
                        <div className="flex gap-3 justify-center mb-16 flex-wrap">
                            {['ALL', 'FREE', 'PRO', 'ULTIMATE'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFeatureTab(tab)}
                                    className={`px-6 py-2.5 rounded-full border-none text-[14px] font-bold cursor-pointer transition-all duration-200 ${
                                        activeFeatureTab === tab 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
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
                                <div className="p-6 rounded-3xl bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow group">
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
                                    <h4 className="m-0 text-base font-extrabold text-gray-900 dark:text-white">{feat.t}</h4>
                                    <p className="m-0 text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed flex-grow">{feat.d}</p>
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
            <section className="py-24 px-6 bg-white dark:bg-gray-900 transition-colors">
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 80 }}>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, marginBottom: 20, color: dark ? 'white' : '#0F172A' }}>{t('landing_how_title')}</h2>
                    </FadeSection>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative">
                        {[
                            { step: '1', t: t('landing_how_step1_t'), d: t('landing_how_step1_d'), icon: FilePlus, color: '#7C3AED' },
                            { step: '2', t: t('landing_how_step2_t'), d: t('landing_how_step2_d'), icon: Layout, color: '#3B82F6' },
                            { step: '3', t: t('landing_how_step3_t'), d: t('landing_how_step3_d'), icon: Package, color: '#10B981' },
                            { step: '4', t: t('landing_how_step4_t'), d: t('landing_how_step4_d'), icon: TrendingUp, color: '#F59E0B' },
                        ].map((s, idx) => (
                            <div key={idx} className="text-center relative">
                                <div className="w-20 h-20 rounded-3xl bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-6 shadow-md border border-gray-100 dark:border-gray-700">
                                    <s.icon size={32} style={{ color: s.color }} />
                                    <div className="absolute -top-2.5 right-[calc(50%-50px)] w-8 h-8 rounded-full flex items-center justify-center text-base font-black text-white shadow-lg" style={{ background: s.color, boxShadow: `0 4px 12px ${s.color}40` }}>
                                        {s.step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-extrabold mb-3 text-gray-900 dark:text-white">{s.t}</h3>
                                <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed">{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-24 px-6 bg-gray-50 dark:bg-gray-800 transition-colors relative">
                <div className="max-w-[1250px] mx-auto">
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5 text-gray-900 dark:text-white leading-tight">{t('pricing_title')}</h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-[650px] mx-auto mb-12">{t('pricing_subtitle')}</p>
                    </FadeSection>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'stretch' }}>
                        {/* FREE PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div className="p-10 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-sm">
                                <div className="text-sm font-extrabold text-gray-500 mb-3">FREE</div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">Rp 0<span className="text-base font-semibold text-gray-500">/bln</span></div>
                                <p className="text-sm text-gray-500 mb-8">Cocok untuk memulai bisnis kecil.</p>
                                <div className="flex flex-col gap-4 mb-10 flex-grow">
                                    {['10 Invoice / bulan', '10 Kwitansi / bulan', '5 PO & SPH / bulan', 'Kasir POS (50 trx)', 'Laporan Keuangan Dasar'].map((f, i) => (
                                        <div key={i} className="flex gap-3 items-center text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle size={18} className="text-emerald-500" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleNavAction('register')} className="w-full py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white text-base font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95">
                                    Mulai Gratis
                                </button>
                            </div>
                        </FadeSection>

                        {/* PRO PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div className="p-10 rounded-[32px] bg-primary/[0.03] dark:bg-primary/10 border-2 border-primary h-full relative flex flex-col shadow-xl shadow-primary/10 transition-transform hover:-translate-y-1">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1.5 rounded-full text-[12px] font-black tracking-wider shadow-lg">{t('landing_pricing_badge_popular')}</div>
                                <div className="text-sm font-extrabold text-primary mb-3 uppercase tracking-wider">PRO</div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">Rp 129rb<span className="text-base font-semibold text-gray-500">/bln</span></div>
                                <p className="text-sm text-gray-500 mb-8 font-medium">Solusi profesional tanpa batas.</p>
                                <div className="flex flex-col gap-4 mb-10 flex-grow">
                                    {['Semua Dokumen Unlimited', 'Share WhatsApp Tanpa Batas', 'Barcode Scanner POS', 'Voucher & Diskon', 'Laporan Excel & CSV', 'Karyawan & Shift Modul', 'Hapus Watermark MyInvoice'].map((f, i) => (
                                        <div key={i} className="flex gap-3 items-center text-sm font-bold text-gray-800 dark:text-gray-100">
                                            <CheckCircle size={18} className="text-primary" fill="currentColor" fillOpacity="0.1" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleNavAction('register')} className="w-full py-4 rounded-xl border-none bg-primary text-white text-base font-black cursor-pointer shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95">
                                    Pilih PRO
                                </button>
                            </div>
                        </FadeSection>

                        {/* ULTIMATE PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div className="p-10 rounded-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-sm">
                                <div className="text-sm font-extrabold text-amber-500 mb-3 tracking-wider uppercase">ULTIMATE</div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">Rp 149rb<span className="text-base font-semibold text-gray-500">/bln</span></div>
                                <p className="text-sm text-gray-500 mb-8">Branding penuh untuk multi-cabang.</p>
                                <div className="flex flex-col gap-4 mb-10 flex-grow">
                                    {['Semua Fitur PRO', 'Kalkulator HPP Canggih', 'Loyalty & Poin Member', 'Multi Outlet / Cabang', 'White Label (Cetak Logo Sendiri)', 'Kustomisasi Struk Kasir', 'Prioritas Support WA'].map((f, i) => (
                                        <div key={i} className="flex gap-3 items-center text-sm text-gray-600 dark:text-gray-300">
                                            <CheckCircle size={18} className="text-amber-500" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleNavAction('register')} className="w-full py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white text-base font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95">
                                    Pilih ULTIMATE
                                </button>
                            </div>
                        </FadeSection>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: '#64748B', fontWeight: 600 }}>{t('landing_pricing_guarantee')}</p>
                </div>
            </section>

            {/* --- TESTIMONIALS --- */}
            <section className="py-24 px-6 bg-white dark:bg-gray-900 transition-colors">
                <div className="max-w-[1200px] mx-auto">
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5 text-gray-900 dark:text-white leading-tight">{t('testimonials_title')}</h2>
                    </FadeSection>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { name: 'Budi Santoso', role: 'Owner Kopi Kenangan Manis', t: 'Dulu ribet catat transaksi manual. Sejak pakai My Invoice, kirim tagihan ke supplier tinggal klik, stok juga terpantau rapi. Sangat membantu UMKM!', stars: 5 },
                            { name: 'Siti Aminah', role: 'Butik Fashion Muslimah', t: 'Fitur kasir POS-nya enteng banget dibuka di HP. Barcode scanner-nya lancar, bikin antrean jadi lebih cepat. CS-nya juga ramah lewat WA.', stars: 5 },
                            { name: 'Andi Wijaya', role: 'Distributor Alat Tulis', t: 'Laporan keuangannya lengkap banget. Saya bisa tahu profit per hari tanpa perlu buka laptop. Rekomendasi buat yang mau rapihin admin bisnis.', stars: 4 },
                        ].map((testi, i) => (
                            <FadeSection key={i}>
                                <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 h-full shadow-sm hover:shadow-md transition-shadow">
                                    <Stars n={testi.stars} />
                                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed italic mb-6">"{testi.t}"</p>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">{testi.name[0]}</div>
                                        <div>
                                            <h5 className="m-0 text-[15px] font-extrabold text-gray-900 dark:text-white">{testi.name}</h5>
                                            <p className="m-0 text-[13px] text-gray-500 dark:text-gray-400">{testi.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>
            {/* --- FAQ SECTION --- */}
            <section id="faq" className="py-24 px-6 bg-gray-50 dark:bg-gray-800 transition-colors">
                <div className="max-w-[800px] mx-auto">
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-5 text-gray-900 dark:text-white leading-tight">{t('landing_nav_faq')}</h2>
                    </FadeSection>
                    <div className="flex flex-col gap-4">
                        {[1,2,3,4,5,6,7,8].map(num => (
                            <FadeSection key={num}>
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === num ? null : num)}
                                        className="w-full px-6 py-5.5 text-left bg-transparent border-none flex justify-between items-center cursor-pointer group"
                                    >
                                        <span className="text-[16px] font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{t(`landing_faq_q${num}`)}</span>
                                        {openFaq === num ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-gray-400" />}
                                    </button>
                                    {openFaq === num && (
                                        <div className="px-6 pb-6 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                                            {t(`landing_faq_a${num}`)}
                                        </div>
                                    )}
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>
            {/* --- CONTACT SECTION --- */}
            <section id="contact" className="py-24 px-6 bg-white dark:bg-gray-900 transition-colors">
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <FadeSection>
                            <h2 className="text-[clamp(32px,4vw,48px)] font-black mb-6 text-gray-900 dark:text-white leading-tight">{t('landing_contact_title')}</h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">Punya pertanyaan atau butuh bantuan khusus? Tim kami siap membantu bisnis Anda tumbuh lebih cepat.</p>
                            
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-4 items-center group">
                                    <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 dark:bg-[#25D366]/20 flex items-center justify-center text-[#25D366] transition-transform group-hover:scale-110">
                                        <MessageCircle size={28} fill="currentColor" fillOpacity="0.2" />
                                    </div>
                                    <div>
                                        <h4 className="m-0 text-base font-extrabold text-gray-900 dark:text-white">WhatsApp Support</h4>
                                        <p className="m-0 text-gray-500 dark:text-gray-400">+62 812 3456 7890</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center group">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                                        <Mail size={28} />
                                    </div>
                                    <div>
                                        <h4 className="m-0 text-base font-extrabold text-gray-900 dark:text-white">Email Business</h4>
                                        <p className="m-0 text-gray-500 dark:text-gray-400">support@myinvoice.space</p>
                                    </div>
                                </div>
                            </div>
                        </FadeSection>
                        <FadeSection>
                            <form className="p-10 rounded-[32px] bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('landing_contact_name')}</label>
                                    <input type="text" placeholder="John Doe" className="px-5 py-4 rounded-xl border-[1.5px] border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary transition-colors" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('landing_contact_email')}</label>
                                    <input type="email" placeholder="john@example.com" className="px-5 py-4 rounded-xl border-[1.5px] border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary transition-colors" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('landing_contact_message')}</label>
                                    <textarea rows="4" placeholder="Halo, saya ingin bertanya tentang..." className="px-5 py-4 rounded-xl border-[1.5px] border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary transition-colors resize-none"></textarea>
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
            <footer className="py-24 px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors">
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2.5 mb-6">
                                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">My Invoice</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-8">{t('landing_footer_tagline')}</p>
                            <div className="flex gap-4">
                                {[MessageCircle, Mail, Phone].map((Icon, i) => (
                                    <div key={i} className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:border-primary dark:hover:border-primary transition-all cursor-pointer">
                                        <Icon size={20} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 className="text-[16px] font-black text-gray-900 dark:text-white mb-6">Layanan</h5>
                            <div className="flex flex-col gap-4 text-gray-500 dark:text-gray-400 text-[14px] font-medium">
                                <span className="hover:text-primary transition-colors cursor-pointer">Invoice & Kwitansi</span>
                                <span className="hover:text-primary transition-colors cursor-pointer">Kasir POS Digital</span>
                                <span className="hover:text-primary transition-colors cursor-pointer">Manajemen Stok</span>
                                <span className="hover:text-primary transition-colors cursor-pointer">Laporan Keuangan</span>
                            </div>
                        </div>
                        <div>
                            <h5 className="text-[16px] font-black text-gray-900 dark:text-white mb-6">Perusahaan</h5>
                            <div className="flex flex-col gap-4 text-gray-500 dark:text-gray-400 text-[14px] font-medium">
                                <span onClick={() => scrollTo('faq')} className="hover:text-primary transition-colors cursor-pointer">FAQ</span>
                                <Link to="/privacy" className="no-underline text-inherit hover:text-primary transition-colors">Kebijakan Privasi</Link>
                                <Link to="/terms" className="no-underline text-inherit hover:text-primary transition-colors">Syarat & Ketentuan</Link>
                                <a href="https://myinvoice.hashnode.dev" target="_blank" rel="noreferrer" className="no-underline text-inherit hover:text-primary transition-colors">Blog Bisnis</a>
                            </div>
                        </div>
                    </div>
                    <div className="pt-10 border-t border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-gray-400 dark:text-gray-500 text-sm m-0">© 2026 myinvoice.space • Dibuat dengan ❤️ untuk UMKM Indonesia.</p>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

        </div>
    );
}
