import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, ArrowRight, ChevronDown, Check, Send, 
  Download, ShieldCheck, DollarSign, Smartphone, Sparkles, Clock
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import RelatedTools from '../components/RelatedTools';

export default function SoftwareInvoiceFreelance() {
  const { lang } = useLang();
  const isEn = lang === 'EN';
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
    document.title = isEn
      ? "Free Freelance & Agency Invoicing Software | MyInvoice"
      : "Software Invoice Freelance & Agensi Gratis | MyInvoice";

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      isEn
        ? 'Free invoicing and billing software for freelancers, designers, developers, and creative agencies. Manage 50% down payments, send official branded PDFs via WhatsApp, and track client payments.'
        : 'Software pembuat faktur dan invoice gratis untuk freelancer, desainer, developer, dan agensi kreatif. Kelola DP 50%, kirim PDF resmi berlogo via WhatsApp, dan pantau pembayaran lunas tanpa ribet.'
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
            "description": isEn ? "Free Starter Plan for Freelancers, Consultants, and Creative Agencies" : "Paket Gratis untuk Freelancer, Konsultan, dan Agensi Kreatif"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "195",
            "bestRating": "5"
          }
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
  }, [isEn]);

  const faqsId = [
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
      a: "Paket Gratis mencakup hingga 25 dokumen setiap bulan, yang sudah sangat cukup untuk freelancer individual. Jika proyek Anda bertambah banyak, Anda bisa upgrade ke paket Pro tanpa kontrak mengikat."
    }
  ];

  const faqsEn = [
    {
      q: "Does MyInvoice support milestone project billing (Down Payments)?",
      a: "Absolutely! As a freelancer or agency, collecting a 50% upfront down payment protects your cash flow. With MyInvoice, you can issue Milestone 1 (Down Payment) invoices, generate official payment receipts once received, and issue the final settlement invoice before project handover."
    },
    {
      q: "How do I send an invoice directly to a client's WhatsApp?",
      a: "Simply click 'Send via WhatsApp' on the invoice page. The system automatically drafts a polite, corporate-ready billing message containing your bank transfer details and official PDF document."
    },
    {
      q: "Can I add my agency logo and official payment stamps?",
      a: "100% yes. Upload your studio logo, digital signature, and automatic status stamps (PAID IN FULL or DP RECEIVED) to build strong credibility with corporate clients."
    },
    {
      q: "Is there a monthly document limit on the free plan?",
      a: "The Starter Plan includes up to 25 documents per month—plenty for independent freelancers. As your project volume grows, you can upgrade to the Pro Plan anytime with no lock-in contracts."
    }
  ];

  const faqs = isEn ? faqsEn : faqsId;

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
              <span>{isEn ? 'Dedicated for Freelancers, Designers, Developers & Agencies' : 'Khusus Freelancer, Desainer, Developer & Agensi Kreatif'}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black tracking-tight text-zinc-950 leading-[1.08] mb-6 max-w-4xl mx-auto" style={{ letterSpacing: '-0.04em' }}>
              {isEn ? 'Official project invoices. Request down payments & final balance with ease.' : 'Faktur proyek resmi. Tagih DP & pelunasan tanpa canggung.'}
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
              {isEn ? 'Leave manual Word and Excel spreadsheets behind. Generate professional invoices with logo, 50% down-payment terms, and send official PDFs directly via WhatsApp in 30 seconds. 100% free.' : 'Tinggalkan cara manual ketik di Word atau Excel. Buat invoice berlogo profesional, atur termin DP 50%, dan kirim dokumen PDF resmi langsung ke WhatsApp klien dalam 30 detik. 100% gratis.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2 no-underline"
              >
                <span>{isEn ? 'Start Creating Freelance Invoices Free' : 'Mulai Buat Invoice Freelance Gratis'}</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="#freelance-demo"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm border border-zinc-200 shadow-xs transition-all no-underline"
              >
                {isEn ? 'Try Project Billing Simulator ↓' : 'Coba Simulasi Tagihan Proyek ↓'}
              </a>
            </div>

            {/* 3D HERO SHOWCASE: FREELANCE INVOICE & WHATSAPP PHONE */}
            <div className="relative max-w-3xl mx-auto my-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/80 border border-zinc-200/50 bg-gradient-to-b from-white to-zinc-50/50 p-2 sm:p-4">
                <img 
                  src="/images/hero-freelance-showcase.png" 
                  alt={isEn ? "Digital Freelance Project Invoice and WhatsApp PDF Notification" : "Invoice Proyek Freelance Digital dan Notifikasi WhatsApp PDF"} 
                  className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md rounded-xl"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src = "/images/hero-invoice-showcase.png";
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500 mt-6 font-medium">
              <span>✓ {isEn ? 'Down Payment & Milestone Terms' : 'Skema DP & Termin Pembayaran'}</span>
              <span>•</span>
              <span>✓ {isEn ? '1-Click Official PDF via WhatsApp' : 'Kirim PDF Resmi via WhatsApp 1-Klik'}</span>
              <span>•</span>
              <span>✓ {isEn ? 'Auto Stamped PAID & DP RECEIVED' : "Auto Stempel 'LUNAS' & 'DP DITERIMA'"}</span>
            </div>
          </div>
        </section>

        {/* 2. INTERACTIVE FREELANCE BILLING SIMULATOR */}
        <section id="freelance-demo" className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">INTERACTIVE FREELANCE BILLING PREVIEW</span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
              {isEn ? 'Project Billing & Client WhatsApp Simulator' : 'Simulasi Tagihan Proyek & Format WhatsApp Klien'}
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto mt-2">
              {isEn
                ? 'Customize the project details on the left and watch how a polite, corporate-ready billing message is automatically generated for your client.'
                : 'Ubah rincian proyek di sebelah kiri dan lihat bagaimana pesan penagihan profesional otomatis tersusun untuk dikirim ke WhatsApp klien.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: INVOICE CONFIGURATOR (6 Cols) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-950">{isEn ? 'Configure Project Billing' : 'Atur Tagihan Proyekmu'}</div>
                  <div className="text-xs text-zinc-400">{isEn ? 'Invoice #INV-2026/042 • B2B Client' : 'Invoice #INV-2026/042 • Klien B2B'}</div>
                </div>
              </div>

              {/* Client Name Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">{isEn ? 'Client / Company Name:' : 'Nama Klien / Perusahaan:'}</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-semibold focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {/* Project Title Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">{isEn ? 'Project / Service Scope:' : 'Nama Pekerjaan / Jasa:'}</label>
                <input 
                  type="text" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-semibold focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {/* Total Project Fee */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">{isEn ? 'Total Project Value (Rp):' : 'Total Nilai Proyek (Rp):'}</label>
                <div className="flex gap-2">
                  {[4000000, 8000000, 15000000].map(fee => (
                    <button
                      key={fee}
                      onClick={() => setProjectFee(fee)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${projectFee === fee ? 'bg-zinc-950 text-white border-zinc-950 font-bold' : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'}`}
                    >
                      Rp {(fee / 1000000).toFixed(0)} {isEn ? 'M' : 'Juta'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Term Options */}
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">{isEn ? 'Payment Milestone:' : 'Termin Pembayaran:'}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentTerm('dp50')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold text-center cursor-pointer border transition-all ${paymentTerm === 'dp50' ? 'bg-violet-50 border-violet-600 text-violet-900 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                  >
                    {isEn ? '50% Upfront DP' : 'DP 50% di Awal'}
                  </button>
                  <button
                    onClick={() => setPaymentTerm('dp30')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold text-center cursor-pointer border transition-all ${paymentTerm === 'dp30' ? 'bg-violet-50 border-violet-600 text-violet-900 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                  >
                    {isEn ? '30% Upfront DP' : 'DP 30% di Awal'}
                  </button>
                  <button
                    onClick={() => setPaymentTerm('full')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold text-center cursor-pointer border transition-all ${paymentTerm === 'full' ? 'bg-violet-50 border-violet-600 text-violet-900 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                  >
                    {isEn ? '100% Full Payment' : 'Lunas Sekaligus'}
                  </button>
                </div>
              </div>

              {/* Calculation Breakdown Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>{isEn ? 'Total Agreed Contract:' : 'Total Kesepakatan Proyek:'}</span>
                  <span className="font-mono font-bold text-zinc-800">Rp {projectFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-950 text-sm pt-1 border-t border-zinc-200">
                  <span>{isEn ? `Billed Now (${paymentTerm === 'full' ? '100%' : paymentTerm === 'dp50' ? '50% DP' : '30% DP'}):` : `Ditagihkan Sekarang (${paymentTerm === 'full' ? '100%' : paymentTerm === 'dp50' ? 'DP 50%' : 'DP 30%'}):`}</span>
                  <span className="font-mono font-black text-zinc-950">Rp {billedAmount.toLocaleString('id-ID')}</span>
                </div>
                {remainingAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-zinc-400 italic">
                    <span>{isEn ? 'Remaining Balance Before Handover:' : 'Sisa Pelunasan Sebelum Handover:'}</span>
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
                  {isEn ? <>Hello team at <strong className="text-white">{clientName}</strong>,</> : <>Halo Bapak/Ibu di <strong className="text-white">{clientName}</strong>,</>}
                </p>
                <p className="m-0 leading-relaxed text-zinc-300">
                  {isEn
                    ? <>Thank you for your trust. Please find attached the official invoice for the <strong className="text-white">{projectName}</strong> project:</>
                    : <>Terima kasih atas kepercayaannya. Terlampir invoice resmi untuk pengerjaan proyek <strong className="text-white">{projectName}</strong>:</>}
                </p>

                <div className="p-3 rounded-xl bg-[#111B21] border border-zinc-700/60 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-zinc-400">
                    <span>{isEn ? 'Invoice No:' : 'Nomor:'}</span>
                    <span className="text-white font-bold">#INV-2026/042</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>{isEn ? 'Billing Stage:' : 'Tahap Tagihan:'}</span>
                    <span className="text-violet-400 font-bold">
                      {paymentTerm === 'full'
                        ? (isEn ? '100% Full Settlement' : 'Pelunasan 100%')
                        : paymentTerm === 'dp50'
                          ? (isEn ? 'Term 1 (50% Down Payment)' : 'Termin 1 (DP 50%)')
                          : (isEn ? 'Term 1 (30% Down Payment)' : 'Termin 1 (DP 30%)')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-violet-400 text-xs pt-1 border-t border-zinc-800">
                    <span>{isEn ? 'Total Due:' : 'Total Transfer:'}</span>
                    <span>Rp {billedAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-1">
                    {isEn ? 'BCA: 8830-1234-5678 (Creative Studio)' : 'BCA: 8830-1234-5678 a.n Studio Kreatif'}
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
                      <div className="text-[9px] text-zinc-400">{isEn ? '142 KB • Official Stamped PDF' : '142 KB • Resmi Berstempel'}</div>
                    </div>
                  </div>
                  <Download size={14} className="text-zinc-400" />
                </div>

                <div className="flex justify-end items-center gap-1 text-[9px] text-zinc-400 pt-1">
                  <span>14:35</span>
                  <span className="text-violet-400 font-bold">✓✓</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 text-center">
                <button
                  onClick={handleCopyWaMessage}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <Send size={14} />
                  <span>{isCopied ? (isEn ? '✓ WhatsApp Message Copied!' : '✓ Teks Format WhatsApp Tersalin!') : (isEn ? 'Copy WhatsApp Chat Format' : 'Coba Salin Format Chat WhatsApp')}</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 3. KEY BENEFIT PILLARS FOR FREELANCERS & CREATIVE AGENCIES */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-zinc-200/80">
          <div className="text-center mb-14">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">{isEn ? 'WHY CHOOSE MYINVOICE' : 'KENAPA HARUS MYINVOICE'}</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mt-1">
              {isEn ? 'Look professional in front of corporate clients' : 'Tampil profesional di hadapan klien korporat'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-800 flex items-center justify-center mb-5 font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">{isEn ? 'Secure Down Payments Upfront' : 'Amankan DP Sebelum Mulai'}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isEn
                  ? 'Avoid clients ghosting after deliverables are sent. Issue official 50% down-payment invoices with clear payment terms.'
                  : 'Hindari klien yang menghilang tanpa kabar setelah file dikirim. Terbitkan invoice DP 50% resmi lengkap dengan klausul pembayaran yang jelas.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-800 flex items-center justify-center mb-5 font-bold">
                <Sparkles size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">{isEn ? 'Clean & Elegant Document Design' : 'Desain Dokumen Bersih & Elegan'}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isEn
                  ? 'Elevate your freelance brand value. International-standard A4 typography, automatic PAID stamps, and your own custom studio logo.'
                  : 'Tingkatkan nilai jasa freelance Anda. Dokumen A4 dengan tipografi standar internasional, stempel otomatis LUNAS, dan logo bisnismu sendiri.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-800 flex items-center justify-center mb-5 font-bold">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">{isEn ? 'Track Status & Due Dates' : 'Pantau Status & Jatuh Tempo'}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isEn
                  ? 'Stop tracking unpaid bills on sticky notes. Automatically flag pending invoices, upcoming due dates, and settled accounts.'
                  : 'Tidak perlu lagi mencatat tagihan di kertas atau memo HP. Sistem otomatis menandai tagihan yang belum dibayar, mendekati jatuh tempo, hingga lunas.'}
              </p>
            </div>
          </div>
        </section>

        {/* 4. COMPARISON TABLE: MYINVOICE VS EXCEL / WORD MANUAL */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="bg-zinc-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-center">
              {isEn ? 'Ditch manual Word & Excel templates' : 'Tinggalkan cara manual Word & Excel'}
            </h2>
            <p className="text-sm text-zinc-400 text-center max-w-xl mx-auto mb-8">
              {isEn
                ? 'Compare your workflow speed using our automated invoice generator vs tedious manual spreadsheets.'
                : 'Bandingkan efisiensi waktu kerja Anda saat menggunakan generator invoice otomatis vs cara lama yang memakan waktu.'}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 font-semibold">{isEn ? 'Billing Activity' : 'Aktivitas Tagihan'}</th>
                    <th className="pb-3 font-bold text-violet-400">MyInvoice Generator</th>
                    <th className="pb-3 font-semibold text-zinc-500">{isEn ? 'Manual Word / Excel' : 'Ketik Manual di Word / Excel'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  <tr>
                    <td className="py-3 font-medium">{isEn ? 'Time to Create 1 Document' : 'Waktu Bikin 1 Dokumen'}</td>
                    <td className="py-3 font-bold text-violet-400">{isEn ? '30 Seconds (Just enter numbers)' : '30 Detik (Tinggal input angka)'}</td>
                    <td className="py-3 text-zinc-500">{isEn ? '15 - 30 Minutes (Formatting, typo-prone)' : '15 - 30 Menit (Edit tabel, rawan typo)'}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">{isEn ? 'Send to Client WhatsApp' : 'Kirim ke WhatsApp Klien'}</td>
                    <td className="py-3 font-bold text-violet-400">{isEn ? '1-Click pre-formatted message' : '1-Klik langsung tersusun rapi'}</td>
                    <td className="py-3 text-zinc-500">{isEn ? 'Export PDF manually, type long message' : 'Simpan PDF manual, ketik pesan panjang lagi'}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">{isEn ? 'Receipts & Proof of Payment' : 'Kwitansi & Tanda Terima'}</td>
                    <td className="py-3 font-bold text-violet-400">{isEn ? 'Auto-generated from invoice data' : 'Auto Generate dari data invoice'}</td>
                    <td className="py-3 text-zinc-500">{isEn ? 'Must build a separate template file' : 'Harus bikin file template baru lagi'}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">{isEn ? 'Client Payment Reminders' : 'Pengingat Pembayaran Klien'}</td>
                    <td className="py-3 font-bold text-violet-400">{isEn ? 'Real-time status badges on dashboard' : 'Badge status real-time di dashboard'}</td>
                    <td className="py-3 text-zinc-500">{isEn ? 'Easy to forget overdue receivables' : 'Sering lupa menagih piutang yang lewat tempo'}</td>
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
              {isEn ? 'Freelancer & Agency FAQs' : 'Pertanyaan Umum Freelancer & Agensi'}
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

                {/* Internal Linking: Related Free Business Tools */}
        <div className="max-w-4xl mx-auto px-6">
          <RelatedTools currentSlug="software-invoice-freelance" />
        </div>

        {/* 6. BOTTOM CTA */}
        <section className="py-20 px-6 bg-zinc-950 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
              {isEn ? 'Upgrade your freelance workflow today.' : 'Tingkatkan standar bisnismu sekarang.'}
            </h2>
            <p className="text-base text-zinc-400 mb-8 max-w-xl mx-auto">
              {isEn
                ? 'Send your first professional project invoice in seconds. Hassle-free, no credit card required, 100% free.'
                : 'Kirim tagihan profesional pertamamu dalam hitungan detik. Tanpa ribet, tanpa kartu kredit, 100% gratis.'}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 no-underline"
            >
              <span>{isEn ? 'Create Freelance Invoice Now — Free' : 'Buat Invoice Freelance Sekarang — Gratis'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
