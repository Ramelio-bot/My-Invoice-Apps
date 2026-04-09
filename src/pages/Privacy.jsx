import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, Download, Mail, Server, Share2, Clock, RefreshCw } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    title: 'Kebijakan Perlindungan Data & Privasi',
    subtitle: 'Standar Protokol Keamanan Informasi PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Revisi: 26 Maret 2026 | Versi 2.0.1 (Enterprise)',
    intro: 'PT. Ramelio Berkah Abadi menempatkan kedaulatan informasi Pengguna sebagai prioritas tertinggi. Kebijakan ini merupakan manifestasi kepatuhan Kami terhadap Undang-Undang Perlindungan Data Pribadi (PDP) No. 27/2022. Dengan melanjutkan penggunaan sistem, Pengguna memberikan persetujuan eksplisit atas metodologi pengumpulan, pemrosesan, dan penyimpanan data sebagaimana diatur di bawah ini.',

    s1Title: '1. Klasifikasi Data yang Dikumpulkan',
    s1Desc: 'Kami mengumpulkan metadata dan data primer secara terukur guna menunjang stabilitas operasional, yang meliputi:',
    s1List: [
      'Data Identitas Utama: Nama lengkap legal, alamat korespondensi elektronik, dan verifikasi nomor seluler.',
      'Data Inventaris Bisnis: Seluruh catatan transaksi, entitas klien, dan parameter finansial yang dimasukkan secara volunter oleh Pengguna.',
      'Metadata Teknis: Alamat IP statis/dinamis, log otentikasi, jejak aktivitas sistem, dan identifikasi unik perangkat (UUID).'
    ],

    s2Title: '2. Protokol Penyimpanan & Integritas Data',
    s2Desc: 'Data Pengguna disimpan dalam repositori terenkripsi menggunakan algoritma standar militer pada infrastruktur komputasi awan Supabase. Kami menerapkan prosedur "Zero Trust Architecture" untuk meminimalisir risiko akses ilegal. Namun, Pengguna mengakui bahwa risiko siber bersifat dinamis dan PT. Ramelio Berkah Abadi tidak menjamin kekebalan mutlak terhadap serangan siber terstruktur tingkat tinggi.',

    s3Title: '3. Pemanfaatan & Kerahasiaan Informasi',
    s3Desc: 'Informasi digunakan secara eksklusif untuk penyelarasan data lintas perangkat dan optimalisasi algoritma aplikasi. PT. Ramelio Berkah Abadi memberikan jaminan hukum bahwa Kami tidak akan melakukan komersialisasi, penjualan, atau pendistribusian data transaksi bisnis Pengguna kepada broker iklan atau pihak ketiga mana pun tanpa mandat pengadilan.',

    s4Title: '4. Hak Konstitusional Subjek Data',
    s4Desc: 'Berdasarkan regulasi PDP, Pengguna memiliki hak absolut untuk melakukan audit, pembaruan, atau permintaan penghapusan data secara permanen ("Right to be Forgotten") melalui mekanisme yang disediakan di dalam Dashboard My Invoice.',

    s5Title: '5. Klausul Penafsir Bahasa (Governing Language)',
    s5Desc: 'Kebijakan ini disusun dalam format Bilingual. Dalam hal ditemukan ketidakselarasan makna atau interpretasi antara versi Bahasa Indonesia dan Bahasa Inggris, maka versi Bahasa Indonesia akan dinyatakan sebagai naskah utama yang berlaku secara hukum (Prevailing Language).',

    s8Title: '6. Pusat Pengaduan Privasi',
    s8Desc: 'Jika ditemukan indikasi kebocoran data atau permintaan teknis terkait penghapusan informasi sensitif, silakan hubungi Data Protection Officer (DPO) Kami:',
    s8Email: 'hello.myinvoice@gmail.com',
    s8Hours: 'Estimasi Respon: 2x24 Jam Kerja',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Indonesia'
  },
  EN: {
    title: 'Data Protection & Privacy Policy',
    subtitle: 'Information Security Protocol Standard of PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Revision: March 26, 2026 | Version 2.0.1 (Enterprise)',
    intro: 'PT. Ramelio Berkah Abadi places the sovereignty of User information as the highest priority. This policy is a manifestation of our compliance with the Indonesian Personal Data Protection Law (UU PDP) No. 27/2022. By continuing to use the system, the User provides explicit consent for the methodology of data collection, processing, and storage as regulated below.',

    s1Title: '1. Classification of Collected Data',
    s1Desc: 'We collect metadata and primary data in a measurable manner to support operational stability, which includes:',
    s1List: [
      'Primary Identity Data: Legal full name, email address, and verified mobile number.',
      'Business Inventory Data: All transaction records, client entities, and financial parameters voluntarily entered by the User.',
      'Technical Metadata: Static/dynamic IP addresses, authentication logs, system activity traces, and unique device identification (UUID).'
    ],

    s2Title: '2. Storage Protocols & Data Integrity',
    s2Desc: 'User data is stored in encrypted repositories using military-grade algorithms on Supabase cloud infrastructure. PT. Ramelio Berkah Abadi implements a "Zero Trust Architecture" procedure to minimize unauthorized access risks. However, the User acknowledges that cyber risks are dynamic and PT. Ramelio Berkah Abadi does not guarantee absolute immunity against high-level structured cyber attacks.',

    s3Title: '3. Information Utilization & Confidentiality',
    s3Desc: 'Information is used exclusively for cross-device data synchronization and application algorithm optimization. PT. Ramelio Berkah Abadi provides a legal guarantee that we will not commercialize, sell, or distribute User business transaction data to ad brokers or any third parties without a court mandate.',

    s4Title: '4. Constitutional Rights of Data Subjects',
    s4Desc: 'Based on PDP regulations, the User has the absolute right to audit, update, or request permanent deletion of data ("Right to be Forgotten") through the mechanism provided within the My Invoice Dashboard.',

    s5Title: '5. Governing Language Clause',
    s5Desc: 'This policy is drafted in a Bilingual format. In the event of discrepancies in meaning or interpretation between the Indonesian and English versions, the Indonesian version shall be declared the primary legally prevailing text.',

    s8Title: '6. Privacy Grievance Center',
    s8Desc: 'If indications of data breach or technical requests regarding sensitive information deletion are found, please contact our Data Protection Officer (DPO):',
    s8Email: 'hello.myinvoice@gmail.com',
    s8Hours: 'Estimated Response: 2x24 Business Hours',
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
