import { useNavigate } from 'react-router-dom';
import { FileText, Store, User, CreditCard, Shield, Award, AlertCircle, Scale, Mail } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    title: 'Syarat & Ketentuan Penggunaan',
    subtitle: 'Perjanjian hukum yang mengikat secara sah antara Pengguna dan PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Berlaku sejak: 26 Maret 2026 · Versi 1.2',

    s1Title: 'Penerimaan & Ruang Lingkup',
    s1Desc: 'Dengan mengakses, mendaftar, atau menggunakan layanan My Invoice, Anda menyatakan telah membaca, memahami, dan menyetujui secara mutlak Syarat & Ketentuan ini atas nama pribadi atau entitas hukum yang Anda wakili. Segala tindakan penggunaan layanan dianggap sebagai bentuk persetujuan elektronik yang mengikat secara hukum.',

    s2Title: 'Status Layanan & Verifikasi Mandiri',
    s2Desc: 'My Invoice adalah platform Software as a Service (SaaS). PT. Ramelio Berkah Abadi bukan merupakan kantor akuntan publik, konsultan pajak, atau penasihat hukum. Pengguna berkewajiban melakukan verifikasi mandiri atas setiap kalkulasi data. Segala risiko yang timbul dari kesalahan input atau interpretasi data sepenuhnya merupakan tanggung jawab Pengguna.',

    s3Title: 'Batasan Tanggung Jawab (The Money Shield)',
    s3Desc: 'Layanan disediakan atas dasar "Sebagaimana Adanya". PT. Ramelio Berkah Abadi tidak bertanggung jawab atas kerugian insidental, konsekuensial, atau kerugian punitif, termasuk namun tidak terbatas pada kehilangan keuntungan bisnis, kehilangan data, atau gangguan operasional, bahkan jika Kami telah diberitahu mengenai kemungkinan kerugian tersebut sebelumnya.',

    s4Title: 'Ketergantungan Infrastruktur Pihak Ketiga',
    s4Desc: 'Layanan My Invoice bergantung pada infrastruktur pihak ketiga termasuk Google Cloud dan Supabase. Kegagalan sistem, kebocoran data pada server pihak ketiga, atau perubahan kebijakan oleh pihak ketiga tersebut merupakan kondisi Force Majeure bagi Kami, dan Kami dibebaskan dari segala tuntutan hukum akibat malfungsi tersebut.',

    s5Title: 'Hak Kekayaan Intelektual',
    s5Desc: 'Seluruh kode sumber, desain antarmuka, algoritma, logo, dan merek My Invoice adalah properti intelektual milik PT. Ramelio Berkah Abadi. Pengguna dilarang melakukan rekayasa balik (reverse engineering), penggandaan fitur, atau pendistribusian ulang tanpa izin tertulis dari Direksi.',

    s6Title: 'Kebijakan Pembayaran & No-Refund',
    s6Desc: 'Seluruh pembayaran langganan bersifat final. Tidak ada pengembalian dana (Refund) dengan alasan apa pun setelah akses fitur diberikan. PT berhak mengubah struktur harga sewaktu-waktu dengan pemberitahuan melalui sistem.',

    s7Title: 'Indemnifikasi (Ganti Rugi)',
    s7Desc: 'Pengguna setuju untuk membela, membebaskan, dan mengganti rugi sepenuhnya PT. Ramelio Berkah Abadi dari segala tuntutan pihak ketiga, biaya hukum, atau denda yang timbul akibat penyalahgunaan layanan atau pelanggaran hukum oleh Pengguna.',

    s8Title: 'Hukum & Yurisdiksi Eksklusif',
    s8Desc: 'Perjanjian ini tunduk pada Hukum Republik Indonesia. Segala perselisihan yang tidak mencapai mufakat dalam waktu 30 hari akan diselesaikan secara eksklusif melalui Pengadilan Negeri Salatiga. Pengguna melepaskan hak untuk mengajukan keberatan atas domisili hukum ini.',

    contact: 'Korespondensi Legal',
    contactDesc: 'Untuk pertanyaan terkait kepatuhan hukum, syarat penggunaan, atau kerjasama formal, silakan hubungi saluran resmi kami:',
    contactEmail: 'legal@myinvoice.space',
    contactHours: 'Senin - Jumat (09.00 - 17.00 WIB)',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Jawa Tengah, Indonesia'
  },
  EN: {
    title: 'Terms & Conditions',
    subtitle: 'A legally binding agreement between the User and PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Effective: March 26, 2026 · Version 1.2',

    s1Title: 'Acceptance & Scope',
    s1Desc: 'By accessing, registering, or using My Invoice, you represent that you have read, understood, and absolutely agreed to these Terms on behalf of yourself or a legal entity. All usage is deemed as legally binding electronic consent.',

    s2Title: 'Service Status & Self-Verification',
    s2Desc: 'My Invoice is a Software as a Service (SaaS) platform. PT. Ramelio Berkah Abadi is not a public accounting firm, tax consultant, or legal advisor. Users are obligated to perform independent verification of all data calculations. All risks arising from data input or interpretation errors remain solely with the User.',

    s3Title: 'Limitation of Liability (The Money Shield)',
    s3Desc: 'Service is provided on an "As-Is" basis. PT. Ramelio Berkah Abadi shall not be liable for any incidental, consequential, or punitive damages, including but not limited to loss of business profits, loss of data, or business interruption, even if we have been advised of the possibility of such damages beforehand.',

    s4Title: 'Third-Party Infrastructure Dependency',
    s4Desc: 'My Invoice relies on third-party infrastructure including Google Cloud and Supabase. System failures, data breaches on third-party servers, or policy changes by said parties are Force Majeure for us, and we are waived from any claims arising from such malfunctions.',

    s5Title: 'Intellectual Property Rights',
    s5Desc: 'All source code, interface designs, algorithms, logos, and My Invoice trademarks are the intellectual property of PT. Ramelio Berkah Abadi. Users are strictly prohibited from reverse engineering, duplicating features, or redistributing without written permission.',

    s6Title: 'Payment & No-Refund Policy',
    s6Desc: 'All subscription payments are final. No refunds under any circumstances once feature access is granted. The PT reserves the right to change pricing structures with prior notice through the system.',

    s7Title: 'Indemnification',
    s7Desc: 'The User agrees to defend, indemnify, and hold harmless PT. Ramelio Berkah Abadi from any third-party claims, legal costs, or fines arising from the User’s misuse of the service or violation of laws.',

    s8Title: 'Governing Law & Exclusive Jurisdiction',
    s8Desc: 'This agreement is governed by the laws of the Republic of Indonesia. Any disputes not resolved by deliberation within 30 days shall be settled exclusively in the District Court of Salatiga. The User waives any right to object to this jurisdiction.',

    contact: 'Legal Correspondence',
    contactDesc: 'For questions regarding legal compliance, terms of use, or formal cooperation, please contact our official channel:',
    contactEmail: 'legal@myinvoice.space',
    contactHours: 'Mon - Fri (09.00 - 17.00 WIB)',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Central Java, Indonesia'
  }
};

export default function Terms() {
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
                        Terms
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
                        <a href={`mailto:${c.contactEmail}`} className="inline-flex font-bold text-violet-600 hover:text-violet-700 text-xl border-b-2 border-violet-200 pb-1 translate-y-0 transition-all hover:-translate-y-1 mb-4">
                            {c.contactEmail}
                        </a>
                        <p className="mt-4 text-sm opacity-75">{c.contactHours}</p>
                        <p className="mt-2 text-sm opacity-75">{c.contactLaw}</p>
                    </Section>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
