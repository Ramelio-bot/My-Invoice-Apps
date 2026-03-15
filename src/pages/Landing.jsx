import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FileText, Receipt, Calculator, BookOpen, BarChart2, Package, Store,
    Globe, Monitor, CheckCircle, ChevronDown, ChevronUp, Menu, X,
    Zap, Shield, Smartphone, ArrowRight, Star, AlertCircle,
    Users, Tag, Scan, MessageCircle, RefreshCw, Briefcase, CreditCard,
    TrendingUp, FilePlus, Download, Layout, Palette, Mail, Phone, Send
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
    const { dark } = useTheme();
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
        <div style={{ flex: 1, minWidth: 200 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: PURPLE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, cursor: 'pointer' }} onClick={() => handleNavAction('register')}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: dark ? 'rgba(124,58,237,0.1)' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <item.icon size={16} color={PURPLE} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dark ? 'white' : '#1E293B' }}>{item.label}</p>
                            <p style={{ margin: 0, fontSize: 12, color: dark ? '#94A3B8' : '#64748B' }}>{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            color: dark ? '#F1F5F9' : '#1E293B', 
            overflowX: 'hidden', 
            background: dark ? '#0F172A' : '#FFFFFF',
            scrollBehavior: 'smooth'
        }}>

            {/* --- NAVBAR --- */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                background: NAV_BG,
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: scrolled ? `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}` : 'none',
                transition: 'all 300ms ease',
            }}>
                <div style={{ maxWidth: 1250, margin: '0 auto', padding: '0 24px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                            <FileText size={20} color="white" />
                        </div>
                        <span style={{ fontSize: 22, fontWeight: 900, color: dark ? 'white' : '#0F172A', letterSpacing: '-0.5px' }}>
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
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#CBD5E1' : '#475569', fontSize: 15, fontWeight: 600, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 200ms' }}
                            >
                                {t('landing_nav_products')} <ChevronDown size={14} style={{ transform: isProductOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                            </button>

                            {/* Mega Menu */}
                            {isProductOpen && (
                                <div 
                                    onMouseLeave={() => setIsProductOpen(false)}
                                    style={{
                                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                        width: 800, background: dark ? '#1E293B' : 'white', borderRadius: 20,
                                        padding: 32, marginTop: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                        border: `1px solid ${dark ? '#334155' : '#F1F5F9'}`, display: 'flex', gap: 32,
                                        animation: 'fadeInUp 200ms ease-out'
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
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: dark ? '#0F172A' : '#F8FAFC', padding: '12px 32px', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, textAlign: 'center' }}>
                                        <button onClick={() => handleNavAction('register')} style={{ background: 'none', border: 'none', color: PURPLE, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
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
                        <button onClick={() => handleNavAction('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontSize: 15, fontWeight: 700, padding: '8px 16px' }} className="landing-desktop-nav">
                            {t('landing_nav_login')}
                        </button>
                        <button onClick={() => handleNavAction('register')} style={{ 
                            background: PURPLE, border: 'none', borderRadius: 12, padding: '12px 24px', 
                            cursor: 'pointer', color: 'white', fontSize: 15, fontWeight: 700,
                            boxShadow: `0 8px 20px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(124,58,237,0.25)'}`
                        }}>
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
                    <div style={{ 
                        background: dark ? '#0F172A' : 'white', 
                        borderTop: `1px solid ${dark ? '#1E293B' : '#F1F5F9'}`,
                        padding: '20px 24px 40px', display: 'flex', flexDirection: 'column', gap: 4,
                        maxHeight: 'calc(100vh - 80px)', overflowY: 'auto'
                    }}>
                        {/* Mobile Accordion Products */}
                        <div style={{ borderBottom: `1px solid ${dark ? '#1E293B' : '#F1F5F9'}` }}>
                           <button onClick={() => setIsProductOpen(!isProductOpen)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '16px 0', background: 'none', border: 'none', color: dark ? 'white' : '#0F172A', fontSize: 16, fontWeight: 700 }}>
                                {t('landing_nav_products')} <ChevronDown size={18} style={{ transform: isProductOpen ? 'rotate(180deg)' : 'none' }} />
                           </button>
                           {isProductOpen && (
                               <div style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                   {[
                                       t('landing_mega_col1_inv'), t('landing_mega_col1_kw'), t('landing_mega_col2_pos'),
                                       t('landing_mega_col2_prod'), t('landing_mega_col3_fin')
                                   ].map(p => (
                                       <span key={p} style={{ fontSize: 14, color: dark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>• {p}</span>
                                   ))}
                               </div>
                           )}
                        </div>
                        {['features', 'pricing', 'faq', 'contact'].map(id => (
                            <button key={id} onClick={() => scrollTo(id)} style={{ textAlign: 'left', padding: '16px 0', background: 'none', border: 'none', color: dark ? 'white' : '#0F172A', fontSize: 16, fontWeight: 700, borderBottom: `1px solid ${dark ? '#1E293B' : '#F1F5F9'}` }}>
                                {t(`landing_nav_${id}`)}
                            </button>
                        ))}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                            <button onClick={() => handleNavAction('login')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: `1.5px solid ${PURPLE}`, color: PURPLE, fontSize: 16, fontWeight: 700, background: 'none' }}>
                                {t('landing_nav_login')}
                            </button>
                            <button onClick={() => handleNavAction('register')} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', color: 'white', fontSize: 16, fontWeight: 700, background: PURPLE }}>
                                {t('landing_nav_register')}
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* --- HERO SECTION --- */}
            <section style={{ 
                padding: '160px 24px 100px', 
                background: dark ? 'radial-gradient(circle at top right, #1E1B4B 0%, #0F172A 70%)' : 'radial-gradient(circle at top right, #F5F3FF 0%, #FFFFFF 70%)',
                position: 'relative'
            }}>
                {/* Decorative Blobs */}
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: 300, height: 300, background: PURPLE, filter: 'blur(150px)', opacity: 0.1, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 400, height: 400, background: '#3B82F6', filter: 'blur(180px)', opacity: 0.08, pointerEvents: 'none' }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                    <FadeSection>
                        {/* Free Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: dark ? 'rgba(124,58,237,0.15)' : '#EDE9FE', padding: '8px 20px', borderRadius: 100, marginBottom: 32 }}>
                            <Zap size={14} color={PURPLE} fill={PURPLE} />
                            <span style={{ fontSize: 14, fontWeight: 800, color: PURPLE, letterSpacing: 0.5 }}>GRATIS SELAMANYA UNTUK MEMULAI</span>
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

                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => handleNavAction('register')} style={{ 
                                background: PURPLE, color: 'white', border: 'none', borderRadius: 16, 
                                padding: '18px 40px', fontSize: 18, fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10,
                                boxShadow: `0 12px 30px rgba(124,58,237,0.4)`, transition: 'all 200ms'
                            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                {t('landing_hero_cta1')} <ArrowRight size={20} />
                            </button>
                            <button onClick={() => scrollTo('features')} style={{ 
                                background: dark ? 'rgba(255,255,255,0.05)' : 'white', 
                                color: dark ? 'white' : '#0F172A', 
                                border: `2px solid ${dark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, 
                                borderRadius: 16, padding: '18px 40px', fontSize: 18, fontWeight: 700, 
                                cursor: 'pointer', transition: 'all 200ms'
                            }} onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.1)' : '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'white'}>
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
                        <div style={{ 
                            marginTop: 80, padding: '32px', borderRadius: 24, 
                            background: dark ? 'rgba(30,41,59,0.5)' : '#F8FAFC', 
                            border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`,
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32
                        }}>
                            {[
                                { key: 'users', icon: Users, color: '#3B82F6' },
                                { key: 'docs', icon: FilePlus, color: '#10B981' },
                                { key: 'trx', icon: CreditCard, color: '#F59E0B' },
                                { key: 'rating', icon: Star, color: '#EC4899' },
                            ].map(s => (
                                <div key={s.key} style={{ textAlign: 'left', borderRight: s.key !== 'rating' ? `1px solid ${dark ? '#334155' : '#E2E8F0'}` : 'none' }} className="hero-stat-col">
                                    <h4 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: dark ? 'white' : '#0F172A' }}>{t(`landing_stats_${s.key}`)}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <s.icon size={14} color={s.color} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
                                            {s.key === 'users' ? (lang === 'ID' ? 'Pelaku Usaha' : 'Entrepreneurs') : 
                                             s.key === 'docs' ? (lang === 'ID' ? 'Dokumen Terkirim' : 'Documents Sent') :
                                             s.key === 'trx' ? (lang === 'ID' ? 'Total Volume' : 'Total Volume') :
                                             (lang === 'ID' ? 'Rating Kepuasan' : 'Satisfaction Rating')}
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
            <section id="features" style={{ padding: '100px 24px', background: dark ? '#0F172A' : '#FFFFFF' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, marginBottom: 20, color: dark ? 'white' : '#0F172A' }}>{t('features_title')}</h2>
                        <p style={{ fontSize: 18, color: '#64748B', maxWidth: 600, margin: '0 auto 48px' }}>{t('features_sub')}</p>

                        {/* Feature Tabs */}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 60, flexWrap: 'wrap' }}>
                            {['ALL', 'FREE', 'PRO', 'ULTIMATE'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFeatureTab(tab)}
                                    style={{
                                        padding: '10px 24px', borderRadius: 100, border: 'none',
                                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                        background: activeFeatureTab === tab ? PURPLE : (dark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'),
                                        color: activeFeatureTab === tab ? 'white' : (dark ? '#CBD5E1' : '#475569'),
                                        transition: 'all 200ms'
                                    }}
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
                                <div style={{ 
                                    padding: 24, borderRadius: 20, background: dark ? '#1E293B' : '#F8FAFC',
                                    border: `1.5px solid ${dark ? '#334155' : '#F1F5F9'}`, height: '100%',
                                    display: 'flex', flexDirection: 'column', gap: 12
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: dark ? 'rgba(124,58,237,0.1)' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <feat.icon size={22} color={PURPLE} />
                                        </div>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                                            background: feat.plan === 'FREE' ? '#10B98120' : (feat.plan === 'PRO' ? '#3B82F620' : '#8B5CF620'),
                                            color: feat.plan === 'FREE' ? '#10B981' : (feat.plan === 'PRO' ? '#3B82F6' : '#8B5CF6')
                                        }}>{feat.plan}</span>
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: dark ? 'white' : '#0F172A' }}>{feat.t}</h4>
                                    <p style={{ margin: 0, fontSize: 13, color: dark ? '#94A3B8' : '#64748B', lineHeight: 1.5, flexGrow: 1 }}>{feat.d}</p>
                                    {feat.limit && (
                                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: PURPLE }}>
                                            <Zap size={12} fill={PURPLE} /> {feat.limit}
                                        </div>
                                    )}
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section style={{ padding: '100px 24px', background: dark ? '#1E293B' : '#F8FAFC' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 80 }}>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, marginBottom: 20, color: dark ? 'white' : '#0F172A' }}>{t('landing_how_title')}</h2>
                    </FadeSection>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40, position: 'relative' }}>
                        {[
                            { step: '1', t: t('landing_how_step1_t'), d: t('landing_how_step1_d'), icon: FilePlus, color: '#7C3AED' },
                            { step: '2', t: t('landing_how_step2_t'), d: t('landing_how_step2_d'), icon: Layout, color: '#3B82F6' },
                            { step: '3', t: t('landing_how_step3_t'), d: t('landing_how_step3_d'), icon: Package, color: '#10B981' },
                            { step: '4', t: t('landing_how_step4_t'), d: t('landing_how_step4_d'), icon: TrendingUp, color: '#F59E0B' },
                        ].map((s, idx) => (
                            <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                                <div style={{ 
                                    width: 80, height: 80, borderRadius: 24, background: dark ? 'rgba(255,255,255,0.05)' : 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.05)', border: `1.5px solid ${dark ? '#334155' : '#E2E8F0'}`
                                }}>
                                    <s.icon size={32} color={s.color} />
                                    <div style={{ 
                                        position: 'absolute', top: -10, right: 'calc(50% - 40px - 10px)',
                                        width: 32, height: 32, borderRadius: 100, background: s.color, color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900,
                                        boxShadow: `0 4px 12px ${s.color}40`
                                    }}>{s.step}</div>
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: dark ? 'white' : '#0F172A' }}>{s.t}</h3>
                                <p style={{ fontSize: 15, color: dark ? '#94A3B8' : '#64748B', lineHeight: 1.6 }}>{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* --- PRICING SECTION --- */}
            <section id="pricing" style={{ padding: '100px 24px', background: dark ? '#0F172A' : '#FFFFFF', position: 'relative' }}>
                <div style={{ maxWidth: 1250, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, marginBottom: 20, color: dark ? 'white' : '#0F172A' }}>{t('pricing_title')}</h2>
                        <p style={{ fontSize: 18, color: '#64748B', maxWidth: 650, margin: '0 auto 48px' }}>{t('pricing_subtitle')}</p>
                    </FadeSection>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'stretch' }}>
                        {/* FREE PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div style={{ 
                                padding: 40, borderRadius: 24, background: dark ? 'rgba(255,255,255,0.02)' : 'white',
                                border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, height: '100%',
                                display: 'flex', flexDirection: 'column'
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#64748B', marginBottom: 12 }}>FREE</div>
                                <div style={{ fontSize: 44, fontWeight: 900, color: dark ? 'white' : '#0F172A', marginBottom: 8 }}>Rp 0<span style={{ fontSize: 16, fontWeight: 600, color: '#64748B' }}>/bln</span></div>
                                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32 }}>Cocok untuk memulai bisnis kecil.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40, flexGrow: 1 }}>
                                    {['10 Invoice / bulan', '10 Kwitansi / bulan', '5 PO & SPH / bulan', 'Kasir POS (50 trx)', 'Laporan Keuangan Dasar'].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, color: dark ? '#CBD5E1' : '#475569' }}>
                                            <CheckCircle size={18} color="#10B981" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleNavAction('register')} style={{ 
                                    width: '100%', padding: '16px', borderRadius: 12, border: `2px solid ${dark ? '#334155' : '#E2E8F0'}`,
                                    background: 'none', color: dark ? 'white' : '#1E293B', fontSize: 16, fontWeight: 700, cursor: 'pointer'
                                }}>Mulai Gratis</button>
                            </div>
                        </FadeSection>

                        {/* PRO PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div style={{ 
                                padding: 40, borderRadius: 24, background: dark ? 'rgba(124,58,237,0.05)' : '#F5F3FF',
                                border: `2px solid ${PURPLE}`, height: '100%', position: 'relative',
                                display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(124,58,237,0.1)'
                            }}>
                                <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', background: PURPLE, color: 'white', padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 800 }}>{t('landing_pricing_badge_popular')}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: PURPLE, marginBottom: 12 }}>PRO</div>
                                <div style={{ fontSize: 44, fontWeight: 900, color: dark ? 'white' : '#0F172A', marginBottom: 8 }}>Rp 129rb<span style={{ fontSize: 16, fontWeight: 600, color: '#64748B' }}>/bln</span></div>
                                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32 }}>Solusi profesional tanpa batas.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40, flexGrow: 1 }}>
                                    {['Semua Dokumen Unlimited', 'Share WhatsApp Tanpa Batas', 'Barcode Scanner POS', 'Voucher & Diskon', 'Laporan Excel & CSV', 'Karyawan & Shift Modul', 'Hapus Watermark MyInvoice'].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, fontWeight: 600, color: dark ? '#E2E8F0' : '#1E293B' }}>
                                            <CheckCircle size={18} color={PURPLE} fill={PURPLE + '20'} /> {f}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleNavAction('register')} style={{ 
                                    width: '100%', padding: '16px', borderRadius: 12, border: 'none',
                                    background: PURPLE, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(124,58,237,0.3)'
                                }}>Pilih PRO</button>
                            </div>
                        </FadeSection>

                        {/* ULTIMATE PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div style={{ 
                                padding: 40, borderRadius: 24, background: dark ? 'rgba(255,255,255,0.02)' : 'white',
                                border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, height: '100%',
                                display: 'flex', flexDirection: 'column'
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B', marginBottom: 12 }}>ULTIMATE</div>
                                <div style={{ fontSize: 44, fontWeight: 900, color: dark ? 'white' : '#0F172A', marginBottom: 8 }}>Rp 149rb<span style={{ fontSize: 16, fontWeight: 600, color: '#64748B' }}>/bln</span></div>
                                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32 }}>Branding penuh untuk multi-cabang.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40, flexGrow: 1 }}>
                                    {['Semua Fitur PRO', 'Kalkulator HPP Canggih', 'Loyalty & Poin Member', 'Multi Outlet / Cabang', 'White Label (Cetak Logo Sendiri)', 'Kustomisasi Struk Kasir', 'Prioritas Support WA'].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, color: dark ? '#CBD5E1' : '#475569' }}>
                                            <CheckCircle size={18} color="#F59E0B" /> {f}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => handleNavAction('register')} style={{ 
                                    width: '100%', padding: '16px', borderRadius: 12, border: `2px solid ${dark ? '#334155' : '#E2E8F0'}`,
                                    background: 'none', color: dark ? 'white' : '#1E293B', fontSize: 16, fontWeight: 700, cursor: 'pointer'
                                }}>Pilih ULTIMATE</button>
                            </div>
                        </FadeSection>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: '#64748B', fontWeight: 600 }}>{t('landing_pricing_guarantee')}</p>
                </div>
            </section>

            {/* --- TESTIMONIALS --- */}
            <section style={{ padding: '100px 24px', background: dark ? '#1E293B' : '#F8FAFC' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, marginBottom: 20, color: dark ? 'white' : '#0F172A' }}>{t('testimonials_title')}</h2>
                    </FadeSection>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                        {[
                            { name: 'Budi Santoso', role: 'Owner Kopi Kenangan Manis', t: 'Dulu ribet catat transaksi manual. Sejak pakai My Invoice, kirim tagihan ke supplier tinggal klik, stok juga terpantau rapi. Sangat membantu UMKM!', stars: 5 },
                            { name: 'Siti Aminah', role: 'Butik Fashion Muslimah', t: 'Fitur kasir POS-nya enteng banget dibuka di HP. Barcode scanner-nya lancar, bikin antrean jadi lebih cepat. CS-nya juga ramah lewat WA.', stars: 5 },
                            { name: 'Andi Wijaya', role: 'Distributor Alat Tulis', t: 'Laporan keuangannya lengkap banget. Saya bisa tahu profit per hari tanpa perlu buka laptop. Rekomendasi buat yang mau rapihin admin bisnis.', stars: 4 },
                        ].map((testi, i) => (
                            <FadeSection key={i}>
                                <div style={{ padding: 32, borderRadius: 24, background: dark ? '#0F172A' : 'white', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, height: '100%' }}>
                                    <Stars n={testi.stars} />
                                    <p style={{ fontSize: 16, color: dark ? '#E2E8F0' : '#475569', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 24 }}>"{testi.t}"</p>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 100, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>{testi.name[0]}</div>
                                        <div>
                                            <h5 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: dark ? 'white' : '#0F172A' }}>{testi.name}</h5>
                                            <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>{testi.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section id="faq" style={{ padding: '100px 24px', background: dark ? '#0F172A' : '#FFFFFF' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, marginBottom: 20, color: dark ? 'white' : '#0F172A' }}>{t('landing_nav_faq')}</h2>
                    </FadeSection>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[1,2,3,4,5,6,7,8].map(num => (
                            <FadeSection key={num}>
                                <div style={{ 
                                    borderRadius: 16, border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`,
                                    background: dark ? 'rgba(255,255,255,0.02)' : 'white', overflow: 'hidden'
                                }}>
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === num ? null : num)}
                                        style={{ 
                                            width: '100%', padding: '24px', textAlign: 'left', background: 'none', border: 'none',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{ fontSize: 16, fontWeight: 700, color: dark ? 'white' : '#1E293B' }}>{t(`landing_faq_q${num}`)}</span>
                                        {openFaq === num ? <ChevronUp size={20} color={PURPLE} /> : <ChevronDown size={20} color="#64748B" />}
                                    </button>
                                    {openFaq === num && (
                                        <div style={{ padding: '0 24px 24px', fontSize: 15, color: '#64748B', lineHeight: 1.6 }}>
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
            <section id="contact" style={{ padding: '100px 24px', background: dark ? '#1E293B' : '#F8FAFC' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'center' }}>
                        <FadeSection>
                            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, marginBottom: 24, color: dark ? 'white' : '#0F172A' }}>{t('landing_contact_title')}</h2>
                            <p style={{ fontSize: 18, color: '#64748B', marginBottom: 40, lineHeight: 1.6 }}>Punya pertanyaan atau butuh bantuan khusus? Tim kami siap membantu bisnis Anda tumbuh lebih cepat.</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 16, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <MessageCircle size={24} fill="white" />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>WhatsApp Support</h4>
                                        <p style={{ margin: 0, color: '#64748B' }}>+62 812 3456 7890</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 16, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Email Business</h4>
                                        <p style={{ margin: 0, color: '#64748B' }}>support@myinvoice.space</p>
                                    </div>
                                </div>
                            </div>
                        </FadeSection>

                        <FadeSection>
                            <form style={{ padding: 40, borderRadius: 24, background: dark ? '#0F172A' : 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 14, fontWeight: 700 }}>{t('landing_contact_name')}</label>
                                    <input type="text" placeholder="John Doe" style={{ padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${dark ? '#334155' : '#E2E8F0'}`, background: dark ? 'rgba(255,255,255,0.05)' : 'white', color: dark ? 'white' : 'inherit', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 14, fontWeight: 700 }}>{t('landing_contact_email')}</label>
                                    <input type="email" placeholder="john@example.com" style={{ padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${dark ? '#334155' : '#E2E8F0'}`, background: dark ? 'rgba(255,255,255,0.05)' : 'white', color: dark ? 'white' : 'inherit', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 14, fontWeight: 700 }}>{t('landing_contact_message')}</label>
                                    <textarea rows="4" placeholder="Halo, saya ingin bertanya tentang..." style={{ padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${dark ? '#334155' : '#E2E8F0'}`, background: dark ? 'rgba(255,255,255,0.05)' : 'white', color: dark ? 'white' : 'inherit', outline: 'none', resize: 'none' }}></textarea>
                                </div>
                                <button type="button" style={{ background: PURPLE, color: 'white', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    {t('landing_contact_send')} <Send size={18} />
                                </button>
                            </form>
                        </FadeSection>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section style={{ padding: '100px 24px', background: PURPLE, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, background: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
                <FadeSection>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, color: 'white', marginBottom: 24, letterSpacing: '-1px' }}>{t('landing_final_cta')}</h2>
                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>Bergabung dengan 10.000+ UMKM yang telah mendigitalisasi operasional mereka.</p>
                    <button onClick={() => handleNavAction('register')} style={{ 
                        background: 'white', color: PURPLE, border: 'none', borderRadius: 16, 
                        padding: '20px 48px', fontSize: 20, fontWeight: 900, cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)', transition: 'transform 200ms'
                    }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        {t('landing_final_btn')}
                    </button>
                </FadeSection>
            </section>

            {/* --- FOOTER --- */}
            <footer style={{ padding: '80px 24px 40px', background: dark ? '#0F172A' : '#FFFFFF', borderTop: `1px solid ${dark ? '#1E293B' : '#F1F5F9'}` }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 80 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={18} color="white" />
                                </div>
                                <span style={{ fontSize: 20, fontWeight: 900 }}>My Invoice</span>
                            </div>
                            <p style={{ color: '#64748B', maxWidth: 300, lineHeight: 1.6, marginBottom: 24 }}>{t('landing_footer_tagline')}</p>
                            <div style={{ display: 'flex', gap: 16 }}>
                                {[MessageCircle, Mail, Phone].map((Icon, i) => (
                                    <div key={i} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}>
                                        <Icon size={20} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Layanan</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: '#64748B', fontSize: 14 }}>
                                <span>Invoice & Kwitansi</span>
                                <span>Kasir POS Digital</span>
                                <span>Manajemen Stok</span>
                                <span>Laporan Keuangan</span>
                            </div>
                        </div>
                        <div>
                            <h5 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Perusahaan</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: '#64748B', fontSize: 14 }}>
                                <span onClick={() => scrollTo('faq')} style={{ cursor: 'pointer' }}>FAQ</span>
                                <span style={{ cursor: 'pointer' }}>Kebijakan Privasi</span>
                                <span style={{ cursor: 'pointer' }}>Syarat & Ketentuan</span>
                                <a href="https://myinvoice.hashnode.dev" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>Blog Bisnis</a>
                            </div>
                        </div>
                    </div>
                    <div style={{ borderTop: `1px solid ${dark ? '#1E293B' : '#F1F5F9'}`, textAlign: 'center', pt: 40 }}>
                        <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>© 2026 myinvoice.space • Dibuat dengan ❤️ untuk UMKM Indonesia.</p>
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
