import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Send, Check, ChevronDown, ArrowRight, Download, 
  QrCode, Shield, CheckCircle2, Plus, Trash2, Printer, RotateCcw, 
  Sparkles, ExternalLink, Info
} from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import { generatePDF } from '../utils/pdf';

export default function BuatInvoiceGratis() {
  const [openFaq, setOpenFaq] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Default Instant Invoice State
  const defaultInvoiceData = {
    businessName: 'Studio Desain & Kreatif',
    businessContact: 'Jl. Sudirman No. 45, Jakarta Selatan • 0812-3456-7890 • halo@studiodesain.id',
    clientName: 'PT Maju Cipta Sejahtera',
    clientContact: 'Gedung Menara 8 Lt. 12, Jakarta Selatan • finance@majucipta.co.id',
    invoiceNumber: 'INV-2026/042',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'MENUNGGU', // 'LUNAS' | 'MENUNGGU'
    items: [
      { id: 1, name: 'Desain Identitas Brand & Panduan Logo', qty: 1, price: 2500000 },
      { id: 2, name: 'Pengembangan Website Responsif', qty: 1, price: 3000000 }
    ],
    discount: 0,
    enableTax: false, // PPN 11%
    bankName: 'BCA',
    accountNumber: '873-098-1291',
    accountHolder: 'Studio Desain Kreatif',
    notes: 'Terima kasih atas kerja samanya. Pembayaran mohon ditransfer sebelum tanggal jatuh tempo.'
  };

  // Load from localStorage if present
  const [invoiceData, setInvoiceData] = useState(() => {
    try {
      const saved = localStorage.getItem('myinvoice_instant_draft');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return defaultInvoiceData;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('myinvoice_instant_draft', JSON.stringify(invoiceData));
    } catch {
      // ignore
    }
  }, [invoiceData]);

  // Calculations
  const subtotal = invoiceData.items.reduce((acc, curr) => acc + (Number(curr.price || 0) * Number(curr.qty || 0)), 0);
  const discountAmount = Number(invoiceData.discount || 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = invoiceData.enableTax ? Math.round(afterDiscount * 0.11) : 0;
  const grandTotal = afterDiscount + taxAmount;

  // Actions
  const addItemRow = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: Date.now(), name: '', qty: 1, price: 0 }
      ]
    }));
  };

  const removeItemRow = (id) => {
    if (invoiceData.items.length <= 1) return;
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItemRow = (id, field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const filename = `${invoiceData.invoiceNumber || 'Invoice'}_${(invoiceData.clientName || 'Client').replace(/\s+/g, '_')}.pdf`;
      await generatePDF('instant-invoice-sheet', filename, false);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    const textMsg = `Halo *${invoiceData.clientName}*,\n\nBerikut rincian invoice resmi:\n*Nomor:* ${invoiceData.invoiceNumber}\n*Total Tagihan:* Rp ${grandTotal.toLocaleString('id-ID')}\n*Jatuh Tempo:* ${invoiceData.dueDate}\n*Status:* ${invoiceData.status === 'LUNAS' ? 'LUNAS' : 'Menunggu Pembayaran'}\n\n*Rekening Transfer:*\n${invoiceData.bankName} ${invoiceData.accountNumber}\na.n ${invoiceData.accountHolder}\n\n${invoiceData.notes}\n\nTerima kasih!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (window.confirm('Reset data invoice ke template awal?')) {
      setInvoiceData(defaultInvoiceData);
      localStorage.removeItem('myinvoice_instant_draft');
    }
  };

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
      'Buat invoice, faktur tagihan, dan kwitansi online gratis langsung di browser. Tanpa registrasi, ekspor PDF instan, kirim via WhatsApp, dan hitung PPN otomatis.'
    );

    // 3. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/buat-invoice-gratis');

    // 4. Schema.org JSON-LD Structured Data
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "MyInvoice Free Online Invoice Generator",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All modern browsers (Web, Android, iOS, Windows, macOS)",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR",
            "description": "Generator Faktur & Invoice Gratis Tanpa Login"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "240",
            "bestRating": "5"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Apakah benar-benar bisa membuat invoice gratis tanpa login?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Bisa. Anda bisa langsung mengetik rincian invoice pada lembar kerja di atas dan mengunduh PDF secara instan tanpa perlu mendaftar akun terlebih dahulu."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah data invoice saya tersimpan aman?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Pembuatan invoice instan ini diproses 100% di memori browser Anda secara lokal, sehingga data Anda sepenuhnya privat dan tidak terunggah ke server sebelum Anda memutuskan untuk mendaftar akun."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah invoice bisa langsung dikirim ke WhatsApp klien?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Bisa. Anda cukup mengklik tombol Kirim WhatsApp untuk membuka pesan otomatis yang berisi ringkasan tagihan, nomor rekening, dan nominal transfer."
              }
            },
            {
              "@type": "Question",
              "name": "Apa keuntungan mendaftar akun jika generator ini gratis?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Dengan mendaftar akun gratis, Anda bisa menyimpan riwayat seluruh invoice ke cloud, menghapus watermark pada paket Pro, melacak status pelunasan klien secara otomatis, dan mengelola stok kasir toko dalam satu dashboard."
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
      q: "Apakah benar-benar bisa membuat invoice gratis tanpa login?",
      a: "Bisa 100%! Anda bisa langsung mengisi nama bisnis, nama klien, item tagihan, dan rincian rekening pada lembar kerja di atas, lalu mengunduh dokumen PDF resmi tanpa perlu mendaftar akun terlebih dahulu."
    },
    {
      q: "Apakah data invoice saya aman saat menggunakan generator ini?",
      a: "Sangat aman. Pemrosesan data terjadi 100% di sisi browser Anda (client-side). Kami tidak menyimpan data sensitif klien Anda ke server pada mode instan tanpa login ini."
    },
    {
      q: "Bagaimana cara mengirim invoice langsung ke WhatsApp klien?",
      a: "Cukup klik tombol 'Kirim ke WhatsApp'. Sistem otomatis menyusun format pesan teks penagihan yang profesional lengkap dengan rincian rekening transfer Anda dan siap dikirim ke nomor WhatsApp klien."
    },
    {
      q: "Apa keuntungan mendaftar akun jika generator ini gratis?",
      a: "Dengan mendaftar akun gratis, Anda bisa menyimpan seluruh arsip invoice di database cloud, melacak status belum bayar vs lunas, mengaktifkan fitur kasir POS toko, dan menghapus watermark pada paket Pro."
    }
  ];

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION: PAPERLESS & PROFESSIONAL DIGITAL B2B FOCUS */}
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700 mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Digital Invoice & Facture Generator • Ekspor PDF Instan</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black tracking-tight text-zinc-950 leading-[1.08] mb-6 max-w-4xl mx-auto" style={{ letterSpacing: '-0.04em' }}>
              Buat faktur profesional. Tagih klien dan cair lebih cepat.
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
              Tinggalkan cara manual di Word atau Excel yang berantakan. Buat dokumen rapi berlogo tokomu, unduh PDF dalam 30 detik, dan kirim via WhatsApp tanpa login. 100% gratis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <a
                href="#interactive-sheet"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2"
              >
                <span>Mulai Buat Invoice di Bawah ↓</span>
                <ArrowRight size={16} />
              </a>
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm border border-zinc-200 shadow-xs transition-all"
              >
                Daftar Akun Cloud Gratis
              </Link>
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

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500 mt-6 font-medium">
              <span>✓ Siap Kirim ke WhatsApp</span>
              <span>•</span>
              <span>✓ Kustom Logo & Rekening Bank</span>
              <span>•</span>
              <span>✓ Tanpa Registrasi Akun</span>
            </div>
          </div>
        </section>

        {/* 2. THE FUNCTIONAL INSTANT INVOICE GENERATOR TOOL */}
        <section id="interactive-sheet" className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-xl shadow-zinc-200/50">
            
            {/* Action Bar Above Invoice */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-100 gap-4 mb-6">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={13} /> GENERATOR INVOICE INSTAN (GRATIS)
                </span>
                <div className="text-sm font-bold text-zinc-900 mt-0.5">
                  Edit data langsung pada lembar di bawah, lalu unduh PDF atau kirim via WA.
                </div>
              </div>

              {/* Status Switcher & Reset */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center p-1 bg-zinc-100 rounded-lg text-xs font-semibold">
                  <span className="px-2 text-zinc-500 text-[11px]">Status:</span>
                  <button
                    onClick={() => setInvoiceData(prev => ({ ...prev, status: 'LUNAS' }))}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${invoiceData.status === 'LUNAS' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-zinc-600'}`}
                  >
                    LUNAS
                  </button>
                  <button
                    onClick={() => setInvoiceData(prev => ({ ...prev, status: 'MENUNGGU' }))}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${invoiceData.status === 'MENUNGGU' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-zinc-600'}`}
                  >
                    MENUNGGU
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  title="Reset ke template awal"
                  className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-zinc-50 rounded-2xl border border-zinc-200/70">
              <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <Info size={14} className="text-blue-600" />
                <span>Otomatis tersimpan di memori browser Anda.</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <Send size={13} />
                  <span>Kirim ke WhatsApp</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl border border-zinc-200 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer size={13} />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-5 py-2 bg-zinc-950 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download size={13} />
                  <span>{isExportingPdf ? 'Membuat PDF...' : 'Download PDF Gratis'}</span>
                </button>
              </div>
            </div>

            {/* ACTUAL A4 EDITABLE INVOICE SHEET (CANVAS CAPTURE TARGET) */}
            <div 
              id="instant-invoice-sheet" 
              className="relative border border-zinc-200/90 rounded-2xl p-6 sm:p-10 bg-white shadow-sm space-y-6"
            >
              
              {/* Rubber Stamp Status */}
              <div className="absolute top-6 right-6 sm:right-10 pointer-events-none select-none">
                <div className={`px-4 py-1.5 rounded-lg border-2 font-black text-xs sm:text-sm tracking-widest uppercase transform rotate-2 ${
                  invoiceData.status === 'LUNAS'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/80 shadow-xs'
                    : 'border-amber-500 text-amber-700 bg-amber-50/80 shadow-xs'
                }`}>
                  {invoiceData.status === 'LUNAS' ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
                </div>
              </div>

              {/* Company Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-lg shrink-0 select-none">
                  {(invoiceData.businessName || 'M').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    value={invoiceData.businessName}
                    onChange={(e) => setInvoiceData({ ...invoiceData, businessName: e.target.value })}
                    placeholder="Nama Bisnis / Usaha Anda"
                    className="w-full text-lg sm:text-xl font-black text-zinc-950 border-b border-transparent hover:border-zinc-300 focus:border-zinc-950 focus:outline-none bg-transparent transition-colors mb-1"
                  />
                  <input
                    type="text"
                    value={invoiceData.businessContact}
                    onChange={(e) => setInvoiceData({ ...invoiceData, businessContact: e.target.value })}
                    placeholder="Alamat, Nomor Telepon, Email"
                    className="w-full text-xs text-zinc-500 border-b border-transparent hover:border-zinc-300 focus:border-zinc-950 focus:outline-none bg-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-zinc-50/80 border border-zinc-100 text-xs">
                <div className="sm:col-span-1">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-0.5">DITAGIHKAN KEPADA:</span>
                  <input
                    type="text"
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                    placeholder="Nama Klien / Perusahaan"
                    className="w-full font-bold text-zinc-900 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={invoiceData.clientContact}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientContact: e.target.value })}
                    placeholder="Alamat / Kontak Klien"
                    className="w-full text-[11px] text-zinc-500 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent mt-0.5"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-0.5">NO. INVOICE:</span>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                    placeholder="INV-2026/001"
                    className="w-full font-mono font-bold text-zinc-900 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-0.5">TANGGAL TERBIT:</span>
                  <input
                    type="date"
                    value={invoiceData.issueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, issueDate: e.target.value })}
                    className="w-full font-medium text-zinc-700 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent text-xs"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-0.5">JATUH TEMPO:</span>
                  <input
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                    className="w-full font-medium text-zinc-700 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent text-xs"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-200">
                  <div className="col-span-6 sm:col-span-7">Deskripsi Item / Layanan</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Harga Satuan (Rp)</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                {invoiceData.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 text-xs py-2 border-b border-zinc-100 items-center gap-2">
                    <div className="col-span-6 sm:col-span-7">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemRow(item.id, 'name', e.target.value)}
                        placeholder="Nama barang atau jasa..."
                        className="w-full font-semibold text-zinc-900 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent"
                      />
                    </div>
                    <div className="col-span-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItemRow(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-center font-mono text-zinc-800 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent"
                      />
                    </div>
                    <div className="col-span-3 text-right font-mono font-bold text-zinc-900">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={item.price}
                        onChange={(e) => updateItemRow(item.id, 'price', parseInt(e.target.value) || 0)}
                        className="w-full text-right font-mono font-bold text-zinc-900 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {invoiceData.items.length > 1 && (
                        <button
                          onClick={() => removeItemRow(item.id)}
                          title="Hapus Baris"
                          className="text-zinc-300 hover:text-red-500 p-1 border-none bg-transparent cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  onClick={addItemRow}
                  className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Tambah Baris Item</span>
                </button>
              </div>

              {/* Bottom Breakdown & Bank Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
                
                {/* Bank Account & Notes */}
                <div className="text-xs space-y-3">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">REKENING PEMBAYARAN:</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={invoiceData.bankName}
                        onChange={(e) => setInvoiceData({ ...invoiceData, bankName: e.target.value })}
                        placeholder="Nama Bank (BCA, Mandiri, dll)"
                        className="w-20 font-bold text-zinc-900 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent"
                      />
                      <input
                        type="text"
                        value={invoiceData.accountNumber}
                        onChange={(e) => setInvoiceData({ ...invoiceData, accountNumber: e.target.value })}
                        placeholder="Nomor Rekening"
                        className="flex-1 font-mono font-bold text-zinc-900 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      value={invoiceData.accountHolder}
                      onChange={(e) => setInvoiceData({ ...invoiceData, accountHolder: e.target.value })}
                      placeholder="Atas Nama Rekening"
                      className="w-full text-[11px] text-zinc-600 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 focus:outline-none bg-transparent"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">CATATAN PEMBAYARAN:</span>
                    <textarea
                      rows={2}
                      value={invoiceData.notes}
                      onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                      placeholder="Catatan tambahan untuk klien..."
                      className="w-full p-2 rounded-lg bg-zinc-50/70 border border-zinc-200/70 text-xs text-zinc-600 focus:outline-none focus:border-zinc-900 resize-none"
                    />
                  </div>
                </div>

                {/* Calculation Totals */}
                <div className="space-y-2 text-right font-mono text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal:</span>
                    <span className="font-bold text-zinc-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Discount row */}
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[11px]">Potongan Diskon (Rp):</span>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={invoiceData.discount}
                      onChange={(e) => setInvoiceData({ ...invoiceData, discount: parseInt(e.target.value) || 0 })}
                      className="w-28 text-right font-mono text-xs text-zinc-700 p-1 border border-zinc-200 rounded"
                    />
                  </div>

                  {/* Tax Checkbox */}
                  <div className="flex justify-between items-center text-zinc-500 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                      <input
                        type="checkbox"
                        checked={invoiceData.enableTax}
                        onChange={(e) => setInvoiceData({ ...invoiceData, enableTax: e.target.checked })}
                        className="rounded border-zinc-300"
                      />
                      <span>Tambahkan PPN 11%</span>
                    </label>
                    <span className="text-zinc-700">Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-zinc-950 font-sans text-sm sm:text-base font-black text-zinc-950">
                    <span>TOTAL TAGIHAN:</span>
                    <span className="text-xl font-mono text-emerald-700">Rp {grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Upgrade Banner */}
            <div className="mt-8 p-6 rounded-2xl bg-zinc-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span>Ingin simpan arsip invoice ke database cloud tanpa batas?</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Daftar akun gratis sekarang: riwayat aman, pantau pembayaran klien otomatis, dan dukung kasir toko offline.
                </div>
              </div>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold whitespace-nowrap shadow-md no-underline transition-all"
              >
                Daftar Akun Gratis
              </Link>
            </div>

          </div>
        </section>

        {/* 3. 5 DOKUMEN DALAM 1 TEMPAT (BENTO GRID) */}
        <section className="py-20 px-6 max-w-5xl mx-auto border-t border-zinc-200">
          <div className="mb-12">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">DOKUMEN BISNIS LENGKAP</span>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mt-1">
              Bukan cuma invoice, semua kebutuhan tokomu ada di sini.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="font-mono text-xs text-zinc-400">01 / TAGIHAN</span>
              <h3 className="text-lg font-black text-zinc-900 mt-2 mb-2">Invoice Resmi</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Tentukan termin pembayaran, nomor faktur otomatis, nomor rekening, dan hitung PPN otomatis tanpa rumus Excel rumit.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="font-mono text-xs text-zinc-400">02 / PEMBAYARAN</span>
              <h3 className="text-lg font-black text-zinc-900 mt-2 mb-2">Kwitansi & Tanda Terima</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Saat dana masuk ke rekening, langsung terbitkan kwitansi dengan stempel LUNAS untuk kepastian transaksi klien Anda.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="font-mono text-xs text-zinc-400">03 / PENAWARAN</span>
              <h3 className="text-lg font-black text-zinc-900 mt-2 mb-2">Surat Penawaran Harga (SPH)</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Kirim proposal penawaran harga yang rapi sebelum proyek disetujui. Sekali klik, konversi langsung menjadi invoice aktif.
              </p>
            </div>
          </div>
        </section>

        {/* 4. COMPARISON TABLE */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="bg-zinc-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-center">
              Tinggalkan cara manual yang membuang waktu
            </h2>
            <p className="text-sm text-zinc-400 text-center max-w-xl mx-auto mb-8">
              Bandingkan cara lama dengan efisiensi otomatis MyInvoice.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 font-semibold">Fitur / Kebutuhan</th>
                    <th className="pb-3 font-bold text-emerald-400">MyInvoice</th>
                    <th className="pb-3 font-semibold text-zinc-500">Excel / Word Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  <tr>
                    <td className="py-3 font-medium">Waktu Pembuatan</td>
                    <td className="py-3 font-bold text-emerald-400">30 Detik (Auto-hitung)</td>
                    <td className="py-3 text-zinc-500">15-30 Menit (Edit manual, rawan typo)</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Kirim ke WhatsApp Klien</td>
                    <td className="py-3 font-bold text-emerald-400">1-Klik langsung terformat rapi</td>
                    <td className="py-3 text-zinc-500">Ketik pesan manual & attach file</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Status Pembayaran Real-time</td>
                    <td className="py-3 font-bold text-emerald-400">Tercatat Lunas / Belum Lunas</td>
                    <td className="py-3 text-zinc-500">Harus cek mutasi bank bolak-balik</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Keamanan Data</td>
                    <td className="py-3 font-bold text-emerald-400">Tersimpan di Cloud Database</td>
                    <td className="py-3 text-zinc-500">Hilang jika laptop rusak/terhapus</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. FAQ SECTION */}
        <section className="py-20 px-6 max-w-3xl mx-auto border-t border-zinc-200">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Pertanyaan yang Sering Diajukan
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
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-zinc-900 bg-transparent border-none cursor-pointer"
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
              Mulai buat faktur pertamamu hari ini.
            </h2>
            <p className="text-base text-zinc-400 mb-8 max-w-xl mx-auto">
              Tingkatkan standar bisnis tokomu sekarang. Gratis, tanpa kartu kredit, dan langsung siap dipakai.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 no-underline"
            >
              <span>Daftar Akun Gratis Sekarang</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
