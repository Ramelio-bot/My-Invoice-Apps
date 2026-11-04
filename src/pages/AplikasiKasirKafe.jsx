import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Coffee, Printer, ArrowRight, ChevronDown, Check, Zap, 
  Smartphone, WifiOff, Clock, ShieldCheck, Plus, Minus, RotateCcw
} from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function AplikasiKasirKafe() {
  const [openFaq, setOpenFaq] = useState(null);
  const [printerFormat, setPrinterFormat] = useState('58mm'); // '58mm' | '80mm'
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'takeaway'
  const [tableNumber, setTableNumber] = useState('04');
  const [isPrintingAnim, setIsPrintingAnim] = useState(false);
  const [printedCount, setPrintedCount] = useState(1);

  // Cart state for interactive cafe POS simulator
  const [cart, setCart] = useState([
    { id: 1, name: 'Es Kopi Susu Aren', price: 18000, qty: 2, note: 'Less Ice' },
    { id: 2, name: 'Butter Croissant', price: 22000, qty: 1, note: 'Hangatkan' },
  ]);

  const menuOptions = [
    { id: 1, name: 'Es Kopi Susu Aren', price: 18000, note: 'Less Ice' },
    { id: 2, name: 'Butter Croissant', price: 22000, note: 'Hangatkan' },
    { id: 3, name: 'Matcha Latte Ice', price: 24000, note: 'Normal Sweet' },
    { id: 4, name: 'Caffe Americano', price: 16000, note: 'Hot' },
    { id: 5, name: 'Roti Toast Cokelat', price: 17000, note: 'Extra Keju' },
  ];

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const addItem = (menu) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === menu.id);
      if (existing) {
        return prev.map(i => i.id === menu.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...menu, qty: 1 }];
    });
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

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
    document.title = "Aplikasi Kasir Kafe & Coffee Shop Gratis | MyInvoice POS";

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Aplikasi kasir (POS) gratis untuk kedai kopi, kafe, dan resto mini. Buka dari browser HP/tablet, cetak struk pesanan & tiket barista via Bluetooth 58mm/80mm, tanpa biaya langganan bulanan.'
    );

    // 3. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/aplikasi-kasir-kafe');

    // 4. Schema.org JSON-LD Structured Data
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          "name": "MyInvoice Cafe POS",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All modern browsers (Web, Android, iOS, Windows, macOS)",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "IDR",
            "description": "Paket Gratis untuk Kafe & Kedai Kopi tanpa biaya langganan bulanan"
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
              "name": "Apakah MyInvoice cocok untuk kedai kopi kecil atau booth minuman?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sangat cocok. MyInvoice dirancang ringan dan tidak membutuhkan perangkat keras khusus yang mahal. Anda cukup menggunakan HP atau tablet yang sudah ada, lalu disambungkan ke printer Bluetooth kasir murah 58mm."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah bisa mencetak tiket pesanan untuk barista di bar?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Bisa. Anda bisa mencetak struk rangkap atau tiket pesanan berisi nomor meja, nama pelanggan, varian (Ice/Hot/Less Sugar), dan nomor antrean."
              }
            },
            {
              "@type": "Question",
              "name": "Bagaimana jika koneksi Wi-Fi kafe sedang gangguan saat jam sibuk?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Aplikasi tetap berjalan normal berkat teknologi PWA Offline. Transaksi kasir tetap tersimpan di memori lokal dan struk thermal tetap tercetak via Bluetooth tanpa membutuhkan internet sama sekali."
              }
            },
            {
              "@type": "Question",
              "name": "Apakah benar-benar gratis tanpa biaya langganan bulanan?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ya, paket gratis MyInvoice dapat digunakan tanpa biaya langganan bulanan dan tanpa potongan komisi per transaksi."
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
      q: "Apakah MyInvoice cocok untuk kedai kopi kecil atau booth minuman?",
      a: "Sangat cocok! MyInvoice dirancang seringan mungkin tanpa perlu beli tablet POS jutaan rupiah. Cukup pakai HP Android/iPhone kasir yang sudah ada, hubungkan via Bluetooth ke printer thermal 58mm murah (seharga Rp 120rb - Rp 150rb-an di marketplace), dan kasir kafe siap digunakan."
    },
    {
      q: "Apakah bisa cetak tiket pesanan untuk barista dapur / bar kopi?",
      a: "Bisa. Anda bisa langsung mencetak struk pesanan dengan nomor meja, jenis pesanan (Dine-in / Takeaway), dan catatan khusus (seperti 'Less Ice, Extra Shot, Tanpa Sirup') agar barista tidak salah buat pesanan."
    },
    {
      q: "Bagaimana kalau Wi-Fi kafe tiba-tiba mati saat jam sibuk?",
      a: "Tidak perlu panik. MyInvoice menggunakan teknologi Progressive Web App (PWA) Offline-First. Seluruh transaksi kasir tetap tersimpan di memori browser perangkat Anda dan otomatis sinkron ke server saat koneksi internet tersambung kembali."
    },
    {
      q: "Apakah ada biaya langganan bulanan atau potongan transaksi?",
      a: "Paket Gratis MyInvoice 100% bebas biaya bulanan dan 0% potongan transaksi. Berbeda dari POS kafe lain yang mengenakan biaya Rp 250.000 - Rp 500.000 per bulan per outlet."
    }
  ];

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow">
        {/* 1. HERO SECTION: CAFE & COFFEE SHOP FOCUS */}
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
            {/* Signal Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-200 bg-amber-50/80 text-xs font-semibold text-amber-900 mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Khusus Kedai Kopi, Kafe & Booth Minuman F&B</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[66px] font-black tracking-tight text-zinc-950 leading-[1.08] mb-6 max-w-4xl mx-auto" style={{ letterSpacing: '-0.04em' }}>
              Kasir kafe cepat. Tanpa langganan mahal, struk langsung jadi.
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
              Cukup buka di browser HP atau tablet, sambungkan ke printer Bluetooth thermal murah, dan layani antrean pelanggan jam sibuk tanpa takut Wi-Fi lemot. 100% gratis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2"
              >
                <span>Mulai Pakai Kasir Kafe Gratis</span>
                <ArrowRight size={16} />
              </Link>
              <a
                href="#kafe-demo"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm border border-zinc-200 shadow-xs transition-all"
              >
                Coba Simulasi Kasir Kafe ↓
              </a>
            </div>

            {/* 3D HERO SHOWCASE: CAFE POS TABLET & THERMAL PRINTER */}
            <div className="relative max-w-3xl mx-auto my-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/80 border border-zinc-200/50 bg-gradient-to-b from-white to-zinc-50/50 p-2 sm:p-4">
                <img 
                  src="/images/hero-kafe-showcase.png" 
                  alt="Aplikasi Kasir Kafe dan Printer Struk Bluetooth Kertas Thermal" 
                  className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-md rounded-xl"
                  loading="eager"
                  onError={(e) => {
                    // Fallback to general kasir image if kafe asset is still being copied
                    e.currentTarget.src = "/images/hero-kasir-showcase.png";
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500 mt-6 font-medium">
              <span>✓ Mendukung Meja & Takeaway</span>
              <span>•</span>
              <span>✓ Cetak Tiket Barista 58mm & 80mm</span>
              <span>•</span>
              <span>✓ 0% Potongan Komisi Transaksi</span>
            </div>
          </div>
        </section>

        {/* 2. THE HERO CAFE INTERACTIVE SIMULATOR */}
        <section id="kafe-demo" className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">INTERACTIVE BARISTA & CASHIER PREVIEW</span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
              Simulasi Kasir Kafe & Cetak Tiket Barista
            </h2>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto mt-2">
              Coba tambahkan menu kopi, pilih Dine-in atau Takeaway, lalu klik cetak untuk melihat contoh format struk pesanan kafe.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: CAFE ORDER PAD (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Coffee size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-zinc-950">Kopi Kenangan Senja — Kasir 01</div>
                    <div className="text-xs text-zinc-400">Order #042 • Status: Siap Bayar</div>
                  </div>
                </div>

                {/* Dine-in vs Takeaway Toggle */}
                <div className="p-1 bg-zinc-100 rounded-xl flex text-xs font-semibold">
                  <button
                    onClick={() => setOrderType('dine_in')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${orderType === 'dine_in' ? 'bg-white text-zinc-900 shadow-xs font-bold' : 'text-zinc-500'}`}
                  >
                    Dine-In
                  </button>
                  <button
                    onClick={() => setOrderType('takeaway')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${orderType === 'takeaway' ? 'bg-white text-zinc-900 shadow-xs font-bold' : 'text-zinc-500'}`}
                  >
                    Takeaway
                  </button>
                </div>
              </div>

              {/* Table selection if Dine-in */}
              {orderType === 'dine_in' && (
                <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                  <span className="text-amber-800 font-bold">Nomor Meja:</span>
                  <div className="flex gap-1.5">
                    {['01', '02', '03', '04', '05', 'VIP'].map(tbl => (
                      <button
                        key={tbl}
                        onClick={() => setTableNumber(tbl)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${tableNumber === tbl ? 'bg-amber-600 text-white font-bold' : 'bg-white text-zinc-700 border border-amber-200'}`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Menu Selection */}
              <div className="mb-5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Pilih Menu Tambahan:</span>
                <div className="flex flex-wrap gap-2">
                  {menuOptions.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-900 text-xs font-semibold text-zinc-800 bg-zinc-50/50 hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={13} className="text-zinc-500" />
                      <span>{item.name}</span>
                      <span className="text-zinc-400 font-normal">Rp {item.price.toLocaleString('id-ID')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Cart List */}
              <div className="space-y-2 mb-5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Daftar Pesanan:</span>
                {cart.map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-zinc-900">{item.name}</div>
                      <div className="text-[11px] text-amber-700 font-medium">Catatan: {item.note}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-lg px-2 py-1">
                        <button onClick={() => updateQty(item.id, -1)} className="text-zinc-500 hover:text-black cursor-pointer">
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-zinc-900 w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="text-zinc-500 hover:text-black cursor-pointer">
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="font-mono font-bold text-zinc-900 w-20 text-right">
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary & Trigger */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400">Total Tagihan ({cart.reduce((a, b) => a + b.qty, 0)} item)</div>
                  <div className="text-xl font-black text-zinc-950 font-mono">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  onClick={handleSimulatePrint}
                  disabled={isPrintingAnim || cart.length === 0}
                  className="px-5 py-3 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <Printer size={15} />
                  <span>{isPrintingAnim ? 'Mencetak Struk...' : 'Simulasi Cetak Struk Kafe'}</span>
                </button>
              </div>
            </div>

            {/* RIGHT: REALISTIC THERMAL RECEIPT (5 Cols) */}
            <div className="lg:col-span-5 bg-zinc-900 rounded-3xl p-6 text-white border border-zinc-800 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-zinc-300">Bluetooth Printer (POS-58)</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setPrinterFormat('58mm')} 
                    className={`px-2 py-1 text-[11px] font-mono rounded ${printerFormat === '58mm' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-500'}`}
                  >
                    58mm
                  </button>
                  <button 
                    onClick={() => setPrinterFormat('80mm')} 
                    className={`px-2 py-1 text-[11px] font-mono rounded ${printerFormat === '80mm' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-500'}`}
                  >
                    80mm
                  </button>
                </div>
              </div>

              {/* THERMAL PAPER CONTAINER */}
              <div className={`mx-auto bg-white text-zinc-900 p-5 rounded-lg shadow-2xl font-mono text-xs transition-all duration-300 ${printerFormat === '58mm' ? 'max-w-[270px]' : 'max-w-[340px]'} ${isPrintingAnim ? 'opacity-80 scale-98 translate-y-1' : 'opacity-100'}`}>
                
                {/* Receipt Header */}
                <div className="text-center pb-3 border-b border-dashed border-zinc-300">
                  <div className="font-bold text-sm tracking-tight">KOPI KENANGAN SENJA</div>
                  <div className="text-[10px] text-zinc-500">Jl. Gejayan No. 88, Yogyakarta</div>
                  <div className="text-[10px] text-zinc-400 mt-1">WA: 0812-3456-7890</div>
                </div>

                {/* Order & Table Meta */}
                <div className="py-2.5 border-b border-dashed border-zinc-300 text-[11px] space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>ORDER #042</span>
                    <span className="bg-zinc-900 text-white px-1.5 py-0.2 rounded text-[10px]">
                      {orderType === 'dine_in' ? `MEJA ${tableNumber}` : 'TAKEAWAY'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Kasir: Cindy</span>
                    <span>04/11/2026 14:35</span>
                  </div>
                </div>

                {/* Items */}
                <div className="py-3 border-b border-dashed border-zinc-300 space-y-2">
                  {cart.map(item => (
                    <div key={item.id}>
                      <div className="flex justify-between font-semibold">
                        <span>{item.qty}x {item.name}</span>
                        <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-[9px] text-zinc-500 pl-4 italic">
                        * {item.note}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span>TOTAL:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Bayar (QRIS):</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Kembalian:</span>
                    <span>Rp 0</span>
                  </div>
                </div>

                {/* Barcode & Footer */}
                <div className="pt-3 text-center">
                  <div className="tracking-[4px] font-bold text-[9px] text-zinc-400 uppercase">
                    ||||| | |||| ||| |||||||
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-1">
                    TERIMA KASIH — ENJOY YOUR COFFEE!
                  </div>
                  <div className="text-[8px] text-zinc-400 mt-0.5">
                    Powered by MyInvoice Cafe POS
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <span className="text-[11px] text-zinc-400 font-mono">
                  ✓ Berhasil mencetak {printedCount} tiket struk
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* 3. KEY BENEFIT PILLARS FOR CAFES & COFFEE SHOPS */}
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-zinc-200/80">
          <div className="text-center mb-14">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">FITUR UNGGULAN KULINER</span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mt-1">
              Didesain untuk kecepatan meja kasir kafe
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-5 font-bold">
                <WifiOff size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">Anti Macet Saat Wi-Fi Down</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Jam makan siang saat kedai penuh dan Wi-Fi lemot? Kasir MyInvoice tetap lancar input order dan cetak struk via Bluetooth tanpa kuota internet.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-5 font-bold">
                <Coffee size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">Varian Rasa & Custom Note</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Mudah input pesanan custom pelanggan: Ice/Hot, Less Sugar, Extra Shot espresso, atau tanpa bawang pada makanan. Barista membaca tiket dengan jelas.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-xs hover:border-zinc-900 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-5 font-bold">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold text-zinc-950 mb-2">Rekap Kas & Pergantian Shift</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Hitung uang kas masuk shift pagi dan shift malam secara presisi. Ketahui jika ada selisih uang tunai laci sebelum pergantian barista/kasir toko.
              </p>
            </div>
          </div>
        </section>

        {/* 4. COMPARISON TABLE: MYINVOICE VS APLIKASI POS MAHAL */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="bg-zinc-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-center">
              Kenapa harus bayar mahal jika bisa gratis?
            </h2>
            <p className="text-sm text-zinc-400 text-center max-w-xl mx-auto mb-8">
              Bandingkan fitur MyInvoice dengan aplikasi kasir konvensional yang membebani cash flow bulanan kafe barumu.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-3 font-semibold">Fitur / Kebutuhan</th>
                    <th className="pb-3 font-bold text-emerald-400">MyInvoice Kafe</th>
                    <th className="pb-3 font-semibold text-zinc-500">POS Kafe Berbayar Lain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  <tr>
                    <td className="py-3 font-medium">Biaya Langganan Bulanan</td>
                    <td className="py-3 font-bold text-emerald-400">Rp 0 (Gratis Selamanya)</td>
                    <td className="py-3 text-zinc-500">Rp 250rb - 500rb / bulan</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Kewajiban Beli Alat Khusus</td>
                    <td className="py-3 font-bold text-emerald-400">Bebas (Pakai HP/Tablet apapun)</td>
                    <td className="py-3 text-zinc-500">Wajib beli mesin POS jutaan</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Jalan Saat Internet Padam</td>
                    <td className="py-3 font-bold text-emerald-400">Bisa 100% (PWA Offline)</td>
                    <td className="py-3 text-zinc-500">Sering error / stuck loading</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium">Dukungan Printer Bluetooth Murah</td>
                    <td className="py-3 font-bold text-emerald-400">Universal (58mm & 80mm)</td>
                    <td className="py-3 text-zinc-500">Terkunci ke printer merk tertentu</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 5. FAQ SECTION */}
        <section className="py-20 px-6 max-w-3xl mx-auto border-t border-zinc-200/80">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              Pertanyaan Seputar Kasir Kafe
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
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-zinc-950 bg-transparent border-none cursor-pointer"
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
              Percepat antrean tokomu sekarang.
            </h2>
            <p className="text-base text-zinc-400 mb-8 max-w-xl mx-auto">
              Tidak perlu kartu kredit atau komitmen biaya bulanan. Daftarkan tokomu dan layani pelanggan pertama dalam 2 menit.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 no-underline"
            >
              <span>Daftar Akun Kasir Kafe Gratis</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
