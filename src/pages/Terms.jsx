import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Store, User, Shield, AlertCircle, Scale, Mail,
  Layers, Award, Clock, ChevronRight, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
  ID: {
    badge: 'Perjanjian Layanan Cloud SaaS',
    title: 'Syarat & Ketentuan Layanan',
    subtitle: 'Ketentuan Penggunaan Platform dan Kebijakan Hukum PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Pembaruan Terakhir: 8 November 2026',
    intro: 'Dokumen Syarat dan Ketentuan ini mengatur hak, kewajiban, dan ketentuan hukum dalam penggunaan platform perangkat lunak berbasis cloud (Software as a Service) MyInvoice yang dikembangkan dan dioperasikan oleh PT. Ramelio Berkah Abadi ("Kami"). Dengan mendaftar, mengakses, atau menggunakan fitur-fitur di dalam MyInvoice, Anda ("Pengguna") menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum dalam dokumen ini.',

    highlights: [
      {
        icon: Store,
        title: 'Lisensi SaaS',
        desc: 'Akses langsung platform administrasi bisnis, pembuatan invoice, dan kasir POS berbasis cloud.'
      },
      {
        icon: Award,
        title: 'Hak Milik Data',
        desc: 'Kedaulatan dokumen dan data inventaris bisnis Anda tetap 100% milik Anda secara sah.'
      },
      {
        icon: Layers,
        title: 'Transparansi Biaya',
        desc: 'Spesifikasi fitur paket gratis dan paket berbayar tercantum transparan tanpa biaya tersembunyi.'
      },
      {
        icon: Scale,
        title: 'Hukum Indonesia',
        desc: 'Perjanjian ini diatur dan dilindungi penuh oleh yurisdiksi hukum Republik Indonesia.'
      }
    ],

    tocTitle: 'Daftar Isi Ketentuan',

    sections: [
      {
        id: 't1',
        number: '01',
        icon: FileText,
        title: 'Ketentuan Umum & Penerimaan Layanan',
        desc: 'Dokumen ini mengatur syarat dan ketentuan penggunaan platform perangkat lunak berbasis cloud (Software as a Service) MyInvoice yang dikembangkan dan dioperasikan oleh PT. Ramelio Berkah Abadi ("Kami"). Dengan mendaftar, mengakses, atau menggunakan fitur-fitur di dalam MyInvoice, Anda ("Pengguna") menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum dalam dokumen ini. Jika Anda tidak menyetujui salah satu poin dalam ketentuan ini, Anda disarankan untuk tidak melanjutkan penggunaan platform.'
      },
      {
        id: 't2',
        number: '02',
        icon: Store,
        title: 'Ruang Lingkup & Karakteristik Layanan',
        desc: 'MyInvoice menyediakan solusi digital untuk membantu efisiensi administrasi usaha, mencakup pembuatan faktur tagihan (invoice), kwitansi, surat penawaran harga, kasir POS offline/online, kalkulator HPP, dan pembukuan kas. Layanan ini berfungsi sebagai alat bantu manajemen operasional. Pengguna tetap bertanggung jawab penuh atas keabsahan data transaksi, pemenuhan kewajiban perpajakan, dan kepatuhan hukum atas kegiatan bisnis masing-masing.'
      },
      {
        id: 't3',
        number: '03',
        icon: User,
        title: 'Keamanan Akun & Kewajiban Pengguna',
        desc: 'Pengguna bertanggung jawab penuh untuk menjaga kerahasiaan informasi login (email dan kata sandi) serta seluruh aktivitas yang berlangsung pada akun Pengguna. Pengguna dilarang menyalahgunakan platform untuk kegiatan yang bertentangan dengan hukum, transaksi penipuan, penyebaran malware, atau upaya rekayasa balik (reverse engineering) terhadap kode program dan infrastruktur sistem MyInvoice.'
      },
      {
        id: 't4',
        number: '04',
        icon: Shield,
        title: 'Batasan Tanggung Jawab (Limitation of Liability)',
        desc: 'Kami senantiasa berupaya menjaga agar platform beroperasi secara optimal, stabil, dan aman dengan tingkat ketersediaan tinggi. Namun demikian, sejauh diperbolehkan oleh peraturan perundang-undangan, PT. Ramelio Berkah Abadi tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan komersial, atau gangguan operasional usaha yang disebabkan oleh kelalaian pihak Pengguna, gangguan jaringan telekomunikasi lokal Pengguna, atau kondisi di luar kendali wajar Kami (Force Majeure).'
      },
      {
        id: 't5',
        number: '05',
        icon: Award,
        title: 'Kepemilikan Data & Hak Kekayaan Intelektual',
        desc: 'Seluruh data transaksi bisnis, informasi pelanggan, logo usaha, dan dokumen yang dimasukkan oleh Pengguna ke dalam sistem tetap menjadi hak milik penuh Pengguna. Sementara itu, seluruh elemen platform MyInvoice, termasuk desain visual, antarmuka pengguna, kode sumber, merek dagang, dan sistem perangkat lunak adalah hak kekayaan intelektual milik PT. Ramelio Berkah Abadi yang dilindungi oleh undang-undang hak cipta.'
      },
      {
        id: 't6',
        number: '06',
        icon: Layers,
        title: 'Paket Berlangganan & Kebijakan Pembayaran',
        desc: 'MyInvoice menyediakan paket layanan gratis serta paket berbayar (PRO dan ULTIMATE) dengan spesifikasi kuota dan fitur yang tertera transparan pada halaman Harga. Pembayaran langganan diproses melalui saluran resmi yang aman. Pengguna dapat memilih untuk memperpanjang, meningkatkan (upgrade), atau menghentikan paket langganan kapan saja melalui menu Pengaturan Akun.'
      },
      {
        id: 't7',
        number: '07',
        icon: AlertCircle,
        title: 'Ketersediaan Layanan & Pemeliharaan Sistem',
        desc: 'Kami berhak melakukan pemeliharaan rutin (scheduled maintenance) atau pembaruan sistem guna meningkatkan performa, menambahkan fitur baru, serta memperkuat sistem keamanan. Dalam hal pemeliharaan memerlukan waktu henti sementara, Kami akan berupaya memberikan pemberitahuan terlebih dahulu melalui antarmuka aplikasi atau saluran komunikasi resmi.'
      },
      {
        id: 't8',
        number: '08',
        icon: Scale,
        title: 'Hukum yang Berlaku & Penyelesaian Sengketa',
        desc: 'Syarat dan Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia. Segala perselisihan yang timbul sehubungan dengan pelaksanaan ketentuan ini diupayakan untuk diselesaikan secara musyawarah dan mufakat. Apabila kesepakatan tidak tercapai, para pihak sepakat untuk memilih domisili hukum di Pengadilan Negeri Salatiga, Jawa Tengah.'
      },
      {
        id: 't9',
        number: '09',
        icon: Mail,
        title: 'Layanan Bantuan & Informasi Hukum',
        desc: 'Untuk pertanyaan resmi terkait ketentuan layanan, permohonan klarifikasi administratif, atau kerjasama bisnis, silakan hubungi tim legal kami melalui saluran berikut:'
      }
    ],

    contactEmail: 'hello.myinvoice@gmail.com',
    contactHours: 'Senin - Jumat | 09:00 - 17:00 WIB',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Jawa Tengah, Indonesia',
    contactCta: 'Hubungi Tim Legal'
  },
  EN: {
    badge: 'Enterprise Cloud SaaS Agreement',
    title: 'Terms of Service',
    subtitle: 'Platform Usage Agreement and Terms of Service of PT. Ramelio Berkah Abadi.',
    lastUpdated: 'Last Updated: November 8, 2026',
    intro: 'This Terms of Service document governs the rights, obligations, and legal provisions pertaining to your access and use of the MyInvoice cloud software platform (Software as a Service), developed and operated by PT. Ramelio Berkah Abadi ("We", "Us"). By registering, accessing, or utilizing any features in MyInvoice, you ("User") affirm that you have read, understood, and agreed to all terms outlined in this agreement.',

    highlights: [
      {
        icon: Store,
        title: 'SaaS License',
        desc: 'Direct access to cloud-based invoicing, receipt generation, and offline/online POS tools.'
      },
      {
        icon: Award,
        title: 'Content Ownership',
        desc: 'All invoices, client records, and inventory data remain 100% your exclusive property.'
      },
      {
        icon: Layers,
        title: 'Transparent Pricing',
        desc: 'Clear quotas and feature breakdowns for free and paid tiers with zero hidden fees.'
      },
      {
        icon: Scale,
        title: 'Governing Law',
        desc: 'This agreement is strictly governed by and construed under the laws of the Republic of Indonesia.'
      }
    ],

    tocTitle: 'Table of Contents',

    sections: [
      {
        id: 't1',
        number: '01',
        icon: FileText,
        title: 'General Terms & Acceptance of Service',
        desc: 'This document constitutes a binding agreement between you ("User") and PT. Ramelio Berkah Abadi. By creating an account or accessing any module within MyInvoice, you explicitly consent to abide by these terms. If you do not agree with any provision herein, you must immediately cease using the platform.'
      },
      {
        id: 't2',
        number: '02',
        icon: Store,
        title: 'Scope & Characteristics of Service',
        desc: 'MyInvoice offers digital productivity software designed to streamline business administration, including invoices, payment receipts, price quotations, POS cash registers, COGS calculators, and cashbooks. The service operates purely as an administrative tool; Users retain complete accountability for transactional accuracy, tax obligations, and regulatory compliance within their respective jurisdictions.'
      },
      {
        id: 't3',
        number: '03',
        icon: User,
        title: 'Account Security & User Obligations',
        desc: 'Users are strictly responsible for maintaining credential secrecy (email and password) and for all activities executed under their account identity. Users are prohibited from utilizing the platform for fraudulent transactions, deploying malware, or attempting reverse-engineering of MyInvoice source architecture.'
      },
      {
        id: 't4',
        number: '04',
        icon: Shield,
        title: 'Limitation of Liability',
        desc: 'While we strive to ensure maximum availability, performance, and security across our cloud infrastructure, PT. Ramelio Berkah Abadi shall not be held liable, to the fullest extent permitted by applicable law, for indirect, incidental, or consequential losses, business interruptions, or lost revenue resulting from user negligence, local ISP failures, or events beyond our reasonable control.'
      },
      {
        id: 't5',
        number: '05',
        icon: Award,
        title: 'Data Ownership & Intellectual Property',
        desc: 'Users maintain absolute ownership over all transactional records, customer catalogs, store branding, and documents uploaded to the system. Conversely, all proprietary intellectual property encompassing the MyInvoice application—including software source code, user interfaces, system design, and brand trademarks—belongs exclusively to PT. Ramelio Berkah Abadi.'
      },
      {
        id: 't6',
        number: '06',
        icon: Layers,
        title: 'Subscription Tiers & Billing Terms',
        desc: 'MyInvoice provides a free tier alongside premium subscriptions (PRO and ULTIMATE) detailed transparently on our Pricing page. Subscription payments are handled via certified payment gateways. Users can upgrade, downgrade, or cancel renewals at any time within Account Settings.'
      },
      {
        id: 't7',
        number: '07',
        icon: AlertCircle,
        title: 'Service Availability & System Maintenance',
        desc: 'We reserve the right to perform scheduled maintenance and software upgrades to optimize system resilience and feature sets. When temporary downtime is necessary, reasonable advance notice will be delivered via platform banners or official communication channels.'
      },
      {
        id: 't8',
        number: '08',
        icon: Scale,
        title: 'Governing Law & Dispute Resolution',
        desc: 'These Terms of Service are governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising in connection with this agreement shall first be addressed through good-faith mediation. Failing resolution, the parties agree to submit to the jurisdiction of the District Court of Salatiga, Central Java, Indonesia.'
      },
      {
        id: 't9',
        number: '09',
        icon: Mail,
        title: 'Support & Legal Inquiries',
        desc: 'For formal inquiries regarding these terms, corporate partnerships, or administrative assistance, please contact our team at:'
      }
    ],

    contactEmail: 'hello.myinvoice@gmail.com',
    contactHours: 'Monday - Friday | 09:00 - 17:00 WIB',
    contactLaw: 'PT. Ramelio Berkah Abadi | Salatiga, Central Java, Indonesia',
    contactCta: 'Contact Legal Team'
  }
};

export default function Terms() {
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
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 no-underline inline-flex items-center gap-2 transition"
              >
                <Shield size={14} />
                <span>{lang === 'EN' ? 'Privacy Policy' : 'Kebijakan Privasi'}</span>
              </Link>
              <Link
                to="/terms"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-zinc-950 shadow-xs no-underline inline-flex items-center gap-2 transition"
              >
                <FileText size={14} className="text-violet-600" />
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

                      {/* Section 9 Dedicated Contact Card */}
                      {s.id === 't9' && (
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
