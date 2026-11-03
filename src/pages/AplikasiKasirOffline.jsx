import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, Printer, ArrowRight, ChevronDown, Check, Zap, Smartphone, Radio, RotateCcw } from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function AplikasiKasirOffline() {
  const [openFaq, setOpenFaq] = useState(null);
  const [printerFormat, setPrinterFormat] = useState('58mm'); // '58mm' | '80mm'
  const [printedCount, setPrintedCount] = useState(1);
  const [isPrintingAnim, setIsPrintingAnim] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSimulatePrint = () => {
    setIsPrintingAnim(true);
    setTimeout(() => {
      setPrintedCount(prev => prev + 1);
      setIsPrintingAnim(false);
    }, 600);
  };

  useEffect(() => {
    // 1. Title
    document.title = "Aplikasi Kasir Offline & Cetak Struk Bluetooth | MyInvoice POS";

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Aplikasi kasir (POS) berbasis web yang tetap bisa berjalan tanpa internet. Cetak struk Bluetooth thermal 58mm/80mm, kelola stok barang, dan hitung HPP. Gratis untuk UMKM.'
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
      q: "Apakah benar-benar bisa dipakai tanpa kuota atau internet?",
      a: "Benar 100%. Berkat teknologi Progressive Web App (PWA), seluruh modul kasir tersimpan di cache memori browser HP atau komputermu. Kamu bisa input transaksi, scan barcode, hitung kembalian, hingga cetak struk tanpa perlu terhubung ke Wi-Fi."
    },
    {
      q: "Printer thermal apa saja yang didukung?",
      a: "Semua printer kasir Bluetooth thermal ukuran 58mm dan 80mm yang umum dijual di marketplace (seperti Panda, VSC, Iware, Zywell, Bluetooth POS-58, dsb) maupun printer kabel USB kasir."
    },
    {
      q: "Bagaimana cara menghubungkan printer Bluetooth ke kasir?",
      a: "Cukup aktifkan Bluetooth di HP/Laptop, pairing printer kasir di pengaturan Bluetooth, lalu di menu kasir MyInvoice klik 'Cetak Struk'. Web akan langsung mengirimkan data cetak secara nirkabel."
    },
    {
      q: "Apakah data transaksi offline bisa hilang jika HP dimatikan?",
      a: "Tidak hilang. Data antrean tersimpan di IndexedDB penyimpanan lokal browser yang persisten. Begitu HP mendeteksi koneksi internet, sistem otomatis mengirimkan data penjualan ke cloud."
    }
  ];

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION: HARDWARE & SPEED FOCUS */}
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-16 text-center">
          
          {/* Signal Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hardware Ready • Bluetooth Thermal 58mm & 80mm</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 leading-[1.08] mb-6 max-w-3xl mx-auto">
            Kasir toko fisik yang tetap cetak struk saat internet mati.
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Buka di browser HP, sambungkan ke printer thermal Bluetooth murah, dan layani antrean pelanggan tanpa panik sinyal ngadat. 100% gratis tanpa potongan komisi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              <span>Mulai Pakai Kasir Offline Gratis</span>
              <ArrowRight size={16} />
            </Link>
            <a
              href="#printer-demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm border border-zinc-200 shadow-xs transition-all"
            >
              Coba Simulasi Printer Struk ↓
            </a>
          </div>

          {/* 3D HERO HARDWARE SHOWCASE - POS TABLET & THERMAL RECEIPT PRINTER */}
          <div className="relative max-w-4xl mx-auto my-8">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/80 border border-zinc-200/50 bg-gradient-to-b from-white to-zinc-50/50 p-2 sm:p-4">
              <img 
                src="/images/hero-kasir-showcase.png" 
                alt="Tablet Kasir POS dan Printer Bluetooth Thermal 58mm" 
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md rounded-xl"
                loading="eager"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-400 mt-6">
            <span>✓ Tanpa Download APK Berat</span>
            <span>•</span>
            <span>✓ 0% Potongan Biaya Gesek</span>
            <span>•</span>
            <span>✓ Auto-Sync saat Online</span>
          </div>
        </section>

        {/* 2. THE HERO HARDWARE INTERACTIVE SIMULATOR (DISTINCT VISUAL) */}
        <section id="printer-demo" className="max-w-4xl mx-auto px-6 mb-24">
          <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-zinc-800">
            
            {/* Simulator Control Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400">
                  <Printer size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Stasiun Kasir & Mini Thermal Printer</div>
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                      <Radio size={12} className="animate-pulse" /> BT-POS58 Connected
                    </span>
                    <span>•</span>
                    <span className="text-zinc-400 font-mono text-[11px]">Mode: 100% Offline</span>
                  </div>
                </div>
              </div>

              {/* Format Switcher & Print Trigger */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-zinc-800 rounded-lg flex text-xs font-mono">
                  <button
                    onClick={() => setPrinterFormat('58mm')}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${printerFormat === '58mm' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    58mm (Kecil)
                  </button>
                  <button
                    onClick={() => setPrinterFormat('80mm')}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${printerFormat === '80mm' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    80mm (Lebar)
                  </button>
                </div>
                <button
                  onClick={handleSimulatePrint}
                  disabled={isPrintingAnim}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Printer size={14} />
                  <span>{isPrintingAnim ? 'Mencetak...' : 'Tes Cetak'}</span>
                </button>
              </div>
            </div>

            {/* Hardware Mockup Stage */}
            <div className="pt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left POS Terminal Screen */}
              <div className="md:col-span-7 bg-zinc-950 rounded-2xl p-5 border border-zinc-800 font-mono text-xs text-zinc-300">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <WifiOff size={12} /> STATUS: OFFLINE LOCAL
                  </span>
                  <span>ANTREAN: #0{printedCount}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="p-2.5 bg-zinc-900 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">2x Kopi Susu Gula Aren</div>
                      <div className="text-[10px] text-zinc-500">@ 18.000</div>
                    </div>
                    <div className="font-bold text-white">36.000</div>
                  </div>
                  <div className="p-2.5 bg-zinc-900 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">1x Roti Bakar Keju</div>
                      <div className="text-[10px] text-zinc-500">@ 15.000</div>
                    </div>
                    <div className="font-bold text-white">15.000</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400 text-xs">Total Pembayaran:</span>
                  <span className="text-emerald-400 text-lg font-bold">Rp 51.000</span>
                </div>
              </div>

              {/* Right: Thermal Receipt Roll Coming Out */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full bg-zinc-800 h-3 rounded-t-lg border-b border-zinc-950 shadow-inner" />
                
                {/* Paper Struk Effect */}
                <div className={`w-full ${printerFormat === '58mm' ? 'max-w-[240px]' : 'max-w-[300px]'} bg-[#FAF8F5] text-zinc-900 p-4 font-mono text-[10px] shadow-xl border-x border-b border-zinc-300 rounded-b-md transition-all duration-300 ${isPrintingAnim ? 'translate-y-2 opacity-90' : 'translate-y-0 opacity-100'}`}>
                  <div className="text-center pb-2 border-b border-dashed border-zinc-400 mb-2">
                    <div className="font-black text-xs">WARUNG BERKAH KITA</div>
                    <div className="text-[9px] text-zinc-500">Jl. Kaliurang KM 5.5, YK</div>
                    <div className="text-[8px] text-zinc-400 mt-1">STRUK #{1000 + printedCount} • BLUETOOTH POS</div>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between"><span>2x Kopi Aren</span><span>36.000</span></div>
                    <div className="flex justify-between"><span>1x Roti Keju</span><span>15.000</span></div>
                  </div>

                  <div className="border-t border-dashed border-zinc-400 pt-1.5 space-y-0.5">
                    <div className="flex justify-between font-bold text-xs"><span>TOTAL</span><span>51.000</span></div>
                    <div className="flex justify-between text-zinc-600"><span>TUNAI</span><span>100.000</span></div>
                    <div className="flex justify-between font-bold"><span>KEMBALI</span><span>49.000</span></div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-dashed border-zinc-400 text-center text-[8px] text-zinc-500">
                    Terima kasih atas kunjungan Anda!<br />
                    Powered by MyInvoice.space
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 mt-3 flex items-center gap-1 font-mono">
                  <span>Klik tombol 'Tes Cetak' di atas untuk simulasi</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 3. 3 KEUNGGULAN FISIK TOKO (CLEAN CARDS) */}
        <section className="py-20 px-6 max-w-5xl mx-auto border-t border-zinc-200">
          <div className="mb-12">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">KEUNGGULAN OPERASIONAL</span>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mt-1">
              Bukan sekadar kasir web biasa.
            </h2>
            <p className="text-zinc-500 text-sm mt-2">Dibuat khusus untuk kondisi koneksi internet di Indonesia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4 font-mono font-bold">
                01
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">Penyimpanan IndexedDB</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Setiap kali transaksi kasir terjadi saat offline, data tersimpan di database lokal browser yang tahan restart HP dan tidak terhapus.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4 font-mono font-bold">
                02
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">Protokol Web Bluetooth</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Langsung mengirimkan raw command ESC/POS nirkabel ke printer kasir portable dari Google Chrome tanpa perlu software bridge tambahan.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4 font-mono font-bold">
                03
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">Scanner Barcode Kamera</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Manfaatkan kamera smartphone kamu untuk scan barcode produk secara instan, atau hubungkan barcode scanner USB/Bluetooth eksternal.
              </p>
            </div>
          </div>
        </section>

        {/* 4. PRICING TEASER (COMPACT TABLE) */}
        <section className="py-20 px-6 max-w-4xl mx-auto border-t border-zinc-200">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Biaya yang masuk akal untuk tokomu.</h2>
            <p className="text-zinc-500 text-sm mt-1">Gunakan gratis selamanya atau upgrade untuk hilangkan watermark di struk.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="p-6 bg-white rounded-2xl border border-zinc-200 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-zinc-900">Kasir Toko (Starter)</div>
                <div className="text-3xl font-black text-zinc-900 font-mono my-4">Rp 0</div>
                <ul className="space-y-2 text-xs text-zinc-600 mb-6">
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> Kasir POS Offline PWA 100%</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> Cetak Struk Bluetooth 58mm & 80mm</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> Watermark halus di struk belanja</li>
                </ul>
              </div>
              <Link to="/register" className="w-full text-center py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-900 text-xs font-bold text-zinc-900 transition-all">
                Mulai Gratis
              </Link>
            </div>

            <div className="p-6 bg-zinc-900 text-white rounded-2xl border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm text-white">Kasir Toko (Pro)</div>
                  <span className="text-[10px] bg-white text-zinc-900 font-black px-2 py-0.5 rounded">BEBAS WATERMARK</span>
                </div>
                <div className="text-3xl font-black text-white font-mono my-4">Rp 129.000 <span className="text-xs font-normal text-zinc-400">/bln</span></div>
                <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> 100% Bersih Tanpa Watermark</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Transaksi Kasir & Produk Tanpa Batas</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Laporan Laba Rugi Harian & Rekap Shift</li>
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
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Pertanyaan Seputar Kasir & Hardware</h2>
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
            <h2 className="text-3xl font-black tracking-tight">Siap mencoba di tokomu?</h2>
            <p className="text-xs text-zinc-400">Tanpa download aplikasi berat. Buka langsung di browser HP.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-zinc-900 font-bold text-xs hover:bg-zinc-100 transition-all shadow-lg"
            >
              <span>Buka Kasir Sekarang — Gratis</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}
