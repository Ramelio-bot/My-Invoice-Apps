import { useNavigate } from 'react-router-dom';
import { FileText, Store, User, CreditCard, Shield, Award, AlertCircle, Scale, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const copy = {
  ID: {
    title: 'Syarat & Ketentuan',
    subtitle: 'Ketentuan penggunaan layanan My Invoice yang berlaku bagi seluruh pengguna.',
    lastUpdated: 'Berlaku sejak: 1 Maret 2026',
    
    s1Title: 'Penerimaan Syarat',
    s1Desc: 'Dengan mengakses atau menggunakan layanan My Invoice, Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat & Ketentuan ini. Jika Anda tidak menyetujui syarat ini, mohon untuk tidak menggunakan layanan kami.',

    s2Title: 'Deskripsi Layanan',
    s2Desc: 'My Invoice adalah platform SaaS (Software as a Service) yang menyediakan layanan manajemen dokumen bisnis, sistem kasir POS, pembuatan invoice, kwitansi, laporan keuangan, dan fitur pendukung operasional bisnis lainnya. Layanan tersedia melalui browser web di myinvoice.space.',

    s3Title: 'Akun Pengguna',
    s3Desc: 'Anda bertanggung jawab penuh atas keamanan akun dan kata sandi Anda. Anda wajib memberikan informasi yang akurat saat mendaftar. My Invoice berhak menangguhkan atau menghapus akun yang melanggar ketentuan ini. Satu akun hanya boleh digunakan oleh satu entitas bisnis.',

    s4Title: 'Kebijakan Pembayaran & Langganan',
    s4Desc: 'Paket berbayar (PRO & ULTIMATE) ditagihkan per bulan. Pembayaran tidak dapat dikembalikan (non-refundable) kecuali terdapat gangguan layanan yang signifikan dari pihak kami. Harga dapat berubah sewaktu-waktu dengan pemberitahuan minimal 30 hari sebelumnya. Layanan akan otomatis kembali ke paket Gratis jika langganan tidak diperbarui.',

    s5Title: 'Penggunaan yang Dilarang',
    s5Desc: 'Anda dilarang menggunakan layanan My Invoice untuk: aktivitas ilegal atau melanggar hukum yang berlaku di Indonesia, menyebarkan konten berbahaya atau menyesatkan, melakukan reverse engineering terhadap platform, mengakses data pengguna lain tanpa izin, atau menggunakan bot/scraper otomatis tanpa persetujuan tertulis.',

    s6Title: 'Kepemilikan Intelektual',
    s6Desc: 'Seluruh konten, desain, kode, dan merek dagang My Invoice adalah milik eksklusif PT. My Invoice Indonesia. Data bisnis yang Anda masukkan ke dalam platform tetap menjadi milik Anda sepenuhnya. Anda memberikan My Invoice lisensi terbatas untuk memproses data tersebut semata-mata dalam rangka penyediaan layanan.',

    s7Title: 'Batasan Tanggung Jawab',
    s7Desc: 'My Invoice tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan layanan. Kami berupaya menjaga uptime 99.9%, namun tidak dapat menjamin layanan bebas dari gangguan sepenuhnya. Total kewajiban kami tidak akan melebihi jumlah yang Anda bayarkan dalam 3 bulan terakhir.',

    s8Title: 'Hukum yang Berlaku & Penyelesaian Sengketa',
    s8Desc: 'Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui musyawarah mufakat terlebih dahulu. Apabila tidak tercapai kesepakatan, sengketa akan diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI) atau pengadilan yang berwenang di Jakarta.',

    contact: 'Hubungi Kami',
    contactDesc: 'Jika Anda memiliki pertanyaan tentang Syarat & Ketentuan ini, silakan hubungi kami di:',
    contactEmail: 'support@myinvoice.space'
  },
  EN: {
    title: 'Terms of Service',
    subtitle: 'Terms of Service for My Invoice applicable to all users.',
    lastUpdated: 'Effective Date: March 1, 2026',

    s1Title: 'Acceptance of Terms',
    s1Desc: 'By accessing or using My Invoice services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',

    s2Title: 'Service Description',
    s2Desc: 'My Invoice is a SaaS (Software as a Service) platform providing business document management, POS cashier system, invoice creation, receipts, financial reports, and other business operational support features. The service is available via web browser at myinvoice.space.',

    s3Title: 'User Account',
    s3Desc: 'You are fully responsible for the security of your account and password. You must provide accurate information when registering. My Invoice reserves the right to suspend or delete accounts that violate these terms. One account may only be used by one business entity.',

    s4Title: 'Payment & Subscription Policy',
    s4Desc: 'Paid plans (PRO & ULTIMATE) are billed monthly. Payments are non-refundable unless there is a significant service disruption on our end. Prices may change at any time with a minimum 30-day prior notice. Service will automatically revert to the Free plan if subscription is not renewed.',

    s5Title: 'Prohibited Use',
    s5Desc: 'You are prohibited from using My Invoice services for: illegal activities or violations of applicable Indonesian law, spreading harmful or misleading content, reverse engineering the platform, accessing other users\' data without permission, or using automated bots/scrapers without written consent.',

    s6Title: 'Intellectual Ownership',
    s6Desc: 'All content, designs, code, and trademarks of My Invoice are the exclusive property of PT. My Invoice Indonesia. Business data you enter into the platform remains entirely your property. You grant My Invoice a limited license to process such data solely for the purpose of providing the service.',

    s7Title: 'Limitation of Liability',
    s7Desc: 'My Invoice is not liable for indirect, incidental, or consequential damages arising from use of the service. We strive to maintain 99.9% uptime but cannot guarantee the service will be entirely free from disruptions. Our total liability will not exceed the amount you paid in the last 3 months.',

    s8Title: 'Governing Law & Dispute Resolution',
    s8Desc: 'These Terms of Service are governed by the laws of the Republic of Indonesia. Any disputes arising will first be resolved through good-faith negotiation. If no agreement is reached, disputes will be resolved through the Indonesian National Arbitration Board (BANI) or the competent court in Jakarta.',

    contact: 'Contact Us',
    contactDesc: 'If you have any questions about these Terms of Service, please contact us at:',
    contactEmail: 'support@myinvoice.space'
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
                    </Section>
                </div>

            </div>
        </div>
    );
}
