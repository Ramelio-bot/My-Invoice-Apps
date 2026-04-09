import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Trash2, Download, RotateCcw, Eye, Pencil, Clock, X, Copy } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useLang } from '../context/LanguageContext';
import { formatDateID, todayStr } from '../utils/date';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { recordAudit } from '../utils/audit';
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
const getKondisiLabel = (val, t) => {
    if (val === 'Baik') return t('ttr_cond_good');
    if (val === 'Rusak') return t('ttr_cond_damaged');
    if (val === 'Kurang') return t('ttr_cond_missing');
    if (val === 'Perlu Cek') return t('ttr_cond_check');
    return val;
};

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
    const { lang, t } = useLang();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkTandaTerimaLimit, incrementTandaTerima, refreshUsage, getTandaTerimaCount,
        currentLimits
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
                    date: json?.date || d.created_at?.split('T')[0],
                    id: d.id // <- WAJIB PALING BAWAH
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

    const handleDuplicate = () => {
        setForm(prev => {
            const newForm = { ...prev };
            delete newForm.id;
            delete newForm.created_at;
            newForm.number = peekDocNumber('ttr');
            return newForm;
        });
        showToast(t('toast_duplicate_mode') || 'Mode Duplikat aktif — ID di-reset. Sesuaikan data lalu klik Simpan.', 'success');
    };

    const handleSave = async () => {
        const ttrLimit = currentLimits?.tandaTerima || 20;
        if (effectivePlan === 'free' && !isAdmin && getTandaTerimaCount() >= ttrLimit) {
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
                    window.dispatchEvent(new Event('data-updated'));
                    await fetchData();
                } else {
                    showToast(t('doc_save_error'), 'error');
                    console.error('TTR update error:', error);
                }
            } else {
                const { data: saved, error } = await supabase.from('receipts').insert(entry).select().single();
                if (saved && !error) {
                    showToast(t('ttr_saved'), 'success');
                    window.dispatchEvent(new Event('data-updated'));
                    incrementTandaTerima();
                    incrementDocNumber('ttr');
                    await fetchData();
                } else {
                    showToast(t('doc_save_error'), 'error');
                    console.error('TTR insert error:', error);
                }
            }
        } catch (err) {
            showToast(t('doc_save_error'), 'error');
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
        setForm({ ...item });
        setActiveTab('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleDeleteHistory = async (id) => {
        const item = list.find(i => i.id === id);
        try {
            await supabase.from('receipts').delete().eq('id', id);

            await recordAudit(
                'DELETE', 
                'TandaTerima', 
                `Deleted Receipt #${item?.number || 'N/A'} for ${item?.clientName || 'N/A'} (Amount: ${item?.amount || 0})`, 
                'User Deleted Document', 
                'warning'
            );

            setList(prev => prev.filter(i => i.id !== id));
            window.dispatchEvent(new Event('data-updated'));
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
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1E293B' }}>
                    {t('ttr_title')}
                    {(!isAdmin && effectivePlan === 'free') && (
                        <span style={{
                            fontSize: 12, fontWeight: 700, marginLeft: 10,
                            color: getTandaTerimaCount() >= (currentLimits?.tandaTerima || 20) ? '#EF4444' : '#F59E0B',
                            background: getTandaTerimaCount() >= (currentLimits?.tandaTerima || 20) ? '#FEE2E2' : '#FEF3C7',
                            padding: '2px 8px', borderRadius: 6
                        }}>
                            {getTandaTerimaCount()}/{currentLimits?.tandaTerima || 20} {t('nav_tanda_terima')}
                        </span>
                    )}
                </h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {activeTab === 'form' && (
                        <>
                            <button onClick={handleReset} className="btn btn-outline-danger"><RotateCcw size={15} /> {t('inv_reset')}</button>
                            {form.id && (
                                <button
                                    onClick={handleDuplicate}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: '#EEF2FF', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                >
                                    <Copy size={15} /> {t('btn_duplicate') || 'Duplikat'}
                                </button>
                            )}
                            <button onClick={handleSave} className="btn btn-outline" disabled={isSaving}>{isSaving ? '...' : t('doc_save_history')}</button>
                            <button onClick={handleDownloadPDF} className="btn btn-primary" disabled={isDownloading}><Download size={15} /> {isDownloading ? t('doc_downloading') : t('doc_download_pdf')}</button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #E2E8F0' }}>
                {[{ key: 'form', label: t('doc_tab_new') }, { key: 'history', label: t('doc_tab_history'), icon: Clock }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #7C3AED' : '2px solid transparent', color: activeTab === tab.key ? '#7C3AED' : '#64748B', marginBottom: -2, transition: 'color 200ms' }}>
                        {tab.icon && <tab.icon size={14} />}
                        {tab.label}
                        {tab.key === 'history' && list.length > 0 && <span style={{ background: '#7C3AED', color: 'white', borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{list.length}</span>}
                    </button>
                ))}
            </div>

            {activeTab === 'history' && (
                <div>
                    {list.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#94A3B8' }}>
                            <Clock size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                            <p style={{ fontSize: 16, fontWeight: 600 }}>{t('doc_no_docs')}</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="overflow-x-auto pb-2 scrollbar-thin">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 'min-content' }}>
                                    {list.map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gap: 24, flexWrap: 'nowrap' }}>
                                            <div style={{ flex: '0 0 200px' }}>
                                                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#1E293B' }}>{item.number}</p>
                                                <p className="truncate max-w-[200px]" style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.fromName || '—'} → {item.toName || '—'}</p>
                                                {item.notes && <p className="truncate max-w-[200px]" style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>"{item.notes}"</p>}
                                            </div>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748B', flex: '0 0 90px', whiteSpace: 'nowrap' }}>{item.date}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: '#7C3AED', fontWeight: 700, flex: '0 0 80px', whiteSpace: 'nowrap' }}>{item.items?.filter(i => i.name).length || 0} item</p>
                                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                <button onClick={() => setPreviewItem(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3B82F6', background: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}><Eye size={13} /> {t('doc_see')}</button>
                                                <button onClick={() => handleEditHistory(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}><Pencil size={13} /> {t('edit')}</button>
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
                    <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{t('ttr_delete_title')}</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>{t('ttr_delete_body')}</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">{t('cancel')}</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">{t('delete')}</button>
                        </div>
                    </div>
                </div>
            )}
            {previewItem && ReactDOM.createPortal(
                <div onClick={() => setPreviewItem(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15,23,42,0.75)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        boxSizing: 'border-box'
                    }}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: 16,
                            width: '100%',
                            maxWidth: 860,
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                            overflow: 'hidden',
                            animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards'
                        }}
                    >
                        <div style={{ 
                            padding: '18px 24px',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0,
                            background: 'white',
                            zIndex: 10
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{t('ttr_doc_title')}</h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                                    No: {previewItem.number} &middot; {formatDateID(previewItem.date)}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setPreviewItem(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>{t('doc_close')}</button>
                                <button onClick={handleDownloadPDF} disabled={isDownloading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                                    <Download size={16} /> {t('doc_download_pdf')}
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                            <div id="ttr-preview" style={{ padding: '48px', background: 'white', color: '#000', minHeight: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottom: '2px solid #F1F5F9', paddingBottom: 30 }}>
                                    {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 70, maxWidth: 200, objectFit: 'contain' }} /> : <div style={{ height: 40, width: 40, background: '#7C3AED', borderRadius: 8 }} />}
                                    <div style={{ textAlign: 'right' }}>
                                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#111827' }}>{previewItem.fromCompany || t('nav_tanda_terima')}</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>{t('ttr_date_label')}: {formatDateID(previewItem.date)}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
                                    <div style={{ padding: '20px', background: '#F0F9FF', borderRadius: 12, borderLeft: '4px solid #3B82F6' }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ttr_delivered_by')}</p>
                                        <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 16, color: '#111827' }}>{previewItem.fromName || '-'}</p>
                                        {previewItem.fromTitle && <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>{previewItem.fromTitle}</p>}
                                    </div>
                                    <div style={{ padding: '20px', background: '#F0FFF4', borderRadius: 12, borderLeft: '4px solid #10B981' }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ttr_received_by')}</p>
                                        <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 16, color: '#111827' }}>{previewItem.toName || '-'}</p>
                                        {previewItem.toCompany && <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>{previewItem.toCompany}</p>}
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30, tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr style={{ background: '#111827' }}>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'center', fontWeight: 800, width: '50px' }}>{t('pdf_no')}</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'left', fontWeight: 800 }}>{t('ttr_item_name')}</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'center', fontWeight: 800, width: '70px' }}>{t('inv_pdf_qty')}</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'center', fontWeight: 800, width: '90px' }}>{t('po_unit')}</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'center', fontWeight: 800, width: '110px' }}>{t('ttr_condition')}</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'left', fontWeight: 800 }}>{t('hpp_pdf_description')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(previewItem.items || []).filter(i => i.name).map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? 'white' : '#F8FAFC' }}>
                                                <td style={{ padding: '14px 12px', fontSize: 12, textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 700, color: '#111827', wordBreak: 'break-word' }}>{item.name}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 13, textAlign: 'center' }}>{item.qty}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 12, textAlign: 'center' }}>{item.unit}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 12, textAlign: 'center', color: kondisiColor(item.kondisi), fontWeight: 800 }}>{getKondisiLabel(item.kondisi, t)}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 12, color: '#4B5563', wordBreak: 'break-word' }}>{item.note || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {previewItem.notes && (
                                    <div style={{ marginBottom: 40, padding: '20px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('form_notes')}</p>
                                        <p style={{ margin: 0, fontSize: 13, color: '#111827', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{previewItem.notes}</p>
                                    </div>
                                )}
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: 60 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: '0 0 80px', fontSize: 13, color: '#64748B', fontWeight: 600 }}>{t('ttr_sign_delivered')}</p>
                                        <div style={{ borderTop: '2px solid #111827', paddingTop: 10 }}>
                                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{previewItem.fromName || '(..........................)'}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: '0 0 80px', fontSize: 13, color: '#64748B', fontWeight: 600 }}>{t('ttr_sign_received')}</p>
                                        <div style={{ borderTop: '2px solid #111827', paddingTop: 10 }}>
                                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{previewItem.toName || '(..........................)'}</p>
                                        </div>
                                    </div>
                                </div>
                                <p style={{ marginTop: 60, fontSize: 11, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic', fontWeight: 500 }}>{t('ttr_footer_agreement')}</p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        
            {activeTab === 'form' && (
                <div className="split-layout">
                    {/* Form Section */}
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
                                <div style={{ padding: 14, background: '#F0F9FF', borderRadius: 10, borderLeft: '4px solid #3B82F6' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>{t('ttr_from')}</h4>
                                    {[{ key: 'fromName', label: t('form_col_name') }, { key: 'fromTitle', label: t('form_col_title') }, { key: 'fromCompany', label: t('form_col_company') }].map(f => (
                                        <div key={f.key} className="form-group" style={{ marginBottom: 10 }}>
                                            <label className="label">{f.label}</label>
                                            <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ padding: 14, background: '#F0FFF4', borderRadius: 10, borderLeft: '4px solid #10B981' }}>
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
                            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{t('ttr_goods_list')}</h3>
                            <div className="relative group">
                                <div className="overflow-x-auto pb-2 scrollbar-thin">
                                    <div style={{ minWidth: 650 }}>
                                        {form.items.map(item => (
                                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 80px 100px 1fr 36px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                                                <input className="input truncate" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder={t('placeholder_item_name')} style={{ fontSize: 13 }} />
                                                <input className="input" type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ fontSize: 13, textAlign: 'center' }} placeholder="1" />
                                                <input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ fontSize: 13 }} placeholder={t('po_unit')} />
                                                <select className="select" value={item.kondisi} onChange={e => updateItem(item.id, 'kondisi', e.target.value)} style={{ fontSize: 12 }}>
                                                    {KONDISI.map(k => <option key={k.value} value={k.value}>{k.value === 'Baik' ? t('ttr_cond_good') : k.value === 'Rusak' ? t('ttr_cond_damaged') : k.value === 'Kurang' ? t('ttr_cond_missing') : t('ttr_cond_check')}</option>)}
                                                </select>
                                                <input className="input truncate" value={item.note} onChange={e => updateItem(item.id, 'note', e.target.value)} placeholder={t('placeholder_spec')} style={{ fontSize: 13 }} />
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

                    {/* Preview Section */}
                    <div style={{ position: 'sticky', top: 80 }}>
                        <div id="ttr-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '2px solid #E2E8F0' }}>
                            <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #E2E8F0', paddingBottom: 16 }}>
                                {logo && <img src={logo} alt="Logo" style={{ maxHeight: 72, maxWidth: 200, objectFit: 'contain', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />}
                                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1E293B', letterSpacing: 2, textTransform: 'uppercase' }}>{t('ttr_doc_title')}</h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>No: {form.number} | {formatDateID(form.date)}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div style={{ padding: '10px 14px', borderLeft: '3px solid #3B82F6', background: '#F8FAFC' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase' }}>{t('ttr_delivered_by')}</p>
                                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700 }}>{form.fromName || '—'}</p>
                                    {form.fromTitle && <p style={{ margin: '0 0 1px', fontSize: 11, color: '#64748B' }}>{form.fromTitle}</p>}
                                    {form.fromCompany && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.fromCompany}</p>}
                                </div>
                                <div style={{ padding: '10px 14px', borderLeft: '3px solid #10B981', background: '#F8FAFC' }}>
                                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>{t('ttr_received_by')}</p>
                                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700 }}>{form.toName || '—'}</p>
                                    {form.toTitle && <p style={{ margin: '0 0 1px', fontSize: 11, color: '#64748B' }}>{form.toTitle}</p>}
                                    {form.toCompany && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.toCompany}</p>}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 11, tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr style={{ background: '#1E293B' }}>
                                            {[
                                                { h: t('pdf_no'), w: '35px' },
                                                { h: t('ttr_item_name'), w: 'auto' },
                                                { h: t('inv_pdf_qty'), w: '45px' },
                                                { h: t('po_unit'), w: '60px' },
                                                { h: t('ttr_condition'), w: '85px' },
                                                { h: t('placeholder_spec'), w: 'auto' }
                                            ].map(col => (
                                                <th key={col.h} style={{ padding: '7px 8px', color: 'white', textAlign: 'left', fontSize: 10, fontWeight: 700, width: col.w }}>{col.h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.items.filter(i => i.name).map((item, idx) => (
                                            <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white', borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                                                <td style={{ padding: '6px 8px', fontWeight: 600, wordBreak: 'break-word' }}>{item.name}</td>
                                                <td style={{ padding: '6px 8px' }}>{item.qty}</td>
                                                <td style={{ padding: '6px 8px' }}>{item.unit}</td>
                                                <td style={{ padding: '6px 8px' }}><span style={{ color: kondisiColor(item.kondisi), fontWeight: 700 }}>{getKondisiLabel(item.kondisi, t)}</span></td>
                                                <td style={{ padding: '6px 8px', wordBreak: 'break-word' }}>{item.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 60px', fontSize: 11 }}>{t('ttr_sign_delivered')}</p>
                                    <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{form.fromName || '.....................'}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 60px', fontSize: 11 }}>{t('ttr_sign_received')}</p>
                                    <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{form.toName || '.....................'}</p>
                                    </div>
                                </div>
                            </div>
                            {(effectivePlan === 'free' && !isAdmin) && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
                        </div>
                    </div>
                </div>
            )
            }
        </div>
        {showLimitModal && <LimitModal plan="PRO" feature="Tanda Terima" onClose={() => setShowLimitModal(false)} />}
    </>);
}
