import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, ArrowRight, ChevronDown, Check, Send, 
  Download, ShieldCheck, DollarSign, Smartphone, Sparkles, Clock
} from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function SoftwareInvoiceFreelance() {
  const [openFaq, setOpenFaq] = useState(null);
  
  // Interactive Freelance Simulator State
  const [projectName, setProjectName] = useState('Redesign UI/UX & Web Development');
  const [projectFee, setProjectFee] = useState(8000000);
  const [paymentTerm, setPaymentTerm] = useState('dp50'); // 'dp50' | 'full' | 'dp30'
  const [clientName, setClientName] = useState('PT Solusi Digital');
  const [isCopied, setIsCopied] = useState(false);

  const getBilledAmount = () => {
    if (paymentTerm === 'dp50') return projectFee * 0.5;
    if (paymentTerm === 'dp30') return projectFee * 0.3;
    return projectFee;
  };

  const getRemainingAmount = () => {
    if (paymentTerm === 'full') return 0;
    return projectFee - getBilledAmount();
  };

  const billedAmount = getBilledAmount();
  const remainingAmount = getRemainingAmount();

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleCopyWaMessage = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    // 1. Title
    document.title = "Software Invoice Freelance & Agensi Gratis | MyInvoice";

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Software pembuat faktur dan invoice gratis untuk freelancer, desainer, developer, dan agensi kreatif. Kelola DP 50%, kirim PDF resmi berlogo via WhatsApp, dan pantau pembayaran lunas tanpa ribet.'
    );

    // 3. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/software-invoice-freelance');

    // 4. Schema.org JSON-LD Structured Data
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "MyInvoice Freelance & Agency Invoicing",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All modern browsers (Web, Android, iOS, Windows, macOS)",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR",
            "description": "Paket Gratis untuk Freelancer, Konsultan, dan Agensi Kreatif"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "195",
            "bestRating": "5"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Apakah MyInvoice mendukung penagihan sistem DP (Down Payment)?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ya, sangat mendukung. Anda bisa membagi tagihan proyek menjadi Termin 1 (DP 30% atau 50%) dan invoice pelunasan akhir sebelum penyerahan aset proyek ke klien."
              }
            },
            {
              "@type": "Question",
              "name": "Bisakah invoice langsung dikirim ke WhatsApp klien?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Bisa. MyInvoice menyediakan fitur 1-klik kirim ke WhatsApp lengkap dengan teks pengantar penagihan yang sopan dan tautan dokumen PDF resmi."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah bisa menambahkan logo studio dan nomor rekening sendiri?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Tentu saja. Anda bisa mengunggah logo bisnis/studio kreatif Anda, mencantumkan rekening bank (BCA, Mandiri, BNI, dsb), serta catatan syarat & ketentuan pembayaran."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah ada watermark iklan pada dokumen di paket gratis?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Paket Gratis menyertakan watermark MyInvoice kecil yang rapi di bagian bawah. Jika ingin dokumen 100% white-label tanpa watermark, Anda dapat mengaktifkan paket Pro hanya Rp 29.000."
              }
            }
          ]
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const faqs = [
    {
      q: "Apakah MyInvoice mendukung penagihan proyek bertahap (Termin DP)?",
      a: "Sangat mendukung! Sebagai freelancer atau agensi, menagih DP 50% di awal adalah kunci keamanan cash flow. Di MyInvoice, Anda bisa menerbitkan Invoice Termin 1 (DP), otomatis menerbitkan Kwitansi/Tanda Terima saat DP cair, lalu menerbitkan Invoice Pelunasan sebelum serah terima file akhir ke klien."
    },
    {
      q: "Bagaimana cara mengirim invoice langsung ke WhatsApp klien?",
      a: "Cukup klik tombol 'Kirim via WhatsApp' di halaman invoice. Sistem akan otomatis menyusun pesan penagihan yang profesional, sopan, lengkap dengan rincian rekening bank Anda dan tombol download file PDF resmi."
    },
    {
      q: "Apakah bisa mencantumkan logo agensi dan stempel resmi?",
      a: "Bisa 100%. Anda bisa mengunggah logo usaha kreatif Anda, tanda tangan digital, serta stempel otomatis (LUNAS atau DP DITERIMA) untuk memberikan kesan kredibel dan berwibawa di mata klien korporat."
    },
    {
      q: "Apakah ada batasan jumlah invoice untuk paket gratis?",
      a: "Paket Gratis mencakup hingga 25 dokumen setiap bulan, yang sudah sangat cukup untuk freelancer individual. Jika proyek Anda bertambah banyak, Anda bisa upgrade ke paket Pro hanya seharga Rp 29.000 per bulan tanpa kontrak mengikat."
    }
  ];

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION: FREELANCER & AGENCY FOCUS */}
        <section className="relative pt-32 pb-16 px-6 overflow-hidden bg-white border-b border-zinc-200/80">
          {/* Subtle Perspective Grid Background */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40" 
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 75%)'
            }}
          />

          <div className="relative max-w-5xl mx-auto text-center z-10">
            {/* Signal Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50/80 text-xs font-semibold text-blue-900 mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>⚡ Khusus Freelancer, Desainer, Developer & Agensi Kreatif</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black tracking-tight text-zinc-950 leading-[1.08] mb-6 max-w-4xl mx-auto" style={{ letterSpacing: '-0.04em' }}>
              Faktur proyek resmi. Tagih DP & pelunasan tanpa canggung.
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
              Tinggalkan cara manual ketik di Word atau Excel. Buat invoice berlogo profesional, atur termin DP 50%, dan kirim dokumen PDF resmi langsung ke WhatsApp klien dalam 30 detik. 100% gratis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2"
              >
                <span>Mulai Buat Invoice Freelance Gratis</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="#freelance-demo"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm border border-zinc-200 shadow-xs transition-all"
              >
                Coba Simulasi Tagihan Proyek ↓
              </a>
            </div>

            {/* 3D HERO SHOWCASE: FREELANCE INVOICE & WHATSAPP PHONE */}
            <div className="relative max-w-3xl mx-auto my-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/80 border border-zinc-200/50 bg-gradient-to-b from-white to-zinc-50/50 p-2 sm:p-4">
                <img 
                  src="/images/hero-freelance-showcase.png" 
                  alt="Invoice Proyek Freelance Digital dan Notifikasi WhatsApp PDF" 
                  className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md rounded-xl"
                  loading="eager"
                  onError={(e) => {
                    // Fallback to general invoice showcase if needed
                    e.currentTarget.src = "/images/hero-invoice-showcase.png";
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500 mt-6 font-medium">
              <span>✓ Skema DP & Termin Pembayaran</span>
              <span>•</span>
              <span>✓ Kirim PDF Resmi via WhatsApp 1-Klik</span>
              <span>•</span>
              <span>✓ Auto Stempel 'LUNAS' & 'DP DITERIMA'</span>
            </div>
          </div>
        </section>

        {/* 2. INTERACTIVE FREELANCE BILLING SIMULATOR */}
        <section id="freelance-demo" className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">INTERACTIVE FREELANCE BILLING PREVIEW</span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
              Simulasi Tagihan Proyek & Format WhatsApp Klien
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto mt-2">
              Ubah rincian proyek di sebelah kiri dan lihat bagaimana pesan penagihan profesional otomatis tersusun untuk dikirim ke WhatsApp klien.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: INVOICE CONFIGURATOR (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-950">Atur Tagihan Proyekmu</div>
                  <div className="text-xs text-zinc-400">Invoice #INV-2026/042 • Klien B2B</div>
                </div>
              </div>

              {/* Client Name Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Nama Klien / Perusahaan:</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Project Title Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Nama Pekerjaan / Jasa:</label>
                <input 
                  type="text" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-semibold focus:outline-none focus:border-zinc-900"
                />
              </div>

              {/* Total Project Fee */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Total Nilai Proyek (Rp):</label>
                <div className="flex gap-2">
                  {[4000000, 8000000, 15000000].map(fee => (
                    <button
                      key={fee}
                      onClick={() => setProjectFee(fee)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${projectFee === fee ? 'bg-zinc-950 text-white border-zinc-950 font-bold' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
                    >
                      Rp {(fee / 1000000).toFixed(0)} Juta
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Term Options */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Termin Pembayaran:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentTerm('dp50')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold text-center cursor-pointer border ${paymentTerm === 'dp50' ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}
                  >
                    DP 50% di Awal
                  </button>
                  <button
                    onClick={() => setPaymentTerm('dp30')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold text-center cursor-pointer border ${paymentTerm === 'dp30' ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}
                  >
                    DP 30% di Awal
                  </button>
                  <button
                    onClick={() => setPaymentTerm('full')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold text-center cursor-pointer border ${paymentTerm === 'full' ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}
                  >
                    Lunas Sekaligus
                  </button>
                </div>
              </div>

              {/* Calculation Breakdown Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Total Kesepakatan Proyek:</span>
                  <span className="font-mono font-bold text-zinc-800">Rp {projectFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-950 text-sm pt-1 border-t border-zinc-200">
                  <span>Ditagihkan Sekarang ({paymentTerm === 'full' ? '100%' : paymentTerm === 'dp50' ? 'DP 50%' : 'DP 30%'}):</span>
                  <span className="font-mono text-emerald-700">Rp {billedAmount.toLocaleString('id-ID')}</span>
                </div>
                {remainingAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-zinc-400 italic">
                    <span>Sisa Pelunasan Sebelum Handover:</span>
                    <span className="font-mono">Rp {remainingAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: REALISTIC WHATSAPP CHAT PREVIEW (6 Cols) */}
            <div className="lg:col-span-6 bg-[#0B141B] rounded-3xl p-6 text-white shadow-xl border border-zinc-800">
              
              {/* WhatsApp Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                    {clientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">{clientName}</div>
                    <div className="text-[10px] text-emerald-400">Online</div>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">WhatsApp Business Sync</span>
              </div>

              {/* WhatsApp Message Bubble */}
              <div className="bg-[#1F2C34] rounded-2xl p-4 text-xs text-zinc-200 shadow-md space-y-2.5 max-w-[92%] ml-auto border border-zinc-700/40">
                <p className="m-0 leading-relaxed text-zinc-200">
                  Halo Bapak/Ibu di <strong className="text-white">{clientName}</strong>,
                </p>
                <p className="m-0 leading-relaxed text-zinc-300">
                  Terima kasih atas kepercayaannya. Terlampir invoice resmi untuk pengerjaan proyek <strong className="text-white">{projectName}</strong>:
                </p>

                <div className="p-3 rounded-xl bg-[#111B21] border border-zinc-700/60 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>Nomor:</span>
                    <span className="text-white font-bold">#INV-2026/042</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Tahap Tagihan:</span>
                    <span className="text-blue-400 font-bold">{paymentTerm === 'full' ? 'Pelunasan 100%' : paymentTerm === 'dp50' ? 'Termin 1 (DP 50%)' : 'Termin 1 (DP 30%)'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-400 text-xs pt-1 border-t border-zinc-800">
                    <span>Total Transfer:</span>
                    <span>Rp {billedAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-1">
                    BCA: 8830-1234-5678 a.n Studio Kreatif
                  </div>
                </div>

                {/* PDF File Attachment Card */}
                <div className="p-2.5 rounded-xl bg-[#2A3942] flex items-center justify-between cursor-pointer hover:bg-[#32444f] transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px]">
                      PDF
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-white">Invoice-042_{clientName.replace(/\s+/g, '_')}.pdf</div>
                      <div className="text-[9px] text-zinc-400">142 KB • Resmi Berstempel</div>
                    </div>
                  </div>
                  <Download size={14} className="text-zinc-400" />
                </div>

                <div className="flex justify-end items-center gap-1 text-[9px] text-zinc-400 pt-1">
                  <span>14:35</span>
                  <span className="text-emerald-400 font-bold">✓✓</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 text-center">
                <button
                  onClick={handleCopyWaMessage}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Send size={14} />
                  <span>{isCopied ? '✓ Teks Format WhatsApp Tersalin!' : 'Coba Salin Format Chat WhatsApp'}</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 3. KEY BENEFIT PILLARS FOR FREELANCERS & CREATIVE AGENCIES */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-zinc-200/80">
          <div className="text-center mb-14">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">KENAPA HARUS MYINVOICE</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mt-1">
              Tampil profesional di hadapan klien korporat
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-5 font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">Amankan DP Sebelum Mulai</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Hindari klien yang menghilang tanpa kabar setelah file dikirim. Terbitkan invoice DP 50% resmi lengkap dengan klausul pembayaran yang jelas.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-5 font-bold">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">Desain Dokumen Bersih & Elegan</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Tingkatkan nilai jasa freelance Anda. Dokumen A4 dengan tipografi standar internasional, stempel otomatis 'LUNAS', dan logo bisnismu sendiri.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-5 font-bold">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">Pantau Status & Jatuh Tempo</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Tidak perlu lagi mencatat tagihan di kertas atau memo HP. Sistem otomatis menandai tagihan yang belum dibayar, mendekati jatuh tempo, hingga lunas.
              </p>
            </div>
          </div>
        </section>

        {/* 4. COMPARISON TABLE: MYINVOICE VS EXCEL / WORD MANUAL */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="bg-zinc-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-center">
              Tinggalkan cara manual Word & Excel
            </h2>
            <p className="text-sm text-zinc-400 text-center max-w-xl mx-auto mb-8">
              Bandingkan efisiensi waktu kerja Anda saat menggunakan generator invoice otomatis vs cara lama yang memakan waktu.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 font-semibold">Aktivitas Tagihan</th>
                    <th className="pb-3 font-bold text-blue-400">MyInvoice Generator</th>
                    <th className="pb-3 font-semibold text-zinc-500">Ketik Manual di Word / Excel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  <tr>
                    <td className="py-3 font-medium">Waktu Bikin 1 Dokumen</td>
                    <td className="py-3 font-bold text-blue-400">30 Detik (Tinggal input angka)</td>
                    <td className="py-3 text-zinc-500">15 - 30 Menit (Edit tabel, rawan typo)</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Kirim ke WhatsApp Klien</td>
                    <td className="py-3 font-bold text-blue-400">1-Klik langsung tersusun rapi</td>
                    <td className="py-3 text-zinc-500">Simpan PDF manual, ketik pesan panjang lagi</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Kwitansi & Tanda Terima</td>
                    <td className="py-3 font-bold text-blue-400">Auto Generate dari data invoice</td>
                    <td className="py-3 text-zinc-500">Harus bikin file template baru lagi</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Pengingat Pembayaran Klien</td>
                    <td className="py-3 font-bold text-blue-400">Badge status real-time di dashboard</td>
                    <td className="py-3 text-zinc-500">Sering lupa menagih piutang yang lewat tempo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. FAQ SECTION */}
        <section className="py-20 px-6 max-w-3xl mx-auto border-t border-zinc-200/80">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              Pertanyaan Umum Freelancer & Agensi
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-zinc-950 bg-transparent border-none cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={18} 
                    className={`text-zinc-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-zinc-900' : ''}`} 
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 6. BOTTOM CTA */}
        <section className="py-20 px-6 bg-zinc-950 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              Tingkatkan standar bisnismu sekarang.
            </h2>
            <p className="text-base text-zinc-400 mb-8 max-w-xl mx-auto">
              Kirim tagihan profesional pertamamu dalam hitungan detik. Tanpa ribet, tanpa kartu kredit, 100% gratis.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 no-underline"
            >
              <span>Buat Invoice Freelance Sekarang — Gratis</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
