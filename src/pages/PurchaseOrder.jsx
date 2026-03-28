import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Trash2, Download, RotateCcw, Eye, Pencil, Clock, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatCompactCurrency, formatInputNumber, parseCurrency } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LimitModal from '../components/LimitModal';

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
    const { lang, t } = useLang();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkPOLimit, incrementPO, refreshUsage, getPOCount
    } = usePlan();
    const { effectivePlan, isAdmin, user } = useAuth(); // Destructure user from useAuth
    const { logo } = useCompanyLogo();
    const [list, setList] = useState([]); // Removed useLocalStorage

    const [form, setForm] = useLocalStorage('draft_po', defaultForm());
    const [activeTab, setActiveTab] = useState('form');

    const fetchData = async () => {
        if (!user) return;
        const { data } = await supabase.from('purchase_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (data) {
            const mapped = data.map(d => {
                const json = typeof d.data === 'string' ? JSON.parse(d.data) : d.data;
                return {
                    ...d,
                    ...json,
                    number: d.doc_number || json?.number,
                    vendorName: d.client_name || json?.vendorName,
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

    const updateItem = (id, key, val) => setForm(f => ({
        ...f,
        items: f.items.map(it => {
            if (it.id !== id) return it;
            let cleanVal = val;
            if (key === 'price') {
                const cleaned = String(val).replace(/\./g, '').replace(/[^\d]/g, '');
                cleanVal = parseInt(cleaned, 10) || 0;
            } else if (key === 'qty') {
                cleanVal = parseFloat(String(val).replace(',', '.')) || 0;
            }
            const updated = { ...it, [key]: cleanVal };
            return { ...updated, total: (parseFloat(updated.qty) || 0) * (parseFloat(updated.price) || 0) };
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
        showToast(t('doc_reset_toast'), 'success');
    };

    const handleSave = async () => {
        if (!form.vendorName) { showToast(t('form_vendor_title') + ': ' + t('hpp_toast_name_required'), 'error'); return; }

        // Plan limit guard for FREE users
        const isEditing = list.some(i => i.doc_number === form.number || i.number === form.number);
        if (!isPro && !isAdmin && !isEditing && !checkPOLimit()) {
            setShowLimitModal(true);
            return;
        }
        const entry = {
            user_id: user.id,
            doc_number: form.number,
            client_name: form.vendorName,
            total_amount: grandTotal,
            data: { ...form, lang } // termasuk date, items, grandTotal, lang, dll
        };

        setIsSaving(true);
        try {
            const exists = list.find(i => i.doc_number === form.number || i.number === form.number);
            if (exists) {
                const { error } = await supabase.from('purchase_orders').update(entry).eq('id', exists.id);
                if (!error) {
                    showToast(t('po_updated'), 'success');
                    await fetchData();
                } else {
                    showToast(t('doc_save_error') || 'Gagal menyimpan, coba lagi.', 'error');
                    console.error('PO update error:', error);
                }
            } else {
                const { data: saved, error } = await supabase.from('purchase_orders').insert(entry).select().single();
                if (saved && !error) {
                    showToast(t('po_saved'), 'success');
                    incrementPO();
                    incrementDocNumber('po');
                    await fetchData();
                } else {
                    showToast(t('doc_save_error') || 'Gagal menyimpan, coba lagi.', 'error');
                    console.error('PO insert error:', error);
                }
            }
        } catch (err) {
            showToast(t('doc_save_error') || 'Terjadi kesalahan, coba lagi.', 'error');
            console.error('PO save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast(t('hpp_toast_download_limit'), 'warning'); return; }
        setIsDownloading(true);
        try {
            await generatePDF('po-preview', `PO-${form.number || 'Draft'}.pdf`, isPremium);
            incrementDownload('po', form.number, grandTotal, form.vendorName || '-');
            showToast(t('doc_pdf_success'), 'success');
        } catch { showToast(t('doc_pdf_fail'), 'error'); } finally {
            setIsDownloading(false);
        }
    };

    const handleEditHistory = (item) => { setForm({ ...item }); setActiveTab('form'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const handleDeleteHistory = async (id) => {
        try {
            await supabase.from('purchase_orders').delete().eq('id', id);
            setList(prev => prev.filter(i => i.id !== id));
            refreshUsage();
            showToast(t('doc_deleted'), 'info');
            setDeleteConfirm(null);
        } catch (err) {
            console.error('PO delete error:', err);
        }
    };



    return (<>
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1E293B' }}>{t('po_title')}</h1>
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
                                            <div style={{ flex: '0 0 150px' }}>
                                                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#1E293B' }}>{item.number}</p>
                                                <p className="truncate max-w-[150px]" style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.vendorName || '—'}</p>
                                                {item.notes && <p className="truncate max-w-[150px]" style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>"{item.notes}"</p>}
                                            </div>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748B', flex: '0 0 90px', whiteSpace: 'nowrap' }}>{item.date}</p>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#7C3AED', flex: '0 0 110px', whiteSpace: 'nowrap' }}>{formatCompactCurrency(item.grandTotal || item.total_amount || 0)}</p>
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
                    <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{t('po_delete_title')}</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>{t('po_delete_body')}</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Batal</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">Hapus</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Preview modal — centered, full detail */}
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
                        {/* Fixed Header */}
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
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{t('po_title')}</h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                                    No: {previewItem.number} &middot; {formatDateID(previewItem.date)}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setPreviewItem(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>{t('doc_close') || 'Tutup'}</button>
                                <button onClick={handleDownloadPDF} disabled={isDownloading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                                    <Download size={16} /> Download PDF
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                            <div id="po-preview" style={{ padding: '48px', background: 'white', color: '#000', minHeight: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottom: '2px solid #F1F5F9', paddingBottom: 30 }}>
                                    {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 70, maxWidth: 200, objectFit: 'contain' }} /> : <div style={{ height: 40, width: 40, background: '#7C3AED', borderRadius: 8 }} />}
                                    <div style={{ textAlign: 'right' }}>
                                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#111827' }}>{previewItem.companyName || 'MyCompany'}</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748B', maxWidth: 250, lineHeight: 1.4 }}>{previewItem.companyAddress || '-'}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginBottom: 40 }}>
                                    <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: 12, borderLeft: '4px solid #3B82F6' }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('po_to_vendor')}</p>
                                        <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 16, color: '#111827' }}>{previewItem.vendorName || '-'}</p>
                                        {previewItem.vendorAddress && <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 600 }}>{previewItem.vendorAddress}</p>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{t('doc_date_label')}</p>
                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{formatDateID(previewItem.date)}</p>
                                        {previewItem.deliveryDate && (
                                            <>
                                                <p style={{ margin: '12px 0 4px', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{t('po_delivery')}</p>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatDateID(previewItem.deliveryDate)}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30, tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr style={{ background: '#111827' }}>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'center', fontWeight: 800, width: '50px' }}>NO</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'left', fontWeight: 800 }}>{t('po_item_name')}</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'center', fontWeight: 800, width: '60px' }}>QTY</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'center', fontWeight: 800, width: '80px' }}>{t('po_unit')}</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'right', fontWeight: 800, width: '130px' }}>{t('po_unit_price')}</th>
                                            <th style={{ padding: '12px', color: 'white', fontSize: 11, textAlign: 'right', fontWeight: 800, width: '130px' }}>TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(previewItem.items || []).filter(i => i.name).map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? 'white' : '#F8FAFC' }}>
                                                <td style={{ padding: '14px 12px', fontSize: 12, textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 700, color: '#111827', wordBreak: 'break-word' }}>{item.name}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 13, textAlign: 'center' }}>{item.qty}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 12, textAlign: 'center' }}>{item.unit}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 13, textAlign: 'right' }}>{formatIDR(item.price)}</td>
                                                <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 800, textAlign: 'right', color: '#111827' }}>{formatIDR(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                                    <div style={{ width: 280 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #E2E8F0' }}>
                                            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>SUBTOTAL</span>
                                            <span style={{ fontSize: 12, fontWeight: 800 }}>{formatIDR((previewItem.items || []).reduce((s, i) => s + (i.total || 0), 0))}</span>
                                        </div>
                                        {previewItem.discountAmt > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #E2E8F0' }}>
                                                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>{t('po_discount')} {previewItem.discount}%</span>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444' }}>- {formatIDR(previewItem.discountAmt)}</span>
                                            </div>
                                        )}
                                        {previewItem.taxAmt > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #E2E8F0' }}>
                                                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>PAJAK {previewItem.tax}%</span>
                                                <span style={{ fontSize: 12, fontWeight: 800 }}>+ {formatIDR(previewItem.taxAmt)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '14px 16px', background: '#111827', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                            <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>{t('po_total_order')}</span>
                                            <span style={{ fontSize: 16, fontWeight: 900, color: '#FCD34D' }}>{formatIDR(previewItem.grandTotal || 0)}</span>
                                        </div>
                                    </div>
                                </div>

                                {previewItem.notes && (
                                    <div style={{ marginBottom: 40, padding: '20px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('po_notes_terms')}</p>
                                        <p style={{ margin: 0, fontSize: 13, color: '#111827', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{previewItem.notes}</p>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 60 }}>
                                    <div style={{ textAlign: 'center', width: 220 }}>
                                        <p style={{ margin: '0 0 80px', fontSize: 13, color: '#64748B', fontWeight: 600 }}>{previewItem.companyName || 'Authorized Signatory'}</p>
                                        <div style={{ borderTop: '2px solid #111827', paddingTop: 10 }}>
                                            <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 800 }}>{previewItem.signerName || '—'}</p>
                                            <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>{previewItem.signerTitle || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {
                activeTab === 'form' && (
                    <div className="split-layout">
                        <div>
                            <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { key: 'number', label: t('form_number_po') },
                                        { key: 'date', label: t('form_date'), type: 'date' },
                                        { key: 'deliveryDate', label: t('form_delivery_date'), type: 'date' },
                                        { key: 'companyName', label: t('form_company_name') },
                                        { key: 'companyAddress', label: t('form_company_address') },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="label">{f.label}</label>
                                            <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="label">{t('form_payment_term')}</label>
                                        <select className="select" value={form.paymentTerm} onChange={e => setField('paymentTerm', e.target.value)}>
                                            {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label className="label">{t('form_logo')}</label>
                                        <LogoUpload size="sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ animation: 'none', marginBottom: 16 }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div style={{ padding: 14, background: '#FFF8F0', borderRadius: 10, borderLeft: '3px solid #F59E0B' }}>
                                        <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{t('form_vendor_title')}</h4>
                                        {[{ key: 'vendorName', label: t('form_col_name') }, { key: 'vendorAddress', label: t('form_address') }, { key: 'vendorContact', label: t('kl_modal_contact') }].map(f => (
                                            <div key={f.key} style={{ marginBottom: 8 }}><label className="label">{f.label}</label><input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} /></div>
                                        ))}
                                    </div>
                                    <div style={{ padding: 14, background: '#F0FFF4', borderRadius: 10, borderLeft: '3px solid #10B981' }}>
                                        <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#10B981' }}>{t('form_delivery_title')}</h4>
                                        {[{ key: 'shippingAddress', label: t('form_address') }, { key: 'shippingContact', label: t('kl_modal_contact') }].map(f => (
                                            <div key={f.key} style={{ marginBottom: 8 }}><label className="label">{f.label}</label><input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} /></div>
                                        ))}
                                    </div>
                                </div>

                                <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{t('form_items_title_po')}</h3>
                                <div className="relative group">
                                    <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="overflow-x-auto pb-2 scrollbar-thin">
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, tableLayout: 'fixed' }}>
                                            <thead><tr>{[
                                                { h: 'No', w: '40px' },
                                                { h: t('form_table_name'), w: 'auto' },
                                                { h: t('form_table_spec'), w: 'auto' },
                                                { h: t('form_table_qty'), w: '60px' },
                                                { h: t('form_table_unit'), w: '75px' },
                                                { h: t('form_table_price'), w: '130px' },
                                                { h: t('form_table_total'), w: '130px' },
                                                { h: '', w: '40px' }
                                            ].map(col => (<th key={col.h} style={{ padding: '6px 6px', fontSize: 10, fontWeight: 700, color: '#64748B', borderBottom: '1.5px solid #E2E8F0', textAlign: (col.h === 'No' || col.h === '' ? 'left' : (['Qty', 'Satuan'].includes(col.h) ? 'center' : (['Harga', 'Total'].includes(col.h) ? 'right' : 'left'))), textTransform: 'uppercase', width: col.w }}>{col.h}</th>))}</tr></thead>
                                            <tbody>
                                                {form.items.map((item, idx) => (
                                                    <tr key={item.id}>
                                                        <td style={{ padding: '6px 6px', fontSize: 12, color: '#64748B' }}>{idx + 1}</td>
                                                        <td style={{ padding: '4px 4px' }}><input className="input truncate max-w-[150px]" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder={t('placeholder_item_name')} style={{ fontSize: 12 }} title={item.name} /></td>
                                                        <td style={{ padding: '4px 4px' }}><input className="input truncate max-w-[150px]" value={item.spec} onChange={e => updateItem(item.id, 'spec', e.target.value)} placeholder={t('placeholder_spec')} style={{ fontSize: 12 }} title={item.spec} /></td>
                                                        <td style={{ padding: '3px 3px', width: 56 }}><input className="input" type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} placeholder="1" /></td>
                                                        <td style={{ padding: '3px 3px', width: 64 }}><input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ fontSize: 12 }} /></td>
                                                        <td style={{ padding: '3px 3px', width: 120 }}><input className="input whitespace-nowrap text-right" type="text" inputMode="numeric" value={formatInputNumber(item.price)} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ fontSize: 12, textAlign: 'right' }} placeholder="0" /></td>
                                                        <td style={{ padding: '3px 8px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', textAlign: 'right' }}>{formatIDR(item.total)}</td>
                                                        <td><button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <button onClick={addItem} className="btn btn-sm btn-outline" style={{ marginTop: 8 }}><Plus size={14} /> {t('doc_add_item')}</button>

                                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                    {[{ key: 'discount', label: t('form_discount') }, { key: 'tax', label: t('form_tax') }].map(f => (
                                        <div key={f.key} style={{ flex: 1 }}>
                                            <label className="label">{f.label}</label>
                                            <input type="number" min="0" max="100" className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} placeholder="0" />
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 10 }}><label className="label">{t('form_notes')}</label><textarea className="textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} rows="2" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    <div><label className="label">{t('form_signer_name')}</label><input className="input" value={form.signerName} onChange={e => setField('signerName', e.target.value)} /></div>
                                    <div><label className="label">{t('form_signer_title')}</label><input className="input" value={form.signerTitle} onChange={e => setField('signerTitle', e.target.value)} /></div>
                                </div>
                            </div>
                        </div>

                        <div style={{ position: 'sticky', top: 80 }}>
                            <div id="po-preview" style={{ background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 11 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '3px solid #7C3AED' }}>
                                    <div>
                                        {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 60, maxWidth: 160, objectFit: 'contain', marginBottom: 6 }} /> : <h1 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: '#7C3AED' }}>{form.companyName || t('form_vendor_title')}</h1>}
                                        <p style={{ margin: 0, fontSize: 10, color: '#64748B', maxWidth: 200 }}>{form.companyAddress}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: 1 }}>Purchase Order</h2>
                                        <p style={{ margin: '0 0 2px' }}>No: {form.number}</p>
                                        <p style={{ margin: '0 0 2px' }}>{t('doc_date_label')}: {formatDateID(form.date)}</p>
                                        {form.deliveryDate && <p style={{ margin: 0 }}>{t('po_delivery')}: {formatDateID(form.deliveryDate)}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div style={{ padding: '10px', background: '#FFFBEB', borderLeft: '3px solid #F59E0B' }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, color: '#F59E0B' }}>VENDOR</p>
                                        <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 12 }}>{form.vendorName || '—'}</p>
                                        {form.vendorAddress && <p style={{ margin: '0 0 1px', fontSize: 10, color: '#64748B' }}>{form.vendorAddress}</p>}
                                        {form.vendorContact && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{form.vendorContact}</p>}
                                    </div>
                                    <div style={{ padding: '10px', background: '#F0FFF4', borderLeft: '3px solid #10B981' }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, color: '#10B981' }}>{t('ttr_to')}</p>
                                        {form.shippingAddress && <p style={{ margin: '0 0 2px', fontSize: 11 }}>{form.shippingAddress}</p>}
                                        {form.shippingContact && <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{form.shippingContact}</p>}
                                        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#64748B' }}>Term: {form.paymentTerm}</p>
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: 10, tableLayout: 'fixed' }}>
                                    <thead><tr style={{ background: '#7C3AED' }}>{[
                                        { h: t('pdf_no'), w: '35px' },
                                        { h: t('inv_pdf_desc'), w: 'auto' },
                                        { h: t('form_table_spec'), w: 'auto' },
                                        { h: t('inv_pdf_qty'), w: '45px' },
                                        { h: t('inv_pdf_unit'), w: '60px' },
                                        { h: t('inv_pdf_price'), w: '105px' },
                                        { h: t('inv_pdf_total'), w: '105px' }
                                    ].map(col => (<th key={col.h} style={{ padding: '6px 7px', color: 'white', textAlign: col.h === (t('pdf_no')) ? 'left' : (col.h === t('inv_pdf_qty') ? 'center' : (['Harga', 'Total', t('inv_pdf_price'), t('inv_pdf_total')].includes(col.h) ? 'right' : 'left')), fontSize: 9, fontWeight: 700, width: col.w }}>{col.h}</th>))}</tr></thead>
                                    <tbody>
                                        {form.items.filter(i => i.name).map((item, idx) => (
                                            <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white', borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '5px 7px' }}>{idx + 1}</td>
                                                <td style={{ padding: '5px 7px', fontWeight: 600, wordBreak: 'break-word' }}>{item.name}</td>
                                                <td style={{ padding: '5px 7px', color: '#64748B', wordBreak: 'break-word' }}>{item.spec}</td>
                                                <td style={{ padding: '5px 7px', textAlign: 'center' }}>{item.qty}</td>
                                                <td style={{ padding: '5px 7px' }}>{item.unit}</td>
                                                <td style={{ padding: '5px 7px', textAlign: 'right' }}>{formatIDR(item.price)}</td>
                                                <td style={{ padding: '5px 7px', textAlign: 'right', fontWeight: 700 }}>{formatIDR(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                                    <div style={{ width: 190 }}>
                                        {[[t('inv_pdf_subtotal'), formatIDR(subtotal)], ...(form.discount > 0 ? [[`${t('inv_discount')} ${form.discount}%`, `- ${formatIDR(discountAmt)}`]] : []), ...(form.tax > 0 ? [[`${t('inv_tax')} ${form.tax}%`, `+ ${formatIDR(taxAmt)}`]] : [])].map(([l, v]) => (<div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 10 }}><span style={{ color: '#64748B' }}>{l}</span><span>{v}</span></div>))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: '#7C3AED', borderRadius: 6 }}><span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{t('inv_pdf_total')}</span><span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span></div>
                                    </div>
                                </div>

                                {form.notes && <p style={{ fontSize: 10, color: '#64748B', marginBottom: 16, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6 }}><strong>{t('pdf_notes')}:</strong> {form.notes}</p>}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                    <div style={{ textAlign: 'center', width: 140 }}>
                                        <p style={{ margin: '0 0 48px', fontSize: 10 }}>{t('form_signed_by')}</p>
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
        {showLimitModal && <LimitModal plan="PRO" feature="Purchase Order" onClose={() => setShowLimitModal(false)} />}
    </>);
}
