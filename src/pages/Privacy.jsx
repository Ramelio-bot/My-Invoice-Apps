import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, Download, Mail, Server, Share2, Clock, RefreshCw } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    title: 'Kebijakan Privasi',
    subtitle: 'My Invoice berkomitmen penuh untuk menjaga kerahasiaan, integritas, dan keamanan data pribadi setiap pengguna layanan kami.',
    lastUpdated: 'Berlaku sejak: 1 Maret 2026 · Versi 1.1',
    intro: 'Kebijakan Privasi ini merupakan perjanjian yang mengikat antara Anda ("Pengguna") dan tim My Invoice ("Kami", "My Invoice") yang mengoperasikan platform di myinvoice.space. Dokumen ini menjelaskan secara transparan bagaimana Kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda. Dengan mendaftarkan diri dan menggunakan layanan kami, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan dalam Kebijakan Privasi ini. Jika Anda tidak menyetujui ketentuan ini, mohon hentikan penggunaan layanan.',

    s1Title: 'Data yang Kami Kumpulkan',
    s1Desc: 'Kami mengumpulkan data secara terbatas, proporsional, dan hanya untuk keperluan operasional layanan. Kategori data yang kami proses meliputi:',
    s1List: [
      'Data identitas akun: nama lengkap, alamat email, nomor telepon yang Anda daftarkan',
      'Data profil bisnis: nama toko/usaha, alamat, logo, dan informasi yang Anda isi di pengaturan',
      'Data operasional: invoice, kwitansi, produk, data klien, transaksi kasir, dan dokumen bisnis lainnya yang Anda buat',
      'Data teknis: jenis perangkat, versi browser, alamat IP, zona waktu, dan log aktivitas untuk keperluan keamanan dan debugging',
      'Data langganan: jenis plan yang aktif dan riwayat pembayaran (kami tidak menyimpan detail kartu kredit — diproses langsung oleh Mayar.id)',
    ],

    s2Title: 'Tujuan Penggunaan Data',
    s2Desc: 'Setiap data yang kami kumpulkan memiliki tujuan yang jelas dan proporsional. Kami menggunakan data Anda untuk:',
    s2List: [
      'Mengoperasikan, memelihara, dan meningkatkan seluruh fitur layanan My Invoice',
      'Memverifikasi identitas, mengelola autentikasi, dan menjaga keamanan akun Anda',
      'Memproses transaksi langganan dan mengelola siklus billing',
      'Memberikan dukungan teknis, merespons pertanyaan, dan menyelesaikan keluhan',
      'Mengirimkan notifikasi penting terkait akun, perubahan layanan, atau pembaruan sistem',
      'Menganalisis pola penggunaan secara agregat (anonim) untuk pengembangan produk yang lebih baik',
      'Memenuhi kewajiban hukum berdasarkan peraturan perundang-undangan Republik Indonesia',
    ],
    s2Highlight: '🔒 Komitmen Kami: Data Anda tidak akan pernah dijual, disewakan, atau dimonetisasi kepada pihak ketiga dalam bentuk apapun. Anda adalah pelanggan kami — bukan produk kami.',

    s3Title: 'Keamanan & Infrastruktur Data',
    s3Desc: 'My Invoice mengimplementasikan kontrol keamanan berlapis yang mengacu pada standar industri internasional:',
    s3List: [
      'Enkripsi end-to-end menggunakan TLS 1.3 untuk seluruh transmisi data antara browser Anda dan server kami',
      'Data at-rest dienkripsi menggunakan AES-256 pada infrastruktur Supabase yang tersertifikasi SOC 2 Type II',
      'Row Level Security (RLS) di level database — data setiap pengguna terisolasi dan tidak dapat diakses oleh pengguna lain',
      'Backup otomatis terenkripsi dengan retensi point-in-time recovery',
      'Kontrol akses internal berbasis prinsip least privilege — hanya personel berwenang yang dapat mengakses data produksi',
      'Pemantauan anomali dan sistem deteksi intrusi secara real-time',
    ],
    s3Note: 'Meskipun kami menerapkan standar keamanan terbaik, tidak ada sistem digital yang dapat menjamin keamanan absolut. Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun dan segera melaporkan aktivitas mencurigakan kepada kami.',

    s4Title: 'Pengungkapan kepada Pihak Ketiga',
    s4Desc: 'Kami beroperasi dengan prinsip data minimization. Data Anda hanya dibagikan kepada pihak ketiga dalam kondisi berikut yang sangat terbatas:',
    s4List: [
      'Sub-prosesor teknis yang terikat Data Processing Agreement (DPA) dengan Kami: Supabase (penyimpanan & database), Vercel (hosting & CDN), dan Mayar.id (pemrosesan pembayaran)',
      'Kewajiban hukum: apabila diwajibkan oleh perintah pengadilan, regulasi, atau permintaan resmi dari otoritas pemerintah yang berwenang di Indonesia',
      'Perlindungan hak dan keselamatan: dalam situasi darurat untuk melindungi keamanan pengguna, pihak ketiga, atau kepentingan publik',
      'Peristiwa korporasi: jika terjadi merger, akuisisi, atau restrukturisasi bisnis, pengguna akan diberitahu minimal 30 hari sebelumnya dan memiliki opsi untuk menghapus akunnya',
    ],

    s5Title: 'Hak-Hak Anda sebagai Pengguna',
    s5Desc: 'Sesuai dengan prinsip perlindungan data dan UU Perlindungan Data Pribadi (UU PDP) Republik Indonesia, Anda memiliki hak-hak berikut yang dapat Anda gunakan kapan saja:',
    s5List: [
      'Hak Akses (Right of Access): meminta konfirmasi apakah kami memproses data Anda dan memperoleh salinannya',
      'Hak Koreksi (Right of Rectification): memperbaiki data yang tidak akurat, tidak lengkap, atau sudah tidak relevan',
      'Hak Penghapusan (Right of Erasure): meminta penghapusan akun dan seluruh data terkait secara permanen',
      'Hak Portabilitas (Right of Portability): menerima data Anda dalam format terstruktur dan dapat dibaca mesin (JSON/CSV)',
      'Hak Keberatan (Right to Object): menolak pemrosesan data untuk tujuan tertentu, termasuk pemasaran langsung',
      'Hak Pembatasan (Right to Restriction): meminta pembatasan pemrosesan data dalam kondisi tertentu yang diatur oleh hukum',
    ],
    s5Note: 'Untuk menggunakan hak-hak di atas, silakan kirim permintaan tertulis ke hello.myinvoice@gmail.com. Kami berkomitmen untuk merespons dan menyelesaikan setiap permintaan dalam waktu maksimal 14 hari kerja sejak permintaan diterima.',

    s6Title: 'Retensi & Penghapusan Data',
    s6Desc: 'Kami menyimpan data Anda hanya selama diperlukan untuk tujuan yang ditetapkan. Berikut kebijakan retensi kami:',
    s6List: [
      'Data akun aktif: disimpan selama akun Anda aktif digunakan',
      'Pasca penghapusan akun: data operasional dihapus dalam 30 hari kalender; log sistem dihapus dalam 90 hari',
      'Data yang diwajibkan hukum: beberapa data tertentu mungkin perlu dipertahankan lebih lama sesuai ketentuan perpajakan atau regulasi yang berlaku',
      'Akun tidak aktif > 24 bulan: kami berhak menonaktifkan akun setelah mengirimkan pemberitahuan email minimal 30 hari sebelumnya',
      'Backup: data dihapus dari sistem backup dalam siklus maksimal 90 hari setelah penghapusan dari sistem aktif',
    ],

    s7Title: 'Pembaruan Kebijakan',
    s7Desc: 'My Invoice berhak memperbarui Kebijakan Privasi ini untuk mencerminkan perubahan pada praktik layanan, persyaratan hukum, atau peningkatan standar privasi. Setiap pembaruan material akan dikomunikasikan melalui notifikasi email ke alamat terdaftar Anda and banner pengumuman di dalam aplikasi, minimal 14 hari sebelum perubahan berlaku. Versi terbaru kebijakan ini selalu tersedia di myinvoice.space/privacy. Penggunaan layanan secara berkelanjutan setelah tanggal berlakunya pembaruan merupakan penerimaan Anda terhadap perubahan tersebut.',

    s8Title: 'Hubungi Tim Privasi Kami',
    s8Desc: 'Untuk pertanyaan, permintaan hak data, atau pelaporan insiden privasi, silakan hubungi kami melalui:',
    s8Email: 'hello.myinvoice@gmail.com',
    s8Hours: 'Senin – Jumat, 09.00 – 17.00 WIB. Kami berkomitmen merespons dalam 1×24 jam kerja.',
    s8Law: 'Kebijakan Privasi ini tunduk pada dan ditafsirkan berdasarkan hukum Negara Republik Indonesia, termasuk namun tidak terbatas pada UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi.',
  },

  EN: {
    title: 'Privacy Policy',
    subtitle: 'My Invoice is fully committed to protecting the confidentiality, integrity, and security of every user\'s personal data.',
    lastUpdated: 'Effective Date: March 1, 2026 · Version 1.1',
    intro: 'This Privacy Policy constitutes a binding agreement between you ("User") and the My Invoice team ("We", "My Invoice") operating the platform at myinvoice.space. This document transparently explains how We collect, use, store, and protect your personal data. By registering and using our service, you acknowledge that you have read, understood, and agreed to all provisions in this Privacy Policy. If you do not agree to these terms, please discontinue use of the service.',

    s1Title: 'Data We Collect',
    s1Desc: 'We collect data in a limited, proportionate manner, solely for operational service purposes. Categories of data we process include:',
    s1List: [
      'Account identity data: full name, email address, phone number you register with',
      'Business profile data: store/business name, address, logo, and information you complete in settings',
      'Operational data: invoices, receipts, products, client data, POS transactions, and other business documents you create',
      'Technical data: device type, browser version, IP address, time zone, and activity logs for security and debugging purposes',
      'Subscription data: active plan type and payment history (we do not store credit card details — processed directly by Mayar.id)',
    ],

    s2Title: 'How We Use Your Data',
    s2Desc: 'Every piece of data we collect has a clear and proportionate purpose. We use your data to:',
    s2List: [
      'Operate, maintain, and continuously improve all My Invoice service features',
      'Verify identity, manage authentication, and safeguard the security of your account',
      'Process subscription transactions and manage billing cycles',
      'Provide technical support, respond to inquiries, and resolve complaints',
      'Send critical notifications regarding your account, service changes, or system updates',
      'Analyze aggregated, anonymized usage patterns for product development purposes',
      'Fulfill legal obligations under applicable laws and regulations of the Republic of Indonesia',
    ],
    s2Highlight: '🔒 Our Commitment: Your data will never be sold, rented, or monetized to any third party in any form. You are our customer — not our product.',

    s3Title: 'Security & Data Infrastructure',
    s3Desc: 'My Invoice implements multi-layered security controls aligned with international industry standards:',
    s3List: [
      'End-to-end encryption using TLS 1.3 for all data transmission between your browser and our servers',
      'Data at-rest encrypted using AES-256 on Supabase infrastructure certified to SOC 2 Type II',
      'Row Level Security (RLS) at the database level — each user\'s data is isolated and inaccessible to other users',
      'Automated encrypted backups with point-in-time recovery retention',
      'Internal access controls based on least privilege principles — only authorized personnel can access production data',
      'Real-time anomaly monitoring and intrusion detection systems',
    ],
    s3Note: 'While we implement the highest security standards, no digital system can guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials and promptly reporting any suspicious activity to us.',

    s4Title: 'Disclosure to Third Parties',
    s4Desc: 'We operate on a data minimization principle. Your data is shared with third parties only under the following strictly limited conditions:',
    s4List: [
      'Technical sub-processors bound by Data Processing Agreements (DPAs) with Us: Supabase (storage & database), Vercel (hosting & CDN), and Mayar.id (payment processing)',
      'Legal obligations: when required by court order, regulation, or official request from authorized Indonesian government authorities',
      'Protection of rights and safety: in emergency situations to protect the safety of users, third parties, or the public interest',
      'Corporate events: in the event of a merger, acquisition, or business restructuring, users will be notified at least 30 days in advance and provided with the option to delete their account',
    ],

    s5Title: 'Your Rights as a User',
    s5Desc: 'In accordance with data protection principles and the Indonesian Personal Data Protection Law (UU PDP), you have the following rights which you may exercise at any time:',
    s5List: [
      'Right of Access: request confirmation of whether we process your data and obtain a copy',
      'Right of Rectification: correct data that is inaccurate, incomplete, or no longer relevant',
      'Right of Erasure: request permanent deletion of your account and all associated data',
      'Right of Portability: receive your data in a structured, machine-readable format (JSON/CSV)',
      'Right to Object: refuse data processing for certain purposes, including direct marketing',
      'Right to Restriction: request limitation of data processing under certain legally defined conditions',
    ],
    s5Note: 'To exercise the rights above, please send a written request to hello.myinvoice@gmail.com. We are committed to responding to and resolving every request within a maximum of 14 business days from receipt.',

    s6Title: 'Data Retention & Deletion',
    s6Desc: 'We retain your data only for as long as necessary for the stated purposes. Our retention policy is as follows:',
    s6List: [
      'Active account data: retained for as long as your account is in active use',
      'Post-account deletion: operational data deleted within 30 calendar days; system logs deleted within 90 days',
      'Legally mandated data: certain data may need to be retained longer in compliance with tax or regulatory requirements',
      'Accounts inactive for more than 24 months: we reserve the right to deactivate accounts after sending email notification at least 30 days in advance',
      'Backups: data removed from backup systems within a maximum 90-day cycle after deletion from active systems',
    ],

    s7Title: 'Policy Updates',
    s7Desc: 'My Invoice reserves the right to update this Privacy Policy to reflect changes in service practices, legal requirements, or enhanced privacy standards. Any material updates will be communicated via email notification to your registered address and an in-app announcement banner, at least 14 days before the changes take effect. The latest version of this policy is always available at myinvoice.space/privacy. Continued use of the service after the effective date of an update constitutes your acceptance of the changes.',

    s8Title: 'Contact Our Privacy Team',
    s8Desc: 'For questions, data rights requests, or reporting of privacy incidents, please contact us via:',
    s8Email: 'hello.myinvoice@gmail.com',
    s8Hours: 'Monday – Friday, 9:00 AM – 5:00 PM WIB. We are committed to responding within 1 business day.',
    s8Law: 'This Privacy Policy is governed by and interpreted in accordance with the laws of the Republic of Indonesia, including but not limited to Law No. 27 of 2022 on Personal Data Protection (UU PDP).',
  }
};

export default function Privacy() {
    const { lang } = useLang();
    const navigate = useNavigate();
    const { user } = useAuth();
    const c = copy[lang];

    const Section = ({ icon: Icon, title, children }) => (
        <div className="p-8 md:p-10 rounded-3xl mb-8 border transition-all bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                    <Icon size={24} />
                </div>
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            <div className="text-lg leading-relaxed text-slate-600" style={{ textAlign: 'justify', hyphens: 'auto' }}>
                {children}
            </div>
        </div>
    );

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
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                        {c.title}
                    </h1>
                    <p className="text-xl mb-4 text-slate-600">
                        {c.subtitle}
                    </p>
                    <div className="inline-block px-4 py-2 rounded-lg text-sm font-semibold bg-white text-slate-500 border border-slate-200 shadow-sm">
                        {c.lastUpdated}
                    </div>
                </div>

                {/* Intro */}
                <div className="mb-12 p-8 rounded-3xl bg-violet-50/50 border border-violet-100">
                    <p className="text-lg leading-relaxed text-slate-600" style={{ textAlign: 'justify', hyphens: 'auto' }}>
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
                        <p className="mb-4">{c.s2Desc}</p>
                        <ul className="list-disc pl-6 mb-6 space-y-2 marker:text-violet-500">
                            {c.s2List.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                        <div className="p-4 rounded-xl border bg-violet-50 border-violet-200">
                            <span className="font-bold text-violet-600">
                                {c.s2Highlight}
                            </span>
                        </div>
                    </Section>

                    <Section icon={Server} title={c.s3Title}>
                        <p className="mb-4">{c.s3Desc}</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-violet-500">
                            {c.s3List.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                        <p className="mt-4 text-sm italic opacity-75">{c.s3Note}</p>
                    </Section>

                    <Section icon={Share2} title={c.s4Title}>
                        <p className="mb-4">{c.s4Desc}</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-violet-500">
                            {c.s4List.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </Section>

                    <Section icon={Download} title={c.s5Title}>
                        <p className="mb-4">{c.s5Desc}</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-violet-500">
                            {c.s1List.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                        <p className="mt-4 text-sm opacity-75">{c.s5Note}</p>
                    </Section>

                    <Section icon={Clock} title={c.s6Title}>
                        <p className="mb-4">{c.s6Desc}</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-violet-500">
                            {c.s6List.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </Section>

                    <Section icon={RefreshCw} title={c.s7Title}>
                        <p>{c.s7Desc}</p>
                    </Section>

                    <Section icon={Mail} title={c.s8Title}>
                        <p className="mb-4">{c.s8Desc}</p>
                        <a href={`mailto:${c.s8Email}`} className="inline-flex font-bold text-violet-600 hover:text-violet-700 text-xl border-b-2 border-violet-200 pb-1 translate-y-0 transition-all hover:-translate-y-1 mb-4">
                            {c.s8Email}
                        </a>
                        <p className="text-sm opacity-75">{c.s8Hours}</p>
                        <p className="mt-2 text-sm opacity-75">{c.s8Law}</p>
                    </Section>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
