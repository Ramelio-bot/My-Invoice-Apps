import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Store, Search, ArrowRight, Sparkles, Check, 
  Layers, Printer, ChevronRight
} from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import { ALL_SEO_INDUSTRIES } from '../data/seoIndustries';

const CATEGORIES = [
  { id: 'all', label: 'Semua Solusi' },
  { id: 'creative', label: 'Jasa & Kreatif', filterType: ['Freelance & Agensi', 'Event & Entertainment', 'Manufaktur & Percetakan'] },
  { id: 'retail', label: 'Retail & Toko', filterType: ['Retail Hewan & Klinik', 'Fashion & Apparel', 'Retail Sembako & Harian', 'Komunitas & Retail'] },
  { id: 'automotive', label: 'Otomotif & Servis', filterType: ['Otomotif & Servis', 'Transportasi & Rental'] },
  { id: 'property', label: 'Konstruksi & Properti', filterType: ['Konstruksi & Renovasi', 'Konstruksi & Properti', 'Desain & Properti'] },
  { id: 'b2b', label: 'SPH & B2B', filterType: ['Teknologi & IT', 'Kuliner & F&B', 'Konsultan & B2B'] }
];

export default function SolusiHub() {
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'Direktori Solusi Invoice & Kasir Spesifik Industri | MyInvoice';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Pilih software invoice, faktur penagihan, dan aplikasi kasir POS gratis yang dikalibrasi khusus untuk 20+ bidang industri UMKM dan profesional di Indonesia.'
    );

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/solusi');

    // JSON-LD Schema
    const scriptId = 'solusi-hub-jsonld';
    let scriptTag = document.getElementById(scriptId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Direktori Solusi Invoice & Kasir Spesifik Industri MyInvoice",
      "description": "Koleksi software invoice dan aplikasi kasir POS gratis untuk berbagai industri bisnis di Indonesia.",
      "url": "https://myinvoice.space/solusi",
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": ALL_SEO_INDUSTRIES.map((item, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": item.industryName,
          "url": item.canonicalUrl
        }))
      }
    };
    scriptTag.textContent = JSON.stringify(schemaData);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, []);

  const filteredIndustries = useMemo(() => {
    return ALL_SEO_INDUSTRIES.filter((ind) => {
      const matchSearch = 
        ind.industryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ind.heroHighlight.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ind.badgeText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ind.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (selectedCat === 'all') return true;

      const catObj = CATEGORIES.find(c => c.id === selectedCat);
      return catObj?.filterType?.includes(ind.categoryName);
    });
  }, [selectedCat, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <LandingNavbar />

      <main className="flex-1">
        {/* HEADER */}
        <section className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold mb-5">
            <Sparkles size={13} className="text-slate-500" />
            <span>20+ Solusi Industri & Usaha Spesifik</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.12] mb-5">
            Pilih Solusi Invoice & Kasir Sesuai Bidang Usaha Anda
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Setiap industri memiliki pola transaksi yang unik. MyInvoice menyediakan simulator interaktif, format termin DP, perhitungan meteran, dan cetak struk thermal yang dirancang khusus untuk alur bisnis Anda.
          </p>

          {/* SEARCH & FILTERS */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari industri (contoh: kontraktor, laundry, pet shop, catering, vape)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200/90 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-slate-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY TABS */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCat === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* DIRECTORY GRID */}
        <section className="py-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {filteredIndustries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <p className="text-sm font-bold text-slate-900 mb-1">Tidak ada industri yang cocok</p>
              <p className="text-xs text-slate-500 mb-4">Coba kata kunci pencarian lain atau pilih kategori Semua Solusi.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCat('all'); }}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
              >
                Tampilkan Semua Solusi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIndustries.map((ind) => (
                <Link
                  key={ind.slug}
                  to={`/${ind.slug}`}
                  className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between no-underline"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {ind.categoryName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {ind.type === 'pos' ? (
                          <>
                            <Store size={11} className="text-slate-600" />
                            <span>Kasir POS</span>
                          </>
                        ) : (
                          <>
                            <FileText size={11} className="text-slate-600" />
                            <span>Invoice Termin</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-slate-950 group-hover:text-black mb-2 leading-snug">
                      {ind.industryName}
                    </h2>

                    {/* Highlight */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-6 font-normal">
                      {ind.heroHighlight}
                    </p>
                  </div>

                  {/* Bottom Action Pill */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-black">
                    <span>Lihat Solusi & Coba Simulator</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* BOTTOM CALLOUT */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Bidang Usaha Anda Belum Tercantum di Atas?
            </h2>
            <p className="text-sm text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed font-normal">
              MyInvoice menyediakan format umum fleksibel yang dapat disesuaikan untuk segala jenis barang dan jasa. Buat dokumen resmi dalam 30 detik tanpa daftar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/buat-invoice-gratis"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-sm transition"
              >
                Buat Invoice Umum Gratis
              </Link>
              <Link
                to="/aplikasi-kasir-offline"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
              >
                Buka Kasir POS Umum
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
