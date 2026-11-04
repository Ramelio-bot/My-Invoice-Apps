import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Send, Check, ChevronDown, ArrowRight, Download, QrCode, Shield, CheckCircle2 } from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function BuatInvoiceGratis() {
  const [openFaq, setOpenFaq] = useState(null);
  const [invoiceStatus, setInvoiceStatus] = useState('LUNAS'); // 'LUNAS' | 'MENUNGGU'
  const [showWaPreview, setShowWaPreview] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    // 1. Title
    document.title = "Buat Invoice Online Gratis & Profesional | MyInvoice";

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Buat invoice dan tagihan profesional dalam hitungan detik. Ekspor PDF instan, kirim via WhatsApp & email, dan pantau status pelunasan. 100% Gratis untuk freelancer dan agensi.'
    );

    // 3. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/buat-invoice-gratis');

    // 4. Schema.org JSON-LD
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "name": "MyInvoice - Pembuat Invoice Gratis",
          "url": "https://myinvoice.space/buat-invoice-gratis",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All (Web, Android, iOS)",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR",
            "description": "Gratis pembuatan invoice online untuk freelancer & UMKM"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "210",
            "bestRating": "5"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Apakah benar-benar gratis membuat invoice di MyInvoice?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ya, 100% gratis. Anda bisa langsung membuat invoice, kwitansi, surat penawaran harga, dan tanda terima profesional tanpa perlu berlangganan kartu kredit."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah invoice bisa diunduh dalam format PDF?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sangat bisa. Setiap dokumen invoice yang Anda buat dapat langsung diunduh dalam format PDF berkualitas tinggi yang siap dicetak atau dikirim via WhatsApp."
              }
            },
            {
              "@type": "Question",
              "name": "Bisakah menambahkan logo perusahaan sendiri?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Tentu saja. Anda dapat mengunggah logo usaha Anda, mengatur informasi rekening bank, hingga tanda tangan digital pada invoice."
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
      q: "Apakah benar-benar gratis tanpa batas waktu?",
      a: "Ya! Kamu bisa membuat hingga 25 invoice dan dokumen penagihan setiap bulan secara gratis selamanya. Tidak ada biaya pendaftaran dan tidak butuh kartu kredit."
    },
    {
      q: "Apakah format PDF-nya rapi dan profesional di mata klien?",
      a: "Sangat rapi. Template PDF kami dirancang berstandar korporat modern (A4) lengkap dengan kop logo usahamu, nomor seri faktur unik, rincian termin pembayaran, nomor rekening bank/QRIS, dan stempel status pembayaran."
    },
    {
      q: "Apakah bisa kirim langsung ke WhatsApp klien?",
      a: "Tentu. Sistem kami menyediakan generator tautan pesan WhatsApp otomatis. Cukup satu klik, pesan pengantar sopan beserta link unduh invoice PDF langsung terisi di aplikasi WhatsApp kamu."
    },
    {
      q: "Dokumen apa saja selain invoice yang bisa dibuat?",
      a: "MyInvoice mendukung ekosistem dokumen bisnis lengkap: Invoice Faktur, Kwitansi Pembayaran Resmi, Surat Penawaran Harga (Quotation/SPH), Purchase Order (PO), dan Tanda Terima Pembayaran."
    }
  ];

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION: PAPERLESS & PROFESSIONAL DIGITAL B2B FOCUS */}
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-16 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Digital Facture & Invoice Generator • Ekspor PDF Instan</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 leading-[1.08] mb-6 max-w-3xl mx-auto">
            Buat faktur profesional. Tagih klien dan cair lebih cepat.
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Tinggalkan cara lama membuat invoice manual di Word atau Excel yang berantakan. Buat dokumen rapi berlogo tokomu, unduh PDF dalam 30 detik, dan pantau status pembayaran secara otomatis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              <span>Buat Invoice Pertama Anda — Gratis</span>
              <ArrowRight size={16} />
            </Link>
            <a
              href="#interactive-sheet"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm border border-zinc-200 shadow-xs transition-all"
            >
              Lihat Preview Faktur A4 ↓
            </a>
          </div>

          {/* 3D HERO DIGITAL INVOICE SHOWCASE - A4 INVOICE & WHATSAPP NOTIFICATION */}
          <div className="relative max-w-3xl mx-auto my-8">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/80 border border-zinc-200/50 bg-gradient-to-b from-white to-zinc-50/50 p-2 sm:p-4">
              <img 
                src="/images/hero-invoice-showcase.png" 
                alt="Dokumen Faktur Invoice Digital A4 dengan Stempel Lunas dan WhatsApp" 
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md rounded-xl"
                loading="eager"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-400 mt-6">
            <span>✓ Siap Kirim ke WhatsApp</span>
            <span>•</span>
            <span>✓ Kustom Logo & Rekening Bank</span>
            <span>•</span>
            <span>✓ Gratis 25 Dokumen/Bulan</span>
          </div>
        </section>

        {/* 2. THE HERO A4 INVOICE SHEET INTERACTIVE SHOWCASE (DISTINCT VISUAL) */}
        <section id="interactive-sheet" className="max-w-4xl mx-auto px-6 mb-24">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-xl shadow-zinc-200/50">
            
            {/* Action Bar Above Invoice */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-100 gap-4 mb-6">
              <div>
                <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">A4 INVOICE ENGINE PREVIEW</span>
                <div className="text-sm font-bold text-zinc-900 mt-0.5">Template Resmi Bisnis (#INV-2026/042)</div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center p-1 bg-zinc-100 rounded-lg text-xs font-mono">
                  <span className="px-2 text-zinc-400">Status:</span>
                  <button
                    onClick={() => setInvoiceStatus('LUNAS')}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${invoiceStatus === 'LUNAS' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                  >
                    LUNAS
                  </button>
                  <button
                    onClick={() => setInvoiceStatus('MENUNGGU')}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${invoiceStatus === 'MENUNGGU' ? 'bg-amber-500 text-white font-bold' : 'text-zinc-600 hover:text-zinc-900'}`}
                  >
                    MENUNGGU
                  </button>
                </div>

                <button
                  onClick={() => setShowWaPreview(!showWaPreview)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send size={12} />
                  <span>Kirim WhatsApp</span>
                </button>
              </div>
            </div>

            {/* WA Dispatch Banner Preview (Conditional) */}
            {showWaPreview && (
              <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                <span>Pesan WhatsApp Siap: <em>"Halo PT Maju Cipta, berikut kami lampirkan Invoice #042 sebesar Rp 4.500.000..."</em></span>
                <span className="font-bold underline cursor-pointer" onClick={() => setShowWaPreview(false)}>Tutup</span>
              </div>
            )}

            {/* Simulated A4 High-End Digital Invoice */}
            <div className="border border-zinc-200/90 rounded-2xl p-6 sm:p-8 bg-[#FFFFFF] shadow-sm relative overflow-hidden">
              
              {/* Rubber Stamp Status */}
              <div className="absolute top-6 right-6 sm:right-10 pointer-events-none">
                <div className={`px-4 py-1.5 rounded-lg border-2 font-black text-xs sm:text-sm tracking-widest uppercase rotate-[-6deg] shadow-xs ${
                  invoiceStatus === 'LUNAS' 
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/80' 
                    : 'border-amber-500 text-amber-700 bg-amber-50/80'
                }`}>
                  {invoiceStatus === 'LUNAS' ? '✓ SUDAH LUNAS' : 'MENUNGGU PEMBAYARAN'}
                </div>
              </div>

              {/* Company Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-lg">
                  K
                </div>
                <div>
                  <div className="font-black text-base text-zinc-900 tracking-tight">KREASI DIGITAL STUDIO</div>
                  <div className="text-xs text-zinc-400">Jasa Branding, UI/UX & Web Development</div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-xs mb-8">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">DITAGIHKAN KEPADA:</span>
                  <span className="font-bold text-zinc-900">PT Maju Cipta Sejahtera</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">NO. INVOICE:</span>
                  <span className="font-mono font-bold text-zinc-900">INV-2026-XI-042</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">TANGGAL:</span>
                  <span className="font-medium text-zinc-700">04 November 2026</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">JATUH TEMPO:</span>
                  <span className="font-medium text-zinc-700">18 November 2026</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3 mb-8">
                <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-400 uppercase pb-2 border-b border-zinc-200">
                  <div className="col-span-8">Deskripsi Layanan / Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                <div className="grid grid-cols-12 text-xs py-2 border-b border-zinc-100 items-center">
                  <div className="col-span-8">
                    <div className="font-bold text-zinc-900">Desain Identitas Brand & Panduan Logo</div>
                    <div className="text-[11px] text-zinc-400">Termasuk mockup sosial media dan typography palette</div>
                  </div>
                  <div className="col-span-2 text-center font-mono text-zinc-600">1 Paket</div>
                  <div className="col-span-2 text-right font-mono font-bold text-zinc-900">Rp 2.500.000</div>
                </div>

                <div className="grid grid-cols-12 text-xs py-2 border-b border-zinc-100 items-center">
                  <div className="col-span-8">
                    <div className="font-bold text-zinc-900">Pengembangan Landing Page Responsif</div>
                    <div className="text-[11px] text-zinc-400">Setup domain kustom, SEO meta tags, dan analitik</div>
                  </div>
                  <div className="col-span-2 text-center font-mono text-zinc-600">1 Layanan</div>
                  <div className="col-span-2 text-right font-mono font-bold text-zinc-900">Rp 2.000.000</div>
                </div>
              </div>

              {/* Total Summary & Bank Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-200 items-end">
                <div className="text-xs space-y-1 p-3 bg-zinc-50 rounded-xl border border-zinc-100 font-mono">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">REKENING PEMBAYARAN:</span>
                  <div className="font-bold text-zinc-900">BCA: 873-098-1291</div>
                  <div className="text-zinc-600 text-[11px]">a.n Kreasi Digital Studio</div>
                </div>

                <div className="space-y-1.5 text-right font-mono">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Subtotal:</span>
                    <span>Rp 4.500.000</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Pajak (PPN 0%):</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200">
                    <span>Total Tagihan:</span>
                    <span className="text-lg">Rp 4.500.000</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 3. 5 DOKUMEN DALAM 1 TEMPAT (BENTO GRID) */}
        <section className="py-20 px-6 max-w-5xl mx-auto border-t border-zinc-200">
          <div className="mb-12">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">DOKUMEN BISNIS LENGKAP</span>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mt-1">
              Bukan cuma invoice faktur.
            </h2>
            <p className="text-zinc-500 text-sm mt-2">Dukung seluruh siklus kesepakatan dengan klien dari awal hingga lunas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <span className="text-xs font-mono text-zinc-400 block mb-2">01 / PENAWARAN</span>
              <h3 className="font-bold text-base text-zinc-900 mb-1">Surat Penawaran Harga (SPH)</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Ajukan proposal biaya resmi ke calon klien sebelum proyek dimulai.</p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <span className="text-xs font-mono text-zinc-400 block mb-2">02 / ORDER</span>
              <h3 className="font-bold text-base text-zinc-900 mb-1">Purchase Order (PO)</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Dokumen pesanan resmi untuk pengadaan barang atau bahan proyek.</p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <span className="text-xs font-mono text-zinc-400 block mb-2">03 / TAGIHAN</span>
              <h3 className="font-bold text-base text-zinc-900 mb-1">Invoice & Faktur Termin</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Tagih DP, termin berkala, atau pelunasan dengan rincian yang transparan.</p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <span className="text-xs font-mono text-zinc-400 block mb-2">04 / BUKTI BAYAR</span>
              <h3 className="font-bold text-base text-zinc-900 mb-1">Kwitansi Resmi</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Bukti penerimaan uang sah lengkap dengan konversi terbilang otomatis.</p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <span className="text-xs font-mono text-zinc-400 block mb-2">05 / SERAH TERIMA</span>
              <h3 className="font-bold text-base text-zinc-900 mb-1">Tanda Terima Dokumen</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Konfirmasi penyerahan hasil karya, berkas, atau barang ke tangan klien.</p>
            </div>

            <div className="p-6 bg-zinc-900 text-white rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 block mb-2">EKSPOR INSTAN</span>
                <h3 className="font-bold text-base text-white mb-1">PDF Kualitas Cetak</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Semua dokumen diunduh dalam format PDF tajam, siap cetak atau share.</p>
              </div>
              <Link to="/register" className="text-xs font-bold text-emerald-400 hover:underline mt-4">Coba Gratis Sekarang →</Link>
            </div>
          </div>
        </section>

        {/* 4. PRICING TEASER */}
        <section className="py-20 px-6 max-w-4xl mx-auto border-t border-zinc-200">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Pilihan Paket Pembuat Invoice</h2>
            <p className="text-zinc-500 text-sm mt-1">Mulai gratis untuk kebutuhan personal atau upgrade untuk hapus watermark.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="p-6 bg-white rounded-2xl border border-zinc-200 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-zinc-900">Invoice Starter</div>
                <div className="text-3xl font-black text-zinc-900 font-mono my-4">Rp 0</div>
                <ul className="space-y-2 text-xs text-zinc-600 mb-6">
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> 25 Invoice & Dokumen / Bulan</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> Ekspor PDF & Kirim via WhatsApp</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> Watermark halus MyInvoice</li>
                </ul>
              </div>
              <Link to="/register" className="w-full text-center py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-900 text-xs font-bold text-zinc-900 transition-all">
                Mulai Gratis
              </Link>
            </div>

            <div className="p-6 bg-zinc-900 text-white rounded-2xl border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm text-white">Invoice Pro</div>
                  <span className="text-[10px] bg-white text-zinc-900 font-black px-2 py-0.5 rounded">BEBAS WATERMARK</span>
                </div>
                <div className="text-3xl font-black text-white font-mono my-4">Rp 129.000 <span className="text-xs font-normal text-zinc-400">/bln</span></div>
                <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> <strong>100% Bebas Watermark di PDF</strong></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Unlimited Invoice & Klien</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Laporan Keuangan & Buku Kas Pro</li>
                </ul>
              </div>
              <Link to="/register" className="w-full text-center py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-900 transition-all">
                Pilih Paket Pro
              </Link>
            </div>
          </div>
        </section>

        {/* 5. FAQ ACCORDION */}
        <section className="py-20 px-6 max-w-3xl mx-auto border-t border-zinc-200">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Pertanyaan yang Sering Diajukan</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-zinc-200 rounded-2xl bg-white overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center cursor-pointer hover:bg-zinc-50"
                >
                  <span className="text-sm font-bold text-zinc-900">{faq.q}</span>
                  <ChevronDown size={16} className={`text-zinc-400 transition-transform ${openFaq === index ? 'rotate-180 text-zinc-900' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 pt-1 text-xs text-zinc-500 leading-relaxed border-t border-zinc-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 6. FINAL BOTTOM BAR */}
        <section className="py-20 px-6 bg-zinc-900 text-white text-center">
          <div className="max-w-xl mx-auto space-y-5">
            <h2 className="text-3xl font-black tracking-tight">Siap buat faktur pertamamu?</h2>
            <p className="text-xs text-zinc-400">Hanya butuh 30 detik. Tanpa kartu kredit.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-zinc-900 font-bold text-xs hover:bg-zinc-100 transition-all shadow-lg"
            >
              <span>Mulai Buat Invoice Sekarang</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}
