import { useState } from 'react';
import { Plus, Trash2, Download, ArrowRight } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import { useNavigate } from 'react-router-dom';

const emptyItem = () => ({ id: Date.now(), no: '', name: '', spec: '', qty: 1, unit: 'pcs', price: 0, total: 0 });

export default function PenawaranHarga() {
    const { dark } = useTheme();
    const { showToast } = useToast();
    const { isPro, checkDownloadLimit, incrementDownload } = usePlan();
    const navigate = useNavigate();

    const [, setInvoiceData] = useLocalStorage('invoice_data', []);
    const [form, setForm] = useState({
        number: peekDocNumber('sph'),
        date: todayStr(), validUntil: '',
        toName: '', toCompany: '',
        subject: '',
        items: [emptyItem()],
        discount: 0, tax: 0,
        terms: '',
        closing: 'Demikian penawaran ini kami sampaikan. Kami berharap dapat menjalin kerjasama yang saling menguntungkan.',
        signerName: '', signerTitle: '',
        companyName: '', companyAddress: '',
    });

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

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Penawaran Harga</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleJadiInvoice} className="btn btn-outline-primary">
                        <ArrowRight size={15} /> Jadikan Invoice
                    </button>
                    <button onClick={handleDownloadPDF} className="btn btn-primary"><Download size={15} /> Download PDF</button>
                </div>
            </div>

            <div className="split-layout">
                {/* Form */}
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
                        </div>
                    </div>

                    {/* Items */}
                    <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Rincian Penawaran</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                                <thead>
                                    <tr>
                                        {['Nama', 'Spesifikasi', 'Qty', 'Satuan', 'Harga', 'Total', ''].map(h => (
                                            <th key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, color: '#64748B', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ padding: '4px 4px' }}><input className="input" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Nama" style={{ fontSize: 12 }} /></td>
                                            <td style={{ padding: '4px 4px' }}><input className="input" value={item.spec} onChange={e => updateItem(item.id, 'spec', e.target.value)} placeholder="Spesifikasi" style={{ fontSize: 12 }} /></td>
                                            <td style={{ padding: '4px 4px', width: 60 }}><input className="input" type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} /></td>
                                            <td style={{ padding: '4px 4px', width: 70 }}><input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ fontSize: 12 }} /></td>
                                            <td style={{ padding: '4px 4px', width: 110 }}><input className="input" type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ fontSize: 12, textAlign: 'right' }} /></td>
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
                                {[
                                    ['Subtotal', formatIDR(subtotal)],
                                    ...(form.discount > 0 ? [[`Diskon ${form.discount}%`, `- ${formatIDR(discountAmt)}`]] : []),
                                    ...(form.tax > 0 ? [[`Pajak ${form.tax}%`, `+ ${formatIDR(taxAmt)}`]] : []),
                                ].map(([l, v]) => (
                                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, color: '#64748B' }}>{l}</span>
                                        <span style={{ fontSize: 12 }}>{v}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px 10px', background: '#7C3AED', borderRadius: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>Total</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                        {[
                            { key: 'terms', label: 'Syarat & Ketentuan', textarea: true },
                            { key: 'closing', label: 'Penutup', textarea: true },
                            { key: 'signerName', label: 'Nama Penanda Tangan' },
                            { key: 'signerTitle', label: 'Jabatan' },
                        ].map(f => (
                            <div key={f.key} className="form-group">
                                <label className="label">{f.label}</label>
                                {f.textarea ? (
                                    <textarea className="textarea" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} rows="3" />
                                ) : (
                                    <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                )}
                            </div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {[{ key: 'discount', label: 'Diskon %' }, { key: 'tax', label: 'Pajak %' }].map(f => (
                                <div key={f.key} className="form-group">
                                    <label className="label">{f.label}</label>
                                    <input type="number" min="0" max="100" className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div style={{ position: 'sticky', top: 80 }}>
                    <div id="sph-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 36, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }}>
                        {/* Letterhead */}
                        <div style={{ borderBottom: '3px solid #7C3AED', paddingBottom: 16, marginBottom: 16 }}>
                            <h1 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 900, color: '#7C3AED' }}>{form.companyName || 'Nama Perusahaan'}</h1>
                            <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.companyAddress}</p>
                        </div>
                        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: '#1E293B', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>Surat Penawaran Harga</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#64748B' }}>KEPADA YTH.</p>
                                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700 }}>{form.toName || '—'}</p>
                                <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.toCompany}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 2px', fontSize: 11 }}>No: {form.number}</p>
                                <p style={{ margin: '0 0 2px', fontSize: 11 }}>Tanggal: {formatDateID(form.date)}</p>
                                {form.validUntil && <p style={{ margin: 0, fontSize: 11 }}>Berlaku s/d: {formatDateID(form.validUntil)}</p>}
                            </div>
                        </div>
                        {form.subject && <p style={{ margin: '0 0 16px', fontSize: 12 }}><strong>Perihal:</strong> {form.subject}</p>}

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 10 }}>
                            <thead>
                                <tr style={{ background: '#7C3AED' }}>
                                    {['No', 'Nama', 'Spesifikasi', 'Qty', 'Satuan', 'Harga', 'Total'].map(h => (
                                        <th key={h} style={{ padding: '6px 8px', color: 'white', textAlign: 'left', fontSize: 9, fontWeight: 700 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.filter(i => i.name).map((item, idx) => (
                                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}>
                                        <td style={{ padding: '5px 8px' }}>{idx + 1}</td>
                                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{item.name}</td>
                                        <td style={{ padding: '5px 8px' }}>{item.spec}</td>
                                        <td style={{ padding: '5px 8px' }}>{item.qty}</td>
                                        <td style={{ padding: '5px 8px' }}>{item.unit}</td>
                                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{formatIDR(item.price)}</td>
                                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>{formatIDR(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                            <div style={{ width: 180 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: '#7C3AED', borderRadius: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Total</span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                        {form.terms && <div style={{ marginBottom: 12, padding: '8px 10px', background: '#F8FAFC', borderRadius: 6 }}><p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Syarat & Ketentuan</p><p style={{ margin: 0, fontSize: 10 }}>{form.terms}</p></div>}
                        {form.closing && <p style={{ fontSize: 11, color: '#374151', marginBottom: 20 }}>{form.closing}</p>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ textAlign: 'center', width: 140 }}>
                                <p style={{ margin: '0 0 48px', fontSize: 11 }}>Hormat Kami,</p>
                                <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{form.signerName || '...............'}</p>
                                    {form.signerTitle && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{form.signerTitle}</p>}
                                </div>
                            </div>
                        </div>
                        {!isPro && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 16 }}>Generated by MyInvoice.space</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
