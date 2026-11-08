import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, ArrowRight, ChevronDown, Check, Send, 
  Download, ShieldCheck, DollarSign, Smartphone, Sparkles, Clock,
  Printer, ShoppingCart, Plus, Minus, RotateCcw, Building2, Store, HelpCircle
} from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import RelatedTools from '../components/RelatedTools';
import { getIndustryBySlug } from '../data/seoIndustries';
import { formatIDR } from '../utils/currency';

function IndustryLandingContent({ slug }) {
  const industry = useMemo(() => getIndustryBySlug(slug), [slug]);

  const [openFaq, setOpenFaq] = useState(null);

  // --- INVOICE SIMULATOR STATE ---
  const [selectedTermId, setSelectedTermId] = useState(industry?.sampleProject?.termOptions?.[0]?.id || 'dp50');
  const projectFee = industry?.sampleProject?.defaultFee || 5000000;
  const [isCopiedWa, setIsCopiedWa] = useState(false);

  // --- POS KASIR SIMULATOR STATE ---
  const [printerFormat, setPrinterFormat] = useState('58mm');
  const [posCart, setPosCart] = useState(() => (
    industry?.type === 'kasir' && industry?.posDemo?.menu
      ? industry.posDemo.menu.map(m => ({ ...m, orderQty: m.qty || 1 }))
      : []
  ));
  const [isPrintingAnim, setIsPrintingAnim] = useState(false);
  const [printSuccessCount, setPrintSuccessCount] = useState(0);

  // SEO Metas & JSON-LD
  useEffect(() => {
    if (!industry) return;

    document.title = industry.metaTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', industry.metaDescription);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', industry.canonicalUrl);

    // Inject FAQ & Software Schema
    const scriptId = 'industry-jsonld-schema';
    let scriptTag = document.getElementById(scriptId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": `MyInvoice — ${industry.industryName}`,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All modern browsers (Web, Android, iOS, Windows, macOS)",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR",
            "description": `Solusi Invoice dan Kasir Gratis untuk ${industry.industryName}`
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "218",
            "bestRating": "5"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": industry.faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        }
      ]
    };
    scriptTag.textContent = JSON.stringify(schemaData);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [industry]);

  if (!industry) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Halaman Solusi Industri Tidak Ditemukan</h1>
        <p className="text-sm text-slate-500 mb-6">Silakan pilih solusi invoice atau aplikasi kasir yang sesuai untuk bisnis Anda.</p>
        <Link to="/solusi" className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm shadow-xs hover:bg-black transition">
          Lihat Semua Solusi Industri
        </Link>
      </div>
    );
  }

  // Invoice calculations
  const activeTerm = industry.sampleProject?.termOptions?.find(t => t.id === selectedTermId) || { pct: 0.5 };
  const billedAmount = Math.round(projectFee * activeTerm.pct);
  const remainingAmount = Math.max(0, projectFee - billedAmount);

  const handleCopyWhatsApp = () => {
    const text = `Halo ${industry.sampleProject?.clientName || 'Bapak/Ibu'},\n\nTerlampir invoice untuk *${industry.sampleProject?.projectName}*.\nJumlah yang ditagihkan: *${formatIDR(billedAmount)}*.\n\nRincian dan faktur PDF resmi dapat dilihat di tautan ini.\nTerima kasih!`;
    navigator.clipboard.writeText(text);
    setIsCopiedWa(true);
    setTimeout(() => setIsCopiedWa(false), 2500);
  };

  // Kasir calculations
  const cartSubtotal = posCart.reduce((sum, item) => sum + (item.price * (item.orderQty || 1)), 0);
  const updatePosQty = (id, delta) => {
    setPosCart(prev => prev.map(item => {
      if (item.id === id) {
        const next = (item.orderQty || 1) + delta;
        return next > 0 ? { ...item, orderQty: next } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleSimulatePrint = () => {
    setIsPrintingAnim(true);
    setTimeout(() => {
      setIsPrintingAnim(false);
      setPrintSuccessCount(c => c + 1);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <LandingNavbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold mb-5">
              <Sparkles size={13} className="text-slate-500" />
              <span>{industry.badgeText}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.14] mb-5">
              {industry.heroTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
              {industry.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {industry.type === 'invoice' ? (
                <>
                  <Link
                    to="/invoice"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText size={16} />
                    <span>Buat Invoice {industry.industryName} Gratis</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/buat-invoice-gratis"
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-semibold text-sm shadow-2xs transition flex items-center justify-center gap-2"
                  >
                    <span>Coba Editor Tanpa Login</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/kasir"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Store size={16} />
                    <span>Buka Kasir POS {industry.industryName}</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/aplikasi-kasir-offline"
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-semibold text-sm shadow-2xs transition flex items-center justify-center gap-2"
                  >
                    <Printer size={15} className="text-slate-500" />
                    <span>Uji Kasir Offline & Struk</span>
                  </Link>
                </>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-slate-700" /> 100% Gratis Tanpa Batas</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-slate-700" /> Tanpa Watermark Iklan</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-slate-700" /> Cetak & Kirim WA Langsung</span>
            </div>
          </div>

          {/* INTERACTIVE SIMULATOR (INVOICE OR KASIR POS) */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-8 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                  {industry.type === 'invoice' ? <FileText size={17} /> : <Printer size={17} />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 m-0">
                    {industry.type === 'invoice' ? 'Simulator Tagihan Termin & Invoice' : 'Simulator Kasir POS & Cetak Struk Bluetooth'}
                  </h3>
                  <p className="text-xs text-slate-500 m-0">
                    Contoh nyata alur kerja {industry.industryName} di lapangan
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                Interactive Preview
              </span>
            </div>

            {industry.type === 'invoice' ? (
              /* INVOICE SIMULATOR */
              <div className="space-y-6">
                {/* Project Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Klien Dituju:</span>
                    <span className="font-bold text-slate-900 text-sm">{industry.sampleProject?.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Nama Proyek:</span>
                    <span className="font-bold text-slate-900 text-sm">{industry.sampleProject?.projectName}</span>
                  </div>
                </div>

                {/* Term Selection */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2.5">
                    Pilih Tahapan / Termin Pembayaran:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {industry.sampleProject?.termOptions?.map((term) => (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => setSelectedTermId(term.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                          selectedTermId === term.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {term.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Amount Banner — Clean Modern Fintech Card */}
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Jumlah Ditagihkan pada Termin Ini:
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                      {formatIDR(billedAmount)}
                    </div>
                  </div>
                  <div className="bg-white px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-2xs text-left sm:text-right">
                    <span className="text-[11px] text-slate-500 block font-medium">Sisa Pelunasan Nanti:</span>
                    <span className="text-sm font-bold text-slate-800">{formatIDR(remainingAmount)}</span>
                  </div>
                </div>

                {/* Sample Item Breakdown Table */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 px-4 py-2.5 font-semibold text-slate-500 grid grid-cols-12 gap-2 uppercase tracking-wider text-[11px]">
                    <span className="col-span-7">Deskripsi Jasa / Spesifikasi</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-3 text-right">Subtotal</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {industry.sampleProject?.items?.map((item, idx) => (
                      <div key={idx} className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-slate-700">
                        <span className="col-span-7 font-medium text-slate-900">{item.name}</span>
                        <span className="col-span-2 text-center text-slate-500">{item.qty}x</span>
                        <span className="col-span-3 text-right font-bold text-slate-900">{formatIDR(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes box */}
                <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed">
                  <strong className="font-semibold text-slate-800">Catatan Resmi:</strong> {industry.sampleProject?.defaultNotes}
                </div>

                {/* Action CTA Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{isCopiedWa ? 'Pesan WhatsApp Tersalin!' : 'Salin Draft Pesan WhatsApp ke Klien'}</span>
                  </button>
                  <Link
                    to="/buat-invoice-gratis"
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition text-center"
                  >
                    <FileText size={14} />
                    <span>Buat Invoice Ini Sekarang (Gratis)</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* KASIR POS SIMULATOR */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Interactive Menu selection */}
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Daftar Layanan / Menu Kasir:
                    </span>
                    <span className="text-[11px] text-slate-400">Klik +/- untuk coba transaksi</span>
                  </div>

                  <div className="space-y-2.5">
                    {posCart.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500">{formatIDR(item.price)} per {item.unit} • <span className="text-slate-700 font-medium">{item.note}</span></div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updatePosQty(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center font-bold text-slate-900">{item.orderQty || 1}</span>
                          <button
                            type="button"
                            onClick={() => updatePosQty(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-black text-white flex items-center justify-center transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Total Kasir:</span>
                    <span className="text-lg font-bold text-slate-950">{formatIDR(cartSubtotal)}</span>
                  </div>
                </div>

                {/* Right: Simulated Thermal Receipt */}
                <div className="md:col-span-5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-semibold text-slate-600">Preview Struk Kasir:</span>
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setPrinterFormat('58mm')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${printerFormat === '58mm' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                        >
                          58mm
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrinterFormat('80mm')}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${printerFormat === '80mm' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                        >
                          80mm
                        </button>
                      </div>
                    </div>

                    {/* Paper Mockup */}
                    <div className={`mx-auto bg-white p-4 rounded-xl shadow-xs border border-slate-200 font-mono text-[11px] leading-tight text-slate-800 ${printerFormat === '58mm' ? 'max-w-[240px]' : 'max-w-[280px]'}`}>
                      <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
                        <div className="text-xs uppercase">{industry.posDemo?.businessName}</div>
                        <div className="text-[9px] text-slate-500 font-sans mt-0.5">Nota Resmi • Bluetooth Thermal</div>
                      </div>

                      <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5">
                        {posCart.map(i => (
                          <div key={i.id} className="flex justify-between items-start gap-1">
                            <span className="truncate">{i.orderQty}x {i.name}</span>
                            <span className="shrink-0">{formatIDR(i.price * i.orderQty)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="py-2 border-b border-dashed border-slate-300 flex justify-between font-bold text-xs">
                        <span>TOTAL</span>
                        <span>{formatIDR(cartSubtotal)}</span>
                      </div>

                      <div className="pt-2 text-center text-[9px] text-slate-500 font-sans">
                        <div className="font-bold text-slate-700">{industry.posDemo?.receiptBadge}</div>
                        <div className="mt-1">Terima Kasih Atas Kunjungan Anda!</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={handleSimulatePrint}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                    >
                      <Printer size={14} />
                      <span>{isPrintingAnim ? 'Mencetak Struk...' : printSuccessCount > 0 ? `Struk Tercetak (${printSuccessCount}x)! Cetak Lagi` : 'Coba Simulasi Cetak Struk'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PAIN POINTS & SOLUTIONS */}
        <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Solusi Masalah Nyata
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Kenapa Praktisi {industry.industryName} Beralih ke MyInvoice?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {industry.painPoints?.map((item, idx) => (
                <div key={idx} className="bg-slate-50/60 rounded-2xl p-6 border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs mb-4">
                    0{idx + 1}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION: MYINVOICE VS MANUAL */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Perbandingan Solusi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              MyInvoice vs Cara Tradisional (Excel & Nota Kertas)
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="grid grid-cols-12 bg-slate-50 text-xs font-semibold text-slate-600 py-3.5 px-5 border-b border-slate-200/80">
              <span className="col-span-5 sm:col-span-4">Fitur Kebutuhan {industry.industryName}</span>
              <span className="col-span-3 sm:col-span-4 text-center text-slate-400">Cara Manual / Excel</span>
              <span className="col-span-4 sm:col-span-4 text-center text-slate-950 font-bold">MyInvoice (Gratis)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="grid grid-cols-12 py-3 px-5 items-center">
                <span className="col-span-5 sm:col-span-4 font-semibold text-slate-800">Kecepatan Pembuatan</span>
                <span className="col-span-3 sm:col-span-4 text-center text-slate-400">15 - 30 Menit (Edit cell rumit)</span>
                <span className="col-span-4 sm:col-span-4 text-center font-bold text-slate-900">&lt; 30 Detik di HP / Laptop</span>
              </div>
              <div className="grid grid-cols-12 py-3 px-5 items-center bg-slate-50/40">
                <span className="col-span-5 sm:col-span-4 font-semibold text-slate-800">Format Termin / Pembayaran DP</span>
                <span className="col-span-3 sm:col-span-4 text-center text-slate-400">Hitung manual rawan salah</span>
                <span className="col-span-4 sm:col-span-4 text-center font-bold text-slate-900">Otomatis Terpisah DP & Sisa</span>
              </div>
              <div className="grid grid-cols-12 py-3 px-5 items-center">
                <span className="col-span-5 sm:col-span-4 font-semibold text-slate-800">Pengiriman Tagihan ke WhatsApp</span>
                <span className="col-span-3 sm:col-span-4 text-center text-slate-400">Ketik pesan manual satu per satu</span>
                <span className="col-span-4 sm:col-span-4 text-center font-bold text-slate-900">1 Klik Pesan Ringkas + Link PDF</span>
              </div>
              <div className="grid grid-cols-12 py-3 px-5 items-center bg-slate-50/40">
                <span className="col-span-5 sm:col-span-4 font-semibold text-slate-800">Kredibilitas Tampilan Brand</span>
                <span className="col-span-3 sm:col-span-4 text-center text-slate-400">Format kotak kaku / nota buram</span>
                <span className="col-span-4 sm:col-span-4 text-center font-bold text-slate-900">Desain Modern A4 & Stempel Lunas</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section className="py-16 bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Pertanyaan Umum
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Tanya Jawab Seputar Penagihan & Kasir {industry.industryName}
              </h2>
            </div>

            <div className="space-y-3">
              {industry.faqs?.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/80 overflow-hidden transition-all bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full py-4 px-5 text-left font-bold text-slate-900 text-sm flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-slate-800' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM FINAL CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Siap Mengelola Keuangan {industry.industryName} dengan Lebih Rapi?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
              Bergabunglah dengan ribuan pelaku usaha dan profesional Indonesia yang menghemat waktu penagihan setiap bulannya bersama MyInvoice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {industry.type === 'invoice' ? (
                <Link
                  to="/invoice"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  <span>Mulai Buat Invoice Sekarang (Gratis)</span>
                </Link>
              ) : (
                <Link
                  to="/kasir"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Store size={16} />
                  <span>Mulai Kasir POS Sekarang (Gratis)</span>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* RELATED TOOLS */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <RelatedTools currentSlug={slug} />
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

export default function IndustryLanding({ explicitSlug }) {
  const params = useParams();
  const slug = explicitSlug || params.slug;
  return <IndustryLandingContent key={slug} slug={slug} />;
}
