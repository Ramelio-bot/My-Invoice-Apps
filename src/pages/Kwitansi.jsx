import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, RotateCcw, Eye, Pencil, Trash2, Clock, X, Move } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
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

// ── Draggable image helper ─────────────────────────────────────────────────────
function DraggableImage({ src, alt, pos, size, onPosChange, containerRef, accent }) {
    const dragRef = useRef(null);
    const isDragging = useRef(false);
    const startOffset = useRef({ x: 0 });

    const onPointerDown = useCallback((e) => {
        e.preventDefault();
        isDragging.current = true;
        dragRef.current = e.currentTarget;
        dragRef.current.setPointerCapture(e.pointerId);
        const rect = dragRef.current.getBoundingClientRect();
        startOffset.current = { x: e.clientX - rect.left };
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!isDragging.current || !containerRef.current) return;
        const container = containerRef.current.getBoundingClientRect();
        const x = e.clientX - container.left - startOffset.current.x;
        onPosChange({ x: x, y: pos.y }); // Keep Y unchanged
    }, [onPosChange, containerRef, pos.y]);

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
                left: pos.x,
                top: '50%',
                transform: 'translateY(-50%)',
                width: size,
                objectFit: 'contain',
                cursor: 'grab',
                userSelect: 'none',
                touchAction: 'none',
                border: `1.5px dashed ${accent}44`,
                borderRadius: 4,
                zIndex: 10,
            }}
        />
    );
}

export default function Kwitansi() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkInvoiceKwitansiLimit, incrementInvoiceKwitansi, getInvoiceKwitansiCount,
        refreshUsage
    } = usePlan();
    const { effectivePlan, isAdmin, user, supabase } = useAuth();
    const { logo } = useCompanyLogo();
    const [list, setList] = useState([]); // Removed useLocalStorage
    const [cashbook, setCashbook] = useState([]); // Removed useLocalStorage

    const combinedCount = getInvoiceKwitansiCount();
    const isKwitansiFree = !isAdmin && effectivePlan === 'free';

    const [form, setForm] = useLocalStorage('kwitansi_draft', defaultForm());
    const [activeTab, setActiveTab] = useState('form');
    const [statusMenuOpen, setStatusMenuOpen] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchKwitansi = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'kwitansi')
            .order('created_at', { ascending: false });

        if (!error && data) {
            const mapped = data.map(d => ({
                id: d.id,
                user_id: d.user_id,
                number: d.number,
                receivedFrom: d.client_name,
                amount: d.total,
                status: d.status,
                date: d.date,
                createdAt: d.created_at,
                ...(d.data || {})
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

    // Draggable positions & sizes — persisted to localStorage so they survive navigation
    const [sigPos, setSigPos] = useLocalStorage('kwt_sig_pos', { x: 20, y: 8 });
    const [stampPos, setStampPos] = useLocalStorage('kwt_stamp_pos', { x: 10, y: 10 });
    const [sigSize, setSigSize] = useLocalStorage('kwt_sig_size', 120);
    const [stampSize, setStampSize] = useLocalStorage('kwt_stamp_size', 90);
    const previewRef = useRef(null);

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const amountNum = parseFloat(String(form.amount).replace(/[^\d]/g, '')) || 0;
    const terbilangText = amountNum > 0 ? terbilang(amountNum) : '—';

    // ── Bilingual text ─────────────────────────────────────────────────────────
    const T = {
        title: 'Kwitansi',                 // always ID per spec
        reset: lang === 'EN' ? 'Reset' : 'Reset',
        save: lang === 'EN' ? 'Save' : 'Simpan',
        download: lang === 'EN' ? 'Download PDF' : 'Download PDF',
        formNew: lang === 'EN' ? 'New Form' : 'Form Baru',
        history: lang === 'EN' ? 'History' : 'Riwayat',
        noData: lang === 'EN' ? 'No documents yet.' : 'Belum ada dokumen tersimpan.',
        number: lang === 'EN' ? 'Receipt Number' : 'Nomor Kwitansi',
        date: lang === 'EN' ? 'Date' : 'Tanggal',
        receivedFrom: lang === 'EN' ? 'Received From' : 'Diterima Dari',
        description: lang === 'EN' ? 'Payment For' : 'Untuk Pembayaran',
        receiverName: lang === 'EN' ? 'Receiver Name' : 'Nama Penerima',
        receiverTitle: lang === 'EN' ? 'Receiver Title' : 'Jabatan Penerima',
        amount: lang === 'EN' ? 'Amount (Rp)' : 'Jumlah (Rp)',
        terbilang: lang === 'EN' ? 'In Words' : 'Terbilang',
        uploadSig: lang === 'EN' ? 'Signature (optional)' : 'Upload Tanda Tangan (opsional)',
        uploadStamp: lang === 'EN' ? 'Company Stamp (optional)' : 'Upload Stempel (opsional)',
        logo: lang === 'EN' ? 'Company Logo' : 'Logo Perusahaan',
        sigSize: lang === 'EN' ? 'Signature Size' : 'Ukuran TTD',
        stampSize: lang === 'EN' ? 'Stamp Size' : 'Ukuran Stempel',
        dragHint: lang === 'EN' ? 'Drag to reposition on preview' : 'Geser di preview untuk reposisi',
        hormatKami: lang === 'EN' ? 'Yours Sincerely,' : 'Hormat Kami,',
        deleteTitle: lang === 'EN' ? 'Delete Receipt?' : 'Hapus Kwitansi?',
        deleteMsg: lang === 'EN' ? 'This document will be permanently deleted.' : 'Dokumen ini akan dihapus permanen.',
        cancel: lang === 'EN' ? 'Cancel' : 'Batal',
        delete: lang === 'EN' ? 'Delete' : 'Hapus',
    };

    const handleReset = () => {
        setForm(defaultForm());
        setSigPos({ x: 20, y: 8 });
        setStampPos({ x: 10, y: 10 });
        setSigSize(120);
        setStampSize(90);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Form berhasil direset', 'success');
    };

    const handleSave = async () => {
        if (!form.receivedFrom || !amountNum) {
            showToast(lang === 'EN' ? 'Receiver name and amount are required' : 'Diterima dari dan jumlah wajib diisi', 'error');
            return;
        }
        const isEditing = list.some(i => i.number === form.number);
        if (isKwitansiFree && !isEditing && !checkInvoiceKwitansiLimit()) {
            showToast(`Batas gabungan Invoice & Kwitansi (10/bulan) tercapai. Upgrade PRO! 🚀`, 'warning');
            return;
        }
        const entry = {
            id: Date.now().toString(), ...form,
            amount: amountNum,
            sigPos, stampPos, sigSize, stampSize,
            createdAt: new Date().toISOString(),
        };

        // Persist to Supabase
        const dbReceipt = {
            user_id: user.id,
            type: 'kwitansi',
            number: form.number,
            client_name: form.receivedFrom,
            total: amountNum,
            status: 'paid',
            date: form.date,
            data: { ...form, amount: amountNum, sigPos, stampPos, sigSize, stampSize }
        };

        try {
            const isEditing = list.some(i => i.number === form.number);
            if (isEditing) {
                const existing = list.find(i => i.number === form.number);
                if (existing && existing.id.length > 15) {
                    await supabase.from('documents').update(dbReceipt).eq('id', existing.id);
                }
            } else {
                const { data: saved } = await supabase.from('documents').insert(dbReceipt).select().single();
                if (saved) {
                    entry.id = saved.id;
                    incrementInvoiceKwitansi();
                }
            }

            // Sync to cashbook
            await supabase.from('cashbook').insert({
                user_id: user.id,
                type: 'income',
                amount: amountNum,
                category: 'Pembayaran Jasa',
                description: `Kwitansi ${form.number} - ${form.receivedFrom} - Lunas`,
                date: form.date,
                reference_type: 'kwitansi'
            });
        } catch (err) {
            console.error('Kwitansi sync error:', err);
        }

        setList(prev => {
            const exists = prev.find(i => i.number === form.number);
            if (exists) return prev.map(i => i.number === form.number ? entry : i);
            return [entry, ...prev];
        });

        const cashEntry = {
            id: entry.id + '_kwt',
            user_id: user.id,
            type: 'income',
            amount: amountNum,
            category: 'Pembayaran Jasa',
            note: `Kwitansi ${form.number} - ${form.receivedFrom} - Lunas`,
            date: form.date,
            source: 'auto',
            sourceLabel: 'Auto dari Kwitansi',
            reference_type: 'kwitansi',
            createdAt: new Date().toISOString(),
        };
        setCashbook(prev => {
            const exists = prev.find(c => c.note.includes(form.number) && c.reference_type === 'kwitansi');
            if (exists) return prev.map(c => c.note.includes(form.number) && c.reference_type === 'kwitansi' ? cashEntry : c);
            return [cashEntry, ...prev];
        });

        incrementDocNumber('kwitansi');
        showToast('Kwitansi tersimpan', 'success');

        // Background Sync
        try {
            const { error: cbErr } = await supabase.from('cashbook').upsert({
                user_id: user.id,
                type: 'income',
                amount: amountNum,
                category: 'Pembayaran Jasa',
                description: `Kwitansi ${form.number} - ${form.receivedFrom} - Lunas`,
                date: form.date,
                reference_type: 'kwitansi'
            }, { onConflict: 'description' });
            if (cbErr) throw cbErr;
        } catch (err) {
            console.error('Kwitansi save sync error:', err);
            // Optionally, revert UI changes or show an error toast if sync fails
            showToast('Gagal menyimpan kwitansi ke server. Coba lagi.', 'error');
        }
    };

    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) { showToast('Batas download tercapai. Upgrade PRO!', 'warning'); return; }
        setIsDownloading(true);
        try {
            await generatePDF('kwitansi-preview', `Kwitansi-${form.number}.pdf`, isPremium);
            incrementDownload('kwitansi', form.number, amountNum, form.receivedFrom);
            showToast('PDF berhasil diunduh', 'success');
        } catch { showToast('Gagal mengunduh PDF', 'error'); } finally {
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

        // 1. Optimistic UI Update
        setList(prev => prev.filter(i => i.id !== id));
        refreshUsage();
        showToast('Dokumen dihapus', 'info');
        setDeleteConfirm(null);

        // Background Sync
        try {
            await supabase.from('documents').delete().eq('id', id);
            await supabase.from('cashbook').delete().eq('user_id', user.id).eq('reference_type', 'kwitansi').ilike('description', `%${item.number}%`);
            setCashbook(prev => prev.filter(c => !c.note.includes(item.number)));
        } catch (err) {
            console.error('Kwitansi delete sync error:', err);
        }
    };

    const inputSt = { fontSize: 13, width: '100%' };

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>
                    {T.title}
                    {isKwitansiFree && (
                        <span style={{
                            fontSize: 12, fontWeight: 700, marginLeft: 10,
                            color: combinedCount >= 10 ? '#EF4444' : '#F59E0B',
                            background: combinedCount >= 10 ? '#FEE2E2' : '#FEF3C7',
                            padding: '2px 8px', borderRadius: 6
                        }}>
                            {combinedCount}/10 Invoice & Kwitansi
                        </span>
                    )}
                </h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {activeTab === 'form' && (
                        <>
                            <button onClick={handleReset} className="btn btn-outline-danger"><RotateCcw size={15} /> {T.reset}</button>
                            <button onClick={handleSave} className="btn btn-outline">{T.save}</button>
                            <button onClick={handleDownloadPDF} className="btn btn-primary"><Download size={15} /> {T.download}</button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${dark ? '#334155' : '#E2E8F0'}` }}>
                {[{ key: 'form', label: T.formNew }, { key: 'history', label: T.history, icon: Clock }].map(tab => (
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
                            <p style={{ fontSize: 16, fontWeight: 600 }}>{T.noData}</p>
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
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{T.deleteTitle}</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>{T.deleteMsg}</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">{T.cancel}</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">{T.delete}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview modal */}
            {previewItem && (() => {
                const item = previewItem;
                const amt = item.amount || 0;
                return (
                    <div onClick={e => { if (e.target === e.currentTarget) setPreviewItem(null); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '20px 16px' }}>
                            <div style={{ background: 'white', color: '#000', borderRadius: 16, width: '95vw', maxWidth: 900, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'scaleIn 180ms cubic-bezier(0.4,0,0.2,1) forwards' }}>
                                <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, borderRadius: '16px 16px 0 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#7C3AED', letterSpacing: 1 }}>KWITANSI</h2>
                                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>No: {item.number}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button onClick={() => { setPreviewItem(null); handleEditHistory(item); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Pencil size={13} /> Edit</button>
                                        <button onClick={async () => { try { await generatePDF('kwt-prev-' + item.id, `Kwitansi-${item.number}.pdf`, isPremium); } catch { } }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#7C3AED', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}><Download size={13} /> PDF</button>
                                        <button onClick={() => setPreviewItem(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} color="#64748B" /></button>
                                    </div>
                                </div>
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
                                        <div style={{ textAlign: 'center', width: 180, position: 'relative' }}>
                                            <p style={{ margin: '0 0 60px', fontSize: 12 }}>Hormat Kami,</p>
                                            {item.stamp && <img src={item.stamp} alt="stempel" style={{ width: item.stampSize || 90, objectFit: 'contain', position: 'absolute', top: 20, left: 0, opacity: 0.75 }} />}
                                            {item.signature && <img src={item.signature} alt="ttd" style={{ width: item.sigSize || 120, objectFit: 'contain', marginBottom: 4 }} />}
                                            <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{item.receiverName || '...'}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '24px 28px' }}>
                                    <div style={{ background: '#F5F3FF', borderRadius: 10, border: '2px dashed #7C3AED', padding: '16px 20px', marginBottom: 20 }}>
                                        <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1 }}>Jumlah</p>
                                        <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(amt)}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 12, fontStyle: 'italic', color: '#64748B' }}>{terbilang(amt)}</p>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {[['Nomor', item.number], ['Tanggal', formatDateID(item.date)], ['Diterima dari', item.receivedFrom], ['Untuk', item.description], ['Penerima', item.receiverName], ['Jabatan', item.receiverTitle]].filter(([, v]) => v).map(([l, v]) => (
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
            {activeTab === 'form' && (
                <div className="split-layout">
                    {/* LEFT: Form */}
                    <div>
                        <div className="card" style={{ animation: 'none' }}>
                            {[
                                { key: 'number', label: T.number },
                                { key: 'date', label: T.date, type: 'date' },
                                { key: 'receivedFrom', label: T.receivedFrom },
                                { key: 'description', label: T.description },
                                { key: 'receiverName', label: T.receiverName },
                                { key: 'receiverTitle', label: T.receiverTitle },
                            ].map(f => (
                                <div key={f.key} className="form-group">
                                    <label className="label">{f.label}</label>
                                    <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                </div>
                            ))}

                            <div className="form-group">
                                <label className="label">{T.amount}</label>
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
                                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase' }}>{T.terbilang}</p>
                                <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: dark ? '#CBD5E1' : '#374151' }}>{terbilangText}</p>
                            </div>

                            {/* Signature upload + size/position sliders */}
                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label className="label" style={{ margin: 0 }}>{T.uploadSig}</label>
                                    {form.signature && (
                                        <button type="button" onClick={() => { setField('signature', null); document.getElementById('input-sig').value = ''; }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FEF2F2', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /> Hapus</button>
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
                                                <Move size={12} color="#7C3AED" /> {T.sigSize}: <strong>{sigSize}px</strong>
                                            </label>
                                            <input type="range" min={60} max={220} value={sigSize} onChange={e => setSigSize(Number(e.target.value))}
                                                style={{ width: '100%', accentColor: '#7C3AED', touchAction: 'none' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                            <div>
                                                <label className="label" style={{ fontSize: 11 }}>← X ({T.dragHint.split(' ')[0]}): <strong>{Math.round(sigPos.x)}px</strong></label>
                                                <input type="range" min={-100} max={500} value={Math.round(sigPos.x)} onChange={e => setSigPos(p => ({ ...p, x: Number(e.target.value) }))}
                                                    style={{ width: '100%', accentColor: '#7C3AED', touchAction: 'none' }} />
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 11, color: '#7C3AED', fontStyle: 'italic' }}>{T.dragHint}</p>
                                    </div>
                                )}
                            </div>

                            {/* Stamp upload + size/position sliders */}
                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label className="label" style={{ margin: 0 }}>{T.uploadStamp}</label>
                                    {form.stamp && (
                                        <button type="button" onClick={() => { setField('stamp', null); document.getElementById('input-stamp').value = ''; }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FEF2F2', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}><Trash2 size={12} /> Hapus</button>
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
                                                <Move size={12} color="#F59E0B" /> {T.stampSize}: <strong>{stampSize}px</strong>
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
                                        <p style={{ margin: 0, fontSize: 11, color: '#F59E0B', fontStyle: 'italic' }}>{T.dragHint}</p>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="label">{T.logo}</label>
                                <LogoUpload size="sm" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Preview with draggable TTD/Stempel */}
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
                            {/* Watermark logo */}
                            {logo && (
                                <img src={logo} alt="" aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '70%', maxWidth: 300, objectFit: 'contain', opacity: 0.07, pointerEvents: 'none', zIndex: 0 }} />
                            )}

                            {/* Header */}
                            <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px dashed #E2E8F0', paddingBottom: 16 }}>
                                <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#7C3AED', letterSpacing: 2, textTransform: 'uppercase' }}>KWITANSI</h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>No: {form.number}</p>
                            </div>

                            {/* Data table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                                <tbody>
                                    {[
                                        ['Tanggal', formatDateID(form.date)],
                                        ['Diterima dari', form.receivedFrom || '—'],
                                        ['Jumlah', <strong key="amt" style={{ color: '#7C3AED' }}>{formatIDR(amountNum)}</strong>],
                                        ['Terbilang', <em key="tb">{terbilangText}</em>],
                                        ['Untuk', form.description || '—'],
                                    ].map(([label, val]) => (
                                        <tr key={label}>
                                            <td style={{ padding: '6px 12px 6px 0', fontSize: 13, fontWeight: 600, color: '#374151', width: 140, verticalAlign: 'top' }}>{label}</td>
                                            <td style={{ padding: '6px 0', fontSize: 13 }}>: {val}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Signature area */}
                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                                <div style={{ textAlign: 'center', width: 180, position: 'relative', minHeight: 110 }}>
                                    <p style={{ margin: '0 0 4px', fontSize: 12 }}>{T.hormatKami}</p>
                                    <p style={{ margin: '0 0 56px', fontSize: 12, color: '#64748B' }}>{form.receiverName || '...'}</p>
                                    {/* Draggable Stempel */}
                                    <DraggableImage
                                        src={form.stamp}
                                        alt="stempel"
                                        pos={stampPos}
                                        size={stampSize}
                                        onPosChange={setStampPos}
                                        containerRef={previewRef}
                                        accent="#F59E0B"
                                    />
                                    {/* Draggable TTD */}
                                    <DraggableImage
                                        src={form.signature}
                                        alt="ttd"
                                        pos={sigPos}
                                        size={sigSize}
                                        onPosChange={setSigPos}
                                        containerRef={previewRef}
                                        accent="#7C3AED"
                                    />
                                    <div style={{ borderTop: '1px solid #000', paddingTop: 6 }}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{form.receiverName || '...'}</p>
                                        {form.receiverTitle && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.receiverTitle}</p>}
                                    </div>
                                </div>
                            </div>

                            {!isPremium && <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 20 }}>Generated by MyInvoice.space</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
