import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, Download, Mail, Server, Share2, Clock, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const copy = {
  ID: {
    title: 'Kebijakan Privasi',
    subtitle: 'My Invoice berkomitmen untuk menjaga kerahasiaan dan keamanan data pribadi Anda sebagai pengguna layanan kami.',
    lastUpdated: 'Berlaku sejak: 1 Maret 2026',
    intro: 'Kebijakan Privasi ini merupakan komitmen PT My Invoice Indonesia ("Kami" atau "My Invoice") untuk menjaga kerahasiaan data, termasuk data pribadi dari pengguna dan/atau pedagang ("Anda") yang mengakses dan menggunakan layanan pada alamat myinvoice.space beserta seluruh produk dan layanan yang Kami sediakan (selanjutnya disebut "Layanan"). Dengan mendaftarkan diri dan menggunakan Layanan kami, Anda menyatakan bahwa Anda telah membaca, memahami, dan menyetujui seluruh ketentuan dalam Kebijakan Privasi ini.',

    s1Title: 'Informasi yang Kami Kumpulkan',
    s1Desc: 'Kami mengumpulkan data pengguna pada saat pendaftaran akun, penggunaan Layanan, dan transaksi yang dilakukan melalui platform. Data yang dikumpulkan meliputi, namun tidak terbatas pada:',
    s1List: [
      'Data identitas: nama lengkap, alamat email, nomor telepon',
      'Data profil bisnis: nama toko, alamat usaha, logo perusahaan',
      'Data transaksi: riwayat penjualan, data produk, data klien yang Anda masukkan',
      'Data teknis: jenis perangkat, browser, alamat IP, dan log aktivitas penggunaan',
      'Data pembayaran: informasi langganan plan yang digunakan (tidak termasuk data kartu kredit)',
    ],

    s2Title: 'Penggunaan Data',
    s2Desc: 'Kami menggunakan data yang dikumpulkan untuk tujuan berikut:',
    s2List: [
      'Memproses dan menjalankan seluruh transaksi serta aktivitas yang dilakukan melalui Layanan',
      'Mengelola akun, autentikasi, dan keamanan pengguna',
      'Meningkatkan, memperbaiki, dan mengembangkan fitur Layanan',
      'Memberikan dukungan teknis dan layanan pelanggan',
      'Mengirimkan notifikasi terkait Layanan, pembaruan sistem, dan informasi akun',
      'Mematuhi kewajiban hukum dan peraturan perundang-undangan yang berlaku di Republik Indonesia',
    ],
    s2Highlight: 'Data Anda tidak akan pernah dijual, disewakan, atau diperjualbelikan kepada pihak ketiga manapun untuk kepentingan komersial.',

    s3Title: 'Keamanan dan Penyimpanan Data',
    s3Desc: 'My Invoice menggunakan infrastruktur berstandar industri untuk melindungi data Anda:',
    s3List: [
      'Enkripsi SSL/TLS berlapis untuk seluruh transmisi data antara perangkat Anda dan server kami',
      'Penyimpanan data menggunakan Supabase Cloud dengan standar keamanan SOC 2 Type II',
      'Pencadangan data terenkripsi secara berkala untuk mencegah kehilangan data',
      'Pembatasan akses data internal berdasarkan prinsip least privilege',
      'Pemantauan keamanan sistem secara berkelanjutan',
    ],
    s3Note: 'Meskipun Kami menerapkan langkah-langkah keamanan terbaik, tidak ada sistem yang sepenuhnya kebal terhadap risiko. Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda.',

    s4Title: 'Pengungkapan Data kepada Pihak Ketiga',
    s4Desc: 'Kami dapat mengungkapkan data Anda kepada pihak ketiga hanya dalam kondisi berikut:',
    s4List: [
      'Penyedia layanan infrastruktur teknis yang terikat perjanjian kerahasiaan dengan Kami (antara lain: Supabase untuk penyimpanan data, Vercel untuk hosting)',
      'Kewajiban hukum berdasarkan perintah pengadilan, peraturan perundang-undangan, atau permintaan otoritas pemerintah yang berwenang',
      'Perlindungan hak, kepemilikan, atau keselamatan My Invoice, pengguna, atau pihak lain yang diperlukan',
      'Pengalihan bisnis: jika My Invoice melakukan merger, akuisisi, atau penjualan aset, data pengguna dapat dialihkan dengan pemberitahuan terlebih dahulu',
    ],

    s5Title: 'Hak-Hak Pengguna',
    s5Desc: 'Sesuai dengan peraturan perlindungan data yang berlaku, Anda memiliki hak-hak berikut atas data pribadi Anda:',
    s5List: [
      'Hak akses: meminta salinan data pribadi yang Kami simpan',
      'Hak koreksi: memperbarui atau memperbaiki data yang tidak akurat',
      'Hak penghapusan: meminta penghapusan akun dan seluruh data terkait',
      'Hak portabilitas: mengekspor data Anda dalam format yang dapat dibaca mesin',
      'Hak keberatan: menolak pemrosesan data untuk tujuan tertentu',
    ],
    s5Note: 'Untuk menggunakan hak-hak tersebut, silakan hubungi tim kami melalui kontak yang tersedia. Kami akan merespons permintaan dalam waktu maksimal 14 hari kerja.',

    s6Title: 'Retensi Data',
    s6Desc: 'Kami menyimpan data Anda selama akun Anda aktif dan diperlukan untuk menjalankan Layanan. Ketentuan retensi data:',
    s6List: [
      'Data akun aktif: disimpan selama Anda menggunakan Layanan',
      'Setelah penghapusan akun: data dihapus dalam waktu 30 hari kerja, kecuali diwajibkan oleh hukum untuk disimpan lebih lama',
      'Log sistem dan data teknis: disimpan maksimal 12 bulan untuk keperluan keamanan dan audit',
      'Akun tidak aktif lebih dari 24 bulan: Kami berhak menonaktifkan akun setelah pemberitahuan melalui email',
    ],

    s7Title: 'Pembaruan Kebijakan Privasi',
    s7Desc: 'My Invoice berhak untuk mengubah atau memperbarui Kebijakan Privasi ini sewaktu-waktu. Setiap perubahan material akan diberitahukan kepada Anda melalui email terdaftar atau notifikasi dalam aplikasi minimal 7 hari sebelum perubahan berlaku. Penggunaan Layanan secara berkelanjutan setelah pemberitahuan tersebut dianggap sebagai persetujuan Anda terhadap kebijakan yang diperbarui.',

    s8Title: 'Hubungi Kami',
    s8Desc: 'Jika Anda memiliki pertanyaan, keluhan, atau permintaan terkait Kebijakan Privasi ini atau pengelolaan data pribadi Anda, silakan hubungi tim kami:',
    s8Email: 'support@myinvoice.space',
    s8Hours: 'Senin – Sabtu, 08.00 – 17.00 WIB. Respons dalam 1x24 jam kerja.',
    s8Law: 'Kebijakan Privasi ini diatur oleh dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.',
  },

  EN: {
    title: 'Privacy Policy',
    subtitle: 'My Invoice is committed to protecting the confidentiality and security of your personal data as a user of our services.',
    lastUpdated: 'Effective Date: March 1, 2026',
    intro: 'This Privacy Policy represents the commitment of PT My Invoice Indonesia ("We" or "My Invoice") to safeguard the confidentiality of data, including personal data of users and/or merchants ("You") who access and use the services at myinvoice.space and all products and services We provide (hereinafter referred to as the "Service"). By registering and using our Service, you acknowledge that you have read, understood, and agreed to all provisions in this Privacy Policy.',

    s1Title: 'Information We Collect',
    s1Desc: 'We collect user data during account registration, Service usage, and transactions conducted through the platform. Data collected includes, but is not limited to:',
    s1List: [
      'Identity data: full name, email address, phone number',
      'Business profile data: store name, business address, company logo',
      'Transaction data: sales history, product data, client information you input',
      'Technical data: device type, browser, IP address, and activity logs',
      'Payment data: subscription plan information (excludes credit card data)',
    ],

    s2Title: 'Use of Data',
    s2Desc: 'We use the collected data for the following purposes:',
    s2List: [
      'Processing and executing all transactions and activities conducted through the Service',
      'Managing accounts, authentication, and user security',
      'Improving, fixing, and developing Service features',
      'Providing technical support and customer service',
      'Sending notifications related to the Service, system updates, and account information',
      'Complying with legal obligations and regulations applicable in the Republic of Indonesia',
    ],
    s2Highlight: 'Your data will never be sold, rented, or traded to any third party for commercial purposes.',

    s3Title: 'Data Security and Storage',
    s3Desc: 'My Invoice uses industry-standard infrastructure to protect your data:',
    s3List: [
      'Multi-layered SSL/TLS encryption for all data transmission between your device and our servers',
      'Data storage using Supabase Cloud with SOC 2 Type II security standards',
      'Periodic encrypted data backups to prevent data loss',
      'Internal data access restriction based on least privilege principles',
      'Continuous system security monitoring',
    ],
    s3Note: 'While we implement the best security measures, no system is completely immune to risk. You are responsible for maintaining the confidentiality of your account credentials.',

    s4Title: 'Disclosure of Data to Third Parties',
    s4Desc: 'We may disclose your data to third parties only under the following conditions:',
    s4List: [
      'Technical infrastructure service providers bound by confidentiality agreements with Us (including: Supabase for data storage, Vercel for hosting)',
      'Legal obligations based on court orders, legislation, or requests from authorized government authorities',
      'Protection of the rights, property, or safety of My Invoice, users, or others as required',
      'Business transfer: if My Invoice undergoes a merger, acquisition, or asset sale, user data may be transferred with prior notice',
    ],

    s5Title: 'User Rights',
    s5Desc: 'In accordance with applicable data protection regulations, you have the following rights over your personal data:',
    s5List: [
      'Right of access: request a copy of the personal data We store',
      'Right of rectification: update or correct inaccurate data',
      'Right of erasure: request deletion of your account and all related data',
      'Right of portability: export your data in machine-readable format',
      'Right to object: refuse data processing for certain purposes',
    ],
    s5Note: 'To exercise these rights, please contact our team through the available contact. We will respond to requests within a maximum of 14 business days.',

    s6Title: 'Data Retention',
    s6Desc: 'We retain your data as long as your account is active and necessary to operate the Service. Data retention provisions:',
    s6List: [
      'Active account data: stored as long as you use the Service',
      'After account deletion: data deleted within 30 business days, unless required by law to be retained longer',
      'System logs and technical data: stored for a maximum of 12 months for security and audit purposes',
      'Accounts inactive for more than 24 months: We reserve the right to deactivate accounts after email notification',
    ],

    s7Title: 'Privacy Policy Updates',
    s7Desc: 'My Invoice reserves the right to modify or update this Privacy Policy at any time. Any material changes will be communicated to you via your registered email or in-app notification at least 7 days before the changes take effect. Continued use of the Service after such notification is deemed as your consent to the updated policy.',

    s8Title: 'Contact Us',
    s8Desc: 'If you have questions, complaints, or requests regarding this Privacy Policy or the management of your personal data, please contact our team:',
    s8Email: 'support@myinvoice.space',
    s8Hours: 'Monday – Saturday, 8 AM – 5 PM WIB. Response within 1×24 business hours.',
    s8Law: 'This Privacy Policy is governed by and interpreted in accordance with the laws of the Republic of Indonesia.',
  }
}

export default function Privacy() {
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
            <div className={`text-lg leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
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
                        Privacy
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

                {/* Intro */}
                <div className={`mb-12 p-8 rounded-3xl ${dark ? 'bg-slate-800/30' : 'bg-violet-50/50'} border ${dark ? 'border-slate-700' : 'border-violet-100'}`}>
                    <p className={`text-lg leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
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
                        <div className={`p-4 rounded-xl border ${dark ? 'bg-violet-900/20 border-violet-500/30' : 'bg-violet-50 border-violet-200'}`}>
                            <span className="font-bold text-violet-600 dark:text-violet-400">
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
                            {c.s5List.map((item, i) => <li key={i}>{item}</li>)}
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
                        <a href={`mailto:${c.s8Email}`} className="inline-flex font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 text-xl border-b-2 border-violet-200 dark:border-violet-900 pb-1 translate-y-0 transition-all hover:-translate-y-1 mb-4">
                            {c.s8Email}
                        </a>
                        <p className="text-sm opacity-75">{c.s8Hours}</p>
                        <p className="mt-2 text-sm opacity-75">{c.s8Law}</p>
                    </Section>
                </div>

            </div>
        </div>
    );
}
