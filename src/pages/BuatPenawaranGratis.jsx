import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, Printer, Share2, Plus, Trash2, CheckCircle2,
  Sparkles, ShieldCheck, ArrowRight, RotateCcw, HelpCircle, ChevronDown,
  Lock, Crown, Check, Briefcase, RefreshCw, X
} from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import RelatedTools from '../components/RelatedTools';
import { generatePDF } from '../utils/pdf';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { trackEvent, savePublicCarryover } from '../utils/analytics';

const DEFAULT_ID = {
  quoteNumber: 'SPH/2026/11/018',
  issueDate: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  businessName: 'Kreasi Digital Nusantara',
  businessTagline: 'Software House, UI/UX & IT Consultant',
  businessContact: 'Jl. Jenderal Sudirman No. 45, Jakarta Selatan | WA: 0812-3456-7890',
  clientName: 'Bpk. Hendra Wijaya (Direktur Operasional)',
  clientCompany: 'PT Sinar Logistik Terpadu',
  clientAddress: 'Kawasan Industri Jababeka Blok C-12, Cikarang',
  subject: 'Penawaran Harga Pengembangan Sistem & Layanan Digital',
  openingNote: 'Dengan hormat, menindaklanjuti diskusi sebelumnya, bersama surat ini kami mengajukan penawaran harga terbaik dengan rincian sebagai berikut:',
  items: [
    { id: 1, name: 'Desain UI/UX & Arsitektur Sistem Web Korporat', qty: 1, price: 6500000 },
    { id: 2, name: 'Integrasi Modul Invoice & Pembayaran QRIS Otomatis', qty: 1, price: 4500000 },
    { id: 3, name: 'Maintenance Server, Garansi & Training Tim (3 Bulan)', qty: 1, price: 2000000 }
  ],
  discount: 500000,
  enableTax: false,
  terms: '1. Penawaran harga ini berlaku selama 14 hari kalender sejak tanggal diterbitkan.\n2. Termin pembayaran: Down Payment (DP) 50% di awal dan Pelunasan 50% setelah serah terima (BAST).\n3. Waktu pengerjaan estimasi 14-21 hari kerja setelah DP diterima.',
  signerName: 'Raka Pratama',
  signerRole: 'Managing Director'
};

const DEFAULT_EN = {
  quoteNumber: 'QTN/2026/11/018',
  issueDate: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  businessName: 'Kreasi Digital Nusantara',
  businessTagline: 'Software House, UI/UX & IT Consultant',
  businessContact: 'Sudirman Blvd No. 45, South Jakarta | WA: +62 812-3456-7890',
  clientName: 'Mr. Hendra Wijaya (Operations Director)',
  clientCompany: 'PT Sinar Logistik Terpadu',
  clientAddress: 'Jababeka Industrial Estate Block C-12, Cikarang',
  subject: 'Official Price Quotation for Digital System Development',
  openingNote: 'Dear Sir/Madam, following up on our recent discussion, we are pleased to submit our official price quotation as detailed below:',
  items: [
    { id: 1, name: 'Corporate Web UI/UX Design & System Architecture', qty: 1, price: 6500000 },
    { id: 2, name: 'Automated Invoice & QRIS Payment Gateway Integration', qty: 1, price: 4500000 },
    { id: 3, name: 'Server Maintenance, Warranty & Team Training (3 Months)', qty: 1, price: 2000000 }
  ],
  discount: 500000,
  enableTax: false,
  terms: '1. This quotation is valid for 14 calendar days from the issue date.\n2. Payment terms: 50% Down Payment (DP) upon approval and 50% final balance upon project handover.\n3. Estimated timeline: 14-21 business days after Down Payment is received.',
  signerName: 'Raka Pratama',
  signerRole: 'Managing Director'
};

export default function BuatPenawaranGratis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useLang();
  const isEn = lang === 'EN';

  const [quoteData, setQuoteData] = useState(() => {
    const saved = localStorage.getItem('myinvoice_free_quotation_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return isEn ? DEFAULT_EN : DEFAULT_ID;
  });

  const [isExporting, setIsExporting] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [showProModal, setShowProModal] = useState(false);
  const [prevLang, setPrevLang] = useState(lang);

  if (prevLang !== lang) {
    setPrevLang(lang);
    const fromDef = prevLang === 'EN' ? DEFAULT_EN : DEFAULT_ID;
    const toDef = lang === 'EN' ? DEFAULT_EN : DEFAULT_ID;
    if (quoteData.businessName === fromDef.businessName && quoteData.subject === fromDef.subject) {
      setQuoteData(toDef);
    }
  }

  useEffect(() => {
    localStorage.setItem('myinvoice_free_quotation_draft', JSON.stringify(quoteData));
    savePublicCarryover('quotation', quoteData);
  }, [quoteData]);

  useEffect(() => {
    document.title = isEn
      ? 'Free Online Quotation & Price Proposal Generator (PDF) | MyInvoice'
      : 'Buat Surat Penawaran Harga (SPH / Quotation) Gratis Online PDF | MyInvoice';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        isEn
          ? 'Create official B2B price quotations and project proposals online for free. Download A4 PDF, share via WhatsApp, and convert directly into an Invoice in 1 click.'
          : 'Buat Surat Penawaran Harga (SPH / Quotation) resmi online secara gratis tanpa login. Download PDF A4, kirim ke WhatsApp klien, dan ubah jadi Invoice dalam 1 klik.'
      );
    }

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/buat-penawaran-harga-gratis');
  }, [isEn]);

  const formatRp = (num) =>
    new Intl.NumberFormat(isEn ? 'en-US' : 'id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num || 0);

  const handleFieldChange = (field, value) => {
    setQuoteData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setQuoteData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'name' ? value : Number(value) || 0 }
          : item
      )
    }));
  };

  const addItem = () => {
    setQuoteData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: Date.now(), name: isEn ? 'New Service / Product Item' : 'Item Layanan / Produk Baru', qty: 1, price: 500000 }
      ]
    }));
  };

  const removeItem = (id) => {
    if (quoteData.items.length <= 1) return;
    setQuoteData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id)
    }));
  };

  const resetForm = () => {
    if (window.confirm(isEn ? 'Reset quotation back to initial sample?' : 'Reset penawaran harga kembali ke contoh awal?')) {
      localStorage.removeItem('myinvoice_free_quotation_draft');
      setQuoteData(isEn ? DEFAULT_EN : DEFAULT_ID);
    }
  };

  const subtotal = quoteData.items.reduce((acc, item) => acc + item.qty * item.price, 0);
  const afterDiscount = Math.max(0, subtotal - (quoteData.discount || 0));
  const taxAmount = quoteData.enableTax ? Math.round(afterDiscount * 0.11) : 0;
  const grandTotal = afterDiscount + taxAmount;

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const cleanNum = (quoteData.quoteNumber || 'SPH').replace(/[^a-zA-Z0-9-_]/g, '_');
      await generatePDF('instant-quotation-sheet', `Penawaran_${cleanNum}.pdf`);
      trackEvent('free_pdf_download', { tool: 'quotation', amount: grandTotal });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = () => {
    trackEvent('wa_viral_share', { tool: 'quotation' });
    const itemSummary = quoteData.items
      .map((i, idx) => `${idx + 1}. ${i.name} (${i.qty}x) = ${formatRp(i.qty * i.price)}`)
      .join('\n');

    const text = isEn
      ? `*OFFICIAL PRICE QUOTATION (${quoteData.quoteNumber})*\n*From:* ${quoteData.businessName}\n*To:* ${quoteData.clientName} (${quoteData.clientCompany})\n*Valid Until:* ${quoteData.validUntil}\n\n*Subject:* ${quoteData.subject}\n\n*Quotation Breakdown:*\n${itemSummary}\n\n*TOTAL QUOTATION: ${formatRp(grandTotal)}*\n\n*Terms & Conditions:*\n${quoteData.terms}\n\nThank you for your kind consideration.\n\n────────────────────\nGenerated via https://myinvoice.space (Free Version)`
      : `*SURAT PENAWARAN HARGA (${quoteData.quoteNumber})*\n*Dari:* ${quoteData.businessName}\n*Kepada Yth:* ${quoteData.clientName} (${quoteData.clientCompany})\n*Berlaku s/d:* ${quoteData.validUntil}\n\n*Perihal:* ${quoteData.subject}\n\n*Rincian Penawaran:*\n${itemSummary}\n\n*TOTAL PENAWARAN: ${formatRp(grandTotal)}*\n\n*Syarat & Ketentuan:*\n${quoteData.terms}\n\nDemikian penawaran ini kami sampaikan. Terima kasih atas kepercayaan Bapak/Ibu.\n\n────────────────────\nDibuat otomatis via https://myinvoice.space (Versi Gratis)`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleConvertToInvoice = () => {
    savePublicCarryover('quotation_to_invoice', quoteData);
    trackEvent('convert_quote_to_invoice', { amount: grandTotal, is_logged_in: !!user });
    if (user) {
      navigate('/invoice');
    } else {
      navigate('/register');
    }
  };

  const faqs = isEn
    ? [
        {
          q: 'Is this online Price Quotation (SPH) generator really 100% free?',
          a: 'Yes! You can create, print, and download official A4 Price Quotations (Surat Penawaran Harga) in PDF format without logging in. When your client approves the quote, you can convert it directly into an Invoice in 1 click.'
        },
        {
          q: 'How do I convert an approved Quotation into an Invoice without retyping?',
          a: 'Simply click the "Client Approved? Convert to Invoice (1-Click)" button below the document. All item descriptions, quantities, prices, and client details are automatically carried over into an official Invoice.'
        },
        {
          q: 'Can I attach my company logo and digital signature stamp?',
          a: 'Yes! By creating a free MyInvoice account or upgrading to PRO, your company letterhead, official logo, and digital signature are saved permanently and applied automatically.'
        }
      ]
    : [
        {
          q: 'Apakah generator Surat Penawaran Harga (SPH) ini benar-benar 100% gratis?',
          a: 'Ya, 100% gratis! Anda bisa langsung mengedit rincian penawaran proyek/barang, menghitung diskon & PPN 11%, lalu mengunduh PDF A4 siap kirim ke klien tanpa dipungut biaya.'
        },
        {
          q: 'Bagaimana cara mengubah Penawaran Harga ini menjadi Invoice jika klien sudah Deal?',
          a: 'Cukup klik tombol "Deal! Ubah Jadi Invoice (1-Klik)". Sistem Magic Auto-Carryover kami otomatis memindahkan seluruh nama klien, daftar barang/jasa, dan harga langsung menjadi draf Invoice resmi tanpa perlu mengetik ulang.'
        },
        {
          q: 'Bagaimana cara memasang Kop Logo Perusahaan dan Tanda Tangan Digital?',
          a: 'Anda dapat mendaftar akun MyInvoice secara gratis untuk menyimpan database penawaran di Cloud, atau menggunakan paket PRO untuk menyematkan Logo Perusahaan, QRIS Toko, dan Tanda Tangan Digital tanpa watermark.'
        }
      ];

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* HERO & LIVE TOOL HEADER */}
        <section className="relative pt-32 pb-14 px-6 overflow-hidden bg-white border-b border-zinc-200/80">
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-xs font-bold text-violet-800 mb-6 shadow-xs">
              <Briefcase className="w-3.5 h-3.5 text-violet-600" />
              <span>{isEn ? 'B2B Quotation Generator • 1-Click Invoice Convert' : 'Generator Surat Penawaran Harga (SPH) • 1-Klik Jadi Invoice'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-zinc-950 leading-[1.12] mb-4 max-w-4xl mx-auto" style={{ letterSpacing: '-0.03em' }}>
              {isEn ? 'Create Official ' : 'Buat '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-950 via-zinc-800 to-violet-700">
                {isEn ? 'Price Quotations (SPH)' : 'Surat Penawaran Harga'}
              </span>
              {isEn ? ' Online for Free' : ' Gratis & Cepat'}
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              {isEn
                ? 'Win more B2B clients with an executive A4 Price Quotation. Edit directly below, download PDF, or convert to an Invoice in 1 click when your client says Deal!'
                : 'Menangkan lebih banyak proyek B2B & tender UMKM dengan Surat Penawaran Harga (SPH) berstandar korporat. Edit langsung di bawah, unduh PDF, dan ubah jadi Invoice dalam 1 klik saat klien Deal!'}
            </p>
          </div>
        </section>

        {/* INTERACTIVE QUOTATION WORKSPACE */}
        <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
          {/* Main Card Container */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-8 shadow-sm">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-zinc-100">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-600 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  {isEn ? 'INSTANT QUOTATION WORKSHEET' : 'LEMBAR PENAWARAN HARGA INTERAKTIF'}
                </span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isEn ? 'Click any field on the quotation sheet below to edit directly' : 'Klik teks mana saja di kertas penawaran di bawah untuk mengedit'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  type="button"
                  onClick={handleConvertToInvoice}
                  className="px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200/80 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-violet-700" />
                  {isEn ? 'Deal! Convert to Invoice' : 'Deal! Ubah Jadi Invoice'}
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold border-none cursor-pointer flex items-center gap-1.5 shadow-xs transition"
                >
                  <Share2 className="w-4 h-4" />
                  {isEn ? 'Send via WA' : 'Kirim WA'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs sm:text-sm font-bold border-none cursor-pointer flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isExporting
                    ? (isEn ? 'Generating PDF...' : 'Membuat PDF...')
                    : (isEn ? 'Download PDF' : 'Download PDF Gratis')}
                </button>
              </div>
            </div>

            {/* A4 QUOTATION SHEET CONTAINER */}
            <div className="bg-zinc-50/70 p-3 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-inner overflow-x-auto">
              <div
                id="instant-quotation-sheet"
                className="bg-white text-zinc-900 rounded-2xl p-6 sm:p-10 shadow-lg max-w-[820px] mx-auto relative border border-zinc-200"
              >
                {/* Header Letterhead */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-zinc-950">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent('pro_paywall_open', { feature: 'quotation_logo' });
                          setShowProModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-[11px] font-bold transition cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        {isEn ? '+ Company Logo (PRO)' : '+ Pasang Logo Kop Surat (PRO)'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={quoteData.businessName}
                      onChange={(e) => handleFieldChange('businessName', e.target.value)}
                      className="w-full text-xl sm:text-2xl font-black text-zinc-950 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-violet-600 focus:outline-none"
                      placeholder={isEn ? 'Your Company Name' : 'Nama Perusahaan Anda'}
                    />
                    <input
                      type="text"
                      value={quoteData.businessTagline}
                      onChange={(e) => handleFieldChange('businessTagline', e.target.value)}
                      className="w-full text-xs font-bold text-violet-700 uppercase tracking-wider bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-violet-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={quoteData.businessContact}
                      onChange={(e) => handleFieldChange('businessContact', e.target.value)}
                      className="w-full text-xs text-zinc-500 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-violet-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="inline-block px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white font-black text-xs sm:text-sm tracking-widest uppercase mb-2">
                      {isEn ? 'PRICE QUOTATION' : 'SURAT PENAWARAN HARGA'}
                    </div>
                    <div className="flex sm:justify-end items-center gap-1.5 text-xs text-zinc-600 font-semibold">
                      <span>No:</span>
                      <input
                        type="text"
                        value={quoteData.quoteNumber}
                        onChange={(e) => handleFieldChange('quoteNumber', e.target.value)}
                        className="w-36 sm:text-right font-bold text-zinc-950 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 focus:outline-none focus:border-violet-600"
                      />
                    </div>
                    <div className="flex sm:justify-end items-center gap-1.5 text-xs text-zinc-600 mt-1">
                      <span>{isEn ? 'Date:' : 'Tanggal:'}</span>
                      <input
                        type="date"
                        value={quoteData.issueDate}
                        onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                        className="text-xs font-semibold text-zinc-800 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200"
                      />
                    </div>
                    <div className="flex sm:justify-end items-center gap-1.5 text-xs text-zinc-600 font-semibold mt-1">
                      <span>{isEn ? 'Valid Until:' : 'Berlaku s/d:'}</span>
                      <input
                        type="date"
                        value={quoteData.validUntil}
                        onChange={(e) => handleFieldChange('validUntil', e.target.value)}
                        className="text-xs font-semibold text-zinc-800 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 focus:border-violet-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Recipient & Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-zinc-200">
                  <div>
                    <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                      {isEn ? 'Prepared For (Client / Attention):' : 'Kepada Yth. (Calon Klien / Perusahaan):'}
                    </p>
                    <input
                      type="text"
                      value={quoteData.clientName}
                      onChange={(e) => handleFieldChange('clientName', e.target.value)}
                      className="w-full text-sm font-extrabold text-zinc-950 bg-zinc-50/70 px-2.5 py-1 rounded border border-transparent hover:border-zinc-300 focus:border-violet-600 focus:outline-none mb-1"
                    />
                    <input
                      type="text"
                      value={quoteData.clientCompany}
                      onChange={(e) => handleFieldChange('clientCompany', e.target.value)}
                      className="w-full text-xs font-bold text-zinc-700 bg-zinc-50/70 px-2.5 py-1 rounded border border-transparent hover:border-zinc-300 focus:border-violet-600 focus:outline-none mb-1"
                    />
                    <input
                      type="text"
                      value={quoteData.clientAddress}
                      onChange={(e) => handleFieldChange('clientAddress', e.target.value)}
                      className="w-full text-xs text-zinc-500 bg-zinc-50/70 px-2.5 py-1 rounded border border-transparent hover:border-zinc-300 focus:border-violet-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">
                      {isEn ? 'Quotation Subject & Introduction:' : 'Perihal & Kalimat Pembuka:'}
                    </p>
                    <input
                      type="text"
                      value={quoteData.subject}
                      onChange={(e) => handleFieldChange('subject', e.target.value)}
                      className="w-full text-xs font-extrabold text-violet-800 bg-violet-50/70 px-2.5 py-1.5 rounded border border-violet-200 focus:outline-none mb-1.5"
                    />
                    <textarea
                      rows={2}
                      value={quoteData.openingNote}
                      onChange={(e) => handleFieldChange('openingNote', e.target.value)}
                      className="w-full text-xs text-zinc-600 bg-zinc-50/70 px-2.5 py-1.5 rounded border border-zinc-200 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Items Table */}
                <div className="mt-5">
                  <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 bg-zinc-950 text-white rounded-t-lg text-[11px] font-extrabold uppercase tracking-wider">
                    <div className="col-span-6">{isEn ? 'Item Description / Specification' : 'Deskripsi Layanan / Spesifikasi Barang'}</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-right">{isEn ? 'Unit Price' : 'Harga Satuan'}</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1 text-center">{isEn ? 'Act' : 'Aksi'}</div>
                  </div>

                  <div className="divide-y divide-zinc-200 border-x border-b border-zinc-200 rounded-b-lg">
                    {quoteData.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 p-2.5 items-center bg-white hover:bg-zinc-50/80 transition">
                        <div className="col-span-12 sm:col-span-6">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            className="w-full text-xs sm:text-sm font-semibold text-zinc-800 bg-zinc-50 sm:bg-transparent px-2.5 py-1.5 rounded border border-zinc-200 sm:border-transparent hover:border-zinc-300 focus:border-violet-600 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                            className="w-full text-center text-xs sm:text-sm font-bold text-zinc-800 bg-zinc-50 px-1.5 py-1.5 rounded border border-zinc-200 focus:border-violet-600 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-7 sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                            className="w-full text-right text-xs sm:text-sm font-semibold text-zinc-800 bg-zinc-50 px-2 py-1.5 rounded border border-zinc-200 focus:border-violet-600 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-10 sm:col-span-2 text-right text-xs sm:text-sm font-extrabold text-zinc-950 px-1">
                          {formatRp(item.qty * item.price)}
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={quoteData.items.length <= 1}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                            title={isEn ? 'Remove row' : 'Hapus baris'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isEn ? 'Add Quotation Item' : 'Tambah Baris Penawaran'}
                    </button>

                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quoteData.enableTax}
                        onChange={(e) => handleFieldChange('enableTax', e.target.checked)}
                        className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                      />
                      {isEn ? 'Include VAT (PPN 11%)' : 'Tambahkan PPN 11%'}
                    </label>
                  </div>
                </div>

                {/* Totals + Terms & Signer */}
                <div className="mt-6 pt-5 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-12 gap-6">
                  <div className="sm:col-span-7 space-y-2">
                    <label className="block text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider">
                      {isEn ? 'Terms & Conditions of Quotation:' : 'Syarat & Ketentuan Penawaran:'}
                    </label>
                    <textarea
                      rows={4}
                      value={quoteData.terms}
                      onChange={(e) => handleFieldChange('terms', e.target.value)}
                      className="w-full text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-violet-600 leading-relaxed"
                    />
                  </div>

                  <div className="sm:col-span-5 flex flex-col justify-between bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-zinc-600">
                        <span>Subtotal</span>
                        <span className="font-bold text-zinc-950">{formatRp(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-600">
                        <span>{isEn ? 'Special Discount (Rp)' : 'Diskon Penawaran (Rp)'}</span>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          value={quoteData.discount}
                          onChange={(e) => handleFieldChange('discount', Number(e.target.value) || 0)}
                          className="w-28 text-right font-bold text-zinc-950 bg-white px-2 py-1 rounded border border-zinc-200 focus:border-violet-600 focus:outline-none"
                        />
                      </div>
                      {quoteData.enableTax && (
                        <div className="flex justify-between text-zinc-600">
                          <span>PPN (11%)</span>
                          <span className="font-bold text-zinc-950">{formatRp(taxAmount)}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-zinc-300 flex justify-between items-center">
                        <span className="text-xs font-extrabold uppercase text-zinc-950">
                          {isEn ? 'Total Quotation' : 'Total Penawaran'}
                        </span>
                        <span className="text-base sm:text-lg font-black text-violet-700">
                          {formatRp(grandTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Signer */}
                    <div className="mt-5 pt-3 border-t border-zinc-200 flex items-end justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          trackEvent('pro_paywall_open', { feature: 'quotation_signature' });
                          setShowProModal(true);
                        }}
                        className="text-[11px] font-bold text-violet-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        {isEn ? '+ Digital Signature & Stamp (PRO)' : '+ Tanda Tangan & Stempel (PRO)'}
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-4">
                          {isEn ? 'Sincerely,' : 'Hormat Kami,'}
                        </p>
                        <input
                          type="text"
                          value={quoteData.signerName}
                          onChange={(e) => handleFieldChange('signerName', e.target.value)}
                          className="w-36 text-right text-xs font-extrabold text-zinc-950 bg-transparent border-b border-zinc-300 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={quoteData.signerRole}
                          onChange={(e) => handleFieldChange('signerRole', e.target.value)}
                          className="w-36 text-right text-[11px] text-zinc-500 bg-transparent focus:outline-none block mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Free Watermark */}
                <div className="mt-6 pt-3 border-t border-dashed border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span>
                    {isEn
                      ? 'Official Price Quotation generated via myinvoice.space (Free Version)'
                      : 'Surat Penawaran Harga ini dibuat otomatis via myinvoice.space (Versi Gratis)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('pro_paywall_open', { feature: 'quotation_watermark' });
                      setShowProModal(true);
                    }}
                    className="text-violet-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Crown className="w-3 h-3" />
                    {isEn ? 'Remove Watermark (PRO)' : 'Hapus Watermark (PRO)'}
                  </button>
                </div>
              </div>
            </div>

            {/* 1-CLICK CONVERT TO INVOICE BANNER */}
            <div className="mt-8 bg-zinc-950 text-white border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-900/60 border border-violet-700/60 text-violet-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>{isEn ? 'Magic Auto-Carryover Engine' : 'Fitur Unggulan: 1-Klik Jadi Invoice'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isEn
                    ? 'Client Approved Your Quote? Convert to Invoice in 1 Click!'
                    : 'Klien Sudah Setuju / Deal? Ubah Penawaran Ini Jadi Invoice (1-Klik)!'}
                </h2>
                <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
                  {isEn
                    ? 'No need to retype client details or item prices. Click below and we will automatically convert this quotation into a ready-to-bill Invoice inside your dashboard.'
                    : 'Tidak perlu mengetik ulang nama klien, rincian barang, atau harga. Klik tombol di samping dan seluruh penawaran ini otomatis berubah menjadi Invoice siap tagih di dashboard Anda.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleConvertToInvoice}
                className="shrink-0 px-6 py-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm sm:text-base flex items-center gap-2 shadow-md hover:shadow-xl transition cursor-pointer"
              >
                <span>{isEn ? 'Convert Quote to Invoice Now' : 'Ubah Jadi Invoice Sekarang'}</span>
                <ArrowRight className="w-5 h-5 text-violet-700" />
              </button>
            </div>

            {/* FAQ SECTION */}
            <div className="mt-16 max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mb-3">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                  {isEn ? 'Frequently Asked Questions (Quotation / SPH)' : 'Pertanyaan Seputar Surat Penawaran Harga (SPH)'}
                </h2>
              </div>
              <div className="space-y-3">
                {faqs.map((f, idx) => (
                  <div key={idx} className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs transition-all">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-zinc-900 bg-transparent border-none cursor-pointer"
                    >
                      <span>{f.q}</span>
                      <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${openFaq === idx ? 'rotate-180 text-zinc-900' : ''}`} />
                    </button>
                    {openFaq === idx && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                        {f.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Internal Linking: Related Free Business Tools */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <RelatedTools currentSlug="buat-penawaran-harga-gratis" />
        </div>
      </main>

      {/* PRO PRESTIGE PAYWALL MODAL */}
      {showProModal && (
        <div
          onClick={() => setShowProModal(false)}
          className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowProModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1 rounded-full bg-transparent border-none cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-4">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-zinc-950 mb-2">
              {isEn ? 'Unlock Corporate Letterhead & 1-Click Invoice' : 'Tampil Lebih Bonafide di Mata Klien B2B'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 mb-5 leading-relaxed">
              {isEn
                ? 'Save this quotation automatically to your account and unlock corporate branding features:'
                : 'Simpan penawaran ini secara otomatis ke akun Anda dan buka fitur eksklusif korporat:'}
            </p>
            <div className="space-y-2.5 text-xs sm:text-sm text-zinc-700 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 mb-6">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isEn ? 'Upload Official Company Logo & Letterhead' : 'Pasang Logo Kop Perusahaan & Tanda Tangan Digital'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isEn ? '1-Click Convert Quotation to Official Invoice & Receipt' : 'Ubah Penawaran Jadi Invoice & Kwitansi dalam 1 Klik'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isEn ? '100% White-Label PDF & WhatsApp (Zero Watermark)' : '100% White-Label Tanpa Watermark myinvoice.space'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleConvertToInvoice}
                className="w-full py-3.5 rounded-xl bg-zinc-950 hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
              >
                <Sparkles className="w-4 h-4 text-violet-300" />
                <span>{isEn ? 'Continue Free & Carry Over Data' : 'Lanjut Daftar Gratis (Data Otomatis Terbawa)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowProModal(false)}
                className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 bg-transparent border-none cursor-pointer"
              >
                {isEn ? 'Back to Free Editor' : 'Kembali ke Editor Gratis'}
              </button>
            </div>
          </div>
        </div>
      )}

      <LandingFooter />
    </div>
  );
}
