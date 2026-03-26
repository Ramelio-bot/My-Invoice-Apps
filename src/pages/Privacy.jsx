import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, Download, Mail, Server, Share2, Clock, RefreshCw } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    title: 'Kebijakan Privasi',
    subtitle: 'Komitmen PT. Ramelio Berkah Abadi dalam melindungi kedaulatan dan privasi data Anda.',
    lastUpdated: 'Berlaku sejak: 26 Maret 2026 · Versi 1.2',
    intro: 'Kebijakan ini menjelaskan bagaimana Kami mengelola dan melindungi data pribadi Anda sesuai dengan UU Perlindungan Data Pribadi (PDP) No. 27/2022. Dengan menggunakan layanan, Anda secara sadar memberikan persetujuan atas pemrosesan data sebagaimana dijelaskan di bawah ini.',

    s1Title: 'Data yang Dikumpulkan',
    s1Desc: 'Kami hanya mengumpulkan data yang diperlukan untuk operasional fungsionalitas aplikasi, mencakup:',
    s1List: [
      'Informasi Identitas: Nama lengkap, alamat email, dan nomor telepon terverifikasi.',
      'Informasi Bisnis: Data transaksi, profil klien, dan catatan finansial yang diinput secara mandiri.',
      'Informasi Teknis: Alamat IP, jenis perangkat, dan log aktivitas demi keamanan akun.'
    ],

    s2Title: 'Penyimpanan & Keamanan Berlapis',
    s2Desc: 'Data Anda disimpan menggunakan enkripsi standar industri pada infrastruktur Supabase. PT. Ramelio Berkah Abadi melakukan upaya teknis terbaik untuk mencegah akses tanpa izin, namun Anda mengakui bahwa tidak ada metode transmisi internet yang menjamin keamanan mutlak.',

    s3Title: 'Prinsip Penggunaan Data',
    s3Desc: 'Data digunakan secara eksklusif untuk sinkronisasi layanan dan pengembangan fitur My Invoice. Kami menjamin bahwa PT. Ramelio Berkah Abadi tidak menjual, menyewakan, atau mendistribusikan data transaksi bisnis Anda kepada pihak ketiga untuk tujuan periklanan.',

    s4Title: 'Hak Subjek Data (UU PDP)',
    s4Desc: 'Sesuai UU PDP, Anda memiliki hak penuh untuk mengakses, memperbarui, atau meminta penghapusan data secara permanen dari database Kami melalui sistem atau kontak dukungan.',

    s5Title: 'Klausul Bahasa yang Berlaku',
    s5Desc: 'Dalam hal terjadi perbedaan penafsiran atau pertentangan antara versi Bahasa Indonesia dan Bahasa Inggris, maka versi Bahasa Indonesia yang akan berlaku dan mengikat secara hukum.',

    s8Title: 'Dukungan & Pelaporan Privasi',
    s8Desc: 'Untuk permintaan penghapusan data atau laporan terkait kerahasiaan data, silakan hubungi petugas pelindung data kami:',
    s8Email: 'privacy@myinvoice.space',
    s8Hours: 'Respon resmi diberikan dalam 2x24 Jam Kerja',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Indonesia'
  },
  EN: {
    title: 'Privacy Policy',
    subtitle: 'The commitment of PT. Ramelio Berkah Abadi to protecting your data sovereignty.',
    lastUpdated: 'Effective: March 26, 2026 · Version 1.2',
    intro: 'This policy explains how we manage and protect your personal data in compliance with Indonesian Law (UU PDP). By using the service, you consciously provide consent for data processing as described below.',

    s1Title: 'Data Collection',
    s1Desc: 'We only collect data necessary for operational app functionality, including:',
    s1List: [
      'Identity Information: Full name, email address, and verified phone number.',
      'Business Information: Transaction data, client profiles, and financial records independently entered.',
      'Technical Information: IP address, device type, and activity logs for account security.'
    ],

    s2Title: 'Storage & Multi-Layered Security',
    s2Desc: 'Your data is stored using industry-standard encryption on Supabase infrastructure. PT. Ramelio Berkah Abadi makes best technical efforts to prevent unauthorized access, but you acknowledge that no internet transmission method guarantees absolute security.',

    s3Title: 'Data Usage Principles',
    s3Desc: 'Data is used exclusively for service synchronization and My Invoice feature development. We guarantee that PT. Ramelio Berkah Abadi does not sell, rent, or distribute your business data to third parties for advertising purposes.',

    s4Title: 'Data Subject Rights (Privacy Law)',
    s4Desc: 'Under Indonesian Privacy Law, you have the full right to access, update, or request permanent deletion of your data from our servers via account settings or support contact.',

    s5Title: 'Governing Language Clause',
    s5Desc: 'In the event of discrepancies or conflicts in interpretation between the Indonesian and English versions, the Indonesian version shall prevail and be legally binding.',

    s8Title: 'Privacy Support & Reporting',
    s8Desc: 'For data deletion requests or reports regarding data confidentiality, please contact our data protection officer:',
    s8Email: 'privacy@myinvoice.space',
    s8Hours: 'Official response provided within 2x24 Business Hours',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Indonesia'
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
                        <a href={`mailto:${c.s8Email}`} className="inline-flex font-bold text-violet-600 hover:text-violet-700 text-xl border-b-2 border-violet-200 pb-1 translate-y-0 transition-all hover:-translate-y-1 mb-4">
                            {c.s8Email}
                        </a>
                        <p className="text-sm opacity-75">{c.s8Hours}</p>
                        <p className="mt-2 text-sm opacity-75">{c.contactLaw}</p>
                    </Section>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
