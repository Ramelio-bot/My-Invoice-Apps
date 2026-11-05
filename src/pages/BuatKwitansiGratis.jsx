import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck, Send, Download, Printer, RotateCcw, Pencil,
  Lock, X, CheckCircle2, ArrowRight, Sparkles, HelpCircle, ChevronDown
} from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import { useLang } from '../context/LanguageContext';
import { terbilang } from '../utils/terbilang';
import { generatePDF } from '../utils/pdf';

const DEFAULT_ID = {
  businessName: 'Studio Desain & Kreatif',
  businessContact: 'Jl. Sudirman No. 45, Jakarta Selatan • 0812-3456-7890',
  receiptNumber: 'KWT-2026/088',
  receivedFrom: 'PT Maju Cipta Sejahtera',
  amount: 3500000,
  forPayment: 'Pelunasan Tahap 1 Pembuatan Website & Sistem Kasir',
  paymentMethod: 'Transfer Bank BCA',
  city: 'Jakarta',
  signerName: 'Andi Pratama',
  signerRole: 'Finance Manager'
};

const DEFAULT_EN = {
  businessName: 'Creative & Design Studio',
  businessContact: '45 Sudirman Ave, South Jakarta • 0812-3456-7890',
  receiptNumber: 'KWT-2026/088',
  receivedFrom: 'PT Maju Cipta Sejahtera',
  amount: 3500000,
  forPayment: 'Milestone 1 Payment for Website & POS System Development',
  paymentMethod: 'Bank Transfer (BCA)',
  city: 'Jakarta',
  signerName: 'Andi Pratama',
  signerRole: 'Finance Manager'
};

export default function BuatKwitansiGratis() {
  const { lang } = useLang();
  const isEn = lang === 'EN';

  const [receiptData, setReceiptData] = useState(() => ({
    ...(isEn ? DEFAULT_EN : DEFAULT_ID),
    date: new Date().toISOString().split('T')[0]
  }));
  const [prevLang, setPrevLang] = useState(lang);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  if (prevLang !== lang) {
    setPrevLang(lang);
    const fromTpl = isEn ? DEFAULT_ID : DEFAULT_EN;
    const toTpl = isEn ? DEFAULT_EN : DEFAULT_ID;
    setReceiptData(prev => ({
      ...prev,
      businessName: prev.businessName === fromTpl.businessName ? toTpl.businessName : prev.businessName,
      businessContact: prev.businessContact === fromTpl.businessContact ? toTpl.businessContact : prev.businessContact,
      forPayment: prev.forPayment === fromTpl.forPayment ? toTpl.forPayment : prev.forPayment,
      paymentMethod: prev.paymentMethod === fromTpl.paymentMethod ? toTpl.paymentMethod : prev.paymentMethod
    }));
  }

  useEffect(() => {
    document.title = isEn
      ? 'Free Online Payment Receipt (Kwitansi) Generator | MyInvoice'
      : 'Buat Kwitansi Pembayaran Online Gratis & Bukti Lunas PDF | MyInvoice';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      isEn
        ? 'Create official digital payment receipts (Kwitansi) online for free. Automatic amount-in-words (Terbilang), PAID stamp, instant PDF download, and WhatsApp sharing.'
        : 'Buat kwitansi pembayaran digital resmi secara online & gratis. Dilengkapi fitur terbilang rupiah otomatis, stempel LUNAS, unduh PDF instan, dan kirim ke WhatsApp.'
    );

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/buat-kwitansi-gratis');

    const schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          'name': isEn ? 'MyInvoice Free Online Receipt (Kwitansi) Generator' : 'Generator Kwitansi Online Gratis MyInvoice',
          'applicationCategory': 'BusinessApplication',
          'operatingSystem': 'Web, Android, iOS, Windows, macOS',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'IDR'
          },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.9',
            'ratingCount': '275',
            'bestRating': '5'
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

  const numericAmount = Math.max(0, Number(receiptData.amount) || 0);
  const wordsRaw = terbilang(numericAmount, isEn ? 'en' : 'id').trim();
  const amountInWords = wordsRaw
    ? `${wordsRaw} ${isEn ? 'Rupiah' : 'Rupiah'}`
    : (isEn ? 'Zero Rupiah' : 'Nol Rupiah');

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const filename = `${receiptData.receiptNumber || 'Kwitansi'}_${(receiptData.receivedFrom || 'Client').replace(/\s+/g, '_')}.pdf`;
      await generatePDF('instant-kwitansi-sheet', filename, false);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    const msg = isEn
      ? `Hello *${receiptData.receivedFrom}*,\n\nThank you for your payment. Here is your official payment receipt:\n*Receipt No:* ${receiptData.receiptNumber}\n*Amount Received:* Rp ${numericAmount.toLocaleString('id-ID')}\n*In Words:* ${amountInWords}\n*For Payment Of:* ${receiptData.forPayment}\n*Status:* PAID IN FULL\n\nBest regards,\n*${receiptData.businessName}*\n────────────────────\nGenerated via https://myinvoice.space (Free Version)`
      : `Halo *${receiptData.receivedFrom}*,\n\nTerima kasih atas pembayarannya. Berikut rincian Bukti Kwitansi Pembayaran resmi:\n*No. Kwitansi:* ${receiptData.receiptNumber}\n*Nominal Diterima:* Rp ${numericAmount.toLocaleString('id-ID')}\n*Terbilang:* # ${amountInWords} #\n*Untuk Pembayaran:* ${receiptData.forPayment}\n*Status:* LUNAS\n\nSalam,\n*${receiptData.businessName}*\n────────────────────\nDibuat otomatis via https://myinvoice.space (Versi Gratis)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleReset = () => {
    setReceiptData({
      ...(isEn ? DEFAULT_EN : DEFAULT_ID),
      date: new Date().toISOString().split('T')[0]
    });
  };

  const faqs = isEn
    ? [
        {
          q: 'Does this receipt generator convert numbers into words (Terbilang) automatically?',
          a: 'Yes! As soon as you type the payment amount in Rupiah, the system automatically generates the formal spelled-out amount in Indonesian or English without manual typing.'
        },
        {
          q: 'How can I upload my custom wet signature, company stamp, and logo?',
          a: 'By registering a MyInvoice account and activating PRO, you can upload your transparent PNG signature, official company stamp, and business logo, and remove the Free Version attribution.'
        },
        {
          q: 'Can I convert an existing Invoice into a Receipt with 1 click?',
          a: 'Yes! Inside the MyInvoice dashboard, whenever a client pays an invoice, it automatically records into your Business Cashbook and can be printed as an official Kwitansi immediately.'
        }
      ]
    : [
        {
          q: 'Apakah kalimat Terbilang Rupiah dibuat secara otomatis?',
          a: 'Ya! Begitu Anda mengetik angka nominal pembayaran, sistem langsung menerjemahkan angka tersebut menjadi kalimat Terbilang Rupiah yang baku secara otomatis tanpa takut salah ketik.'
        },
        {
          q: 'Bagaimana cara memasukkan tanda tangan basah, stempel toko, dan logo perusahaan?',
          a: 'Dengan mendaftar akun MyInvoice dan mengaktifkan paket PRO, Anda bisa mengunggah gambar tanda tangan digital, stempel resmi perusahaan, logo bisnis, serta menghapus tulisan Versi Gratis (100% White-Label).'
        },
        {
          q: 'Apakah Kwitansi bisa otomatis tercatat ke Laporan Keuangan / Arus Kas?',
          a: 'Bisa! Di dalam dashboard akun MyInvoice, setiap kwitansi atau invoice yang dilunasi otomatis masuk ke Catatan Kas Bisnis dan Laporan Laba/Rugi bulanan Anda.'
        }
      ];

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      {/* PRESTIGE UPGRADE MODAL (HOOK & LOCK) */}
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
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Lock size={22} />
            </div>
            <h3 className="text-xl font-black text-zinc-950 mb-2">
              {isEn ? 'Unlock Digital Signature, Stamp & Logo' : 'Buka Fitur Tanda Tangan, Stempel & Logo'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
              {isEn
                ? 'Upgrade your receipt credibility! Create an account and activate PRO to unlock full corporate branding:'
                : 'Tingkatkan kredibilitas bukti pembayaran Anda di mata klien! Daftar akun & aktifkan PRO untuk membuka:'}
            </p>
            <div className="space-y-2.5 mb-6 text-xs text-zinc-700 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? 'Drag-and-drop Digital Signature & Custom Company Stamp' : 'Pasang Tanda Tangan Digital & Stempel Perusahaan (Bisa Digeser)'}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? '100% White-Label PDF & WhatsApp (No "Free Version" watermark)' : '100% White-Label: Hapus atribusi "Versi Gratis" di PDF & WhatsApp'}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? 'Auto-sync paid receipts directly into your Business Cashbook' : 'Otomatis catat uang masuk ke Pembukuan Kas Bisnis & Laporan Bulanan'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <Link
                to="/register"
                className="w-full py-3.5 px-5 rounded-xl bg-zinc-950 hover:bg-black text-white font-bold text-xs sm:text-sm text-center no-underline shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>{isEn ? 'Create Free Account & Add Signature' : 'Daftar Akun & Pasang Tanda Tangan'}</span>
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
        {/* HERO SECTION */}
        <section className="pt-32 pb-12 px-6 bg-white border-b border-zinc-200/80">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800 mb-5">
              <FileCheck size={13} />
              <span>{isEn ? 'Official Digital Payment Receipt Generator' : 'Generator Kwitansi & Bukti Pembayaran Digital'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-zinc-950 leading-[1.1] mb-4 max-w-4xl mx-auto" style={{ letterSpacing: '-0.03em' }}>
              {isEn
                ? 'Issue official PAID receipts in 20 seconds. Auto spelled-out amount.'
                : 'Buat kwitansi LUNAS resmi dalam 20 detik. Kalimat terbilang otomatis.'}
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              {isEn
                ? 'No more paper receipt books. Fill in the payment details below, let the system generate the formal amount in words automatically, and download a clean PDF or send via WhatsApp.'
                : 'Tidak perlu beli buku kwitansi kertas lagi. Ketik nominal pembayaran di bawah, kalimat Terbilang Rupiah muncul otomatis, langsung unduh PDF atau kirim ke WhatsApp klien.'}
            </p>
          </div>
        </section>

        {/* INTERACTIVE KWITANSI WORKSHEET */}
        <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-8 shadow-sm">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-zinc-100">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  {isEn ? 'INSTANT RECEIPT WORKSHEET' : 'LEMBAR KWITANSI INTERAKTIF'}
                </span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isEn ? 'Click any field below to edit directly' : 'Klik pada kolom di bawah untuk mengedit langsung'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold border-none cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Send size={13} />
                  <span>{isEn ? 'Send via WhatsApp' : 'Kirim ke WhatsApp'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold border border-zinc-200 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Printer size={13} />
                  <span>{isEn ? 'Print' : 'Cetak'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-bold border-none cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={13} />
                  <span>{isExportingPdf ? (isEn ? 'Generating...' : 'Membuat PDF...') : (isEn ? 'Download PDF' : 'Download PDF Gratis')}</span>
                </button>
              </div>
            </div>

            {/* PRINTABLE / PDF CAPTURE SHEET */}
            <div id="instant-kwitansi-sheet" className="relative border-2 border-zinc-900 rounded-2xl p-5 sm:p-8 bg-white space-y-6">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-zinc-900">
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-lg select-none">
                      {(receiptData.businessName || 'M').charAt(0).toUpperCase()}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPrestigeModal(true)}
                      className="pdf-hide text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md cursor-pointer whitespace-nowrap"
                    >
                      {isEn ? '+ Logo' : '+ Logo Bisnis'}
                    </button>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={receiptData.businessName}
                      onChange={e => setReceiptData({ ...receiptData, businessName: e.target.value })}
                      className="w-full font-black text-base sm:text-lg text-zinc-950 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:bg-white focus:border-blue-600"
                    />
                    <input
                      type="text"
                      value={receiptData.businessContact}
                      onChange={e => setReceiptData({ ...receiptData, businessContact: e.target.value })}
                      className="w-full text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-black tracking-widest uppercase text-zinc-950">
                    {isEn ? 'PAYMENT RECEIPT' : 'KWITANSI PEMBAYARAN'}
                  </div>
                  <div className="flex items-center sm:justify-end gap-1.5 mt-1">
                    <span className="text-[11px] font-mono text-zinc-500">No:</span>
                    <input
                      type="text"
                      value={receiptData.receiptNumber}
                      onChange={e => setReceiptData({ ...receiptData, receiptNumber: e.target.value })}
                      className="w-36 font-mono font-bold text-xs text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-right outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Receipt Body Rows */}
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className="sm:col-span-4 font-bold text-zinc-600 flex items-center gap-1">
                    <Pencil size={11} className="text-blue-600 pdf-hide" />
                    {isEn ? 'Received From' : 'Telah Terima Dari'}
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={receiptData.receivedFrom}
                      onChange={e => setReceiptData({ ...receiptData, receivedFrom: e.target.value })}
                      className="w-full font-bold text-zinc-950 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className="sm:col-span-4 font-bold text-zinc-600 flex items-center gap-1">
                    <Pencil size={11} className="text-blue-600 pdf-hide" />
                    {isEn ? 'Amount (Rp)' : 'Nominal Uang (Rp)'}
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={receiptData.amount}
                      onChange={e => setReceiptData({ ...receiptData, amount: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full font-mono font-black text-base text-emerald-700 bg-emerald-50/60 border border-emerald-300 rounded-xl px-3.5 py-2 outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* Automatic Terbilang Box */}
                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <span className="sm:col-span-4 font-bold text-zinc-600">
                    {isEn ? 'Amount in Words (Auto)' : 'Uang Sejumlah (Terbilang)'}
                  </span>
                  <div className="sm:col-span-8 p-3 rounded-xl bg-amber-50/70 border border-amber-200 font-serif italic font-bold text-zinc-900">
                    # {amountInWords} #
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2">
                  <label className="sm:col-span-4 font-bold text-zinc-600 flex items-center gap-1">
                    <Pencil size={11} className="text-blue-600 pdf-hide" />
                    {isEn ? 'For Payment Of' : 'Untuk Pembayaran'}
                  </label>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={receiptData.forPayment}
                      onChange={e => setReceiptData({ ...receiptData, forPayment: e.target.value })}
                      className="w-full font-semibold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Total Banner & Signature Area */}
              <div className="pt-5 border-t-2 border-zinc-900 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-block px-5 py-3 rounded-2xl bg-zinc-950 text-white">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      {isEn ? 'TOTAL RECEIVED' : 'JUMLAH DITERIMA'}
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
                      Rp {numericAmount.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-md border-2 border-emerald-600 text-emerald-700 bg-emerald-50 font-black text-xs tracking-widest uppercase">
                      {isEn ? 'PAID IN FULL' : 'LUNAS'}
                    </span>
                    <input
                      type="text"
                      value={receiptData.paymentMethod}
                      onChange={e => setReceiptData({ ...receiptData, paymentMethod: e.target.value })}
                      className="text-xs font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 outline-none"
                    />
                  </div>
                </div>

                {/* Signer & Locked Digital Signature Trigger */}
                <div className="w-full sm:w-64 text-left sm:text-center space-y-2">
                  <div className="flex items-center sm:justify-center gap-1.5 text-xs text-zinc-600">
                    <input
                      type="text"
                      value={receiptData.city}
                      onChange={e => setReceiptData({ ...receiptData, city: e.target.value })}
                      className="w-24 text-center font-semibold bg-zinc-50 border border-zinc-200 rounded-md px-2 py-0.5 outline-none"
                    />
                    <span>,</span>
                    <input
                      type="date"
                      value={receiptData.date}
                      onChange={e => setReceiptData({ ...receiptData, date: e.target.value })}
                      className="font-semibold bg-zinc-50 border border-zinc-200 rounded-md px-2 py-0.5 outline-none"
                    />
                  </div>

                  <div
                    onClick={() => setShowPrestigeModal(true)}
                    className="pdf-hide my-2 py-3 px-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    {isEn ? '+ Upload Digital Signature & Stamp (PRO)' : '+ Pasang Tanda Tangan & Stempel (PRO)'}
                  </div>

                  <input
                    type="text"
                    value={receiptData.signerName}
                    onChange={e => setReceiptData({ ...receiptData, signerName: e.target.value })}
                    className="w-full text-center font-bold text-xs text-zinc-950 bg-zinc-50 border-b border-zinc-400 px-2 py-1 outline-none"
                  />
                  <input
                    type="text"
                    value={receiptData.signerRole}
                    onChange={e => setReceiptData({ ...receiptData, signerRole: e.target.value })}
                    className="w-full text-center text-[11px] text-zinc-500 bg-transparent px-2 py-0.5 outline-none"
                  />
                </div>
              </div>

              {/* Official Free Version Watermark */}
              <div className="pt-4 border-t border-dashed border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
                <span>
                  {isEn
                    ? 'Generated with MyInvoice.space (Free Version) — Official Digital Receipt & POS'
                    : 'Dokumen ini dibuat dengan MyInvoice.space (Versi Gratis) — Kwitansi & Kasir Digital'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPrestigeModal(true)}
                  className="pdf-hide inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-full cursor-pointer"
                >
                  <Lock size={11} />
                  <span>{isEn ? 'Remove Watermark & Add Stamp (PRO)' : 'Hapus Watermark & Pasang Stempel (PRO)'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 px-6 max-w-4xl mx-auto border-t border-zinc-200">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle size={18} className="text-zinc-500" />
            <h2 className="text-2xl font-black text-zinc-900">
              {isEn ? 'Frequently Asked Questions (Digital Receipt)' : 'Pertanyaan Seputar Kwitansi Online Gratis'}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 bg-transparent border-none cursor-pointer"
                >
                  <span className="font-bold text-sm text-zinc-900">{faq.q}</span>
                  <ChevronDown size={16} className={`text-zinc-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
