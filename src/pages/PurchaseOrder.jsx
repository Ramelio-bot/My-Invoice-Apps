import { useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';

const emptyItem = () => ({ id: Date.now(), no: '', desc: '', qty: 1, unit: 'pcs', price: 0, total: 0 });
const PAYMENT_TERMS = ['COD', 'NET 7', 'NET 14', 'NET 30', 'DP 50% + Pelunasan'];

export default function PurchaseOrder() {
    const { dark } = useTheme();
    const { showToast } = useToast();
    const { isPro, checkDownloadLimit, incrementDownload } = usePlan();

    const [form, setForm] = useState({
        number: peekDocNumber('po'),
        poDate: todayStr(), deliveryDate: '',
        paymentTerms: 'NET 30',
        vendorName: '', vendorAddress: '', vendorPhone: '', vendorEmail: '',
        shipToName: '', shipToAddress: '', shipToPhone: '',
        items: [emptyItem()],
        ppn: true, notes: '',
        approverName: '', approverTitle: '',
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
    const ppnAmt = form.ppn ? subtotal * 0.11 : 0;
    const grandTotal = subtotal + ppnAmt;

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai!', 'warning'); return; }
        try {
            await generatePDF('po-preview', `PO-${form.number}.pdf`, isPro);
            incrementDownload();
            showToast('PDF berhasil diunduh', 'success');
        } catch { showToast('Gagal mengunduh PDF', 'error'); }
    };

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Purchase Order</h1>
                <button onClick={handleDownloadPDF} className="btn btn-primary"><Download size={15} /> Download PDF</button>
            </div>

            <div className="split-layout">
                {/* Form */}
                <div>
                    <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                            {[
                                { key: 'number', label: 'Nomor PO' },
                                { key: 'poDate', label: 'Tanggal PO', type: 'date' },
                                { key: 'deliveryDate', label: 'Tanggal Pengiriman', type: 'date' },
                            ].map(f => (
                                <div key={f.key} style={{ gridColumn: f.key === 'number' ? '1 / -1' : 'auto' }}>
                                    <label className="label">{f.label}</label>
                                    <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                </div>
                            ))}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="label">Payment Terms</label>
                                <select className="select" value={form.paymentTerms} onChange={e => setField('paymentTerms', e.target.value)}>
                                    {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ padding: 14, background: '#FFF7ED', borderRadius: 10, borderLeft: '4px solid #F59E0B' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#D97706' }}>Vendor / Supplier</h4>
                                {[
                                    { key: 'vendorName', label: 'Nama' },
                                    { key: 'vendorAddress', label: 'Alamat' },
                                    { key: 'vendorPhone', label: 'Telepon' },
                                    { key: 'vendorEmail', label: 'Email', type: 'email' },
                                ].map(f => (
                                    <div key={f.key} className="form-group" style={{ marginBottom: 8 }}>
                                        <label className="label">{f.label}</label>
                                        <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: 14, background: '#F0F9FF', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#2563EB' }}>Ship To / Dikirim Ke</h4>
                                {[
                                    { key: 'shipToName', label: 'Nama' },
                                    { key: 'shipToAddress', label: 'Alamat' },
                                    { key: 'shipToPhone', label: 'Telepon' },
                                ].map(f => (
                                    <div key={f.key} className="form-group" style={{ marginBottom: 8 }}>
                                        <label className="label">{f.label}</label>
                                        <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Item Pembelian</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                                <thead>
                                    <tr>
                                        {['Deskripsi', 'Qty', 'Satuan', 'Harga', 'Total', ''].map(h => (
                                            <th key={h} style={{ padding: '6px 8px', fontSize: 10, fontWeight: 700, color: '#64748B', borderBottom: '1.5px solid #E2E8F0', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ padding: '4px 4px' }}><input className="input" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} placeholder="Deskripsi" style={{ fontSize: 12 }} /></td>
                                            <td style={{ padding: '4px 4px', width: 60 }}><input className="input" type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} /></td>
                                            <td style={{ padding: '4px 4px', width: 70 }}><input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ fontSize: 12 }} /></td>
                                            <td style={{ padding: '4px 4px', width: 110 }}><input className="input" type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ fontSize: 12, textAlign: 'right' }} /></td>
                                            <td style={{ padding: '4px 8px', fontWeight: 700, fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatIDR(item.total)}</td>
                                            <td><button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={addItem} className="btn btn-sm btn-outline" style={{ marginTop: 10 }}><Plus size={14} /> Tambah Item</button>

                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.ppn} onChange={e => setField('ppn', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                                <span style={{ fontWeight: 600 }}>PPN 11%</span>
                            </label>
                            <div style={{ width: 220 }}>
                                {[
                                    ['Subtotal', formatIDR(subtotal)],
                                    ...(form.ppn ? [['PPN 11%', `+ ${formatIDR(ppnAmt)}`]] : []),
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

                    <div className="card" style={{ animation: 'none' }}>
                        {[
                            { key: 'notes', label: 'Catatan', textarea: true },
                            { key: 'approverName', label: 'Disetujui Oleh' },
                            { key: 'approverTitle', label: 'Jabatan Penyetuju' },
                        ].map(f => (
                            <div key={f.key} className="form-group">
                                <label className="label">{f.label}</label>
                                {f.textarea ?
                                    <textarea className="textarea" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} /> :
                                    <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                }
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                <div style={{ position: 'sticky', top: 80 }}>
                    <div id="po-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #E2E8F0' }}>
                            <div>
                                <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: 1 }}>Purchase Order</h1>
                                <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>No: {form.number}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: '0 0 2px', fontSize: 11 }}>Tgl PO: {formatDateID(form.poDate)}</p>
                                {form.deliveryDate && <p style={{ margin: '0 0 2px', fontSize: 11 }}>Pengiriman: {formatDateID(form.deliveryDate)}</p>}
                                <span style={{ display: 'inline-block', padding: '2px 8px', background: '#EDE9FE', color: '#7C3AED', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>{form.paymentTerms}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            {[
                                { label: 'Vendor', name: form.vendorName, addr: form.vendorAddress, phone: form.vendorPhone, color: '#F59E0B' },
                                { label: 'Ship To', name: form.shipToName, addr: form.shipToAddress, phone: form.shipToPhone, color: '#3B82F6' },
                            ].map(p => (
                                <div key={p.label} style={{ padding: '10px', borderLeft: `3px solid ${p.color}`, background: '#F8FAFC' }}>
                                    <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, color: p.color, textTransform: 'uppercase' }}>{p.label}</p>
                                    <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700 }}>{p.name || '—'}</p>
                                    {p.addr && <p style={{ margin: '0 0 1px', fontSize: 10, color: '#64748B' }}>{p.addr}</p>}
                                    {p.phone && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{p.phone}</p>}
                                </div>
                            ))}
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 10 }}>
                            <thead>
                                <tr style={{ background: '#1E293B' }}>
                                    {['No', 'Deskripsi', 'Qty', 'Satuan', 'Harga', 'Total'].map(h => (
                                        <th key={h} style={{ padding: '6px 8px', color: 'white', textAlign: 'left', fontSize: 9, fontWeight: 700 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.filter(i => i.desc).map((item, idx) => (
                                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}>
                                        <td style={{ padding: '5px 8px' }}>{idx + 1}</td>
                                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{item.desc}</td>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <span style={{ fontSize: 10, color: '#64748B' }}>Subtotal</span>
                                    <span style={{ fontSize: 10 }}>{formatIDR(subtotal)}</span>
                                </div>
                                {form.ppn && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                    <span style={{ fontSize: 10, color: '#64748B' }}>PPN 11%</span>
                                    <span style={{ fontSize: 10 }}>+ {formatIDR(ppnAmt)}</span>
                                </div>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#1E293B', borderRadius: 6, marginTop: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Total</span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                        {form.notes && <p style={{ fontSize: 10, color: '#64748B', margin: '0 0 16px' }}>Catatan: {form.notes}</p>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <div style={{ textAlign: 'center', width: 140 }}>
                                <p style={{ margin: '0 0 48px', fontSize: 10 }}>Disetujui oleh,</p>
                                <div style={{ borderTop: '1px solid #000', paddingTop: 4 }}>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>{form.approverName || '...'}</p>
                                    {form.approverTitle && <p style={{ margin: 0, fontSize: 9, color: '#64748B' }}>{form.approverTitle}</p>}
                                </div>
                            </div>
                        </div>
                        {!isPro && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 9, marginTop: 16 }}>Generated by MyInvoice.space</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
