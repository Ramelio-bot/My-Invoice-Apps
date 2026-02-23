import { useState } from 'react';
import { Download, RotateCcw, Eye, Pencil, Trash2, Clock, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { terbilang } from '../utils/terbilang';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';

const defaultForm = () => ({
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

export default function Kwitansi() {
    const { dark } = useTheme();
    const { showToast } = useToast();
    const { isPro, checkDownloadLimit, incrementDownload } = usePlan();
    const { logo } = useCompanyLogo();
    const [list, setList] = useLocalStorage('kwitansi_data', []);

    const [form, setForm] = useState(defaultForm());
    const [activeTab, setActiveTab] = useState('form');
    const [previewItem, setPreviewItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const amountNum = parseFloat(String(form.amount).replace(/[^\d]/g, '')) || 0;
    const terbilangText = amountNum > 0 ? terbilang(amountNum) : '—';

    const handleReset = () => {
        setForm(defaultForm());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Form berhasil direset', 'success');
    };

    const handleSave = () => {
        if (!form.receivedFrom || !amountNum) {
            showToast('Diterima dari dan jumlah wajib diisi', 'error');
            return;
        }
        const entry = { id: Date.now().toString(), ...form, amount: amountNum, createdAt: new Date().toISOString() };
        setList(prev => {
            const exists = prev.find(i => i.number === form.number);
            if (exists) return prev.map(i => i.number === form.number ? entry : i);
            return [entry, ...prev];
        });
        incrementDocNumber('kwitansi');
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

    const handleEditHistory = (item) => {
        setForm({ ...item, amount: String(item.amount) });
        setActiveTab('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteHistory = (id) => {
        setList(prev => prev.filter(i => i.id !== id));
        showToast('Kwitansi dihapus', 'info');
        setDeleteConfirm(null);
    };

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Kwitansi</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {activeTab === 'form' && (
                        <>
                            <button onClick={handleReset} className="btn btn-outline-danger"><RotateCcw size={15} /> Reset</button>
                            <button onClick={handleSave} className="btn btn-outline">Simpan</button>
                            <button onClick={handleDownloadPDF} className="btn btn-primary"><Download size={15} /> Download PDF</button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${dark ? '#334155' : '#E2E8F0'}` }}>
                {[{ key: 'form', label: 'Form Baru' }, { key: 'history', label: 'Riwayat', icon: Clock }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #7C3AED' : '2px solid transparent', color: activeTab === tab.key ? '#7C3AED' : (dark ? '#94A3B8' : '#64748B'), marginBottom: -2, transition: 'color 200ms' }}>
                        {tab.icon && <tab.icon size={14} />}
                        {tab.label}
                        {tab.key === 'history' && list.length > 0 && <span style={{ background: '#7C3AED', color: 'white', borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{list.length}</span>}
                    </button>
                ))}
            </div>

            {/* Riwayat */}
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
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.receivedFrom || '—'}</p>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: '#64748B', flex: 1, minWidth: 90 }}>{item.date}</p>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#7C3AED', flex: 1, minWidth: 110 }}>{formatIDR(item.amount || 0)}</p>
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

            {/* Delete confirm */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: dark ? '#1E293B' : 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Hapus Kwitansi?</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>Dokumen ini akan dihapus permanen.</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Batal</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview modal — centered, full detail */}
            {previewItem && (() => {
                const item = previewItem;
                const amt = item.amount || 0;
                return (
                    <div
                        onClick={e => { if (e.target === e.currentTarget) setPreviewItem(null); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, overflowY: 'auto' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '20px 16px' }}>
                            <div style={{ background: 'white', color: '#000', borderRadius: 16, width: '95vw', maxWidth: 900, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'scaleIn 180ms cubic-bezier(0.4,0,0.2,1) forwards' }}>
                                {/* Sticky header */}
                                <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, borderRadius: '16px 16px 0 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#7C3AED', letterSpacing: 1 }}>KWITANSI</h2>
                                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>No: {item.number}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button onClick={() => { setPreviewItem(null); handleEditHistory(item); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Pencil size={13} /> Edit</button>
                                        <button onClick={async () => { try { await generatePDF('kwt-prev-' + item.id, `Kwitansi-${item.number}.pdf`, isPro); } catch { } }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#7C3AED', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Download size={13} /> PDF</button>
                                        <button onClick={() => setPreviewItem(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} color="#64748B" /></button>
                                    </div>
                                </div>

                                {/* Hidden PDF target */}
                                <div id={`kwt-prev-${item.id}`} style={{ position: 'fixed', left: '-9999px', top: 0, width: 794, background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, zIndex: -1, border: '2px solid #7C3AED', borderRadius: 8 }}>
                                    <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px dashed #E2E8F0', paddingBottom: 12 }}>
                                        <h2 style={{ margin: '0 0 4px', color: '#7C3AED', fontWeight: 900, fontSize: 22 }}>KWITANSI</h2>
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>No: {item.number}</p>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {[['Tanggal', formatDateID(item.date)], ['Diterima dari', item.receivedFrom], ['Jumlah', formatIDR(amt)], ['Terbilang', terbilang(amt)], ['Untuk', item.description]].map(([l, v]) => (
                                                <tr key={l}><td style={{ padding: '5px 10px 5px 0', fontSize: 13, fontWeight: 600, color: '#374151', width: 140 }}>{l}</td><td style={{ padding: '5px 0', fontSize: 13 }}>: {v}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
                                        <div style={{ textAlign: 'center', width: 160 }}>
                                            <p style={{ margin: '0 0 60px', fontSize: 12 }}>Hormat Kami,</p>
                                            <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{item.receiverName || '...'}</p></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview body */}
                                <div style={{ padding: '24px 28px' }}>
                                    <div style={{ background: '#F5F3FF', borderRadius: 10, border: '2px dashed #7C3AED', padding: '16px 20px', marginBottom: 20 }}>
                                        <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1 }}>Jumlah</p>
                                        <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(amt)}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 12, fontStyle: 'italic', color: '#64748B' }}>{terbilang(amt)}</p>
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {[
                                                ['Nomor', item.number],
                                                ['Tanggal', formatDateID(item.date)],
                                                ['Diterima dari', item.receivedFrom],
                                                ['Untuk', item.description],
                                                ['Penerima', item.receiverName],
                                                ['Jabatan', item.receiverTitle],
                                            ].filter(([, v]) => v).map(([l, v]) => (
                                                <tr key={l} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '8px 12px 8px 0', fontSize: 13, fontWeight: 600, color: '#64748B', width: 140 }}>{l}</td>
                                                    <td style={{ padding: '8px 0', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>: {v}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Form tab */}
            {
                activeTab === 'form' && (
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

                                <div style={{ padding: '12px 14px', background: dark ? '#0F172A' : '#F5F3FF', borderRadius: 10, marginBottom: 16 }}>
                                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>Terbilang</p>
                                    <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: dark ? '#CBD5E1' : '#374151' }}>{terbilangText}</p>
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
                                <div className="form-group">
                                    <label className="label">Logo Perusahaan</label>
                                    <LogoUpload size="sm" />
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div style={{ position: 'sticky', top: 80 }}>
                            <div id="kwitansi-preview" style={{
                                background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif',
                                padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                                border: '2px solid #7C3AED',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {logo && (
                                    <img src={logo} alt="" aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', maxWidth: 300, objectFit: 'contain', opacity: 0.08, pointerEvents: 'none', zIndex: 0 }} />
                                )}
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
                                        <p style={{ margin: '0 0 60px', fontSize: 12 }}>Hormat Kami,</p>
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
                )
            }
        </div >
    );
}
