import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, Download, Mail, Server } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const copy = {
    ID: {
        title: 'Kebijakan Privasi',
        subtitle: 'Keamanan dan privasi data Anda adalah prioritas utama kami.',
        lastUpdated: 'Berlaku sejak: 1 Januari 2025',
        s1Title: 'Data yang Dikumpulkan',
        s1Desc: 'Kami hanya mengumpulkan informasi yang diperlukan untuk menjalankan layanan:',
        s1List: ['Nama lengkap', 'Alamat email', 'Data profil bisnis', 'Informasi klien yang Anda masukkan'],
        s2Title: 'Penggunaan Data',
        s2Desc: 'Data Anda digunakan secara khusus untuk menjalankan layanan aplikasi My Invoice. Kami berkomitmen penuh bahwa data Anda:',
        s2Highlight: 'TIDAK AKAN PERNAH dijual ke pihak ketiga manapun.',
        s3Title: 'Keamanan & Penyimpanan',
        s3Desc: 'Infrastruktur kami menggunakan standar industri terbaik:',
        s3List: ['Enkripsi SSL/TLS berlapis untuk semua transmisi data', 'Penyimpanan aman menggunakan Superbase Cloud', 'Pencadangan (backup) data rutin terenkripsi'],
        s4Title: 'Hak Pengguna',
        s4Desc: 'Anda memiliki kendali penuh atas data Anda. Kapan saja Anda berhak untuk:',
        s4List: ['Mengakses seluruh data yang kami simpan', 'Mengubah atau memperbaiki data', 'Menghapus akun dan seluruh data terkait', 'Mengekspor data dalam format standar'],
        s5Title: 'Hubungi Kami',
        s5Desc: 'Jika Anda memiliki pertanyaan mengenai privasi data, silakan hubungi tim keamanan kami di:',
        s5Email: 'support@myinvoice.space'
    },
    EN: {
        title: 'Privacy Policy',
        subtitle: 'The security and privacy of your data is our top priority.',
        lastUpdated: 'Effective Date: January 1, 2025',
        s1Title: 'Information We Collect',
        s1Desc: 'We only collect information necessary to operate our services:',
        s1List: ['Full name', 'Email address', 'Business profile data', 'Client information you input'],
        s2Title: 'How We Use Your Data',
        s2Desc: 'Your data is used specifically to operate the My Invoice application services. We are fully committed that your data:',
        s2Highlight: 'WILL NEVER be sold to any third party.',
        s3Title: 'Security & Storage',
        s3Desc: 'Our infrastructure uses industry-best standards:',
        s3List: ['Multi-layered SSL/TLS encryption for all data transmission', 'Secure storage using Supabase Cloud', 'Routine encrypted data backups'],
        s4Title: 'Your Rights',
        s4Desc: 'You have full control over your data. At any time you have the right to:',
        s4List: ['Access all data we store', 'Modify or correct data', 'Delete your account and all related data', 'Export data in standard formats'],
        s5Title: 'Contact Us',
        s5Desc: 'If you have any questions regarding data privacy, please contact our security team at:',
        s5Email: 'support@myinvoice.space'
    }
};

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

                {/* Content */}
                <div className="space-y-6">
                    <Section icon={Eye} title={c.s1Title}>
                        <p className="mb-4">{c.s1Desc}</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-violet-500">
                            {c.s1List.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </Section>

                    <Section icon={Lock} title={c.s2Title}>
                        <p className="mb-4">{c.s2Desc}</p>
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
                    </Section>

                    <Section icon={Download} title={c.s4Title}>
                        <p className="mb-4">{c.s4Desc}</p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-violet-500">
                            {c.s4List.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </Section>

                    <Section icon={Mail} title={c.s5Title}>
                        <p className="mb-4">{c.s5Desc}</p>
                        <a href={`mailto:${c.s5Email}`} className="inline-flex font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">
                            {c.s5Email}
                        </a>
                    </Section>
                </div>

            </div>
        </div>
    );
}
