import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, Printer, ArrowRight, ChevronDown, Check, Zap, Smartphone, Radio, RotateCcw } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import RelatedTools from '../components/RelatedTools';

export default function AplikasiKasirOffline() {
  const { lang } = useLang();
  const isEn = lang === 'EN';
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
    document.title = isEn
      ? "Offline POS Cashier & Bluetooth Receipt Printing | MyInvoice POS"
      : "Aplikasi Kasir Offline & Cetak Struk Bluetooth | MyInvoice POS";

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
        ? 'Web-based Point of Sale (POS) cashier app that keeps working without internet. Print 58mm/80mm Bluetooth thermal receipts, manage stock, and calculate COGS.'
        : 'Aplikasi kasir (POS) berbasis web yang tetap bisa berjalan tanpa internet. Cetak struk Bluetooth thermal 58mm/80mm, kelola stok barang, dan hitung HPP. Gratis untuk UMKM.'
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
          "name": isEn ? "MyInvoice Offline POS Cashier" : "MyInvoice POS Kasir Offline",
          "url": "https://myinvoice.space/aplikasi-kasir-offline",
          "operatingSystem": "Web, Android, iOS, Windows, macOS (PWA)",
          "applicationCategory": "BusinessApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR",
            "description": isEn ? "Free Starter Plan with offline POS capabilities" : "Paket Gratis untuk UMKM dengan fitur kasir offline"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "180",
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

  const faqsEn = [
    {
      q: "Can it truly operate without mobile data or Wi-Fi?",
      a: "100% yes. Powered by Progressive Web App (PWA) architecture, the entire cashier module is cached locally in your phone or laptop browser. You can ring up sales, scan barcodes, calculate change, and print receipts completely offline."
    },
    {
      q: "Which thermal receipt printers are supported?",
      a: "All standard 58mm and 80mm Bluetooth thermal POS printers (including Panda, VSC, Iware, Zywell, POS-58, Epson, Star) as well as wired USB receipt printers."
    },
    {
      q: "How do I pair a Bluetooth printer with the cashier app?",
      a: "Simply enable Bluetooth on your phone or laptop, pair your thermal printer in device settings, and click 'Print Receipt' inside MyInvoice POS. The browser dispatches wireless ESC/POS print commands directly."
    },
    {
      q: "Will offline sales data be lost if my phone turns off?",
      a: "Never. Offline transactions are stored in persistent IndexedDB local storage. As soon as your device reconnects to the internet, the queue automatically syncs with your cloud database."
    }
  ];

  const faqs = isEn ? faqsEn : faqsId;

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION: HARDWARE & SPEED FOCUS */}
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-16 text-center">
          
          {/* Signal Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isEn ? 'Hardware Ready • Bluetooth Thermal 58mm & 80mm' : 'Siap Hardware • Bluetooth Thermal 58mm & 80mm'}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 leading-[1.08] mb-6 max-w-3xl mx-auto">
            {isEn
              ? 'Retail POS that keeps printing receipts when the internet goes down.'
              : 'Kasir toko fisik yang tetap cetak struk saat internet mati.'}
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            {isEn
              ? 'Open on your phone browser, pair with an affordable Bluetooth thermal printer, and serve customer queues without worrying about unstable Wi-Fi. 100% free with zero commission cuts.'
              : 'Buka di browser HP, sambungkan ke printer thermal Bluetooth murah, dan layani antrean pelanggan tanpa panik sinyal ngadat. 100% gratis tanpa potongan komisi.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2 no-underline"
            >
              <span>{isEn ? 'Start Using Offline POS Free' : 'Mulai Pakai Kasir Offline Gratis'}</span>
              <ArrowRight size={16} />
            </Link>
            <a
              href="#printer-demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm border border-zinc-200 shadow-xs transition-all no-underline"
            >
              {isEn ? 'Try Receipt Printer Simulator ↓' : 'Coba Simulasi Printer Struk ↓'}
            </a>
          </div>

          {/* 3D HERO HARDWARE SHOWCASE - POS TABLET & THERMAL RECEIPT PRINTER */}
          <div className="relative max-w-3xl mx-auto my-8">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/80 border border-zinc-200/50 bg-gradient-to-b from-white to-zinc-50/50 p-2 sm:p-4">
              <img 
                src="/images/hero-kasir-showcase.png" 
                alt={isEn ? "POS Cashier Tablet and 58mm Bluetooth Thermal Receipt Printer" : "Tablet Kasir POS dan Printer Bluetooth Thermal 58mm"} 
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md rounded-xl"
                loading="eager"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-400 mt-6">
            <span>✓ {isEn ? 'No Heavy APK Downloads' : 'Tanpa Download APK Berat'}</span>
            <span>•</span>
            <span>✓ {isEn ? '0% Swipe Commission Fees' : '0% Potongan Biaya Gesek'}</span>
            <span>•</span>
            <span>✓ {isEn ? 'Auto-Syncs When Online' : 'Auto-Sync saat Online'}</span>
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
                  <div className="font-bold text-sm text-white">{isEn ? 'POS Station & Mini Thermal Printer' : 'Stasiun Kasir & Mini Thermal Printer'}</div>
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
                    {isEn ? '58mm (Compact)' : '58mm (Kecil)'}
                  </button>
                  <button
                    onClick={() => setPrinterFormat('80mm')}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${printerFormat === '80mm' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400'}`}
                  >
                    {isEn ? '80mm (Wide)' : '80mm (Lebar)'}
                  </button>
                </div>
                <button
                  onClick={handleSimulatePrint}
                  disabled={isPrintingAnim}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Printer size={14} />
                  <span>{isPrintingAnim ? (isEn ? 'Printing...' : 'Mencetak...') : (isEn ? 'Test Print' : 'Tes Cetak')}</span>
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
                  <span>{isEn ? `QUEUE: #0${printedCount}` : `ANTREAN: #0${printedCount}`}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="p-2.5 bg-zinc-900 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{isEn ? '2x Iced Palm Sugar Latte' : '2x Kopi Susu Gula Aren'}</div>
                      <div className="text-[10px] text-zinc-500">@ 18.000</div>
                    </div>
                    <div className="font-bold text-white">36.000</div>
                  </div>
                  <div className="p-2.5 bg-zinc-900 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{isEn ? '1x Cheese Toast' : '1x Roti Bakar Keju'}</div>
                      <div className="text-[10px] text-zinc-500">@ 15.000</div>
                    </div>
                    <div className="font-bold text-white">15.000</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-400 text-xs">{isEn ? 'Total Payment:' : 'Total Pembayaran:'}</span>
                  <span className="text-emerald-400 text-lg font-bold">Rp 51.000</span>
                </div>
              </div>

              {/* Right: Thermal Receipt Roll Coming Out */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full bg-zinc-800 h-3 rounded-t-lg border-b border-zinc-950 shadow-inner" />
                
                {/* Paper Struk Effect */}
                <div className={`w-full ${printerFormat === '58mm' ? 'max-w-[240px]' : 'max-w-[300px]'} bg-[#FAF8F5] text-zinc-900 p-4 font-mono text-[10px] shadow-xl border-x border-b border-zinc-300 rounded-b-md transition-all duration-300 ${isPrintingAnim ? 'translate-y-2 opacity-90' : 'translate-y-0 opacity-100'}`}>
                  <div className="text-center pb-2 border-b border-dashed border-zinc-400 mb-2">
                    <div className="font-black text-xs">{isEn ? 'BERKAH GENERAL STORE' : 'WARUNG BERKAH KITA'}</div>
                    <div className="text-[9px] text-zinc-500">Jl. Kaliurang KM 5.5, YK</div>
                    <div className="text-[8px] text-zinc-400 mt-1">{isEn ? `RECEIPT #${1000 + printedCount} • BLUETOOTH POS` : `STRUK #${1000 + printedCount} • BLUETOOTH POS`}</div>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between"><span>{isEn ? '2x Palm Latte' : '2x Kopi Aren'}</span><span>36.000</span></div>
                    <div className="flex justify-between"><span>{isEn ? '1x Cheese Toast' : '1x Roti Keju'}</span><span>15.000</span></div>
                  </div>

                  <div className="border-t border-dashed border-zinc-400 pt-1.5 space-y-0.5">
                    <div className="flex justify-between font-bold text-xs"><span>TOTAL</span><span>51.000</span></div>
                    <div className="flex justify-between text-zinc-600"><span>{isEn ? 'CASH' : 'TUNAI'}</span><span>100.000</span></div>
                    <div className="flex justify-between font-bold"><span>{isEn ? 'CHANGE' : 'KEMBALI'}</span><span>49.000</span></div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-dashed border-zinc-400 text-center text-[8px] text-zinc-500">
                    {isEn ? 'Thank you for your visit!' : 'Terima kasih atas kunjungan Anda!'}<br />
                    Powered by MyInvoice.space
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 mt-3 flex items-center gap-1 font-mono">
                  <span>{isEn ? "Click 'Test Print' above to simulate" : "Klik tombol 'Tes Cetak' di atas untuk simulasi"}</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 3. 3 KEUNGGULAN FISIK TOKO (CLEAN CARDS) */}
        <section className="py-20 px-6 max-w-5xl mx-auto border-t border-zinc-200">
          <div className="mb-12">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">{isEn ? 'OPERATIONAL ADVANTAGE' : 'KEUNGGULAN OPERASIONAL'}</span>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tight mt-1">
              {isEn ? 'More than a typical web cashier.' : 'Bukan sekadar kasir web biasa.'}
            </h2>
            <p className="text-zinc-500 text-sm mt-2">{isEn ? 'Purpose-built for real-world retail connectivity challenges.' : 'Dibuat khusus untuk kondisi koneksi internet di Indonesia.'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4 font-mono font-bold">
                01
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">{isEn ? 'IndexedDB Local Storage' : 'Penyimpanan IndexedDB'}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {isEn
                  ? 'Every offline sale is safely recorded in your browser persistent local database, surviving device restarts without data loss.'
                  : 'Setiap kali transaksi kasir terjadi saat offline, data tersimpan di database lokal browser yang tahan restart HP dan tidak terhapus.'}
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4 font-mono font-bold">
                02
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">{isEn ? 'Web Bluetooth Protocol' : 'Protokol Web Bluetooth'}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {isEn
                  ? 'Sends wireless ESC/POS commands directly from Google Chrome to portable receipt printers without third-party bridge apps.'
                  : 'Langsung mengirimkan raw command ESC/POS nirkabel ke printer kasir portable dari Google Chrome tanpa perlu software bridge tambahan.'}
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4 font-mono font-bold">
                03
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">{isEn ? 'Camera Barcode Scanner' : 'Scanner Barcode Kamera'}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {isEn
                  ? 'Use your smartphone camera to scan product barcodes on the spot, or connect external USB/Bluetooth laser scanners.'
                  : 'Manfaatkan kamera smartphone kamu untuk scan barcode produk secara instan, atau hubungkan barcode scanner USB/Bluetooth eksternal.'}
              </p>
            </div>
          </div>
        </section>

        {/* 4. PRICING TEASER (COMPACT TABLE) */}
        <section className="py-20 px-6 max-w-4xl mx-auto border-t border-zinc-200">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{isEn ? 'Fair pricing that makes sense for your store.' : 'Biaya yang masuk akal untuk tokomu.'}</h2>
            <p className="text-zinc-500 text-sm mt-1">{isEn ? 'Use free forever or upgrade to remove receipt watermarks.' : 'Gunakan gratis selamanya atau upgrade untuk hilangkan watermark di struk.'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="p-6 bg-white rounded-2xl border border-zinc-200 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-zinc-900">{isEn ? 'Retail POS (Starter)' : 'Kasir Toko (Starter)'}</div>
                <div className="text-3xl font-black text-zinc-900 font-mono my-4">Rp 0</div>
                <ul className="space-y-2 text-xs text-zinc-600 mb-6">
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? '100% Offline PWA POS Cashier' : 'Kasir POS Offline PWA 100%'}</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? '58mm & 80mm Bluetooth Receipt Printing' : 'Cetak Struk Bluetooth 58mm & 80mm'}</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-zinc-900" /> {isEn ? 'Subtle watermark on printed receipts' : 'Watermark halus di struk belanja'}</li>
                </ul>
              </div>
              <Link to="/register" className="w-full text-center py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-900 text-xs font-bold text-zinc-900 transition-all no-underline">
                {isEn ? 'Get Started Free' : 'Mulai Gratis'}
              </Link>
            </div>

            <div className="p-6 bg-zinc-900 text-white rounded-2xl border border-zinc-800 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm text-white">{isEn ? 'Retail POS (Pro)' : 'Kasir Toko (Pro)'}</div>
                  <span className="text-[10px] bg-white text-zinc-900 font-black px-2 py-0.5 rounded">{isEn ? 'NO WATERMARK' : 'BEBAS WATERMARK'}</span>
                </div>
                <div className="my-4"><span className="text-xs text-zinc-500 line-through font-mono block">Rp 129.000</span><div className="text-3xl font-black text-white font-mono">Rp 49.900 <span className="text-xs font-normal text-zinc-400">{isEn ? '/mo' : '/bln'}</span></div></div>
                <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> {isEn ? '100% Clean Receipts Without Watermark' : '100% Bersih Tanpa Watermark'}</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> {isEn ? 'Unlimited Cashier Transactions & Products' : 'Transaksi Kasir & Produk Tanpa Batas'}</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> {isEn ? 'Daily Profit Reports & Shift Summaries' : 'Laporan Laba Rugi Harian & Rekap Shift'}</li>
                </ul>
              </div>
              <Link to="/register" className="w-full text-center py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-xs font-bold text-zinc-900 transition-all no-underline">
                {isEn ? 'Choose Pro Plan' : 'Pilih Paket Pro'}
              </Link>
            </div>
          </div>
        </section>

        {/* 5. FAQ ACCORDION */}
        <section className="py-20 px-6 max-w-3xl mx-auto border-t border-zinc-200">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{isEn ? 'POS & Hardware FAQs' : 'Pertanyaan Seputar Kasir & Hardware'}</h2>
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
                {/* Internal Linking: Related Free Business Tools */}
        <div className="max-w-4xl mx-auto px-6">
          <RelatedTools currentSlug="aplikasi-kasir-offline" />
        </div>

        <section className="py-20 px-6 bg-zinc-900 text-white text-center">
          <div className="max-w-xl mx-auto space-y-5">
            <h2 className="text-3xl font-black tracking-tight">{isEn ? 'Ready to try it in your store?' : 'Siap mencoba di tokomu?'}</h2>
            <p className="text-xs text-zinc-400">{isEn ? 'No heavy app downloads. Open directly in your phone browser.' : 'Tanpa download aplikasi berat. Buka langsung di browser HP.'}</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-zinc-900 font-bold text-xs hover:bg-zinc-100 transition-all shadow-lg no-underline"
            >
              <span>{isEn ? 'Open POS Now — Free' : 'Buka Kasir Sekarang — Gratis'}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}
