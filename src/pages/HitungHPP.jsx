import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Save, ChevronDown, ChevronRight, Package, Users, Building2, Zap, MoreHorizontal, ShoppingBag, Percent, DollarSign } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import { generatePDF } from '../utils/pdf';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { usePlan } from '../context/PlanContext';
import { useStore } from '../store/useStore';

// ── Unit conversion maps ──────────────────────────────────────────────────────
const UNIT_GROUPS = (t) => [
    { label: t('po_unit'), units: [t('unit_pcs'), 'unit', 'set', 'pack', t('unit_box'), t('hpp_unit_dozen'), t('hpp_unit_score'), t('hpp_unit_gross'), t('hpp_unit_rim')] },
    { label: t('hpp_unit_mass'), units: ['gr', 'kg', 'oz', 'lb'] },
    { label: t('hpp_unit_volume'), units: ['ml', 'L', 'tsp', 'tbsp', 'cup'] },
    { label: t('hpp_unit_length'), units: ['mm', 'cm', 'm', 'in', 'ft'] },
];

const ALL_UNITS = [
    'pcs', 'unit', 'set', 'pack', 'box', 'lusin', 'kodi', 'gross', 'rim',
    'gr', 'kg', 'oz', 'lb',
    'ml', 'L', 'tsp', 'tbsp', 'cup',
    'mm', 'cm', 'm', 'in', 'ft'
];


// ── ID generators ──────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Empty entry factories ──────────────────────────────────────────────────────
const emptyMaterial = () => ({
    id: uid(), name: '',
    buyQty: 1, buyUnit: 'kg', buyPrice: 0, buyUnitContent: 1,
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
    // Biaya per Bahan = (Harga Beli per Unit / Isi per Unit Beli) * Jumlah yang Dipakai
    const buyQty = Number(m.buyQty) || 1;
    const content = Number(m.buyUnitContent) || 1;
    const costPerBuyBase = (m.buyPrice / buyQty) / content;
    return costPerBuyBase * m.useQty;
};

const calcWageCost = (w) => {
    let dailyTotal = 0;
    const workDays = Number(w.workDays) || 26;
    const prod = Number(w.productionPerDay) || 1;
    if (w.type === 'monthly') {
        dailyTotal = ((Number(w.salary) || 0) / workDays) + (Number(w.mealAllowance) || 0);
    } else if (w.type === 'daily') {
        dailyTotal = (Number(w.salary) || 0) + (Number(w.mealAllowance) || 0);
    } else { // hourly
        dailyTotal = (Number(w.salary) || 0) * 8 + (Number(w.mealAllowance) || 0);
    }
    return dailyTotal / prod;
};

const calcRentCost = (r) => {
    const amount = Number(r.amount) || 0;
    const opDays = Number(r.operationalDays) || 26;
    const prod = Number(r.productionPerDay) || 1;
    const monthly = r.type === 'annual' ? amount / 12 : amount;
    const daily = monthly / opDays;
    return daily / prod;
};

const calcUtilityCost = (u) => {
    const amount = Number(u.monthlyAmount) || 0;
    const opDays = Number(u.operationalDays) || 26;
    const prod = Number(u.productionPerDay) || 1;
    const daily = amount / opDays;
    return daily / prod;
};

// ── Per-plan guard component ───────────────────────────────────────────────────
function UpgradePrompt({ dark }) {
    const { t } = useLang();
    return (
        <div style={{ padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🧮</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B', marginBottom: 8 }}>
                {t('hpp_upgrade_title')}
            </h2>
            <p style={{ color: dark ? '#94A3B8' : '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                {t('hpp_upgrade_desc')}<br />
                {t('hpp_upgrade_unlock')}
            </p>
            <button
                onClick={() => window.location.href = 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan-7spr'}
                style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}
            >
                {t('hpp_upgrade_btn')} — Rp 149.000/{t('unit_bulan')}
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

// ── Progress Bar Helper ────────────────────────────────────────────────────────
const pctBar = (percent, color) => (
    <div style={{ flex: 1, height: 6, background: `${color}22`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, percent)}%`, background: color, borderRadius: 10, transition: 'width 1s ease' }} />
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function HitungHPP() {
    const { dark } = useTheme();
    const { showToast } = useToast();
    const { lang, t } = useLang();
    const { effectivePlan, isAdmin, user } = useAuth();
    const { checkDownloadLimit, incrementDownload, isPremium } = usePlan();

    const [recipes, setRecipes] = useState([]);
    const [activeId, setActiveId] = useState(null);
    // Persistent draft — survives navigation between pages
    const { hppDraftRecipe: recipe, setHppDraftRecipe: setRecipe } = useStore();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState({ materials: true, wages: false, rents: false, utilities: false, misc: false });

    // ── Theme colors ──────────────────────────────────────────────────────────
    const bg = dark ? '#0F172A' : '#F8FAFC';
    const card = dark ? '#1E293B' : '#FFFFFF';
    const border = dark ? '#334155' : '#E2E8F0';
    const text = dark ? '#F1F5F9' : '#1E293B';
    const sub = dark ? '#94A3B8' : '#64748B';
    const inp = dark ? '#1E293B' : '#FFFFFF';
    const inpBorder = dark ? '#475569' : '#CBD5E1';

    // ── Supabase CRUD ──────────────────────────────────────────────────────────
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
        if (!recipe.productName.trim()) { showToast(t('hpp_toast_name_required'), 'error'); return; }
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
                showToast(t('hpp_toast_save_failed') + result.error.message, 'error');
            } else {
                showToast(t('doc_saved'), 'success');
                const updated = result.data;
                setActiveId(updated.id);
                setRecipes(prev => {
                    const exists = prev.find(r => r.id === updated.id);
                    return exists ? prev.map(r => r.id === updated.id ? updated : r) : [updated, ...prev];
                });
            }
        } catch (err) {
            console.error(err);
            showToast(t('hpp_toast_system_error'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('hpp_delete_confirm'))) return;
        await supabase.from('hpp_recipes').delete().eq('id', id);
        setRecipes(prev => prev.filter(r => r.id !== id));
        if (activeId === id) { setActiveId(null); setRecipe(emptyRecipe()); }
        showToast(t('doc_deleted'), 'info');
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
            platformFeeFixed: r.components?.platformFeeFixed ?? r.components?.platformFee ?? 0,
            platformFeeCurrency: r.components?.platformFeeCurrency || 'Rp',
            platformFeePct: r.components?.platformFeePct || 0,
        });
    };

    const handleNewRecipe = () => { setActiveId(null); setRecipe(emptyRecipe()); };

    // ── Mutations ──────────────────────────────────────────────────────────────
    const updField = (field, val) => setRecipe(r => ({ ...r, [field]: val }));

    const addMaterial = () => setRecipe(r => ({ ...r, materials: [...(r.materials || []), emptyMaterial()] }));
    const updMaterial = (id, key, val) => setRecipe(r => ({ ...r, materials: (r.materials || []).map(m => m.id === id ? { ...m, [key]: val } : m) }));
    const delMaterial = (id) => setRecipe(r => ({ ...r, materials: (r.materials || []).filter(m => m.id !== id) }));

    const addWage = () => setRecipe(r => ({ ...r, wages: [...(r.wages || []), emptyWage()] }));
    const updWage = (id, key, val) => setRecipe(r => ({ ...r, wages: (r.wages || []).map(w => w.id === id ? { ...w, [key]: val } : w) }));
    const delWage = (id) => setRecipe(r => ({ ...r, wages: (r.wages || []).filter(w => w.id !== id) }));

    const addRent = () => setRecipe(r => ({ ...r, rents: [...(r.rents || []), emptyRent()] }));
    const updRent = (id, key, val) => setRecipe(r => ({ ...r, rents: (r.rents || []).map(x => x.id === id ? { ...x, [key]: val } : x) }));
    const delRent = (id) => setRecipe(r => ({ ...r, rents: (r.rents || []).filter(x => x.id !== id) }));

    const addUtility = () => setRecipe(r => ({ ...r, utilities: [...(r.utilities || []), emptyUtility()] }));
    const updUtility = (id, key, val) => setRecipe(r => ({ ...r, utilities: (r.utilities || []).map(x => x.id === id ? { ...x, [key]: val } : x) }));
    const delUtility = (id) => setRecipe(r => ({ ...r, utilities: (r.utilities || []).filter(x => x.id !== id) }));

    const addMisc = () => setRecipe(r => ({ ...r, misc: [...(r.misc || []), emptyMisc()] }));
    const updMisc = (id, key, val) => setRecipe(r => ({ ...r, misc: (r.misc || []).map(x => x.id === id ? { ...x, [key]: val } : x) }));
    const delMisc = (id) => setRecipe(r => ({ ...r, misc: (r.misc || []).filter(x => x.id !== id) }));

    const toggleSection = (key) => setSections(s => ({ ...s, [key]: !s[key] }));

    // ── Totals ─────────────────────────────────────────────────────────────────
    const totalMaterials = (recipe.materials || []).reduce((s, m) => s + calcMaterialCost(m), 0);
    const totalWages = (recipe.wages || []).reduce((s, w) => s + calcWageCost(w), 0);
    const totalRents = (recipe.rents || []).reduce((s, r) => s + calcRentCost(r), 0);
    const totalUtils = (recipe.utilities || []).reduce((s, u) => s + calcUtilityCost(u), 0);
    const totalMisc = (recipe.misc || []).reduce((s, m) => s + (Number(m.amountPerUnit) || 0), 0);
    const baseHPP = totalMaterials + totalWages + totalRents + totalUtils + totalMisc;
    const mktFeeAmt = baseHPP * (Number(recipe.marketplaceFee) || 0) / 100;
    const taxAmt = baseHPP * (Number(recipe.productTax) || 0) / 100;
    const pctFeeAmt = baseHPP * (Number(recipe.platformFeePct) || 0) / 100;
    const fixedPlatformFee = Number(recipe.platformFeeFixed) || 0;
    const fixedPlatformFeeRp = recipe.platformFeeCurrency === '$' ? fixedPlatformFee * 15500 : fixedPlatformFee;
    const totalPlatform = mktFeeAmt + taxAmt + pctFeeAmt + fixedPlatformFeeRp;
    const totalHPP = baseHPP + totalPlatform;
    const effSellingPrice = Number(recipe.sellingPrice) || 0;
    const marginRp = effSellingPrice - totalHPP;
    const marginPct = totalHPP > 0 ? (marginRp / totalHPP) * 100 : 0;
    const marginColor = marginPct >= 30 ? '#10B981' : (marginPct > 0 ? '#F59E0B' : '#EF4444');

    // ── Input helpers ──────────────────────────────────────────────────────────
    const inputSt = {
        background: inp, color: text, border: `1px solid ${inpBorder}`,
        borderRadius: 8, padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
    };
    const labelSt = { 
        fontSize: 11, 
        fontWeight: 700, 
        color: sub, 
        marginBottom: 4, 
        display: 'flex', 
        alignItems: 'flex-end',
        minHeight: '28px',
        textTransform: 'uppercase', 
        letterSpacing: '0.5px',
        lineHeight: '1.2'
    };

    // ── PLAN GUARD — must be AFTER all hooks ────────────────────────────────
    if (effectivePlan !== 'ultimate' && !isAdmin) {
        return <UpgradePrompt dark={dark} lang={lang} />;
    }

    return (
        <div className="page-enter" style={{ padding: '16px', maxWidth: 1300, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>🧮</span>
                        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: text }}>{t('hpp_title')}</h1>
                        <span style={{ fontSize: 10, fontWeight: 800, background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', borderRadius: 4, padding: '2px 8px' }}>ULTIMATE</span>
                    </div>
                    <p style={{ margin: 0, color: sub, fontSize: 13 }}>{t('hpp_subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={handleNewRecipe} style={{ padding: '9px 14px', background: '#F1F5F9', color: '#1E293B', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={14} /> {t('hpp_new_product')}
                    </button>
                    <button
                        onClick={() => { if (window.confirm(t('hpp_reset_confirm'))) handleNewRecipe(); }}
                        style={{ padding: '9px 14px', background: dark ? '#334155' : '#F1F5F9', color: dark ? '#F1F5F9' : '#1E293B', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        🔄 {t('hpp_reset_form')}
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '9px 14px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Save size={14} /> {saving ? '...' : t('hpp_save_product')}
                    </button>
                </div>
            </div>

            <div className="hpp-layout">
                <div className="hpp-saved" style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: 16 }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 13, color: text }}>
                        {t('hpp_saved_products')}
                    </p>
                    {loading ? (
                        <p style={{ color: sub, fontSize: 12 }}>{t('loading')}</p>
                    ) : (recipes || []).length === 0 ? (
                        <p style={{ color: sub, fontSize: 12, lineHeight: 1.5 }}>{t('hpp_no_products')}</p>
                    ) : (recipes || []).map(r => (
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

                <div className="hpp-form">
                    <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: 20, marginBottom: 16 }}>
                        <div className="hpp-name-price">
                            <div>
                                <label style={labelSt}>{t('hpp_product_name')}</label>
                                <input style={inputSt} value={recipe.productName} onChange={e => updField('productName', e.target.value)} placeholder={t('hpp_name_placeholder')} />
                            </div>
                            <div>
                                <label style={labelSt}>{t('hpp_selling_price')}</label>
                                <input type="number" min="0" style={inputSt} value={recipe.sellingPrice || ''} onChange={e => updField('sellingPrice', e.target.value)} placeholder="0" />
                            </div>
                        </div>
                    </div>

                    <SectionCard title={t('hpp_raw_materials')} icon={Package} color="#10B981" count={(recipe.materials || []).length} open={sections.materials} onToggle={() => toggleSection('materials')}>
                        {(recipe.materials || []).map((m, i) => (
                            <div key={m.id} style={{ background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>{t('hpp_item_material')} #{i + 1}</span>
                                    <button onClick={() => delMaterial(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', columnGap: 16, rowGap: 12, marginBottom: 12 }}>
                                    <div><label style={labelSt}>{t('hpp_material_name') || 'Nama Bahan'}</label>
                                        <input style={inputSt} value={m.name} onChange={e => updMaterial(m.id, 'name', e.target.value)} placeholder={t('hpp_material_placeholder') || 'Nasi/Telur'} />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_buy_qty') || 'Jml Beli'}</label>
                                        <input type="number" min="0" step="0.01" style={inputSt} value={m.buyQty || ''} onChange={e => updMaterial(m.id, 'buyQty', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_buy_unit') || 'Unit'}</label>
                                        <select className="select" style={{ ...inputSt, fontSize: 13 }} value={m.buyUnit} onChange={e => updMaterial(m.id, 'buyUnit', e.target.value)}>
                                            {UNIT_GROUPS(t).map(g => (
                                                <optgroup key={g.label} label={g.label}>
                                                    {g.units.map(u => <option key={u} value={u}>{u}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_buy_content') || 'Isi per Kemasan'}</label>
                                        <input type="number" min="0" step="0.01" style={inputSt} value={m.buyUnitContent || ''} onChange={e => updMaterial(m.id, 'buyUnitContent', Number(e.target.value))} placeholder="1000" />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_buy_price') || 'Total Harga Beli'}</label>
                                        <input type="number" min="0" style={inputSt} value={m.buyPrice || ''} onChange={e => updMaterial(m.id, 'buyPrice', Number(e.target.value))} />
                                    </div>

                                    {/* BARIS 2: Sinkronisasi dengan Baris 1 - Penyeimbang Grid */}
                                    <div style={{ gridColumn: 'span 2' }}></div> 
                                    
                                    <div><label style={labelSt}>{t('hpp_use_unit')}</label>
                                        <select style={inputSt} value={m.useUnit} onChange={e => updMaterial(m.id, 'useUnit', e.target.value)}>
                                            {ALL_UNITS.map(u => <option key={u} value={u}>{t('unit_' + u)}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div><label style={labelSt}>{t('hpp_use_qty')}</label>
                                        <input type="number" min="0" step="0.01" style={inputSt} value={m.useQty || ''} onChange={e => updMaterial(m.id, 'useQty', Number(e.target.value))} />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ background: '#10B98122', border: '1px solid #10B98144', borderRadius: 8, padding: '7px 14px', width: '100%', textAlign: 'right' }}>
                                            <span style={{ fontSize: 11, color: sub }}>{t('hpp_cost_unit')}: </span>
                                            <span style={{ fontWeight: 800, color: '#10B981', fontSize: 13 }}>{formatIDR(Math.round(calcMaterialCost(m)))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addMaterial} style={{ width: '100%', padding: '9px', background: '#10B98111', color: '#10B981', border: '1px dashed #10B981', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {t('hpp_add_item')}</button>
                    </SectionCard>

                    {/* Staff Wages */}
                    <SectionCard title={t('hpp_staff_wages')} icon={Users} color="#3B82F6" count={(recipe.wages || []).length} open={sections.wages} onToggle={() => toggleSection('wages')}>
                        {(recipe.wages || []).map((w, i) => (
                            <div key={w.id} style={{ background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>{t('hpp_item_staff')} #{i + 1}</span>
                                    <button onClick={() => delWage(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <div><label style={labelSt}>{t('hpp_wage_name')}</label>
                                        <input style={inputSt} value={w.name} onChange={e => updWage(w.id, 'name', e.target.value)} placeholder={t('hpp_wage_placeholder')} />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_wage_type')}</label>
                                        <select style={inputSt} value={w.type} onChange={e => updWage(w.id, 'type', e.target.value)}>
                                            <option value="monthly">{t('hpp_monthly')}</option>
                                            <option value="daily">{t('hpp_daily')}</option>
                                            <option value="hourly">{t('hpp_hourly')}</option>
                                        </select>
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_salary')}</label>
                                        <input type="number" min="0" style={inputSt} value={w.salary || ''} onChange={e => updWage(w.id, 'salary', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                                    <div><label style={labelSt}>{t('hpp_meal_allowance')}</label>
                                        <input type="number" min="0" style={inputSt} value={w.mealAllowance || ''} onChange={e => updWage(w.id, 'mealAllowance', Number(e.target.value))} />
                                    </div>
                                    {w.type === 'monthly' && <div><label style={labelSt}>{t('hpp_work_days')}</label>
                                        <input type="number" min="1" style={inputSt} value={w.workDays || 26} onChange={e => updWage(w.id, 'workDays', Number(e.target.value))} />
                                    </div>}
                                    <div><label style={labelSt}>{t('hpp_prod_day')}</label>
                                        <input type="number" min="1" style={inputSt} value={w.productionPerDay || ''} onChange={e => updWage(w.id, 'productionPerDay', Number(e.target.value))} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ background: '#3B82F622', border: '1px solid #3B82F644', borderRadius: 8, padding: '7px 14px', flex: 1, textAlign: 'right' }}>
                                            <span style={{ fontSize: 11, color: sub }}>{t('hpp_cost_unit')}: </span>
                                            <span style={{ fontWeight: 800, color: '#3B82F6', fontSize: 13 }}>{formatIDR(Math.round(calcWageCost(w)))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addWage} style={{ width: '100%', padding: '9px', background: '#3B82F611', color: '#3B82F6', border: '1px dashed #3B82F6', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {t('hpp_add_item')}</button>
                    </SectionCard>

                    {/* Rent */}
                    <SectionCard title={t('hpp_rent_utils')} icon={Building2} color="#F59E0B" count={(recipe.rents || []).length} open={sections.rents} onToggle={() => toggleSection('rents')}>
                        {(recipe.rents || []).map((r, i) => (
                            <div key={r.id} style={{ background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{t('hpp_item_rent')} #{i + 1}</span>
                                    <button onClick={() => delRent(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <div><label style={labelSt}>{t('hpp_rent_name')}</label>
                                        <input style={inputSt} value={r.name} onChange={e => updRent(r.id, 'name', e.target.value)} placeholder={t('hpp_rent_placeholder')} />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_rent_type')}</label>
                                        <select style={inputSt} value={r.type} onChange={e => updRent(r.id, 'type', e.target.value)}>
                                            <option value="annual">{t('hpp_annual')}</option>
                                            <option value="monthly">{t('hpp_monthly')}</option>
                                        </select>
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_rent_amount')}</label>
                                        <input type="number" min="0" style={inputSt} value={r.amount || ''} onChange={e => updRent(r.id, 'amount', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <div><label style={labelSt}>{t('hpp_op_days')}</label>
                                        <input type="number" min="1" style={inputSt} value={r.operationalDays || 26} onChange={e => updRent(r.id, 'operationalDays', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_prod_day')}</label>
                                        <input type="number" min="1" style={inputSt} value={r.productionPerDay || ''} onChange={e => updRent(r.id, 'productionPerDay', Number(e.target.value))} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                        <div style={{ background: '#F59E0B22', border: '1px solid #F59E0B44', borderRadius: 8, padding: '7px 14px', flex: 1, textAlign: 'right' }}>
                                            <span style={{ fontSize: 11, color: sub }}>{t('hpp_cost_unit')}: </span>
                                            <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: 13 }}>{formatIDR(Math.round(calcRentCost(r)))}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addRent} style={{ width: '100%', padding: '9px', background: '#F59E0B11', color: '#F59E0B', border: '1px dashed #F59E0B', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {t('hpp_add_item')}</button>
                    </SectionCard>

                    {/* Utilities */}
                    <SectionCard title={t('hpp_utilities')} icon={Zap} color="#8B5CF6" count={(recipe.utilities || []).length} open={sections.utilities} onToggle={() => toggleSection('utilities')}>
                        {(recipe.utilities || []).map((u, i) => (
                            <div key={u.id} style={{ background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6' }}>{t('hpp_item_utility')} #{i + 1}</span>
                                    <button onClick={() => delUtility(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10 }}>
                                    <div><label style={labelSt}>{t('hpp_utility_name')}</label>
                                        <input style={inputSt} value={u.name} onChange={e => updUtility(u.id, 'name', e.target.value)} placeholder={t('hpp_utility_placeholder')} />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_monthly_amount')}</label>
                                        <input type="number" min="0" style={inputSt} value={u.monthlyAmount || ''} onChange={e => updUtility(u.id, 'monthlyAmount', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_op_days')}</label>
                                        <input type="number" min="1" style={inputSt} value={u.operationalDays || 26} onChange={e => updUtility(u.id, 'operationalDays', Number(e.target.value))} />
                                    </div>
                                    <div><label style={labelSt}>{t('hpp_prod_day')}</label>
                                        <input type="number" min="1" style={inputSt} value={u.productionPerDay || ''} onChange={e => updUtility(u.id, 'productionPerDay', Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: 8 }}>
                                    <div style={{ display: 'inline-block', background: '#8B5CF622', border: '1px solid #8B5CF644', borderRadius: 8, padding: '5px 12px' }}>
                                        <span style={{ fontSize: 11, color: sub }}>{t('hpp_cost_unit')}: </span>
                                        <span style={{ fontWeight: 800, color: '#8B5CF6', fontSize: 13 }}>{formatIDR(Math.round(calcUtilityCost(u)))}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addUtility} style={{ width: '100%', padding: '9px', background: '#8B5CF611', color: '#8B5CF6', border: '1px dashed #8B5CF6', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {t('hpp_add_item')}</button>
                    </SectionCard>

                    {/* Misc */}
                    <SectionCard title={t('hpp_misc')} icon={MoreHorizontal} color="#64748B" count={(recipe.misc || []).length} open={sections.misc} onToggle={() => toggleSection('misc')}>
                        {(recipe.misc || []).map((m, i) => (
                            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr auto', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
                                <div><label style={labelSt}>{t('hpp_misc_name')}</label>
                                    <input style={inputSt} value={m.name} onChange={e => updMisc(m.id, 'name', e.target.value)} placeholder={t('hpp_misc_placeholder')} />
                                </div>
                                <div><label style={labelSt}>{t('hpp_amount_per_unit')}</label>
                                    <input type="number" min="0" style={inputSt} value={m.amountPerUnit || ''} onChange={e => updMisc(m.id, 'amountPerUnit', Number(e.target.value))} />
                                </div>
                                <button onClick={() => delMisc(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', paddingBottom: 8 }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                        <button onClick={addMisc} style={{ width: '100%', padding: '9px', background: '#64748B11', color: '#64748B', border: '1px dashed #64748B', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>+ {t('hpp_add_item')}</button>
                    </SectionCard>

                    {/* ── Platform / Marketplace Costs ─────────────────────── */}
                    <div style={{ borderRadius: 14, border: '1px solid #F4366244', overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#F4366211' }}>
                            <ShoppingBag size={18} color="#F43662" />
                            <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#F43662' }}>🛒 {t('hpp_platform')}</span>
                            {totalPlatform > 0 && <span style={{ fontSize: 11, background: '#F43662', color: 'white', borderRadius: 20, padding: '2px 8px' }}>{formatIDR(Math.round(totalPlatform))}</span>}
                        </div>
                        <div style={{ padding: '16px 20px' }}>
                            <div className="hpp-platform-grid">
                                {/* Marketplace Fee % */}
                                <div>
                                    <label style={labelSt}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Percent size={11} /> {t('hpp_marketplace_fee')}
                                        </span>
                                    </label>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, color: sub }}>{t('hpp_marketplace_fee_hint')}</p>
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
                                            <Percent size={11} /> {t('hpp_product_tax')}
                                        </span>
                                    </label>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, color: sub }}>{t('hpp_product_tax_hint')}</p>
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
                                            <DollarSign size={11} /> {t('hpp_platform_fixed')}
                                        </span>
                                    </label>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, color: sub }}>{t('hpp_platform_fixed_hint')}</p>
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
                                            {recipe.platformFeeCurrency === '$' && <span style={{ color: sub }}> {t('hpp_platform_usd_hint')}</span>}
                                        </p>
                                    )}
                                </div>

                                {/* Additional Percentage Fee */}
                                <div>
                                    <label style={labelSt}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Percent size={11} /> {t('hpp_platform_pct')}
                                        </span>
                                    </label>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, color: sub }}>{t('hpp_platform_pct_hint')}</p>
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
                                    <span style={{ fontSize: 12, color: sub }}>{t('hpp_total_platform_unit')}</span>
                                    <span style={{ fontWeight: 800, color: '#F43662', fontSize: 14 }}>{formatIDR(Math.round(totalPlatform))}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Summary & Recommendation ───────────────────── */}
                <div className="hpp-summary">
                    <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, padding: 20 }}>
                        <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 15, color: text }}>📊 {t('hpp_summary')}</h3>

                        {/* Breakdown bars */}
                        {[
                            { label: t('hpp_raw_materials'), amount: totalMaterials || 0, color: '#10B981' },
                            { label: t('hpp_staff_wages'), amount: totalWages || 0, color: '#3B82F6' },
                            { label: t('hpp_rent_utils'), amount: totalRents || 0, color: '#F59E0B' },
                            { label: t('hpp_utilities'), amount: totalUtils || 0, color: '#8B5CF6' },
                            { label: t('hpp_misc'), amount: totalMisc || 0, color: '#64748B' },
                            { label: t('hpp_platform'), amount: totalPlatform || 0, color: '#F43662' },
                        ].filter(r => (r.amount || 0) > 0 || r.label === t('hpp_raw_materials')).map(({ label, amount, color }) => (
                            <div key={label} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: sub }}>{label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{formatIDR(Math.round(amount || 0))}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {pctBar(totalHPP > 0 ? ((amount || 0) / totalHPP) * 100 : 0, color)}
                                    <span style={{ fontSize: 10, color: sub, minWidth: 30 }}>
                                        {totalHPP > 0 ? Math.round(((amount || 0) / totalHPP) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Total HPP */}
                        <div style={{ borderTop: `2px solid ${border}`, paddingTop: 14, marginTop: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontWeight: 800, color: text, fontSize: 14 }}>{t('hpp_total_hpp')}</span>
                                <span style={{ fontWeight: 900, fontSize: 18, color: text }}>{formatIDR(Math.round(totalHPP))}</span>
                            </div>

                            {/* Custom Price Simulation */}
                            <div style={{ background: dark ? '#334155' : '#F8FAFC', border: `1px solid ${border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: text }}>💡 {t('hpp_custom_price')}</p>
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
                                            <span style={{ fontSize: 12, color: sub, fontWeight: 700 }}>{t('hpp_margin')}</span>
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
                            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('hpp_recommendation')}</p>
                            {[
                                { label: t('hpp_min_label'), multiplier: 1.3, color: '#F59E0B', emoji: '⚠️' },
                                { label: t('hpp_ideal_label'), multiplier: 1.5, color: '#10B981', emoji: '✅' },
                                { label: t('hpp_premium_label'), multiplier: 2.0, color: '#7C3AED', emoji: '' },
                            ].map(({ label, multiplier, color, emoji }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, marginBottom: 6, background: dark ? '#334155' : '#F8FAFC', border: `1px solid ${border}` }}>
                                    <span style={{ fontSize: 12, color: sub }}>{emoji} {label}</span>
                                    <span style={{ fontWeight: 800, color, fontSize: 13 }}>{formatIDR(Math.round(totalHPP * multiplier))}</span>
                                </div>
                            ))}

                            {/* Export PDF */}
                            <button
                                onClick={async () => {
                                    if (!isPremium && !checkDownloadLimit()) {
                                        showToast(t('hpp_toast_download_limit'), 'warning');
                                        return;
                                    }
                                    try {
                                        await generatePDF('hpp-summary-print', `HPP-${recipe.productName || t('nav_produk')}.pdf`, isPremium);
                                        if (!isPremium) {
                                            incrementDownload('hpp', recipe.productName, totalHPP, recipe.productName || '-');
                                        }
                                        showToast(t('hpp_toast_pdf_success'), 'success');
                                    } catch { showToast(t('hpp_toast_pdf_failed'), 'error'); }
                                }}
                                style={{ width: '100%', marginTop: 14, padding: '10px', background: 'linear-gradient(135deg, #1E293B, #334155)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                <Download size={14} /> {t('hpp_save_pdf')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="hpp-summary-print" style={{ position: 'fixed', left: '-9999px', top: 0, width: 800, background: 'white', color: '#000', zIndex: -1 }}>
                <div style={{ padding: 40, fontFamily: 'Arial', maxWidth: 800 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 900 }}>HPP: {recipe.productName}</h1>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20, fontSize: 13 }}>
                        <thead><tr style={{ background: '#F8FAFC' }}>
                            <th style={{ textAlign: 'left', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_component')}</th>
                            <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_cost_unit')}</th>
                            <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>%</th>
                        </tr></thead>
                        <tbody>
                            {[
                                { label: t('hpp_raw_materials'), amount: totalMaterials },
                                { label: t('hpp_staff_wages'), amount: totalWages },
                                { label: t('hpp_rent_utils'), amount: totalRents },
                                { label: t('hpp_utilities'), amount: totalUtils },
                                { label: t('hpp_misc'), amount: totalMisc },
                                { label: t('hpp_platform'), amount: totalPlatform },
                            ].map(({ label, amount }) => (
                                <tr key={label}><td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{label}</td>
                                    <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{formatIDR(Math.round(amount))}</td>
                                    <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{totalHPP > 0 ? Math.round((amount / totalHPP) * 100) : 0}%</td>
                                </tr>
                            ))}
                            <tr style={{ background: '#F8FAFC', fontWeight: 900 }}>
                                <td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_total')}</td>
                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{formatIDR(Math.round(totalHPP))}</td>
                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>100%</td>
                            </tr>
                        </tbody>
                    </table>

                    {(recipe.materials || []).filter(m => m.name).length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#1E293B', fontWeight: 800 }}>{t('hpp_pdf_mat_detail')}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ textAlign: 'left', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_mat_name')}</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_purchase')}</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_usage')}</th>
                                        <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_total_cost')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recipe.materials || []).filter(m => m.name).map((m, idx) => {
                                        const cost = calcMaterialCost(m);
                                        return (
                                            <tr key={idx}>
                                                <td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{m.name}</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{m.buyQty} {t('unit_' + m.buyUnit)} ({formatIDR(m.buyPrice)})</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{m.useQty} {t('unit_' + m.useUnit)}</td>
                                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0', fontWeight: 'bold' }}>{formatIDR(Math.round(cost))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {(recipe.wages || []).filter(w => w.name).length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#1E293B', fontWeight: 800 }}>{t('hpp_pdf_wage_detail')}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ textAlign: 'left', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_position')}</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_type_nominal')}</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_production')}</th>
                                        <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_cost_unit')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recipe.wages || []).filter(w => w.name).map((w, idx) => {
                                        const cost = calcWageCost(w);
                                        return (
                                            <tr key={idx}>
                                                <td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{w.name}</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{w.type === 'monthly' ? t('hpp_monthly') : w.type === 'daily' ? t('hpp_daily') : t('hpp_hourly')} ({formatIDR(w.salary)})</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{w.productionPerDay} {t('hpp_unit_per_day')}</td>
                                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0', fontWeight: 'bold' }}>{formatIDR(Math.round(cost))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {(recipe.rents || []).filter(r => r.name).length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#1E293B', fontWeight: 800 }}>{t('hpp_pdf_rent_detail')}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ textAlign: 'left', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_rent_name')}</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_period_nominal')}</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_production')}</th>
                                        <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_cost_unit')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recipe.rents || []).filter(r => r.name).map((r, idx) => {
                                        const cost = calcRentCost(r);
                                        return (
                                            <tr key={idx}>
                                                <td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{r.name}</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{r.type === 'annual' ? t('hpp_annual') : t('hpp_monthly')} ({formatIDR(r.amount)})</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{r.productionPerDay} {t('hpp_unit_per_day')}</td>
                                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0', fontWeight: 'bold' }}>{formatIDR(Math.round(cost))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {(recipe.utilities || []).filter(u => u.name).length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#1E293B', fontWeight: 800 }}>{t('hpp_pdf_util_detail')}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ textAlign: 'left', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_util_name')}</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_monthly_cost')}</th>
                                        <th style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_production')}</th>
                                        <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_cost_unit')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recipe.utilities || []).filter(u => u.name).map((u, idx) => {
                                        const cost = calcUtilityCost(u);
                                        return (
                                            <tr key={idx}>
                                                <td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{u.name}</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{formatIDR(u.monthlyAmount)}</td>
                                                <td style={{ textAlign: 'center', padding: 8, border: '1px solid #E2E8F0' }}>{u.productionPerDay} {t('hpp_unit_per_day')}</td>
                                                <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0', fontWeight: 'bold' }}>{formatIDR(Math.round(cost))}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {(recipe.misc || []).filter(m => m.name).length > 0 && (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: 16, marginBottom: 8, color: '#1E293B', fontWeight: 800 }}>{t('hpp_pdf_misc_detail')}</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ textAlign: 'left', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_description')}</th>
                                        <th style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0' }}>{t('hpp_pdf_cost_unit')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recipe.misc || []).filter(m => m.name).map((m, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: 8, border: '1px solid #E2E8F0' }}>{m.name}</td>
                                            <td style={{ textAlign: 'right', padding: 8, border: '1px solid #E2E8F0', fontWeight: 'bold' }}>{formatIDR(m.amountPerUnit)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: 24 }}>
                        <h3>{t('hpp_pdf_rec_title')}</h3>
                        <p>{t('hpp_minimum')}: <strong>{formatIDR(Math.round(totalHPP * 1.3))}</strong></p>
                        <p>{t('hpp_ideal')}: <strong>{formatIDR(Math.round(totalHPP * 1.5))}</strong></p>
                        <p>{t('hpp_premium')}: <strong>{formatIDR(Math.round(totalHPP * 2))}</strong></p>
                    </div>
                </div>
            </div>
        </div >
    );
}
