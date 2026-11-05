import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown, X, ArrowRight, Check, Printer, FileText, Send } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

// Smooth fade-in observer
function useFadeIn(threshold = 0.1) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
}

function FadeSection({ children, style, id, className = '' }) {
    const [ref, visible] = useFadeIn();
    return (
        <div
            id={id}
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                ...style,
            }}
        >
            {children}
        </div>
    );
}

export default function Landing() {
    const { t, lang } = useLang();
    const isEn = lang === 'EN';
    const navigate = useNavigate();

    const handleNavAction = (action) => {
        if (action === 'register') navigate('/register');
        else if (action === 'login') navigate('/login');
    };

    // PWA Install states
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [showIosInstallModal, setShowIosInstallModal] = useState(false);
    const isIos = typeof window !== 'undefined' && /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isInStandaloneMode = typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    );

    useEffect(() => {
        if (isInStandaloneMode) return;
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [isInStandaloneMode]);

    const handleInstall = async () => {
        if (isIos && !isInStandaloneMode) {
            setShowIosInstallModal(true);
            return;
        }
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        setShowInstallBtn(false);
        setDeferredPrompt(null);
    };

    // Interactive Showcase States
    const [activeHeroTab, setActiveHeroTab] = useState('split'); // 'split' | 'pos' | 'invoice'
    const [mockupStatus, setMockupStatus] = useState('LUNAS');
    const [openFaq, setOpenFaq] = useState(null);
    const [billing, setBilling] = useState('monthly');

    return (
        <div data-landing="true" className="bg-[#FAFAFA] text-zinc-900 min-h-screen antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            <LandingNavbar />

            {/* HERO SECTION: MINIMALIST LINEAR / STRIPE SAAS STYLE MATCHING APPROVED REVIEW DESIGN */}
            <section className="relative pt-32 pb-16 px-6 overflow-hidden bg-white border-b border-zinc-200/80">
                {/* Subtle Perspective Grid Background */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-40" 
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: '48px 48px',
                        maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 75%)',
                        WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 75%)'
                    }}
                />

                <div className="relative max-w-5xl mx-auto text-center z-10">
                    <FadeSection>
                        {/* Punchy Headline matching approved review design */}
                        <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black tracking-tight text-zinc-950 leading-[1.08] mb-6 max-w-4xl mx-auto" style={{ letterSpacing: '-0.04em' }}>
                            {isEn ? <>One app for your retail POS<br className="hidden sm:inline" /> and business invoices.</> : <>Satu aplikasi untuk kasir toko<br className="hidden sm:inline" /> dan faktur bisnismu.</>}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base sm:text-lg text-zinc-500 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
                            {isEn ? 'Manage sales, print Bluetooth receipts offline, and send professional PDF invoices. 100% free.' : 'Kelola penjualan, cetak struk Bluetooth tanpa kuota internet, dan kirim invoice PDF profesional. 100% gratis.'}
                        </p>

                        {/* Pill Button matching approved mockup */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                            <button
                                onClick={() => handleNavAction('register')}
                                className="px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2"
                            >
                                <span>{isEn ? 'Get Started Free — No Credit Card Required' : 'Mulai Gratis — Tanpa Kartu Kredit'}</span>
                            </button>
                        </div>

                        {/* 3D HERO PRODUCT SHOWCASE - THE EXACT APPROVED REVIEW IMAGE ASSET */}
                        <div className="relative max-w-5xl mx-auto mt-2">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/80 border border-zinc-200/50 bg-gradient-to-b from-white to-zinc-50/50 p-2 sm:p-4">
                                <img 
                                    src="/images/hero-homepage-showcase.png" 
                                    alt={isEn ? "MyInvoice - Retail Store POS and Business Invoicing App" : "MyInvoice - Aplikasi Kasir Toko POS dan Faktur Bisnis"} 
                                    className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md rounded-xl"
                                    loading="eager"
                                />
                            </div>
                        </div>

                        {/* Fast Links to Specific Pillars */}
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-zinc-500 font-medium mt-8">
                            <span>{isEn ? 'Retail Stores? ' : 'Toko Retail? '}<Link to="/aplikasi-kasir-offline" className="text-zinc-900 font-bold hover:underline">{isEn ? 'Offline POS →' : 'Kasir Offline →'}</Link></span>
                            <span className="text-zinc-300">•</span>
                            <span>{isEn ? 'Cafes & F&B? ' : 'Kedai Kafe & F&B? '}<Link to="/aplikasi-kasir-kafe" className="text-zinc-900 font-bold hover:underline">{isEn ? 'Cafe POS →' : 'Kasir Kafe →'}</Link></span>
                            <span className="text-zinc-300">•</span>
                            <span>{isEn ? 'Freelancers & Agencies? ' : 'Freelancer & Agensi? '}<Link to="/software-invoice-freelance" className="text-zinc-900 font-bold hover:underline">{isEn ? 'Freelance Invoice →' : 'Invoice Freelance →'}</Link></span>
                            <span className="text-zinc-300">•</span>
                            <span>{isEn ? 'Instant Billing? ' : 'Faktur Cepat? '}<Link to="/buat-invoice-gratis" className="text-zinc-900 font-bold hover:underline">{isEn ? 'Free Invoice Generator →' : 'Invoice Gratis →'}</Link></span>
                            <span className="text-zinc-300">•</span>
                            <span>{isEn ? 'Menu Costing? ' : 'Hitung Modal Menu? '}<Link to="/kalkulator-hpp-gratis" className="text-zinc-900 font-bold hover:underline">{isEn ? 'Free HPP Calculator →' : 'Kalkulator HPP Gratis →'}</Link></span>
                        </div>

                        {/* PWA Install Button */}
                        {showInstallBtn && (
                            <div className="mt-6">
                                <button
                                    onClick={handleInstall}
                                    className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:bg-black shadow-sm"
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{isEn ? 'Install on Mobile / Laptop (POS Ready)' : 'Pasang di HP / Laptop (Aplikasi Kasir Siap)'}</span>
                                </button>
                            </div>
                        )}
                    </FadeSection>
                </div>
            </section>

            {/* DUAL PRODUCT HERO SHOWCASE: SPLIT VIEW (KASIR OFFLINE vs INVOICE DIGITAL) */}
            <section id="showcase" className="py-20 px-6 max-w-7xl mx-auto">
                <FadeSection>
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div>
                            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">LIVE INTERACTIVE SHOWCASE</span>
                            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mt-1">
                                {isEn ? 'Two Core Strengths in One Single Account' : 'Dua Kekuatan Inti dalam Satu Akun'}
                            </h2>
                        </div>
                        <div className="inline-flex p-1 bg-zinc-200/80 rounded-xl text-xs font-bold border border-zinc-200">
                            <button
                                onClick={() => setActiveHeroTab('split')}
                                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeHeroTab === 'split' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}`}
                            >
                                {isEn ? 'Both (Split-View)' : 'Keduanya (Split-View)'}
                            </button>
                            <button
                                onClick={() => setActiveHeroTab('pos')}
                                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeHeroTab === 'pos' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}`}
                            >
                                {isEn ? 'POS Cashier Only' : 'Kasir POS Saja'}
                            </button>
                            <button
                                onClick={() => setActiveHeroTab('invoice')}
                                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeHeroTab === 'invoice' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}`}
                            >
                                {isEn ? 'Invoice Only' : 'Faktur Invoice Saja'}
                            </button>
                        </div>
                    </div>

                    {/* SHOWCASE CONTAINER */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* LEFT PRODUCT: KASIR POS & THERMAL RECEIPT (7 Cols if split, 12 if pos, hidden if invoice) */}
                        {(activeHeroTab === 'split' || activeHeroTab === 'pos') && (
                            <div className={`${activeHeroTab === 'pos' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm`}>
                                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                                            <Printer size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-zinc-900">{isEn ? 'Retail Store POS (Offline-Ready Mode)' : 'Kasir Toko (Mode Offline Ready)'}</div>
                                            <div className="text-xs text-zinc-400">Bluetooth Printer 58mm/80mm • Auto-Sync</div>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {isEn ? 'Works Without Internet' : 'Internet Mati Tetap Jalan'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* POS Items list */}
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-mono text-zinc-400 uppercase">{isEn ? 'Cashier Cart:' : 'Keranjang Kasir:'}</span>
                                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 flex justify-between items-center text-xs">
                                            <div>
                                                <div className="font-bold text-zinc-800">{isEn ? 'Iced Palm Sugar Latte' : 'Kopi Susu Gula Aren'}</div>
                                                <div className="text-[10px] text-zinc-400">2x @ Rp 18.000</div>
                                            </div>
                                            <div className="font-mono font-bold text-zinc-900">Rp 36.000</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 flex justify-between items-center text-xs">
                                            <div>
                                                <div className="font-bold text-zinc-800">{isEn ? 'Chocolate Toast' : 'Roti Bakar Cokelat'}</div>
                                                <div className="text-[10px] text-zinc-400">1x @ Rp 15.000</div>
                                            </div>
                                            <div className="font-mono font-bold text-zinc-900">Rp 15.000</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/60 flex justify-between items-center text-xs">
                                            <div>
                                                <div className="font-bold text-zinc-800">{isEn ? 'Jumbo Sweet Iced Tea' : 'Es Teh Manis Jumbo'}</div>
                                                <div className="text-[10px] text-zinc-400">2x @ Rp 5.000</div>
                                            </div>
                                            <div className="font-mono font-bold text-zinc-900">Rp 10.000</div>
                                        </div>
                                    </div>

                                    {/* Receipt Output Simulation */}
                                    <div className="bg-[#FAF9F6] border border-zinc-200 rounded-2xl p-4 font-mono text-[11px] text-zinc-700 flex flex-col justify-between shadow-xs">
                                        <div>
                                            <div className="text-center pb-2 border-b border-dashed border-zinc-300 mb-2">
                                                <div className="font-black text-xs text-zinc-900">{isEn ? 'SENJA COFFEE ROASTERS' : 'KEDAI KOPI SENJA'}</div>
                                                <div className="text-[9px] text-zinc-400">{isEn ? 'Receipt #0892' : 'Struk Transaksi #0892'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between"><span>{isEn ? '2x Iced Latte' : '2x Kopi Susu'}</span><span>36.000</span></div>
                                                <div className="flex justify-between"><span>{isEn ? '1x Choc Toast' : '1x Roti Bakar'}</span><span>15.000</span></div>
                                                <div className="flex justify-between"><span>{isEn ? '2x Iced Tea' : '2x Es Teh'}</span><span>10.000</span></div>
                                            </div>
                                            <div className="border-t border-dashed border-zinc-300 mt-2 pt-2">
                                                <div className="flex justify-between font-bold text-zinc-900">
                                                    <span>TOTAL</span>
                                                    <span>Rp 61.000</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                                                    <span>{isEn ? 'CASH PAID' : 'BAYAR (TUNAI)'}</span>
                                                    <span>Rp 100.000</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-emerald-700 text-[10px]">
                                                    <span>{isEn ? 'CHANGE' : 'KEMBALI'}</span>
                                                    <span>Rp 39.000</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-zinc-200 text-center text-[10px] text-zinc-400 italic">
                                            {isEn ? 'Printed via Bluetooth Thermal' : 'Dicetak via Bluetooth Thermal'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RIGHT PRODUCT: DIGITAL INVOICE WITH PAID STAMP (5 Cols if split, 12 if invoice, hidden if pos) */}
                        {(activeHeroTab === 'split' || activeHeroTab === 'invoice') && (
                            <div className={`${activeHeroTab === 'invoice' ? 'lg:col-span-12' : 'lg:col-span-5'} bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm`}>
                                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-zinc-900">{isEn ? 'Digital A4 Invoice' : 'Faktur Digital A4'}</div>
                                            <div className="text-xs text-zinc-400">{isEn ? 'Instant PDF • Custom Logo • WhatsApp' : 'PDF Instan • Logo Kustom • WhatsApp'}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {['LUNAS', 'PENDING'].map(st => (
                                            <button
                                                key={st}
                                                onClick={() => setMockupStatus(st)}
                                                className={`text-[10px] font-black px-2 py-0.5 rounded cursor-pointer transition-all ${mockupStatus === st ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}
                                            >
                                                {st === 'LUNAS' ? (isEn ? 'PAID' : 'LUNAS') : 'PENDING'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Invoice Sheet Mockup */}
                                <div className="border border-zinc-200 rounded-2xl p-4 bg-white relative overflow-hidden text-xs">
                                    {/* Status Badge */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-black text-zinc-900 text-sm">{isEn ? 'OFFICIAL INVOICE' : 'INVOICE RESMI'}</div>
                                            <div className="text-[10px] text-zinc-400 font-mono">INV/2026/XI/0042</div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider ${mockupStatus === 'LUNAS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                            {mockupStatus === 'LUNAS' ? (isEn ? 'PAID' : 'LUNAS') : 'PENDING'}
                                        </span>
                                    </div>

                                    <div className="text-[11px] text-zinc-500 mb-3 space-y-0.5">
                                        <div>{isEn ? 'Billed To:' : 'Kepada:'} <strong className="text-zinc-800">PT Nusantara Cipta Digital</strong></div>
                                        <div>{isEn ? 'Date:' : 'Tanggal:'} <strong>{isEn ? 'November 4, 2026' : '4 November 2026'}</strong></div>
                                    </div>

                                    <div className="space-y-1.5 border-t border-b border-zinc-100 py-2.5 my-2">
                                        <div className="flex justify-between text-zinc-800 font-medium">
                                            <span>{isEn ? 'Brand Design & Consulting' : 'Jasa Desain & Konsultasi Brand'}</span>
                                            <span className="font-mono font-bold">Rp 2.500.000</span>
                                        </div>
                                        <div className="flex justify-between text-zinc-800 font-medium">
                                            <span>{isEn ? 'Web Implementation & Deployment' : 'Implementasi Web & Deployment'}</span>
                                            <span className="font-mono font-bold">Rp 3.500.000</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-bold text-zinc-600">{isEn ? 'Total Due:' : 'Total Tagihan:'}</span>
                                        <span className="text-base font-black text-zinc-900 font-mono">Rp 6.000.000</span>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400 font-mono">BCA: 873-0918-291 a.n Studio</span>
                                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                            <Send size={12} /> {isEn ? 'Send WhatsApp' : 'Kirim WA'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </FadeSection>
            </section>

            {/* BENTO GRID: MODERN ARSITEKTUR FITUR (CLEAN 01, 02, 03, 04) */}
            <section id="bento" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-200/80">
                <FadeSection className="mb-14">
                    <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">{isEn ? 'CORE CAPABILITIES' : 'KEMAMPUAN UTAMA'}</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mt-1">
                        {isEn ? 'Engineered for checkout speed and billing clarity.' : 'Didesain untuk kecepatan toko dan kejelasan tagihan.'}
                    </h2>
                    <p className="text-zinc-500 text-sm mt-2 max-w-xl">
                        {isEn ? 'All essential daily tools to manage sales and invoices without confusing, bloated menus.' : 'Semua fungsi harian yang kamu butuhkan untuk mengelola penjualan, tanpa menu rumit yang membingungkan.'}
                    </p>
                </FadeSection>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Bento 1: Kasir Offline (8 Cols) */}
                    <FadeSection className="md:col-span-8 bg-white rounded-3xl p-8 border border-zinc-200 flex flex-col justify-between">
                        <div>
                            <div className="font-mono text-xs text-zinc-400 mb-3">01 / RELIABILITY</div>
                            <h3 className="text-2xl font-black text-zinc-900 mb-2">{isEn ? '100% Operational During Internet Outages' : '100% Berjalan Saat Internet Terputus'}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed max-w-xl mb-6">
                                {isEn ? 'Power cuts or lost Wi-Fi never stop your sales. Transactions are securely stored in local device memory and automatically sync when connectivity returns.' : 'Pemadaman listrik atau kuota habis tidak lagi menghambat checkout pelanggan. Transaksi kasir tersimpan di memori perangkat lokal dan otomatis tersinkronisasi saat sinyal online kembali.'}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-bold text-zinc-800">{isEn ? 'Offline Queue: 0 Pending' : 'Antrean Offline: 0 Pending'}</span>
                            </div>
                            <span className="text-zinc-400 font-mono">PWA Standalone Engine</span>
                        </div>
                    </FadeSection>

                    {/* Bento 2: Bluetooth Printer (4 Cols) */}
                    <FadeSection className="md:col-span-4 bg-white rounded-3xl p-8 border border-zinc-200 flex flex-col justify-between">
                        <div>
                            <div className="font-mono text-xs text-zinc-400 mb-3">02 / HARDWARE</div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">{isEn ? 'Thermal Bluetooth Printer Support' : 'Support Printer Bluetooth Thermal'}</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                                {isEn ? 'Pair any Android phone or laptop directly to affordable 58mm & 80mm thermal receipt printers without tricky driver installs.' : 'Pasangkan langsung HP Android atau laptop ke printer struk 58mm & 80mm murah tanpa instalasi driver rumit.'}
                            </p>
                        </div>
                        <div className="text-xs font-mono text-zinc-400 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                            ESC/POS & Web Bluetooth Ready
                        </div>
                    </FadeSection>

                    {/* Bento 3: Laba Rugi & HPP (4 Cols) */}
                    <FadeSection className="md:col-span-4 bg-white rounded-3xl p-8 border border-zinc-200 flex flex-col justify-between">
                        <div>
                            <div className="font-mono text-xs text-zinc-400 mb-3">{isEn ? '03 / FINANCIALS' : '03 / FINANSIAL'}</div>
                            <h3 className="text-xl font-black text-zinc-900 mb-2">{isEn ? 'COGS & Net Profit Calculator' : 'Kalkulator HPP & Laba Bersih'}</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                                {isEn ? 'Track unit raw material cost and profit margin per product so your business avoids silent leaks.' : 'Pantau harga modal dan margin profit per item agar tokomu tidak mengalami bocor halus di akhir bulan.'}
                            </p>
                        </div>
                        <div className="text-xs font-bold text-zinc-800 p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex justify-between">
                            <span>{isEn ? 'Store Net Profit:' : 'Laba Bersih Toko:'}</span>
                            <span className="text-emerald-600 font-mono">+42.5%</span>
                        </div>
                    </FadeSection>

                    {/* Bento 4: 0% Komisi & Multi-Cabang (8 Cols) */}
                    <FadeSection className="md:col-span-8 bg-white rounded-3xl p-8 border border-zinc-200 flex flex-col justify-between">
                        <div>
                            <div className="font-mono text-xs text-zinc-400 mb-3">{isEn ? '04 / TRANSACTIONS & GROWTH' : '04 / TRANSAKSI & PERTUMBUHAN'}</div>
                            <h3 className="text-2xl font-black text-zinc-900 mb-2">{isEn ? '0% Commission Fees & Multi-Outlet Ready' : '0% Potongan Komisi & Siap Multi-Outlet'}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed max-w-xl mb-6">
                                {isEn ? 'No percentage cuts per transaction. 100% of your revenue stays yours. As you open new branches, monitor all cashiers from one central dashboard.' : 'Tidak ada potongan persenan per transaksi gesek. Semua pendapatan murni milik tokomu. Saat bisnismu membuka cabang baru, kamu bisa memantau semua kasir dari satu dashboard pusat.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600 flex-wrap">
                            <span className="flex items-center gap-1.5"><Check size={14} className="text-zinc-900" /> {isEn ? 'Zero Transaction Fees' : 'Bebas Biaya Transaksi'}</span>
                            <span className="flex items-center gap-1.5"><Check size={14} className="text-zinc-900" /> {isEn ? 'Separate Cashier Accounts' : 'Multi-Kasir Terpisah'}</span>
                            <span className="flex items-center gap-1.5"><Check size={14} className="text-zinc-900" /> {isEn ? 'Telegram Bot Alerts' : 'Notifikasi Bot Telegram'}</span>
                        </div>
                    </FadeSection>

                </div>
            </section>

            {/* PRICING SECTION: SIMPLE MONOCHROME CARDS */}
            <section id="pricing" className="py-24 px-6 bg-white border-t border-zinc-200/80">
                <div className="max-w-6xl mx-auto">
                    <FadeSection className="text-center max-w-xl mx-auto mb-14">
                        <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">{isEn ? 'SIMPLE & TRANSPARENT' : 'TRANSPARAN & SEDERHANA'}</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mt-1 mb-3">
                            {isEn ? 'Choose a plan that fits your scale.' : 'Pilih paket yang sesuai skalanya.'}
                        </h2>
                        <p className="text-zinc-500 text-sm mb-6">{isEn ? 'Start free today. Upgrade whenever you need watermark-free documents or multi-outlet branching.' : 'Mulai gratis hari ini. Upgrade jika membutuhkan cetak tanpa watermark atau multi-outlet.'}</p>

                        {/* Minimalist Switcher */}
                        <div className="inline-flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-semibold">
                            <button
                                onClick={() => setBilling('monthly')}
                                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${billing === 'monthly' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}
                            >
                                {isEn ? 'Monthly' : 'Bulanan'}
                            </button>
                            <button
                                onClick={() => setBilling('yearly')}
                                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${billing === 'yearly' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'}`}
                            >
                                <span>{isEn ? 'Yearly' : 'Tahunan'}</span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">{isEn ? 'Save 20%' : 'Hemat 20%'}</span>
                            </button>
                        </div>
                    </FadeSection>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        
                        {/* STARTER */}
                        <FadeSection className="h-full">
                            <div className="p-8 rounded-3xl bg-zinc-50/60 border border-zinc-200 flex flex-col justify-between h-full">
                                <div>
                                    <div className="font-bold text-sm text-zinc-900">{isEn ? 'Starter Plan' : 'Paket Starter'}</div>
                                    <div className="text-xs text-zinc-400 mt-0.5 mb-6">{isEn ? 'For small startups & beginning freelancers' : 'Untuk usaha rintisan & freelancer pemula'}</div>
                                    <div className="text-4xl font-black text-zinc-900 mb-6 font-mono">Rp 0</div>
                                    <ul className="space-y-3 text-xs text-zinc-600 mb-8">
                                        <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? 'Offline PWA POS Cashier' : 'Kasir POS Offline PWA'}</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? 'Bluetooth & USB Receipt Printing' : 'Cetak Struk Bluetooth & USB'}</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? '25 Invoices & Receipts / Month' : '25 Invoice & Kwitansi / Bulan'}</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? 'Subtle MyInvoice watermark' : 'Watermark halus MyInvoice'}</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => handleNavAction('register')}
                                    className="w-full py-3 rounded-xl border border-zinc-300 hover:border-zinc-900 text-xs font-bold text-zinc-900 transition-all cursor-pointer"
                                >
                                    {isEn ? 'Sign Up Free' : 'Daftar Gratis'}
                                </button>
                            </div>
                        </FadeSection>

                        {/* PRO CENTERPIECE */}
                        <FadeSection className="h-full">
                            <div className="p-8 rounded-3xl bg-zinc-900 text-white border border-zinc-800 shadow-xl flex flex-col justify-between h-full relative">
                                <div className="absolute -top-3 right-6 bg-white text-zinc-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                    {isEn ? 'MOST POPULAR' : 'PALING POPULER'}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-white">{isEn ? 'Pro Plan' : 'Paket Pro'}</div>
                                    <div className="text-xs text-zinc-400 mt-0.5 mb-6">{isEn ? 'For active stores needing clean receipts' : 'Untuk toko aktif yang butuh struk bersih'}</div>
                                    <div className="text-4xl font-black text-white mb-6 font-mono">
                                        {billing === 'yearly' ? 'Rp 103rb' : 'Rp 129rb'}
                                        <span className="text-xs font-normal text-zinc-400"> {isEn ? '/mo' : '/bln'}</span>
                                    </div>
                                    <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> {isEn ? 'All Starter Features Included' : 'Semua Fitur Starter'}</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> <strong>{isEn ? '100% No Watermark' : '100% Tanpa Watermark'}</strong></li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> {isEn ? 'Unlimited Cashier POS & Invoices' : 'Transaksi Kasir & Invoice Tanpa Batas'}</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> {isEn ? 'Net Profit Reports & Excel Export' : 'Laporan Laba Rugi Bersih & Ekspor Excel'}</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => {
                                        const url = billing === 'yearly'
                                            ? 'https://my-invoice.myr.id/pl/myinvoice-pro-annual-plan-12-bulan'
                                            : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan';
                                        window.location.href = url;
                                    }}
                                    className="w-full py-3 rounded-xl bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-900 transition-all cursor-pointer"
                                >
                                    {isEn ? 'Choose Pro Plan' : 'Pilih Paket Pro'}
                                </button>
                            </div>
                        </FadeSection>

                        {/* ULTIMATE */}
                        <FadeSection className="h-full">
                            <div className="p-8 rounded-3xl bg-zinc-50/60 border border-zinc-200 flex flex-col justify-between h-full">
                                <div>
                                    <div className="font-bold text-sm text-zinc-900">{isEn ? 'Ultimate Plan' : 'Paket Ultimate'}</div>
                                    <div className="text-xs text-zinc-400 mt-0.5 mb-6">{isEn ? 'Multi-outlet & Telegram sales bot' : 'Multi-outlet & otomasi bot Telegram'}</div>
                                    <div className="text-4xl font-black text-zinc-900 mb-6 font-mono">
                                        {billing === 'yearly' ? 'Rp 119rb' : 'Rp 149rb'}
                                        <span className="text-xs font-normal text-zinc-400"> {isEn ? '/mo' : '/bln'}</span>
                                    </div>
                                    <ul className="space-y-3 text-xs text-zinc-600 mb-8">
                                        <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? 'All Pro Plan Features' : 'Semua Fitur Paket Pro'}</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> <strong>{isEn ? 'Multi-Branch / Multi-Outlet' : 'Multi-Cabang / Outlet'}</strong></li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? 'Telegram Sales Notification Bot' : 'Bot Notifikasi Penjualan Telegram'}</li>
                                        <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? 'Multi Cashier Accounts & Audit Trail' : 'Multi Akun Kasir & Audit Trail'}</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => {
                                        const url = billing === 'yearly'
                                            ? 'https://my-invoice.myr.id/pl/myinvoice-ultimate-annual-plan-12-bulan'
                                            : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan-7spr';
                                        window.location.href = url;
                                    }}
                                    className="w-full py-3 rounded-xl border border-zinc-300 hover:border-zinc-900 text-xs font-bold text-zinc-900 transition-all cursor-pointer"
                                >
                                    {isEn ? 'Choose Ultimate Plan' : 'Pilih Paket Ultimate'}
                                </button>
                            </div>
                        </FadeSection>

                    </div>
                </div>
            </section>

            {/* FAQ ACCORDION (MINIMAL ACCORDION) */}
            <section id="faq" className="py-24 px-6 bg-[#FAFAFA] border-t border-zinc-200/80">
                <div className="max-w-3xl mx-auto">
                    <FadeSection className="text-center mb-14">
                        <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">FAQ</span>
                        <h2 className="text-3xl font-black text-zinc-900 tracking-tight mt-1">
                            {isEn ? 'Frequently Asked Questions' : 'Pertanyaan Umum'}
                        </h2>
                    </FadeSection>

                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <FadeSection key={num}>
                                <div className="border border-zinc-200 rounded-2xl bg-white overflow-hidden transition-all">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(openFaq === num ? null : num)}
                                        className="w-full px-6 py-4 text-left flex justify-between items-center cursor-pointer transition-colors hover:bg-zinc-50"
                                    >
                                        <span className="text-sm font-bold text-zinc-900">
                                            {t(`landing_faq_q${num}`)}
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className={`text-zinc-400 transition-transform duration-200 ${openFaq === num ? 'rotate-180 text-zinc-900' : ''}`}
                                        />
                                    </button>
                                    {openFaq === num && (
                                        <div className="px-6 pb-5 pt-1 text-xs text-zinc-500 leading-relaxed border-t border-zinc-100">
                                            {t(`landing_faq_a${num}`)}
                                        </div>
                                    )}
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL MINIMAL CTA BANNER (MONOCHROME BLACK) */}
            <section className="py-24 px-6 bg-zinc-900 text-white text-center">
                <div className="max-w-2xl mx-auto space-y-6">
                    <FadeSection>
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                            {isEn ? 'Start organizing your business today.' : 'Mulai rapikan tokomu hari ini.'}
                        </h2>
                        <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
                            {isEn ? 'Sign up in 30 seconds with no credit card required. Experience resilient offline POS and professional invoicing.' : 'Daftar dalam 30 detik tanpa kartu kredit. Nikmati kasir offline yang tangguh dan faktur yang profesional.'}
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                            <button
                                onClick={() => handleNavAction('register')}
                                className="px-8 py-4 rounded-xl bg-white text-zinc-900 font-bold text-sm hover:bg-zinc-100 transition-all cursor-pointer shadow-lg"
                            >
                                {isEn ? 'Create Free Account Now' : 'Buat Akun Gratis Sekarang'}
                            </button>
                            <button
                                onClick={() => handleNavAction('login')}
                                className="px-6 py-4 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 transition-all cursor-pointer"
                            >
                                {isEn ? 'Already Have an Account? Log In' : 'Sudah Punya Akun? Masuk'}
                            </button>
                        </div>
                    </FadeSection>
                </div>
            </section>

            {/* iOS PWA Install Modal */}
            {showIosInstallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-left border border-zinc-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">{isEn ? 'iOS Installation Guide' : 'Panduan iOS'}</span>
                            <button onClick={() => setShowIosInstallModal(false)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-1">
                                <X size={18} />
                            </button>
                        </div>
                        <h3 className="text-base font-black text-zinc-900 mb-2">{isEn ? 'Install on iPhone / iPad' : 'Pasang di iPhone / iPad'}</h3>
                        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                            {isEn ? 'Open Safari browser, tap the Share button on the bottom toolbar, then select "Add to Home Screen".' : 'Buka browser Safari, ketuk tombol Share di bagian toolbar bawah, lalu pilih menu "Add to Home Screen".'}
                        </p>
                        <button onClick={() => setShowIosInstallModal(false)} className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold cursor-pointer">
                            {isEn ? 'Got It' : 'Mengerti'}
                        </button>
                    </div>
                </div>
            )}

            <LandingFooter />
        </div>
    );
}
