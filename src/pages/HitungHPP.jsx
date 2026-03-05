import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Save, ChevronDown, ChevronRight, Package, Users, Building2, Zap, MoreHorizontal, ShoppingBag, Percent, DollarSign } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import { generatePDF } from '../utils/pdf';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';

// ── Unit conversion maps ──────────────────────────────────────────────────────
const UNIT_GROUPS = {
    volume: { options: ['liter', 'ml', 'cc'], toBase: { liter: 1000, ml: 1, cc: 1 } },
    weight: { options: ['kg', 'gram', 'ons'], toBase: { kg: 1000, gram: 1, ons: 100 } },
    length: { options: ['meter', 'cm', 'mm'], toBase: { meter: 1000, cm: 10, mm: 1 } },
    count: { options: ['pcs', 'lusin', 'kodi', 'pak'], toBase: { pcs: 1, lusin: 12, kodi: 20, pak: 10 } },
    time: { options: ['jam', 'hari', 'bulan'], toBase: { jam: 1, hari: 8, bulan: 208 } },
};
const ALL_UNITS = Object.values(UNIT_GROUPS).flatMap(g => g.options);
const getBaseMultiplier = (unit) => {
    for (const g of Object.values(UNIT_GROUPS)) {
        if (unit in g.toBase) return g.toBase[unit];
    }
    return 1;
};
const canConvert = (unitA, unitB) => {
    for (const g of Object.values(UNIT_GROUPS)) {
        const opts = g.options;
        if (opts.includes(unitA) && opts.includes(unitB)) return true;
    }
    return false;
};
const convertQty = (qty, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return qty;
    if (!canConvert(fromUnit, toUnit)) return qty;
    const baseA = getBaseMultiplier(fromUnit);
    const baseB = getBaseMultiplier(toUnit);
    return qty * baseA / baseB;
};

// ── ID generators ──────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Empty entry factories ──────────────────────────────────────────────────────
const emptyMaterial = () => ({
    id: uid(), name: '',
    buyQty: 1, buyUnit: 'kg', buyPrice: 0,
    useQty: 1, useUnit: 'gram',
});
const emptyWage = () => ({
    id: uid(), name: '',
    type: 'monthly', // monthly | daily | hourly
    salary: 0, mealAllowance: 0,
    workDays: 26, productionPerDay: 1,
});
const emptyRent = () => ({
    id: uid(), name: '',
    type: 'annual', // annual | monthly
    amount: 0, operationalDays: 26, productionPerDay: 1,
});
const emptyUtility = () => ({
    id: uid(), name: '',
    monthlyAmount: 0, operationalDays: 26, productionPerDay: 1,
});
const emptyMisc = () => ({ id: uid(), name: '', amountPerUnit: 0 });

const emptyRecipe = () => ({
    productName: '',
    sellingPrice: 0,
    materials: [],
    wages: [],
    rents: [],
    utilities: [],
    misc: [],
    // Platform costs
    marketplaceFee: 0,     // % marketplace commission
    productTax: 0,          // % PPN / product tax
    platformFeeFixed: 0,    // fixed nominal per transaction (Rp or $)
    platformFeeCurrency: 'Rp', // 'Rp' | '$'
    platformFeePct: 0,      // additional percentage fee
});

// ── Cost calculators ───────────────────────────────────────────────────────────
const calcMaterialCost = (m) => {
    // Cost per base unit of buyUnit
    const costPerBuyBase = m.buyQty > 0 ? m.buyPrice / m.buyQty : 0;
    // Convert useQty from useUnit to buyUnit
    const useInBuyUnits = canConvert(m.useUnit, m.buyUnit)
        ? convertQty(m.useQty, m.useUnit, m.buyUnit)
        : m.useQty;
    return costPerBuyBase * useInBuyUnits;
};

const calcWageCost = (w) => {
    let dailyTotal = 0;
    if (w.type === 'monthly') {
        dailyTotal = (w.salary / (w.workDays || 26)) + (w.mealAllowance || 0);
    } else if (w.type === 'daily') {
        dailyTotal = (w.salary || 0) + (w.mealAllowance || 0);
    } else { // hourly
        dailyTotal = (w.salary || 0) * 8 + (w.mealAllowance || 0);
    }
    return w.productionPerDay > 0 ? dailyTotal / w.productionPerDay : 0;
};

const calcRentCost = (r) => {
    const monthly = r.type === 'annual' ? r.amount / 12 : r.amount;
    const daily = r.operationalDays > 0 ? monthly / r.operationalDays : 0;
    return r.productionPerDay > 0 ? daily / r.productionPerDay : 0;
};

const calcUtilityCost = (u) => {
    const daily = u.operationalDays > 0 ? u.monthlyAmount / u.operationalDays : 0;
    return u.productionPerDay > 0 ? daily / u.productionPerDay : 0;
};

// ── Per-plan guard component ───────────────────────────────────────────────────
function UpgradePrompt({ dark, lang }) {
    return (
        <div style={{ padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🧮</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B', marginBottom: 8 }}>
                {lang === 'EN' ? 'Advanced HPP Calculator — ULTIMATE Feature' : 'Kalkulator HPP Advanced — Fitur ULTIMATE'}
            </h2>
            <p style={{ color: dark ? '#94A3B8' : '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                {lang === 'EN'
                    ? 'Calculate cost of goods with raw materials, staff wages, rent, utilities and more. Auto price recommendations.'
                    : 'Hitung HPP lengkap: bahan baku, gaji karyawan, sewa, utilitas dan lain-lain. Rekomendasi harga otomatis.'
                }<br />
                {lang === 'EN' ? 'Upgrade to ULTIMATE to unlock.' : 'Upgrade ke ULTIMATE untuk mengakses fitur ini.'}
            </p>
            <button
                onClick={() => window.location.href = import.meta.env.VITE_MAYAR_ULTIMATE_PAYMENT_URL}
                style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}
            >
                👑 {lang === 'EN' ? 'Upgrade to ULTIMATE' : 'Upgrade ke ULTIMATE'} — Rp 149.000/bln
            </button>
        </div>
    );
}

// ── Section toggle helper ──────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, color, count, open, onToggle, children }) {
    return (
        <div style={{ borderRadius: 14, border: `1px solid ${color}44`, overflow: 'hidden', marginBottom: 16 }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px', background: `${color}11`, border: 'none', cursor: 'pointer',
                    color: color, fontWeight: 700, fontSize: 15,
                }}
            >
                <Icon size={18} />
                <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
                {count > 0 && <span style={{ fontSize: 11, background: color, color: 'white', borderRadius: 20, padding: '2px 8px' }}>{count}</span>}
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {open && <div style={{ padding: '16px 20px' }}>{children}</div>}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HitungHPP() {
    const { dark } = useTheme();
    const { showToast } = useToast();
    const { lang } = useLang();
    const { effectivePlan, isAdmin, user } = useAuth();

    const [recipes, setRecipes] = useState([]);
    const [activeId, setActiveId] = useState(null);
    // Persistent draft — survives navigation between pages
    const { hppDraftRecipe: recipe, setHppDraftRecipe: setRecipe } = useStore();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState({ materials: true, wages: false, rents: false, utilities: false, misc: false });

    // ── Text ──────────────────────────────────────────────────────────────────
    const T = {
        title: lang === 'EN' ? 'Advanced HPP Calculator' : 'Kalkulator HPP Advanced',
        subtitle: lang === 'EN' ? 'Accurate product cost calculation for pricing strategy' : 'Hitung HPP produk secara akurat untuk strategi harga',
        newProduct: lang === 'EN' ? '+ New Product' : '+ Produk Baru',
        productName: lang === 'EN' ? 'Product Name' : 'Nama Produk',
        sellingPrice: lang === 'EN' ? 'Selling Price (Rp)' : 'Harga Jual (Rp)',
        rawMaterials: lang === 'EN' ? 'Raw Materials' : 'Bahan Baku',
        staffWages: lang === 'EN' ? 'Staff Wages' : 'Gaji Karyawan',
        rentUtils: lang === 'EN' ? 'Rent & Utilities' : 'Sewa & Utilitas',
        utilities: lang === 'EN' ? 'Utilities' : 'Utilitas',
        misc: lang === 'EN' ? 'Other Costs' : 'Biaya Lain-lain',
        platform: lang === 'EN' ? 'Platform Costs' : 'Biaya Platform',
        marketplaceFee: lang === 'EN' ? 'Marketplace Fee (%)' : 'Biaya Admin Marketplace (%)',
        marketplaceFeeHint: lang === 'EN' ? 'Shopee, Tokopedia, etc.' : 'Shopee, Tokopedia, dll.',
        productTax: lang === 'EN' ? 'Product Tax / PPN (%)' : 'Pajak Produk / PPN (%)',
        productTaxHint: lang === 'EN' ? 'Tax adjustment %' : 'Penyesuaian pajak %',
        platformFeeFixed: lang === 'EN' ? 'Other Fixed Fee (amount)' : 'Biaya Platform Tetap (nominal)',
        platformFeeFixedHint: lang === 'EN' ? 'Fixed fee per transaction (Rp or $)' : 'Biaya tetap per transaksi',
        platformFeePct: lang === 'EN' ? 'Other Platform Fee (%)' : 'Biaya Platform Lainnya (%)',
        platformFeePctHint: lang === 'EN' ? 'Additional percentage of base HPP' : 'Persentase tambahan dari HPP dasar',
        summary: lang === 'EN' ? 'HPP Summary' : 'Ringkasan HPP',
        totalHPP: lang === 'EN' ? 'Total HPP/unit' : 'Total HPP Akhir/unit',
        margin: lang === 'EN' ? 'Margin' : 'Margin',
        recommendation: lang === 'EN' ? 'Price Recommendation' : 'Rekomendasi Harga',
        customPriceTest: lang === 'EN' ? 'Simulate Custom Price' : 'Simulasi Harga Custom',
        minimum: lang === 'EN' ? 'Minimum (30%)' : 'Minimum (30%)',
        ideal: lang === 'EN' ? 'Ideal (50%)' : 'Ideal (50%)',
        premium: lang === 'EN' ? 'Premium (100%)' : 'Premium (100%)',
        addItem: lang === 'EN' ? 'Add Item' : 'Tambah Item',
        materialName: lang === 'EN' ? 'Material Name' : 'Nama Bahan',
        buyQty: lang === 'EN' ? 'Buy Qty' : 'Qty Beli',
        buyUnit: lang === 'EN' ? 'Buy Unit' : 'Satuan Beli',
        buyPrice: lang === 'EN' ? 'Buy Price (Rp)' : 'Harga Beli (Rp)',
        useQty: lang === 'EN' ? 'Use Qty' : 'Qty Pakai',
        useUnit: lang === 'EN' ? 'Use Unit' : 'Satuan Pakai',
        costPerUnit: lang === 'EN' ? 'Cost/unit' : 'Biaya/unit',
        wageName: lang === 'EN' ? 'Position/Name' : 'Nama/Jabatan',
        wageType: lang === 'EN' ? 'Pay Type' : 'Tipe Gaji',
        monthly: lang === 'EN' ? 'Monthly' : 'Bulanan',
        daily: lang === 'EN' ? 'Daily' : 'Harian',
        hourly: lang === 'EN' ? 'Hourly' : 'Per Jam',
        salary: lang === 'EN' ? 'Salary (Rp)' : 'Gaji (Rp)',
        mealAllowance: lang === 'EN' ? 'Meal Allowance/day' : 'Uang Makan/hari',
        workDays: lang === 'EN' ? 'Work Days/month' : 'Hari Kerja/bulan',
        productionPerDay: lang === 'EN' ? 'Production/day (units)' : 'Produksi/hari (unit)',
        rentName: lang === 'EN' ? 'Rent Name' : 'Nama Sewa',
        rentType: lang === 'EN' ? 'Period' : 'Periode',
        annual: lang === 'EN' ? 'Annual' : 'Tahunan',
        rentAmount: lang === 'EN' ? 'Amount (Rp)' : 'Nominal (Rp)',
        opDays: lang === 'EN' ? 'Operational Days/month' : 'Hari Operasional/bulan',
        utilityName: lang === 'EN' ? 'Utility Name' : 'Nama Utilitas',
        monthlyAmount: lang === 'EN' ? 'Monthly Cost (Rp)' : 'Biaya/bulan (Rp)',
        miscName: lang === 'EN' ? 'Description' : 'Keterangan',
        amountPerUnit: lang === 'EN' ? 'Cost/unit (Rp)' : 'Biaya/unit (Rp)',
        savePDF: lang === 'EN' ? 'Export PDF' : 'Export PDF',
        saved: lang === 'EN' ? 'Saved!' : 'Tersimpan!',
        saveProduct: lang === 'EN' ? 'Save Product' : 'Simpan Produk',
        deleteProduct: lang === 'EN' ? 'Delete' : 'Hapus',
        noProducts: lang === 'EN' ? 'No products yet. Click "+ New Product" to start.' : 'Belum ada produk. Klik "+ Produk Baru" untuk mulai.',
    };

    // ── Theme colors ──────────────────────────────────────────────────────────
    const bg = dark ? '#0F172A' : '#F8FAFC';
    const card = dark ? '#1E293B' : '#FFFFFF';
    const border = dark ? '#334155' : '#E2E8F0';
    const text = dark ? '#F1F5F9' : '#1E293B';
    const sub = dark ? '#94A3B8' : '#64748B';
    const inp = dark ? '#1E293B' : '#FFFFFF';
    const inpBorder = dark ? '#475569' : '#CBD5E1';

    // ── PLAN GUARD ─────────────────────────────────────────────────────────────
    if (effectivePlan !== 'ultimate' && !isAdmin) {
        return <UpgradePrompt dark={dark} lang={lang} />;
    }

    // ── Supabase CRUD ──────────────────────────────────────────────────────────
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (!user) return;
        (async () => {
            setLoading(true);
            const { data } = await supabase.from('hpp_recipes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });
            if (data) setRecipes(data);
            setLoading(false);
        })();
    }, [user]);

    const handleSave = async () => {
        if (!recipe.productName.trim()) { showToast(lang === 'EN' ? 'Product name is required' : 'Nama produk wajib diisi', 'error'); return; }
        setSaving(true);
        try {
            const payload = {
                user_id: user.id,
                product_name: recipe.productName,
                selling_price: Number(recipe.sellingPrice) || 0,
                components: {
                    materials: recipe.materials,
                    wages: recipe.wages,
                    rents: recipe.rents,
                    utilities: recipe.utilities,
                    misc: recipe.misc,
                    marketplaceFee: Number(recipe.marketplaceFee) || 0,
                    productTax: Number(recipe.productTax) || 0,
                    platformFeeFixed: Number(recipe.platformFeeFixed) || 0,
                    platformFeeCurrency: recipe.platformFeeCurrency || 'Rp',
                    platformFeePct: Number(recipe.platformFeePct) || 0,
                },
                total_hpp: Math.round(totalHPP),
                margin_percent: recipe.sellingPrice > 0 ? Math.round(((Number(recipe.sellingPrice) - totalHPP) / totalHPP) * 100) : 0,
                updated_at: new Date().toISOString(),
            };
            let result;
            if (activeId) {
                result = await supabase.from('hpp_recipes').update(payload).eq('id', activeId).select().single();
            } else {
                result = await supabase.from('hpp_recipes').insert(payload).select().single();
            }
            if (result.error) {
                showToast(lang === 'EN' ? 'Save failed: ' + result.error.message : 'Gagal menyimpan: ' + result.error.message, 'error');
            } else {
                showToast(T.saved, 'success');
                const updated = result.data;
                setActiveId(updated.id);
                setRecipes(prev => {
                    const exists = prev.find(r => r.id === updated.id);
                    return exists ? prev.map(r => r.id === updated.id ? updated : r) : [updated, ...prev];
                });
            }
        } catch (err) {
            console.error(err);
            showToast(lang === 'EN' ? 'System error occurred' : 'Terjadi kesalahan sistem saat menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
        await supabase.from('hpp_recipes').delete().eq('id', id);
        setRecipes(prev => prev.filter(r => r.id !== id));
        if (activeId === id) { setActiveId(null); setRecipe(emptyRecipe()); }
        showToast(lang === 'EN' ? 'Deleted' : 'Dihapus', 'info');
    };

    const handleLoadRecipe = (r) => {
        setActiveId(r.id);
        setRecipe({
            productName: r.product_name,
            sellingPrice: r.selling_price || 0,
            materials: r.components?.materials || [],
            wages: r.components?.wages || [],
            rents: r.components?.rents || [],
            utilities: r.components?.utilities || [],
            misc: r.components?.misc || [],
            marketplaceFee: r.components?.marketplaceFee || 0,
            productTax: r.components?.productTax || 0,
            // support both old platformFee key and new split keys
            platformFeeFixed: r.components?.platformFeeFixed ?? r.components?.platformFee ?? 0,
            platformFeeCurrency: r.components?.platformFeeCurrency || 'Rp',
            platformFeePct: r.components?.platformFeePct || 0,
        });
    };

    const handleNewRecipe = () => { setActiveId(null); setRecipe(emptyRecipe()); };

    // ── Mutations ──────────────────────────────────────────────────────────────
    const updField = (field, val) => setRecipe(r => ({ ...r, [field]: val }));

    const addMaterial = () => setRecipe(r => ({ ...r, materials: [...r.materials, emptyMaterial()] }));
    const updMaterial = (id, key, val) => setRecipe(r => ({ ...r, materials: r.materials.map(m => m.id === id ? { ...m, [key]: val } : m) }));
    const delMaterial = (id) => setRecipe(r => ({ ...r, materials: r.materials.filter(m => m.id !== id) }));

    const addWage = () => setRecipe(r => ({ ...r, wages: [...r.wages, emptyWage()] }));
    const updWage = (id, key, val) => setRecipe(r => ({ ...r, wages: r.wages.map(w => w.id === id ? { ...w, [key]: val } : w) }));
    const delWage = (id) => setRecipe(r => ({ ...r, wages: r.wages.filter(w => w.id !== id) }));

    const addRent = () => setRecipe(r => ({ ...r, rents: [...r.rents, emptyRent()] }));
    const updRent = (id, key, val) => setRecipe(r => ({ ...r, rents: r.rents.map(x => x.id === id ? { ...x, [key]: val } : x) }));
    const delRent = (id) => setRecipe(r => ({ ...r, rents: r.rents.filter(x => x.id !== id) }));

    const addUtility = () => setRecipe(r => ({ ...r, utilities: [...r.utilities, emptyUtility()] }));
    const updUtility = (id, key, val) => setRecipe(r => ({ ...r, utilities: r.utilities.map(x => x.id === id ? { ...x, [key]: val } : x) }));
    const delUtility = (id) => setRecipe(r => ({ ...r, utilities: r.utilities.filter(x => x.id !== id) }));

    const addMisc = () => setRecipe(r => ({ ...r, misc: [...r.misc, emptyMisc()] }));
    const updMisc = (id, key, val) => setRecipe(r => ({ ...r, misc: r.misc.map(x => x.id === id ? { ...x, [key]: val } : x) }));
    const delMisc = (id) => setRecipe(r => ({ ...r, misc: r.misc.filter(x => x.id !== id) }));

    const toggleSection = (key) => setSections(s => ({ ...s, [key]: !s[key] }));

    // ── Totals ─────────────────────────────────────────────────────────────────
    const totalMaterials = recipe.materials.reduce((s, m) => s + calcMaterialCost(m), 0);
    const totalWages = recipe.wages.reduce((s, w) => s + calcWageCost(w), 0);
    const totalRents = recipe.rents.reduce((s, r) => s + calcRentCost(r), 0);
    const totalUtils = recipe.utilities.reduce((s, u) => s + calcUtilityCost(u), 0);
    const totalMisc = recipe.misc.reduce((s, m) => s + (Number(m.amountPerUnit) || 0), 0);
    const baseHPP = totalMaterials + totalWages + totalRents + totalUtils + totalMisc;
    // Platform costs: percentage fees applied on baseHPP + fixed nominal
    const mktFeeAmt = baseHPP * (Number(recipe.marketplaceFee) || 0) / 100;
    const taxAmt = baseHPP * (Number(recipe.productTax) || 0) / 100;
    const pctFeeAmt = baseHPP * (Number(recipe.platformFeePct) || 0) / 100;
    // Fixed fee: if $ convert at ~15500 proxy rate for display only — actual stored in original currency
    const fixedPlatformFee = Number(recipe.platformFeeFixed) || 0;
    const fixedPlatformFeeRp = recipe.platformFeeCurrency === '$' ? fixedPlatformFee * 15500 : fixedPlatformFee;
    const totalPlatform = mktFeeAmt + taxAmt + pctFeeAmt + fixedPlatformFeeRp;
    const totalHPP = baseHPP + totalPlatform;
    const effSellingPrice = Number(recipe.sellingPrice) || 0;
    const marginRp = effSellingPrice - totalHPP;
    const marginPct = totalHPP > 0 ? (marginRp / totalHPP) * 100 : 0;

    // ── Input helpers ──────────────────────────────────────────────────────────
    const inputSt = {
        background: inp, color: text, border: `1px solid ${inpBorder}`,
        borderRadius: 8, padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
    };
    const labelSt = { fontSize: 11, fontWeight: 700, color: sub, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' };
    const pctBar = (pct, color) => (
        <div style={{ height: 6, background: dark ? '#334155' : '#E2E8F0', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 3, transition: 'width 400ms' }} />
        </div>
    );

    const marginColor = marginPct < 0 ? '#EF4444' : marginPct < 30 ? '#F59E0B' : '#10B981';

    return (
        <div className="page-enter" style={{ padding: '16px', maxWidth: 1300, margin: '0 auto' }}>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>🧮</span>
                        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: text }}>{T.title}</h1>
                        <span style={{ fontSize: 10, fontWeight: 800, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', borderRadius: 4, padding: '2px 8px' }}>ULTIMATE</span>
                    </div>
                    <p style={{ margin: 0, color: sub, fontSize: 13 }}>{T.subtitle}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={handleNewRecipe} style={{ padding: '9px 14px', background: '#F1F5F9', color: '#1E293B', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                        {T.newProduct}
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '9px 14px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Save size={14} /> {saving ? '...' : T.saveProduct}
                    </button>
                </div>
            </div>

            {/* ── RESPONSIVE GRID ──────────────────────────────────────────── */}
            {/* Mobile: stacked, Tablet: 2-col, Desktop: 3-col */}
            <div className="hpp-layout">

                {/* ── LEFT: Product list ─────────────────────────────────── */}
                <div className="hpp-saved" style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: 16 }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 13, color: text }}>
                        {lang === 'EN' ? 'Saved Products' : 'Produk Tersimpan'}
                    </p>
                    {loading ? (
                        <p style={{ color: sub, fontSize: 12 }}>{lang === 'EN' ? 'Loading...' : 'Memuat...'}</p>
                    ) : recipes.length === 0 ? (
                        <p style={{ color: sub, fontSize: 12, lineHeight: 1.5 }}>{T.noProducts}</p>
                    ) : recipes.map(r => (
                        <div
                            key={r.id}
                            onClick={() => handleLoadRecipe(r)}
                            style={{
                                padding: '10px 12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                                background: activeId === r.id ? '#EDE9FE' : dark ? '#334155' : '#F8FAFC',
                                border: `1px solid ${activeId === r.id ? '#7C3AED' : 'transparent'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: activeId === r.id ? '#7C3AED' : text }}>{r.product_name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: sub }}>HPP: {formatIDR(r.total_hpp)}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}
                            ><Trash2 size={13} /></button>
                        </div>
                    ))}
                </div>

                {/* ── MIDDLE: Form sections ───────────────────────────────── */}
                <div className="hpp-form">
                    {/* Product name + selling price */}
                    <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: 20, marginBottom: 16 }}>
                        <div className="hpp-name-price">
                            <div>
                                <label style={labelSt}>{T.productName}</label>
                                <input style={inputSt} value={recipe.productName} onChange={e => updField('productName', e.target.value)} placeholder={lang === 'EN' ? 'e.g. Croissant' : 'misal: Croissant'} />
                            </div>
                            <div>
                                <label style={labelSt}>{T.sellingPrice}</label>
                                <input type="number" min="0" style={inputSt} value={recipe.sellingPrice || ''} onChange={e => updField('sellingPrice', e.target.value)} placeholder="0" />
                            </div>
                        </div>
                    </div>


                    {/* Materials */}
                    <SectionCard title={T.rawMaterials} icon={Package} color="#10B981" count={recipe.materials.length} open={sections.materials} onToggle={() => toggleSection('materials')}>
                        {recipe.materials.map((m, i) => (
                            <div key={m.id} style={{ background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>{lang === 'EN' ? 'Material' : 'Bahan'} #{i + 1}</span>
                                    <button onClick={() => delMaterial(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: 10, marginBottom: 10 }}>
                                    <div><label style={labelSt}>{T.materialName}</label>
                                        <input style={inputSt} value={m.name} onChange={e => updMaterial(m.id, 'name', e.target.value)} placeholder={lang === 'EN' ? 'Flour, Sugar...' : 'Tepung, Gula...'} />
                                    </div>
                                    <div><label style={labelSt}>{T.buyQty}</label>
                                        <input type="number" min="0" step="0.01" style={inputSt} value={m.buyQty || ''} onChange={e => updMaterial(m.id, 'buyQty', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{T.buyUnit}</label>
                                        <select style={inputSt} value={m.buyUnit} onChange={e => updMaterial(m.id, 'buyUnit', e.target.value)}>
                                            {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div><label style={labelSt}>{T.buyPrice}</label>
                                        <input type="number" min="0" style={inputSt} value={m.buyPrice || ''} onChange={e => updMaterial(m.id, 'buyPrice', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                                    <div><label style={labelSt}>{T.useQty}</label>
                                        <input type="number" min="0" step="0.01" style={inputSt} value={m.useQty || ''} onChange={e => updMaterial(m.id, 'useQty', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{T.useUnit}</label>
                                        <select style={inputSt} value={m.useUnit} onChange={e => updMaterial(m.id, 'useUnit', e.target.value)}>
                                            {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ background: '#10B98122', border: '1px solid #10B98144', borderRadius: 8, padding: '7px 14px', flex: 1, textAlign: 'right' }}>
                                            <span style={{ fontSize: 11, color: sub }}>{T.costPerUnit}: </span>
                                            <span style={{ fontWeight: 800, color: '#10B981', fontSize: 13 }}>{formatIDR(Math.round(calcMaterialCost(m)))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addMaterial} style={{ width: '100%', padding: '9px', background: '#10B98111', color: '#10B981', border: '1px dashed #10B981', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {T.addItem}</button>
                    </SectionCard>

                    {/* Staff Wages */}
                    <SectionCard title={T.staffWages} icon={Users} color="#3B82F6" count={recipe.wages.length} open={sections.wages} onToggle={() => toggleSection('wages')}>
                        {recipe.wages.map((w, i) => (
                            <div key={w.id} style={{ background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>{lang === 'EN' ? 'Staff' : 'Karyawan'} #{i + 1}</span>
                                    <button onClick={() => delWage(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <div><label style={labelSt}>{T.wageName}</label>
                                        <input style={inputSt} value={w.name} onChange={e => updWage(w.id, 'name', e.target.value)} placeholder={lang === 'EN' ? 'Baker, Chef...' : 'Pembuat, Chef...'} />
                                    </div>
                                    <div><label style={labelSt}>{T.wageType}</label>
                                        <select style={inputSt} value={w.type} onChange={e => updWage(w.id, 'type', e.target.value)}>
                                            <option value="monthly">{T.monthly}</option>
                                            <option value="daily">{T.daily}</option>
                                            <option value="hourly">{T.hourly}</option>
                                        </select>
                                    </div>
                                    <div><label style={labelSt}>{T.salary}</label>
                                        <input type="number" min="0" style={inputSt} value={w.salary || ''} onChange={e => updWage(w.id, 'salary', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                                    <div><label style={labelSt}>{T.mealAllowance}</label>
                                        <input type="number" min="0" style={inputSt} value={w.mealAllowance || ''} onChange={e => updWage(w.id, 'mealAllowance', Number(e.target.value))} />
                                    </div>
                                    {w.type === 'monthly' && <div><label style={labelSt}>{T.workDays}</label>
                                        <input type="number" min="1" style={inputSt} value={w.workDays || 26} onChange={e => updWage(w.id, 'workDays', Number(e.target.value))} />
                                    </div>}
                                    <div><label style={labelSt}>{T.productionPerDay}</label>
                                        <input type="number" min="1" style={inputSt} value={w.productionPerDay || ''} onChange={e => updWage(w.id, 'productionPerDay', Number(e.target.value))} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ background: '#3B82F622', border: '1px solid #3B82F644', borderRadius: 8, padding: '7px 14px', flex: 1, textAlign: 'right' }}>
                                            <span style={{ fontSize: 11, color: sub }}>{T.costPerUnit}: </span>
                                            <span style={{ fontWeight: 800, color: '#3B82F6', fontSize: 13 }}>{formatIDR(Math.round(calcWageCost(w)))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addWage} style={{ width: '100%', padding: '9px', background: '#3B82F611', color: '#3B82F6', border: '1px dashed #3B82F6', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {T.addItem}</button>
                    </SectionCard>

                    {/* Rent */}
                    <SectionCard title={T.rentUtils} icon={Building2} color="#F59E0B" count={recipe.rents.length} open={sections.rents} onToggle={() => toggleSection('rents')}>
                        {recipe.rents.map((r, i) => (
                            <div key={r.id} style={{ background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{lang === 'EN' ? 'Rent' : 'Sewa'} #{i + 1}</span>
                                    <button onClick={() => delRent(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <div><label style={labelSt}>{T.rentName}</label>
                                        <input style={inputSt} value={r.name} onChange={e => updRent(r.id, 'name', e.target.value)} placeholder={lang === 'EN' ? 'Shop rent, Equipment...' : 'Sewa ruko, Alat...'} />
                                    </div>
                                    <div><label style={labelSt}>{T.rentType}</label>
                                        <select style={inputSt} value={r.type} onChange={e => updRent(r.id, 'type', e.target.value)}>
                                            <option value="annual">{T.annual}</option>
                                            <option value="monthly">{T.monthly}</option>
                                        </select>
                                    </div>
                                    <div><label style={labelSt}>{T.rentAmount}</label>
                                        <input type="number" min="0" style={inputSt} value={r.amount || ''} onChange={e => updRent(r.id, 'amount', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <div><label style={labelSt}>{T.opDays}</label>
                                        <input type="number" min="1" style={inputSt} value={r.operationalDays || 26} onChange={e => updRent(r.id, 'operationalDays', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{T.productionPerDay}</label>
                                        <input type="number" min="1" style={inputSt} value={r.productionPerDay || ''} onChange={e => updRent(r.id, 'productionPerDay', Number(e.target.value))} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ background: '#F59E0B22', border: '1px solid #F59E0B44', borderRadius: 8, padding: '7px 14px', flex: 1, textAlign: 'right' }}>
                                            <span style={{ fontSize: 11, color: sub }}>{T.costPerUnit}: </span>
                                            <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: 13 }}>{formatIDR(Math.round(calcRentCost(r)))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addRent} style={{ width: '100%', padding: '9px', background: '#F59E0B11', color: '#F59E0B', border: '1px dashed #F59E0B', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {T.addItem}</button>
                    </SectionCard>

                    {/* Utilities */}
                    <SectionCard title={T.utilities} icon={Zap} color="#8B5CF6" count={recipe.utilities.length} open={sections.utilities} onToggle={() => toggleSection('utilities')}>
                        {recipe.utilities.map((u, i) => (
                            <div key={u.id} style={{ background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6' }}>{lang === 'EN' ? 'Utility' : 'Utilitas'} #{i + 1}</span>
                                    <button onClick={() => delUtility(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
                                    <div><label style={labelSt}>{T.utilityName}</label>
                                        <input style={inputSt} value={u.name} onChange={e => updUtility(u.id, 'name', e.target.value)} placeholder={lang === 'EN' ? 'Electricity, Gas, Water...' : 'Listrik, Gas, Air...'} />
                                    </div>
                                    <div><label style={labelSt}>{T.monthlyAmount}</label>
                                        <input type="number" min="0" style={inputSt} value={u.monthlyAmount || ''} onChange={e => updUtility(u.id, 'monthlyAmount', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{T.opDays}</label>
                                        <input type="number" min="1" style={inputSt} value={u.operationalDays || 26} onChange={e => updUtility(u.id, 'operationalDays', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{T.productionPerDay}</label>
                                        <input type="number" min="1" style={inputSt} value={u.productionPerDay || ''} onChange={e => updUtility(u.id, 'productionPerDay', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: 8 }}>
                                    <div style={{ display: 'inline-block', background: '#8B5CF622', border: '1px solid #8B5CF644', borderRadius: 8, padding: '5px 12px' }}>
                                        <span style={{ fontSize: 11, color: sub }}>{T.costPerUnit}: </span>
                                        <span style={{ fontWeight: 800, color: '#8B5CF6', fontSize: 13 }}>{formatIDR(Math.round(calcUtilityCost(u)))}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addUtility} style={{ width: '100%', padding: '9px', background: '#8B5CF611', color: '#8B5CF6', border: '1px dashed #8B5CF6', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {T.addItem}</button>
                    </SectionCard>

                    {/* Misc */}
                    <SectionCard title={T.misc} icon={MoreHorizontal} color="#64748B" count={recipe.misc.length} open={sections.misc} onToggle={() => toggleSection('misc')}>
                        {recipe.misc.map((m, i) => (
                            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr auto', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
                                <div><label style={labelSt}>{T.miscName}</label>
                                    <input style={inputSt} value={m.name} onChange={e => updMisc(m.id, 'name', e.target.value)} placeholder={lang === 'EN' ? 'Packaging, Label...' : 'Kemasan, Label...'} />
                                </div>
                                <div><label style={labelSt}>{T.amountPerUnit}</label>
                                    <input type="number" min="0" style={inputSt} value={m.amountPerUnit || ''} onChange={e => updMisc(m.id, 'amountPerUnit', Number(e.target.value))} />
                                </div>
                                <button onClick={() => delMisc(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', paddingBottom: 8 }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                        <button onClick={addMisc} style={{ width: '100%', padding: '9px', background: '#64748B11', color: '#64748B', border: '1px dashed #64748B', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {T.addItem}</button>
                    </SectionCard>

                    {/* ── Platform / Marketplace Costs ─────────────────────── */}
                    <div style={{ borderRadius: 14, border: '1px solid #F4366244', overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#F4366211' }}>
                            <ShoppingBag size={18} color="#F43662" />
                            <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#F43662' }}>🛒 {T.platform}</span>
                            {totalPlatform > 0 && <span style={{ fontSize: 11, background: '#F43662', color: 'white', borderRadius: 20, padding: '2px 8px' }}>{formatIDR(Math.round(totalPlatform))}</span>}
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                            <div className="hpp-platform-grid">
                                {/* Marketplace Fee % */}
                                <div>
                                    <label style={labelSt}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Percent size={11} /> {T.marketplaceFee}
                                        </span>
                                    </label>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, color: sub }}>{T.marketplaceFeeHint}</p>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number" min="0" max="100" step="0.1"
                                            style={{ ...inputSt, paddingRight: 32 }}
                                            value={recipe.marketplaceFee || ''}
                                            onChange={e => updField('marketplaceFee', e.target.value)}
                                            placeholder="0"
                                        />
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: sub, pointerEvents: 'none' }}>%</span>
                                    </div>
                                    {Number(recipe.marketplaceFee) > 0 && (
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#F43662', fontWeight: 700 }}>= {formatIDR(Math.round(mktFeeAmt))}</p>
                                    )}
                                </div>

                                {/* Product Tax % */}
                                <div>
                                    <label style={labelSt}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Percent size={11} /> {T.productTax}
                                        </span>
                                    </label>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, color: sub }}>{T.productTaxHint}</p>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number" min="0" max="100" step="0.1"
                                            style={{ ...inputSt, paddingRight: 32 }}
                                            value={recipe.productTax || ''}
                                            onChange={e => updField('productTax', e.target.value)}
                                            placeholder="0"
                                        />
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: sub, pointerEvents: 'none' }}>%</span>
                                    </div>
                                    {Number(recipe.productTax) > 0 && (
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#F43662', fontWeight: 700 }}>= {formatIDR(Math.round(taxAmt))}</p>
                                    )}
                                </div>

                                {/* Fixed Platform Fee — with currency dropdown */}
                                <div>
                                    <label style={labelSt}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <DollarSign size={11} /> {T.platformFeeFixed}
                                        </span>
                                    </label>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, color: sub }}>{T.platformFeeFixedHint}</p>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select
                                            style={{ ...inputSt, width: 64, flexShrink: 0, paddingLeft: 6, paddingRight: 6 }}
                                            value={recipe.platformFeeCurrency || 'Rp'}
                                            onChange={e => updField('platformFeeCurrency', e.target.value)}
                                        >
                                            <option value="Rp">Rp</option>
                                            <option value="$">$</option>
                                        </select>
                                        <input
                                            type="number" min="0"
                                            style={inputSt}
                                            value={recipe.platformFeeFixed || ''}
                                            onChange={e => updField('platformFeeFixed', e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    {Number(recipe.platformFeeFixed) > 0 && (
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#F43662', fontWeight: 700 }}>
                                            = {formatIDR(Math.round(fixedPlatformFeeRp))}
                                            {recipe.platformFeeCurrency === '$' && <span style={{ color: sub }}> (~15.500/USD)</span>}
                                        </p>
                                    )}
                                </div>

                                {/* Additional Percentage Fee */}
                                <div>
                                    <label style={labelSt}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Percent size={11} /> {T.platformFeePct}
                                        </span>
                                    </label>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, color: sub }}>{T.platformFeePctHint}</p>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number" min="0" max="100" step="0.1"
                                            style={{ ...inputSt, paddingRight: 32 }}
                                            value={recipe.platformFeePct || ''}
                                            onChange={e => updField('platformFeePct', e.target.value)}
                                            placeholder="0"
                                        />
                                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: sub, pointerEvents: 'none' }}>%</span>
                                    </div>
                                    {Number(recipe.platformFeePct) > 0 && (
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#F43662', fontWeight: 700 }}>= {formatIDR(Math.round(pctFeeAmt))}</p>
                                    )}
                                </div>
                            </div>

                            {/* Platform cost summary */}
                            {totalPlatform > 0 && (
                                <div style={{ marginTop: 12, padding: '10px 14px', background: '#F4366211', border: '1px solid #F4366233', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: sub }}>{lang === 'EN' ? 'Total Platform Costs/unit' : 'Total Biaya Platform/unit'}</span>
                                    <span style={{ fontWeight: 800, color: '#F43662', fontSize: 14 }}>{formatIDR(Math.round(totalPlatform))}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Summary & Recommendation ───────────────────── */}
                <div className="hpp-summary">
                    <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: 20 }}>
                        <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 15, color: text }}>📊 {T.summary}</h3>

                        {/* Breakdown bars */}
                        {[
                            { label: T.rawMaterials, amount: totalMaterials, color: '#10B981' },
                            { label: T.staffWages, amount: totalWages, color: '#3B82F6' },
                            { label: T.rentUtils, amount: totalRents, color: '#F59E0B' },
                            { label: T.utilities, amount: totalUtils, color: '#8B5CF6' },
                            { label: T.misc, amount: totalMisc, color: '#64748B' },
                            { label: T.platform, amount: totalPlatform, color: '#F43662' },
                        ].filter(r => r.amount > 0 || r.label === T.rawMaterials).map(({ label, amount, color }) => (
                            <div key={label} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: sub }}>{label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{formatIDR(Math.round(amount))}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {pctBar(totalHPP > 0 ? (amount / totalHPP) * 100 : 0, color)}
                                    <span style={{ fontSize: 10, color: sub, minWidth: 30 }}>
                                        {totalHPP > 0 ? Math.round((amount / totalHPP) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Total HPP */}
                        <div style={{ borderTop: `2px solid ${border}`, paddingTop: 14, marginTop: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontWeight: 800, color: text, fontSize: 14 }}>{T.totalHPP}</span>
                                <span style={{ fontWeight: 900, fontSize: 18, color: text }}>{formatIDR(Math.round(totalHPP))}</span>
                            </div>

                            {/* Custom Price Simulation */}
                            <div style={{ background: dark ? '#334155' : '#F8FAFC', border: `1px solid ${border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: text }}>💡 {T.customPriceTest}</p>
                                <input
                                    type="number"
                                    min="0"
                                    style={{ ...inputSt, marginBottom: 10 }}
                                    value={recipe.sellingPrice || ''}
                                    onChange={e => updField('sellingPrice', e.target.value)}
                                    placeholder="0"
                                />
                                {effSellingPrice > 0 && (
                                    <div style={{ background: `${marginColor}15`, border: `1px solid ${marginColor}33`, borderRadius: 8, padding: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: sub, fontWeight: 700 }}>{T.margin}</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: 900, fontSize: 16, color: marginColor, display: 'block' }}>
                                                    {marginPct.toFixed(1)}%
                                                </span>
                                                <span style={{ fontSize: 12, color: marginColor, fontWeight: 700 }}>
                                                    {formatIDR(Math.round(marginRp))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recommendations */}
                            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{T.recommendation}</p>
                            {[
                                { label: T.minimum, multiplier: 1.3, color: '#F59E0B', emoji: '⚠️' },
                                { label: T.ideal, multiplier: 1.5, color: '#10B981', emoji: '✅' },
                                { label: T.premium, multiplier: 2.0, color: '#7C3AED', emoji: '👑' },
                            ].map(({ label, multiplier, color, emoji }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: dark ? '#334155' : '#F8FAFC', border: `1px solid ${border}` }}>
                                    <span style={{ fontSize: 12, color: sub }}>{emoji} {label}</span>
                                    <span style={{ fontWeight: 800, color, fontSize: 13 }}>{formatIDR(Math.round(totalHPP * multiplier))}</span>
                                </div>
                            ))}

                            {/* Export PDF */}
                            <button
                                onClick={async () => {
                                    try {
                                        await generatePDF('hpp-summary-print', `HPP-${recipe.productName || 'product'}.pdf`, true);
                                        showToast('PDF exported', 'success');
                                    } catch { showToast('Export failed', 'error'); }
                                }}
                                style={{ width: '100%', marginTop: 14, padding: '10px', background: 'linear-gradient(135deg, #1E293B, #334155)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                <Download size={14} /> {T.savePDF}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden print area for PDF */}
            <div id="hpp-summary-print" style={{ position: 'fixed', left: '-9999px', top: 0, width: 800, background: 'white', color: '#000', zIndex: -1 }}>
                <div style={{ padding: 40, fontFamily: 'Arial', maxWidth: 800 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 900 }}>HPP: {recipe.productName}</h1>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20, fontSize: 13 }}>
                        <thead><tr style={{ background: '#F8FAFC' }}>
                            <th style={{ textAlign: 'left', padding: 8, border: '1px solid #E2E8F0' }}>Komponen</th>
                            <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>Biaya/unit</th>
                            <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>%</th>
                        </tr></thead>
                        <tbody>
                            {[
                                { label: T.rawMaterials, amount: totalMaterials },
                                { label: T.staffWages, amount: totalWages },
                                { label: T.rentUtils, amount: totalRents },
                                { label: T.utilities, amount: totalUtils },
                                { label: T.misc, amount: totalMisc },
                                { label: T.platform, amount: totalPlatform },
                            ].map(({ label, amount }) => (
                                <tr key={label}><td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{label}</td>
                                    <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{formatIDR(Math.round(amount))}</td>
                                    <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{totalHPP > 0 ? Math.round((amount / totalHPP) * 100) : 0}%</td>
                                </tr>
                            ))}
                            <tr style={{ background: '#F8FAFC', fontWeight: 900 }}>
                                <td style={{ padding: 8, border: '1px solid #E2E8F0' }}>TOTAL HPP AKHIR</td>
                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{formatIDR(Math.round(totalHPP))}</td>
                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>100%</td>
                            </tr>
                        </tbody>
                    </table>

                    {recipe.materials && recipe.materials.filter(m => m.name).length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#1E293B', fontWeight: 800 }}>{lang === 'EN' ? 'Raw Materials Detail' : 'Rincian Bahan Baku'}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ textAlign: 'left', padding: 8, border: '1px solid #E2E8F0' }}>Nama Bahan</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>Pembelian</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>Pemakaian</th>
                                        <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>Total Biaya</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipe.materials.filter(m => m.name).map((m, idx) => {
                                        const cost = calcMaterialCost(m);
                                        return (
                                            <tr key={idx}>
                                                <td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{m.name}</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{m.buyQty} {m.buyUnit} ({formatIDR(m.buyPrice)})</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{m.useQty} {m.useUnit}</td>
                                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0', fontWeight: 'bold' }}>{formatIDR(Math.round(cost))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: 24 }}>
                        <h3>Rekomendasi Harga Jual</h3>

                        <p>Minimum (30%): <strong>{formatIDR(Math.round(totalHPP * 1.3))}</strong></p>
                        <p>Ideal (50%): <strong>{formatIDR(Math.round(totalHPP * 1.5))}</strong></p>
                        <p>Premium (100%): <strong>{formatIDR(Math.round(totalHPP * 2))}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
