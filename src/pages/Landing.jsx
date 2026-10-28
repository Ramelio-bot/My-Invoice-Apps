import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

// Fade-in observer hook
function useFadeIn(threshold = 0.12) {
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

// Fade section wrapper
function FadeSection({ children, style, id, className = '' }) {
    const [ref, visible] = useFadeIn();
    return (
        <div
            id={id}
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                ...style,
            }}
        >
            {children}
        </div>
    );
}

export default function Landing() {
    const { lang, t } = useLang();
    const { showToast } = useToast();
    const navigate = useNavigate();

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

    // Contact form state
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [isSendingContact, setIsSendingContact] = useState(false);

    const handleContact = (e) => {
        e.preventDefault();
        if (!contactForm.name || !contactForm.email || !contactForm.message) {
            showToast(lang === 'id' ? 'Mohon lengkapi semua kolom.' : 'Please fill in all fields.', 'error');
            return;
        }
        setIsSendingContact(true);
        const subject = encodeURIComponent(`[MyInvoice] Pesan dari ${contactForm.name}`);
        const body = encodeURIComponent(`Nama: ${contactForm.name}\nEmail: ${contactForm.email}\n\nPesan:\n${contactForm.message}`);
        window.open(`mailto:hello.myinvoice@gmail.com?subject=${subject}&body=${body}`);
        showToast(
            lang === 'id' ? 'Pesan siap dikirim. Selesaikan di aplikasi email Anda.' : 'Message ready. Complete sending in your email app.',
            'success',
            5000
        );
        setContactForm({ name: '', email: '', message: '' });
        setIsSendingContact(false);
    };

    const handleNavAction = (action) => {
        if (action === 'register') navigate('/register');
        else if (action === 'login') navigate('/login');
    };

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const scrollId = params.get('scroll');
        if (scrollId) {
            setTimeout(() => {
                document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 400);
        }
    }, []);

    // Interactive Hero Mockup state
    const [mockupStatus, setMockupStatus] = useState('LUNAS');

    // Filter feature tabs
    const [activeFeatureTab, setActiveFeatureTab] = useState('ALL');
    const [openFaq, setOpenFaq] = useState(null);
    const [billing, setBilling] = useState('monthly');

    const freeFeatures = [
        { key: 'upgrade_feat_free_1' },
        { key: 'upgrade_feat_free_2' },
        { key: 'upgrade_feat_free_3' },
        { key: 'upgrade_feat_free_6' },
    ];

    const proFeatures = [
        { key: 'upgrade_feat_pro_1' },
        { key: 'upgrade_feat_pro_2' },
        { key: 'upgrade_feat_loyalty' },
        { key: 'upgrade_feat_shift' },
        { key: 'upgrade_feat_report_full' },
        { key: 'upgrade_feat_priority_support' },
    ];

    const ultimateFeatures = [
        { key: 'upgrade_feat_unlimited_inv' },
        { key: 'upgrade_feat_multi_outlet' },
        { key: 'upgrade_feat_hpp_advance' },
        { key: 'upgrade_feat_excel_csv' },
        { key: 'upgrade_feat_debt' },
        { key: 'upgrade_feat_telegram_bot' },
        { key: 'upgrade_feat_vip_support' },
    ];

    const allFeatureList = [
        { id: 'inv', plan: 'FREE', category: 'DOKUMEN', t: t('landing_mega_col1_inv'), d: t('landing_mega_col1_inv_d'), limit: '25 / bulan' },
        { id: 'kw', plan: 'FREE', category: 'DOKUMEN', t: t('landing_mega_col1_kw'), d: t('landing_mega_col1_kw_d'), limit: '25 / bulan' },
        { id: 'tt', plan: 'FREE', category: 'DOKUMEN', t: t('landing_mega_col1_tt'), d: t('landing_mega_col1_tt_d'), limit: '15 / bulan' },
        { id: 'sph', plan: 'FREE', category: 'DOKUMEN', t: t('landing_mega_col1_sph'), d: t('landing_mega_col1_sph_d'), limit: '15 / bulan' },
        { id: 'po', plan: 'FREE', category: 'DOKUMEN', t: t('landing_mega_col1_po'), d: t('landing_mega_col1_po_d'), limit: '15 / bulan' },
        { id: 'hp', plan: 'FREE', category: 'KEUANGAN', t: t('landing_mega_col1_hp'), d: t('landing_mega_col1_hp_d'), limit: '25 / bulan' },
        { id: 'cb', plan: 'FREE', category: 'KEUANGAN', t: t('landing_mega_col3_note'), d: t('landing_mega_col3_note_d'), limit: '20 / bulan' },
        { id: 'pos', plan: 'FREE', category: 'KASIR', t: t('landing_mega_col2_pos'), d: t('landing_mega_col2_pos_d'), limit: '100 trx / bulan' },
        { id: 'cli', plan: 'FREE', category: 'DATA', t: t('nav_clients'), d: t('kl_total_doc'), limit: '15 klien' },
        { id: 'prod', plan: 'FREE', category: 'INVENTORI', t: t('landing_mega_col2_prod'), d: t('landing_mega_col2_prod_d'), limit: '30 produk' },
        { id: 'rep', plan: 'FREE', category: 'ANALITIK', t: t('landing_mega_col3_fin'), d: t('landing_mega_col3_fin_d'), limit: 'Aktif' },
        { id: 'inv_pro', plan: 'PRO', category: 'DOKUMEN', t: t('landing_unlimited_all'), d: t('landing_unlimited_desc'), limit: '100 / bulan' },
        { id: 'pos_pro', plan: 'PRO', category: 'KASIR', t: t('landing_mega_col2_pos'), d: t('landing_mega_col2_pos_d'), limit: '500 trx / bulan' },
        { id: 'cli_pro', plan: 'PRO', category: 'DATA', t: t('nav_clients'), d: t('kl_total_doc'), limit: '50 klien' },
        { id: 'wa', plan: 'PRO', category: 'INTEGRASI', t: t('share_wa'), d: t('landing_wa_desc'), limit: 'Aktif' },
        { id: 'csv', plan: 'PRO', category: 'EXPORT', t: t('landing_mega_col3_exp'), d: t('landing_csv_desc'), limit: 'Aktif' },
        { id: 'scan', plan: 'PRO', category: 'KASIR', t: t('landing_mega_col2_scan'), d: t('landing_scan_desc'), limit: 'Aktif' },
        { id: 'emp', plan: 'PRO', category: 'TIM', t: t('landing_mega_col2_emp'), d: t('landing_emp_desc'), limit: 'Aktif' },
        { id: 'voc', plan: 'PRO', category: 'PROMOSI', t: t('landing_mega_col2_voc'), d: t('landing_voc_desc'), limit: 'Aktif' },
        { id: 'repf', plan: 'PRO', category: 'ANALITIK', t: t('landing_mega_col3_pos'), d: t('landing_repf_desc'), limit: 'Aktif' },
        { id: 'loy', plan: 'ULTIMATE', category: 'LOYALTI', t: t('landing_loyalty'), d: t('landing_loyalty_desc'), limit: 'Unlimited' },
        { id: 'tax', plan: 'ULTIMATE', category: 'PAJAK', t: t('landing_tax'), d: t('landing_tax_desc'), limit: 'Unlimited' },
        { id: 'open', plan: 'ULTIMATE', category: 'KASIR', t: t('landing_open_bills'), d: t('landing_open_bills_desc'), limit: 'Unlimited' },
        { id: 'hpp', plan: 'ULTIMATE', category: 'KEUANGAN', t: t('nav_hpp'), d: t('landing_hpp_desc'), limit: 'Unlimited' },
        { id: 'multi_outlet', plan: 'ULTIMATE', category: 'CABANG', t: t('landing_multi_outlet_title'), d: t('landing_multi_outlet_desc'), limit: 'Unlimited' },
        { id: 'telegram', plan: 'ULTIMATE', category: 'BOT', t: t('landing_telegram_companion'), d: t('landing_telegram_desc'), limit: 'Unlimited' },
        { id: 'white', plan: 'ULTIMATE', category: 'BRANDING', t: t('landing_mega_col3_white'), d: t('landing_white_desc'), limit: 'Unlimited' },
    ];

    return (
        <div data-landing="true" className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-violet-100 selection:text-violet-900" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            <LandingNavbar />

            {/* HERO SECTION ASIMETRIS (60% Typography & Value, 40% Live Interactive Mockup) */}
            <section className="relative pt-36 pb-20 px-6 overflow-hidden bg-gradient-to-b from-white via-slate-50/60 to-slate-100/70">
                {/* Ambient Soft Glow Blobs */}
                <div className="absolute top-12 left-1/4 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
                <div className="absolute top-36 right-12 w-96 h-96 bg-purple-300/15 rounded-full blur-3xl pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
                    
                    {/* Left Column (7 Columns) */}
                    <div className="lg:col-span-7 text-left space-y-6">
                        <FadeSection>
                            {/* Status Chip */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200/80 text-violet-800 text-xs font-bold tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-violet-600" />
                                <span>Platform Manajemen Bisnis & Kasir POS UMKM</span>
                            </div>

                            {/* Main Display Headline */}
                            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-slate-900 leading-[1.12] mt-4 mb-5">
                                Faktur Profesional, <br className="hidden sm:inline" />
                                <span className="text-violet-700">
                                    Kasir POS Offline
                                </span>, 
                                & Arus Kas Terintegrasi.
                            </h1>

                            {/* Subtitle */}
                            <p className="text-lg text-slate-600 leading-relaxed font-normal max-w-xl mb-8">
                                Terbitkan invoice PDF digital dalam hitungan detik, jalankan transaksi kasir tanpa khawatir internet terputus, dan kendalikan laba kotor hingga HPP secara akurat.
                            </p>

                            {/* Dual CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1 mb-8">
                                <button
                                    onClick={() => handleNavAction('register')}
                                    className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-base shadow-lg shadow-violet-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center"
                                >
                                    Mulai Coba Gratis 14 Hari
                                </button>
                                <button
                                    onClick={() => scrollTo('bento')}
                                    className="px-7 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border border-slate-200 shadow-sm transition-all hover:border-slate-300 cursor-pointer text-center"
                                >
                                    Pelajari Arsitektur Fitur
                                </button>
                            </div>

                            {/* PWA Install Button (Conditional) */}
                            {showInstallBtn && (
                                <div className="mb-6">
                                    <button
                                        onClick={handleInstall}
                                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span>Pasang Aplikasi di Perangkat (Mode Offline Siap)</span>
                                    </button>
                                </div>
                            )}

                            {/* Proof Metrics (Clean typography without icons) */}
                            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-200/80 max-w-lg">
                                <div>
                                    <div className="text-2xl font-black text-slate-900">100%</div>
                                    <div className="text-xs font-semibold text-slate-500">Kasir Offline PWA</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-900">&lt; 30 Detik</div>
                                    <div className="text-xs font-semibold text-slate-500">Terbitkan Faktur PDF</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-900">Rp 0</div>
                                    <div className="text-xs font-semibold text-slate-500">Mulai Paket Free</div>
                                </div>
                            </div>
                        </FadeSection>
                    </div>

                    {/* Right Column (5 Columns): Live Interactive Mockup Card */}
                    <div className="lg:col-span-5 relative">
                        <FadeSection>
                            {/* Floating Top Pill */}
                            <div className="mb-4 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-extrabold text-slate-900">Kasir POS Siap Offline</span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500">Auto-Sync Cloud</span>
                            </div>

                            {/* Main Invoice Card Mockup */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-violet-300">
                                {/* Card Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                                    <div>
                                        <span className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wider block">FAKTUR PENJUALAN</span>
                                        <span className="text-base font-black text-slate-900">#INV-2026/089</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border ${
                                        mockupStatus === 'LUNAS'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : mockupStatus === 'JATUH TEMPO'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-violet-50 text-violet-700 border-violet-200'
                                    }`}>
                                        {mockupStatus}
                                    </div>
                                </div>

                                {/* Billing Info */}
                                <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Klien:</span>
                                        <span className="font-bold text-slate-900">PT Maju Bersama Digital</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Metode Pembayaran:</span>
                                        <span className="font-bold text-violet-700">QRIS / Kasir POS</span>
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="space-y-2 mb-4 text-xs">
                                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                        <div>
                                            <span className="font-bold text-slate-800 block">Jasa Konsultasi Bisnis & Operasional</span>
                                            <span className="text-[11px] text-slate-500">1 paket x Rp 1.500.000</span>
                                        </div>
                                        <span className="font-bold text-slate-900">Rp 1.500.000</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                        <div>
                                            <span className="font-bold text-slate-800 block">Roll Kertas Struk & Label Barcode</span>
                                            <span className="text-[11px] text-slate-500">2 roll x Rp 75.000</span>
                                        </div>
                                        <span className="font-bold text-slate-900">Rp 150.000</span>
                                    </div>
                                </div>

                                {/* Calculation Total */}
                                <div className="bg-violet-50/80 border border-violet-100 rounded-xl p-4 mb-4">
                                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                                        <span>Subtotal:</span>
                                        <span className="font-bold text-slate-800">Rp 1.650.000</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-600 mb-2">
                                        <span>Pajak PPN:</span>
                                        <span className="font-bold text-slate-800">Rp 0 (0%)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2 border-t border-violet-200">
                                        <span>Total Tagihan:</span>
                                        <span className="text-lg font-black text-violet-700">Rp 1.650.000</span>
                                    </div>
                                </div>

                                {/* Interactive Status Switcher */}
                                <div className="pt-2 border-t border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-500 block mb-2 text-center uppercase tracking-wider">
                                        Simulasi Status Faktur:
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMockupStatus('LUNAS')}
                                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                mockupStatus === 'LUNAS'
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                            }`}
                                        >
                                            Lunas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMockupStatus('JATUH TEMPO')}
                                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                mockupStatus === 'JATUH TEMPO'
                                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                            }`}
                                        >
                                            Jatuh Tempo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMockupStatus('KASIR POS')}
                                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                                mockupStatus === 'KASIR POS'
                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                                    : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                                            }`}
                                        >
                                            Kasir POS
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Bottom Pill */}
                            <div className="mt-4 bg-white border border-slate-200 shadow-sm px-4 py-2.5 rounded-xl flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800">Distribusi WhatsApp:</span>
                                <span className="font-extrabold text-violet-700">1-Klik PDF Terkirim ke Klien</span>
                            </div>
                        </FadeSection>
                    </div>

                </div>
            </section>

            {/* EDITORIAL BENTO GRID (Fitur Unggulan Tanpa Icon / Emoji) */}
            <section id="bento" className="py-24 px-6 max-w-7xl mx-auto">
                <FadeSection className="text-center max-w-2xl mx-auto mb-16">
                    <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-extrabold uppercase tracking-wider">
                        ARSITEKTUR FITUR
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
                        Satu Ekosistem Menyeluruh untuk Skalabilitas Bisnis
                    </h2>
                    <p className="text-slate-600 text-base mt-3 leading-relaxed">
                        Dirancang khusus untuk kebutuhan pengusaha Indonesia: kasir POS tangguh, kalkulasi HPP otomatis, kontrol multi-outlet, dan sinkronisasi laporan keuangan.
                    </p>
                </FadeSection>

                {/* Asymmetric 12-Column Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Bento 1: Kasir POS Offline Hybrid (7 Columns) */}
                    <FadeSection className="md:col-span-7 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wider bg-violet-50 px-2.5 py-1 rounded-md">
                                    MODUL KASIR
                                </span>
                                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                    PWA OFFLINE 100%
                                </span>
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                                Kasir POS Offline yang Tetap Berjalan Tanpa Sinyal Internet
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed max-w-lg mb-6">
                                Ketika sambungan WiFi terputus atau pemadaman listrik terjadi, kasir toko Anda tidak akan terhenti. Transaksi disimpan dalam antrean lokal dan langsung tersinkronisasi saat perangkat terhubung kembali.
                            </p>
                        </div>

                        {/* Mini Cashier UI Mockup */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                                <span>ANTREAN TRANSAKSI KASIR</span>
                                <span className="text-violet-700">Scanner Kamera Aktif</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                                    <span className="font-bold text-slate-800">1x Kopi Espresso Gayo</span>
                                    <span className="font-extrabold text-slate-900">Rp 22.000</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                                    <span className="font-bold text-slate-800">1x Roti Bakar Cokelat Keju</span>
                                    <span className="font-extrabold text-slate-900">Rp 28.000</span>
                                </div>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700">Total Belanja: <strong className="text-slate-900">Rp 50.000</strong></span>
                                <span className="px-3 py-1 bg-violet-600 text-white font-extrabold rounded-md text-[11px]">Cetak Struk Thermal</span>
                            </div>
                        </div>
                    </FadeSection>

                    {/* Bento 2: Smart HPP & Laba Rugi (5 Columns) */}
                    <FadeSection className="md:col-span-5 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between">
                        <div>
                            <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md inline-block mb-4">
                                KEUANGAN & LABA
                            </span>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                                Kalkulator HPP & Margin Bersih Otomatis
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                Ketahui Harga Pokok Penjualan secara akurat per resep atau batch produk. Lindungi keuntungan bersih dari pembengkakan operasional tanpa rumus Excel manual.
                            </p>
                        </div>

                        {/* Visual Margin Bar */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                            <div className="flex justify-between font-bold">
                                <span className="text-slate-600">Margin Keuntungan Bersih:</span>
                                <span className="text-violet-700 font-black">45% (Stabil)</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                                <div className="bg-violet-600 h-full" style={{ width: '45%' }} />
                                <div className="bg-amber-400 h-full" style={{ width: '35%' }} />
                                <div className="bg-slate-300 h-full" style={{ width: '20%' }} />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                                <span>HPP: 55%</span>
                                <span>Laba Bersih: 45%</span>
                            </div>
                        </div>
                    </FadeSection>

                    {/* Bento 3: WhatsApp Dispatch (4 Columns) */}
                    <FadeSection className="md:col-span-4 bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between">
                        <div>
                            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md inline-block mb-3">
                                DISTRIBUSI CEPAT
                            </span>
                            <h4 className="text-xl font-extrabold text-slate-900 mb-2">Pengiriman Faktur WhatsApp</h4>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Klien menerima invoice PDF dan bukti pembayaran langsung di aplikasi WhatsApp tanpa perlu menyimpan kontak secara manual.
                            </p>
                        </div>
                        <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                            Format PDF resmi dengan tautan unduh instan dan nomor referensi unik.
                        </div>
                    </FadeSection>

                    {/* Bento 4: Multi-Outlet & Shift Karyawan (4 Columns) */}
                    <FadeSection className="md:col-span-4 bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between">
                        <div>
                            <span className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wider bg-violet-50 px-2.5 py-1 rounded-md inline-block mb-3">
                                MULTI CABANG
                            </span>
                            <h4 className="text-xl font-extrabold text-slate-900 mb-2">Multi-Outlet & Shift Kasir</h4>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Kelola banyak cabang usaha dalam satu akun terpusat, atur hak akses staf kasir, dan rekap selisih uang kas di setiap pergantian shift.
                            </p>
                        </div>
                        <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold flex items-center justify-between">
                            <span>Status Cabang 01:</span>
                            <span className="text-violet-700">Terbuka & Beroperasi</span>
                        </div>
                    </FadeSection>

                    {/* Bento 5: Notifikasi Telegram Harian (4 Columns) */}
                    <FadeSection className="md:col-span-4 bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between">
                        <div>
                            <span className="text-[11px] font-extrabold text-sky-700 uppercase tracking-wider bg-sky-50 px-2.5 py-1 rounded-md inline-block mb-3">
                                OTOMASI NOTIFIKASI
                            </span>
                            <h4 className="text-xl font-extrabold text-slate-900 mb-2">Bot Telegram Pendamping</h4>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Rekap omzet harian, transaksi kasir, dan peringatan sisa stok produk dikirimkan otomatis ke Telegram pemilik usaha setiap penutupan toko.
                            </p>
                        </div>
                        <div className="mt-5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold flex items-center justify-between">
                            <span>Rekap Harian:</span>
                            <span className="text-emerald-700">Terkirim Otomatis</span>
                        </div>
                    </FadeSection>

                </div>
            </section>

            {/* COMPLETE FEATURE MATRIX & FILTERABLE CATALOG */}
            <section id="features" className="py-24 px-6 bg-slate-100/60 border-t border-slate-200/80">
                <div className="max-w-7xl mx-auto">
                    <FadeSection className="text-center mb-12">
                        <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">KATALOG LENGKAP</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-4">
                            Daftar Kemampuan & Modul MyInvoice
                        </h2>
                        <p className="text-slate-600 text-base max-w-xl mx-auto mb-8">
                            Pilih dan saring modul berdasarkan paket langganan yang paling tepat untuk skala bisnis Anda saat ini.
                        </p>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 justify-center flex-wrap">
                            {['ALL', 'FREE', 'PRO', 'ULTIMATE'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFeatureTab(tab)}
                                    className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                                        activeFeatureTab === tab
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {tab === 'ALL' ? 'Semua Modul' : `Paket ${tab}`}
                                </button>
                            ))}
                        </div>
                    </FadeSection>

                    {/* Filtered Grid (Clean Card Typography without arbitrary icons) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {allFeatureList
                            .filter(f => activeFeatureTab === 'ALL' || f.plan === activeFeatureTab)
                            .map((feat) => (
                                <FadeSection key={feat.id}>
                                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                                                    {feat.category}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                    feat.plan === 'FREE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    feat.plan === 'PRO' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                    'bg-purple-50 text-purple-700 border border-purple-200'
                                                }`}>
                                                    {feat.plan}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-extrabold text-slate-900 mb-1.5">{feat.t}</h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">{feat.d}</p>
                                        </div>
                                        {feat.limit && (
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-slate-500">Kapasitas:</span>
                                                <span className="text-violet-700">{feat.limit}</span>
                                            </div>
                                        )}
                                    </div>
                                </FadeSection>
                            ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS (Minimal Sequential 01, 02, 03, 04) */}
            <section className="py-24 px-6 bg-white border-t border-slate-200/80">
                <div className="max-w-7xl mx-auto">
                    <FadeSection className="text-center mb-16">
                        <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">ALUR PENERAPAN</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
                            Mulai Beroperasi dalam 4 Langkah Singkat
                        </h2>
                    </FadeSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { num: '01', title: 'Registrasi & Profil Usaha', desc: 'Daftarkan nama bisnis, nomor kontak, serta logo perusahaan untuk kop faktur resmi.' },
                            { num: '02', title: 'Input Produk & Katalog', desc: 'Masukkan daftar barang, kategori, harga jual, dan stok awal dengan mudah.' },
                            { num: '03', title: 'Mulai Transaksi Kasir', desc: 'Layani penjualan pelanggan secara online maupun offline dengan antarmuka cepat.' },
                            { num: '04', title: 'Pantau Laporan Otomatis', desc: 'Lihat omzet harian, laba rugi, dan sisa stok barang secara realtime di dashboard.' }
                        ].map((item, idx) => (
                            <FadeSection key={idx} className="border-t-2 border-violet-600 pt-6">
                                <div className="text-3xl font-black text-violet-700 mb-3 tracking-tighter">
                                    {item.num}
                                </div>
                                <h3 className="text-lg font-extrabold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section id="pricing" className="py-24 px-6 bg-slate-50 border-t border-slate-200/80">
                <div className="max-w-7xl mx-auto">
                    <FadeSection className="text-center mb-16">
                        <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">SKEMA HARGA</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-4">
                            Investasi Terjangkau untuk Pertumbuhan Nyata
                        </h2>
                        <p className="text-slate-600 text-base max-w-xl mx-auto mb-8">
                            Tanpa biaya setup tersembunyi. Akses penuh untuk menaikkan efisiensi operasional usaha Anda.
                        </p>

                        {/* Billing Switcher */}
                        <div className="inline-flex items-center bg-slate-200/80 p-1.5 rounded-full border border-slate-300">
                            <button
                                type="button"
                                onClick={() => setBilling('monthly')}
                                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    billing === 'monthly'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Pembayaran Bulanan
                            </button>
                            <button
                                type="button"
                                onClick={() => setBilling('yearly')}
                                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                    billing === 'yearly'
                                        ? 'bg-violet-600 text-white shadow-sm'
                                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>Pembayaran Tahunan</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                    billing === 'yearly' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'
                                }`}>
                                    Hemat 20%
                                </span>
                            </button>
                        </div>
                    </FadeSection>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                        
                        {/* FREE PLAN */}
                        <FadeSection className="h-full">
                            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between h-full">
                                <div>
                                    <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">PAKET PERCOBAAN</div>
                                    <div className="text-3xl font-black text-slate-900 mb-1">Rp 0</div>
                                    <p className="text-xs text-slate-600 mb-6">Cocok untuk UMKM pemula yang ingin digitalisasi pencatatan.</p>

                                    <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                                        {freeFeatures.map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-slate-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                <span>{t(feat.key)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleNavAction('register')}
                                    className="mt-8 w-full py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black cursor-pointer transition-all"
                                >
                                    Daftar Gratis Sekarang
                                </button>
                            </div>
                        </FadeSection>

                        {/* PRO PLAN (Elevated Centerpiece) */}
                        <FadeSection className="h-full">
                            <div className="p-8 rounded-2xl bg-white border-2 border-violet-600 shadow-xl relative flex flex-col justify-between h-full">
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                                    PILIHAN TERPOPULER
                                </div>

                                <div>
                                    <div className="text-xs font-extrabold text-violet-700 uppercase tracking-wider mb-2">PAKET PRO</div>
                                    <div className="text-3xl font-black text-slate-900 mb-1">
                                        {billing === 'yearly' ? 'Rp 103.000' : 'Rp 129.000'}
                                        <span className="text-xs font-semibold text-slate-500"> / bulan</span>
                                    </div>
                                    {billing === 'yearly' && (
                                        <div className="text-[11px] font-bold text-violet-700 mb-2">Ditagihkan Rp 1.236.000 per tahun</div>
                                    )}
                                    <p className="text-xs text-slate-600 mb-6">Untuk usaha berkembang yang membutuhkan operasional kasir harian lancar.</p>

                                    <div className="space-y-3 pt-4 border-t border-slate-100 text-xs font-semibold">
                                        {proFeatures.map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-slate-900">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                                                <span>{t(feat.key)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const url = billing === 'yearly'
                                            ? 'https://my-invoice.myr.id/pl/myinvoice-pro-annual-plan-12-bulan'
                                            : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan';
                                        window.location.href = url;
                                    }}
                                    className="mt-8 w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-md shadow-violet-600/30 cursor-pointer transition-all"
                                >
                                    Pilih Paket Pro
                                </button>
                            </div>
                        </FadeSection>

                        {/* ULTIMATE PLAN */}
                        <FadeSection className="h-full">
                            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between h-full">
                                <div>
                                    <div className="text-xs font-extrabold text-amber-700 uppercase tracking-wider mb-2">PAKET ULTIMATE</div>
                                    <div className="text-3xl font-black text-slate-900 mb-1">
                                        {billing === 'yearly' ? 'Rp 119.000' : 'Rp 149.000'}
                                        <span className="text-xs font-semibold text-slate-500"> / bulan</span>
                                    </div>
                                    {billing === 'yearly' && (
                                        <div className="text-[11px] font-bold text-amber-700 mb-2">Ditagihkan Rp 1.428.000 per tahun</div>
                                    )}
                                    <p className="text-xs text-slate-600 mb-6">Solusi lengkap tanpa batas untuk bisnis multi-cabang & manajemen penuh.</p>

                                    <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                                        {ultimateFeatures.map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-slate-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                <span>{t(feat.key)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const url = billing === 'yearly'
                                            ? 'https://my-invoice.myr.id/pl/myinvoice-ultimate-annual-plan-12-bulan'
                                            : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan-7spr';
                                        window.location.href = url;
                                    }}
                                    className="mt-8 w-full py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black cursor-pointer transition-all"
                                >
                                    Pilih Paket Ultimate
                                </button>
                            </div>
                        </FadeSection>

                    </div>
                </div>
            </section>

            {/* FAQ SECTION (Clean Minimalist Accordion) */}
            <section id="faq" className="py-24 px-6 bg-white border-t border-slate-200/80">
                <div className="max-w-3xl mx-auto">
                    <FadeSection className="text-center mb-16">
                        <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">PERTANYAAN UMUM</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
                            Pusat Jawaban & Panduan
                        </h2>
                    </FadeSection>

                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <FadeSection key={num}>
                                <div className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(openFaq === num ? null : num)}
                                        className="w-full px-6 py-4 text-left bg-white hover:bg-slate-50 flex justify-between items-center cursor-pointer transition-colors"
                                    >
                                        <span className={`text-sm font-bold ${openFaq === num ? 'text-violet-700' : 'text-slate-900'}`}>
                                            {t(`landing_faq_q${num}`)}
                                        </span>
                                        <ChevronDown
                                            size={16}
                                            className={`text-slate-400 transition-transform duration-200 ${openFaq === num ? 'rotate-180 text-violet-600' : ''}`}
                                        />
                                    </button>
                                    {openFaq === num && (
                                        <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                                            {t(`landing_faq_a${num}`)}
                                        </div>
                                    )}
                                </div>
                            </FadeSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONTACT SECTION */}
            <section id="contact" className="py-24 px-6 bg-slate-50 border-t border-slate-200/80">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <FadeSection>
                        <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">HUBUNGI KAMI</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 mb-4">
                            Ada Pertanyaan Khusus Terkait Kebutuhan Bisnis Anda?
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed mb-6">
                            Tim MyInvoice siap memberikan panduan teknis maupun demo langsung untuk mendiskusikan implementasi kasir dan pencatatan keuangan bisnis Anda.
                        </p>
                        <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                            <div className="font-extrabold text-slate-900">Email Resmi Bisnis:</div>
                            <a href="mailto:hello.myinvoice@gmail.com" className="text-violet-700 font-bold hover:underline">
                                hello.myinvoice@gmail.com
                            </a>
                        </div>
                    </FadeSection>

                    <FadeSection>
                        <form onSubmit={handleContact} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    placeholder="Nama Anda"
                                    value={contactForm.name}
                                    onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none focus:border-violet-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Email Aktif</label>
                                <input
                                    type="email"
                                    placeholder="alamat@email.com"
                                    value={contactForm.email}
                                    onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none focus:border-violet-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Pesan / Kebutuhan</label>
                                <textarea
                                    rows="4"
                                    placeholder="Tuliskan pertanyaan atau kebutuhan bisnis Anda di sini..."
                                    value={contactForm.message}
                                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none focus:border-violet-600 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSendingContact}
                                className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold cursor-pointer transition-all disabled:opacity-50"
                            >
                                Kirim Pesan Sekarang
                            </button>
                        </form>
                    </FadeSection>
                </div>
            </section>

            {/* iOS PWA Install Modal (Minimalist Corporate) */}
            {showIosInstallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-left border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-extrabold text-violet-700 uppercase tracking-wider">PANDUAN IOS</span>
                            <button
                                onClick={() => setShowIosInstallModal(false)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mb-2">
                            Pasang Aplikasi di iPhone / iPad
                        </h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Buka browser Safari, ketuk tombol Share di bagian toolbar bawah, lalu pilih menu "Add to Home Screen".
                        </p>
                        <div className="space-y-2 text-xs text-slate-700 mb-6 font-semibold">
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                Langkah 1: Ketuk ikon Share di toolbar browser
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                Langkah 2: Pilih "Add to Home Screen"
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                Langkah 3: Ketuk "Add" di sudut kanan atas
                            </div>
                        </div>
                        <button
                            onClick={() => setShowIosInstallModal(false)}
                            className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-extrabold cursor-pointer"
                        >
                            Tutup Panduan
                        </button>
                    </div>
                </div>
            )}

            {/* FINAL CTA BANNER */}
            <section className="py-20 px-6 bg-gradient-to-r from-violet-800 via-purple-700 to-indigo-800 text-center text-white">
                <div className="max-w-3xl mx-auto space-y-5">
                    <FadeSection>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                            Tingkatkan Standar Operasional Bisnis Anda Hari Ini
                        </h2>
                        <p className="text-sm text-violet-100 max-w-xl mx-auto leading-relaxed">
                            Ribuan dokumen faktur dan transaksi kasir offline telah diproses setiap hari dengan aman dan efisien di MyInvoice.
                        </p>
                        <div className="pt-2">
                            <button
                                onClick={() => handleNavAction('register')}
                                className="px-8 py-3.5 rounded-xl bg-white text-violet-800 font-black text-sm shadow-xl hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                Daftar Akun Gratis Sekarang
                            </button>
                        </div>
                    </FadeSection>
                </div>
            </section>

            <LandingFooter />
        </div>
    );
}
