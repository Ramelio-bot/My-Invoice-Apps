import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Send, Check, ChevronDown, ArrowRight, Download, 
  QrCode, Shield, CheckCircle2, Plus, Trash2, Printer, RotateCcw, 
  Sparkles, ExternalLink, Info, Pencil, MousePointerClick, Edit3, Lock, X
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import { generatePDF } from '../utils/pdf';

const DEFAULT_ID = {
  businessName: 'Studio Desain & Kreatif',
  businessContact: 'Jl. Sudirman No. 45, Jakarta Selatan • 0812-3456-7890 • halo@studiodesain.id',
  clientName: 'PT Maju Cipta Sejahtera',
  clientContact: 'Gedung Menara 8 Lt. 12, Jakarta Selatan • finance@majucipta.co.id',
  item1: 'Desain Identitas Brand & Panduan Logo',
  item2: 'Pengembangan Website Responsif',
  accountHolder: 'Studio Desain Kreatif',
  notes: 'Terima kasih atas kerja samanya. Pembayaran mohon ditransfer sebelum tanggal jatuh tempo.'
};

const DEFAULT_EN = {
  businessName: 'Creative & Design Studio',
  businessContact: '45 Sudirman Ave, South Jakarta • 0812-3456-7890 • hello@designstudio.id',
  clientName: 'PT Maju Cipta Sejahtera',
  clientContact: 'Tower 8 Building 12th Fl, South Jakarta • finance@majucipta.co.id',
  item1: 'Brand Identity & Logo Guidelines',
  item2: 'Responsive Website Development',
  accountHolder: 'Creative Design Studio',
  notes: 'Thank you for your business. Please complete the transfer before the due date.'
};

export default function BuatInvoiceGratis() {
  const { lang, t } = useLang();
  const isEn = lang === 'EN';
  const [openFaq, setOpenFaq] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);

  const getInitialInvoiceData = (englishMode) => {
    const tpl = englishMode ? DEFAULT_EN : DEFAULT_ID;
    return {
      businessName: tpl.businessName,
      businessContact: tpl.businessContact,
      clientName: tpl.clientName,
      clientContact: tpl.clientContact,
      invoiceNumber: 'INV-2026/042',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'MENUNGGU', // 'LUNAS' | 'MENUNGGU'
      items: [
        { id: 1, name: tpl.item1, qty: 1, price: 2500000 },
        { id: 2, name: tpl.item2, qty: 1, price: 3000000 }
      ],
      discount: 0,
      enableTax: false, // PPN 11%
      bankName: 'BCA',
      accountNumber: '873-098-1291',
      accountHolder: tpl.accountHolder,
      notes: tpl.notes
    };
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
    return getInitialInvoiceData(isEn);
  });

  // Automatically translate default sample values when toggling ID <-> EN if untouched by user
  useEffect(() => {
    setInvoiceData(prev => {
      const fromTpl = isEn ? DEFAULT_ID : DEFAULT_EN;
      const toTpl = isEn ? DEFAULT_EN : DEFAULT_ID;
      const updated = { ...prev };
      if (prev.businessName === fromTpl.businessName) updated.businessName = toTpl.businessName;
      if (prev.businessContact === fromTpl.businessContact) updated.businessContact = toTpl.businessContact;
      if (prev.clientContact === fromTpl.clientContact) updated.clientContact = toTpl.clientContact;
      if (prev.accountHolder === fromTpl.accountHolder) updated.accountHolder = toTpl.accountHolder;
      if (prev.notes === fromTpl.notes) updated.notes = toTpl.notes;
      if (Array.isArray(prev.items)) {
        updated.items = prev.items.map(it => {
          if (it.name === fromTpl.item1) return { ...it, name: toTpl.item1 };
          if (it.name === fromTpl.item2) return { ...it, name: toTpl.item2 };
          return it;
        });
      }
      return updated;
    });
  }, [isEn]);

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
    const textMsg = isEn 
      ? `Hello *${invoiceData.clientName}*,\n\nHere are the details for your official invoice:\n*Invoice No:* ${invoiceData.invoiceNumber}\n*Total Amount Due:* Rp ${grandTotal.toLocaleString(t('locale_code') || 'id-ID')}\n*Due Date:* ${invoiceData.dueDate}\n*Payment Status:* ${invoiceData.status === 'LUNAS' ? 'PAID IN FULL (Thank you)' : 'PAYMENT PENDING'}\n\n*Bank Transfer Details:*\n${invoiceData.bankName} ${invoiceData.accountNumber}\nA.N ${invoiceData.accountHolder}\n\n${invoiceData.notes}\n\nThank you!\n────────────────────\nGenerated via https://myinvoice.space (Free Version)`
      : `Halo *${invoiceData.clientName}*,\n\nBerikut rincian invoice resmi:\n*Nomor:* ${invoiceData.invoiceNumber}\n*Total Tagihan:* Rp ${grandTotal.toLocaleString('id-ID')}\n*Jatuh Tempo:* ${invoiceData.dueDate}\n*Status:* ${invoiceData.status === 'LUNAS' ? 'LUNAS' : 'Menunggu Pembayaran'}\n\n*Rekening Transfer:*\n${invoiceData.bankName} ${invoiceData.accountNumber}\na.n ${invoiceData.accountHolder}\n\n${invoiceData.notes}\n\nTerima kasih!\n────────────────────\nDibuat otomatis via https://myinvoice.space (Versi Gratis)`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    const msg = isEn ? 'Reset invoice data to default template?' : 'Reset data invoice ke template awal?';
    if (window.confirm(msg)) {
      setInvoiceData(getInitialInvoiceData(isEn));
      localStorage.removeItem('myinvoice_instant_draft');
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    // 1. Title
    document.title = isEn
      ? "Free Online Invoice Generator | MyInvoice"
      : "Buat Invoice Online Gratis & Profesional | MyInvoice";

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
        ? 'Create free online invoices, billing statements, and receipts directly in your browser. No login required, instant PDF export, WhatsApp sharing, and automatic tax calculation.'
        : 'Buat invoice, faktur tagihan, dan kwitansi online gratis langsung di browser. Tanpa registrasi, ekspor PDF instan, kirim via WhatsApp, dan hitung PPN otomatis.'
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
            "description": isEn ? "Free Instant Invoice Generator Without Login" : "Generator Faktur & Invoice Gratis Tanpa Login"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "240",
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

  const faqsEn = [
    {
      q: "Can I truly create free invoices without signing up or logging in?",
      a: "100% yes! You can fill out your business name, client details, line items, and payment info directly on the worksheet above, then download an official PDF document without registering first."
    },
    {
      q: "Is my invoice data private and secure using this generator?",
      a: "Completely secure. All processing runs 100% locally in your web browser (client-side). We do not transmit or store your sensitive client information on our servers in this instant mode."
    },
    {
      q: "How do I send the invoice directly to a client via WhatsApp?",
      a: "Simply click 'Send to WhatsApp'. The system automatically formats a polite, professional invoice notification message containing your bank details, ready to dispatch to your client."
    },
    {
      q: "What are the benefits of registering an account if the tool is free?",
      a: "By creating a free account, you unlock unlimited cloud database storage for all invoices, real-time tracking for paid vs pending invoices, an offline-ready retail POS cashier system, and watermark removal."
    }
  ];

  const faqs = isEn ? faqsEn : faqsId;

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      {/* PRESTIGE UPGRADE MODAL (HOOK & LOCK FOR LOGO, QRIS & WHITE-LABEL) */}
      {showPrestigeModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowPrestigeModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-zinc-200 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowPrestigeModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1 rounded-full bg-transparent border-none cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Lock size={22} />
            </div>
            <h3 className="text-xl font-black text-zinc-950 mb-2">
              {isEn ? 'Look 100% Bona Fide & White-Label' : 'Tampil 100% Bonafide di Mata Klien'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
              {isEn
                ? 'In Instant Mode without login, documents carry the "Free Version" attribution and use a text initial. Register your account & activate PRO to unlock:'
                : 'Pada Mode Instan tanpa login, dokumen menyertakan atribusi "Versi Gratis" dan inisial teks. Daftar akun & aktifkan PRO untuk membuka:'}
            </p>
            <div className="space-y-2.5 mb-6 text-xs text-zinc-700 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? 'Upload your official Company Logo & automatic Store QRIS barcode' : 'Pasang Logo Resmi Perusahaan & lampirkan kode QRIS Toko otomatis'}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? '100% White-Label PDF & WhatsApp billing (Zero "Free Version" watermark)' : '100% White-Label: Hapus tulisan "Versi Gratis" di PDF & pesan WhatsApp'}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? 'Cloud invoice archive, 1-click Receipt/Quotation conversion & POS Cashier' : 'Simpan riwayat invoice di Cloud, konversi 1-klik jadi Kwitansi & Kasir POS'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <Link
                to="/register"
                className="w-full py-3.5 px-5 rounded-xl bg-zinc-950 hover:bg-black text-white font-bold text-xs sm:text-sm text-center no-underline shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>{isEn ? 'Create Account & Upload Logo' : 'Daftar Akun & Pasang Logo Bisnis'}</span>
                <ArrowRight size={15} />
              </Link>
              <button
                type="button"
                onClick={() => setShowPrestigeModal(false)}
                className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 bg-transparent border-none cursor-pointer"
              >
                {isEn ? 'Continue with Free Version' : 'Lanjut pakai Versi Gratis'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <span>{isEn ? 'Digital Invoice & Billing Generator • Instant PDF Export' : 'Generator Faktur & Invoice Digital • Ekspor PDF Instan'}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black tracking-tight text-zinc-950 leading-[1.08] mb-6 max-w-4xl mx-auto" style={{ letterSpacing: '-0.04em' }}>
              {isEn ? 'Create professional invoices. Bill clients and get paid faster.' : 'Buat faktur profesional. Tagih klien dan cair lebih cepat.'}
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
              {isEn
                ? 'Ditch messy manual Word or Excel templates. Create clean branded documents, download PDFs in 30 seconds, and send via WhatsApp without logging in. 100% free.'
                : 'Tinggalkan cara manual di Word atau Excel yang berantakan. Buat dokumen rapi berlogo tokomu, unduh PDF dalam 30 detik, dan kirim via WhatsApp tanpa login. 100% gratis.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <a
                href="#interactive-sheet"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2 no-underline"
              >
                <span>{isEn ? 'Start Creating Invoice Below ↓' : 'Mulai Buat Invoice di Bawah ↓'}</span>
                <ArrowRight size={16} />
              </a>
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm border border-zinc-200 shadow-xs transition-all no-underline"
              >
                {isEn ? 'Sign Up for Free Cloud Account' : 'Daftar Akun Cloud Gratis'}
              </Link>
            </div>

            {/* 3D HERO DIGITAL INVOICE SHOWCASE - A4 INVOICE & WHATSAPP NOTIFICATION */}
            <div className="relative max-w-3xl mx-auto my-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/80 border border-zinc-200/50 bg-gradient-to-b from-white to-zinc-50/50 p-2 sm:p-4">
                <img 
                  src="/images/hero-invoice-showcase.png" 
                  alt={isEn ? "Digital A4 Invoice Document with Paid Stamp and WhatsApp Integration" : "Dokumen Faktur Invoice Digital A4 dengan Stempel Lunas dan WhatsApp"} 
                  className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md rounded-xl"
                  loading="eager"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500 mt-6 font-medium">
              <span>✓ {isEn ? 'Ready to Send via WhatsApp' : 'Siap Kirim ke WhatsApp'}</span>
              <span>•</span>
              <span>✓ {isEn ? 'Custom Logo & Bank Details' : 'Kustom Logo & Rekening Bank'}</span>
              <span>•</span>
              <span>✓ {isEn ? 'No Account Required' : 'Tanpa Registrasi Akun'}</span>
            </div>
          </div>
        </section>

        {/* 2. THE FUNCTIONAL INSTANT INVOICE GENERATOR TOOL */}
        <section id="interactive-sheet" className="max-w-4xl mx-auto px-6 py-16">
          <style>{`
            @media print {
              .pdf-hide, nav, footer, section:not(#interactive-sheet), #interactive-sheet > div:first-child, #interactive-guidance-box {
                display: none !important;
              }
              #interactive-sheet {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
              }
              #instant-invoice-sheet {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
              }
              input, textarea {
                border: none !important;
                background: transparent !important;
                box-shadow: none !important;
                outline: none !important;
                padding: 0 !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-200 shadow-xl shadow-zinc-200/50">
            
            {/* Top Header & Status Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-zinc-100 gap-4 mb-6">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={13} /> {t('gen_badge')}
                </span>
                <div className="text-base sm:text-lg font-black text-zinc-950 mt-1">
                  {t('gen_title')}
                </div>
              </div>

              {/* Status Switcher & Reset */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center p-1 bg-zinc-100 rounded-lg text-xs font-semibold">
                  <span className="px-2 text-zinc-500 text-[11px]">{t('gen_status_label')}</span>
                  <button
                    type="button"
                    onClick={() => setInvoiceData(prev => ({ ...prev, status: 'LUNAS' }))}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${invoiceData.status === 'LUNAS' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-zinc-600'}`}
                  >
                    {isEn ? 'PAID' : 'LUNAS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceData(prev => ({ ...prev, status: 'MENUNGGU' }))}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${invoiceData.status === 'MENUNGGU' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-zinc-600'}`}
                  >
                    {isEn ? 'PENDING' : 'MENUNGGU'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  title={isEn ? "Reset to default template" : "Reset ke template awal"}
                  className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* UNMISTAKABLE INTERACTIVE EDIT GUIDANCE BANNER */}
            <div id="interactive-guidance-box" className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/90 border border-blue-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <MousePointerClick size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                      {isEn ? 'Direct Edit Mode Active' : 'Mode Edit Langsung Aktif'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      {isEn ? 'Type Directly on Paper' : 'Langsung Ketik di Kertas'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-950/80 font-medium mt-1 leading-relaxed">
                    {isEn ? <>Click and edit <strong>business name, client details, items/services, price, and bank details</strong> directly on the invoice sheet below. All totals calculate automatically.</> : <>Klik dan ubah <strong>nama bisnis, rincian klien, item barang/jasa, harga, dan rekening</strong> langsung pada lembar faktur di bawah. Semua hitungan otomatis terkalkulasi seketika.</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 border border-blue-200 text-xs font-bold text-blue-800 shadow-2xs shrink-0 self-stretch md:self-auto justify-center">
                <Edit3 size={13} className="text-blue-600" />
                <span>{isEn ? 'Click any text to edit' : 'Klik teks mana saja untuk mengedit'}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-zinc-50 rounded-2xl border border-zinc-200/70">
              <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <Info size={14} className="text-blue-600" />
                <span>{t('gen_saved_local')}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <Send size={13} />
                  <span>{t('gen_btn_wa')}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold rounded-xl border border-zinc-200 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer size={13} />
                  <span>{t('gen_btn_print')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-5 py-2 bg-zinc-950 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download size={13} />
                  <span>{isExportingPdf ? (isEn ? 'Generating PDF...' : 'Membuat PDF...') : t('gen_btn_download')}</span>
                </button>
              </div>
            </div>

            {/* ACTUAL A4 EDITABLE INVOICE SHEET (CANVAS CAPTURE TARGET) */}
            <div 
              id="instant-invoice-sheet" 
              className="relative border border-zinc-200/90 rounded-2xl p-6 sm:p-10 bg-white shadow-sm space-y-6"
            >
              
              {/* Rubber Stamp Status */}
              <div className="flex justify-end mb-2 sm:mb-0 sm:block sm:absolute sm:top-6 sm:right-10 pointer-events-none select-none">
                <div className={`px-4 py-1.5 rounded-lg border-2 font-black text-xs sm:text-sm tracking-widest uppercase transform rotate-2 ${
                  invoiceData.status === 'LUNAS'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/80 shadow-xs'
                    : 'border-amber-500 text-amber-700 bg-amber-50/80 shadow-xs'
                }`}>
                  {invoiceData.status === 'LUNAS' ? (isEn ? 'PAID IN FULL' : 'LUNAS') : (isEn ? 'PAYMENT PENDING' : 'MENUNGGU PEMBAYARAN')}
                </div>
              </div>

              {/* Company Header */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-lg select-none shadow-xs">
                    {(invoiceData.businessName || 'M').charAt(0).toUpperCase()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrestigeModal(true)}
                    className="pdf-hide text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2 py-0.5 rounded-md cursor-pointer transition-colors whitespace-nowrap"
                  >
                    {isEn ? '+ Custom Logo' : '+ Logo Bisnis'}
                  </button>
                </div>
                <div className="flex-1 max-w-lg space-y-2">
                  <div className="group relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1 pdf-hide">
                        <Pencil size={10} className="text-blue-500" /> {isEn ? 'YOUR BUSINESS / COMPANY NAME' : 'NAMA BISNIS / USAHA ANDA'}
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity pdf-hide">
                        {isEn ? 'Click to edit' : 'Klik untuk edit'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={invoiceData.businessName}
                      onChange={(e) => setInvoiceData({ ...invoiceData, businessName: e.target.value })}
                      placeholder={isEn ? 'Your Business / Store Name' : 'Nama Bisnis / Toko Anda'}
                      className="w-full text-base sm:text-lg font-black text-zinc-950 bg-zinc-50/80 hover:bg-zinc-100/70 focus:bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div className="group relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1 pdf-hide">
                        <Pencil size={10} className="text-blue-500" /> {isEn ? 'BUSINESS ADDRESS & CONTACT' : 'ALAMAT & KONTAK USAHA'}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={invoiceData.businessContact}
                      onChange={(e) => setInvoiceData({ ...invoiceData, businessContact: e.target.value })}
                      placeholder={isEn ? 'Address, Phone Number, Business Email' : 'Alamat, Nomor Telepon, Email Usaha'}
                      className="w-full text-xs text-zinc-600 bg-zinc-50/80 hover:bg-zinc-100/70 focus:bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 text-xs">
                <div className="sm:col-span-1 space-y-1.5 group">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold flex items-center gap-1">
                    <Pencil size={10} className="text-blue-500 pdf-hide" /> {t('gen_bill_to')}
                  </span>
                  <input
                    type="text"
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                    placeholder={isEn ? 'Client / Company Name' : 'Nama Klien / Perusahaan'}
                    className="w-full font-bold text-xs text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 outline-none transition-all shadow-2xs"
                  />
                  <input
                    type="text"
                    value={invoiceData.clientContact}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientContact: e.target.value })}
                    placeholder={isEn ? 'Client Address / Contact' : 'Alamat / Kontak Klien'}
                    className="w-full text-[11px] text-zinc-600 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 outline-none transition-all shadow-2xs"
                  />
                </div>

                <div className="group">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold flex items-center gap-1 mb-1">
                    <Pencil size={10} className="text-blue-500 pdf-hide" /> {t('gen_inv_no')}
                  </span>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                    placeholder="INV-2026/042"
                    className="w-full font-mono font-bold text-xs text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 outline-none transition-all shadow-2xs"
                  />
                </div>

                <div className="group">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold flex items-center gap-1 mb-1">
                    <Pencil size={10} className="text-blue-500 pdf-hide" /> {t('gen_issue_date')}
                  </span>
                  <input
                    type="date"
                    value={invoiceData.issueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, issueDate: e.target.value })}
                    className="w-full font-medium text-xs text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 outline-none transition-all shadow-2xs"
                  />
                </div>

                <div className="group">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold flex items-center gap-1 mb-1">
                    <Pencil size={10} className="text-blue-500 pdf-hide" /> {t('gen_due_date')}
                  </span>
                  <input
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                    className="w-full font-medium text-xs text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-200">
                  <div className="col-span-6 flex items-center gap-1">
                    <Pencil size={10} className="text-blue-500 pdf-hide" /> {t('gen_item_desc')}
                  </div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">{t('gen_unit_price')}</div>
                  <div className="col-span-1 text-center pdf-hide">{isEn ? 'Act' : 'Aksi'}</div>
                </div>

                {invoiceData.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 text-xs py-2.5 border-b border-zinc-100 items-center gap-2 group">
                    <div className="col-span-10 sm:col-span-6 order-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemRow(item.id, 'name', e.target.value)}
                        placeholder={isEn ? `Item / service name ${idx + 1}...` : `Nama item / jasa ${idx + 1}...`}
                        className="w-full font-semibold text-xs text-zinc-900 bg-zinc-50/80 hover:bg-zinc-100/70 focus:bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 outline-none transition-all shadow-2xs"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2 text-center order-3 sm:order-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItemRow(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-center font-mono font-bold text-xs text-zinc-800 bg-zinc-50/80 hover:bg-zinc-100/70 focus:bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg py-2 outline-none transition-all shadow-2xs"
                      />
                    </div>
                    <div className="col-span-8 sm:col-span-3 text-right order-4 sm:order-3">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-[11px] font-mono font-medium text-zinc-400 pointer-events-none pdf-hide">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.price}
                          onChange={(e) => updateItemRow(item.id, 'price', parseInt(e.target.value) || 0)}
                          className="w-full text-right font-mono font-bold text-xs text-zinc-900 bg-zinc-50/80 hover:bg-zinc-100/70 focus:bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg pl-8 pr-2.5 py-2 outline-none transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-center pdf-hide order-2 sm:order-4">
                      {invoiceData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          title={isEn ? "Delete Row" : "Hapus Baris"}
                          className="text-zinc-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 border-none bg-transparent cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItemRow}
                  className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 transition-colors cursor-pointer pdf-hide"
                >
                  <Plus size={14} />
                  <span>{t('gen_add_item')}</span>
                </button>
              </div>

              {/* Bottom Breakdown & Bank Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
                
                {/* Bank Account & Notes */}
                <div className="text-xs space-y-3">
                  <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80 space-y-2 group">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                      <Pencil size={10} className="text-blue-500 pdf-hide" /> {t('gen_bank_info')}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={invoiceData.bankName}
                        onChange={(e) => setInvoiceData({ ...invoiceData, bankName: e.target.value })}
                        placeholder={isEn ? 'Bank Name (BCA, etc)' : 'Nama Bank (BCA, Mandiri, dll)'}
                        className="w-28 font-bold text-xs text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 outline-none transition-all shadow-2xs"
                      />
                      <input
                        type="text"
                        value={invoiceData.accountNumber}
                        onChange={(e) => setInvoiceData({ ...invoiceData, accountNumber: e.target.value })}
                        placeholder={isEn ? 'Account Number' : 'Nomor Rekening'}
                        className="flex-1 font-mono font-bold text-xs text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 outline-none transition-all shadow-2xs"
                      />
                    </div>
                    <input
                      type="text"
                      value={invoiceData.accountHolder}
                      onChange={(e) => setInvoiceData({ ...invoiceData, accountHolder: e.target.value })}
                      placeholder={isEn ? 'Account Holder Name' : 'Atas Nama Rekening'}
                      className="w-full text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-2.5 py-1.5 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                      <Pencil size={10} className="text-blue-500 pdf-hide" /> {t('gen_notes')}
                    </span>
                    <textarea
                      rows={2}
                      value={invoiceData.notes}
                      onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                      placeholder={isEn ? 'Additional payment notes for client...' : 'Catatan tambahan untuk klien...'}
                      className="w-full p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-200 text-xs text-zinc-700 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Calculation Totals */}
                <div className="space-y-2 text-right font-mono text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>{t('gen_subtotal')}</span>
                    <span className="font-bold text-zinc-800">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Discount row */}
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[11px] font-medium">{t('gen_discount')}</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-[10px] font-mono text-zinc-400 pointer-events-none pdf-hide">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={invoiceData.discount}
                        onChange={(e) => setInvoiceData({ ...invoiceData, discount: parseInt(e.target.value) || 0 })}
                        className="w-32 text-right font-mono font-bold text-xs text-zinc-800 pl-7 pr-2 py-1.5 bg-white border border-zinc-200 hover:border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Tax Checkbox */}
                  <div className="flex justify-between items-center text-zinc-500 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                      <input
                        type="checkbox"
                        checked={invoiceData.enableTax}
                        onChange={(e) => setInvoiceData({ ...invoiceData, enableTax: e.target.checked })}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{t('gen_tax')}</span>
                    </label>
                    <span className="text-zinc-700 font-bold">Rp {taxAmount.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-zinc-950 font-sans text-sm sm:text-base font-black text-zinc-950">
                    <span>{t('gen_total')}</span>
                    <span className="text-xl font-mono text-emerald-700">Rp {grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>

              </div>

              {/* Official Free Version Watermark (Captured in PDF + Prestige Trigger) */}
              <div className="pt-4 border-t border-dashed border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
                <span>
                  {isEn
                    ? 'Generated with MyInvoice.space (Free Version) — Digital Invoice & POS Suite'
                    : 'Dokumen ini dibuat dengan MyInvoice.space (Versi Gratis) — Buat Invoice & Kasir Digital'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPrestigeModal(true)}
                  className="pdf-hide inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                >
                  <Lock size={11} />
                  <span>{isEn ? 'Remove Watermark & Add Logo (PRO)' : 'Hapus Watermark & Pasang Logo (PRO)'}</span>
                </button>
              </div>

            </div>

            {/* Bottom Upgrade Banner */}
            <div className="mt-8 p-6 rounded-2xl bg-zinc-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span>{isEn ? 'Want to save unlimited invoices to cloud database?' : 'Ingin simpan arsip invoice ke database cloud tanpa batas?'}</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {isEn ? 'Register a free account now: secure history, automatic client payment tracking, and offline POS cashier support.' : 'Daftar akun gratis sekarang: riwayat aman, pantau pembayaran klien otomatis, dan dukung kasir toko offline.'}
                </div>
              </div>
              <Link
                to="/register"
                className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold whitespace-nowrap shadow-md no-underline transition-all"
              >
                {isEn ? 'Register Free Account' : 'Daftar Akun Gratis'}
              </Link>
            </div>

          </div>
        </section>

        {/* 3. 5 DOKUMEN DALAM 1 TEMPAT (BENTO GRID) */}
        <section className="py-20 px-6 max-w-5xl mx-auto border-t border-zinc-200">
          <div className="mb-12">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">{isEn ? 'COMPLETE BUSINESS SUITE' : 'DOKUMEN BISNIS LENGKAP'}</span>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mt-1">
              {isEn ? 'Not just invoices, everything your business needs in one place.' : 'Bukan cuma invoice, semua kebutuhan tokomu ada di sini.'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="font-mono text-xs text-zinc-400">{isEn ? '01 / BILLING' : '01 / TAGIHAN'}</span>
              <h3 className="text-lg font-black text-zinc-900 mt-2 mb-2">{isEn ? 'Official Invoice' : 'Invoice Resmi'}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isEn ? 'Set payment terms, auto-increment invoice numbers, bank accounts, and calculate VAT without complex Excel formulas.' : 'Tentukan termin pembayaran, nomor faktur otomatis, nomor rekening, dan hitung PPN otomatis tanpa rumus Excel rumit.'}
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="font-mono text-xs text-zinc-400">{isEn ? '02 / PAYMENTS' : '02 / PEMBAYARAN'}</span>
              <h3 className="text-lg font-black text-zinc-900 mt-2 mb-2">{isEn ? 'Receipts & Delivery Proof' : 'Kwitansi & Tanda Terima'}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isEn ? 'When funds arrive, immediately issue official stamped receipts for verified transaction security.' : 'Saat dana masuk ke rekening, langsung terbitkan kwitansi dengan stempel LUNAS untuk kepastian transaksi klien Anda.'}
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-zinc-200 shadow-xs">
              <span className="font-mono text-xs text-zinc-400">{isEn ? '03 / QUOTES' : '03 / PENAWARAN'}</span>
              <h3 className="text-lg font-black text-zinc-900 mt-2 mb-2">{isEn ? 'Price Quotations (Quotes)' : 'Surat Penawaran Harga (SPH)'}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {isEn ? 'Send clean quote proposals before projects are approved. One click converts directly into an active invoice.' : 'Kirim proposal penawaran harga yang rapi sebelum proyek disetujui. Sekali klik, konversi langsung menjadi invoice aktif.'}
              </p>
            </div>
          </div>
        </section>

        {/* 4. COMPARISON TABLE */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="bg-zinc-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-center">
              {isEn ? 'Leave time-wasting manual workflows behind' : 'Tinggalkan cara manual yang membuang waktu'}
            </h2>
            <p className="text-sm text-zinc-400 text-center max-w-xl mx-auto mb-8">
              {isEn ? 'Compare legacy spreadsheets with MyInvoice automated efficiency.' : 'Bandingkan cara lama dengan efisiensi otomatis MyInvoice.'}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 font-semibold">{isEn ? 'Feature / Workflow' : 'Fitur / Kebutuhan'}</th>
                    <th className="pb-3 font-bold text-emerald-400">MyInvoice</th>
                    <th className="pb-3 font-semibold text-zinc-500">{isEn ? 'Manual Excel / Word' : 'Excel / Word Manual'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  <tr>
                    <td className="py-3 font-medium">{isEn ? 'Creation Time' : 'Waktu Pembuatan'}</td>
                    <td className="py-3 font-bold text-emerald-400">{isEn ? '30 Seconds (Auto-calculated)' : '30 Detik (Auto-hitung)'}</td>
                    <td className="py-3 text-zinc-500">{isEn ? '15-30 Minutes (Manual edits, typo-prone)' : '15-30 Menit (Edit manual, rawan typo)'}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">{isEn ? 'Send to Client WhatsApp' : 'Kirim ke WhatsApp Klien'}</td>
                    <td className="py-3 font-bold text-emerald-400">{isEn ? '1-Click pre-formatted text' : '1-Klik langsung terformat rapi'}</td>
                    <td className="py-3 text-zinc-500">{isEn ? 'Type manual message & attach file' : 'Ketik pesan manual & attach file'}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">{isEn ? 'Real-time Payment Status' : 'Status Pembayaran Real-time'}</td>
                    <td className="py-3 font-bold text-emerald-400">{isEn ? 'Tracked Paid / Pending' : 'Tercatat Lunas / Belum Lunas'}</td>
                    <td className="py-3 text-zinc-500">{isEn ? 'Constant bank statement checking' : 'Harus cek mutasi bank bolak-balik'}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">{isEn ? 'Data Safety' : 'Keamanan Data'}</td>
                    <td className="py-3 font-bold text-emerald-400">{isEn ? 'Saved in Cloud Database' : 'Tersimpan di Cloud Database'}</td>
                    <td className="py-3 text-zinc-500">{isEn ? 'Lost if laptop crashes or files corrupt' : 'Hilang jika laptop rusak/terhapus'}</td>
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
              {isEn ? 'Frequently Asked Questions' : 'Pertanyaan yang Sering Diajukan'}
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
              {isEn ? 'Start creating your first invoice today.' : 'Mulai buat faktur pertamamu hari ini.'}
            </h2>
            <p className="text-base text-zinc-400 mb-8 max-w-xl mx-auto">
              {isEn ? 'Elevate your business standards now. Free, no credit card required, ready to use immediately.' : 'Tingkatkan standar bisnis tokomu sekarang. Gratis, tanpa kartu kredit, dan langsung siap dipakai.'}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 no-underline"
            >
              <span>{isEn ? 'Register Free Account Now' : 'Daftar Akun Gratis Sekarang'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
