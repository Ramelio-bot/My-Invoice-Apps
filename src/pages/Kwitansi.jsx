import { useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber } from '../utils/docNumber';
import { terbilang } from '../utils/terbilang';
import { generatePDF } from '../utils/pdf';

export default function Kwitansi() {
    const { dark } = useTheme();
    const { showToast } = useToast();
    const { isPro, checkDownloadLimit, incrementDownload } = usePlan();
    const [list, setList] = useLocalStorage('kwitansi_data', []);

    const [form, setForm] = useState({
        number: peekDocNumber('kwitansi'),
        date: todayStr(),
        receivedFrom: '',
        amount: '',
        description: '',
        receiverName: '',
        receiverTitle: '',
        signature: null,
        stamp: null,
    });

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const amountNum = parseFloat(String(form.amount).replace(/[^\d]/g, '')) || 0;
    const terbilangText = amountNum > 0 ? terbilang(amountNum) : '—';

    const handleSave = () => {
        if (!form.receivedFrom || !amountNum) {
            showToast('Diterima dari dan jumlah wajib diisi', 'error');
            return;
        }
        const entry = { id: Date.now().toString(), ...form, amount: amountNum, createdAt: new Date().toISOString() };
        setList(prev => [entry, ...prev]);
        showToast('Kwitansi tersimpan', 'success');
    };

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai. Upgrade PRO!', 'warning'); return; }
        try {
            await generatePDF('kwitansi-preview', `Kwitansi-${form.number}.pdf`, isPro);
            incrementDownload();
            showToast('PDF berhasil diunduh', 'success');
        } catch { showToast('Gagal mengunduh PDF', 'error'); }
    };

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Kwitansi</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleSave} className="btn btn-outline">Simpan</button>
                    <button onClick={handleDownloadPDF} className="btn btn-primary"><Download size={15} /> Download PDF</button>
                </div>
            </div>

            <div className="split-layout">
                {/* Form */}
                <div>
                    <div className="card" style={{ animation: 'none' }}>
                        {[
                            { key: 'number', label: 'Nomor Kwitansi' },
                            { key: 'date', label: 'Tanggal', type: 'date' },
                            { key: 'receivedFrom', label: 'Diterima Dari' },
                            { key: 'description', label: 'Untuk Pembayaran' },
                            { key: 'receiverName', label: 'Nama Penerima' },
                            { key: 'receiverTitle', label: 'Jabatan Penerima' },
                        ].map(f => (
                            <div key={f.key} className="form-group">
                                <label className="label">{f.label}</label>
                                <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                            </div>
                        ))}

                        <div className="form-group">
                            <label className="label">Jumlah (Rp)</label>
                            <input
                                className="input"
                                value={form.amount}
                                onChange={e => {
                                    const num = e.target.value.replace(/[^\d]/g, '');
                                    setField('amount', num ? new Intl.NumberFormat('id-ID').format(parseInt(num)) : '');
                                }}
                                placeholder="0"
                                style={{ fontSize: 22, fontWeight: 800, textAlign: 'right' }}
                            />
                        </div>

                        <div style={{ padding: '12px 14px', background: '#F5F3FF', borderRadius: 10, marginBottom: 16 }}>
                            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>Terbilang</p>
                            <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: '#374151' }}>{terbilangText}</p>
                        </div>

                        <div className="form-group">
                            <label className="label">Upload Tanda Tangan (opsional)</label>
                            <input type="file" accept="image/*" className="input" style={{ padding: '8px' }}
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) { const reader = new FileReader(); reader.onload = ev => setField('signature', ev.target.result); reader.readAsDataURL(file); }
                                }} />
                        </div>
                        <div className="form-group">
                            <label className="label">Upload Stempel (opsional)</label>
                            <input type="file" accept="image/*" className="input" style={{ padding: '8px' }}
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) { const reader = new FileReader(); reader.onload = ev => setField('stamp', ev.target.result); reader.readAsDataURL(file); }
                                }} />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div style={{ position: 'sticky', top: 80 }}>
                    <div id="kwitansi-preview" style={{
                        background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif',
                        padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                        border: '2px solid #7C3AED',
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px dashed #E2E8F0', paddingBottom: 16 }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#7C3AED', letterSpacing: 2, textTransform: 'uppercase' }}>Kwitansi</h2>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>No: {form.number}</p>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                            <tbody>
                                {[
                                    ['Tanggal', formatDateID(form.date)],
                                    ['Diterima dari', form.receivedFrom || '—'],
                                    ['Jumlah', <strong style={{ color: '#7C3AED' }}>{formatIDR(amountNum)}</strong>],
                                    ['Terbilang', <em>{terbilangText}</em>],
                                    ['Untuk', form.description || '—'],
                                ].map(([label, val]) => (
                                    <tr key={label}>
                                        <td style={{ padding: '6px 12px 6px 0', fontSize: 13, fontWeight: 600, color: '#374151', width: 140, verticalAlign: 'top' }}>{label}</td>
                                        <td style={{ padding: '6px 0', fontSize: 13 }}>: {val}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ textAlign: 'center', width: 160 }}>
                                <p style={{ margin: '0 0 60px', fontSize: 12 }}>{form.receiverName ? `Hormat Kami,` : 'Hormat Kami,'}</p>
                                {form.signature && <img src={form.signature} alt="ttd" style={{ maxWidth: 120, maxHeight: 60, objectFit: 'contain', marginBottom: 4 }} />}
                                {form.stamp && <img src={form.stamp} alt="stempel" style={{ maxWidth: 80, maxHeight: 80, objectFit: 'contain', position: 'absolute', marginLeft: -90, marginTop: -60, opacity: 0.7 }} />}
                                <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{form.receiverName || '...'}</p>
                                    {form.receiverTitle && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.receiverTitle}</p>}
                                </div>
                            </div>
                        </div>

                        {!isPro && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
