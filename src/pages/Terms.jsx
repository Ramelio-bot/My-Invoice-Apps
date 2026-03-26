import { useNavigate } from 'react-router-dom';
import { FileText, Store, User, CreditCard, Shield, Award, AlertCircle, Scale, Mail } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    title: 'Syarat & Ketentuan Penggunaan Layanan',
    subtitle: 'Perjanjian Lisensi Pengguna Akhir (EULA) dan Ketentuan Hukum PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Pembaruan Terakhir: 26 Maret 2026 | Versi 2.0.1 (Enterprise)',

    s1Title: '1. Perjanjian Hukum & Kepatuhan',
    s1Desc: 'Dokumen ini merupakan kontrak hukum yang sah dan mengikat antara individu atau entitas hukum ("Pengguna") dengan PT. Ramelio Berkah Abadi. Dengan mengakses, melakukan pendaftaran, atau menggunakan modul apa pun dalam ekosistem My Invoice, Pengguna secara mutlak menyatakan telah membaca, memahami, dan tunduk pada seluruh klausul tanpa pengecualian. Ketidaksetujuan terhadap satu bagian pun dari ketentuan ini mengharuskan Pengguna untuk segera menghentikan seluruh aktivitas penggunaan layanan.',

    s2Title: '2. Deskripsi & Batasan Layanan (SaaS)',
    s2Desc: 'My Invoice adalah platform Software as a Service (SaaS) yang bersifat alat bantu administratif. PT. Ramelio Berkah Abadi tidak memberikan jaminan bahwa Layanan akan memenuhi kebutuhan spesifik Pengguna atau beroperasi tanpa gangguan. Kami bukan lembaga audit, kantor akuntan publik, maupun konsultan hukum. Seluruh hasil kalkulasi, laporan laba rugi, dan faktur pajak yang dihasilkan adalah data mentah yang wajib divalidasi ulang oleh tenaga ahli profesional sebelum digunakan untuk pelaporan resmi.',

    s3Title: '3. Keamanan Akun & Tanggung Jawab Pengguna',
    s3Desc: 'Pengguna bertanggung jawab penuh atas kerahasiaan kredensial akun (Email & Password). Segala aktivitas yang terjadi di bawah identitas akun Pengguna dianggap sebagai tindakan sah Pengguna. PT. Ramelio Berkah Abadi dibebaskan dari segala tanggung jawab atas akses tidak sah yang disebabkan oleh kelalaian Pengguna dalam menjaga keamanan perangkat atau informasi login.',

    s4Title: '4. Batasan Tanggung Jawab Mutlak (The Money Shield)',
    s4Desc: 'Dalam batas maksimal yang diizinkan oleh hukum, PT. Ramelio Berkah Abadi, termasuk direksi dan karyovannya, tidak akan bertanggung jawab atas segala bentuk kerugian tidak langsung, insidental, khusus, konsekuensial, atau kerugian punitif. Ini mencakup, namun tidak terbatas pada, kehilangan pendapatan bisnis, kehilangan data, gangguan operasional, atau rusaknya reputasi bisnis. Pembatasan ini tetap berlaku mutlak meskipun PT. Ramelio Berkah Abadi telah diberitahu secara lisan maupun tertulis mengenai potensi risiko kerugian tersebut sebelumnya oleh Pengguna.',

    s5Title: '5. Klausul Force Majeure & Pihak Ketiga',
    s5Desc: 'Pengguna mengakui bahwa Layanan beroperasi di atas infrastruktur pihak ketiga global (Google Cloud & Supabase). PT. Ramelio Berkah Abadi tidak bertanggung jawab atas kegagalan sistem yang disebabkan oleh bencana alam, tindakan pemerintah, peretasan skala global pada infrastruktur pihak ketiga, atau malfungsi teknis pada server penyedia database. Kondisi ini dikategorikan sebagai Keadaan Kahar (Force Majeure) yang membebaskan Kami dari segala bentuk tuntutan ganti rugi.',

    s6Title: '6. Hak Kekayaan Intelektual & Lisensi',
    s6Desc: 'Seluruh hak, kepemilikan, dan kepentingan dalam Layanan, termasuk kode sumber (Source Code), desain grafis, skema database, algoritma perhitungan, dan merek dagang adalah milik eksklusif PT. Ramelio Berkah Abadi. Pengguna hanya diberikan lisensi terbatas, non-eksklusif, dan tidak dapat dipindahtangankan untuk menggunakan fitur aplikasi sesuai paket langganan yang dipilih.',

    s7Title: '7. Kebijakan Komersial & Pembatalan',
    s7Desc: 'Seluruh biaya langganan yang telah dibayarkan oleh Pengguna bersifat final dan tidak dapat dikembalikan (Non-Refundable). Kami berhak melakukan penangguhan (Suspension) atau penghapusan akun secara permanen jika ditemukan indikasi penyalahgunaan sistem, manipulasi data, atau pelanggaran hukum tanpa kewajiban untuk mengembalikan sisa saldo langganan.',

    s8Title: '8. Penyelesaian Sengketa & Domisili Hukum',
    s8Desc: 'Perjanjian ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap perselisihan yang timbul wajib diselesaikan terlebih dahulu melalui mediasi internal. Apabila dalam waktu 60 hari tidak tercapai mufakat, maka Pengguna sepakat untuk melepaskan hak mengajukan tuntutan di yurisdiksi lain dan secara eksklusif menyerahkan penyelesaian sengketa kepada Pengadilan Negeri Salatiga.',

    contact: 'Departemen Hukum & Kepatuhan',
    contactDesc: 'Untuk korespondensi resmi, permintaan dokumen legal, atau pelaporan pelanggaran hak cipta, silakan hubungi saluran formal PT. Ramelio Berkah Abadi:',
    contactEmail: 'legal.compliance@myinvoice.space',
    contactHours: 'Senin - Jumat | 09:00 - 17:00 WIB (Kecuali Hari Libur Nasional)',
    contactLaw: 'Kantor Pusat: PT. Ramelio Berkah Abadi | Salatiga, Jawa Tengah, Indonesia'
  },
  EN: {
    title: 'Terms & Conditions of Service',
    subtitle: 'End-User License Agreement (EULA) and Legal Provisions of PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Last Update: March 26, 2026 | Version 2.0.1 (Enterprise)',

    s1Title: '1. Legal Agreement & Compliance',
    s1Desc: 'This document constitutes a valid and binding legal contract between the individual or legal entity ("User") and PT. Ramelio Berkah Abadi. By accessing, registering, or utilizing any module within the My Invoice ecosystem, the User absolutely represents that they have read, understood, and adhered to all clauses without exception. Disagreement with any part of these terms requires the User to immediately cease all use of the service.',

    s2Title: '2. Service Description & SaaS Limitations',
    s2Desc: 'My Invoice is a Software as a Service (SaaS) platform serving as an administrative tool. PT. Ramelio Berkah Abadi provides no guarantee that the Service will meet specific User requirements or operate without interruption. We are not an auditing firm, public accounting office, or legal advisor. All generated calculation results, profit and loss reports, and tax invoices are raw data that must be re-validated by professional experts before use for official reporting.',

    s3Title: '3. Account Security & User Responsibility',
    s3Desc: 'The User is fully responsible for the confidentiality of account credentials (Email & Password). All activities occurring under the User’s account identity are deemed valid acts of the User. PT. Ramelio Berkah Abadi is waived from all liability for unauthorized access caused by the User’s negligence in maintaining device security or login information.',

    s4Title: '4. Absolute Limitation of Liability (The Money Shield)',
    s4Desc: 'To the maximum extent permitted by law, PT. Ramelio Berkah Abadi, including its directors and employees, shall not be liable for any indirect, incidental, special, consequential, or punitive damages. This includes, but is not limited to, loss of business revenue, data loss, operational disruption, or damage to business reputation. This limitation remains absolutely effective even if PT. Ramelio Berkah Abadi has been advised orally or in writing of the potential risk of such damages previously by the User.',

    s5Title: '5. Force Majeure & Third-Party Clause',
    s5Desc: 'The User acknowledges that the Service operates on global third-party infrastructure (Google Cloud & Supabase). PT. Ramelio Berkah Abadi is not responsible for system failures caused by natural disasters, government actions, global hacking on third-party infrastructure, or technical malfunctions on database provider servers. These conditions are categorized as Force Majeure, waiving us from any form of damage claims.',

    s6Title: '6. Intellectual Property Rights & Licensing',
    s6Desc: 'All rights, titles, and interests in the Service, including source code, graphic designs, database schemes, calculation algorithms, and trademarks are the exclusive property of PT. Ramelio Berkah Abadi. Users are granted only a limited, non-exclusive, and non-transferable license to use application features according to the selected subscription plan.',

    s7Title: '7. Commercial Policy & Termination',
    s7Desc: 'All subscription fees paid by the User are final and non-refundable. We reserve the right to perform permanent suspension or deletion of accounts if indications of system abuse, data manipulation, or law violations are found, without any obligation to refund remaining balances.',

    s8Title: '8. Dispute Resolution & Legal Jurisdiction',
    s8Desc: 'This agreement is governed and interpreted according to the laws of the Republic of Indonesia. Any disputes arising must first be resolved through internal mediation. If an agreement is not reached within 60 days, the User agrees to waive the right to file claims in other jurisdictions and exclusively submits the dispute to the District Court of Salatiga.',

    contact: 'Legal & Compliance Department',
    contactDesc: 'For official correspondence, legal document requests, or copyright infringement reporting, please contact the formal channels of PT. Ramelio Berkah Abadi:',
    contactEmail: 'legal.compliance@myinvoice.space',
    contactHours: 'Monday - Friday | 09:00 - 17:00 WIB (Excluding National Holidays)',
    contactLaw: 'Headquarters: PT. Ramelio Berkah Abadi | Salatiga, Central Java, Indonesia'
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
