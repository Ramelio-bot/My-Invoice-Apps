import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Lock, Eye, Mail, Server, RefreshCw, CheckCircle2,
  Database, ShieldCheck, ArrowRight, Clock, FileText, ChevronRight
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    badge: 'Kepatuhan UU PDP No. 27/2022',
    title: 'Kebijakan Privasi & Perlindungan Data',
    subtitle: 'Standar Keamanan Informasi dan Perlindungan Privasi PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Pembaruan Terakhir: 8 November 2026',
    intro: 'MyInvoice (dikelola oleh PT. Ramelio Berkah Abadi) berkomitmen penuh untuk melindungi privasi dan keamanan data seluruh pengguna platform kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi serta data operasional bisnis Anda, sesuai dengan prinsip kepatuhan Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022) dan standar keamanan informasi modern.',
    
    highlights: [
      {
        icon: Database,
        title: '100% Milik Anda',
        desc: 'Seluruh data transaksi dan data pelanggan tetap menjadi aset hak milik penuh Anda.'
      },
      {
        icon: ShieldCheck,
        title: 'Tanpa Broker Iklan',
        desc: 'Kami tidak pernah dan tidak akan menjual atau membagikan data Anda kepada pihak ketiga.'
      },
      {
        icon: Lock,
        title: 'Enkripsi Modern',
        desc: 'Dilindungi enkripsi AES-256 pada database dan transmisi aman TLS/HTTPS 1.3.'
      },
      {
        icon: Server,
        title: 'Row Level Security',
        desc: 'Isolasi data ketat multi-tenant di tingkat basis data, menjamin keamanan mutlak.'
      }
    ],

    tocTitle: 'Daftar Isi Kebijakan',

    sections: [
      {
        id: 's1',
        number: '01',
        icon: Eye,
        title: 'Jenis Data yang Kami Kumpulkan',
        desc: 'Kami hanya mengumpulkan data yang diperlukan guna menunjang kelancaran dan kestabilan operasional layanan, meliputi:',
        list: [
          'Data Identitas & Akun: Nama lengkap, alamat email, nomor telepon/WhatsApp, dan nama toko atau entitas usaha yang Anda daftarkan.',
          'Data Operasional Bisnis: Dokumen faktur (invoice), kwitansi, surat penawaran harga, catatan kasir POS, katalog produk, dan daftar kontak pelanggan yang Anda masukkan ke dalam sistem.',
          'Data Teknis & Perangkat: Alamat IP, jenis peramban (browser), sistem operasi, log autentikasi, dan pengenal perangkat unik yang diperlukan untuk audit keamanan serta pemeliharaan sistem.'
        ]
      },
      {
        id: 's2',
        number: '02',
        icon: Lock,
        title: 'Protokol Keamanan & Penyimpanan Data',
        desc: 'Seluruh data pengguna disimpan dan dilindungi menggunakan arsitektur keamanan modern. Kami menerapkan enkripsi data berstandar industri tinggi (AES-256 pada tingkat penyimpanan basis data dan protokol TLS/HTTPS 1.3 pada transmisi data). Selain itu, sistem menerapkan Row Level Security (RLS) pada basis data komputasi awan kami untuk memastikan isolasi data yang ketat antar-pengguna, sehingga data bisnis Anda hanya dapat diakses secara sah oleh akun Anda sendiri.'
      },
      {
        id: 's3',
        number: '03',
        icon: Shield,
        title: 'Pemanfaatan & Kerahasiaan Informasi',
        desc: 'Informasi bisnis Anda digunakan secara eksklusif untuk operasional aplikasi, sinkronisasi data antar-perangkat, dan penyajian laporan keuangan usaha Anda. PT. Ramelio Berkah Abadi menjamin bahwa Kami tidak pernah dan tidak akan pernah menjual, menyewakan, atau membagikan data transaksi bisnis maupun data pelanggan Anda kepada pihak ketiga atau jaringan pengiklan komersial tanpa mandat pengadilan yang sah.'
      },
      {
        id: 's4',
        number: '04',
        icon: Server,
        title: 'Kendali & Hak Pengguna atas Data',
        desc: 'Sesuai dengan regulasi perlindungan data pribadi, Pengguna memiliki hak penuh untuk mengakses riwayat transaksi, memperbarui profil, mengekspor laporan ke format digital (PDF/Excel), serta mengajukan permohonan penghapusan data bisnis maupun penutupan akun secara permanen melalui fitur yang tersedia di menu Pengaturan Akun.'
      },
      {
        id: 's5',
        number: '05',
        icon: RefreshCw,
        title: 'Penyimpanan Data Offline & Sinkronisasi Lokal',
        desc: 'Pada modul operasional kasir offline, data transaksi disimpan secara aman pada memori peramban lokal perangkat Anda (IndexedDB). Begitu perangkat kembali terhubung ke jaringan internet yang stabil, sistem secara otomatis melakukan penyelarasan data ke server komputasi awan terenkripsi tanpa mengorbankan integritas data historis.'
      },
      {
        id: 's6',
        number: '06',
        icon: Mail,
        title: 'Layanan Bantuan & Kontak Privasi',
        desc: 'Apabila Anda memiliki pertanyaan, klarifikasi kebijakan, atau kendala terkait keamanan dan privasi data akun Anda, silakan hubungi tim perlindungan informasi kami melalui saluran resmi berikut:'
      }
    ],

    contactEmail: 'hello.myinvoice@gmail.com',
    contactHours: 'Jam Layanan: Senin - Jumat | 09:00 - 17:00 WIB',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Jawa Tengah, Indonesia',
    contactCta: 'Kirim Email Privasi'
  },
  EN: {
    badge: 'UU PDP No. 27/2022 Compliant',
    title: 'Privacy & Data Protection Policy',
    subtitle: 'Information Security and Privacy Protection Standards of PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Last Updated: November 8, 2026',
    intro: 'MyInvoice (operated by PT. Ramelio Berkah Abadi) is fully committed to protecting the privacy and security of all platform users. This Privacy Policy outlines how we collect, use, store, and safeguard your personal information and business operational data, adhering to the Indonesian Personal Data Protection Law (UU PDP No. 27/2022) and modern global information security standards.',
    
    highlights: [
      {
        icon: Database,
        title: '100% Data Ownership',
        desc: 'All transactional records and customer lists remain your exclusive property.'
      },
      {
        icon: ShieldCheck,
        title: 'Zero Ad Monetization',
        desc: 'We never sell, lease, or share your proprietary data with third-party brokers.'
      },
      {
        icon: Lock,
        title: 'Modern Encryption',
        desc: 'Secured via AES-256 database encryption at rest and TLS/HTTPS 1.3 in transit.'
      },
      {
        icon: Server,
        title: 'Row Level Security',
        desc: 'Strict database multi-tenant isolation ensuring airtight data segregation.'
      }
    ],

    tocTitle: 'Table of Contents',

    sections: [
      {
        id: 's1',
        number: '01',
        icon: Eye,
        title: 'Types of Data We Collect',
        desc: 'We collect data strictly necessary to support operational stability and service delivery, including:',
        list: [
          'Account & Identity Data: Full name, email address, phone/WhatsApp number, and registered business name.',
          'Business Operational Data: Invoices, payment receipts, price quotations, POS cashier records, product catalogs, and client contacts entered into the system.',
          'Technical & Device Data: IP address, browser type, operating system, authentication logs, and unique device identifiers utilized for system audits and maintenance.'
        ]
      },
      {
        id: 's2',
        number: '02',
        icon: Lock,
        title: 'Data Storage & Security Protocols',
        desc: 'User data is stored and secured using modern cloud infrastructure. We implement industry-leading encryption standards (AES-256 for data at rest and TLS/HTTPS 1.3 protocols for data in transit). Furthermore, Row Level Security (RLS) is enforced across our cloud databases to ensure strict tenant isolation, guaranteeing that your operational records are accessible exclusively by your authenticated account.'
      },
      {
        id: 's3',
        number: '03',
        icon: Shield,
        title: 'Use & Confidentiality of Information',
        desc: 'Your business information is utilized exclusively for platform functionality, cross-device synchronization, and delivering accurate financial reports. PT. Ramelio Berkah Abadi provides a legally grounded guarantee that we never commercialize, sell, or disclose your transactional data to ad brokers or third parties without a lawful court order.'
      },
      {
        id: 's4',
        number: '04',
        icon: Server,
        title: 'User Rights & Data Control',
        desc: 'In compliance with applicable data privacy laws, Users retain full authority to review transactional history, update profile credentials, export financial reports into digital formats (PDF/Excel), or request permanent data deletion and account erasure directly via Account Settings.'
      },
      {
        id: 's5',
        number: '05',
        icon: RefreshCw,
        title: 'Offline Storage & Local Synchronization',
        desc: 'For offline cashier operations, transactional state is cached locally within the client browser memory (IndexedDB). Once internet connectivity is re-established, the platform automatically synchronizes pending operational queues to the encrypted cloud database without data duplication or loss.'
      },
      {
        id: 's6',
        number: '06',
        icon: Mail,
        title: 'Privacy Contacts & Inquiries',
        desc: 'For any technical inquiries, clarifications, or privacy compliance requests regarding your account, please reach our dedicated team at:'
      }
    ],

    contactEmail: 'hello.myinvoice@gmail.com',
    contactHours: 'Support Hours: Monday - Friday | 09:00 - 17:00 WIB',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Central Java, Indonesia',
    contactCta: 'Contact Privacy Officer'
  }
};

export default function Privacy() {
  const { lang } = useLang();
  const c = copy[lang] || copy.ID;

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* HEADER & TOP NAVIGATION TABS */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            {/* Segmented Switcher */}
            <div className="inline-flex p-1 bg-zinc-200/80 rounded-2xl mb-8 border border-zinc-200">
              <Link
                to="/privacy"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-zinc-950 shadow-xs no-underline inline-flex items-center gap-2 transition"
              >
                <Shield size={14} className="text-violet-600" />
                <span>{lang === 'EN' ? 'Privacy Policy' : 'Kebijakan Privasi'}</span>
              </Link>
              <Link
                to="/terms"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 no-underline inline-flex items-center gap-2 transition"
              >
                <FileText size={14} />
                <span>{lang === 'EN' ? 'Terms of Service' : 'Syarat & Ketentuan'}</span>
              </Link>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold mb-4 shadow-xs">
              <ShieldCheck size={14} className="text-violet-600" />
              <span>{c.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-zinc-950 tracking-tight leading-[1.12] mb-4">
              {c.title}
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed mb-4">
              {c.subtitle}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-500 text-xs font-semibold shadow-xs">
              <Clock size={13} className="text-zinc-400" />
              <span>{c.lastUpdated}</span>
            </div>
          </div>

          {/* EXECUTIVE HIGHLIGHTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {c.highlights.map((h, i) => {
              const IconComp = h.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                      <IconComp size={18} />
                    </div>
                    <h3 className="text-sm font-extrabold text-zinc-950 mb-1.5">{h.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed m-0">{h.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* UNIFIED DOCUMENT CONTAINER */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-10 lg:p-12 shadow-sm">
            {/* Introduction Lead Box */}
            <div className="p-5 sm:p-6 rounded-2xl bg-violet-50/60 border border-violet-100 mb-12">
              <p className="text-sm sm:text-base text-zinc-700 leading-relaxed m-0 font-medium">
                {c.intro}
              </p>
            </div>

            {/* Two Column Layout on Desktop: Sticky TOC + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Sticky TOC Sidebar (Desktop) */}
              <aside className="lg:col-span-4 hidden lg:block">
                <div className="sticky top-28 bg-zinc-50/80 rounded-2xl p-5 border border-zinc-200/80">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5 mb-3">
                    <FileText size={13} />
                    {c.tocTitle}
                  </span>
                  <nav className="space-y-1">
                    {c.sections.map((s) => (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-white transition no-underline border border-transparent hover:border-zinc-200/80"
                      >
                        <span className="truncate">{s.number}. {s.title}</span>
                        <ChevronRight size={13} className="text-zinc-300 group-hover:text-violet-600 transition shrink-0" />
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Main Content Sections */}
              <div className="lg:col-span-8 divide-y divide-zinc-100">
                {c.sections.map((s, idx) => {
                  const IconComp = s.icon;
                  return (
                    <section
                      key={s.id}
                      id={s.id}
                      className={`scroll-mt-28 ${idx === 0 ? 'pb-10' : 'py-10'}`}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 font-mono text-xs font-extrabold border border-violet-100">
                          {s.number}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                          <IconComp size={16} />
                        </div>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight mb-3">
                        {s.title}
                      </h2>

                      <p className="text-sm sm:text-base text-zinc-600 leading-relaxed m-0">
                        {s.desc}
                      </p>

                      {s.list && (
                        <div className="mt-4 space-y-2 bg-zinc-50/80 p-4 sm:p-5 rounded-2xl border border-zinc-200/70">
                          {s.list.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                              <CheckCircle2 size={16} className="text-violet-600 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Section 6 Dedicated Contact Card */}
                      {s.id === 's6' && (
                        <div className="mt-6 bg-zinc-50 p-5 sm:p-6 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Resmi</p>
                            <a
                              href={`mailto:${c.contactEmail}`}
                              className="text-base sm:text-lg font-black text-violet-700 hover:underline block"
                            >
                              {c.contactEmail}
                            </a>
                            <p className="text-xs text-zinc-500 mt-1 m-0">{c.contactHours}</p>
                            <p className="text-xs text-zinc-500 mt-0.5 m-0">{c.contactLaw}</p>
                          </div>
                          <a
                            href={`mailto:${c.contactEmail}`}
                            className="shrink-0 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-bold no-underline inline-flex items-center gap-1.5 shadow-xs transition"
                          >
                            <span>{c.contactCta}</span>
                            <ArrowRight size={14} />
                          </a>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
