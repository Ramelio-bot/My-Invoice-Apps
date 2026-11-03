import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Send, CheckCircle2, ChevronDown, Clock, ArrowRight, Zap, Download } from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function BuatInvoiceGratis() {
  const [openFaq, setOpenFaq] = useState(null);

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
      q: "Apakah benar-benar gratis?",
      a: "Ya! Anda dapat langsung membuat invoice, kwitansi, dan penawaran harga secara gratis tanpa biaya tersembunyi dan tanpa perlu memasukkan kartu kredit."
    },
    {
      q: "Apakah invoice saya bisa dicetak atau diunduh ke PDF?",
      a: "Sangat bisa. Setiap invoice yang dibuat dapat langsung diunduh dalam format PDF beresolusi tinggi, siap cetak, atau dikirimkan ke klien melalui WhatsApp dan email."
    },
    {
      q: "Bisakah saya menambahkan logo dan rekening bank sendiri?",
      a: "Tentu. Anda memiliki kebebasan penuh untuk memasukkan logo bisnis, detail rekening bank pembayaran, QRIS, catatan khusus, hingga tanda tangan digital pada faktur."
    },
    {
      q: "Apakah data klien saya tersimpan dengan aman?",
      a: "Data Anda dan daftar klien tersimpan aman di cloud berstandar keamanan industri, terlindungi dari risiko hilang atau terhapus secara tidak sengaja."
    }
  ];

  return (
    <div className="bg-white text-slate-800 font-sans min-h-screen flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-bold px-4 py-1.5 rounded-full text-xs md:text-sm mb-6 shadow-sm">
            <Zap size={15} />
            <span>Pembuat Invoice & Tagihan Cepat untuk Freelancer & Agensi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900 leading-tight">
            Buat Invoice Profesional.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Tagih Klien & Cair Lebih Cepat.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Hentikan repotnya mengetik invoice manual di Excel atau Word. Buat, unduh PDF instan, dan kelola pembayaran klien Anda dalam hitungan detik. 100% gratis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-base inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Buat Invoice Pertama Anda</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-8 rounded-xl text-base inline-flex items-center justify-center transition-all cursor-pointer"
            >
              Masuk ke Akun
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs md:text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Tanpa Kartu Kredit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Format PDF Siap Kirim</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Bisa Tambah Logo & Rekening</span>
            </div>
          </div>
        </section>

        {/* FITUR UNGGULAN */}
        <section className="bg-slate-50 border-y border-slate-200/80 py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200">
                Fitur Unggulan
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3">
                Kenapa Freelancer & Agensi Memilih MyInvoice?
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto text-base">
                Didesain khusus agar tagihan Anda terlihat kredibel dan profesional di mata klien korporat.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Desain Template Elegan</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Tata letak invoice modern dengan branding logo kustom, detail PPN/Pajak, serta nomor seri otomatis yang terlihat resmi dan rapi.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-6">
                  <Download size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Ekspor PDF Sekali Klik</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Hasilkan dokumen PDF bersih beresolusi tajam secara instan. Siap dilampirkan ke pesan WhatsApp, proposal, atau email klien.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <Clock size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Pantau Status Pembayaran</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Tandai invoice yang sudah Lunas, Menunggu Pembayaran, atau Jatuh Tempo dalam satu dasbor agar arus kas proyek Anda tidak berantakan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW LANGKAH MUDAH */}
        <section className="py-24 max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">3 Langkah Mudah Buat Tagihan</h2>
          <p className="text-slate-600 mb-14 text-base">Tidak butuh waktu lebih dari 60 detik untuk membuat tagihan pertama Anda.</p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white">
              <span className="text-3xl font-black text-indigo-600">01</span>
              <h3 className="font-bold text-lg text-slate-900 mt-2 mb-2">Isi Data Klien & Produk</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Masukkan nama klien, rincian pekerjaan atau jasa, dan nominal biaya secara otomatis.</p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-200 bg-white">
              <span className="text-3xl font-black text-indigo-600">02</span>
              <h3 className="font-bold text-lg text-slate-900 mt-2 mb-2">Pilih Rekening & Tanda Tangan</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Tentukan nomor rekening tujuan transfer bank dan sertakan tanda tangan digital Anda.</p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-200 bg-white">
              <span className="text-3xl font-black text-indigo-600">03</span>
              <h3 className="font-bold text-lg text-slate-900 mt-2 mb-2">Unduh PDF & Kirim</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Klik cetak atau unduh PDF, lalu kirimkan langsung ke klien via WhatsApp atau email.</p>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="py-20 bg-slate-50 border-y border-slate-200/80">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-900 mb-12">
              Pertanyaan yang Sering Diajukan
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex justify-between items-center p-6 bg-white hover:bg-slate-50/80 transition-colors text-left gap-4 cursor-pointer"
                    >
                      <span className="font-bold text-base md:text-lg text-slate-900">{faq.q}</span>
                      <ChevronDown
                        size={20}
                        className={`transform transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}
                      />
                    </button>
                    <div
                      className={`px-6 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <p className="text-slate-600 text-sm md:text-base leading-relaxed border-t border-slate-100 pt-4">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA PENUTUP */}
        <section className="bg-slate-900 py-24 text-center px-6">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Send size={28} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Siap Ditagih & Dibayar Lebih Cepat?
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mb-10 max-w-xl mx-auto">
              Tinggalkan cara lama yang membuang waktu. Bergabunglah dengan freelancer dan UMKM modern di seluruh Indonesia.
            </p>
            <Link
              to="/register"
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold py-4 px-10 rounded-xl text-lg inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer shadow-xl shadow-black/20"
            >
              <span>Mulai Buat Invoice Gratis</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
