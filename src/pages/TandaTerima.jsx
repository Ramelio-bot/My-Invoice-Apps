import { useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';

const KONDISI = [
    { value: 'Baik', color: '#10B981' },
    { value: 'Rusak', color: '#EF4444' },
    { value: 'Kurang', color: '#F59E0B' },
    { value: 'Perlu Cek', color: '#3B82F6' },
];

const emptyItem = () => ({ id: Date.now(), name: '', qty: 1, unit: 'pcs', kondisi: 'Baik', note: '' });

export default function TandaTerima() {
    const { dark } = useTheme();
    const { showToast } = useToast();
    const { isPro, checkDownloadLimit, incrementDownload } = usePlan();

    const [form, setForm] = useState({
        number: peekDocNumber('ttr'),
        date: todayStr(),
        fromName: '', fromTitle: '', fromCompany: '',
        toName: '', toTitle: '', toCompany: '',
        items: [emptyItem()],
        notes: '',
    });

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const updateItem = (id, key, val) => setForm(f => ({
        ...f,
        items: f.items.map(i => i.id === id ? { ...i, [key]: val } : i)
    }));

    const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (id) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai. Upgrade PRO!', 'warning'); return; }
        try {
            await generatePDF('ttr-preview', `TandaTerima-${form.number}.pdf`, isPro);
            incrementDownload();
            showToast('PDF berhasil diunduh', 'success');
        } catch { showToast('Gagal mengunduh PDF', 'error'); }
    };

    const kondisiColor = (k) => KONDISI.find(c => c.value === k)?.color || '#64748B';

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Tanda Terima</h1>
                <button onClick={handleDownloadPDF} className="btn btn-primary"><Download size={15} /> Download PDF</button>
            </div>

            <div className="split-layout">
                {/* Form */}
                <div>
                    <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                            <div>
                                <label className="label">Nomor</label>
                                <input className="input" value={form.number} onChange={e => setField('number', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Tanggal</label>
                                <input type="date" className="input" value={form.date} onChange={e => setField('date', e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* Diserahkan Oleh */}
                            <div style={{ padding: 14, background: '#F0F9FF', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>Diserahkan Oleh</h4>
                                {[
                                    { key: 'fromName', label: 'Nama' },
                                    { key: 'fromTitle', label: 'Jabatan' },
                                    { key: 'fromCompany', label: 'Perusahaan' },
                                ].map(f => (
                                    <div key={f.key} className="form-group" style={{ marginBottom: 10 }}>
                                        <label className="label">{f.label}</label>
                                        <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                            {/* Diterima Oleh */}
                            <div style={{ padding: 14, background: '#F0FFF4', borderRadius: 10, borderLeft: '4px solid #10B981' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#10B981' }}>Diterima Oleh</h4>
                                {[
                                    { key: 'toName', label: 'Nama' },
                                    { key: 'toTitle', label: 'Jabatan' },
                                    { key: 'toCompany', label: 'Perusahaan' },
                                ].map(f => (
                                    <div key={f.key} className="form-group" style={{ marginBottom: 10 }}>
                                        <label className="label">{f.label}</label>
                                        <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="card" style={{ animation: 'none' }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Daftar Barang</h3>
                        {form.items.map(item => (
                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 80px 100px 1fr 36px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                                <input className="input" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Nama Barang" style={{ fontSize: 13 }} />
                                <input className="input" type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ fontSize: 13, textAlign: 'center' }} />
                                <input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ fontSize: 13 }} placeholder="satuan" />
                                <select className="select" value={item.kondisi} onChange={e => updateItem(item.id, 'kondisi', e.target.value)} style={{ fontSize: 12 }}>
                                    {KONDISI.map(k => <option key={k.value} value={k.value}>{k.value}</option>)}
                                </select>
                                <input className="input" value={item.note} onChange={e => updateItem(item.id, 'note', e.target.value)} placeholder="Keterangan" style={{ fontSize: 13 }} />
                                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                        <button onClick={addItem} className="btn btn-sm btn-outline" style={{ marginTop: 8 }}>
                            <Plus size={14} /> Tambah Barang
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div style={{ position: 'sticky', top: 80 }}>
                    <div id="ttr-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '2px solid #E2E8F0' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #E2E8F0', paddingBottom: 16 }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1E293B', letterSpacing: 2, textTransform: 'uppercase' }}>Tanda Terima Barang</h2>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>No: {form.number} | {formatDateID(form.date)}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                            {[
                                { title: 'Diserahkan Oleh', name: form.fromName, title2: form.fromTitle, company: form.fromCompany, color: '#3B82F6' },
                                { title: 'Diterima Oleh', name: form.toName, title2: form.toTitle, company: form.toCompany, color: '#10B981' },
                            ].map(p => (
                                <div key={p.title} style={{ padding: '10px 14px', borderLeft: `3px solid ${p.color}`, background: '#F8FAFC' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: p.color, textTransform: 'uppercase' }}>{p.title}</p>
                                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700 }}>{p.name || '—'}</p>
                                    {p.title2 && <p style={{ margin: '0 0 1px', fontSize: 11, color: '#64748B' }}>{p.title2}</p>}
                                    {p.company && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{p.company}</p>}
                                </div>
                            ))}
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 11 }}>
                            <thead>
                                <tr style={{ background: '#1E293B' }}>
                                    {['No', 'Nama Barang', 'Jumlah', 'Satuan', 'Kondisi', 'Keterangan'].map(h => (
                                        <th key={h} style={{ padding: '7px 8px', color: 'white', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.filter(i => i.name).map((item, idx) => (
                                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}>
                                        <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{item.name}</td>
                                        <td style={{ padding: '6px 8px' }}>{item.qty}</td>
                                        <td style={{ padding: '6px 8px' }}>{item.unit}</td>
                                        <td style={{ padding: '6px 8px' }}>
                                            <span style={{ color: kondisiColor(item.kondisi), fontWeight: 700 }}>{item.kondisi}</span>
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>{item.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Dual signature */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                            {[
                                { label: 'Yang Menyerahkan', name: form.fromName, title: form.fromTitle },
                                { label: 'Yang Menerima', name: form.toName, title: form.toTitle },
                            ].map(sig => (
                                <div key={sig.label} style={{ textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 60px', fontSize: 11 }}>{sig.label}</p>
                                    <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{sig.name || '.....................'}</p>
                                        {sig.title && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{sig.title}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!isPro && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
