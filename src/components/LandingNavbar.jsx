import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    FileText, Receipt, Package, Store,
    Globe, ChevronDown, Menu, X,
    Shield, Star, Users, Tag, Scan, 
    Briefcase, CreditCard, BarChart2, TrendingUp, BookOpen, 
    FilePlus, Layout, Palette, Download, Sun, Moon
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function LandingNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { lang, toggleLang, t } = useLang();
    const { dark, toggle: toggleTheme } = useTheme();
    const { user } = useAuth();
    
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isLegalOpen, setIsLegalOpen] = useState(false);
    
    const productRef = useRef(null);
    const legalRef = useRef(null);

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
        
        if (location.pathname === '/') {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            navigate(`/?scroll=${id}`);
        }
    };

    const handleNavAction = (type) => {
        if (user) navigate('/dashboard');
        else navigate(type === 'login' ? '/login' : '/register');
    };

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
                            <p className="m-0 text-sm font-bold transition-colors group-hover:text-primary text-slate-900 dark:text-white">{item.label}</p>
                            <p className="m-0 text-xs transition-colors text-slate-600 dark:text-slate-400">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <header 
            className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'py-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800' : 'py-6 bg-transparent border-b border-transparent'}`}
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
                            className="bg-transparent border-none cursor-pointer hover:text-primary text-[15px] font-semibold px-4 py-2 flex items-center gap-1 transition-colors text-slate-700 dark:text-slate-300"
                        >
                            {t('landing_nav_products')} <ChevronDown size={14} className={`transition-transform duration-200 ${isProductOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Mega Menu */}
                        {isProductOpen && (
                            <div 
                                onMouseLeave={() => setIsProductOpen(false)}
                                className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] rounded-3xl p-8 pb-20 mt-3 shadow-2xl border flex gap-8 animate-in fade-in slide-in-from-top-4 duration-200 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
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
                                <div className="absolute bottom-0 left-0 right-0 px-8 py-3 rounded-b-3xl text-center border-t bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800">
                                    <button onClick={() => handleNavAction('register')} className="bg-transparent border-none text-primary text-[13px] font-bold cursor-pointer hover:underline">
                                        {t('landing_mega_cta')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {['features', 'pricing', 'faq', 'contact'].map(id => (
                        <button key={id} onClick={() => scrollTo(id)} className="bg-transparent border-none cursor-pointer text-slate-600 dark:text-slate-300 hover:text-primary text-[15px] font-semibold px-4 py-2 transition-colors">
                            {t(`landing_nav_${id}`)}
                        </button>
                    ))}

                    {/* Legal Dropdown */}
                    <div style={{ position: 'relative' }} ref={legalRef}>
                        <button
                            onMouseEnter={() => setIsLegalOpen(true)}
                            onClick={() => setIsLegalOpen(!isLegalOpen)}
                            className="bg-transparent border-none cursor-pointer text-slate-700 dark:text-slate-300 hover:text-primary text-[15px] font-semibold px-4 py-2 flex items-center gap-1 transition-colors"
                        >
                            {t('landing_legal')}
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
                                            {t('landing_policy')}
                                        </p>
                                        <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                                            {t('landing_policy_desc')}
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
                                            {t('landing_terms')}
                                        </p>
                                        <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                                            {t('landing_terms_desc')}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Navbar Actions */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="flex items-center gap-2 mr-2">
                        <button onClick={toggleLang} className="bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Toggle Language">
                            <Globe size={18} style={{ color: 'var(--landing-text)' }} />
                            <span className="ml-1.5 text-[13px] font-black uppercase" style={{ color: 'var(--landing-text)' }}>{lang}</span>
                        </button>
                        <button onClick={toggleTheme} className="bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Toggle Theme">
                            {dark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#64748B" />}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }} className="landing-auth-btns">
                        <button onClick={() => handleNavAction('login')} className="bg-transparent border-none text-[15px] font-bold cursor-pointer transition-colors" style={{ color: 'var(--landing-text)' }}>
                            {t('landing_nav_login')}
                        </button>
                        <button 
                            onClick={() => handleNavAction('register')} 
                            className="bg-primary text-white border-none rounded-xl px-6 py-3 text-[15px] font-black cursor-pointer shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
                        >
                            {t('landing_nav_trial')}
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="landing-mobile-toggle bg-transparent border-none cursor-pointer" style={{ color: 'var(--landing-text)' }}>
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 top-[80px] z-[99] bg-white dark:bg-slate-900 animate-in fade-in duration-200 lg:hidden overflow-y-auto">
                    <div className="p-6 flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                            {['features', 'pricing', 'faq', 'contact'].map(id => (
                                <button key={id} onClick={() => scrollTo(id)} className="w-full text-left bg-transparent border-none py-3 text-lg font-bold" style={{ color: 'var(--landing-text)' }}>
                                    {t(`landing_nav_${id}`)}
                                </button>
                            ))}
                        </div>
                        <div className="h-[1px] w-full bg-gray-100 dark:bg-gray-800" />
                        <div className="flex flex-col gap-4">
                            <button onClick={() => handleNavAction('login')} className="w-full py-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 text-lg font-bold" style={{ color: 'var(--landing-text)' }}>
                                {t('landing_nav_login')}
                            </button>
                            <button onClick={() => handleNavAction('register')} className="w-full py-4 rounded-xl bg-primary text-white text-lg font-black shadow-lg shadow-primary/25">
                                {t('landing_nav_trial')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

