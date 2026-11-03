import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, Package, Calculator, Store, XCircle, ArrowRight, ChevronDown, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function AplikasiKasirOffline() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    // 1. Title
    document.title = "Aplikasi Kasir Offline & Manajemen Stok Terbaik | MyInvoice POS";

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Aplikasi kasir (POS) berbasis web yang tetap bisa berjalan tanpa internet. Kelola stok barang, hitung HPP, dan cetak struk otomatis. Gratis untuk UMKM.'
    );

    // 3. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/aplikasi-kasir-offline');

    // 4. Schema.org JSON-LD Structured Data
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "MyInvoice POS Kasir Offline",
          "url": "https://myinvoice.space/aplikasi-kasir-offline",
          "operatingSystem": "Web, Android, iOS, Windows, macOS (PWA)",
          "applicationCategory": "BusinessApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR",
            "description": "Paket Gratis untuk UMKM dengan fitur kasir offline"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "180",
            "bestRating": "5"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Apakah benar-benar bisa dipakai tanpa internet?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ya. MyInvoice menggunakan arsitektur Progressive Web App (PWA). Selama Anda sudah membuka web ini satu kali saat ada internet, aplikasi tersimpan di memori perangkat dan siap melayani transaksi 100% offline."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah bisa dicetak pakai printer thermal Bluetooth?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Bisa. Kami mendukung pencetakan struk ke printer thermal Bluetooth maupun kabel USB berukuran 58mm dan 80mm."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah aplikasi ini harus diunduh di Play Store?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Tidak perlu. Anda cukup membuka browser (Chrome/Safari), lalu pilih Tambahkan ke Layar Utama (Add to Home Screen). Aplikasi akan terpasang ringan tanpa membebani memori HP."
              }
            },
            {
              "@type": "Question",
              "name": "Bagaimana nasib data saat internet kembali menyala?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Semua data transaksi yang tersimpan di memori lokal offline akan otomatis disinkronisasi ke database cloud saat perangkat mendeteksi koneksi internet kembali."
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
      q: "Apakah benar-benar bisa dipakai tanpa internet?",
      a: "Ya. MyInvoice menggunakan teknologi Progressive Web App (PWA). Selama Anda sudah membuka web ini satu kali saat ada internet, aplikasi akan tersimpan di browser dan siap digunakan secara offline kapan pun tanpa kuota."
    },
    {
      q: "Apakah bisa dicetak pakai printer thermal Bluetooth?",
      a: "Bisa. Kami mendukung pencetakan struk ke printer thermal Bluetooth maupun koneksi kabel USB dengan ukuran kertas 58mm maupun 80mm."
    },
    {
      q: "Apakah aplikasi ini harus diunduh di Play Store?",
      a: "Tidak perlu. Cukup buka browser (Chrome di Android atau Safari di iOS), lalu pilih 'Tambahkan ke Layar Utama' (Add to Home Screen). Aplikasi langsung terpasang seperti aplikasi biasa dan hemat ruang memori."
    },
    {
      q: "Bagaimana nasib transaksi yang dicatat saat offline?",
      a: "Semua struk dan transaksi dicatat dalam antrean lokal yang aman. Begitu perangkat Anda terhubung kembali ke Wi-Fi atau data seluler, seluruh transaksi otomatis tersinkronisasi ke cloud tanpa ada data yang hilang."
    }
  ];

  return (
    <div className="bg-white text-slate-800 font-sans min-h-screen flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION */}
        <section className="max-w-6xl mx-auto px-6 pt-32 pb-20 md:pt-40 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 border border-violet-200/60 font-bold px-4 py-1.5 rounded-full text-xs md:text-sm mb-6 shadow-sm">
            <WifiOff size={15} />
            <span>Solusi Kasir Toko & Resto Tanpa Kuota</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900 leading-tight">
            Aplikasi Kasir Offline.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              Tetap Jalan Walau Internet Mati.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Jangan biarkan sinyal atau Wi-Fi yang putus menghentikan antrean pembeli di toko Anda. 
            MyInvoice POS dirancang dengan teknologi PWA tangguh untuk melayani transaksi kasir, 
            mencetak struk thermal, dan mengelola stok secara 100% offline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl text-base inline-flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Coba Kasir Offline Gratis</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-8 rounded-xl text-base inline-flex items-center justify-center transition-all cursor-pointer"
            >
              Sudah Punya Akun? Masuk
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs md:text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Tanpa Biaya Instalasi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Support Printer Bluetooth & USB</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Otomatis Sinkron ke Cloud</span>
            </div>
          </div>
        </section>

        {/* 2. PAIN POINTS */}
        <section className="bg-slate-50 border-y border-slate-200/80 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
                Sering Mengalami Masalah Ini di Toko Anda?
              </h2>
              <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
                Hambatan operasional kecil yang sering membuat pemilik usaha kehilangan pelanggan dan margin profit.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { title: "Internet Mati, Kasir Macet Total", desc: "Sinyal mendadak hilang di jam sibuk, kasir tidak bisa checkout, antrean pelanggan menumpuk dan batal beli." },
                { title: "Biaya Aplikasi Kasir Sangat Mahal", desc: "Aplikasi kasir langganan ratusan ribu per bulan, namun sering error dan lambat saat koneksi internet menurun." },
                { title: "Selisih Stok Fisik & Catatan Buku", desc: "Barang di rak sering tiba-tiba hilang atau tidak cocok dengan catatan Excel manual yang membingungkan." },
                { title: "Bingung Menentukan Harga Modal & Margin", desc: "Sulit menghitung Harga Pokok Penjualan (HPP) bahan baku sehingga tidak yakin apakah usaha untung atau rugi." }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. THE SOLUTION */}
        <section className="py-24 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-3 py-1 rounded-md border border-violet-200">
              Solusi Terpadu MyInvoice
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-4">
              Kendali Penuh Toko Anda, Bebas dari Ketergantungan Sinyal.
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-base">
              Fitur kelas enterprise yang dirancang sederhana, intuitif, dan tangguh khusus untuk kebutuhan UMKM Indonesia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-6">
                <WifiOff size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Mode 100% Offline (PWA)</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tetap bisa scan barcode, checkout pesanan, hitung kembalian, dan cetak struk Bluetooth meskipun modem mati atau pulsa habis. Data aman di memori lokal.
              </p>
            </div>

            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Package size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Manajemen Stok Real-Time</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Stok barang dagangan dan bahan baku berkurang otomatis di setiap transaksi. Dilengkapi peringatan dini stok menipis dan pencatatan riwayat opname.
              </p>
            </div>

            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <Calculator size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Kalkulator HPP & Margin Resep</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Bukan sekadar kasir biasa. Hitung harga modal per porsi atau unit produk, tentukan margin keuntungan sehat, dan pantau laba kotor secara presisi.
              </p>
            </div>

            <div className="p-8 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6">
                <Store size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Dukungan Multi-Outlet & Karyawan</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Miliki lebih dari satu toko atau gerai? Pantau omzet seluruh cabang dalam satu dashboard pusat, atur hak akses kasir, dan cegah kecurangan staf.
              </p>
            </div>
          </div>
        </section>

        {/* 4. PRICING TEASER */}
        <section className="py-20 bg-slate-50 border-y border-slate-200/80">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Harga Masuk Akal untuk Pertumbuhan Usaha Anda
            </h2>
            <p className="text-slate-600 mb-12 max-w-xl mx-auto text-sm md:text-base">
              Hentikan membayar biaya langganan kasir yang menggerus profit bulanan. Mulai dari gratis, upgrade kapan pun usaha Anda berkembang.
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-left items-stretch">
              {/* Free Tier */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Paket FREE</h3>
                  <p className="text-slate-500 text-xs mb-6">Ideal untuk mencoba fitur kasir dan toko kecil mandiri.</p>
                  <p className="text-4xl font-black text-slate-900 mb-6">
                    Rp 0<span className="text-sm font-normal text-slate-500"> / selamanya</span>
                  </p>
                  <ul className="space-y-3 text-xs md:text-sm text-slate-600 mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Mode Kasir POS Offline</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Cetak Struk Bluetooth & USB</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Manajemen Stok Dasar</li>
                  </ul>
                </div>
                <Link
                  to="/register"
                  className="block w-full py-3.5 text-center border-2 border-slate-900 text-slate-900 rounded-xl font-bold hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                >
                  Mulai Gratis Sekarang
                </Link>
              </div>

              {/* Pro Tier */}
              <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 relative flex flex-col justify-between shadow-2xl md:-translate-y-3">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-4 py-1 rounded-full text-xs font-black tracking-wide uppercase shadow-md">
                  Paling Populer
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 mt-2">Paket PRO</h3>
                  <p className="text-slate-400 text-xs mb-6">Fitur lengkap tanpa batas dokumen untuk 1 outlet toko.</p>
                  <p className="text-4xl font-black text-white mb-6">
                    Rp 129.000<span className="text-sm font-normal text-slate-400"> / bulan</span>
                  </p>
                  <ul className="space-y-3 text-xs md:text-sm text-slate-300 mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-violet-400" /> Semua Fitur Kasir Free</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-violet-400" /> Tanpa Watermark di Struk & Nota</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-violet-400" /> Ekspor Excel & Laporan Omzet</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-violet-400" /> Invoice, Kwitansi, PO Unlimited</li>
                  </ul>
                </div>
                <Link
                  to="/register"
                  className="block w-full py-3.5 text-center bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-600/30 cursor-pointer"
                >
                  Pilih Paket Pro
                </Link>
              </div>

              {/* Ultimate Tier */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Paket ULTIMATE</h3>
                  <p className="text-slate-500 text-xs mb-6">Untuk bisnis dengan cabang dan kebutuhan otomasi bot.</p>
                  <p className="text-4xl font-black text-slate-900 mb-6">
                    Rp 149.000<span className="text-sm font-normal text-slate-500"> / bulan</span>
                  </p>
                  <ul className="space-y-3 text-xs md:text-sm text-slate-600 mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Semua Fitur Paket Pro</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Dukungan Multi-Outlet / Cabang</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Bot Notifikasi Penjualan Telegram</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Manajemen Staf & Multi Akun Kasir</li>
                  </ul>
                </div>
                <Link
                  to="/register"
                  className="block w-full py-3.5 text-center border-2 border-slate-900 text-slate-900 rounded-xl font-bold hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                >
                  Pilih Paket Ultimate
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FAQ ACCORDION */}
        <section className="py-24 max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-slate-500 text-sm md:text-base">
              Jawaban lengkap tentang cara kerja teknologi kasir offline MyInvoice.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-6 bg-white hover:bg-slate-50/80 transition-colors text-left gap-4 cursor-pointer"
                  >
                    <span className="font-bold text-base md:text-lg text-slate-900">{faq.q}</span>
                    <ChevronDown
                      size={20}
                      className={`transform transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-violet-600' : 'text-slate-400'}`}
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
        </section>

        {/* 6. FINAL CTA */}
        <section className="py-24 text-center px-6 bg-gradient-to-b from-white to-slate-100 border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Zap size={32} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-slate-900">
              Siap Membawa Kasir Toko Anda ke Level Selanjutnya?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-xl mx-auto">
              Bergabunglah dengan pemilik usaha lain yang telah beralih ke sistem kasir modern tanpa takut koneksi internet putus.
            </p>
            <Link
              to="/register"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-xl text-lg inline-flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Daftar Akun Kasir Gratis</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
