import { useState } from 'react';
import { Plus, Trash2, Download, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useLang } from '../context/LanguageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatIDR } from '../utils/currency';
import { generatePDF } from '../utils/pdf';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Makanan & Minuman', 'Fashion', 'Elektronik', 'Jasa', 'Kerajinan', 'Kecantikan', 'Lainnya'];
const UNITS = ['pcs', 'kg', 'gram', 'liter', 'porsi', 'jam', 'hari', 'proyek', 'lusin'];
const MARKETPLACES = [
    { key: 'tokopedia', label: 'Tokopedia', fee: 1.8 },
    { key: 'shopee', label: 'Shopee', fee: 2.0 },
    { key: 'lazada', label: 'Lazada', fee: 2.5 },
    { key: 'tiktok', label: 'TikTok Shop', fee: 2.0 },
    { key: 'grabfood', label: 'GrabFood', fee: 20 },
];

const emptyMaterial = () => ({ id: Date.now(), name: '', qty: 1, unit: 'kg', price: 0, total: 0 });
const emptyLabor = () => ({ id: Date.now() + 1, name: '', hours: 1, rate: 0, total: 0 });
const defaultOverheads = [
    { id: 1, name: 'Sewa Tempat', amount: 0 },
    { id: 2, name: 'Listrik', amount: 0 },
    { id: 3, name: 'Packaging', amount: 0 },
    { id: 4, name: 'Penyusutan Alat', amount: 0 },
    { id: 5, name: 'Lain-lain', amount: 0 },
];

export default function HitungHPP() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const { showToast } = useToast();
    const { isPro, checkDownloadLimit, incrementDownload } = usePlan();
    const { effectivePlan, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [, setInvoiceData] = useLocalStorage('invoice_data', []);
    const [, saveHPP] = useLocalStorage('hpp_data', []);

    const [product, setProduct] = useState({ name: '', category: 'Makanan & Minuman', units: 1, unit: 'pcs' });
    const [materials, setMaterials] = useState([emptyMaterial()]);
    const [labor, setLabor] = useState([emptyLabor()]);
    const [bpjs, setBpjs] = useState(false);
    const [overheads, setOverheads] = useState(defaultOverheads);
    const [margin, setMargin] = useState(30);
    const [ppn, setPpn] = useState(false);
    const [selectedMPs, setSelectedMPs] = useState({});
    const [customFee, setCustomFee] = useState('');
    const [salesEstimate, setSalesEstimate] = useState(100);

    // Calculations
    const materialTotal = materials.reduce((s, m) => s + (parseFloat(m.qty) * parseFloat(m.price) || 0), 0);
    const laborBase = labor.reduce((s, l) => s + (parseFloat(l.hours) * parseFloat(l.rate) || 0), 0);
    const laborTotal = bpjs ? laborBase * 1.0824 : laborBase;
    const overheadTotal = overheads.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);

    const totalHPP = materialTotal + laborTotal + overheadTotal;
    const hppPerUnit = product.units > 0 ? totalHPP / product.units : totalHPP;
    const marginAmt = hppPerUnit * (margin / 100);
    const sellPrice = hppPerUnit + marginAmt;
    const finalPrice = ppn ? sellPrice * 1.11 : sellPrice;
    const profitPerUnit = finalPrice - hppPerUnit;
    const marginPct = hppPerUnit > 0 ? (profitPerUnit / finalPrice) * 100 : 0;

    const monthlyRevenue = salesEstimate * finalPrice;
    const monthlyHPP = salesEstimate * hppPerUnit;
    const monthlyProfit = monthlyRevenue - monthlyHPP;
    const roi = monthlyHPP > 0 ? (monthlyProfit / monthlyHPP) * 100 : 0;

    const barTotal = materialTotal + laborTotal + overheadTotal || 1;

    const marginColor = margin <= 10 ? '#EF4444' : margin <= 30 ? '#F59E0B' : margin <= 50 ? '#10B981' : '#3B82F6';
    const marginLabel = margin <= 10 ? 'Terlalu Rendah' : margin <= 30 ? 'Standar' : margin <= 50 ? 'Bagus' : 'Premium';

    const updateMaterial = (id, key, val) => setMaterials(prev => prev.map(m => {
        if (m.id !== id) return m;
        const updated = { ...m, [key]: val };
        updated.total = (parseFloat(updated.qty) || 0) * (parseFloat(updated.price) || 0);
        return updated;
    }));

    const updateLabor = (id, key, val) => setLabor(prev => prev.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, [key]: val };
        updated.total = (parseFloat(updated.hours) || 0) * (parseFloat(updated.rate) || 0);
        return updated;
    }));

    const handleReset = () => {
        setProduct({ name: '', category: 'Makanan & Minuman', units: 1, unit: 'pcs' });
        setMaterials([emptyMaterial()]);
        setLabor([emptyLabor()]);
        setBpjs(false);
        setOverheads(defaultOverheads.map(o => ({ ...o, amount: 0 })));
        setMargin(30);
        setPpn(false);
        setSelectedMPs({});
        setCustomFee('');
        setSalesEstimate(100);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Form berhasil direset', 'success');
    };

    const SectionHeader = ({ title, color }) => (
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color }}>{title}</h3>
    );

    // === PLAN GUARD === PRO/ULTIMATE only
    if (effectivePlan === 'free' && !isAdmin) {
        return (
            <div style={{ padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🧮</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B', marginBottom: 8 }}>
                    {lang === 'EN' ? 'Cost Calculator (HPP) — PRO Feature' : 'Hitung HPP — Fitur PRO'}
                </h2>
                <p style={{ color: dark ? '#94A3B8' : '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                    {lang === 'EN'
                        ? 'Calculate your product cost of goods sold, set margin, and simulate monthly profit.'
                        : 'Hitung HPP produk, tentukan margin, dan simulasi profit bulanan secara otomatis.'
                    }<br />
                    {lang === 'EN' ? 'Upgrade to PRO to unlock this feature.' : 'Upgrade ke PRO untuk membuka fitur ini.'}
                </p>
                <button
                    onClick={() => window.location.href = import.meta.env.VITE_MAYAR_PRO_PAYMENT_URL}
                    style={{ padding: '14px 32px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
                >
                    🚀 {lang === 'EN' ? 'Upgrade to PRO' : 'Upgrade ke PRO'} — Rp 99.000/bln
                </button>
            </div>
        );
    }

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Hitung HPP</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline-danger" onClick={handleReset}><RotateCcw size={15} /> Reset</button>
                    <button className="btn btn-outline-primary" onClick={() => navigate('/invoice')}>Buat Invoice dari HPP</button>
                    <button className="btn btn-primary" onClick={async () => {
                        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai!', 'warning'); return; }
                        try { await generatePDF('hpp-preview', `HPP-${product.name || 'produk'}.pdf`, isPro); incrementDownload(); showToast('PDF diunduh!', 'success'); }
                        catch { showToast('Gagal mengunduh', 'error'); }
                    }}>
                        <Download size={15} /> Export PDF
                    </button>
                </div>
            </div>

            <div className="split-layout">
                {/* Form area */}
                <div>
                    {/* Section 1: Product Info */}
                    <div className="form-section" style={{ background: '#F5F3FF', borderLeft: '4px solid #7C3AED', marginBottom: 16 }}>
                        <SectionHeader title="Informasi Produk" color="#7C3AED" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="label">Nama Produk</label>
                                <input className="input" value={product.name} onChange={e => setProduct(p => ({ ...p, name: e.target.value }))} placeholder="Nama produk / layanan" />
                            </div>
                            <div>
                                <label className="label">Kategori</label>
                                <select className="select" value={product.category} onChange={e => setProduct(p => ({ ...p, category: e.target.value }))}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Jumlah Unit</label>
                                <input type="number" min="1" className="input" value={product.units} onChange={e => setProduct(p => ({ ...p, units: e.target.value }))} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="label">Satuan</label>
                                <select className="select" value={product.unit} onChange={e => setProduct(p => ({ ...p, unit: e.target.value }))}>
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Materials */}
                    <div className="form-section" style={{ background: 'white', borderLeft: '4px solid #F59E0B', marginBottom: 16 }}>
                        <SectionHeader title="Bahan Baku" color="#D97706" />
                        {materials.map(m => (
                            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 80px 110px 36px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                                <input className="input" value={m.name} onChange={e => updateMaterial(m.id, 'name', e.target.value)} placeholder="Nama bahan" style={{ fontSize: 12 }} />
                                <input className="input" type="number" value={m.qty} onChange={e => updateMaterial(m.id, 'qty', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} />
                                <input className="input" value={m.unit} onChange={e => updateMaterial(m.id, 'unit', e.target.value)} placeholder="satuan" style={{ fontSize: 12 }} />
                                <input className="input" type="number" value={m.price} onChange={e => updateMaterial(m.id, 'price', e.target.value)} placeholder="Harga/sat" style={{ fontSize: 12, textAlign: 'right' }} />
                                <button onClick={() => setMaterials(prev => prev.filter(x => x.id !== m.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <button onClick={() => setMaterials(prev => [...prev, emptyMaterial()])} className="btn btn-sm" style={{ background: '#FEF3C7', color: '#D97706', border: '1.5px solid #F59E0B' }}>
                                <Plus size={14} /> Tambah Bahan
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>Total: {formatIDR(materialTotal)}</span>
                        </div>
                    </div>

                    {/* Section 3: Labor */}
                    <div className="form-section" style={{ background: 'white', borderLeft: '4px solid #3B82F6', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <SectionHeader title="Tenaga Kerja" color="#2563EB" />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={bpjs} onChange={e => setBpjs(e.target.checked)} />
                                <span>Hitung BPJS (+8.24%)</span>
                            </label>
                        </div>
                        {labor.map(l => (
                            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 36px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                                <input className="input" value={l.name} onChange={e => updateLabor(l.id, 'name', e.target.value)} placeholder="Nama/Peran" style={{ fontSize: 12 }} />
                                <input className="input" type="number" value={l.hours} onChange={e => updateLabor(l.id, 'hours', e.target.value)} placeholder="Jam" style={{ fontSize: 12, textAlign: 'center' }} />
                                <input className="input" type="number" value={l.rate} onChange={e => updateLabor(l.id, 'rate', e.target.value)} placeholder="Rate/jam" style={{ fontSize: 12, textAlign: 'right' }} />
                                <button onClick={() => setLabor(prev => prev.filter(x => x.id !== l.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <button onClick={() => setLabor(prev => [...prev, emptyLabor()])} className="btn btn-sm" style={{ background: '#EFF6FF', color: '#2563EB', border: '1.5px solid #3B82F6' }}>
                                <Plus size={14} /> Tambah Pekerja
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>Total: {formatIDR(laborTotal)}</span>
                        </div>
                    </div>

                    {/* Section 4: Overhead */}
                    <div className="form-section" style={{ background: 'white', borderLeft: '4px solid #14B8A6', marginBottom: 16 }}>
                        <SectionHeader title="Biaya Overhead" color="#0D9488" />
                        {overheads.map(o => (
                            <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                                <input className="input" value={o.name} onChange={e => setOverheads(prev => prev.map(x => x.id === o.id ? { ...x, name: e.target.value } : x))} style={{ fontSize: 12 }} />
                                <input className="input" type="number" value={o.amount} onChange={e => setOverheads(prev => prev.map(x => x.id === o.id ? { ...x, amount: e.target.value } : x))} placeholder="Rp" style={{ fontSize: 12, textAlign: 'right' }} />
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <button onClick={() => setOverheads(prev => [...prev, { id: Date.now(), name: '', amount: 0 }])} className="btn btn-sm" style={{ background: '#F0FDFA', color: '#0D9488', border: '1.5px solid #14B8A6' }}>
                                <Plus size={14} /> Tambah Overhead
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0D9488' }}>Total: {formatIDR(overheadTotal)}</span>
                        </div>
                    </div>

                    {/* Section 5: Pricing */}
                    <div className="form-section" style={{ background: '#F0F9FF', borderLeft: '4px solid #7C3AED', marginBottom: 16 }}>
                        <SectionHeader title="Penetapan Harga" color="#7C3AED" />
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <label className="label" style={{ marginBottom: 0 }}>Margin Keuntungan: <strong style={{ color: marginColor }}>{margin}%</strong></label>
                                <span style={{ fontSize: 12, fontWeight: 700, color: marginColor }}>{marginLabel}</span>
                            </div>
                            <input type="range" min="0" max="200" value={margin} onChange={e => setMargin(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: marginColor }} />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={ppn} onChange={e => setPpn(e.target.checked)} />
                            <span>Kenakan PPN 11%?</span>
                        </label>
                        <div>
                            <label className="label">Marketplace Fees</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {MARKETPLACES.map(mp => (
                                    <label key={mp.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, background: selectedMPs[mp.key] ? '#EDE9FE' : '#F1F5F9', color: selectedMPs[mp.key] ? '#7C3AED' : '#475569', border: `1.5px solid ${selectedMPs[mp.key] ? '#7C3AED' : '#E2E8F0'}` }}>
                                        <input type="checkbox" checked={!!selectedMPs[mp.key]} onChange={() => setSelectedMPs(prev => ({ ...prev, [mp.key]: !prev[mp.key] }))} style={{ display: 'none' }} />
                                        {mp.label} ({mp.fee}%)
                                    </label>
                                ))}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <label style={{ fontSize: 12 }}>Custom:</label>
                                    <input className="input" type="number" value={customFee} onChange={e => setCustomFee(e.target.value)} style={{ width: 60, padding: '4px 8px', fontSize: 12 }} placeholder="%" />
                                    <span style={{ fontSize: 12 }}>%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Profit Simulation */}
                    <div className="form-section" style={{ background: '#F0FFF4', borderLeft: '4px solid #10B981', marginBottom: 16 }}>
                        <SectionHeader title="Simulasi Profit" color="#059669" />
                        <div className="form-group">
                            <label className="label">Estimasi Penjualan per Bulan (unit)</label>
                            <input type="number" min="1" className="input" value={salesEstimate} onChange={e => setSalesEstimate(parseInt(e.target.value) || 1)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {[
                                { label: 'Revenue', value: monthlyRevenue, color: '#10B981' },
                                { label: 'HPP Total', value: monthlyHPP, color: '#EF4444' },
                                { label: 'Profit', value: monthlyProfit, color: '#7C3AED' },
                                { label: 'ROI', value: `${roi.toFixed(1)}%`, color: '#F59E0B', isText: true },
                            ].map(item => (
                                <div key={item.label} style={{ padding: '10px 12px', background: 'white', borderRadius: 10, border: `1.5px solid ${item.color}20` }}>
                                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748B' }}>{item.label}</p>
                                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: item.color }}>{item.isText ? item.value : formatIDR(item.value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel: HPP Summary */}
                <div style={{ position: 'sticky', top: 80 }}>
                    <div id="hpp-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 24, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                            {product.name || 'Nama Produk'} — HPP Summary
                        </h3>

                        {/* 2x2 summary grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                            {[
                                { label: 'HPP/Unit', value: formatIDR(hppPerUnit), color: '#EF4444', bg: '#FEF2F2' },
                                { label: 'Harga Jual', value: formatIDR(finalPrice), color: '#7C3AED', bg: '#EDE9FE' },
                                { label: 'Profit/Unit', value: formatIDR(profitPerUnit), color: '#10B981', bg: '#ECFDF5' },
                                { label: 'Margin', value: `${marginPct.toFixed(1)}%`, color: marginColor, bg: '#F8FAFC' },
                            ].map(item => (
                                <div key={item.label} style={{ padding: '12px', background: item.bg, borderRadius: 10 }}>
                                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748B' }}>{item.label}</p>
                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: item.color }}>{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Breakdown table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: '1.5px solid #E2E8F0' }}>
                                    <th style={{ padding: '6px 0', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Komponen</th>
                                    <th style={{ padding: '6px 0', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Jumlah</th>
                                    <th style={{ padding: '6px 0', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'Bahan Baku', val: materialTotal, color: '#F59E0B' },
                                    { name: 'Tenaga Kerja', val: laborTotal, color: '#3B82F6' },
                                    { name: 'Overhead', val: overheadTotal, color: '#14B8A6' },
                                    { name: 'Total HPP', val: totalHPP, color: '#EF4444', bold: true },
                                    { name: `Margin (${margin}%)`, val: marginAmt * product.units, color: '#10B981' },
                                    { name: 'Harga Jual', val: finalPrice * product.units, color: '#7C3AED', bold: true },
                                ].map(row => (
                                    <tr key={row.name} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '7px 0', fontWeight: row.bold ? 800 : 500, color: row.bold ? '#1E293B' : '#374151' }}>{row.name}</td>
                                        <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: row.bold ? 800 : 500, color: row.color }}>{formatIDR(row.val)}</td>
                                        <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 11, color: '#94A3B8' }}>{barTotal > 0 && !row.bold ? `${((row.val / barTotal) * 100).toFixed(0)}%` : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Stacked bar chart */}
                        <div style={{ marginBottom: 16 }}>
                            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Komposisi HPP</p>
                            <div style={{ height: 20, borderRadius: 10, overflow: 'hidden', display: 'flex', background: '#F1F5F9' }}>
                                {[
                                    { val: materialTotal, color: '#F59E0B' },
                                    { val: laborTotal, color: '#3B82F6' },
                                    { val: overheadTotal, color: '#14B8A6' },
                                ].map((seg, i) => (
                                    <div key={i} style={{ width: `${(seg.val / barTotal) * 100}%`, background: seg.color, transition: 'width 500ms' }} title={formatIDR(seg.val)} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                {[
                                    { label: 'Bahan Baku', color: '#F59E0B' },
                                    { label: 'Tenaga Kerja', color: '#3B82F6' },
                                    { label: 'Overhead', color: '#14B8A6' },
                                ].map(leg => (
                                    <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: leg.color }} />
                                        <span style={{ fontSize: 10, color: '#64748B' }}>{leg.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Marketplace comparison */}
                        {Object.values(selectedMPs).some(Boolean) && (
                            <div>
                                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Harga di Marketplace</p>
                                {MARKETPLACES.filter(mp => selectedMPs[mp.key]).map(mp => {
                                    const mpPrice = finalPrice * (1 + mp.fee / 100);
                                    return (
                                        <div key={mp.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
                                            <span style={{ fontSize: 12 }}>{mp.label} (+{mp.fee}%)</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{formatIDR(mpPrice)}</span>
                                        </div>
                                    );
                                })}
                                {customFee && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                        <span style={{ fontSize: 12 }}>Custom (+{customFee}%)</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{formatIDR(finalPrice * (1 + parseFloat(customFee) / 100))}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!isPro && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
