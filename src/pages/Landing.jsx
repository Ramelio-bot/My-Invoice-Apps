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
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

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
    const { lang, t } = useLang();
    const { user } = useAuth();
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const scrollId = params.get('scroll');
        if (scrollId) {
            setTimeout(() => {
                document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 500);
        }
    }, []);

    const [activeFeatureTab, setActiveFeatureTab] = useState('ALL');
    const [openFaq, setOpenFaq] = useState(null);
    const [billing, setBilling] = useState('monthly');

    const freeFeatures = [
        { id: 'Trial 14 hari PRO gratis', en: '14-day free PRO trial' },
        { id: '50 Transaksi Kasir/bulan', en: '50 POS Transactions/month' },
        { id: '10 Dokumen/bulan (Invoice, dll)', en: '10 Documents/month (Invoice, etc.)' },
        { id: '5 Klien & 5 Produk', en: '5 Clients & 5 Products' },
        { id: 'Watermark MyInvoice', en: 'MyInvoice Watermark' },
    ];

    const proFeatures = [
        { id: '500 Transaksi Kasir/bulan', en: '500 POS Transactions/month' },
        { id: '100 Dokumen/bulan', en: '100 Documents/month' },
        { id: '50 Klien, Produk Unlimited', en: '50 Clients, Unlimited Products' },
        { id: 'Tanpa Watermark', en: 'No Watermark' },
        { id: 'Loyalty Member & Voucher', en: 'Loyalty Member & Voucher' },
        { id: 'Shift Karyawan', en: 'Employee Shifts' },
        { id: 'Laporan Kasir Lengkap', en: 'Full POS Reports' },
        { id: 'Priority Support', en: 'Priority Support' },
    ];

    const ultimateFeatures = [
        { id: 'Semua fitur PRO', en: 'Everything in PRO' },
        { id: 'Transaksi & Dokumen Unlimited', en: 'Unlimited Transactions & Documents' },
        { id: 'Multi Outlet (banyak cabang)', en: 'Multi Outlet (multiple branches)' },
        { id: 'Hitung HPP Advance', en: 'Advanced HPP Calculator' },
        { id: 'Export Excel/CSV', en: 'Export Excel/CSV' },
        { id: 'Piutang & Hutang', en: 'Receivables & Payables' },
        { id: 'VIP Support Service', en: 'VIP Support Service' },
    ];


    return (
        <div data-landing="true" style={{ background: 'var(--landing-bg)', color: 'var(--landing-text)', transition: 'colors 300ms', minHeight: '100vh', fontFamily: 'var(--font-family-sans, sans-serif)', selectionBackground: 'var(--color-primary)', selectionColor: '#fff' }}>

            <LandingNavbar />
            {/* --- HERO SECTION --- */}
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

                        <h1 className="text-[clamp(44px,8vw,84px)] font-black mb-10 tracking-tighter leading-[1.1]" style={{ color: 'var(--landing-text)' }}>
                            {t('landing_hero_title')}
                        </h1>
                        <p className="text-xl mb-16 max-w-[700px] mx-auto leading-relaxed font-semibold opacity-90" style={{ color: 'var(--landing-text-muted)' }}>
                            {t('landing_hero_sub')}
                        </p>

                        <div className="flex gap-4 justify-center flex-wrap">
                            <button onClick={() => handleNavAction('register')} className="bg-primary text-white border-none rounded-2xl px-10 py-4.5 text-lg font-extrabold cursor-pointer flex items-center gap-2.5 shadow-xl shadow-primary/40 transition-all hover:-translate-y-0.5 active:scale-95 hover:bg-primary-dark">
                                {t('landing_hero_cta1')} <ArrowRight size={20} />
                            </button>
                            <button onClick={() => scrollTo('features')} className="bg-white text-gray-900 border-2 border-gray-200 rounded-2xl px-10 py-4.5 text-lg font-bold cursor-pointer transition-all hover:bg-gray-50 active:scale-95">
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
                                    <h4 className="m-0 text-2xl font-black leading-tight" style={{ color: 'var(--landing-text)' }}>{t(`landing_stats_${s.key}_val`)}</h4>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <s.icon size={14} style={{ color: s.color }} />
                                        <span className="text-[13px] font-bold" style={{ color: 'var(--landing-text-muted)' }}>
                                            {t(`landing_stats_${s.key}_label`)}
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
                            { id: 'inf', plan: 'PRO', icon: Zap, t: t('landing_unlimited_all'), d: t('landing_unlimited_desc') },
                            { id: 'wa', plan: 'PRO', icon: MessageCircle, t: t('share_wa'), d: t('landing_wa_desc') },
                            { id: 'csv', plan: 'PRO', icon: FilePlus, t: t('landing_mega_col3_exp'), d: t('landing_csv_desc') },
                            { id: 'scan', plan: 'PRO', icon: Scan, t: t('landing_mega_col2_scan'), d: t('landing_scan_desc') },
                            { id: 'emp', plan: 'PRO', icon: Users, t: t('landing_mega_col2_emp'), d: t('landing_emp_desc') },
                            { id: 'voc', plan: 'PRO', icon: Tag, t: t('landing_mega_col2_voc'), d: t('landing_voc_desc') },
                            { id: 'repf', plan: 'PRO', icon: TrendingUp, t: t('landing_mega_col3_pos'), d: t('landing_repf_desc') },
                            // ULTIMATE
                            { id: 'loy', plan: 'ULTIMATE', icon: Star, t: t('landing_loyalty'), d: t('landing_loyalty_desc') },
                            { id: 'tax', plan: 'ULTIMATE', icon: Calculator, t: t('landing_tax'), d: t('landing_tax_desc') },
                            { id: 'open', plan: 'ULTIMATE', icon: Receipt, t: t('landing_open_bills'), d: t('landing_open_bills_desc') },
                            { id: 'hpp', plan: 'ULTIMATE', icon: Calculator, t: t('nav_hpp'), d: t('landing_hpp_desc') },
                             { id: 'multi_outlet', plan: 'ULTIMATE', icon: Layout, t: t('landing_multi_outlet_title'), d: t('landing_multi_outlet_desc') },
                            { id: 'white', plan: 'ULTIMATE', icon: Palette, t: t('landing_mega_col3_white'), d: t('landing_white_desc') },
                        ].filter(f => activeFeatureTab === 'ALL' || f.plan === activeFeatureTab).map((feat, idx) => (
                            <FadeSection key={feat.id} style={{ transitionDelay: `${idx * 50}ms` }}>
                                <div className="p-6 rounded-3xl h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow group" style={{ background: 'var(--landing-bg-card)', border: '1px solid var(--landing-border)' }}>
                                    <div className="flex justify-between items-start">
                                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                                            <feat.icon size={22} className="text-primary" />
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                                            feat.plan === 'FREE' ? 'bg-emerald-100 text-emerald-600' :
                                            feat.plan === 'PRO' ? 'bg-blue-100 text-blue-600' :
                                            'bg-purple-100 text-purple-600'
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F1F5F9', borderRadius: 100, padding: 4, gap: 0, border: '1px solid var(--landing-border)' }}>
                            <button
                                onClick={() => setBilling('monthly')}
                                style={{
                                    padding: '10px 24px', borderRadius: 100, border: 'none', cursor: 'pointer',
                                    background: billing === 'monthly' ? 'white' : 'transparent',
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
                                <div className="text-sm font-extrabold mb-3" style={{ color: 'var(--landing-text-muted)' }}>{lang === 'en' ? 'ALWAYS FREE' : 'TETAP FREE'}</div>
                                <div className="text-4xl font-black mb-2" style={{ color: 'var(--landing-text)' }}>Rp 0<span className="text-base font-semibold" style={{ color: 'var(--landing-text-muted)' }}>/bln</span></div>
                                <p className="text-sm mb-6" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_pricing_free_desc')}</p>
                                
                                <button 
                                    onClick={() => handleNavAction('register')} 
                                    className="w-full py-4 rounded-xl border-2 bg-transparent text-base font-bold cursor-pointer transition-all active:scale-95 hover:bg-primary/5 hover:border-primary/30 mb-8" 
                                    style={{ borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }}
                                >
                                    {t('landing_pricing_start_free')} <span className="block text-[10px] opacity-70 font-normal mt-1">+ {t('upgrade_feat_free_0')}</span>
                                </button>

                                <div className="flex flex-col gap-4 flex-grow">
                                    {freeFeatures.map((feat, idx) => (
                                        <div key={idx} className="flex gap-3 items-center text-sm" style={{ color: 'var(--landing-text-muted)' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--landing-text-light)', opacity: 0.5 }} /> 
                                            {lang === 'en' ? feat.en : feat.id}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeSection>

                        {/* PRO PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div className="p-10 rounded-[32px] border-2 border-primary h-full relative flex flex-col shadow-xl shadow-primary/10 transition-transform hover:-translate-y-1" style={{ background: 'rgba(124, 58, 237, 0.03)' }}>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1.5 rounded-full text-[12px] font-black tracking-wider shadow-lg">{t('landing_pricing_badge_popular')}</div>
                                <div className="text-sm font-extrabold text-primary mb-3 uppercase tracking-wider">PRO</div>
                                <div className="text-4xl font-black mb-1" style={{ color: 'var(--landing-text)' }}>
                                    {billing === 'yearly' ? 'Rp 103.200' : (lang === 'en' ? 'Rp 129k' : 'Rp 129rb')}
                                    <span className="text-base font-semibold" style={{ color: 'var(--landing-text-muted)' }}>/bln</span>
                                </div>
                                {billing === 'yearly' && <div className="text-[11px] font-bold text-primary mb-2">(Total Rp 1.238.400 / tahun)</div>}
                                <p className="text-sm mb-8 font-medium" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_pricing_pro_desc')}</p>
                                <div className="flex flex-col gap-4 mb-10 flex-grow">
                                    {proFeatures.map((feat, idx) => (
                                        <div key={idx} className="flex gap-3 items-center text-sm font-bold" style={{ color: 'var(--landing-text)' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} /> 
                                            {lang === 'en' ? feat.en : feat.id}
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => {
                                        const url = billing === 'yearly' 
                                            ? 'https://my-invoice.myr.id/pl/myinvoice-pro-annual-plan-12-bulan'
                                            : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan';
                                        window.location.href = url;
                                    }} 
                                    className="w-full py-4 rounded-xl border-none bg-primary text-white text-base font-black cursor-pointer shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95"
                                >
                                    {t('landing_pricing_choose_pro')}
                                </button>
                            </div>
                        </FadeSection>

                        {/* ULTIMATE PLAN */}
                        <FadeSection style={{ height: '100%' }}>
                            <div className="p-10 rounded-3xl h-full flex flex-col shadow-sm" style={{ background: 'var(--landing-bg-card)', border: '1px solid var(--landing-border)' }}>
                                <div className="text-sm font-extrabold text-amber-500 mb-3 tracking-wider uppercase">ULTIMATE</div>
                                <div className="text-4xl font-black mb-1" style={{ color: 'var(--landing-text)' }}>
                                    {billing === 'yearly' ? 'Rp 119.200' : (lang === 'en' ? 'Rp 149k' : 'Rp 149rb')}
                                    <span className="text-base font-semibold" style={{ color: 'var(--landing-text-muted)' }}>/bln</span>
                                </div>
                                {billing === 'yearly' && <div className="text-[11px] font-bold text-amber-500 mb-2">(Total Rp 1.430.400 / tahun)</div>}
                                <p className="text-sm mb-8" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_pricing_ult_desc')}</p>
                                <div className="flex flex-col gap-4 mb-10 flex-grow">
                                    {ultimateFeatures.map((feat, idx) => (
                                        <div key={idx} className="flex gap-3 items-center text-sm" style={{ color: 'var(--landing-text-muted)' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} /> 
                                            {lang === 'en' ? feat.en : feat.id}
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => {
                                        const url = billing === 'yearly'
                                            ? 'https://my-invoice.myr.id/pl/myinvoice-ultimate-annual-plan-12-bulan'
                                            : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan-7spr';
                                        window.location.href = url;
                                    }} 
                                    className="w-full py-4 rounded-xl border-2 bg-transparent text-base font-bold cursor-pointer transition-colors active:scale-95" 
                                    style={{ borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }}
                                >
                                    {t('landing_pricing_choose_ult')}
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
                        {[1,2,3,4,5,6,7,8,9].map(num => (
                            <FadeSection key={num}>
                                <div className="rounded-2xl transition-all duration-300" style={{ background: openFaq === num ? 'var(--landing-bg-card)' : 'transparent', border: `1px solid ${openFaq === num ? 'var(--landing-border)' : 'transparent'}` }}>
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === num ? null : num)}
                                        className="w-full px-6 py-5 text-left bg-transparent border-none flex justify-between items-center cursor-pointer group"
                                    >
                                        <span className={`text-[17px] font-bold transition-colors ${openFaq === num ? 'text-primary' : ''}`} style={{ color: openFaq === num ? 'var(--color-primary)' : 'var(--landing-text)' }}>{t(`landing_faq_q${num}`)}</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${openFaq === num ? 'bg-primary/10 rotate-180' : 'bg-gray-100'}`}>
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
                                    <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] transition-transform group-hover:scale-110">
                                        <MessageCircle size={28} fill="currentColor" fillOpacity="0.2" />
                                    </div>
                                    <div>
                                        <h4 className="m-0 text-base font-extrabold" style={{ color: 'var(--landing-text)' }}>WhatsApp Support</h4>
                                        <p className="m-0" style={{ color: 'var(--landing-text-muted)' }}>+62 812-3340-8142</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center group">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
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
                                    <input type="text" placeholder={t('landing_contact_name_ph')} className="px-5 py-4 rounded-xl border-[1.5px] outline-none focus:border-primary transition-colors" style={{ background: 'var(--landing-input-bg)', borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold" style={{ color: 'var(--landing-text)' }}>{t('landing_contact_email')}</label>
                                    <input type="email" placeholder={t('landing_contact_email_ph')} className="px-5 py-4 rounded-xl border-[1.5px] outline-none focus:border-primary transition-colors" style={{ background: 'var(--landing-input-bg)', borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold" style={{ color: 'var(--landing-text)' }}>{t('landing_contact_message')}</label>
                                    <textarea rows="4" placeholder={t('landing_contact_msg_ph')} className="px-5 py-4 rounded-xl border-[1.5px] outline-none focus:border-primary transition-colors resize-none" style={{ background: 'var(--landing-input-bg)', borderColor: 'var(--landing-border)', color: 'var(--landing-text)' }}></textarea>
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

            <LandingFooter />

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
