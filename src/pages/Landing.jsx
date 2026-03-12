import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FileText, Receipt, Calculator, BookOpen, BarChart2, Package, Store,
    Globe, Monitor, CheckCircle, ChevronDown, ChevronUp, Menu, X,
    Zap, Shield, Smartphone, ArrowRight, Star, AlertCircle,
    Users, Tag, Scan, MessageCircle, RefreshCw
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// ─── Translations ─────────────────────────────────────────────────────────────
const copy = {
    ID: {
        nav_features: 'Fitur', nav_pricing: 'Harga', nav_faq: 'FAQ',
        nav_login: 'Masuk', nav_cta: 'Mulai Gratis',
        hero_title: 'Aplikasi POS Kasir & Invoicing Pintar untuk Bisnis Anda',
        hero_sub: 'Kelola penjualan toko dengan Kasir pintar, buat invoice profesional, dan pantau keuangan dalam satu platform lengkap.',
        hero_cta1: 'Mulai Gratis', hero_cta2: 'Lihat Fitur',
        features_title: 'Fitur Lengkap untuk Segala Jenis Usaha',
        features_sub: 'Dari toko retail, cafe, hingga freelancer. My Invoice menyediakan solusi lengkap yang mudah digunakan.',
        how_title: 'Cara Kerja My Invoice',
        how_sub: 'Mulai buat dokumen profesional dalam 3 langkah mudah.',
        pricing_title: 'Harga Transparan, Tanpa Biaya Tersembunyi',
        pricing_sub: 'Pilih plan yang sesuai dengan kebutuhan bisnis kamu.',
        free_label: 'GRATIS', free_price: 'Rp 0', free_period: '/bulan',
        free_desc: 'Cocok untuk memulai bisnis kecil',
        pro_label: 'PRO', pro_price: 'Rp 129.000', pro_period: '/bulan',
        pro_desc: 'Untuk bisnis yang berkembang pesat',
        btn_free: 'Mulai Sekarang', btn_pro: 'Upgrade PRO',
        popular: 'Paling Populer',
        free_features: [
            '14 Hari PRO Trial',
            '50 Transaksi POS / bulan',
            '10 Invoice / bulan',
            '10 Kwitansi / bulan',
            '5 Tanda Terima / bulan',
            '5 Penawaran Harga / bulan',
            '5 Purchase Order / bulan',
            '10 Hutang & Piutang / bulan',
            '5 Klien',
            '20 Catatan Bisnis / bulan',
            'Terdapat Watermark MyInvoice'
        ],
        pro_features: [
            'Unlimited Transaksi Kasir & Dokumen',
            'Barcode Scanner (Scan Produk Otomatis)',
            'Unlimited Data Klien & Produk',
            'Manajemen Karyawan & Shift (PIN Login)',
            'Kirim Struk & Invoice via WhatsApp',
            'Sales Report & Laporan Performa Karyawan',
            'Tanpa Watermark (100% Profesional)',
            'Pencatatan Hutang & Piutang',
            'Prioritas Support',
        ],
        pro_badge: 'BEST SELLER',
        testi_title: 'Dipercaya UMKM Indonesia',
        testi_sub: 'Ribuan pelaku UMKM dan freelancer telah menggunakan My Invoice.',
        faq_title: 'Pertanyaan yang Sering Ditanyakan',
        faq_sub: 'Ada pertanyaan lain? Hubungi kami melalui email.',
        footer_copy: '© 2026 MyInvoice.space. Dibuat untuk UMKM Indonesia',
        footer_tagline: 'Platform dokumen bisnis terlengkap untuk UMKM dan freelancer Indonesia.',
        step1_t: 'Buka Browser', step1_d: 'Tidak perlu install apapun. Langsung buka myinvoice.space',
        step2_t: 'Isi Data Bisnis', step2_d: 'Input informasi perusahaan dan klien sekali saja',
        step3_t: 'Buat Dokumen', step3_d: 'Generate dokumen profesional dan download PDF instantly',
        ultimate_badge: 'PALING LENGKAP', ultimate_sub: 'Kontrol penuh bisnis Anda, tanpa batas.',
        ultimate_btn: 'Mulai ULTIMATE',
        ultimate_features: [
            'Semua kelengkapan fitur PRO',
            'Program Loyalitas & Member Pelanggan',
            'Diskon & Voucher Promo',
            'Kalkulator HPP Lanjutan (5 komponen biaya)',
            'Struk White Label (Logo & Nama Toko Custom)',
            'Multi Outlet / Cabang',
            'Laporan Stok & COGS Advanced',
            'Support VIP — Respons Prioritas'
        ],
    },
    EN: {
        nav_features: 'Features', nav_pricing: 'Pricing', nav_faq: 'FAQ',
        nav_login: 'Login', nav_cta: 'Start Free',
        hero_title: 'Smart POS & Invoicing App for Your Business',
        hero_sub: 'Manage store sales with smart POS, create professional invoices, and track finances in one complete platform.',
        hero_cta1: 'Start Free', hero_cta2: 'See Features',
        features_title: 'Complete Features for Any Business',
        features_sub: 'From retail stores and cafes to freelancers. My Invoice provides complete and easy-to-use solutions.',
        how_title: 'How My Invoice Works',
        how_sub: 'Start creating professional documents in 3 easy steps.',
        pricing_title: 'Transparent Pricing, No Hidden Fees',
        pricing_sub: 'Choose the plan that fits your business needs.',
        free_label: 'FREE', free_price: 'Rp 0', free_period: '/month',
        free_desc: 'Perfect for starting a small business',
        pro_label: 'PRO', pro_price: 'Rp 129,000', pro_period: '/month',
        pro_desc: 'For fast-growing businesses',
        btn_free: 'Get Started', btn_pro: 'Upgrade to PRO',
        popular: 'Most Popular',
        free_features: [
            '14-Day PRO Trial',
            '50 POS Transactions / month',
            '10 Invoices / month',
            '10 Receipts / month',
            '5 Delivery Notes / month',
            '5 Price Quotes / month',
            '5 Purchase Orders / month',
            '10 Debt Tracker / month',
            '5 Clients',
            '20 Business Notes / month',
            'MyInvoice Watermark included'
        ],
        pro_features: [
            'Unlimited POS Transactions & Documents',
            'Barcode Scanner (Auto Product Scan)',
            'Unlimited Clients & Products',
            'Employee & Shift Management (PIN Login)',
            'Send Receipt & Invoice via WhatsApp',
            'Sales Report & Employee Performance Report',
            'No Watermark (100% Professional)',
            'Debt & Receivable Tracker',
            'Priority Support',
        ],
        pro_badge: 'BEST SELLER',
        testi_title: 'Trusted by Indonesian SMEs',
        testi_sub: 'Thousands of SMEs and freelancers already use My Invoice.',
        faq_title: 'Frequently Asked Questions',
        faq_sub: 'Have more questions? Contact us via email.',
        footer_copy: '© 2026 MyInvoice.space. Made for Indonesian SMEs',
        footer_tagline: 'The most complete business document platform for Indonesian SMEs and freelancers.',
        step1_t: 'Open Browser', step1_d: 'No installation needed. Just open myinvoice.space',
        step2_t: 'Enter Business Data', step2_d: 'Input company and client information just once',
        step3_t: 'Create Documents', step3_d: 'Generate professional documents and download PDF instantly',
        ultimate_badge: 'MOST POWERFUL', ultimate_sub: 'Total business control, zero limits.',
        ultimate_btn: 'Start ULTIMATE',
        ultimate_features: [
            'All PRO features included',
            'Customer Loyalty & Member Program',
            'Discounts & Promo Vouchers',
            'Advanced Cost Calculator (5 cost components)',
            'White Label Receipt (Custom Logo & Store Name)',
            'Multi Outlet / Branch Support',
            'Advanced Stock & COGS Reports',
            'VIP Support — Priority Response'
        ],
    }
};

const features = [
  { icon: Store,      color: '#7C3AED', bg: '#EDE9FE', key_t: 'feat1_t', key_d: 'feat1_d' },
  { icon: FileText,   color: '#10B981', bg: '#ECFDF5', key_t: 'feat2_t', key_d: 'feat2_d' },
  { icon: Receipt,    color: '#F59E0B', bg: '#FEF3C7', key_t: 'feat3_t', key_d: 'feat3_d' },
  { icon: Calculator, color: '#EF4444', bg: '#FEF2F2', key_t: 'feat4_t', key_d: 'feat4_d' },
  { icon: BarChart2,  color: '#3B82F6', bg: '#DBEAFE', key_t: 'feat5_t', key_d: 'feat5_d' },
  { icon: Users,      color: '#8B5CF6', bg: '#F5F3FF', key_t: 'feat6_t', key_d: 'feat6_d' },
  { icon: Tag,        color: '#EC4899', bg: '#FCE7F3', key_t: 'feat7_t', key_d: 'feat7_d' },
  { icon: Scan,       color: '#14B8A6', bg: '#F0FDFA', key_t: 'feat8_t', key_d: 'feat8_d' },
  { icon: BookOpen,   color: '#06B6D4', bg: '#ECFEFF', key_t: 'feat9_t', key_d: 'feat9_d' },
];

const featureCopy = {
  ID: {
    feat1_t: 'Kasir POS Lengkap',
    feat1_d: 'Kelola penjualan toko, stok produk, shift karyawan, dan laporan transaksi harian dalam satu sistem POS yang canggih.',
    feat2_t: 'Invoice Profesional',
    feat2_d: 'Buat invoice dengan penomoran otomatis, kalkulasi pajak, diskon, dan kirim langsung ke klien via WhatsApp.',
    feat3_t: 'Kwitansi & Dokumen',
    feat3_d: 'Generate kwitansi, tanda terima, penawaran harga, dan purchase order dengan terbilang Bahasa Indonesia otomatis.',
    feat4_t: 'Hitung HPP Advanced',
    feat4_d: 'Kalkulasi harga pokok produksi dengan simulasi 5 komponen biaya lengkap dan rekomendasi harga jual optimal.',
    feat5_t: 'Laporan Keuangan',
    feat5_d: 'Laporan penjualan harian, omzet bulanan, top produk, jam ramai, dan performa karyawan dengan grafik visual.',
    feat6_t: 'Manajemen Karyawan',
    feat6_d: 'Kelola shift karyawan dengan PIN login kasir, pantau performa penjualan per karyawan, dan export laporan CSV.',
    feat7_t: 'Diskon & Loyalty',
    feat7_d: 'Buat kode voucher promo, program poin pelanggan, dan kelola member loyal untuk meningkatkan repeat order.',
    feat8_t: 'Barcode Scanner',
    feat8_d: 'Scan barcode produk langsung dari kamera HP saat transaksi kasir. Produk otomatis masuk keranjang belanja.',
    feat9_t: 'Catatan Bisnis',
    feat9_d: 'Catat pemasukan dan pengeluaran harian dengan mudah, lengkap dengan kategori dan laporan bulanan.',
  },
  EN: {
    feat1_t: 'Full POS System',
    feat1_d: 'Manage store sales, product stock, employee shifts, and daily transaction reports in one powerful POS system.',
    feat2_t: 'Professional Invoice',
    feat2_d: 'Create invoices with auto numbering, tax & discount calculation, and send directly to clients via WhatsApp.',
    feat3_t: 'Receipts & Documents',
    feat3_d: 'Generate receipts, delivery notes, price quotes, and purchase orders with automatic number-to-words conversion.',
    feat4_t: 'Advanced Cost Calculator',
    feat4_d: 'Calculate production costs with full 5-component expense simulation and optimal selling price recommendations.',
    feat5_t: 'Financial Reports',
    feat5_d: 'Daily sales reports, monthly revenue, top products, peak hours, and employee performance with visual charts.',
    feat6_t: 'Employee Management',
    feat6_d: 'Manage employee shifts with PIN cashier login, monitor sales performance per employee, and export CSV reports.',
    feat7_t: 'Discounts & Loyalty',
    feat7_d: 'Create promo voucher codes, customer loyalty points program, and manage loyal members to boost repeat orders.',
    feat8_t: 'Barcode Scanner',
    feat8_d: 'Scan product barcodes directly from your phone camera during cashier transactions. Products auto-added to cart.',
    feat9_t: 'Business Notes',
    feat9_d: 'Record daily income and expenses easily, complete with categories and monthly financial reports.',
  }
};

const testimonials = [
    // 🇮🇩 UMKM Indonesia (10)
    { id: 1, name: "Budi Santoso", role: "Owner Warung Barokah", image: "https://randomuser.me/api/portraits/men/1.jpg", rating: 5, content: { id: "My Invoice mempermudah pencatatan transaksi harian saya. Gak perlu lagi pakai buku manual yang sering hilang.", en: "My Invoice simplifies my daily transaction recording. No more manual books that often get lost." } },
    { id: 2, name: "Siti Aminah", role: "Owner Katering Rumahan", image: "https://randomuser.me/api/portraits/women/1.jpg", rating: 5, content: { id: "Kirim invoice ke pelanggan jadi lebih profesional lewat WhatsApp. Pelanggan pun jadi lebih cepat bayar.", en: "Sending invoices to customers is more professional via WhatsApp. Customers also pay faster." } },
    { id: 3, name: "Ahmad Fauzi", role: "Pemilik Bengkel Jaya", image: "https://randomuser.me/api/portraits/men/2.jpg", rating: 5, content: { id: "Sangat membantu manajemen stok suku cadang. Laporan penjualannya pun sangat detail dan akurat.", en: "Very helpful for spare parts stock management. The sales reports are also very detailed and accurate." } },
    { id: 4, name: "Dewi Lestari", role: "Owner Butik Kirana", image: "https://randomuser.me/api/portraits/women/2.jpg", rating: 5, content: { id: "Desain invoice-nya sangat cantik dan bersih. Sangat cocok dengan citra butik fashion saya.", en: "The invoice design is very beautiful and clean. It fits perfectly with my fashion boutique's image." } },
    { id: 5, name: "Joko Susilo", role: "Toko Kelontong Madura", image: "https://randomuser.me/api/portraits/men/3.jpg", rating: 5, content: { id: "Aplikasi kasir yang ringan dan mudah digunakan oleh siapa saja, bahkan untuk saya yang masih awam.", en: "A lightweight cashier app that is easy for anyone to use, even for someone like me who is still a layman." } },
    { id: 6, name: "Anisa Putri", role: "Admin Olshop Skincare", image: "https://randomuser.me/api/portraits/women/65.jpg", rating: 5, content: { id: "Fitur hitung HPP-nya juara! Sekarang saya tahu persis berapa margin keuntungan setiap produk.", en: "The COGS feature is a winner! Now I know exactly the profit margin for each product." } },
    { id: 7, name: "Hendra Wijaya", role: "Supervisor Kedai Kopi", image: "https://randomuser.me/api/portraits/men/46.jpg", rating: 5, content: { id: "Proses pembuatan dokumen cuma hitungan detik. Benar-benar menghemat waktu operasional kami.", en: "Creating documents takes only seconds. It truly saves our operational time." } },
    { id: 8, name: "Maya Indah", role: "Penjahit Rapi", image: "https://randomuser.me/api/portraits/women/4.jpg", rating: 5, content: { id: "Pelanggan senang karena dapat kwitansi resmi yang dikirim langsung ke HP mereka via WA.", en: "Customers are happy because they receive official receipts sent directly to their phones via WA." } },
    { id: 9, name: "Rizky Pratama", role: "Freelance Designer", image: "https://randomuser.me/api/portraits/men/5.jpg", rating: 5, content: { id: "Sangat fleksibel dan praktis. Saya bisa mengelola invoice proyek di mana saja dari browser.", en: "Very flexible and practical. I can manage project invoices anywhere from the browser." } },
    { id: 10, name: "Lilis Suryani", role: "Toko Kue Tradisional", image: "https://randomuser.me/api/portraits/women/5.jpg", rating: 5, content: { id: "Bisnis saya terlihat lebih profesional sejak pakai My Invoice. Kepercayaan pelanggan meningkat drastis.", en: "My business looks more professional since using My Invoice. Customer trust has increased significantly." } },

    // 🌎 Global Startups (5)
    { id: 11, name: "Sarah Johnson", role: "CEO of TechFlow", image: "https://randomuser.me/api/portraits/women/11.jpg", rating: 5, content: { id: "Aplikasi yang sangat intuitif dengan fitur yang sangat lengkap untuk skala UMKM global.", en: "An extremely intuitive app with very complete features for global SME scale." } },
    { id: 12, name: "Michael Scott", role: "Founder of SaaSly", image: "https://randomuser.me/api/portraits/men/11.jpg", rating: 5, content: { id: "Sangat membantu integrasi data keuangan kami. Desain UI-nya sangat premium dan modern.", en: "Greatly helps our financial data integration. The UI design is very premium and modern." } },
    { id: 13, name: "Mark Thompson", role: "Creative Director", image: "https://randomuser.me/api/portraits/men/20.jpg", rating: 5, content: { id: "Alat yang sempurna untuk manajemen dokumen bisnis secara digital tanpa ribet.", en: "The perfect tool for digital business document management without the hassle." } },
    { id: 14, name: "Chloe Zhang", role: "Marketing Head", image: "https://randomuser.me/api/portraits/women/20.jpg", rating: 5, content: { id: "Meningkatkan efisiensi kerja tim kami secara signifikan dalam mengelola piutang klien.", en: "Significantly improves our team's work efficiency in managing client receivables." } },
    { id: 15, name: "James Anderson", role: "CTO of CloudScale", image: "https://randomuser.me/api/portraits/men/21.jpg", rating: 5, content: { id: "Infrastruktur yang stabil dan performa aplikasi yang sangat cepat. Sangat direkomendasikan.", en: "Stable infrastructure and very fast application performance. Highly recommended." } },
];

const faqData = [
    {
        qID: 'Apakah My Invoice benar-benar gratis?',
        qEN: 'Is My Invoice really free?',
        aID: 'Ya! My Invoice menyediakan paket Gratis selamanya tanpa memerlukan kartu kredit. Paket gratis ini sangat cocok untuk memulai bisnis kecil dengan kuota bulanan dasar untuk invoice dan kwitansi. Untuk kebutuhan pembuatan dokumen tanpa batas (unlimited) dan manajemen klien, paket PRO tersedia mulai dari Rp 129.000/bulan.',
        aEN: 'Yes! My Invoice provides a Free plan forever with no credit card required. The free plan is perfect for starting a small business with a basic monthly quota for invoices and receipts. For unlimited document creation and client management, the PRO plan is available starting at Rp 129,000/month.'
    },
    {
        qID: 'Apakah data saya aman?',
        qEN: 'Is my data safe?',
        aID: 'Tentu saja. Keamanan dan privasi data Anda adalah prioritas utama kami. Seluruh informasi bisnis dan klien Anda dienkripsi menggunakan standar keamanan tinggi (SSL/TLS) dan disimpan dengan aman menggunakan infrastruktur Supabase Cloud. Kami juga berkomitmen untuk tidak pernah menjual data Anda ke pihak ketiga mana pun.',
        aEN: 'Absolutely. The security and privacy of your data is our top priority. All your business and client information is encrypted using high security standards (SSL/TLS) and safely stored using Supabase Cloud infrastructure. We are also committed to never selling your data to any third parties.'
    },
    {
        qID: 'Apakah bisa dipakai di HP?',
        qEN: 'Can I use it on mobile?',
        aID: 'Sangat bisa! My Invoice dirancang secara khusus untuk bekerja optimal di berbagai perangkat, termasuk smartphone dan tablet kesayangan Anda. Anda tidak perlu mengunduh aplikasi tambahan, cukup buka situs web kami melalui browser HP, dan Anda sudah bisa mengelola seluruh dokumen bisnis kapan saja dan di mana saja.',
        aEN: 'Definitely! My Invoice is specially designed to work optimally across various devices, including your favorite smartphones and tablets. You do not need to download additional applications; simply open our website via your mobile browser, and you can manage all your business documents anytime and anywhere.'
    },
    {
        qID: 'Bagaimana cara upgrade ke PRO?',
        qEN: 'How to upgrade to PRO?',
        aID: 'Proses upgrade ke paket PRO sangatlah cepat dan mudah. Anda cukup masuk ke akun Anda, klik tombol "Upgrade" yang tersedia di navigasi atas, dan pilih paket berlangganan yang Anda inginkan. Pembayaran didukung oleh payment gateway Mayar yang menerima berbagai metode pembayaran lokal demi kenyamanan transaksi Anda.',
        aEN: 'Upgrading to the PRO plan is extremely fast and easy. You simply need to log into your account, click the "Upgrade" button available in the top navigation, and select your desired subscription package. Payments are securely processed through the Mayar payment gateway, which accepts various local payment methods for your transaction convenience.'
    },
    {
        qID: 'Apakah ada kontrak panjang?',
        qEN: 'Are there long-term contracts?',
        aID: 'Sama sekali tidak ada. Kami menggunakan sistem pembayaran fleksibel berbasis langganan bulanan tanpa ada ikatan kontrak jangka panjang. Anda memiliki kendali penuh atas akun Anda dan dapat membatalkan atau mengubah paket langganan Anda kapan saja tanpa dikenakan denda atau biaya tersembunyi.',
        aEN: 'Not at all. We use a flexible payment system based on a monthly subscription with no long-term contractual commitments. You have complete control over your account and can cancel or modify your subscription package at any time without incurring any penalties or hidden fees.'
    },
];

// ─── Stats Data ───────────────────────────────────────────────────────────────
const statsData = [
    { value: '5.000+', labelID: 'Pengguna Aktif', labelEN: 'Active Users' },
    { value: '500.000+', labelID: 'Transaksi Diproses', labelEN: 'Transactions Processed' },
    { value: '7 Jenis', labelID: 'Dokumen Bisnis', labelEN: 'Business Documents' },
    { value: '99.9%', labelID: 'Uptime Server', labelEN: 'Server Uptime' },
];

// ─── Fade-in hook ─────────────────────────────────────────────────────────────
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

// ─── Section wrapper with fade ────────────────────────────────────────────────
function FadeSection({ children, style }) {
    const [ref, visible] = useFadeIn();
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 600ms ease, transform 600ms ease',
            ...style,
        }}>
            {children}
        </div>
    );
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function Stars({ n }) {
    return (
        <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
            {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < n ? "#F59E0B" : "none"} color={i < n ? "#F59E0B" : "#CBD5E1"} />
            ))}
        </div>
    );
}

// ─── Landing component ────────────────────────────────────────────────────────
export default function Landing() {
    const navigate = useNavigate();
    const { lang, toggleLang, t } = useLang();
    const { dark } = useTheme();
    const { user, profile } = useAuth();
    const c = copy[lang];
    const fc = featureCopy[lang];
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    const enterAsGuest = () => {
        localStorage.setItem('guest_mode', 'true');
        navigate('/dashboard');
    };

    const handleNavAction = () => {
        if (user) navigate('/dashboard');
        else navigate('/login');
    };

    // Navbar scroll effect
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Smooth scroll to section
    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleTrialClick = () => {
        if (!user) {
            localStorage.setItem('activate_trial', 'true');
            navigate('/register');
        } else if (profile?.plan === 'free' && !profile?.trial_ends_at) {
            navigate('/upgrade');
        } else {
            navigate('/upgrade');
        }
    };

    const NAV = '#0F172A';
    const PURPLE = '#7C3AED';

    return (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: dark ? '#F1F5F9' : '#1E293B', overflowX: 'hidden', background: dark ? '#0F172A' : undefined }}>

            {/* ── NAVBAR ── */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                background: scrolled ? 'rgba(15,23,42,0.97)' : 'transparent',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
                transition: 'background 300ms, border-color 300ms, backdrop-filter 300ms',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <span style={{ fontSize: 20, fontWeight: 900, color: PURPLE, letterSpacing: '-0.5px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        My Invoice
                    </span>

                    {/* Desktop nav */}
                    <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="landing-desktop-nav">
                        {['features', 'pricing', 'faq'].map(id => (
                            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600, padding: 0, transition: 'color 200ms' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
                            >
                                {c[`nav_${id}`]}
                            </button>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="landing-desktop-nav">
                        {/* Language toggle */}
                        <button onClick={toggleLang} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                            color: 'white', fontSize: 12, fontWeight: 700, transition: 'background 200ms',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <Globe size={13} />
                            {lang === 'ID' ? 'EN' : 'ID'}
                        </button>
                        <button onClick={handleNavAction} style={{ background: 'none', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 600, transition: 'border-color 200ms' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                        >
                            {user ? 'Dashboard' : c.nav_login}
                        </button>
                        <button onClick={handleNavAction} style={{ background: PURPLE, border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 200ms' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            {user ? 'Dashboard' : c.nav_cta} <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="landing-mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(o => !o)}
                        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: 4 }}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile menu drawer */}
                {mobileMenuOpen && (
                    <div style={{ background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px 24px' }}>
                        {['features', 'pricing', 'faq'].map(id => (
                            <button key={id} onClick={() => scrollTo(id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 600, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {c[`nav_${id}`]}
                            </button>
                        ))}
                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <button onClick={toggleLang} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px', cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Globe size={14} /> {lang === 'ID' ? 'EN' : 'ID'}
                            </button>
                            <button onClick={() => navigate('/login')} style={{ flex: 2, background: PURPLE, border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {c.nav_cta} <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* ── HERO ── */}
            <section style={{ background: `linear-gradient(135deg, ${NAV} 0%, #1E1B4B 60%, #312E81 100%)`, minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                {/* Background grid decoration */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(124,58,237,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
                {/* Glow blobs */}
                <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    {/* Badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
                        <Zap size={13} color="#A78BFA" />
                        <span style={{ color: '#A78BFA', fontSize: 13, fontWeight: 700 }}>100% Free to Start</span>
                    </div>

                    {/* Headline */}
                    <h1 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 900, color: 'white', lineHeight: 1.15, margin: '0 0 24px', letterSpacing: '-1px', maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
                        {c.hero_title.split(' & ').map((part, i, arr) => (
                            <span key={i}>
                                {i > 0 && <span style={{ color: '#A78BFA' }}> & </span>}
                                {part}
                            </span>
                        ))}
                    </h1>

                    <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'rgba(255,255,255,0.65)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
                        {c.hero_sub}
                    </p>

                    {/* CTAs */}
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/login')}
                            style={{ background: PURPLE, color: 'white', border: 'none', borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(124,58,237,0.45)', transition: 'transform 200ms, box-shadow 200ms' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.6)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.45)'; }}
                        >
                            {c.hero_cta1} <ArrowRight size={18} />
                        </button>
                        <button onClick={() => scrollTo('features')}
                            style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'background 200ms' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        >
                            {c.hero_cta2}
                        </button>
                    </div>

                    {/* Guest mode shortcut */}
                    <p style={{ marginTop: 20, marginBottom: 0 }}>
                        <button
                            onClick={enterAsGuest}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 600, textDecoration: 'underline', padding: 0, transition: 'color 200ms' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                        >
                            {lang === 'ID' ? 'Lanjut sebagai Guest (tanpa login)' : 'Continue as Guest (no login)'}
                        </button>
                    </p>

                    {/* Trust indicators */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 56, flexWrap: 'wrap' }}>
                        {[
                            { icon: Shield, text: lang === 'ID' ? 'Data Aman' : 'Safe & Secure' },
                            { icon: Smartphone, text: lang === 'ID' ? 'Semua Device' : 'All Devices' },
                            { icon: Zap, text: lang === 'ID' ? 'Tanpa Install' : 'No Installation' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)' }}>
                                <Icon size={15} color="#A78BFA" />
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS SECTION ── */}
            <section style={{ background: dark ? '#0F172A' : 'white', padding: '64px 24px', borderBottom: `1px solid ${dark ? '#1E293B' : '#F1F5F9'}` }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
                            {statsData.map((stat, i) => (
                                <div key={i} style={{ padding: '24px 0' }}>
                                    <h3 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, color: '#7C3AED', margin: '0 0 8px', letterSpacing: '-1px' }}>{stat.value}</h3>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: dark ? '#CBD5E1' : '#64748B', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{lang === 'ID' ? stat.labelID : stat.labelEN}</p>
                                </div>
                            ))}
                        </div>
                    </FadeSection>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" style={{ background: dark ? '#0F172A' : 'white', padding: '96px 24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, margin: '0 0 16px', color: dark ? '#F1F5F9' : '#0F172A' }}>{c.features_title}</h2>
                        <p style={{ fontSize: 17, color: dark ? '#CBD5E1' : '#64748B', maxWidth: 520, margin: '0 auto' }}>{c.features_sub}</p>
                    </FadeSection>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                        {features.map((feat, i) => {
                            const Icon = feat.icon;
                            return (
                                <FadeSection key={i} style={{ transitionDelay: `${i * 80}ms` }}>
                                    <div style={{ background: dark ? '#1E293B' : '#F8FAFC', borderRadius: 16, padding: 28, border: `1.5px solid ${dark ? '#334155' : '#F1F5F9'}`, transition: 'transform 200ms, box-shadow 200ms', cursor: 'default' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <div style={{ width: 48, height: 48, borderRadius: 12, background: feat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <Icon size={22} color={feat.color} />
                                        </div>
                                        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: dark ? '#F1F5F9' : '#0F172A' }}>{fc[feat.key_t]}</h3>
                                        <p style={{ margin: 0, fontSize: 14, color: dark ? '#CBD5E1' : '#64748B', lineHeight: 1.6 }}>{fc[feat.key_d]}</p>
                                    </div>
                                </FadeSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ background: dark ? '#1E293B' : '#F8FAFC', padding: '96px 24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, margin: '0 0 16px', color: dark ? '#F1F5F9' : '#0F172A' }}>{c.how_title}</h2>
                        <p style={{ fontSize: 17, color: dark ? '#CBD5E1' : '#64748B', maxWidth: 480, margin: '0 auto' }}>{c.how_sub}</p>
                    </FadeSection>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, position: 'relative' }}>
                        {[
                            { icon: Monitor, num: '01', t: c.step1_t, d: c.step1_d, color: '#7C3AED' },
                            { icon: FileText, num: '02', t: c.step2_t, d: c.step2_d, color: '#3B82F6' },
                            { icon: CheckCircle, num: '03', t: c.step3_t, d: c.step3_d, color: '#10B981' },
                        ].map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <FadeSection key={i} style={{ transitionDelay: `${i * 120}ms` }}>
                                    <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
                                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${step.color}20, ${step.color}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${step.color}30` }}>
                                                <Icon size={32} color={step.color} />
                                            </div>
                                            <div style={{ position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: '50%', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ color: 'white', fontSize: 11, fontWeight: 900 }}>{step.num}</span>
                                            </div>
                                        </div>
                                        <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: dark ? '#F1F5F9' : '#0F172A' }}>{step.t}</h3>
                                        <p style={{ margin: 0, fontSize: 15, color: dark ? '#CBD5E1' : '#64748B', lineHeight: 1.7 }}>{step.d}</p>
                                    </div>
                                </FadeSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" style={{ background: dark ? '#0F172A' : 'white', padding: '96px 24px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, margin: '0 0 16px', color: dark ? '#F1F5F9' : '#0F172A' }}>{c.pricing_title}</h2>
                        <p style={{ fontSize: 17, color: dark ? '#CBD5E1' : '#64748B', maxWidth: 480, margin: '0 auto' }}>{c.pricing_sub}</p>
                    </FadeSection>
                    <FadeSection>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, maxWidth: 1000, margin: '0 auto' }}>
                            {/* FREE */}
                            <div style={{ border: `2px solid ${dark ? '#334155' : '#E2E8F0'}`, borderRadius: 20, padding: 36, background: dark ? '#1E293B' : '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ marginBottom: 24, flexGrow: 1 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: dark ? '#CBD5E1' : '#64748B', letterSpacing: 2, textTransform: 'uppercase' }}>{c.free_label}</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '8px 0', whiteSpace: 'nowrap' }}>
                                        <span style={{ fontSize: 40, fontWeight: 900, color: dark ? '#FFFFFF' : '#0F172A' }}>{c.free_price}</span>
                                        <span style={{ fontSize: 14, color: dark ? '#CBD5E1' : '#64748B', fontWeight: 600 }}>{c.free_period}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, color: dark ? '#CBD5E1' : '#64748B' }}>{c.free_desc}</p>
                                </div>

                                {(!user || (profile?.plan === 'free' && !profile?.trial_ends_at)) ? (
                                    <button onClick={handleTrialClick} style={{ width: '100%', padding: '13px', borderRadius: 10, border: '2px solid #7C3AED', background: dark ? 'transparent' : 'white', color: '#7C3AED', fontSize: 14, fontWeight: 800, cursor: 'pointer', marginBottom: 8, transition: 'background 200ms, color 200ms' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = dark ? 'transparent' : 'white'; e.currentTarget.style.color = '#7C3AED'; }}
                                    >
                                        {t('btn_try_pro_trial')}
                                    </button>
                                ) : (
                                    <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '13px', borderRadius: 10, border: '2px solid #7C3AED', background: dark ? 'transparent' : 'white', color: '#7C3AED', fontSize: 14, fontWeight: 800, cursor: 'pointer', marginBottom: 8, transition: 'background 200ms, color 200ms' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = dark ? 'transparent' : 'white'; e.currentTarget.style.color = '#7C3AED'; }}
                                    >
                                        {c.btn_free}
                                    </button>
                                )}

                                <p style={{ fontSize: 12, textAlign: 'center', color: '#64748B', margin: '0 0 20px', fontWeight: 600 }}>Mulai gratis, upgrade kapan saja</p>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {c.free_features.map((f, i) => {
                                        const isWatermark = f.includes('Watermark');
                                        return (
                                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: dark ? '#CBD5E1' : '#374151' }}>
                                                {isWatermark ? (
                                                    <AlertCircle size={16} className="text-amber-500" />
                                                ) : (
                                                    <CheckCircle size={16} color="#10B981" />
                                                )}
                                                {f}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            {/* PRO */}
                            <div style={{ border: '2px solid #7C3AED', borderRadius: 20, padding: 36, background: dark ? '#1E293B' : 'white', position: 'relative', boxShadow: '0 16px 48px rgba(124,58,237,0.15)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {/* BEST SELLER badge */}
                                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: 'white', fontSize: 11, fontWeight: 900, padding: '4px 18px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: 1, boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                                    {c.pro_badge}
                                </div>
                                <div style={{ marginBottom: 24, flexGrow: 1, paddingTop: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: 2, textTransform: 'uppercase' }}>{c.pro_label}</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '8px 0', whiteSpace: 'nowrap' }}>
                                        <span style={{ fontSize: 40, fontWeight: 900, color: dark ? '#FFFFFF' : '#0F172A' }}>{c.pro_price}</span>
                                        <span style={{ fontSize: 14, color: dark ? '#CBD5E1' : '#64748B', fontWeight: 600 }}>{c.pro_period}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, color: dark ? '#CBD5E1' : '#64748B' }}>{c.pro_desc}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                                    <button onClick={() => window.location.href = import.meta.env.VITE_MAYAR_PRO_PAYMENT_URL} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#7C3AED', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.4)', transition: 'opacity 200ms' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        {t('btn_start_pro')}
                                    </button>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {c.pro_features.map((f, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: dark ? '#CBD5E1' : '#374151' }}>
                                            <CheckCircle size={16} color="#7C3AED" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* ULTIMATE */}
                            <div style={{ border: `2px solid ${dark ? '#9333EA' : '#A855F7'}`, borderRadius: 20, padding: 36, background: dark ? '#2E1065' : '#FAF5FF', position: 'relative', boxShadow: '0 16px 48px rgba(168,85,247,0.2)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: dark ? '#A855F7' : '#9333EA', color: 'white', fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: 1 }}>
                                    {c.ultimate_badge}
                                </div>
                                <div style={{ marginBottom: 24, flexGrow: 1 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: dark ? '#D8B4FE' : '#9333EA', letterSpacing: 2, textTransform: 'uppercase' }}>ULTIMATE</span>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '8px 0', flexWrap: 'nowrap' }}>
                                        <span style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 900, color: dark ? '#FFFFFF' : '#0F172A', whiteSpace: 'nowrap' }}>Rp 149.000</span>
                                        <span style={{ fontSize: 13, color: dark ? '#D8B4FE' : '#9333EA', fontWeight: 600, whiteSpace: 'nowrap' }}>{lang === 'ID' ? '/bulan' : '/month'}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, color: dark ? '#E9D5FF' : '#7E22CE' }}>{c.ultimate_sub}</p>
                                </div>
                                <button onClick={() => window.location.href = import.meta.env.VITE_MAYAR_ULTIMATE_PAYMENT_URL} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: dark ? '#A855F7' : '#9333EA', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', marginBottom: 28, boxShadow: '0 4px 16px rgba(168,85,247,0.4)', transition: 'opacity 200ms' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                    {t('btn_start_ultimate')}
                                </button>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {c.ultimate_features.map((f, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: dark ? '#FFFFFF' : '#4C1D95', fontWeight: 500 }}>
                                            <CheckCircle size={16} color={dark ? '#D8B4FE' : '#9333EA'} /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </FadeSection>
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section style={{ background: dark ? '#1E293B' : '#F5F3FF', padding: '96px 0', overflow: 'hidden' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, margin: '0 0 16px', color: dark ? '#F1F5F9' : '#0F172A' }}>{c.testi_title}</h2>
                        <p style={{ fontSize: 17, color: dark ? '#CBD5E1' : '#64748B', maxWidth: 480, margin: '0 auto' }}>{c.testi_sub}</p>
                    </FadeSection>
                </div>

                {/* Infinite Scroll Wrapper */}
                <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                    <div className="testi-scroll-track" style={{ display: 'flex', width: 'max-content', gap: 24, padding: '20px 0' }}>
                        {[...testimonials, ...testimonials].map((t, i) => (
                            <div key={i} style={{
                                width: 320,
                                flexShrink: 0,
                                background: dark ? '#0F172A' : 'white',
                                borderRadius: 20,
                                padding: 32,
                                boxShadow: '0 10px 30px rgba(124,58,237,0.06)',
                                border: `1px solid ${dark ? '#334155' : 'rgba(124,58,237,0.08)'}`,
                                transition: 'transform 300ms',
                            }} className="testi-card">
                                <Stars n={t.rating} />
                                <p style={{ margin: '12px 0 24px', fontSize: 15, color: dark ? '#CBD5E1' : '#374151', lineHeight: 1.7, fontWeight: 500 }}>
                                    "{lang === 'ID' ? t.content.id : t.content.en}"
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <img src={t.image} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #7C3AED20' }} />
                                    <div>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: dark ? '#F1F5F9' : '#0F172A' }}>{t.name}</p>
                                        <p style={{ margin: 0, fontSize: 12, color: dark ? '#CBD5E1' : '#64748B', fontWeight: 600 }}>{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <style>{`
                    @keyframes testiScroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(calc(-50% - 12px)); }
                    }
                    .testi-scroll-track {
                        animation: testiScroll 50s linear infinite;
                    }
                    .testi-scroll-track:hover {
                        animation-play-state: paused;
                    }
                    .testi-card:hover {
                        transform: translateY(-8px);
                        border-color: #7C3AED40 !important;
                        box-shadow: 0 20px 40px rgba(124,58,237,0.12) !important;
                    }
                `}</style>
            </section>

            {/* ── FAQ ── */}
            <section id="faq" style={{ background: dark ? '#0F172A' : '#F8FAFC', padding: '96px 24px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <FadeSection style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, margin: '0 0 16px', color: dark ? '#F1F5F9' : '#0F172A' }}>{c.faq_title}</h2>
                        <p style={{ fontSize: 16, color: dark ? '#CBD5E1' : '#64748B', margin: 0 }}>{c.faq_sub}</p>
                    </FadeSection>

                    <FadeSection>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
                            gap: 0,
                            background: dark ? '#1E293B' : 'white',
                            borderRadius: 20,
                            overflow: 'hidden',
                            boxShadow: dark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)',
                            border: `1.5px solid ${dark ? '#334155' : '#E2E8F0'}`,
                        }}
                            className="faq-grid"
                        >
                            {/* Left: Question tabs */}
                            <div style={{
                                borderRight: `1.5px solid ${dark ? '#334155' : '#E2E8F0'}`,
                                background: dark ? '#0F172A' : '#F8FAFC',
                            }}>
                                {faqData.map((item, i) => {
                                    const isActive = openFaq === i || (openFaq === null && i === 0);
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setOpenFaq(isActive ? null : i)}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '20px 24px',
                                                background: isActive
                                                    ? (dark ? '#1E293B' : 'white')
                                                    : 'transparent',
                                                border: 'none',
                                                borderBottom: `1px solid ${dark ? '#334155' : '#E2E8F0'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 14,
                                                transition: 'background 200ms',
                                                borderLeft: `3px solid ${isActive ? '#7C3AED' : 'transparent'}`,
                                            }}
                                        >
                                            <span style={{
                                                flexShrink: 0,
                                                width: 28, height: 28,
                                                borderRadius: '50%',
                                                background: isActive ? '#7C3AED' : (dark ? '#334155' : '#E2E8F0'),
                                                color: isActive ? 'white' : (dark ? '#94A3B8' : '#64748B'),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, fontWeight: 800,
                                                transition: 'all 200ms',
                                                marginTop: 2,
                                            }}>
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <span style={{
                                                fontSize: 14,
                                                fontWeight: isActive ? 700 : 600,
                                                color: isActive ? (dark ? '#F1F5F9' : '#0F172A') : (dark ? '#94A3B8' : '#64748B'),
                                                lineHeight: 1.5,
                                                transition: 'color 200ms',
                                            }}>
                                                {lang === 'ID' ? item.qID : item.qEN}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right: Answer panel */}
                            {(() => {
                                const activeIdx = openFaq !== null ? openFaq : 0;
                                const activeItem = faqData[activeIdx];
                                return (
                                    <div style={{
                                        padding: '36px 40px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'flex-start',
                                    }}>
                                        {/* Question header */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
                                        }}>
                                            <div style={{
                                                width: 4, height: 32, borderRadius: 2,
                                                background: 'linear-gradient(180deg, #7C3AED, #5B21B6)',
                                                flexShrink: 0,
                                            }} />
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: 18,
                                                fontWeight: 800,
                                                color: dark ? '#F1F5F9' : '#0F172A',
                                                lineHeight: 1.4,
                                            }}>
                                                {lang === 'ID' ? activeItem.qID : activeItem.qEN}
                                            </h3>
                                        </div>

                                        {/* Divider */}
                                        <div style={{
                                            height: 1,
                                            background: dark ? '#334155' : '#E2E8F0',
                                            marginBottom: 24,
                                        }} />

                                        {/* Answer */}
                                        <p style={{
                                            margin: 0,
                                            fontSize: 15,
                                            color: dark ? '#CBD5E1' : '#374151',
                                            lineHeight: 1.85,
                                            textAlign: 'justify',
                                            hyphens: 'auto',
                                        }}>
                                            {lang === 'ID' ? activeItem.aID : activeItem.aEN}
                                        </p>

                                        {/* Bottom badge */}
                                        <div style={{
                                            marginTop: 32,
                                            padding: '12px 16px',
                                            background: dark ? 'rgba(124,58,237,0.12)' : '#F5F3FF',
                                            borderRadius: 10,
                                            border: `1px solid ${dark ? 'rgba(124,58,237,0.3)' : '#DDD6FE'}`,
                                            display: 'flex', alignItems: 'center', gap: 10,
                                        }}>
                                            <MessageCircle size={20} color={dark ? '#A78BFA' : '#7C3AED'} />
                                            <span style={{ fontSize: 13, color: dark ? '#A78BFA' : '#7C3AED', fontWeight: 600 }}>
                                                {lang === 'ID'
                                                    ? 'Masih ada pertanyaan? Hubungi kami di support@myinvoice.space'
                                                    : 'Still have questions? Contact us at support@myinvoice.space'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </FadeSection>
                </div>

                {/* FAQ responsive CSS */}
                <style>{`
                    @media (max-width: 700px) {
                        .faq-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </section>


            {/* ── CTA BAND ── */}
            <section style={{ background: `linear-gradient(135deg, ${NAV}, #1E1B4B)`, padding: '80px 24px', textAlign: 'center' }}>
                <FadeSection>
                    <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
                        {lang === 'ID' ? 'Siap memulai bisnis lebih profesional?' : 'Ready to run your business more professionally?'}
                    </h2>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 36 }}>
                        {lang === 'ID' ? 'Bergabung dengan ribuan UMKM yang sudah menggunakan My Invoice.' : 'Join thousands of SMEs already using My Invoice.'}
                    </p>
                    <button onClick={() => navigate('/login')}
                        style={{ background: '#7C3AED', color: 'white', border: 'none', borderRadius: 12, padding: '16px 40px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 32px rgba(124,58,237,0.5)', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'transform 200ms' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {c.hero_cta1} <ArrowRight size={18} />
                    </button>
                    <br />
                    <button
                        onClick={enterAsGuest}
                        style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 600, textDecoration: 'underline', padding: 0, transition: 'color 200ms' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                    >
                        {lang === 'ID' ? 'Lanjut sebagai Guest (tanpa login)' : 'Continue as Guest (no login)'}
                    </button>
                </FadeSection>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: NAV, padding: '56px 24px 32px', color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
                        <div>
                            <span style={{ fontSize: 20, fontWeight: 900, color: '#7C3AED', display: 'block', marginBottom: 12 }}>My Invoice</span>
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{c.footer_tagline}</p>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 1 }}>{lang === 'ID' ? 'Produk' : 'Product'}</h4>
                            {[
                                [lang === 'ID' ? 'Invoice' : 'Invoice', 'Invoice'],
                                [lang === 'ID' ? 'Kwitansi' : 'Receipt', 'Kwitansi'],
                                [lang === 'ID' ? 'Hitung HPP' : 'Cost Calculator', 'HPP'],
                                [lang === 'ID' ? 'Laporan' : 'Reports', 'Laporan'],
                            ].map(([label]) => (
                                <button key={label} onClick={() => navigate('/login')} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 14, padding: '4px 0', textAlign: 'left', transition: 'color 200ms' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div>
                            <h4 style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 1 }}>{lang === 'ID' ? 'Perusahaan' : 'Company'}</h4>
                            {[
                                { label: lang === 'ID' ? 'Tentang Kami' : 'About Us', path: '/about' },
                                { label: lang === 'ID' ? 'Blog' : 'Blog', path: '/blog' },
                                { label: lang === 'ID' ? 'Kontak' : 'Contact', path: '/contact' },
                                { label: lang === 'ID' ? 'Kebijakan Privasi' : 'Privacy Policy', path: '/privacy' },
                            ].map(({ label, path }) => (
                                <Link key={label} to={path} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 14, padding: '4px 0', textAlign: 'left', transition: 'color 200ms', textDecoration: 'none' }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <p style={{ margin: 0, fontSize: 13 }}>{c.footer_copy}</p>
                        <button onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700 }}>
                            <Globe size={13} /> {lang === 'ID' ? 'Switch to EN' : 'Ganti ke ID'}
                        </button>
                    </div>
                </div>
            </footer>

            {/* ── Responsive CSS ── */}
            <style>{`
                @media (max-width: 768px) {
                    .landing-desktop-nav { display: none !important; }
                    .landing-mobile-menu-btn { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .landing-mobile-menu-btn { display: none !important; }
                }
            `}</style>
        </div>
    );
}
