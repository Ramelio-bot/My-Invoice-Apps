import { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabase';
import { Download, RotateCcw, Eye, Pencil, Trash2, Clock, X, Move, Copy } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { recordAudit } from '../utils/audit';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatCompactCurrency, formatInputNumber, parseCurrency } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { terbilang } from '../utils/terbilang';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import LimitModal from '../components/LimitModal';
import { isNative, runNative } from '../utils/platform';
import { useOutlet } from '../context/OutletContext';

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

// ── Draggable image helper ─────────────────────────────────────────────────────
function DraggableImage({ src, alt, pos, size, onPosChange, containerRef, accent, zIndex }) {
    const dragRef = useRef(null);
    const isDragging = useRef(false);
    const startOffset = useRef({ x: 0, y: 0 });

    const onPointerDown = useCallback((e) => {
        e.preventDefault();
        isDragging.current = true;
        dragRef.current = e.currentTarget;
        dragRef.current.setPointerCapture(e.pointerId);
        const rect = dragRef.current.getBoundingClientRect();
        startOffset.current = { 
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!isDragging.current || !containerRef.current) return;
        const container = containerRef.current.getBoundingClientRect();
        const x = e.clientX - container.left - startOffset.current.x;
        const y = e.clientY - container.top - startOffset.current.y;
        onPosChange({ x, y });
    }, [onPosChange, containerRef]);

    const onPointerUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    if (!src) return null;
    return (
        <img
            src={src}
            alt={alt}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
                position: 'absolute',
                left: `${pos?.x || 0}px`,
                top: `${pos?.y || 0}px`,
                width: `${size?.width || size || 100}px`,
                objectFit: 'contain',
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
                border: isDragging.current ? `1.5px dashed ${accent}` : 'none',
                borderRadius: 4,
                zIndex: zIndex || 10,
            }}
        />
    );
}

export default function Kwitansi() {
    const { lang, t } = useLang();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkKwitansiLimit, incrementKwitansi, getKwitansiCount,
        refreshUsage, currentLimits
    } = usePlan();
    const { effectivePlan, isAdmin, user } = useAuth();
    const { logo } = useCompanyLogo();
    const { activeOutlet } = useOutlet();
    const [list, setList] = useState([]); 
    const [cashbook, setCashbook] = useState([]); 

    const kwitansiCount = getKwitansiCount();
    const isKwitansiFree = !isAdmin && effectivePlan === 'free';

    const [form, setForm] = useLocalStorage('kwitansi_draft', defaultForm());
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('form');
    const [statusMenuOpen, setStatusMenuOpen] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    const fetchKwitansi = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'kw')
            .order('created_at', { ascending: false });

        if (!error && data) {
            const mapped = data.map(d => ({
                user_id: d.user_id,
                number: d.doc_number || d.number,
                receivedFrom: d.client_name,
                amount: d.total_amount || d.total,
                status: d.status,
                createdAt: d.created_at,
                ...(d.data || {}), 
                id: d.id // <- WAJIB PALING BAWAH
            }));
            setList(mapped);
        }
    };

    useEffect(() => {
        if (user) {
            fetchKwitansi();
        }
    }, [user]);
    const [isDownloading, setIsDownloading] = useState(false);

    // Draggable positions & sizes
    const [sigPos, setSigPos] = useLocalStorage('kwt_sig_pos', { x: 20, y: 30 });
    const [stampPos, setStampPos] = useLocalStorage('kwt_stamp_pos', { x: 10, y: 20 });
    const [sigSize, setSigSize] = useLocalStorage('kwt_sig_size', 120);
    const [stampSize, setStampSize] = useLocalStorage('kwt_stamp_size', 90);
    const previewRef = useRef(null);
    const amountNum = parseFloat(form.amount) || 0;

    const setField = (key, val) => {
        let cleanVal = val;
        if (key === 'amount') {
            const cleaned = String(val).replace(/\./g, '').replace(/[^\d]/g, '');
            cleanVal = parseInt(cleaned, 10) || 0;
        }
        setForm(f => ({ ...f, [key]: cleanVal }));
    };
    const terbilangText = amountNum > 0 ? terbilang(amountNum, lang) : '—';

    // ── Bilingual text ─────────────────────────────────────────────────────────
    const handleReset = () => {
        setForm(defaultForm());
        setSigPos({ x: 20, y: 30 });
        setStampPos({ x: 10, y: 20 });
        setSigSize(120);
        setStampSize(90);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(t('kwt_reset_toast'), 'success');
    };

    const handleDuplicate = () => {
        setForm(prev => {
            const newForm = { ...prev };
            delete newForm.id;
            delete newForm.created_at;
            newForm.number = peekDocNumber('kwitansi');
            return newForm;
        });
        showToast(t('toast_duplicate_mode') || 'Mode Duplikat aktif — ID di-reset. Sesuaikan data lalu klik Simpan.', 'success');
    };

    const syncToCashbook = async (num, amount, clientName, date) => {
        try {
            const description = `Kwitansi #${num} - ${clientName}`;
            const finalAmount = Number(amount) || 0;
            const finalOutletId = (activeOutlet?.id && activeOutlet.id.length > 20) ? activeOutlet.id : null;

            const cashPayload = {
                user_id: user.id,
                type: 'income',
                amount: finalAmount,
                category: 'Penjualan',
                description: description,
                date: date || todayStr(),
                source: 'auto',
                outlet_id: finalOutletId,
            };

            console.log("DATA SINKRONISASI KASIR:", cashPayload);

            // [OPERASI PENGECEKAN GANDA CASHBOOK]
            const { data: dupCash } = await supabase.from('cashbook')
                .select('id')
                .eq('user_id', user.id)
                .eq('description', description)
                .eq('date', cashPayload.date)
                .maybeSingle();

            if (dupCash) {
                await supabase.from('cashbook').update(cashPayload).eq('id', dupCash.id);
            } else {
                // [OPERASI STRIP ID]
                delete cashPayload.id;
                const { error } = await supabase.from('cashbook').insert(cashPayload);
                if (error) throw error;
            }
        } catch (err) {
            console.error('Kwitansi-to-Cashbook Sync Error:', err);
        }
    };

    const handleSave = async () => {
        if (!user) { showToast(t('login_required') || 'Please login', 'error'); return; }
        if (!form.receivedFrom || !amountNum) {
            showToast(t('kwt_receiver_required'), 'error');
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        const amt = parseFloat(form.amount) || 0;
        const num = form.number || peekDocNumber('kwitansi');

        const existing = list.find(i => i.number === num);

        if (isKwitansiFree && !existing && !checkKwitansiLimit()) {
            showToast(t('kwt_limit_reached') || 'Limit reached', 'warning');
            setIsSaving(false);
            return;
        }

        const kwitansiBase = {
            ...form,
            number: num,
            amount: amt,
        };

        const dbKwitansi = {
            user_id: user.id,
            type: 'kw',
            doc_number: num,
            client_name: form.receivedFrom,
            total_amount: amt,
            outlet_id: activeOutlet?.id || null,
            data: { 
                ...kwitansiBase, 
                sigPos, 
                stampPos, 
                sigSize, 
                stampSize, 
                lang,
                status: 'paid' 
            },
        };

        try {
            if (existing && existing.id && existing.id.length > 15) { 
                const { error } = await supabase.from('documents').update(dbKwitansi).eq('id', existing.id);
                if (error) throw error;
                showToast(t('kwt_toast_updated'), 'success');
            } else {
                // [OPERASI PENGECEKAN GANDA KWITANSI] — Inklusif legacy 'kwitansi'
                const { data: dup } = await supabase.from('documents')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('doc_number', num)
                    .in('type', ['kw', 'kwitansi'])
                    .maybeSingle();

                if (dup) {
                    const { error } = await supabase.from('documents').update(dbKwitansi).eq('id', dup.id);
                    if (error) throw error;
                    showToast(t('kwt_toast_updated'), 'success');
                } else {
                    delete dbKwitansi.id;
                    const { data: saved, error: insErr } = await supabase.from('documents').insert(dbKwitansi).select().single();
                    if (insErr) throw insErr;
                    if (saved) {
                        incrementKwitansi();
                        showToast(t('kwt_toast_saved'), 'success');
                        refreshUsage();
                    }
                }
            }

            // [POMPA KASIR]
            try {
                await syncToCashbook(num, amt, form.receivedFrom, form.date);
            } catch (pErr) {
                console.error('Pump error:', pErr);
            }

            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('invoice-updated'));
            window.dispatchEvent(new Event('data-updated'));
            fetchKwitansi(); 
        } catch (err) {
            console.error('Kwitansi sync error details:', err);
            showToast("Gagal Simpan! Terjadi kesalahan koneksi.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai. Upgrade PRO!', 'warning'); return; }
        setIsDownloading(true);
        try {
            await generatePDF('kwitansi-preview', `Kwitansi-${form.number}.pdf`, isPremium);
            
            runNative(() => {
                console.log('Native Print/Save initiated for Kwitansi');
            });

            incrementDownload('kwitansi', form.number, amountNum, form.receivedFrom);
            showToast(t('doc_pdf_success'), 'success');
        } catch { showToast(t('doc_pdf_fail'), 'error'); } finally {
            setIsDownloading(false);
        }
    };

    const handleEditHistory = (item) => {
        setForm({ ...item, amount: String(item.amount) });
        if (item.sigPos) setSigPos(item.sigPos);
        if (item.stampPos) setStampPos(item.stampPos);
        if (item.sigSize) setSigSize(item.sigSize);
        if (item.stampSize) setStampSize(item.stampSize);
        setActiveTab('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteHistory = async (id) => {
        const item = list.find(i => i.id === id);
        if (!item) return;

        try {
            // STEP 1: Catat audit DULU agar sudah commit sebelum refreshUsage dipanggil
            await recordAudit(
                'DELETE', 
                'Kwitansi', 
                `Deleted Receipt #${item.number || 'N/A'} for ${item.receivedFrom || 'N/A'} (Amount: ${item.amount || 0})`, 
                'User Deleted Document', 
                'warning'
            );

            // STEP 2: Hapus dokumen dari DB
            await supabase.from('documents').delete().eq('id', id);
            await supabase.from('receipts').delete().eq('id', id);

            // STEP 3: Update UI state (setelah DB sukses)
            setList(prev => prev.filter(i => i.id !== id));
            setDeleteConfirm(null);
            showToast(t('doc_deleted'), 'info');

            // STEP 4: Cleanup cashbook terkait
            await supabase.from('cashbook').delete().eq('user_id', user.id).ilike('description', `%${item.number}%`);
            
            // STEP 5: Broadcast event — PlanContext akan refresh dengan debounce 600ms
            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('Kwitansi delete sync error:', err);
            showToast(t('toast_error_save'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1E293B' }}>
                    {t('doc_type_kwt')}
                    {isKwitansiFree && (
                        <span style={{
                            fontSize: 12, fontWeight: 700, marginLeft: 10,
                            color: kwitansiCount >= (currentLimits?.kwitansi || 30) ? '#EF4444' : '#F59E0B',
                            background: kwitansiCount >= (currentLimits?.kwitansi || 30) ? '#FEE2E2' : '#FEF3C7',
                            padding: '2px 8px', borderRadius: 6
                        }}>
                            {kwitansiCount}/{currentLimits?.kwitansi || 30} {t('doc_type_kwt')}
                        </span>
                    )}
                </h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {activeTab === 'form' && (
                        <>
                            <button onClick={handleReset} className="btn btn-outline-danger"><RotateCcw size={15} /> {t('reset_form')}</button>
                            {form.id && form.id.length > 15 && (
                                <button
                                    onClick={handleDuplicate}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: '#EEF2FF', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                >
                                    <Copy size={15} /> {t('btn_duplicate') || 'Duplikat'}
                                </button>
                            )}
                            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
                                {isSaving ? '...' : (form.id && form.id.length > 15 ? t('doc_update') : t('doc_save'))}
                            </button>
                            <button onClick={handleDownloadPDF} className="btn btn-primary"><Download size={15} /> {t('doc_download_pdf')}</button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #E2E8F0' }}>
                {[{ key: 'form', label: t('doc_tab_new') }, { key: 'history', label: t('doc_tab_history'), icon: Clock }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #7C3AED' : '2px solid transparent', color: activeTab === tab.key ? '#7C3AED' : '#64748B', marginBottom: -2, transition: 'color 200ms' }}>
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
                                                <p className="truncate max-w-[150px]" style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{item.receivedFrom || '—'}</p>
                                            </div>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748B', flex: '0 0 90px', whiteSpace: 'nowrap' }}>{item.date}</p>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#7C3AED', flex: '0 0 110px', whiteSpace: 'nowrap' }}>{formatCompactCurrency(item.amount || 0)}</p>
                                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                <button onClick={() => setPreviewItem(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3B82F6', background: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                    <Eye size={13} /> {t('doc_see')}
                                                </button>
                                                <button onClick={() => handleEditHistory(item)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                    <Pencil size={13} /> {t('doc_edit')}
                                                </button>
                                                <button onClick={() => setDeleteConfirm(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #EF4444', background: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                    <Trash2 size={13} /> {t('doc_delete')}
                                                </button>
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
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{t('kwt_delete_title')}</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>{t('kwt_delete_body')}</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">{t('cancel')}</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">{t('doc_delete')}</button>
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
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{t('kwt_official_receipt')}</h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                                    No: {previewItem.number} &middot; {formatDateID(previewItem.date, lang)}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setPreviewItem(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>{t('doc_close')}</button>
                                <button onClick={handleDownloadPDF} disabled={isDownloading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                                    <Download size={16} /> {t('doc_download_pdf')}
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                            <div id="kwitansi-preview" style={{ padding: '48px', background: 'white', color: '#000', minHeight: '100%' }}>
                                <div style={{ textAlign: 'center', marginBottom: 40, borderBottom: '2px solid #F1F5F9', paddingBottom: 30 }}>
                                    {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', marginBottom: 16 }} /> : <div style={{ height: 40, width: 40, background: '#7C3AED', borderRadius: 8, margin: '0 auto 16px' }} />}
                                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: -1, color: '#111827' }}>{t('kwt_official_receipt')}</h1>
                                    <p style={{ margin: 0, color: '#64748B', fontWeight: 600 }}>{t('doc_number_label')}: {previewItem.number}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0, marginBottom: 40 }}>
                                    {[
                                        [t('doc_date_label'), formatDateID(previewItem.date, lang)],
                                        [t('inv_pdf_from'), previewItem.receivedFrom],
                                        [t('hp_col_amount'), formatIDR(previewItem.amount, lang)],
                                        ['', <em key="words" style={{ fontStyle: 'italic', fontWeight: 600, color: '#4B5563', fontSize: 13 }}>{terbilang(previewItem.amount || 0, lang)}</em>],
                                        [t('kwt_payment_for'), previewItem.description]
                                    ].map(([label, val], idx) => (
                                        <div key={idx} style={{ display: 'flex', padding: '16px 0', borderBottom: '1px solid #F1F5F9' }}>
                                            <div style={{ width: 160, fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                                            <div style={{ flex: 1, fontSize: 15, color: '#111827', fontWeight: label.includes('Sejumlah') || label.includes('sum') ? 900 : 600 }}>{val}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 80 }}>
                                    <div style={{ padding: '20px 32px', background: '#F8FAFC', borderRadius: 12, border: '2px solid #E2E8F0' }}>
                                        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>{t('hp_col_amount')}</p>
                                        <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(previewItem.amount, lang)}</p>
                                    </div>
                                    <div style={{ textAlign: 'center', width: 230, position: 'relative' }}>
                                        {/* 1. Teks Atas (Fixed) */}
                                        <p style={{ margin: '0 0 10px', fontSize: 13 }}>{t('kwt_signature') !== 'kwt_signature' ? t('kwt_signature') : 'Hormat Kami,'}</p>
                                        
                                        {/* 2. LORONG KERJA TTD (Titik Nol Baru untuk Absolute) */}
                                        <div style={{ position: 'relative', width: '100%', height: 110, margin: '0 auto' }}>
                                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                                                {previewItem.stamp && (
                                                    <img 
                                                        src={previewItem.stamp} 
                                                        alt="" 
                                                        style={{ 
                                                            position: 'absolute', 
                                                            left: `${previewItem.stampPos?.x || 0}px`,
                                                            top: `${previewItem.stampPos?.y || 20}px`,
                                                            width: `${previewItem.stampSize?.width || previewItem.stampSize || 100}px`,
                                                            objectFit: 'contain',
                                                            zIndex: 1 
                                                        }} 
                                                    />
                                                )}
                                                {previewItem.signature && (
                                                    <img 
                                                        src={previewItem.signature} 
                                                        alt="" 
                                                        style={{ 
                                                            position: 'absolute', 
                                                            left: `${previewItem.sigPos?.x || 0}px`,
                                                            top: `${previewItem.sigPos?.y || 30}px`,
                                                            width: `${previewItem.sigSize?.width || previewItem.sigSize || 150}px`,
                                                            objectFit: 'contain',
                                                            zIndex: 2
                                                        }} 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* 3. Garis & Nama (Fixed) */}
                                        <div style={{ borderTop: '1px solid #000', paddingTop: 6, position: 'relative', zIndex: 10, backgroundColor: 'transparent', marginTop: 5 }}>
                                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{previewItem.receiverName || '...'}</p>
                                            {previewItem.receiverTitle && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{previewItem.receiverTitle}</p>}
                                        </div>
                                    </div>
                                </div>
                                <p style={{ marginTop: 60, fontSize: 11, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic', fontWeight: 500 }}>
                                    {t('kwt_footer_hint') || 'Dokumen ini sah tanpa tanda tangan basah jika dicetak dari sistem.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Form tab */}
            {activeTab === 'form' && (
                <div className="split-layout">
                    {/* LEFT: Form */}
                    <div>
                        <div className="card" style={{ animation: 'none' }}>
                            {[
                                { key: 'number', label: t('inv_number') },
                                { key: 'date', label: t('doc_date_label'), type: 'date' },
                                { key: 'receivedFrom', label: t('inv_pdf_from') },
                                { key: 'description', label: t('kwt_payment_for') },
                                { key: 'receiverName', label: t('kwt_receiver_name') },
                                { key: 'receiverTitle', label: t('kwt_receiver_title') },
                            ].map(f => (
                                <div key={f.key} className="form-group">
                                    <label className="label">{f.label}</label>
                                    <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                </div>
                            ))}

                            <div className="form-group">
                                <label className="label">{t('hp_col_amount')}</label>
                                <input
                                    className="input"
                                    type="text"
                                    inputMode="numeric"
                                    value={formatInputNumber(form.amount)}
                                    onChange={e => setField('amount', e.target.value)}
                                    placeholder="0"
                                    style={{ fontSize: 22, fontWeight: 800, textAlign: 'right' }}
                                />
                            </div>

                            <div style={{ padding: '12px 14px', background: '#F5F3FF', borderRadius: 10, marginBottom: 16 }}>
                                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>{t('kwt_terbilang')}</p>
                                <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: '#374151' }}>{terbilangText}</p>
                            </div>

                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label className="label" style={{ margin: 0 }}>{t('kwt_upload_sig')}</label>
                                    {form.signature && (
                                        <button type="button" onClick={() => { setField('signature', null); document.getElementById('input-sig').value = ''; }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FEF2F2', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /> {t('delete')}</button>
                                    )}
                                </div>
                                <input id="input-sig" type="file" accept="image/*" className="input" style={{ padding: '8px' }}
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        if (file) { const reader = new FileReader(); reader.onload = ev => setField('signature', ev.target.result); reader.readAsDataURL(file); }
                                    }} />
                                {form.signature && (
                                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div>
                                            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Move size={12} color="#7C3AED" /> {t('kwt_sig_size')}: <strong>{sigSize}px</strong>
                                            </label>
                                            <input type="range" min={60} max={220} value={sigSize} onChange={e => setSigSize(Number(e.target.value))}
                                                style={{ width: '100%', accentColor: '#7C3AED', touchAction: 'none' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                            <div>
                                                <label className="label" style={{ fontSize: 11 }}>← X: <strong>{Math.round(sigPos.x)}px</strong></label>
                                                <input type="range" min={-100} max={500} value={Math.round(sigPos.x)} onChange={e => setSigPos(p => ({ ...p, x: Number(e.target.value) }))}
                                                    style={{ width: '100%', accentColor: '#7C3AED', touchAction: 'none' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label className="label" style={{ margin: 0 }}>{t('kwt_upload_stamp')}</label>
                                    {form.stamp && (
                                        <button type="button" onClick={() => { setField('stamp', null); document.getElementById('input-stamp').value = ''; }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FEF2F2', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /> {t('delete')}</button>
                                    )}
                                </div>
                                <input id="input-stamp" type="file" accept="image/*" className="input" style={{ padding: '8px' }}
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        if (file) { const reader = new FileReader(); reader.onload = ev => setField('stamp', ev.target.result); reader.readAsDataURL(file); }
                                    }} />
                                {form.stamp && (
                                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div>
                                            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Move size={12} color="#F59E0B" /> {t('kwt_stamp_size')}: <strong>{stampSize}px</strong>
                                            </label>
                                            <input type="range" min={50} max={180} value={stampSize} onChange={e => setStampSize(Number(e.target.value))}
                                                style={{ width: '100%', accentColor: '#F59E0B', touchAction: 'none' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                            <div>
                                                <label className="label" style={{ fontSize: 11 }}>← X: <strong>{Math.round(stampPos.x)}px</strong></label>
                                                <input type="range" min={-100} max={500} value={Math.round(stampPos.x)} onChange={e => setStampPos(p => ({ ...p, x: Number(e.target.value) }))}
                                                    style={{ width: '100%', accentColor: '#F59E0B', touchAction: 'none' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="label">{t('inv_logo_label')}</label>
                                <LogoUpload size="sm" />
                            </div>
                        </div>
                    </div>

                    <div style={{ position: 'sticky', top: 80 }}>
                        <div
                            id="kwitansi-preview"
                            ref={previewRef}
                            style={{
                                background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif',
                                padding: 32, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                                border: '2px solid #7C3AED',
                                position: 'relative', overflow: 'hidden',
                                minHeight: 480,
                            }}
                        >
                            {logo && (
                                <img src={logo} alt="" aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', maxWidth: 300, objectFit: 'contain', opacity: 0.07, pointerEvents: 'none', zIndex: 0 }} />
                            )}

                            <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px dashed #E2E8F0', paddingBottom: 16 }}>
                                <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#7C3AED', letterSpacing: 2, textTransform: 'uppercase' }}>{t('kwt_official_receipt')}</h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{t('doc_number_label')}: {form.number}</p>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, tableLayout: 'fixed' }}>
                                <tbody>
                                    {[
                                        [t('doc_date_label'), formatDateID(form.date)],
                                        [t('inv_pdf_from'), form.receivedFrom || '—'],
                                        [t('hp_col_amount'), <strong key="amt" style={{ color: '#7C3AED' }}>{formatIDR(amountNum)}</strong>],
                                        [t('kwt_terbilang'), <em key="words">{terbilangText}</em>],
                                        [t('kwt_payment_for'), form.description || '—'],
                                    ].map(([label, val]) => (
                                        <tr key={String(label)}>
                                            <td style={{ padding: '6px 12px 6px 0', fontSize: 13, fontWeight: 600, color: '#374151', width: 140, verticalAlign: 'top' }}>{label}</td>
                                            <td style={{ padding: '6px 0', fontSize: 13, wordBreak: 'break-word' }}>: {val}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
                                <div style={{ textAlign: 'center', width: 230, position: 'relative' }}>
                                    {/* 1. Teks Atas (Fixed) */}
                                    <p style={{ margin: '0 0 10px', fontSize: 13 }}>{t('kwt_signature') !== 'kwt_signature' ? t('kwt_signature') : 'Hormat Kami,'}</p>
                                    
                                    {/* 2. LORONG KERJA TTD (Titik Nol Baru untuk Absolute) */}
                                    <div style={{ position: 'relative', width: '100%', height: 110, margin: '0 auto' }}>
                                        <div style={{ position: 'absolute', inset: 0 }}>
                                            <DraggableImage src={form.stamp} alt="stempel" pos={stampPos} size={stampSize?.width || stampSize || 100} onPosChange={setStampPos} containerRef={previewRef} accent="#F59E0B" zIndex={1} />
                                            <DraggableImage src={form.signature} alt="ttd" pos={sigPos} size={sigSize?.width || sigSize || 150} onPosChange={setSigPos} containerRef={previewRef} accent="#7C3AED" zIndex={2} />
                                        </div>
                                    </div>
                                    
                                    {/* 3. Garis & Nama (Fixed) */}
                                    <div style={{ borderTop: '1px solid #000', paddingTop: 6, position: 'relative', zIndex: 10, backgroundColor: 'transparent', marginTop: 5 }}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{form.receiverName || '...'}</p>
                                        {form.receiverTitle && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.receiverTitle}</p>}
                                    </div>
                                </div>
                            </div>

                            {(effectivePlan === 'free' && !isAdmin) && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
                            <p style={{ marginTop: 24, fontSize: 10, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic' }}>
                                {t('kwt_footer_hint') || 'Dokumen ini sah tanpa tanda tangan basah jika dicetak dari sistem.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {showLimitModal && <LimitModal plan="PRO" feature="Kwitansi" onClose={() => setShowLimitModal(false)} />}
        </div>
    );
}
