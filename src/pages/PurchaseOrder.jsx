import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, RotateCcw, Eye, Pencil, Clock, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { useAuth } from '../context/AuthContext';

const PAYMENT_TERMS = ['Net 7', 'Net 14', 'Net 30', 'Net 45', 'Net 60', 'Cash on Delivery'];
const emptyItem = () => ({ id: Date.now(), no: '', name: '', spec: '', qty: '', unit: 'pcs', price: '', total: 0 });

const defaultForm = () => ({
    number: peekDocNumber('po'),
    date: todayStr(), deliveryDate: '',
    vendorName: '', vendorAddress: '', vendorContact: '',
    shippingAddress: '', shippingContact: '',
    paymentTerm: 'Net 30',
    items: [emptyItem()],
    discount: '', tax: '',
    notes: '',
    signerName: '', signerTitle: '',
    companyName: '', companyAddress: '',
});

export default function PurchaseOrder() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkPOLimit, incrementPO, refreshUsage
    } = usePlan();
    const { effectivePlan, isAdmin, user } = useAuth(); // Destructure user from useAuth
    const { logo } = useCompanyLogo();
    const [list, setList] = useState([]); // Removed useLocalStorage

    const [form, setForm] = useLocalStorage('draft_po', defaultForm());
    const [activeTab, setActiveTab] = useState('form');

    const fetchData = async () => {
        if (!user) return;
        const { data } = await supabase.from('documents').select('*').eq('user_id', user.id).eq('type', 'po');
        setList(data || []);
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);
    const [previewItem, setPreviewItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);


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

    const handleSave = async () => {
        if (!form.vendorName) { showToast('Nama vendor wajib diisi', 'error'); return; }
        const entry = {
            user_id: user.id,
            type: 'po',
            number: form.number,
            client_name: form.vendorName,
            total: subtotal,
            grand_total: grandTotal,
            date: form.date,
            data: { ...form }
        };

        try {
            const exists = list.find(i => i.number === form.number);
            if (exists) {
                await supabase.from('documents').update(entry).eq('id', exists.id);
                setList(prev => prev.map(i => i.id === exists.id ? { ...exists, ...entry, grandTotal } : i));
                showToast('Purchase Order diperbarui', 'success');
            } else {
                const { data: saved } = await supabase.from('documents').insert(entry).select().single();
                if (saved) {
                    setList(prev => [{ ...saved, grandTotal }, ...prev]);
                    showToast('Purchase Order tersimpan', 'success');
                    incrementPO();
                    incrementDocNumber('po');
                }
            }
        } catch (err) {
            console.error('PO save error:', err);
        }
    };

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai!', 'warning'); return; }
        setIsDownloading(true);
        try {
            await generatePDF('po-preview', `PO-${form.number || 'Draft'}.pdf`, isPremium);
            incrementDownload('po', form.number, grandTotal, form.vendorName || '-');
            showToast('PDF berhasil diunduh', 'success');
        } catch { showToast('Gagal mengunduh PDF', 'error'); } finally {
            setIsDownloading(false);
        }
    };

    const handleEditHistory = (item) => { setForm({ ...item, ...(item.data || {}) }); setActiveTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const handleDeleteHistory = async (id) => {
        try {
            await supabase.from('documents').delete().eq('id', id);
            setList(prev => prev.filter(i => i.id !== id));
            refreshUsage();
            showToast('Dokumen dihapus', 'info');
            setDeleteConfirm(null);
        } catch (err) {
            console.error('PO delete error:', err);
        }
    };


    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Purchase Order</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {activeTab === 'form' && (
                        <>
                            <button onClick={handleReset} className="btn btn-outline-danger"><RotateCcw size={15} /> Reset</button>
                            <button onClick={handleSave} className="btn btn-outline">Simpan</button>
                            <button onClick={handleDownloadPDF} className="btn btn-primary" disabled={isDownloading}><Download size={15} /> {isDownloading ? 'Mengunduh...' : 'Download PDF'}</button>
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
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.vendorName || '—'}</p>
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
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Hapus PO?</h3>
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
                                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#1E293B' }}>PURCHASE ORDER</h2>
                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>No: {item.number} &middot; {formatDateID(item.date)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button onClick={() => { setPreviewItem(null); handleEditHistory(item); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Pencil size={13} /> Edit</button>
                                        <button onClick={async () => { try { await generatePDF('po-prev-' + item.id, `PO-${item.number}.pdf`, isPremium); } catch { } }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1E293B', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Download size={13} /> PDF</button>
                                        <button onClick={() => setPreviewItem(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748B" /></button>
                                    </div>
                                </div>
                                {/* Hidden PDF body */}
                                <div id={`po-prev-${item.id}`} style={{ position: 'fixed', left: '-9999px', top: 0, width: 794, background: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, zIndex: -1 }}>
                                    <h2 style={{ margin: '0 0 4px' }}>PURCHASE ORDER</h2>
                                    <p style={{ margin: '0 0 4px' }}>Vendor: {item.vendorName} | Term: {item.paymentTerm}</p>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                                        <thead><tr style={{ background: '#1E293B' }}>{['No.', 'Nama Item', 'Qty', 'Satuan', 'Harga', 'Total'].map(h => <th key={h} style={{ padding: '6px 8px', color: 'white', fontSize: 10, textAlign: 'left' }}>{h}</th>)}</tr></thead>
                                        <tbody>{(item.items || []).filter(i => i.name).map((i, idx) => <tr key={idx}><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.no || idx + 1}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.name}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.qty}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.unit}</td><td style={{ padding: '5px 8px', fontSize: 11, textAlign: 'right' }}>{formatIDR(i.price)}</td><td style={{ padding: '5px 8px', fontSize: 11, textAlign: 'right', fontWeight: 700 }}>{formatIDR(i.total)}</td></tr>)}</tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ padding: '10px', background: '#1E293B', borderRadius: 8 }}><span style={{ color: 'white', fontWeight: 800 }}>TOTAL: {formatIDR(item.grandTotal || 0)}</span></div></div>
                                </div>
                                {/* Preview body */}
                                <div style={{ padding: '20px 28px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, borderLeft: '3px solid #7C3AED' }}>
                                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>Vendor</p>
                                            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14 }}>{item.vendorName || '—'}</p>
                                            {item.vendorAddress && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.vendorAddress}</p>}
                                            {item.vendorContact && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.vendorContact}</p>}
                                        </div>
                                        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 10 }}>
                                            {[['Term Pembayaran', item.paymentTerm], ['Tanggal Kirim', item.deliveryDate ? formatDateID(item.deliveryDate) : null], ['Alamat Kirim', item.shippingAddress]].filter(([, v]) => v).map(([l, v]) => (<div key={l} style={{ marginBottom: 4 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>{l}: </span><span style={{ fontSize: 12 }}>{v}</span></div>))}
                                        </div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                                        <thead><tr style={{ background: '#1E293B' }}>{['No.', 'Nama Item', 'Spesifikasi', 'Qty', 'Satuan', 'Harga Satuan', 'Total'].map(h => <th key={h} style={{ padding: '8px 10px', color: 'white', fontSize: 11, textAlign: 'left', fontWeight: 700 }}>{h}</th>)}</tr></thead>
                                        <tbody>{(item.items || []).filter(i => i.name).map((i, idx) => (<tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}><td style={{ padding: '8px 10px', fontSize: 12 }}>{i.no || idx + 1}</td><td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>{i.name}</td><td style={{ padding: '8px 10px', fontSize: 12, color: '#64748B' }}>{i.spec || '—'}</td><td style={{ padding: '8px 10px', fontSize: 12 }}>{i.qty}</td><td style={{ padding: '8px 10px', fontSize: 12 }}>{i.unit}</td><td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{formatIDR(i.price)}</td><td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#7C3AED' }}>{formatIDR(i.total)}</td></tr>))}</tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                        <div style={{ width: 240 }}>
                                            {[['Subtotal', formatIDR(iSub)], ...(item.discountAmt > 0 ? [[`Diskon ${item.discount}%`, `- ${formatIDR(item.discountAmt)}`]] : []), ...(item.taxAmt > 0 ? [[`Pajak ${item.tax}%`, `+ ${formatIDR(item.taxAmt)}`]] : [])].map(([l, v]) => (<div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13, color: '#64748B' }}>{l}</span><span style={{ fontSize: 13 }}>{v}</span></div>))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '10px 14px', background: '#1E293B', borderRadius: 8 }}><span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>TOTAL</span><span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{formatIDR(item.grandTotal || 0)}</span></div>
                                        </div>
                                    </div>
                                    {item.notes && <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8 }}><p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Catatan</p><p style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-line' }}>{item.notes}</p></div>}
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
                                        { key: 'number', label: 'Nomor PO' },
                                        { key: 'date', label: 'Tanggal', type: 'date' },
                                        { key: 'deliveryDate', label: 'Tanggal Pengiriman', type: 'date' },
                                        { key: 'companyName', label: 'Nama Perusahaan' },
                                        { key: 'companyAddress', label: 'Alamat Perusahaan' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="label">{f.label}</label>
                                            <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="label">Term Pembayaran</label>
                                        <select className="select" value={form.paymentTerm} onChange={e => setField('paymentTerm', e.target.value)}>
                                            {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="label">Logo Perusahaan</label>
                                        <LogoUpload size="sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <div style={{ padding: 14, background: dark ? '#0F172A' : '#FFF8F0', borderRadius: 10, borderLeft: '3px solid #F59E0B' }}>
                                        <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>Vendor</h4>
                                        {[{ key: 'vendorName', label: 'Nama' }, { key: 'vendorAddress', label: 'Alamat' }, { key: 'vendorContact', label: 'Kontak' }].map(f => (
                                            <div key={f.key} style={{ marginBottom: 8 }}><label className="label">{f.label}</label><input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} /></div>
                                        ))}
                                    </div>
                                    <div style={{ padding: 14, background: dark ? '#0F172A' : '#F0FFF4', borderRadius: 10, borderLeft: '3px solid #10B981' }}>
                                        <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#10B981' }}>Pengiriman</h4>
                                        {[{ key: 'shippingAddress', label: 'Alamat' }, { key: 'shippingContact', label: 'Kontak' }].map(f => (
                                            <div key={f.key} style={{ marginBottom: 8 }}><label className="label">{f.label}</label><input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} /></div>
                                        ))}
                                    </div>
                                </div>

                                <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Item Pesanan</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                                        <thead><tr>{['Nama', 'Spesifikasi', 'Qty', 'Satuan', 'Harga', 'Total', ''].map(h => (<th key={h} style={{ padding: '6px 6px', fontSize: 10, fontWeight: 700, color: '#64748B', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>))}</tr></thead>
                                        <tbody>
                                            {form.items.map(item => (
                                                <tr key={item.id}>
                                                    <td style={{ padding: '3px 3px' }}><input className="input" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Nama" style={{ fontSize: 12 }} /></td>
                                                    <td style={{ padding: '3px 3px' }}><input className="input" value={item.spec} onChange={e => updateItem(item.id, 'spec', e.target.value)} placeholder="Spec" style={{ fontSize: 12 }} /></td>
                                                    <td style={{ padding: '3px 3px', width: 56 }}><input className="input" type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} placeholder="1" /></td>
                                                    <td style={{ padding: '3px 3px', width: 64 }}><input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ fontSize: 12 }} /></td>
                                                    <td style={{ padding: '3px 3px', width: 100 }}><input className="input" type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ fontSize: 12, textAlign: 'right' }} placeholder="0" /></td>
                                                    <td style={{ padding: '3px 8px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>{formatIDR(item.total)}</td>
                                                    <td><button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={addItem} className="btn btn-sm btn-outline" style={{ marginTop: 8 }}><Plus size={14} /> Tambah Item</button>

                                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                    {[{ key: 'discount', label: 'Diskon %' }, { key: 'tax', label: 'Pajak %' }].map(f => (
                                        <div key={f.key} style={{ flex: 1 }}>
                                            <label className="label">{f.label}</label>
                                            <input type="number" min="0" max="100" className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} placeholder="0" />
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 10 }}><label className="label">Catatan</label><textarea className="textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} rows="2" /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                                    <div><label className="label">Nama Penanda Tangan</label><input className="input" value={form.signerName} onChange={e => setField('signerName', e.target.value)} /></div>
                                    <div><label className="label">Jabatan</label><input className="input" value={form.signerTitle} onChange={e => setField('signerTitle', e.target.value)} /></div>
                                </div>
                            </div>
                        </div>

                        <div style={{ position: 'sticky', top: 80 }}>
                            <div id="po-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 11 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '3px solid #7C3AED' }}>
                                    <div>
                                        {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 60, maxWidth: 160, objectFit: 'contain', marginBottom: 6 }} /> : <h1 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: '#7C3AED' }}>{form.companyName || 'Perusahaan'}</h1>}
                                        <p style={{ margin: 0, fontSize: 10, color: '#64748B', maxWidth: 200 }}>{form.companyAddress}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: 1 }}>Purchase Order</h2>
                                        <p style={{ margin: '0 0 2px' }}>No: {form.number}</p>
                                        <p style={{ margin: '0 0 2px' }}>Tanggal: {formatDateID(form.date)}</p>
                                        {form.deliveryDate && <p style={{ margin: 0 }}>Pengiriman: {formatDateID(form.deliveryDate)}</p>}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                    <div style={{ padding: '10px', background: '#FFFBEB', borderLeft: '3px solid #F59E0B' }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, color: '#F59E0B' }}>VENDOR</p>
                                        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 12 }}>{form.vendorName || '—'}</p>
                                        {form.vendorAddress && <p style={{ margin: '0 0 1px', fontSize: 10, color: '#64748B' }}>{form.vendorAddress}</p>}
                                        {form.vendorContact && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{form.vendorContact}</p>}
                                    </div>
                                    <div style={{ padding: '10px', background: '#F0FFF4', borderLeft: '3px solid #10B981' }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, color: '#10B981' }}>KIRIM KE</p>
                                        {form.shippingAddress && <p style={{ margin: '0 0 2px', fontSize: 11 }}>{form.shippingAddress}</p>}
                                        {form.shippingContact && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{form.shippingContact}</p>}
                                        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#64748B' }}>Term: {form.paymentTerm}</p>
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: 10 }}>
                                    <thead><tr style={{ background: '#7C3AED' }}>{['No', 'Item', 'Spec', 'Qty', 'Satuan', 'Harga', 'Total'].map(h => (<th key={h} style={{ padding: '6px 7px', color: 'white', textAlign: 'left', fontSize: 9, fontWeight: 700 }}>{h}</th>))}</tr></thead>
                                    <tbody>
                                        {form.items.filter(i => i.name).map((item, idx) => (
                                            <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white', borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '5px 7px' }}>{idx + 1}</td>
                                                <td style={{ padding: '5px 7px', fontWeight: 600 }}>{item.name}</td>
                                                <td style={{ padding: '5px 7px', color: '#64748B' }}>{item.spec}</td>
                                                <td style={{ padding: '5px 7px' }}>{item.qty}</td>
                                                <td style={{ padding: '5px 7px' }}>{item.unit}</td>
                                                <td style={{ padding: '5px 7px', textAlign: 'right' }}>{formatIDR(item.price)}</td>
                                                <td style={{ padding: '5px 7px', textAlign: 'right', fontWeight: 700 }}>{formatIDR(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                                    <div style={{ width: 190 }}>
                                        {[['Subtotal', formatIDR(subtotal)], ...(form.discount > 0 ? [[`Diskon ${form.discount}%`, `- ${formatIDR(discountAmt)}`]] : []), ...(form.tax > 0 ? [[`Pajak ${form.tax}%`, `+ ${formatIDR(taxAmt)}`]] : [])].map(([l, v]) => (<div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10 }}><span style={{ color: '#64748B' }}>{l}</span><span>{v}</span></div>))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: '#7C3AED', borderRadius: 6 }}><span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Total</span><span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span></div>
                                    </div>
                                </div>

                                {form.notes && <p style={{ fontSize: 10, color: '#64748B', marginBottom: 16, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6 }}><strong>Catatan:</strong> {form.notes}</p>}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                    <div style={{ textAlign: 'center', width: 140 }}>
                                        <p style={{ margin: '0 0 48px', fontSize: 10 }}>Disetujui oleh,</p>
                                        <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>{form.signerName || '...............'}</p>
                                            {form.signerTitle && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{form.signerTitle}</p>}
                                        </div>
                                    </div>
                                </div>
                                {!isPremium && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 9, marginTop: 12 }}>Generated by MyInvoice.space</p>}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
