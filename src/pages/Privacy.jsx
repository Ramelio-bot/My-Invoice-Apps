import { Shield, Lock, Eye, Mail, Server, RefreshCw } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    title: 'Kebijakan Privasi & Perlindungan Data',
    subtitle: 'Standar Keamanan Informasi dan Perlindungan Privasi PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Pembaruan Terakhir: 8 November 2026',
    intro: 'MyInvoice (dikelola oleh PT. Ramelio Berkah Abadi) berkomitmen penuh untuk melindungi privasi dan keamanan data seluruh pengguna platform kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi serta data operasional bisnis Anda, sesuai dengan prinsip kepatuhan Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022) dan standar keamanan informasi modern.',

    s1Title: '1. Jenis Data yang Kami Kumpulkan',
    s1Desc: 'Kami mengumpulkan data yang diperlukan guna menunjang kelancaran dan kestabilan operasional layanan, meliputi:',
    s1List: [
      'Data Identitas & Akun: Nama lengkap, alamat email, nomor telepon/WhatsApp, dan nama toko atau entitas usaha yang Anda daftarkan.',
      'Data Operasional Bisnis: Dokumen faktur (invoice), kwitansi, surat penawaran harga, catatan kasir POS, katalog produk, dan daftar kontak pelanggan yang Anda masukkan ke dalam sistem.',
      'Data Teknis & Perangkat: Alamat IP, jenis peramban (browser), sistem operasi, log autentikasi, dan pengenal perangkat unik yang diperlukan untuk audit keamanan serta pemeliharaan sistem.'
    ],

    s2Title: '2. Protokol Keamanan & Penyimpanan Data',
    s2Desc: 'Seluruh data pengguna disimpan dan dilindungi menggunakan arsitektur keamanan modern. Kami menerapkan enkripsi data berstandar industri tinggi (AES-256 pada tingkat penyimpanan basis data dan protokol TLS/HTTPS 1.3 pada transmisi data). Selain itu, sistem menerapkan Row Level Security (RLS) pada basis data komputasi awan kami untuk memastikan isolasi data yang ketat antar-pengguna, sehingga data bisnis Anda hanya dapat diakses secara sah oleh akun Anda sendiri.',

    s3Title: '3. Pemanfaatan & Kerahasiaan Informasi',
    s3Desc: 'Informasi bisnis Anda digunakan secara eksklusif untuk operasional aplikasi, sinkronisasi data antar-perangkat, dan penyajian laporan keuangan usaha Anda. PT. Ramelio Berkah Abadi menjamin bahwa Kami tidak pernah dan tidak akan pernah menjual, menyewakan, atau membagikan data transaksi bisnis maupun data pelanggan Anda kepada pihak ketiga atau jaringan pengiklan komersial.',

    s4Title: '4. Kendali & Hak Pengguna atas Data',
    s4Desc: 'Sesuai dengan regulasi perlindungan data pribadi, Pengguna memiliki hak penuh untuk mengakses riwayat transaksi, memperbarui profil, mengekspor laporan ke format digital (PDF/Excel), serta mengajukan permohonan penghapusan data bisnis maupun penutupan akun secara permanen melalui fitur yang tersedia di menu Pengaturan Akun.',

    s5Title: '5. Penyimpanan Data Offline & Sinkronisasi Lokal',
    s5Desc: 'Pada modul operasional kasir offline, data transaksi disimpan secara aman pada memori peramban lokal perangkat Anda (IndexedDB). Begitu perangkat kembali terhubung ke jaringan internet yang stabil, sistem secara otomatis melakukan penyelarasan data ke server komputasi awan terenkripsi tanpa mengorbankan integritas data historis.',

    s8Title: '6. Layanan Bantuan & Kontak Privasi',
    s8Desc: 'Apabila Anda memiliki pertanyaan, klarifikasi kebijakan, atau kendala terkait keamanan dan privasi data akun Anda, silakan hubungi tim kami melalui saluran resmi berikut:',
    s8Email: 'hello.myinvoice@gmail.com',
    s8Hours: 'Jam Layanan: Senin - Jumat | 09:00 - 17:00 WIB',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Jawa Tengah, Indonesia'
  },
  EN: {
    title: 'Privacy & Data Protection Policy',
    subtitle: 'Information Security and Privacy Protection Standards of PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Last Updated: November 8, 2026',
    intro: 'MyInvoice (operated by PT. Ramelio Berkah Abadi) is fully committed to protecting the privacy and security of all platform users. This Privacy Policy outlines how we collect, use, store, and safeguard your personal information and business operational data, adhering to the Indonesian Personal Data Protection Law (UU PDP No. 27/2022) and modern global information security standards.',

    s1Title: '1. Types of Data We Collect',
    s1Desc: 'We collect data strictly necessary to support operational stability and service delivery, including:',
    s1List: [
      'Account & Identity Data: Full name, email address, phone/WhatsApp number, and registered business name.',
      'Business Operational Data: Invoices, payment receipts, price quotations, POS cashier records, product catalogs, and customer contact details inputted into the platform.',
      'Technical & Device Data: IP address, browser type, operating system, authentication logs, and unique device identifiers utilized for system audits and security maintenance.'
    ],

    s2Title: '2. Security Protocols & Data Storage',
    s2Desc: 'All user data is stored and safeguarded using modern cloud security architecture. We deploy high-grade industry encryption standards (AES-256 for data-at-rest encryption and TLS/HTTPS 1.3 for data-in-transit). Furthermore, our databases enforce strict Row Level Security (RLS) to ensure absolute tenant isolation, guaranteeing your business data remains accessible solely by your authenticated credentials.',

    s3Title: '3. Data Utilization & Confidentiality',
    s3Desc: 'Your business information is utilized exclusively to power core application workflows, enable real-time cross-device synchronization, and calculate financial summaries. PT. Ramelio Berkah Abadi warrants that we will never sell, lease, or monetize your business records, invoices, or customer directories to third-party ad networks or data brokers.',

    s4Title: '4. User Rights & Data Ownership',
    s4Desc: 'Under data protection legislation, Users retain complete ownership of their data, including the right to inspect, update, export financial archives (PDF/Excel), or request permanent data deletion and account erasure directly via Account Settings.',

    s5Title: '5. Offline Storage & Local Synchronization',
    s5Desc: 'For offline cashier operations, transactional state is cached locally within the client browser memory (IndexedDB). Once internet connectivity is re-established, the platform automatically synchronizes pending operational queues to the encrypted cloud database without data duplication or loss.',

    s8Title: '6. Privacy Contacts & Inquiries',
    s8Desc: 'For any technical inquiries, clarifications, or privacy compliance requests regarding your account, please reach our dedicated team at:',
    s8Email: 'hello.myinvoice@gmail.com',
    s8Hours: 'Support Hours: Monday - Friday | 09:00 - 17:00 WIB',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Central Java, Indonesia'
  }
};

const Section = ({ icon: IconComponent, title, children }) => {
    return (
        <div className="p-8 md:p-10 rounded-3xl mb-8 border transition-all bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                    {IconComponent && <IconComponent size={24} />}
                </div>
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            <div className="text-base sm:text-lg leading-relaxed text-slate-600">
                {children}
            </div>
        </div>
    );
};

export default function Privacy() {
    const { lang } = useLang();
    const c = copy[lang] || copy.ID;

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-200 bg-slate-50 text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <LandingNavbar />
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-bold text-sm" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                        <Shield size={16} />
                        Privacy
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                        {c.title}
                    </h1>
                    <p className="text-lg md:text-xl mb-4 text-slate-600 max-w-2xl mx-auto">
                        {c.subtitle}
                    </p>
                    <div className="inline-block px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white text-slate-500 border border-slate-200 shadow-sm">
                        {c.lastUpdated}
                    </div>
                </div>

                {/* Intro */}
                <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-violet-50/50 border border-violet-100">
                    <p className="text-base sm:text-lg leading-relaxed text-slate-700 m-0">
                        {c.intro}
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-6">
                    <Section icon={Eye} title={c.s1Title}>
                        <p className="mb-4">{c.s1Desc}</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-violet-500">
                            {c.s1List.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </Section>

                    <Section icon={Lock} title={c.s2Title}>
                        <p>{c.s2Desc}</p>
                    </Section>

                    <Section icon={Shield} title={c.s3Title}>
                        <p>{c.s3Desc}</p>
                    </Section>

                    <Section icon={Server} title={c.s4Title}>
                        <p>{c.s4Desc}</p>
                    </Section>

                    <Section icon={RefreshCw} title={c.s5Title}>
                        <p>{c.s5Desc}</p>
                    </Section>

                    <Section icon={Mail} title={c.s8Title}>
                        <p className="mb-4">{c.s8Desc}</p>
                        <a href={`mailto:${c.s8Email}`} className="inline-flex font-bold text-violet-600 hover:text-violet-700 text-lg sm:text-xl border-b-2 border-violet-200 pb-1 transition-all mb-4">
                            {c.s8Email}
                        </a>
                        <p className="text-sm opacity-75 m-0">{c.s8Hours}</p>
                        <p className="mt-1 text-sm opacity-75">{c.contactLaw}</p>
                    </Section>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
