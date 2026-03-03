import { useState } from 'react';
import { Plus, Trash2, Download, RotateCcw, Eye, Pencil, Clock, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { useAuth } from '../context/AuthContext';

const KONDISI = [
    { value: 'Baik', color: '#10B981' },
    { value: 'Rusak', color: '#EF4444' },
    { value: 'Kurang', color: '#F59E0B' },
    { value: 'Perlu Cek', color: '#3B82F6' },
];

const emptyItem = () => ({ id: Date.now(), name: '', qty: 1, unit: 'pcs', kondisi: 'Baik', note: '' });

const defaultForm = () => ({
    number: peekDocNumber('ttr'),
    date: todayStr(),
    fromName: '', fromTitle: '', fromCompany: '',
    toName: '', toTitle: '', toCompany: '',
    items: [emptyItem()],
    notes: '',
});

export default function TandaTerima() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const { showToast } = useToast();
    const { isPro, checkDownloadLimit, incrementDownload } = usePlan();
    const { effectivePlan, isAdmin } = useAuth();
    const { logo } = useCompanyLogo();
    const [list, setList] = useLocalStorage('ttr_data', []);
    const navigate = typeof window !== 'undefined' ? (p) => window.location.href = p : () => { };

    const [form, setForm] = useLocalStorage('draft_tandaterima', defaultForm());
    const [activeTab, setActiveTab] = useState('form');
    const [previewItem, setPreviewItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const isPlanPro = ['pro', 'ultimate'].includes(effectivePlan) || isAdmin;
    if (!isPlanPro) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
                <span className="text-6xl mb-4">📦</span>
                <h2 className="text-xl font-bold mb-2 dark:text-white">Tanda Terima — Fitur PRO</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Buat dokumen tanda terima profesional dengan upgrade ke PRO.</p>
                <button onClick={() => window.location.href = '/upgrade'} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    ⭐ Upgrade ke PRO — Rp 99.000/bln
                </button>
            </div>
        );
    }

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const updateItem = (id, key, val) => setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? { ...i, [key]: val } : i) }));
    const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (id) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

    const handleReset = () => {
        setForm(defaultForm());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Form berhasil direset', 'success');
    };

    const handleSave = () => {
        const entry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() };
        setList(prev => {
            const exists = prev.find(i => i.number === form.number);
            if (exists) return prev.map(i => i.number === form.number ? entry : i);
            return [entry, ...prev];
        });
        incrementDocNumber('ttr');
        showToast('Tanda Terima tersimpan', 'success');
    };

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai. Upgrade PRO!', 'warning'); return; }
        try {
            await generatePDF('ttr-preview', `TandaTerima-${form.number}.pdf`, isPro);
            incrementDownload();
            showToast('PDF berhasil diunduh', 'success');
        } catch { showToast('Gagal mengunduh PDF', 'error'); }
    };

    const handleEditHistory = (item) => {
        setForm({ ...item });
        setActiveTab('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleDeleteHistory = (id) => {
        setList(prev => prev.filter(i => i.id !== id));
        showToast('Dokumen dihapus', 'info');
        setDeleteConfirm(null);
    };

    const kondisiColor = (k) => KONDISI.find(c => c.value === k)?.color || '#64748B';

    // === PLAN GUARD === PRO/ULTIMATE only
    if (effectivePlan === 'free' && !isAdmin) {
        return (
            <div style={{ padding: 40, maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B', marginBottom: 8 }}>
                    {lang === 'EN' ? 'Receipt Form — PRO Feature' : 'Tanda Terima — Fitur PRO'}
                </h2>
                <p style={{ color: dark ? '#94A3B8' : '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
                    {lang === 'EN'
                        ? 'Create professional delivery / goods receipts with PDF export.'
                        : 'Buat tanda terima barang profesional dengan ekspor PDF.'
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
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>Tanda Terima</h1>
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
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.fromName || '—'} → {item.toName || '—'}</p>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12, color: '#64748B', flex: 1, minWidth: 90 }}>{item.date}</p>
                                    <p style={{ margin: 0, fontSize: 12, color: '#7C3AED', fontWeight: 700, flex: 1 }}>{item.items?.filter(i => i.name).length || 0} item</p>
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
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>Hapus Tanda Terima?</h3>
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
                return (
                    <div
                        onClick={e => { if (e.target === e.currentTarget) setPreviewItem(null); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, overflowY: 'auto' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '24px 16px' }}>
                            <div style={{ background: 'white', color: '#000', borderRadius: 16, width: '95vw', maxWidth: 1000, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'scaleIn 180ms cubic-bezier(0.4,0,0.2,1) forwards' }}>
                                {/* Sticky header */}
                                <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px 16px 0 0' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#1E293B' }}>TANDA TERIMA BARANG</h2>
                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>No: {item.number} &middot; {formatDateID(item.date)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button onClick={() => { setPreviewItem(null); handleEditHistory(item); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Pencil size={13} /> Edit</button>
                                        <button onClick={async () => { try { await generatePDF('ttr-prev-' + item.id, `TR-${item.number}.pdf`, isPro); } catch { } }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1E293B', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Download size={13} /> PDF</button>
                                        <button onClick={() => setPreviewItem(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748B" /></button>
                                    </div>
                                </div>
                                {/* Hidden PDF body */}
                                <div id={`ttr-prev-${item.id}`} style={{ position: 'fixed', left: '-9999px', top: 0, width: 794, background: 'white', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, zIndex: -1 }}>
                                    <h2 style={{ margin: '0 0 4px' }}>TANDA TERIMA BARANG</h2>
                                    <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 12 }}>No: {item.number} | {formatDateID(item.date)}</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                        {[{ title: 'Dari', name: item.fromName, co: item.fromCompany, title2: item.fromTitle }, { title: 'Kepada', name: item.toName, co: item.toCompany, title2: item.toTitle }].map(p => (<div key={p.title}><strong>{p.title}:</strong> {p.name} {p.title2 && `(${p.title2})`} {p.co && `- ${p.co}`}</div>))}
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ background: '#1E293B' }}>{['No', 'Nama Barang', 'Qty', 'Sat', 'Kondisi', 'Keterangan'].map(h => <th key={h} style={{ padding: '6px 8px', color: 'white', fontSize: 10, textAlign: 'left' }}>{h}</th>)}</tr></thead><tbody>{(item.items || []).filter(i => i.name).map((i, idx) => <tr key={idx}><td style={{ padding: '5px 8px', fontSize: 11 }}>{idx + 1}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.name}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.qty}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.unit}</td><td style={{ padding: '5px 8px', fontSize: 11, color: kondisiColor(i.kondisi) }}>{i.kondisi}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{i.note}</td></tr>)}</tbody></table>
                                </div>
                                {/* Preview body */}
                                <div style={{ padding: '20px 28px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                        {[{ title: 'Diserahkan Oleh', name: item.fromName, company: item.fromCompany, jobTitle: item.fromTitle, color: '#3B82F6' }, { title: 'Diterima Oleh', name: item.toName, company: item.toCompany, jobTitle: item.toTitle, color: '#10B981' }].map(p => (
                                            <div key={p.title} style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, borderLeft: `3px solid ${p.color}` }}>
                                                <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: p.color, textTransform: 'uppercase' }}>{p.title}</p>
                                                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#1E293B' }}>{p.name || '—'}</p>
                                                {p.jobTitle && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{p.jobTitle}</p>}
                                                {p.company && <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{p.company}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr style={{ background: '#1E293B' }}>{['No', 'Nama Barang', 'Qty', 'Satuan', 'Kondisi', 'Keterangan'].map(h => <th key={h} style={{ padding: '8px 12px', color: 'white', fontSize: 11, textAlign: 'left', fontWeight: 700 }}>{h}</th>)}</tr></thead>
                                        <tbody>{(item.items || []).filter(i => i.name).map((i, idx) => (<tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}><td style={{ padding: '8px 12px', fontSize: 13 }}>{idx + 1}</td><td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{i.name}</td><td style={{ padding: '8px 12px', fontSize: 13 }}>{i.qty}</td><td style={{ padding: '8px 12px', fontSize: 13 }}>{i.unit}</td><td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: kondisiColor(i.kondisi) }}>{i.kondisi}</td><td style={{ padding: '8px 12px', fontSize: 12, color: '#64748B' }}>{i.note || '—'}</td></tr>))}</tbody>
                                    </table>
                                    {item.notes && <div style={{ marginTop: 14, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8 }}><p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Catatan</p><p style={{ margin: 0, fontSize: 13 }}>{item.notes}</p></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {
                activeTab === 'form' && (
                    <div className="split-layout">
                        {/* Form */}
                        <div>
                            <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="label">Logo Perusahaan</label>
                                    <LogoUpload size="sm" />
                                </div>
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
                                    <div style={{ padding: 14, background: dark ? '#0F172A' : '#F0F9FF', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
                                        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>Diserahkan Oleh</h4>
                                        {[{ key: 'fromName', label: 'Nama' }, { key: 'fromTitle', label: 'Jabatan' }, { key: 'fromCompany', label: 'Perusahaan' }].map(f => (
                                            <div key={f.key} className="form-group" style={{ marginBottom: 10 }}>
                                                <label className="label">{f.label}</label>
                                                <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: 14, background: dark ? '#0F172A' : '#F0FFF4', borderRadius: 10, borderLeft: '4px solid #10B981' }}>
                                        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#10B981' }}>Diterima Oleh</h4>
                                        {[{ key: 'toName', label: 'Nama' }, { key: 'toTitle', label: 'Jabatan' }, { key: 'toCompany', label: 'Perusahaan' }].map(f => (
                                            <div key={f.key} className="form-group" style={{ marginBottom: 10 }}>
                                                <label className="label">{f.label}</label>
                                                <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

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
                                    {logo && <img src={logo} alt="Logo" style={{ maxHeight: 72, maxWidth: 200, objectFit: 'contain', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />}
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
                                                <td style={{ padding: '6px 8px' }}><span style={{ color: kondisiColor(item.kondisi), fontWeight: 700 }}>{item.kondisi}</span></td>
                                                <td style={{ padding: '6px 8px' }}>{item.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                                    {[{ label: 'Yang Menyerahkan', name: form.fromName, title: form.fromTitle }, { label: 'Yang Menerima', name: form.toName, title: form.toTitle }].map(sig => (
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
                )
            }
        </div >
    );
}
