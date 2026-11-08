import { FileText, Store, User, Shield, AlertCircle, Scale, Mail, Layers, Award } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    title: 'Syarat & Ketentuan Layanan',
    subtitle: 'Ketentuan Penggunaan Platform dan Kebijakan Layanan PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Pembaruan Terakhir: 8 November 2026',

    s1Title: '1. Ketentuan Umum & Penerimaan Layanan',
    s1Desc: 'Dokumen ini mengatur syarat dan ketentuan penggunaan platform perangkat lunak berbasis cloud (Software as a Service) MyInvoice yang dikembangkan dan dioperasikan oleh PT. Ramelio Berkah Abadi ("Kami"). Dengan mendaftar, mengakses, atau menggunakan fitur-fitur di dalam MyInvoice, Anda ("Pengguna") menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum dalam dokumen ini.',

    s2Title: '2. Ruang Lingkup & Karakteristik Layanan',
    s2Desc: 'MyInvoice menyediakan solusi digital untuk membantu efisiensi administrasi usaha, mencakup pembuatan faktur tagihan (invoice), kwitansi, surat penawaran harga, kasir POS offline/online, kalkulator HPP, dan pembukuan kas. Layanan ini berfungsi sebagai alat bantu manajemen operasional. Pengguna tetap bertanggung jawab penuh atas keabsahan data transaksi, pemenuhan kewajiban perpajakan, dan kepatuhan hukum atas kegiatan bisnis masing-masing.',

    s3Title: '3. Keamanan Akun & Kewajiban Pengguna',
    s3Desc: 'Pengguna bertanggung jawab penuh untuk menjaga kerahasiaan informasi login (email dan kata sandi) serta seluruh aktivitas yang berlangsung pada akun Pengguna. Pengguna dilarang menyalahgunakan platform untuk kegiatan yang bertentangan dengan hukum, transaksi penipuan, penyebaran malware, atau upaya rekayasa balik (reverse engineering) terhadap kode program dan infrastruktur sistem MyInvoice.',

    s4Title: '4. Batasan Tanggung Jawab (Limitation of Liability)',
    s4Desc: 'Kami senantiasa berupaya menjaga agar platform beroperasi secara optimal, stabil, dan aman dengan tingkat ketersediaan tinggi. Namun demikian, sejauh diperbolehkan oleh peraturan perundang-undangan, PT. Ramelio Berkah Abadi tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan komersial, atau gangguan operasional usaha yang disebabkan oleh kelalaian pihak Pengguna, gangguan jaringan telekomunikasi lokal Pengguna, atau kondisi di luar kendali wajar Kami (Force Majeure).',

    s5Title: '5. Kepemilikan Data & Kekayaan Intelektual',
    s5Desc: 'Seluruh data transaksi bisnis, informasi pelanggan, logo usaha, dan dokumen yang dimasukkan oleh Pengguna ke dalam sistem tetap menjadi hak milik penuh Pengguna. Sementara itu, seluruh elemen platform MyInvoice, termasuk desain visual, antarmuka pengguna, kode sumber, merek dagang, dan sistem perangkat lunak adalah hak kekayaan intelektual milik PT. Ramelio Berkah Abadi yang dilindungi oleh undang-undang hak cipta.',

    s6Title: '6. Paket Berlangganan & Kebijakan Pembayaran',
    s6Desc: 'MyInvoice menyediakan paket layanan gratis serta paket berbayar (PRO dan ULTIMATE) dengan spesifikasi kuota dan fitur yang tertera transparan pada halaman Harga. Pembayaran langganan diproses melalui saluran resmi yang aman. Pengguna dapat memilih untuk memperpanjang, meningkatkan (upgrade), atau menghentikan paket langganan kapan saja melalui menu Pengaturan Akun.',

    s7Title: '7. Ketersediaan Layanan & Pemeliharaan Sistem',
    s7Desc: 'Kami berhak melakukan pemeliharaan rutin (scheduled maintenance) atau pembaruan sistem guna meningkatkan performa, menambahkan fitur baru, serta memperkuat sistem keamanan. Dalam hal pemeliharaan memerlukan waktu henti sementara, Kami akan berupaya memberikan pemberitahuan terlebih dahulu melalui antarmuka aplikasi atau saluran komunikasi resmi.',

    s8Title: '8. Hukum yang Berlaku & Penyelesaian Sengketa',
    s8Desc: 'Syarat dan Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia. Segala perselisihan yang timbul sehubungan dengan pelaksanaan ketentuan ini diupayakan untuk diselesaikan secara musyawarah dan mufakat. Apabila kesepakatan tidak tercapai, para pihak sepakat untuk memilih domisili hukum di Pengadilan Negeri Salatiga, Jawa Tengah.',

    contact: 'Layanan Bantuan & Informasi Hukum',
    contactDesc: 'Untuk pertanyaan resmi terkait ketentuan layanan atau permohonan informasi administratif lainnya, silakan hubungi tim Kami melalui:',
    contactEmail: 'hello.myinvoice@gmail.com',
    contactHours: 'Senin - Jumat | 09:00 - 17:00 WIB',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Jawa Tengah, Indonesia'
  },
  EN: {
    title: 'Terms of Service',
    subtitle: 'Platform Usage Agreement and Terms of Service of PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Last Updated: November 8, 2026',

    s1Title: '1. General Terms & Acceptance',
    s1Desc: 'This document governs the terms and conditions for utilizing the MyInvoice cloud software-as-a-service platform operated by PT. Ramelio Berkah Abadi ("We", "Us"). By registering, accessing, or utilizing any features within MyInvoice, you ("User") acknowledge that you have read, understood, and agreed to be bound by all provisions stated herein.',

    s2Title: '2. Scope & Service Characteristics',
    s2Desc: 'MyInvoice delivers digital solutions designed to streamline business operations, including invoices, payment receipts, price quotations, offline/online POS cashier modules, COGS calculators, and cashflow tracking. The service functions as an administrative enablement tool. Users retain sole responsibility for the commercial accuracy, tax compliance, and legal integrity of their respective business activities.',

    s3Title: '3. Account Security & User Conduct',
    s3Desc: 'Users bear full responsibility for maintaining the confidentiality of their authentication credentials (email and password) and all activities conducted under their account. Users agree not to misuse the platform for unlawful conduct, fraudulent transactions, malware distribution, or reverse-engineering efforts targeting MyInvoice source code or cloud infrastructure.',

    s4Title: '4. Limitation of Liability',
    s4Desc: 'We endeavor to ensure that the platform operates with high availability, stability, and security. However, to the maximum extent permitted by applicable law, PT. Ramelio Berkah Abadi shall not be liable for any indirect, consequential, or incidental damages, lost profits, or operational disruptions stemming from user negligence, local connectivity disruptions, or force majeure events outside our reasonable control.',

    s5Title: '5. Data Ownership & Intellectual Property',
    s5Desc: 'All transaction records, client directories, business branding, and financial entries uploaded by Users remain the exclusive property of the User. Conversely, all proprietary platform components, including visual layouts, codebases, trademarks, and architectural designs, are the intellectual property of PT. Ramelio Berkah Abadi protected by international copyright laws.',

    s6Title: '6. Subscription Plans & Billing Policy',
    s6Desc: 'MyInvoice provides a free tier alongside premium subscription tiers (PRO and ULTIMATE) with transparent feature allocations outlined on our Pricing page. Payments are processed securely via verified gateways. Users retain the liberty to upgrade, downgrade, or cancel recurring plans at any time via Account Settings.',

    s7Title: '7. Platform Availability & Maintenance',
    s7Desc: 'We reserve the right to perform scheduled maintenance and system deployments to enhance stability, roll out features, and patch security vulnerabilities. Whenever maintenance requires temporary downtime, we will endeavor to provide prior notice via application banners or official communication channels.',

    s8Title: '8. Governing Law & Jurisdiction',
    s8Desc: 'These Terms of Service are governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising in connection with this agreement shall first be addressed through good-faith mediation. Failing resolution, the parties agree to submit to the jurisdiction of the District Court of Salatiga, Central Java, Indonesia.',

    contact: 'Support & Legal Inquiries',
    contactDesc: 'For formal inquiries regarding these terms or administrative assistance, please contact our team at:',
    contactEmail: 'hello.myinvoice@gmail.com',
    contactHours: 'Monday - Friday | 09:00 - 17:00 WIB',
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

export default function Terms() {
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
                        Terms
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

                {/* Content Sections */}
                <div className="space-y-6">
                    <Section icon={FileText} title={c.s1Title}>
                        <p className="m-0">{c.s1Desc}</p>
                    </Section>

                    <Section icon={Store} title={c.s2Title}>
                        <p className="m-0">{c.s2Desc}</p>
                    </Section>

                    <Section icon={User} title={c.s3Title}>
                        <p className="m-0">{c.s3Desc}</p>
                    </Section>

                    <Section icon={Shield} title={c.s4Title}>
                        <p className="m-0">{c.s4Desc}</p>
                    </Section>

                    <Section icon={Award} title={c.s5Title}>
                        <p className="m-0">{c.s5Desc}</p>
                    </Section>

                    <Section icon={Layers} title={c.s6Title}>
                        <p className="m-0">{c.s6Desc}</p>
                    </Section>

                    <Section icon={AlertCircle} title={c.s7Title}>
                        <p className="m-0">{c.s7Desc}</p>
                    </Section>

                    <Section icon={Scale} title={c.s8Title}>
                        <p className="m-0">{c.s8Desc}</p>
                    </Section>

                    <Section icon={Mail} title={c.contact}>
                        <p className="mb-4">{c.contactDesc}</p>
                        <a href={`mailto:${c.contactEmail}`} className="inline-flex font-bold text-violet-600 hover:text-violet-700 text-lg sm:text-xl border-b-2 border-violet-200 pb-1 transition-all mb-4">
                            {c.contactEmail}
                        </a>
                        <p className="text-sm opacity-75 m-0">{c.contactHours}</p>
                        <p className="mt-1 text-sm opacity-75">{c.contactLaw}</p>
                    </Section>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
