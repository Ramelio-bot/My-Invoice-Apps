import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, RotateCcw, Eye, Pencil, Clock, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatDateID, todayStr } from '../utils/date';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LimitModal from '../components/LimitModal';

const KONDISI = [
    { value: 'Baik', color: '#10B981' },
    { value: 'Rusak', color: '#EF4444' },
    { value: 'Kurang', color: '#F59E0B' },
    { value: 'Perlu Cek', color: '#3B82F6' },
];

const kondisiColor = (val) => KONDISI.find(k => k.value === val)?.color || '#64748B';

const emptyItem = () => ({ id: Date.now(), name: '', qty: '', unit: 'pcs', kondisi: 'Baik', note: '' });

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
    const { lang, t } = useLang();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkTandaTerimaLimit, incrementTandaTerima, refreshUsage, getTandaTerimaCount
    } = usePlan();
    const { effectivePlan, isAdmin, user } = useAuth();
    const { logo } = useCompanyLogo();
    const [list, setList] = useState([]); // Removed useLocalStorage
    const navigate = typeof window !== 'undefined' ? (p) => window.location.href = p : () => { };

    const [form, setForm] = useLocalStorage('draft_tandaterima', defaultForm());
    const [activeTab, setActiveTab] = useState('form');

    const fetchData = async () => {
        if (!user) return;
        const { data } = await supabase.from('receipts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (data) {
            const mapped = data.map(d => {
                const json = typeof d.data === 'string' ? JSON.parse(d.data) : d.data;
                return {
                    ...d,
                    ...json,
                    number: d.doc_number || json?.number,
                    fromName: json?.fromName,
                    toName: json?.toName || d.client_name,
                    date: json?.date || d.created_at?.split('T')[0]
                };
            });
            setList(mapped);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);
    const [previewItem, setPreviewItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);




    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const updateItem = (id, key, val) => setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? { ...i, [key]: val } : i) }));
    const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (id) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

    const handleReset = () => {
        setForm(defaultForm());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(t('doc_reset_toast'), 'success');
    };

    const handleSave = async () => {
        if (effectivePlan === 'free' && !isAdmin && getTandaTerimaCount() >= 5) {
            setShowLimitModal(true);
            return;
        }
        const entry = {
            user_id: user.id,
            doc_number: form.number,
            client_name: form.toName || form.toCompany,
            total_amount: 0,
            data: { ...form, lang } // date, items, lang tersimpan di dalam data
        };

        // Limit checking for FREE users
        if (!isPro && !checkTandaTerimaLimit()) {
            showToast(t('ttr_limit'), 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const exists = list.find(i => i.doc_number === form.number || i.number === form.number);
            if (exists) {
                const { error } = await supabase.from('receipts').update(entry).eq('id', exists.id);
                if (!error) {
                    showToast(t('ttr_updated'), 'success');
                    await fetchData();
                } else {
                    showToast(t('doc_save_error') || 'Gagal menyimpan, coba lagi.', 'error');
                    console.error('TTR update error:', error);
                }
            } else {
                const { data: saved, error } = await supabase.from('receipts').insert(entry).select().single();
                if (saved && !error) {
                    showToast(t('ttr_saved'), 'success');
                    incrementTandaTerima();
                    incrementDocNumber('ttr');
                    await fetchData();
                } else {
                    showToast(t('doc_save_error') || 'Gagal menyimpan, coba lagi.', 'error');
                    console.error('TTR insert error:', error);
                }
            }
        } catch (err) {
            showToast(t('doc_save_error') || 'Terjadi kesalahan, coba lagi.', 'error');
            console.error('TTR save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast(t('hpp_toast_download_limit'), 'warning'); return; }
        setIsDownloading(true);
        try {
            await generatePDF('ttr-preview', `TandaTerima-${form.number}.pdf`, isPremium);
            incrementDownload('ttr', form.number, 0, form.clientName);
            showToast(t('doc_pdf_success'), 'success');
        } catch { showToast(t('doc_pdf_fail'), 'error'); } finally {
            setIsDownloading(false);
        }
    };

    const handleEditHistory = (item) => {
        // item already has all fields spread from JSONB data in fetchData
        setForm({ ...item });
        setActiveTab('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleDeleteHistory = async (id) => {
        try {
            await supabase.from('receipts').delete().eq('id', id);
            setList(prev => prev.filter(i => i.id !== id));
            refreshUsage();
            showToast(t('doc_deleted'), 'info');
            setDeleteConfirm(null);
        } catch (err) {
            console.error('TTR delete error:', err);
        }
    };




    return (<>
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('ttr_title')}</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {activeTab === 'form' && (
                        <>
                            <button onClick={handleReset} className="btn btn-outline-danger"><RotateCcw size={15} /> {t('inv_reset')}</button>
                            <button onClick={handleSave} className="btn btn-outline" disabled={isSaving}>{isSaving ? '...' : t('doc_save_history')}</button>
                            <button onClick={handleDownloadPDF} className="btn btn-primary" disabled={isDownloading}><Download size={15} /> {isDownloading ? t('doc_downloading') : t('doc_download_pdf')}</button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${dark ? '#334155' : '#E2E8F0'}` }}>
                {[{ key: 'form', label: t('doc_tab_new') }, { key: 'history', label: t('doc_tab_history'), icon: Clock }].map(tab => (
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
                            <p style={{ fontSize: 16, fontWeight: 600 }}>{t('doc_no_docs')}</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="overflow-x-auto pb-2 scrollbar-thin">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 'min-content' }}>
                                    {list.map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: dark ? '#1E293B' : 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gap: 24, flexWrap: 'nowrap' }}>
                                            <div style={{ flex: '0 0 200px' }}>
                                                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: dark ? '#F1F5F9' : '#1E293B' }}>{item.number}</p>
                                                <p className="truncate max-w-[200px]" style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.fromName || '—'} → {item.toName || '—'}</p>
                                                {item.notes && <p className="truncate max-w-[200px]" style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>"{item.notes}"</p>}
                                            </div>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748B', flex: '0 0 90px', whiteSpace: 'nowrap' }}>{item.date}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: '#7C3AED', fontWeight: 700, flex: '0 0 80px', whiteSpace: 'nowrap' }}>{item.items?.filter(i => i.name).length || 0} item</p>
                                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                <button onClick={() => setPreviewItem(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3B82F6', background: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}><Eye size={13} /> {t('doc_see')}</button>
                                                <button onClick={() => handleEditHistory(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}><Pencil size={13} /> Edit</button>
                                                <button onClick={() => setDeleteConfirm(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #EF4444', background: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}><Trash2 size={13} /> {t('doc_delete')}</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: dark ? '#1E293B' : 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('ttr_delete_title')}</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>{t('ttr_delete_body')}</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Batal</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
                        {previewItem && (() => {
                const item = previewItem;
                
                // Sticky Printing labels based on document's language
                const isID = (item.lang || lang) === 'id';
                const L = {
                    title: isID ? 'TANDA TERIMA BARANG' : 'DELIVERY ACKNOWLEDGEMENT',
                    no: isID ? 'No. Dokumen' : 'Doc Number',
                    date: isID ? 'Tanggal' : 'Date',
                    from: isID ? 'DISERAHKAN OLEH' : 'DELIVERED BY',
                    to: isID ? 'DITERIMA OLEH' : 'RECEIVED BY',
                    item: isID ? 'Nama Barang' : 'Item Name',
                    qty: isID ? 'Qty' : 'Qty',
                    unit: isID ? 'Satuan' : 'Unit',
                    cond: isID ? 'Kondisi' : 'Condition',
                    note: isID ? 'Keterangan' : 'Notes',
                    footer: isID ? 'Barang yang sudah diterima tidak dapat ditukar/dikembalikan tanpa perjanjian.' : 'Received goods cannot be exchanged/returned without prior agreement.',
                    sign: isID ? 'Tanda Tangan' : 'Signature'
                };

                return (
                    <div
                        onClick={() => setPreviewItem(null)}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(15,23,42,0.75)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 999999,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            overflowY: 'auto',
                            padding: '40px 16px 40px 226px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'white',
                                borderRadius: 16,
                                width: 'calc(100% - 210px)',
                                maxWidth: 860,
                                margin: '0 auto',
                                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                                overflow: 'visible',
                                flexShrink: 0
                            }}
                        >
                                {/* Sticky header */}
                                <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px 16px 0 0' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#1E293B' }}>{L.title}</h2>
                                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>{L.no}: {item.number} &middot; {formatDateID(item.date)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => setPreviewItem(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'none', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                                        <button onClick={handleDownloadPDF} disabled={isDownloading} style={{ padding: '8px 20px', borderRadius: 8, background: '#3B82F6', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}><Download size={16} /> {isDownloading ? '...' : 'Download PDF'}</button>
                                    </div>
                                </div>

                                <div id="ttr-preview" style={{ padding: '40px 50px', background: 'white' }}>
                                    {/* Brand header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottom: '2px solid #F1F5F9', paddingBottom: 30 }}>
                                        {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 70, maxWidth: 200, objectFit: 'contain' }} /> : <div style={{ height: 40, width: 40, background: '#3B82F6', borderRadius: 8 }} />}
                                        <div style={{ textAlign: 'right' }}>
                                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1E293B' }}>{item.fromCompany || 'MyCompany'}</h3>
                                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>{L.date}: {formatDateID(item.date)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mb-10">
                                        <div style={{ padding: '16px 20px', background: '#F0F9FF', borderRadius: 12, borderLeft: '4px solid #3B82F6' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.from}</p>
                                            <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 15, color: '#1E293B' }}>{item.fromName || '-'}</p>
                                            {item.fromTitle && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.fromTitle}</p>}
                                        </div>
                                        <div style={{ padding: '16px 20px', background: '#F0FFF4', borderRadius: 12, borderLeft: '4px solid #10B981' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.to}</p>
                                            <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 15, color: '#1E293B' }}>{item.toName || '-'}</p>
                                            {item.toCompany && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.toCompany}</p>}
                                        </div>
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, tableLayout: 'fixed' }}>
                                        <thead><tr style={{ background: '#1E293B' }}>{[
                                            { h: 'No', w: '40px' },
                                            { h: L.item, w: 'auto' },
                                            { h: L.qty, w: '60px' },
                                            { h: L.unit, w: '80px' },
                                            { h: L.cond, w: '100px' },
                                            { h: L.note, w: 'auto' }
                                        ].map(col => <th key={col.h} style={{ padding: '10px 12px', color: 'white', fontSize: 10, textAlign: col.h === L.item ? 'left' : 'center', fontWeight: 800, textTransform: 'uppercase', width: col.w }}>{col.h}</th>)}</tr></thead>
                                        <tbody>{(item.items || []).filter(i => i.name).map((i, idx) => (<tr key={idx} style={{ borderBottom: '1.5px solid #F1F5F9', background: idx % 2 === 0 ? 'white' : '#F8FAFC' }}><td style={{ padding: '10px 12px', fontSize: 11, textAlign: 'center' }}>{idx + 1}</td><td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#1E293B', wordBreak: 'break-word' }}>{i.name}</td><td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'center' }}>{i.qty}</td><td style={{ padding: '10px 12px', fontSize: 11, textAlign: 'center' }}>{i.unit}</td><td style={{ padding: '10px 12px', fontSize: 11, textAlign: 'center', color: kondisiColor(i.kondisi), fontWeight: 700 }}>{i.kondisi}</td><td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', wordBreak: 'break-word' }}>{i.note || '—'}</td></tr>))}</tbody>
                                    </table>

                                    {item.notes && <div style={{ marginBottom: 40, padding: '16px 20px', border: '1.5px solid #F1F5F9', borderRadius: 12 }}><p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isID ? 'CATATAN' : 'NOTES'}</p><p style={{ margin: 0, fontSize: 12, color: '#1E293B', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{item.notes}</p></div>}
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 60 }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 80px', fontSize: 13, color: '#64748B' }}>{L.from}</p>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, textDecoration: 'underline' }}>{item.fromName || '(..........................)'}</p>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 80px', fontSize: 13, color: '#64748B' }}>{L.to}</p>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, textDecoration: 'underline' }}>{item.toName || '(..........................)'}</p>
                                        </div>
                                    </div>
                                    <p style={{ marginTop: 40, fontSize: 10, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic' }}>{L.footer}</p>
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
                                    <label className="label">{t('form_logo')}</label>
                                    <LogoUpload size="sm" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                    <div>
                                        <label className="label">{t('doc_number_label')}</label>
                                        <input className="input" value={form.number} onChange={e => setField('number', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="label">{t('doc_date_label')}</label>
                                        <input type="date" className="input" value={form.date} onChange={e => setField('date', e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div style={{ padding: 14, background: dark ? '#0F172A' : '#F0F9FF', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
                                        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>{t('ttr_from')}</h4>
                                        {[{ key: 'fromName', label: t('form_col_name') }, { key: 'fromTitle', label: t('form_col_title') }, { key: 'fromCompany', label: t('form_col_company') }].map(f => (
                                            <div key={f.key} className="form-group" style={{ marginBottom: 10 }}>
                                                <label className="label">{f.label}</label>
                                                <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: 14, background: dark ? '#0F172A' : '#F0FFF4', borderRadius: 10, borderLeft: '4px solid #10B981' }}>
                                        <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#10B981' }}>{t('ttr_to')}</h4>
                                        {[{ key: 'toName', label: t('form_col_name') }, { key: 'toTitle', label: t('form_col_title') }, { key: 'toCompany', label: t('form_col_company') }].map(f => (
                                            <div key={f.key} className="form-group" style={{ marginBottom: 10 }}>
                                                <label className="label">{f.label}</label>
                                                <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ animation: 'none' }}>
                                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('ttr_goods_list')}</h3>
                                <div className="relative group">
                                    <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="overflow-x-auto pb-2 scrollbar-thin">
                                        <div style={{ minWidth: 650 }}>
                                            {form.items.map(item => (
                                                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 80px 100px 1fr 36px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                                                    <input className="input truncate max-w-[200px]" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder={t('placeholder_item_name')} style={{ fontSize: 13 }} title={item.name} />
                                                    <input className="input" type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ fontSize: 13, textAlign: 'center' }} placeholder="1" />
                                                    <input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ fontSize: 13 }} placeholder="satuan" />
                                                    <select className="select" value={item.kondisi} onChange={e => updateItem(item.id, 'kondisi', e.target.value)} style={{ fontSize: 12 }}>
                                                        {KONDISI.map(k => <option key={k.value} value={k.value}>{k.value}</option>)}
                                                    </select>
                                                    <input className="input truncate max-w-[200px]" value={item.note} onChange={e => updateItem(item.id, 'note', e.target.value)} placeholder={t('placeholder_spec')} style={{ fontSize: 13 }} title={item.note} />
                                                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={addItem} className="btn btn-sm btn-outline" style={{ marginTop: 8 }}>
                                    <Plus size={14} /> {t('doc_add_goods')}
                                </button>
                            </div>
                        </div>

                        {/* Preview */}
                        <div style={{ position: 'sticky', top: 80 }}>
                            {/* PDF Body Overlay */}
                            <div id="ttr-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '2px solid #E2E8F0' }}>
                                <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #E2E8F0', paddingBottom: 16 }}>
                                    {logo && <img src={logo} alt="Logo" style={{ maxHeight: 72, maxWidth: 200, objectFit: 'contain', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />}
                                    <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1E293B', letterSpacing: 2, textTransform: 'uppercase' }}>{t('dn_doc_title')}</h2>
                                    <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>No: {form.number} | {formatDateID(form.date)}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                    {[
                                        { title: t('dn_delivered_by'), name: form.fromName, title2: form.fromTitle, company: form.fromCompany, color: '#3B82F6' },
                                        { title: t('dn_received_by'), name: form.toName, title2: form.toTitle, company: form.toCompany, color: '#10B981' },
                                    ].map(p => (
                                        <div key={p.title} style={{ padding: '10px 14px', borderLeft: `3px solid ${p.color}`, background: '#F8FAFC' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: p.color, textTransform: 'uppercase' }}>{p.title}</p>
                                            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700 }}>{p.name || '—'}</p>
                                            {p.title2 && <p style={{ margin: '0 0 1px', fontSize: 11, color: '#64748B' }}>{p.title2}</p>}
                                            {p.company && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{p.company}</p>}
                                        </div>
                                    ))}
                                </div>

                                <div className="overflow-x-auto">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 11, minWidth: 600, tableLayout: 'fixed' }}>
                                        <thead>
                                            <tr style={{ background: '#1E293B' }}>
                                                {[
                                                    { h: 'No', w: '35px' },
                                                    { h: t('form_table_name'), w: 'auto' },
                                                    { h: t('form_table_qty'), w: '45px' },
                                                    { h: t('form_table_unit'), w: '60px' },
                                                    { h: t('form_table_condition'), w: '85px' },
                                                    { h: t('form_table_note'), w: 'auto' }
                                                ].map(col => (
                                                    <th key={col.h} style={{ padding: '7px 8px', color: 'white', textAlign: 'left', fontSize: 10, fontWeight: 700, width: col.w }}>{col.h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.items.filter(i => i.name).map((item, idx) => (
                                                <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}>
                                                    <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                                                    <td style={{ padding: '6px 8px', fontWeight: 600, wordBreak: 'break-word' }}>{item.name}</td>
                                                    <td style={{ padding: '6px 8px' }}>{item.qty}</td>
                                                    <td style={{ padding: '6px 8px' }}>{item.unit}</td>
                                                    <td style={{ padding: '6px 8px' }}><span style={{ color: kondisiColor(item.kondisi), fontWeight: 700 }}>{item.kondisi}</span></td>
                                                    <td style={{ padding: '6px 8px', wordBreak: 'break-word' }}>{item.note}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                                    {[{ label: t('ttr_sign_from'), name: form.fromName, title: form.fromTitle }, { label: t('ttr_sign_to'), name: form.toName, title: form.toTitle }].map(sig => (
                                        <div key={sig.label} style={{ textAlign: 'center' }}>
                                            <p style={{ margin: '0 0 60px', fontSize: 11 }}>{sig.label}</p>
                                            <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
                                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{sig.name || '.....................'}</p>
                                                {sig.title && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{sig.title}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {!isPremium && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
                             </div>
                        </div>
                    </div>
                    )}
        </div >
        {showLimitModal && <LimitModal plan="PRO" feature="Tanda Terima" onClose={() => setShowLimitModal(false)} />}
    </>);
}
