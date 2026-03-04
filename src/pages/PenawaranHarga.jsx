import { useState } from 'react';
import { Plus, Trash2, Download, RotateCcw, ArrowRight, Eye, Pencil, Clock, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import { useNavigate } from 'react-router-dom';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { useAuth } from '../context/AuthContext';

const emptyItem = () => ({ id: Date.now(), no: '', name: '', spec: '', qty: '', unit: 'pcs', price: '', total: 0 });

const defaultForm = () => ({
    number: peekDocNumber('sph'),
    date: todayStr(), validUntil: '',
    toName: '', toCompany: '',
    subject: '',
    items: [emptyItem()],
    discount: '', tax: '',
    terms: '',
    closing: 'Demikian penawaran ini kami sampaikan. Kami berharap dapat menjalin kerjasama yang saling menguntungkan.',
    signerName: '', signerTitle: '',
    companyName: '', companyAddress: '',
});

export default function PenawaranHarga() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const { showToast } = useToast();
    const { isPro, checkDownloadLimit, incrementDownload } = usePlan();
    const { effectivePlan, isAdmin } = useAuth();
    const navigate = useNavigate();
    const { logo } = useCompanyLogo();

    const [, setInvoiceData] = useLocalStorage('invoice_data', []);
    const [list, setList] = useLocalStorage('sph_data', []);
    const [form, setForm] = useLocalStorage('draft_penawaran', defaultForm());
    const [activeTab, setActiveTab] = useState('form');
    const [previewItem, setPreviewItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const isPlanPro = ['pro', 'ultimate'].includes(effectivePlan) || isAdmin;
    if (!isPlanPro) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
                <span className="text-6xl mb-4">💰</span>
                <h2 className="text-xl font-bold mb-2 dark:text-white">Penawaran Harga — Fitur PRO</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Buat penawaran harga profesional dan kirim ke klien dengan upgrade ke PRO.</p>
                <button onClick={() => navigate('/upgrade')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    ⭐ Upgrade ke PRO — Rp 99.000/bln
                </button>
            </div>
        );
    }

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const updateItem = (id, key, val) => setForm(f => ({
        ...f,
        items: f.items.map(i => {
            if (i.id !== id) return i;
            const updated = { ...i, [key]: val };
            updated.total = (parseFloat(updated.qty) || 0) * (parseFloat(updated.price) || 0);
            return updated;
        })
    }));

    const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (id) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

    const subtotal = form.items.reduce((s, i) => s + (i.total || 0), 0);
    const discountAmt = subtotal * (parseFloat(form.discount) / 100 || 0);
    const taxAmt = (subtotal - discountAmt) * (parseFloat(form.tax) / 100 || 0);
    const grandTotal = subtotal - discountAmt + taxAmt;

    const handleReset = () => {
        setForm(defaultForm());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Form berhasil direset', 'success');
    };

    const handleSave = () => {
        const entry = { id: Date.now().toString(), ...form, grandTotal, createdAt: new Date().toISOString() };
        setList(prev => {
            const exists = prev.find(i => i.number === form.number);
            if (exists) return prev.map(i => i.number === form.number ? entry : i);
            return [entry, ...prev];
        });
        incrementDocNumber('sph');
        showToast('Penawaran tersimpan', 'success');
    };

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai!', 'warning'); return; }
        try {
            await generatePDF('sph-preview', `SPH-${form.number}.pdf`, isPro);
            incrementDownload();
            showToast('PDF berhasil diunduh', 'success');
        } catch { showToast('Gagal mengunduh PDF', 'error'); }
    };

    const handleJadiInvoice = () => {
        const invData = {
            id: Date.now().toString(),
            number: peekDocNumber('invoice'),
            date: todayStr(),
            clientName: form.toName,
            items: form.items.map(i => ({ ...i, desc: i.name })),
            discount: form.discount, tax: form.tax,
            grandTotal,
            status: 'unpaid',
            notes: `Dari SPH: ${form.number}`,
            createdAt: new Date().toISOString(),
        };
        setInvoiceData(prev => [invData, ...prev]);
        incrementDocNumber('invoice');
        showToast('Penawaran dikonversi ke Invoice!', 'success');
        navigate('/invoice');
    };

    const handleEditHistory = (item) => { setForm({ ...item }); setActiveTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const handleDeleteHistory = (id) => { setList(prev => prev.filter(i => i.id !== id)); showToast('Dokumen dihapus', 'info'); setDeleteConfirm(null); };

    // === PLAN GUARD === PRO/ULTIMATE only
    if (effectivePlan === 'free' && !isAdmin) {
        return (
            <div style={{ padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B', marginBottom: 8 }}>
                    {lang === 'EN' ? 'Price Quotation — PRO Feature' : 'Penawaran Harga — Fitur PRO'}
                </h2>
                <p style={{ color: dark ? '#94A3B8' : '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                    {lang === 'EN'
                        ? 'Create and send professional price quotations with direct conversion to invoices.'
                        : 'Buat surat penawaran harga profesional dan konversi langsung ke invoice.'
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
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Penawaran Harga</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {activeTab === 'form' && (
                        <>
                            <button onClick={handleReset} className="btn btn-outline-danger"><RotateCcw size={15} /> Reset</button>
                            <button onClick={handleJadiInvoice} className="btn btn-outline-primary"><ArrowRight size={15} /> Jadikan Invoice</button>
                            <button onClick={handleSave} className="btn btn-outline">Simpan</button>
                            <button onClick={handleDownloadPDF} className="btn btn-primary"><Download size={15} /> Download PDF</button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${dark ? '#334155' : '#E2E8F0'}` }}>
                {[{ key: 'form', label: 'Form Baru' }, { key: 'history', label: 'Riwayat', icon: Clock }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #7C3AED' : '2px solid transparent', color: activeTab === tab.key ? '#7C3AED' : (dark ? '#94A3B8' : '#64748B'), marginBottom: -2, transition: 'color 200ms' }}>
                        {tab.icon && <tab.icon size={14} />}
                        {tab.label}
                        {tab.key === 'history' && list.length > 0 && <span style={{ background: '#7C3AED', color: 'white', borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{list.length}</span>}
                    </button>
                ))}
            </div>

            {activeTab === 'history' && (
                <div>
                    {list.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '64px 24px', color: dark ? '#64748B' : '#94A3B8' }}>
                            <Clock size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                            <p style={{ fontSize: 16, fontWeight: 600 }}>Belum ada dokumen tersimpan</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {list.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: dark ? '#1E293B' : 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 150 }}>
                                        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: dark ? '#F1F5F9' : '#1E293B' }}>{item.number}</p>
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.toName || '—'}</p>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: '#64748B', flex: 1, minWidth: 90 }}>{item.date}</p>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#7C3AED', flex: 1, minWidth: 110 }}>{formatIDR(item.grandTotal || 0)}</p>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => setPreviewItem(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3B82F6', background: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Eye size={13} /> Lihat</button>
                                        <button onClick={() => handleEditHistory(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Pencil size={13} /> Edit</button>
                                        <button onClick={() => setDeleteConfirm(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #EF4444', background: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Trash2 size={13} /> Hapus</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: dark ? '#1E293B' : 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Hapus Penawaran?</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>Dokumen ini akan dihapus permanen.</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Batal</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {previewItem && (() => {
                const item = previewItem;
                const iSub = (item.items || []).reduce((s, i) => s + (i.total || 0), 0);
                return (
                    <div
                        onClick={e => { if (e.target === e.currentTarget) setPreviewItem(null); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, overflowY: 'auto' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '24px 16px' }}>
                            <div style={{ background: 'white', color: '#000', borderRadius: 16, width: '95vw', maxWidth: 1100, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'scaleIn 180ms cubic-bezier(0.4,0,0.2,1) forwards' }}>
                                {/* Sticky header */}
                                <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px 16px 0 0' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#3B82F6' }}>SURAT PENAWARAN HARGA</h2>
                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>No: {item.number} &middot; {formatDateID(item.date)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button onClick={() => { setPreviewItem(null); handleEditHistory(item); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Pencil size={13} /> Edit</button>
                                        <button onClick={async () => { try { await generatePDF('sph-prev-' + item.id, `SPH-${item.number}.pdf`, isPro); } catch { } }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#3B82F6', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Download size={13} /> PDF</button>
                                        <button onClick={() => setPreviewItem(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748B" /></button>
                                    </div>
                                </div>
                                {/* Hidden PDF body */}
                                <div id={`sph-prev-${item.id}`} style={{ position: 'fixed', left: '-9999px', top: 0, width: 794, background: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, zIndex: -1 }}>
                                    <h2 style={{ margin: '0 0 4px', color: '#3B82F6' }}>SURAT PENAWARAN HARGA</h2>
                                    <p style={{ margin: '0 0 4px' }}>Kepada: {item.toName} {item.toCompany && `(${item.toCompany})`}</p>
                                    {item.subject && <p style={{ margin: '0 0 16px' }}>Perihal: {item.subject}</p>}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                                        <thead><tr style={{ background: '#3B82F6' }}>{['No.', 'Nama', 'Spesifikasi', 'Qty', 'Sat', 'Harga', 'Total'].map(h => <th key={h} style={{ padding: '6px 8px', color: 'white', fontSize: 10, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                                        <tbody>{(item.items || []).filter(i => i.name).map((i, idx) => <tr key={idx}><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.no || idx + 1}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.name}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.spec}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.qty}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.unit}</td><td style={{ padding: '5px 8px', fontSize: 11, textAlign: 'right' }}>{formatIDR(i.price)}</td><td style={{ padding: '5px 8px', fontSize: 11, textAlign: 'right', fontWeight: 700 }}>{formatIDR(i.total)}</td></tr>)}</tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ width: 200, padding: '10px', background: '#3B82F6', borderRadius: 8 }}><span style={{ color: 'white', fontWeight: 800 }}>TOTAL: {formatIDR(item.grandTotal || 0)}</span></div></div>
                                </div>
                                {/* Preview body */}
                                <div style={{ padding: '20px 28px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                        <div style={{ padding: '12px 16px', background: '#EFF6FF', borderRadius: 10, borderLeft: '3px solid #3B82F6' }}>
                                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase' }}>Kepada</p>
                                            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14 }}>{item.toName || '—'}</p>
                                            {item.toCompany && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.toCompany}</p>}
                                        </div>
                                        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 10 }}>
                                            {item.subject && <><p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Perihal</p><p style={{ margin: '0 0 8px', fontSize: 13 }}>{item.subject}</p></>}
                                            {item.validUntil && <><p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Berlaku Hingga</p><p style={{ margin: 0, fontSize: 13, color: '#EF4444' }}>{formatDateID(item.validUntil)}</p></>}
                                        </div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                                        <thead><tr style={{ background: '#1E293B' }}>{['No.', 'Nama Item', 'Spesifikasi', 'Qty', 'Satuan', 'Harga Satuan', 'Total'].map(h => <th key={h} style={{ padding: '8px 10px', color: 'white', fontSize: 11, textAlign: 'left', fontWeight: 700 }}>{h}</th>)}</tr></thead>
                                        <tbody>{(item.items || []).filter(i => i.name).map((i, idx) => (<tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}><td style={{ padding: '8px 10px', fontSize: 12 }}>{i.no || idx + 1}</td><td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>{i.name}</td><td style={{ padding: '8px 10px', fontSize: 12, color: '#64748B' }}>{i.spec || '—'}</td><td style={{ padding: '8px 10px', fontSize: 12 }}>{i.qty}</td><td style={{ padding: '8px 10px', fontSize: 12 }}>{i.unit}</td><td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{formatIDR(i.price)}</td><td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#3B82F6' }}>{formatIDR(i.total)}</td></tr>))}</tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                        <div style={{ width: 240 }}>
                                            {[['Subtotal', formatIDR(iSub)], ...(item.discountAmt > 0 ? [[`Diskon ${item.discount}%`, `- ${formatIDR(item.discountAmt)}`]] : []), ...(item.taxAmt > 0 ? [[`Pajak ${item.tax}%`, `+ ${formatIDR(item.taxAmt)}`]] : [])].map(([l, v]) => (<div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13, color: '#64748B' }}>{l}</span><span style={{ fontSize: 13 }}>{v}</span></div>))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '10px 14px', background: '#3B82F6', borderRadius: 8 }}><span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>TOTAL</span><span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{formatIDR(item.grandTotal || 0)}</span></div>
                                        </div>
                                    </div>
                                    {item.terms && <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8 }}><p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Syarat</p><p style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-line' }}>{item.terms}</p></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {
                activeTab === 'form' && (
                    <div className="split-layout">
                        <div>
                            <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[
                                        { key: 'number', label: 'Nomor SPH' },
                                        { key: 'date', label: 'Tanggal', type: 'date' },
                                        { key: 'validUntil', label: 'Berlaku Sampai', type: 'date' },
                                        { key: 'subject', label: 'Perihal', full: true },
                                        { key: 'toName', label: 'Kepada Yth.' },
                                        { key: 'toCompany', label: 'Perusahaan' },
                                        { key: 'companyName', label: 'Dari Perusahaan' },
                                        { key: 'companyAddress', label: 'Alamat' },
                                    ].map(f => (
                                        <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                                            <label className="label">{f.label}</label>
                                            <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                        </div>
                                    ))}
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="label">Logo Perusahaan</label>
                                        <LogoUpload size="sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Rincian Penawaran</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                                        <thead><tr>{['Nama', 'Spesifikasi', 'Qty', 'Satuan', 'Harga', 'Total', ''].map(h => (<th key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, color: '#64748B', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>))}</tr></thead>
                                        <tbody>
                                            {form.items.map(item => (
                                                <tr key={item.id}>
                                                    <td style={{ padding: '4px 4px' }}><input className="input" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Nama" style={{ fontSize: 12 }} /></td>
                                                    <td style={{ padding: '4px 4px' }}><input className="input" value={item.spec} onChange={e => updateItem(item.id, 'spec', e.target.value)} placeholder="Spesifikasi" style={{ fontSize: 12 }} /></td>
                                                    <td style={{ padding: '4px 4px', width: 60 }}><input className="input" type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} placeholder="1" /></td>
                                                    <td style={{ padding: '4px 4px', width: 70 }}><input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ fontSize: 12 }} /></td>
                                                    <td style={{ padding: '4px 4px', width: 110 }}><input className="input" type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ fontSize: 12, textAlign: 'right' }} placeholder="0" /></td>
                                                    <td style={{ padding: '4px 8px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatIDR(item.total)}</td>
                                                    <td style={{ padding: '4px 4px' }}><button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={addItem} className="btn btn-sm btn-outline" style={{ marginTop: 10 }}><Plus size={14} /> Tambah Item</button>
                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: 220 }}>
                                        {[['Subtotal', formatIDR(subtotal)], ...(form.discount > 0 ? [[`Diskon ${form.discount}%`, `- ${formatIDR(discountAmt)}`]] : []), ...(form.tax > 0 ? [[`Pajak ${form.tax}%`, `+ ${formatIDR(taxAmt)}`]] : [])].map(([l, v]) => (
                                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 12, color: '#64748B' }}>{l}</span><span style={{ fontSize: 12 }}>{v}</span></div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px 10px', background: '#7C3AED', borderRadius: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>Total</span>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                                {[{ key: 'terms', label: 'Syarat & Ketentuan', textarea: true }, { key: 'closing', label: 'Penutup', textarea: true }, { key: 'signerName', label: 'Nama Penanda Tangan' }, { key: 'signerTitle', label: 'Jabatan' }].map(f => (
                                    <div key={f.key} className="form-group">
                                        <label className="label">{f.label}</label>
                                        {f.textarea ? <textarea className="textarea" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} rows="3" /> : <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />}
                                    </div>
                                ))}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[{ key: 'discount', label: 'Diskon %' }, { key: 'tax', label: 'Pajak %' }].map(f => (
                                        <div key={f.key} className="form-group">
                                            <label className="label">{f.label}</label>
                                            <input type="number" min="0" max="100" className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} placeholder="0" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ position: 'sticky', top: 80 }}>
                            <div id="sph-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 36, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }}>
                                <div style={{ borderBottom: '3px solid #7C3AED', paddingBottom: 16, marginBottom: 16 }}>
                                    {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 72, maxWidth: 200, objectFit: 'contain', marginBottom: 6, display: 'block' }} /> : (form.companyName ? <h1 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 900, color: '#7C3AED' }}>{form.companyName}</h1> : null)}
                                    <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.companyAddress}</p>
                                </div>
                                <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1E293B', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>Surat Penawaran Harga</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                    <div><p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#64748B' }}>KEPADA YTH.</p><p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700 }}>{form.toName || '—'}</p><p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.toCompany}</p></div>
                                    <div><p style={{ margin: '0 0 2px', fontSize: 11 }}>No: {form.number}</p><p style={{ margin: '0 0 2px', fontSize: 11 }}>Tanggal: {formatDateID(form.date)}</p>{form.validUntil && <p style={{ margin: 0, fontSize: 11 }}>Berlaku s/d: {formatDateID(form.validUntil)}</p>}</div>
                                </div>
                                {form.subject && <p style={{ margin: '0 0 16px', fontSize: 12 }}><strong>Perihal:</strong> {form.subject}</p>}
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 10 }}>
                                    <thead><tr style={{ background: '#7C3AED' }}>{['No', 'Nama', 'Spesifikasi', 'Qty', 'Satuan', 'Harga', 'Total'].map(h => (<th key={h} style={{ padding: '6px 8px', color: 'white', textAlign: 'left', fontSize: 9, fontWeight: 700 }}>{h}</th>))}</tr></thead>
                                    <tbody>{form.items.filter(i => i.name).map((item, idx) => (<tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}><td style={{ padding: '5px 8px' }}>{idx + 1}</td><td style={{ padding: '5px 8px', fontWeight: 600 }}>{item.name}</td><td style={{ padding: '5px 8px' }}>{item.spec}</td><td style={{ padding: '5px 8px' }}>{item.qty}</td><td style={{ padding: '5px 8px' }}>{item.unit}</td><td style={{ padding: '5px 8px', textAlign: 'right' }}>{formatIDR(item.price)}</td><td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>{formatIDR(item.total)}</td></tr>))}</tbody>
                                </table>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><div style={{ width: 180 }}><div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: '#7C3AED', borderRadius: 6 }}><span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Total</span><span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span></div></div></div>
                                {form.terms && <div style={{ marginBottom: 12, padding: '8px 10px', background: '#F8FAFC', borderRadius: 6 }}><p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Syarat & Ketentuan</p><p style={{ margin: 0, fontSize: 10 }}>{form.terms}</p></div>}
                                {form.closing && <p style={{ fontSize: 11, color: '#374151', marginBottom: 20 }}>{form.closing}</p>}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ textAlign: 'center', width: 140 }}><p style={{ margin: '0 0 48px', fontSize: 11 }}>Hormat Kami,</p><div style={{ borderTop: '1px solid #000', paddingTop: 6 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{form.signerName || '...............'}</p>{form.signerTitle && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{form.signerTitle}</p>}</div></div></div>
                                {!isPro && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 16 }}>Generated by MyInvoice.space</p>}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
