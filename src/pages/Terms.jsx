import { useNavigate } from 'react-router-dom';
import { FileText, Store, User, CreditCard, Shield, Award, AlertCircle, Scale, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const copy = {
  ID: {
    title: 'Syarat & Ketentuan',
    subtitle: 'Perjanjian penggunaan layanan My Invoice yang berlaku bagi seluruh pengguna terdaftar.',
    lastUpdated: 'Berlaku sejak: 1 Maret 2026 · Versi 1.1',

    s1Title: 'Penerimaan & Ruang Lingkup',
    s1Desc: 'Dengan mengakses, mendaftar, atau menggunakan layanan My Invoice yang tersedia di myinvoice.space ("Layanan"), Anda ("Pengguna") menyatakan telah membaca, memahami, dan setuju untuk terikat secara hukum oleh Syarat & Ketentuan ini, Kebijakan Privasi, serta kebijakan lain yang berlaku. Syarat & Ketentuan ini berlaku bagi semua pengguna, termasuk pengguna gratis, berlangganan, dan administrator. Jika Anda menggunakan Layanan atas nama entitas bisnis, Anda menyatakan memiliki kewenangan untuk mengikat entitas tersebut pada ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan Layanan kami.',

    s2Title: 'Deskripsi Layanan',
    s2Desc: 'My Invoice adalah platform Software as a Service (SaaS) berbasis web yang dirancang untuk membantu usaha kecil dan menengah di Indonesia dalam mengelola operasional bisnis secara digital. Layanan yang kami sediakan mencakup, namun tidak terbatas pada: pembuatan dan pengelolaan invoice, kwitansi, tanda terima, penawaran harga, dan purchase order; sistem kasir POS dengan manajemen produk dan inventori; pencatatan keuangan dan laporan bisnis; serta fitur loyalty member dan perhitungan harga pokok penjualan. Layanan diakses melalui browser web di myinvoice.space dan tersedia dalam mode responsif untuk perangkat mobile. My Invoice berhak mengubah, menambah, atau menghentikan fitur tertentu sewaktu-waktu dengan pemberitahuan yang wajar kepada pengguna.',

    s3Title: 'Ketentuan Akun Pengguna',
    s3Desc: 'Untuk menggunakan Layanan, Anda wajib mendaftar dan membuat akun. Dengan mendaftarkan, Anda menyatakan dan menjamin bahwa: (1) Anda berusia minimal 17 tahun atau telah memperoleh persetujuan orang tua/wali; (2) informasi pendaftaran yang Anda berikan adalah akurat, lengkap, dan terkini; (3) Anda tidak akan membuat lebih dari satu akun per entitas bisnis tanpa izin tertulis dari kami; (4) Anda bertanggung jawab penuh atas kerahasiaan kredensial akun dan seluruh aktivitas yang terjadi di bawah akun Anda; (5) Anda wajib segera memberitahu kami apabila terjadi akses tidak sah ke akun Anda. My Invoice tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian Anda dalam menjaga keamanan akun.',

    s4Title: 'Paket Layanan, Harga & Pembayaran',
    s4Desc: 'My Invoice menawarkan tiga tingkatan layanan: FREE (gratis dengan batasan penggunaan bulanan), PRO (berlangganan berbayar dengan fitur lengkap), dan ULTIMATE (berlangganan berbayar dengan semua fitur PRO ditambah fitur bisnis lanjutan). Setiap akun baru mendapatkan masa uji coba PRO gratis selama 14 hari tanpa memerlukan kartu kredit. Setelah masa trial berakhir, akun secara otomatis beralih ke plan FREE. Ketentuan pembayaran: (1) Tagihan diterbitkan di awal periode langganan dan wajib dilunasi untuk mengaktifkan akses PRO/ULTIMATE. (2) Pembayaran bersifat non-refundable kecuali terjadi gangguan layanan signifikan yang disebabkan oleh pihak kami. (3) Kami berhak mengubah harga dengan pemberitahuan minimal 30 hari kepada pengguna aktif. (4) Keterlambatan pembayaran dapat mengakibatkan pembatasan akses fitur berbayar.',

    s5Title: 'Penggunaan yang Dilarang',
    s5Desc: 'Anda dilarang keras menggunakan Layanan My Invoice untuk tujuan atau aktivitas berikut: (1) Aktivitas ilegal, penipuan, pencucian uang, atau pelanggaran hukum yang berlaku di Republik Indonesia; (2) Memasukkan, menyimpan, atau mendistribusikan konten yang melanggar hak kekayaan intelektual pihak ketiga; (3) Melakukan rekayasa balik (reverse engineering), dekompilasi, atau upaya ekstraksi kode sumber platform; (4) Mengakses, mengganggu, atau merusak data milik pengguna lain; (5) Menggunakan skrip otomatis, bot, crawler, atau mekanisme scraping tanpa persetujuan tertulis dari kami; (6) Mencoba menembus, menguji, atau mengeksploitasi kerentanan keamanan sistem kami; (7) Menyebarkan malware, virus, atau kode berbahaya melalui platform. Pelanggaran terhadap ketentuan ini dapat mengakibatkan penangguhan atau penghentian akun secara permanen tanpa pengembalian dana.',

    s6Title: 'Kekayaan Intelektual & Kepemilikan Data',
    s6Desc: 'Seluruh elemen platform My Invoice — termasuk desain antarmuka, kode sumber, algoritma, merek dagang, logo, dan konten orisinal — merupakan kekayaan intelektual eksklusif tim My Invoice yang dilindungi oleh hukum kekayaan intelektual yang berlaku. Anda dilarang menggunakan, mereproduksi, atau mendistribusikan elemen-elemen tersebut tanpa izin tertulis. Data bisnis yang Anda masukkan ke dalam platform (invoice, produk, data klien, transaksi) sepenuhnya tetap menjadi milik Anda. Anda memberikan My Invoice lisensi non-eksklusif, bebas royalti, dan terbatas semata-mata untuk keperluan penyediaan, pemeliharaan, dan peningkatan Layanan. Lisensi ini berakhir secara otomatis apabila Anda menghapus akun atau menghentikan penggunaan Layanan.',

    s7Title: 'Batasan Tanggung Jawab & Disclaimer',
    s7Desc: 'Layanan My Invoice disediakan "sebagaimana adanya" (as-is) dan "sebagaimana tersedia" (as-available). Kami berupaya keras untuk menjaga ketersediaan layanan dengan target uptime 99.9% per bulan, namun tidak memberikan jaminan bahwa Layanan akan bebas dari gangguan, kesalahan, atau kehilangan data secara absolut. My Invoice tidak bertanggung jawab atas: (1) kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan Layanan; (2) kehilangan data akibat bencana alam, kegagalan infrastruktur pihak ketiga, atau force majeure; (3) keputusan bisnis yang diambil berdasarkan laporan atau data yang dihasilkan oleh platform. Total kewajiban finansial kami kepada Anda tidak akan melebihi jumlah biaya langganan yang telah Anda bayarkan dalam 3 (tiga) bulan terakhir sebelum timbulnya klaim.',

    s8Title: 'Penghentian Akun',
    s8Desc: 'Anda dapat menutup akun Anda kapan saja melalui pengaturan akun atau dengan menghubungi tim kami. My Invoice berhak menangguhkan atau menghentikan akun Anda, dengan atau tanpa pemberitahuan terlebih dahulu, apabila: (1) terbukti melanggar Syarat & Ketentuan ini atau kebijakan yang berlaku; (2) terdapat indikasi penggunaan akun untuk aktivitas ilegal atau penipuan; (3) tidak ada pembayaran yang valid setelah masa tenggang yang ditetapkan. Penghentian akun tidak membebaskan Anda dari kewajiban pembayaran yang telah jatuh tempo.',

    contact: 'Hubungi Kami',
    contactDesc: 'Untuk pertanyaan mengenai Syarat & Ketentuan ini atau hal lainnya terkait Layanan, silakan hubungi tim kami:',
    contactEmail: 'hello.myinvoice@gmail.com',
    contactHours: 'Senin – Jumat, 09.00 – 17.00 WIB. Respons dalam 1×24 jam kerja.',
    contactLaw: 'Syarat & Ketentuan ini tunduk pada hukum Republik Indonesia. Setiap sengketa yang tidak dapat diselesaikan secara musyawarah akan dibawa ke yurisdiksi pengadilan yang berwenang di Jakarta, Indonesia.',
  },
  EN: {
    title: 'Terms of Service',
    subtitle: 'The service agreement for My Invoice applicable to all registered users.',
    lastUpdated: 'Effective Date: March 1, 2026 · Version 1.1',

    s1Title: 'Acceptance & Scope',
    s1Desc: 'By accessing, registering for, or using the My Invoice service available at myinvoice.space ("Service"), you ("User") acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service, our Privacy Policy, and other applicable policies. These Terms apply to all users, including free users, subscribers, and administrators. If you are using the Service on behalf of a business entity, you represent that you have the authority to bind that entity to these terms. If you do not agree to these terms, please refrain from using our Service.',

    s2Title: 'Service Description',
    s2Desc: 'My Invoice is a web-based Software as a Service (SaaS) platform designed to help small and medium-sized businesses in Indonesia manage their operations digitally. Services we provide include, but are not limited to: creation and management of invoices, receipts, delivery notes, price quotations, and purchase orders; a POS cashier system with product and inventory management; financial bookkeeping and business reports; as well as loyalty member programs and cost of goods (COGS) calculation. The Service is accessed via web browser at myinvoice.space and is available in a mobile-responsive format. My Invoice reserves the right to modify, add, or discontinue specific features at any time with reasonable notice to users.',

    s3Title: 'User Account Terms',
    s3Desc: 'To use the Service, you must register and create an account. By registering, you represent and warrant that: (1) you are at least 17 years of age or have obtained parental/guardian consent; (2) the registration information you provide is accurate, complete, and current; (3) you will not create more than one account per business entity without our written permission; (4) you are solely responsible for the confidentiality of your account credentials and all activities that occur under your account; (5) you will immediately notify us of any unauthorized access to your account. My Invoice is not liable for any losses resulting from your failure to maintain account security.',

    s4Title: 'Service Plans, Pricing & Payment',
    s4Desc: 'My Invoice offers three service tiers: FREE (no cost with monthly usage limits), PRO (paid subscription with full features), and ULTIMATE (paid subscription with all PRO features plus advanced business tools). Every new account receives a free 14-day PRO trial with no credit card required. After the trial ends, the account automatically reverts to the FREE plan. Payment terms: (1) Invoices are issued at the start of the subscription period and must be settled to activate PRO/ULTIMATE access. (2) Payments are non-refundable except in cases of significant service disruption caused by us. (3) We reserve the right to change pricing with at least 30 days\' notice to active users. (4) Late payment may result in restricted access to paid features.',

    s5Title: 'Prohibited Use',
    s5Desc: 'You are strictly prohibited from using My Invoice for the following purposes or activities: (1) Illegal activities, fraud, money laundering, or violations of applicable laws in the Republic of Indonesia; (2) Uploading, storing, or distributing content that infringes third-party intellectual property rights; (3) Reverse engineering, decompiling, or attempting to extract the platform\'s source code; (4) Accessing, interfering with, or damaging data belonging to other users; (5) Using automated scripts, bots, crawlers, or scraping mechanisms without our written consent; (6) Attempting to penetrate, probe, or exploit security vulnerabilities in our systems; (7) Distributing malware, viruses, or malicious code through the platform. Violations of these terms may result in immediate account suspension or permanent termination without refund.',

    s6Title: 'Intellectual Property & Data Ownership',
    s6Desc: 'All elements of the My Invoice platform — including user interface design, source code, algorithms, trademarks, logos, and original content — are the exclusive intellectual property of the My Invoice team, protected by applicable intellectual property laws. You may not use, reproduce, or distribute these elements without written permission. Business data you input into the platform (invoices, products, client data, transactions) remains entirely your property. You grant My Invoice a non-exclusive, royalty-free, limited license solely for the purposes of providing, maintaining, and improving the Service. This license terminates automatically upon account deletion or cessation of Service use.',

    s7Title: 'Limitation of Liability & Disclaimer',
    s7Desc: 'My Invoice services are provided "as-is" and "as-available." We work diligently to maintain service availability with a target uptime of 99.9% per month, but we do not provide an absolute guarantee that the Service will be free from interruptions, errors, or data loss. My Invoice is not liable for: (1) indirect, incidental, or consequential damages arising from the use of or inability to use the Service; (2) data loss due to natural disasters, third-party infrastructure failure, or force majeure events; (3) business decisions made based on reports or data generated by the platform. Our total financial liability to you shall not exceed the subscription fees you have paid in the 3 (four) months preceding the claim.',

    s8Title: 'Account Termination',
    s8Desc: 'You may close your account at any time through account settings or by contacting our team. My Invoice reserves the right to suspend or terminate your account, with or without prior notice, if: (1) you are found to be in violation of these Terms of Service or applicable policies; (2) there are indications of account use for illegal activities or fraud; (3) no valid payment is received after the established grace period. Account termination does not release you from any outstanding payment obligations.',

    contact: 'Contact Us',
    contactDesc: 'For questions regarding these Terms of Service or any other matters related to the Service, please contact our team:',
    contactEmail: 'hello.myinvoice@gmail.com',
    contactHours: 'Monday – Friday, 9:00 AM – 5:00 PM WIB. Response within 1 business day.',
    contactLaw: 'These Terms of Service are governed by the laws of the Republic of Indonesia. Any disputes that cannot be resolved through good-faith negotiation shall be brought before the competent court in Jakarta, Indonesia.',
  }
};

export default function Terms() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const navigate = useNavigate();
    const { user } = useAuth();
    const c = copy[lang];

    const Section = ({ icon: Icon, title, children }) => (
        <div className={`p-8 md:p-10 rounded-3xl mb-8 border transition-all ${dark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                    <Icon size={24} />
                </div>
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            <div className={`text-lg leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`} style={{ textAlign: 'justify', hyphens: 'auto' }}>
                {children}
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${dark ? 'bg-[#0F172A] text-white' : 'bg-slate-50 text-slate-900'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <div className="sticky top-24 z-40 w-fit mb-8">
                    <button
                        onClick={() => user ? navigate('/dashboard') : navigate('/')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-sm transition-all hover:-translate-x-1 ${dark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900'}`}
                    >
                        &larr; {lang === 'ID' ? 'Kembali' : 'Back'}
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-bold text-sm" style={{ background: dark ? 'rgba(124,58,237,0.2)' : '#EDE9FE', color: '#7C3AED' }}>
                        <Shield size={16} />
                        Terms
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                        {c.title}
                    </h1>
                    <p className={`text-xl mb-4 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {c.subtitle}
                    </p>
                    <div className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${dark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500 border border-slate-200'} shadow-sm`}>
                        {c.lastUpdated}
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">
                    <Section icon={FileText} title={c.s1Title}>
                        <p>{c.s1Desc}</p>
                    </Section>

                    <Section icon={Store} title={c.s2Title}>
                        <p>{c.s2Desc}</p>
                    </Section>

                    <Section icon={User} title={c.s3Title}>
                        <p>{c.s3Desc}</p>
                    </Section>

                    <Section icon={CreditCard} title={c.s4Title}>
                        <p>{c.s4Desc}</p>
                    </Section>

                    <Section icon={Shield} title={c.s5Title}>
                        <p>{c.s5Desc}</p>
                    </Section>

                    <Section icon={Award} title={c.s6Title}>
                        <p>{c.s6Desc}</p>
                    </Section>

                    <Section icon={AlertCircle} title={c.s7Title}>
                        <p>{c.s7Desc}</p>
                    </Section>

                    <Section icon={Scale} title={c.s8Title}>
                        <p>{c.s8Desc}</p>
                    </Section>

                    <Section icon={Mail} title={c.contact}>
                        <p className="mb-4">{c.contactDesc}</p>
                        <a href={`mailto:${c.contactEmail}`} className="inline-flex font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 text-xl border-b-2 border-violet-200 dark:border-violet-900 pb-1 translate-y-0 transition-all hover:-translate-y-1 mb-4">
                            {c.contactEmail}
                        </a>
                        <p className="mt-4 text-sm opacity-75">{c.contactHours}</p>
                        <p className="mt-2 text-sm opacity-75">{c.contactLaw}</p>
                    </Section>
                </div>

            </div>
        </div>
    );
}
