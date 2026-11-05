import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator, Plus, Trash2, Lock, ArrowRight, CheckCircle2,
  Sparkles, ChevronDown, HelpCircle, ShoppingBag, Layers,
  TrendingUp, ShieldCheck, RotateCcw, Pencil, X, Store
} from 'lucide-react';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import { useLang } from '../context/LanguageContext';
import { trackEvent, savePublicCarryover } from '../utils/analytics';

const MAX_FREE_MATERIALS = 5;

const DEFAULT_MATERIALS_ID = [
  { id: 1, name: 'Biji Kopi Espresso Blend', buyQty: 1, buyUnit: 'kg', buyPrice: 160000, useQty: 18, useUnit: 'gr' },
  { id: 2, name: 'Susu UHT Full Cream', buyQty: 1, buyUnit: 'L', buyPrice: 19000, useQty: 120, useUnit: 'ml' },
  { id: 3, name: 'Gula Aren Cair Premium', buyQty: 1, buyUnit: 'L', buyPrice: 35000, useQty: 25, useUnit: 'ml' },
  { id: 4, name: 'Cup Injection 16oz + Lid + Sedotan', buyQty: 50, buyUnit: 'pcs', buyPrice: 45000, useQty: 1, useUnit: 'pcs' }
];

const DEFAULT_MATERIALS_EN = [
  { id: 1, name: 'Espresso Blend Coffee Beans', buyQty: 1, buyUnit: 'kg', buyPrice: 160000, useQty: 18, useUnit: 'gr' },
  { id: 2, name: 'Full Cream UHT Milk', buyQty: 1, buyUnit: 'L', buyPrice: 19000, useQty: 120, useUnit: 'ml' },
  { id: 3, name: 'Premium Liquid Palm Sugar', buyQty: 1, buyUnit: 'L', buyPrice: 35000, useQty: 25, useUnit: 'ml' },
  { id: 4, name: '16oz Cup + Lid + Straw', buyQty: 50, buyUnit: 'pcs', buyPrice: 45000, useQty: 1, useUnit: 'pcs' }
];

const getUnitFactor = (unit) => {
  const u = (unit || '').toLowerCase();
  if (u === 'kg') return 1000;
  if (u === 'gr') return 1;
  if (u === 'l') return 1000;
  if (u === 'ml') return 1;
  if (u === 'lusin') return 12;
  return 1;
};

const calcItemCost = (m) => {
  const buyPrice = Number(m.buyPrice) || 0;
  const buyQty = Math.max(0.0001, Number(m.buyQty) || 1);
  const useQty = Math.max(0, Number(m.useQty) || 0);
  const buyFactor = getUnitFactor(m.buyUnit);
  const useFactor = getUnitFactor(m.useUnit);
  const costPerBase = buyPrice / (buyQty * buyFactor);
  return Math.round(costPerBase * (useQty * useFactor));
};

export default function KalkulatorHppGratis() {
  const { lang } = useLang();
  const isEn = lang === 'EN';

  const [productName, setProductName] = useState(isEn ? 'Iced Brown Sugar Latte' : 'Es Kopi Susu Gula Aren');
  const [sellingPrice, setSellingPrice] = useState(18000);
  const [overheadPerUnit, setOverheadPerUnit] = useState(1000);
  const [materials, setMaterials] = useState(() => (isEn ? DEFAULT_MATERIALS_EN : DEFAULT_MATERIALS_ID));
  const [openFaq, setOpenFaq] = useState(0);
  const [lockModal, setLockModal] = useState({ open: false, reason: 'limit' });
  const [prevLang, setPrevLang] = useState(lang);

  useEffect(() => {
    savePublicCarryover('hpp', { productName, sellingPrice, overheadPerUnit, materials });
  }, [productName, sellingPrice, overheadPerUnit, materials]);

  // Sync default sample labels when switching language if unmodified
  if (prevLang !== lang) {
    setPrevLang(lang);
    if (isEn && productName === 'Es Kopi Susu Gula Aren') {
      setProductName('Iced Brown Sugar Latte');
    } else if (!isEn && productName === 'Iced Brown Sugar Latte') {
      setProductName('Es Kopi Susu Gula Aren');
    }
    setMaterials(prev => prev.map((item, idx) => {
      const fromList = isEn ? DEFAULT_MATERIALS_ID : DEFAULT_MATERIALS_EN;
      const toList = isEn ? DEFAULT_MATERIALS_EN : DEFAULT_MATERIALS_ID;
      if (fromList[idx] && item.name === fromList[idx].name) {
        return { ...item, name: toList[idx].name };
      }
      return item;
    }));
  }

  // SEO & Schema.org JSON-LD
  useEffect(() => {
    document.title = isEn
      ? 'Free Online COGS (HPP) & Food Cost Calculator | MyInvoice'
      : 'Kalkulator HPP Makanan & Harga Jual GoFood Gratis | MyInvoice';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      isEn
        ? 'Calculate Cost of Goods Sold (COGS / HPP), profit margins, and GoFood/GrabFood/ShopeeFood delivery commission pricing online for free. Built for cafes, F&B, and SMEs.'
        : 'Hitung Harga Pokok Penjualan (HPP) makanan & minuman, margin profit, serta simulasi komisi GoFood, GrabFood, dan ShopeeFood secara online & gratis untuk UMKM dan kafe.'
    );

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://myinvoice.space/kalkulator-hpp-gratis');

    const schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          'name': isEn ? 'MyInvoice Free COGS & Food Cost Calculator' : 'Kalkulator HPP & Harga Jual UMKM MyInvoice',
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
            'ratingCount': '310',
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

  const totalMaterialCost = materials.reduce((sum, m) => sum + calcItemCost(m), 0);
  const totalHpp = totalMaterialCost + (Number(overheadPerUnit) || 0);
  const grossProfit = (Number(sellingPrice) || 0) - totalHpp;
  const marginPct = sellingPrice > 0 ? ((grossProfit / sellingPrice) * 100).toFixed(1) : '0.0';

  // GoFood 20% commission recommended price so net profit stays identical
  const gofoodRecommendedPrice = Math.ceil((sellingPrice / 0.8) / 500) * 500;
  const gofoodIfSamePriceNet = Math.round(sellingPrice * 0.8) - totalHpp;

  const handleAddMaterial = () => {
    if (materials.length >= MAX_FREE_MATERIALS) {
      trackEvent('pro_paywall_open', { trigger: 'hpp_5_material_limit' });
      setLockModal({ open: true, reason: 'limit' });
      return;
    }
    setMaterials(prev => [
      ...prev,
      { id: Date.now(), name: '', buyQty: 1, buyUnit: 'kg', buyPrice: 0, useQty: 10, useUnit: 'gr' }
    ]);
  };

  const handleRemoveMaterial = (id) => {
    if (materials.length <= 1) return;
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMaterial = (id, field, value) => {
    setMaterials(prev => prev.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleReset = () => {
    setProductName(isEn ? 'Iced Brown Sugar Latte' : 'Es Kopi Susu Gula Aren');
    setSellingPrice(18000);
    setOverheadPerUnit(1000);
    setMaterials(isEn ? DEFAULT_MATERIALS_EN : DEFAULT_MATERIALS_ID);
  };

  const faqs = isEn
    ? [
        {
          q: 'How do you calculate COGS (HPP) per portion accurately?',
          a: 'Divide the bulk purchase price of each ingredient by its package weight/volume (e.g., 1 kg = 1,000 grams), multiply by the exact gram/ml used per recipe portion, and add your per-cup packaging and operational overhead.'
        },
        {
          q: 'Why do many cafes lose money on GoFood, GrabFood, and ShopeeFood?',
          a: 'Delivery apps deduct a 20% to 25% commission from your menu price. If you sell a Rp 18,000 drink on GoFood without adjusting the price, Rp 3,600 is deducted immediately—wiping out your profit margin.'
        },
        {
          q: 'Can I connect this recipe directly to my POS cashier and raw material inventory?',
          a: 'Yes! By creating a MyInvoice account and upgrading to PRO, your HPP recipes sync directly with the POS Cashier (Recipe Stock Deduction). Every time 1 cup is sold at the cashier, 18g of coffee beans and 120ml of milk are deducted from your warehouse automatically.'
        }
      ]
    : [
        {
          q: 'Bagaimana rumus menghitung HPP makanan dan minuman per porsi yang benar?',
          a: 'Bagilah harga beli bahan kemasan besar dengan total gram/ml isinya (misal 1 kg = 1.000 gram), lalu kalikan dengan takaran gram/ml yang dipakai untuk 1 porsi menu, kemudian tambahkan biaya kemasan (cup/sedotan) dan operasional per porsi.'
        },
        {
          q: 'Kenapa banyak warung dan kafe justru boncos saat ramai orderan di GoFood/GrabFood?',
          a: 'Karena aplikasi pesan-antar memotong komisi 20% hingga 25% dari harga jual. Jika Anda menyamakan harga jual offline Rp 18.000 di aplikasi tanpa menaikkan harga khusus platform, maka potongan Rp 3.600 langsung menggerus laba bersih Anda.'
        },
        {
          q: 'Apakah resep HPP ini bisa langsung memotong stok bahan baku otomatis saat kasir transaksi?',
          a: 'Bisa! Di akun MyInvoice PRO, fitur Recipe Stock Deduction menghubungkan resep HPP langsung ke Kasir POS. Setiap kali kasir menjual 1 gelas kopi, stok gudang otomatis berkurang 18 gram biji kopi dan 120 ml susu secara real-time.'
        }
      ];

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      {/* HOOK & LOCK MODAL (ANTI-CANNIBALIZATION PAYWALL TRIGGER) */}
      {lockModal.open && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setLockModal({ ...lockModal, open: false })}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-zinc-200 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLockModal({ ...lockModal, open: false })}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1 rounded-full border-none bg-transparent cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mb-5">
              <Lock size={24} />
            </div>

            <h3 className="text-xl font-black text-zinc-950 mb-2">
              {lockModal.reason === 'limit'
                ? (isEn ? 'Instant Mode Limit (Max 5 Ingredients)' : 'Batas Mode Instan (Maksimal 5 Bahan Baku)')
                : (isEn ? 'Unlock Full HPP & POS Stock Automation' : 'Buka Otomatisasi Resep HPP & Stok Kasir')}
            </h3>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
              {lockModal.reason === 'limit'
                ? (isEn
                    ? 'The public calculator supports up to 5 ingredients per menu and does not save history. Create a free account or upgrade to PRO to unlock:'
                    : 'Kalkulator publik dibatasi maksimal 5 bahan baku dan tidak menyimpan riwayat resep. Daftar akun gratis & aktifkan PRO untuk membuka:')
                : (isEn
                    ? 'Stop re-typing recipes manually! Connect your HPP calculation directly into your POS Cashier and raw material inventory:'
                    : 'Jangan ketik ulang resep setiap hari! Hubungkan hasil hitungan HPP ini langsung ke Kasir POS & Gudang Bahan Baku Anda:')}
            </p>

            <div className="space-y-2.5 mb-6 text-xs text-zinc-700 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? 'Unlimited raw materials, labor wages, rent & utility breakdown' : 'Input bahan baku tanpa batas + hitung gaji karyawan, sewa ruko & listrik'}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? 'Full commission simulator for GoFood, GrabFood, ShopeeFood & Tokopedia' : 'Simulasi penuh komisi GoFood, GrabFood, ShopeeFood & Marketplace'}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{isEn ? 'Auto Recipe Stock Deduction when cashier sells menu items (PRO)' : 'Potong stok bahan baku gudang otomatis saat kasir jualan (Fitur PRO)'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                to="/register"
                className="w-full py-3.5 px-5 rounded-xl bg-zinc-950 hover:bg-black text-white font-bold text-xs sm:text-sm text-center no-underline shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>{isEn ? 'Save Recipe & Create Free Account' : 'Simpan Resep & Daftar Akun Gratis'}</span>
                <ArrowRight size={15} />
              </Link>
              <button
                type="button"
                onClick={() => setLockModal({ ...lockModal, open: false })}
                className="w-full py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 bg-transparent border-none cursor-pointer"
              >
                {isEn ? 'Continue testing on this page' : 'Lanjut coba hitung di halaman ini'}
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
              <Calculator size={13} />
              <span>{isEn ? 'Free F&B & SME Profit Margin Calculator' : 'Kalkulator HPP & Margin Profit Kuliner / UMKM'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-zinc-950 leading-[1.1] mb-4 max-w-4xl mx-auto" style={{ letterSpacing: '-0.03em' }}>
              {isEn
                ? 'Calculate exact recipe costs. Never lose money on food delivery apps.'
                : 'Hitung modal resep per porsi. Jangan sampai boncos di potongan aplikasi.'}
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              {isEn
                ? 'Convert bulk kg/liter ingredient prices into exact gram/ml recipe costs automatically, check your net profit margin, and see your recommended GoFood selling price.'
                : 'Konversi otomatis harga beli bahan kemasan (Kg/Liter) ke takaran pakai per porsi (Gram/ml), cek margin laba bersih, dan dapatkan saran harga jual aman di GoFood.'}
            </p>
          </div>
        </section>

        {/* INTERACTIVE HPP WORKSHEET */}
        <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT 7 COLS: RECIPE & INGREDIENT TABLE */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-600 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    {isEn ? 'LIVE INTERACTIVE WORKSHEET' : 'LEMBAR KERJA HPP INTERAKTIF'}
                  </span>
                  <h2 className="text-lg font-black text-zinc-950 mt-0.5">
                    {isEn ? 'Edit menu name & ingredients below' : 'Ubah nama menu & takaran bahan di bawah'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/70 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>{isEn ? 'Reset Sample' : 'Reset Contoh'}</span>
                </button>
              </div>

              {/* Menu Name & Target Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
                    <Pencil size={10} className="text-blue-600" />
                    {isEn ? 'Menu / Product Name' : 'Nama Menu / Produk'}
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-blue-600 text-sm font-bold text-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1">
                    <Pencil size={10} className="text-blue-600" />
                    {isEn ? 'Offline / Store Selling Price (Rp)' : 'Harga Jual Normal / Offline (Rp)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-blue-600 text-sm font-mono font-bold text-zinc-900 outline-none"
                  />
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                    {isEn ? `1. Raw Materials & Packaging (${materials.length}/${MAX_FREE_MATERIALS})` : `1. Rincian Bahan Baku & Kemasan (${materials.length}/${MAX_FREE_MATERIALS})`}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {isEn ? 'Auto Kg→gr & L→ml conversion' : 'Otomatis konversi Kg→gr & L→ml'}
                  </span>
                </div>

                {materials.map((m, idx) => {
                  const itemCost = calcItemCost(m);
                  return (
                    <div key={m.id} className="p-3.5 rounded-2xl bg-zinc-50/90 border border-zinc-200/80 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={m.name}
                          onChange={e => handleUpdateMaterial(m.id, 'name', e.target.value)}
                          placeholder={isEn ? `Ingredient ${idx + 1} name...` : `Nama bahan baku ${idx + 1}...`}
                          className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-900 outline-none focus:border-blue-600"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                            Rp {itemCost.toLocaleString('id-ID')}
                          </span>
                          {materials.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(m.id)}
                              className="text-zinc-400 hover:text-red-500 p-1 rounded-lg bg-transparent border-none cursor-pointer"
                              title={isEn ? 'Remove ingredient' : 'Hapus bahan'}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                        {/* Bulk Purchase */}
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-200/70">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                            {isEn ? 'Bulk Purchase Price' : 'Harga Beli Kemasan'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={m.buyQty}
                              onChange={e => handleUpdateMaterial(m.id, 'buyQty', e.target.value)}
                              className="w-14 text-center font-mono font-bold text-xs bg-zinc-50 border border-zinc-200 rounded-lg py-1 outline-none"
                            />
                            <select
                              value={m.buyUnit}
                              onChange={e => handleUpdateMaterial(m.id, 'buyUnit', e.target.value)}
                              className="font-bold text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-1.5 py-1 outline-none"
                            >
                              <option value="kg">kg</option>
                              <option value="gr">gr</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                              <option value="pcs">pcs</option>
                            </select>
                            <span className="text-zinc-400">@ Rp</span>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={m.buyPrice}
                              onChange={e => handleUpdateMaterial(m.id, 'buyPrice', e.target.value)}
                              className="flex-1 min-w-0 text-right font-mono font-bold text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 outline-none"
                            />
                          </div>
                        </div>

                        {/* Recipe Usage */}
                        <div className="bg-white p-2.5 rounded-xl border border-zinc-200/70">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                            {isEn ? 'Used Per 1 Portion' : 'Takaran Pakai Per 1 Porsi'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={m.useQty}
                              onChange={e => handleUpdateMaterial(m.id, 'useQty', e.target.value)}
                              className="flex-1 font-mono font-bold text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 outline-none"
                            />
                            <select
                              value={m.useUnit}
                              onChange={e => handleUpdateMaterial(m.id, 'useUnit', e.target.value)}
                              className="font-bold text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 outline-none"
                            >
                              <option value="gr">gr</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="L">L</option>
                              <option value="pcs">pcs</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                    <span>
                      {materials.length >= MAX_FREE_MATERIALS
                        ? (isEn ? 'Add More Ingredients (Unlock Unlimited)' : 'Tambah Bahan Lagi (Buka Tanpa Batas)')
                        : (isEn ? 'Add Ingredient Row' : 'Tambah Baris Bahan Baku')}
                    </span>
                  </button>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    {isEn ? `${MAX_FREE_MATERIALS - materials.length} free rows remaining` : `Sisa ${MAX_FREE_MATERIALS - materials.length} baris gratis`}
                  </span>
                </div>
              </div>

              {/* Overhead Input + Locked Wage/Rent Breakdown */}
              <div className="pt-4 border-t border-zinc-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                  <div>
                    <div className="text-xs font-bold text-zinc-800">
                      {isEn ? '2. Estimated Operational Cost / Portion (Electricity, Ice, Water)' : '2. Estimasi Biaya Operasional / Porsi (Listrik, Es Batu, Air)'}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {isEn ? 'Quick flat estimate per cup/portion' : 'Estimasi rata-rata biaya tambahan per porsi'}
                    </div>
                  </div>
                  <div className="relative w-full sm:w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={overheadPerUnit}
                      onChange={e => setOverheadPerUnit(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-right font-mono font-bold text-xs bg-white border border-zinc-200 rounded-xl pl-8 pr-3 py-2 outline-none"
                    />
                  </div>
                </div>

                {/* Locked Pro Breakdown Teaser */}
                <div
                  onClick={() => setLockModal({ open: true, reason: 'pro' })}
                  className="p-3.5 rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 hover:bg-violet-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                      <Lock size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-violet-950">
                        {isEn ? '3. Detailed Staff Wages, Store Rent & Monthly Utilities Calculator' : '3. Kalkulator Detail Gaji Karyawan, Sewa Ruko & Listrik Bulanan'}
                      </div>
                      <div className="text-[11px] text-violet-700">
                        {isEn ? 'Available inside your free / PRO MyInvoice dashboard →' : 'Tersedia lengkap di dalam dashboard akun MyInvoice →'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-600 text-white shrink-0">
                    {isEn ? 'Unlock' : 'Buka'}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLS: STICKY PROFIT SUMMARY & MARKETPLACE SIMULATOR */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
              <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                      {isEn ? 'REAL-TIME HPP SUMMARY' : 'RINGKASAN HPP & LABA BERSIH'}
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5 truncate max-w-[240px]">
                      {productName || (isEn ? 'Untitled Menu' : 'Menu Tanpa Nama')}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    Number(marginPct) >= 40
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : Number(marginPct) >= 20
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    Margin {marginPct}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <div className="text-[11px] text-zinc-400">{isEn ? 'Total HPP / Portion' : 'Total HPP / Porsi'}</div>
                    <div className="text-lg sm:text-xl font-mono font-black text-white mt-1">
                      Rp {totalHpp.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/40">
                    <div className="text-[11px] text-emerald-300">{isEn ? 'Net Profit / Portion' : 'Laba Bersih / Porsi'}</div>
                    <div className="text-lg sm:text-xl font-mono font-black text-emerald-400 mt-1">
                      Rp {grossProfit.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Delivery Commission Simulator */}
                <div className="pt-2 space-y-3">
                  <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                    <span>{isEn ? 'Delivery App Price Simulator' : 'Simulasi Harga Aplikasi Pesan-Antar'}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{isEn ? 'Anti-Loss Formula' : 'Rumus Anti-Boncos'}</span>
                  </div>

                  {/* Unlocked GoFood Card */}
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">GoFood (Komisi 20%)</span>
                      <span className="text-[11px] font-mono text-amber-400">
                        {isEn ? `If sold at Rp ${sellingPrice.toLocaleString('id-ID')} → Profit only Rp ${gofoodIfSamePriceNet.toLocaleString('id-ID')}` : `Jika tetap Rp ${sellingPrice.toLocaleString('id-ID')} → Laba sisa Rp ${gofoodIfSamePriceNet.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                      <span className="text-[11px] text-zinc-400">
                        {isEn ? 'Recommended GoFood Price:' : 'Saran Harga Jual di GoFood:'}
                      </span>
                      <span className="text-sm font-mono font-black text-emerald-400">
                        Rp {gofoodRecommendedPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Locked GrabFood / ShopeeFood / Tokopedia Card */}
                  <div
                    onClick={() => setLockModal({ open: true, reason: 'pro' })}
                    className="relative p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 overflow-hidden cursor-pointer group"
                  >
                    <div className="filter blur-[4px] select-none pointer-events-none space-y-1.5 opacity-60">
                      <div className="flex justify-between text-xs">
                        <span>GrabFood (20% + Promo)</span>
                        <span>Rp 23.500</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>ShopeeFood (20% + Admin)</span>
                        <span>Rp 24.000</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Tokopedia / TikTok Shop</span>
                        <span>Rp 21.500</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 group-hover:bg-violet-500 text-white text-[11px] font-bold shadow-lg transition-all">
                        <Lock size={12} />
                        <span>{isEn ? 'Unlock GrabFood, ShopeeFood & Custom Tax' : 'Buka Simulasi GrabFood, ShopeeFood & Pajak'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Hook & Lock CTAs */}
                <div className="pt-2 space-y-2.5">
                  <Link
                    to="/register"
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm text-center no-underline flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Store size={16} />
                    <span>{isEn ? 'Save Recipe & Sell on POS Cashier (Free)' : 'Simpan Resep & Jual di Kasir POS (Gratis)'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setLockModal({ open: true, reason: 'pro' })}
                    className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs border border-zinc-800 cursor-pointer flex items-center justify-center gap-2 transition-colors"
                  >
                    <Layers size={14} className="text-violet-400" />
                    <span>{isEn ? 'Auto-Deduct Warehouse Ingredients on Sale (PRO)' : 'Potong Stok Bahan Baku Otomatis Saat Terjual (PRO)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CONNECT HPP TO MYINVOICE POS */}
        <section className="py-16 px-6 max-w-5xl mx-auto border-t border-zinc-200">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
              {isEn ? 'FROM RECIPE TO CASHIER' : 'DARI RESEP LANGSUNG KE KASIR'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight mt-1">
              {isEn
                ? 'Why calculate HPP inside MyInvoice instead of Excel?'
                : 'Kenapa hitung HPP di MyInvoice jauh lebih untung daripada Excel?'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Layers size={20} />
              </div>
              <h3 className="text-base font-black text-zinc-900 mb-2">
                {isEn ? 'Auto Recipe Stock Deduction' : 'Potong Stok Bahan Baku Otomatis'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {isEn
                  ? 'In MyInvoice PRO, selling 1 cup of Iced Latte at the POS cashier automatically deducts 18g of coffee beans and 120ml of milk from your inventory.'
                  : 'Di akun MyInvoice PRO, saat kasir menjual 1 Es Kopi Susu, stok gudang otomatis terpotong 18 gr biji kopi dan 120 ml susu tanpa rekap manual.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-base font-black text-zinc-900 mb-2">
                {isEn ? 'Instant Price Adjustment Alerts' : 'Deteksi Kenaikan Harga Bahan'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {isEn
                  ? 'When milk or coffee bean supplier prices rise, update the ingredient price once and immediately see how your menu margins change.'
                  : 'Saat harga susu atau gula naik dari supplier, cukup ubah harga beli 1 kali di gudang dan lihat dampaknya ke margin seluruh menu kafe Anda.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-black text-zinc-900 mb-2">
                {isEn ? 'Offline POS + Official Invoicing' : 'Kasir Offline + Invoice B2B'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {isEn
                  ? 'Run your daily cafe cashier offline with 58mm Bluetooth receipt printing AND send official PDF invoices for catering or B2B orders.'
                  : 'Jalankan kasir harian tanpa takut internet mati (cetak struk Bluetooth 58mm) sekaligus kirim tagihan Invoice PDF resmi untuk pesanan katering/partai besar.'}
              </p>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="py-16 px-6 max-w-4xl mx-auto border-t border-zinc-200">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle size={18} className="text-zinc-500" />
            <h2 className="text-2xl font-black text-zinc-900">
              {isEn ? 'Frequently Asked Questions (HPP & Food Cost)' : 'Pertanyaan Seputar Kalkulator HPP & Harga Jual'}
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
