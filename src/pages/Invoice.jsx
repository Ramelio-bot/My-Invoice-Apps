import { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Download, RotateCcw, Plus, Trash2, CheckCircle, Eye, Pencil, Clock, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatCompactCurrency, formatInputNumber, parseCurrency } from '../utils/currency';
import { formatDateID, todayStr } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { useLocation } from 'react-router-dom';
import DocumentTemplate from '../components/DocumentTemplate';
import UpgradeModal from '../components/UpgradeModal';
import LimitModal from '../components/LimitModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const emptyItem = () => ({ id: Date.now(), desc: '', qty: '', unit: 'pcs', price: '', total: 0 });

const defaultForm = () => ({
    // Company
    companyName: '', companyAddress: '', companyCity: '', companyPhone: '', companyEmail: '', companyWebsite: '',
    companyLogo: '',
    // Client
    clientName: '', clientAddress: '', clientPhone: '', clientEmail: '',
    // Invoice
    number: '', date: todayStr(), dueDate: '', currency: 'IDR', status: 'unpaid',
    // Items
    items: [emptyItem()],
    discount: '', tax: '', notes: '',
    // Payment
    bank: '', accountNumber: '', accountName: '', paymentInstructions: '',
});



export default function Invoice() {
    const { dark } = useTheme();
    const { t, lang } = useLang();
    const { logo } = useCompanyLogo();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkInvoiceLimit, incrementInvoice, incrementKwitansi, refreshUsage, getInvoiceCount
    } = usePlan();
    const { user, effectivePlan, isAdmin } = useAuth();
    
    const STATUS_OPTIONS = useMemo(() => [
        { value: 'unpaid', label: t('inv_status_unpaid'), color: '#EF4444', bg: '#FEE2E2' },
        { value: 'paid', label: t('inv_status_paid'), color: '#10B981', bg: '#D1FAE5' },
        { value: 'waiting', label: t('inv_status_waiting'), color: '#F59E0B', bg: '#FEF3C7' },
        { value: 'cancelled', label: t('inv_status_cancelled'), color: '#64748B', bg: '#F1F5F9' },
    ], [t]);

    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);
    const [invoices, setInvoices] = useState([]); // Removed useLocalStorage
    const [kwitansiData, setKwitansiData] = useState([]);
    const [cashbook, setCashbook] = useState([]);
    const [clients, setClients] = useState([]);
    const [form, setForm] = useLocalStorage('draft_invoice', { ...defaultForm(), number: peekDocNumber('invoice') });
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState('form');
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [statusMenuOpen, setStatusMenuOpen] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const location = useLocation();

    const fetchInvoices = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'invoice')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Map Supabase 'data' column (JSONB) back to flat structure if needed
            const mapped = data.map(d => ({
                ...(d.data || {}),                          // ← spread JSONB dulu
                id: d.id,                                   // ← override dengan true UUID
                user_id: d.user_id,
                // Override dengan nilai kolom DB yang selalu akurat:
                status: d.status,                           // ← kolom DB menang
                number: d.doc_number || d.number || (d.data || {}).number,
                clientName: d.client_name,
                total: d.total_amount || d.total,
                grandTotal: d.total_amount || (d.data || {}).grandTotal || d.total,
                createdAt: d.created_at,
                date: d.created_at?.split('T')[0] || (d.data || {}).date,
            }));
            setInvoices(mapped);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchInvoices();
        fetchClients();
    }, [user?.id]);

    const fetchClients = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true });
        if (!error && data) {
            setClients(data);
        }
    };

    // Load invoice from Laporan navigation
    useEffect(() => {
        const { invoiceId } = location.state || {};
        if (invoiceId) {
            const found = invoices.find(inv => inv.id === invoiceId);
            if (found) {
                setForm({ ...found });
                setActiveTab('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            // Clear state to prevent re-loading on re-render
            window.history.replaceState({}, '');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const updateItem = (id, key, val) => {
        setForm(f => ({
            ...f,
            items: f.items.map(item => {
                if (item.id !== id) return item;
                const cleanVal = (key === 'price') ? parseCurrency(val) : val;
                const updated = { ...item, [key]: cleanVal };
                updated.total = (parseFloat(updated.qty) || 0) * (parseFloat(updated.price) || 0);
                return updated;
            })
        }));
    };

    const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (id) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

    const subtotal = form.items.reduce((s, i) => s + (i.total || 0), 0);
    const discountAmt = subtotal * (parseFloat(form.discount) || 0) / 100;
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = afterDiscount * (parseFloat(form.tax) || 0) / 100;
    const grandTotal = afterDiscount + taxAmt;

    const handleSave = async (isMarkingPaid = false) => {
        // Cek limit untuk FREE plan (Invoice)
        const isEditing = invoices.some(inv => inv.number === form.number);
        if (!isPro && !isAdmin && !isEditing && getInvoiceCount() >= 10) {
            setShowLimitModal(true);
            return false;
        }

        const num = form.number || incrementDocNumber('invoice');
        const finalStatus = isMarkingPaid ? 'paid' : form.status;
        const existing = invoices.find(inv => inv.number === num);
        const newlyPaid = (isMarkingPaid || (finalStatus === 'paid' && (!existing || existing.status !== 'paid')));

        if (isSaving) return;
        setIsSaving(true);

        const invoice = {
            id: existing ? existing.id : Date.now().toString(),
            ...form,
            status: finalStatus,
            number: num,
            subtotal, discountAmt, taxAmt, grandTotal,
            createdAt: existing ? existing.createdAt : new Date().toISOString(),
        };

        // Persist to Supabase
        const dbInvoice = {
            user_id: user.id,
            type: 'invoice',
            doc_number: num,
            client_name: form.clientName,
            total_amount: grandTotal,
            status: finalStatus,
            data: { ...form, lang, subtotal, discountAmt, taxAmt, grandTotal } // Store full data in JSONB (includes date, dueDate, items)
        };

        try {
            if (existing && existing.id.length > 15) { // Likely UUID from Supabase
                await supabase.from('documents').update(dbInvoice).eq('id', existing.id);
            } else {
                const { data: savedInv } = await supabase.from('documents').insert(dbInvoice).select().single();
                if (savedInv) {
                    invoice.id = savedInv.id;
                    incrementInvoice();
                }
            }
        } catch (err) {
            console.error('Invoice sync error:', err);
            showToast(t('toast_error_save'), 'error');
        } finally {
            setIsSaving(false);
        }

        setInvoices(prev => {
            const exists = prev.find(inv => inv.number === num);
            if (exists) return prev.map(inv => inv.number === num ? invoice : inv);
            return [invoice, ...prev];
        });

        if (!existing) incrementDocNumber('invoice');

        if (newlyPaid) {
            // Auto generate kwitansi
            const kwtNum = incrementDocNumber('kwitansi');
            const newKwt = {
                id: Date.now().toString(),
                number: kwtNum,
                date: todayStr(),
                receivedFrom: form.clientName,
                amount: grandTotal,
                description: `${t('doc_pembayaran_invoice')} Invoice ${num}`,
                receiverName: form.companyName,
                createdAt: new Date().toISOString(),
            };
            setKwitansiData(prev => [newKwt, ...prev]);

            // Sync new receipt to Supabase
            await supabase.from('documents').insert({
                user_id: user.id,
                type: 'kwitansi',
                doc_number: kwtNum,
                client_name: form.clientName,
                total_amount: grandTotal,
                status: 'paid',
                data: {
                    receivedFrom: form.clientName,
                    amount: grandTotal,
                    description: `${t('doc_pembayaran_invoice')} Invoice ${num}`,
                    receiverName: form.companyName
                }
            });
            incrementKwitansi();

            // Auto add to cashbook
            const cashEntry = {
                id: Date.now().toString() + '_inv',
                user_id: user.id,
                type: 'income',
                amount: grandTotal,
                category: t('inv_status_paid'),
                note: `Invoice ${num} - ${form.clientName || 'Klien'} - ${t('inv_status_paid')}`,
                date: todayStr(),
                source: 'auto',
                sourceLabel: t('doc_auto_invoice'),
                reference_type: 'invoice',
                createdAt: new Date().toISOString(),
            };
            setCashbook(prev => [cashEntry, ...prev]);

            // Sync to Supabase cashbook with check-then-insert
            try {
                const cashDescription = `Invoice ${num} - ${form.clientName || 'Klien'} - Lunas`;
                const { data: existingCash } = await supabase
                    .from('cashbook')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('description', cashDescription)
                    .maybeSingle();

                if (!existingCash) {
                    const { error: cbErr } = await supabase.from('cashbook').insert({
                        user_id: user.id,
                        type: 'income',
                        amount: parseInt(grandTotal.toString().replace(/\D/g, ''), 10),
                        category: 'Invoice Lunas',
                        description: cashDescription,
                        date: todayStr(),
                        reference_type: 'invoice'
                    });
                    if (cbErr) throw cbErr;
                }
            } catch (err) {
                console.error('Invoice to Cashbook sync error details:', err);
            }
        }

        if (isMarkingPaid) {
            setField('status', 'paid');
            showToast(t('inv_paid_toast'), 'success');
        } else {
            showToast(t('saved'), 'success');
        }
        window.dispatchEvent(new Event('invoice-updated'));
        if (newlyPaid) window.dispatchEvent(new Event('cashbook-updated'));
        return true;
    };

    const handleMarkPaid = async () => {
        await handleSave(true);
    };



    const handleDownloadPDF = async (invoiceToDownload = form) => {
        if (!isPro && !checkDownloadLimit()) {
            showToast(t('inv_download_limit'), 'warning');
            return;
        }
        setIsDownloading(true);
        try {
            await generatePDF('invoice-preview', `Invoice-${invoiceToDownload.number || 'Draft'}.pdf`, isPremium);
            incrementDownload('invoice', invoiceToDownload.number, invoiceToDownload.grandTotal);
            showToast(t('inv_pdf_success'), 'success');
        } catch (e) {
            console.error('Download error:', e);
            showToast(t('inv_pdf_fail'), 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleReset = () => {
        setForm({ ...defaultForm(), number: peekDocNumber('invoice') });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(t('doc_reset_toast'), 'success');
    };

    // --- Riwayat Tab State ---
    const handleViewHistory = (inv) => setPreviewInvoice(inv);
    const handleEditHistory = (inv) => {
        setForm({ ...inv });
        setActiveTab('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleDeleteHistory = async (id) => {
        const invToDelete = invoices.find(i => i.id === id);
        if (!invToDelete) return;

        // Optimistic UI Update
        setInvoices(prev => prev.filter(i => i.id !== id));
        showToast(t('inv_doc_deleted'), 'info');
        setDeleteConfirm(null);

        // Background Sync
        try {
            await supabase.from('documents').delete().eq('id', id);
            refreshUsage();
            if (invToDelete.status === 'paid') {
                await supabase.from('cashbook').delete().eq('user_id', user.id).eq('category', 'Invoice Lunas').ilike('description', `%${invToDelete.number}%`);
                setCashbook(prev => prev.filter(c => !c.note.includes(invToDelete.number)));
            }
        } catch (err) {
            console.error('Delete sync error:', err);
        }
    };
    const handleUpdateStatus = async (invoiceId, newStatus) => {
        // Cari status lama dan data untuk sync cashbook
        const oldInvoice = invoices.find(d => d.id === invoiceId);
        const oldStatus = oldInvoice?.status;
        const docNumber = oldInvoice?.number || oldInvoice?.doc_number;
        const amount = Math.round(oldInvoice?.grandTotal || oldInvoice?.total_amount || oldInvoice?.total || 0);

        // 1. Update DB (dengan fallback doc_number jika ID mismatch)
        let updateResult, error;
        ({ data: updateResult, error } = await supabase
            .from('documents')
            .update({ status: newStatus })
            .eq('id', invoiceId)
            .eq('user_id', user.id)
            .select());

        if (!error && (!updateResult || updateResult.length === 0) && docNumber) {
            ({ data: updateResult, error } = await supabase
                .from('documents')
                .update({ status: newStatus })
                .eq('doc_number', docNumber)
                .eq('user_id', user.id)
                .select());
        }

        if (error) {
            showToast('Gagal: ' + error.message, 'error');
            fetchInvoices();
            return;
        }

        if (!updateResult || updateResult.length === 0) {
            showToast('Status gagal tersimpan', 'error');
            fetchInvoices();
            return;
        }

        // 2. Logic Dua Arah Cashbook
        // CASE 1: Status berubah KE 'paid' → tambah cashbook income
        if (newStatus === 'paid' && oldStatus !== 'paid') {
            const { data: existingCash } = await supabase
                .from('cashbook')
                .select('id')
                .eq('user_id', user.id)
                .ilike('description', `%${docNumber}%`)
                .eq('category', 'Invoice Lunas')
                .maybeSingle();

            if (!existingCash) {
                await supabase.from('cashbook').insert({
                    user_id: user.id,
                    type: 'income',
                    amount: amount,
                    description: `Invoice ${docNumber} - ${oldInvoice?.clientName || ''}`,
                    date: new Date().toISOString().split('T')[0],
                    category: t('inv_status_paid'),
                    reference_type: 'invoice'
                });
            }
        }

        // CASE 2: Status berubah DARI 'paid' ke status lain → hapus cashbook income
        if (oldStatus === 'paid' && newStatus !== 'paid') {
            await supabase
                .from('cashbook')
                .delete()
                .eq('user_id', user.id)
                .eq('category', t('inv_status_paid'))
                .ilike('description', `%${docNumber}%`);
        }

        // 3. Update local state
        setInvoices(prev => prev.map(doc =>
            (doc.id === invoiceId || doc.number === docNumber)
                ? { ...doc, status: newStatus }
                : doc
        ));

        showToast(t('inv_status_updated') || 'Status diperbarui', 'success');
        window.dispatchEvent(new Event('cashbook-updated'));
        window.dispatchEvent(new Event('invoice-updated'));
    };

    const shareInvoiceViaWA = (invoice) => {
        const message = lang === 'ID' 
            ? `📄 *INVOICE ${invoice.number}*
Kepada: ${invoice.clientName || invoice.client_name || '-'}
Tanggal: ${formatDateID(invoice.date)}
Jatuh Tempo: ${invoice.dueDate ? formatDateID(invoice.dueDate) : '-'}
─────────────────
${(invoice.items || []).filter(i => i.desc).map(i => `• ${i.desc}: ${formatIDR(i.total)}`).join('\n')}
─────────────────
*TOTAL: ${formatIDR(invoice.grandTotal || invoice.total)}*
Status: ${invoice.status === 'paid' ? '✅ Lunas' : '⏳ Belum Lunas'}

Mohon segera melakukan pembayaran.
Terima kasih 🙏`
            : `📄 *INVOICE ${invoice.number}*
To: ${invoice.clientName || invoice.client_name || '-'}
Date: ${invoice.date}
Due Date: ${invoice.dueDate || '-'}
─────────────────
${(invoice.items || []).filter(i => i.desc).map(i => `• ${i.desc}: ${formatIDR(i.total)}`).join('\n')}
─────────────────
*TOTAL: ${formatIDR(invoice.grandTotal || invoice.total)}*
Status: ${invoice.status === 'paid' ? '✅ Paid' : '⏳ Unpaid'}

Please complete the payment soon.
Thank you 🙏`;

        const phone = invoice.clientPhone || invoice.data?.clientPhone || invoice.data?.companyPhone || '';
        const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const STATUS_MAP = {
        unpaid: { label: t('inv_unpaid') || 'Belum Bayar', color: '#EF4444', bg: '#FEE2E2' },
        paid: { label: t('inv_paid') || 'Lunas', color: '#10B981', bg: '#D1FAE5' },
        waiting: { label: lang === 'ID' ? 'Menunggu' : 'Waiting', color: '#F59E0B', bg: '#FEF3C7' },
        cancelled: { label: lang === 'ID' ? 'Dibatalkan' : 'Cancelled', color: '#64748B', bg: '#F1F5F9' },
    };

    const pickClient = (e) => {
        const client = clients.find(c => c.name === e.target.value);
        if (client) {
            setField('clientName', client.name);
            setField('clientAddress', client.address || '');
            setField('clientPhone', client.phone || '');
            setField('clientEmail', client.email || '');
        }
    };

    const statusObj = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0];
    const symCur = form.currency === 'IDR' ? 'Rp' : form.currency;


    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
            <DocumentTemplate docType="invoice" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: dark ? '#F1F5F9' : '#1E293B' }}>
                    {t('nav_invoice')}
                </h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    {activeTab === 'form' && (
                        <>
                            <button onClick={handleReset} className="btn btn-outline-danger">
                                <RotateCcw size={15} /> {t('inv_reset')}
                            </button>
                            {form.status === 'unpaid' && (
                                <button onClick={handleMarkPaid} className="btn btn-success">
                                    <CheckCircle size={15} /> {t('inv_mark_paid')}
                                </button>
                            )}
                            <button onClick={() => handleSave()} disabled={isSaving} className="btn-save flex items-center gap-2" style={{ padding: '12px 28px', borderRadius: 12, background: isSaving ? '#94A3B8' : '#3B82F6', border: 'none', color: 'white', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                                {isSaving ? '...' : <RotateCcw size={18} />}
                                {isSaving ? t('doc_saving') : t('doc_save')}
                            </button>
                            <button onClick={handleDownloadPDF} className="btn btn-primary" disabled={isDownloading}>
                                <Download size={15} /> {isDownloading ? t('doc_downloading') : t('inv_download')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${dark ? '#334155' : '#E2E8F0'}`, paddingBottom: 0 }}>
                {[{ key: 'form', label: t('doc_tab_new') }, { key: 'history', label: t('doc_tab_history'), icon: Clock }].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 20px', border: 'none', background: 'none',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            borderBottom: activeTab === tab.key ? '2px solid #7C3AED' : '2px solid transparent',
                            color: activeTab === tab.key ? '#7C3AED' : (dark ? '#94A3B8' : '#64748B'),
                            marginBottom: -2, transition: 'all 200ms',
                        }}
                    >
                        {tab.icon && <tab.icon size={14} />}
                        {tab.label}
                        {tab.key === 'history' && invoices.length > 0 && (
                            <span style={{ background: '#7C3AED', color: 'white', borderRadius: 100, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{invoices.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Riwayat Tab */}
            {activeTab === 'history' && (
                <div>
                    {statusMenuOpen && <div onClick={() => setStatusMenuOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>}
                    {invoices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '64px 24px', color: dark ? '#64748B' : '#94A3B8' }}>
                            <Clock size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                            <p style={{ fontSize: 16, fontWeight: 600 }}>{t('doc_no_docs')}</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="overflow-x-auto pb-2 scrollbar-thin">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 'min-content' }}>
                                    {invoices.map(inv => {
                                        const st = STATUS_MAP[inv.status] || STATUS_MAP.unpaid;
                                        return (
                                            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: dark ? '#1E293B' : 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gap: 24, flexWrap: 'nowrap' }}>
                                                <div style={{ flex: '0 0 150px' }}>
                                                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: dark ? '#F1F5F9' : '#1E293B' }}>{inv.number}</p>
                                                    <p className="truncate max-w-[150px]" style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{inv.clientName || '—'}</p>
                                                </div>
                                                <div style={{ flex: '0 0 100px' }}>
                                                    <p style={{ margin: 0, fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{inv.date}</p>
                                                </div>
                                                <div style={{ flex: '0 0 120px' }}>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#7C3AED', whiteSpace: 'nowrap' }}>{formatCompactCurrency(inv.grandTotal || 0)}</p>
                                                </div>
                                                <div style={{ flex: '0 0 350px' }}>
                                                    <div style={{ display: 'flex', gap: 4, background: dark ? '#334155' : '#F1F5F9', padding: 3, borderRadius: 10, width: 'fit-content' }}>
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => handleUpdateStatus(inv.id, opt.value)}
                                                                style={{
                                                                    padding: '5px 10px',
                                                                    borderRadius: 7,
                                                                    border: 'none',
                                                                    background: inv.status === opt.value ? opt.color : 'transparent',
                                                                    color: inv.status === opt.value ? 'white' : (dark ? '#94A3B8' : '#64748B'),
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 200ms',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                    <button onClick={() => shareInvoiceViaWA(inv)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #10B981', background: 'none', color: '#10B981', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} title={t('share_wa')}>
                                                        💬 WA
                                                    </button>
                                                    <button onClick={() => handleViewHistory(inv)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3B82F6', background: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                        <Eye size={13} /> {t('doc_see')}
                                                    </button>
                                                    <button onClick={() => handleEditHistory(inv)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                        <Pencil size={13} /> {t('doc_edit')}
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(inv.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #EF4444', background: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                        <Trash2 size={13} /> {t('doc_delete')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete confirm overlay */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: dark ? '#1E293B' : 'white', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('inv_delete_title')}</h3>
                        <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 14 }}>{t('doc_delete_permanent')}</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">{t('kasir_cancel')}</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">{t('doc_delete')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview modal — centered, full detail */}
            {previewInvoice && ReactDOM.createPortal(
                <div onClick={() => setPreviewInvoice(null)}
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
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{t('nav_invoice').toUpperCase()}</h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                                    No: {previewInvoice.number} &middot; {lang === 'ID' ? formatDateID(previewInvoice.date) : previewInvoice.date}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setPreviewInvoice(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>{t('doc_close')}</button>
                                <button onClick={() => handleDownloadPDF(previewInvoice)} disabled={isDownloading} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                                    <Download size={16} /> {t('inv_download')}
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                            <div id="invoice-preview" style={{ padding: '48px', background: 'white', color: '#000', minHeight: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, borderBottom: '2px solid #F1F5F9', paddingBottom: 30 }}>
                                    <div>
                                        {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain', marginBottom: 16 }} /> : <div style={{ height: 40, width: 40, background: '#7C3AED', borderRadius: 8, marginBottom: 12 }} />}
                                        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: -1, color: '#111827' }}>{t('nav_invoice').toUpperCase()}</h1>
                                        <p style={{ margin: 0, color: '#64748B', fontWeight: 600 }}>#{previewInvoice.number}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('total_amount')}</p>
                                        <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(previewInvoice.grandTotal)}</p>
                                        <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>{lang === 'ID' ? formatDateID(previewInvoice.date) : previewInvoice.date}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginBottom: 40 }}>
                                    <div>
                                        <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('doc_bill_to')}</p>
                                        <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>{previewInvoice.clientName}</p>
                                        <p style={{ margin: 0, color: '#4B5563', fontSize: 13, lineHeight: 1.5 }}>{previewInvoice.address || '—'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('doc_from')}</p>
                                        <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>{user?.email?.split('@')[0] || 'My Company'}</p>
                                        <p style={{ margin: 0, color: '#4B5563', fontSize: 13 }}>{user?.email}</p>
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #111827' }}>
                                            <th style={{ padding: '12px 0', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', color: '#111827' }}>{t('inv_pdf_desc')}</th>
                                            <th style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, textTransform: 'uppercase', width: 60, color: '#111827' }}>{t('inv_pdf_qty')}</th>
                                            <th style={{ padding: '12px 0', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', width: 120, color: '#111827' }}>{t('inv_pdf_price')}</th>
                                            <th style={{ padding: '12px 0', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', width: 120, color: '#111827' }}>{t('inv_pdf_total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewInvoice.items?.map((it, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '16px 0', fontSize: 14, fontWeight: 600 }}>{it.name || it.desc}</td>
                                                <td style={{ padding: '16px 0', fontSize: 14, textAlign: 'center' }}>{it.qty}</td>
                                                <td style={{ padding: '16px 0', fontSize: 14, textAlign: 'right' }}>{formatIDR(it.price)}</td>
                                                <td style={{ padding: '16px 0', fontSize: 14, textAlign: 'right', fontWeight: 700 }}>{formatIDR(it.qty * it.price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 60 }}>
                                    <div style={{ width: 280 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#64748B' }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{t('inv_pdf_subtotal')}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700 }}>{formatIDR(previewInvoice.subtotal)}</span>
                                        </div>
                                        {previewInvoice.discount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#EF4444' }}>
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>{t('inv_discount')} {previewInvoice.discount}%</span>
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>- {formatIDR(previewInvoice.subtotal * previewInvoice.discount / 100)}</span>
                                            </div>
                                        )}
                                        {previewInvoice.tax > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#111827' }}>
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>{t('inv_tax')} {previewInvoice.tax}%</span>
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>+ {formatIDR((previewInvoice.subtotal - (previewInvoice.subtotal * (previewInvoice.discount || 0) / 100)) * previewInvoice.tax / 100)}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderTop: '2px solid #111827', marginTop: 10 }}>
                                            <span style={{ fontSize: 16, fontWeight: 900 }}>{t('inv_pdf_total')}</span>
                                            <span style={{ fontSize: 20, fontWeight: 900, color: '#7C3AED' }}>{formatIDR(previewInvoice.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 30, textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Thank you for your business.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Main form (only shown in form tab) */}
            {activeTab === 'form' && (

                <div className="split-layout">
                    {/* LEFT: Form */}
                    <div>
                        {/* Company Info */}
                        <div className="form-section" style={{ background: '#F5F3FF', borderLeft: '4px solid #7C3AED', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>{t('inv_company')}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                    <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, marginBottom: 4 }}>{t('inv_logo_label')}</span>
                                    <LogoUpload size="sm" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { key: 'companyName', label: t('inv_company_name'), full: true },
                                    { key: 'companyAddress', label: t('inv_address'), full: true },
                                    { key: 'companyCity', label: t('inv_city') },
                                    { key: 'companyPhone', label: t('inv_phone') },
                                    { key: 'companyEmail', label: t('inv_email'), type: 'email' },
                                    { key: 'companyWebsite', label: t('inv_website') },
                                ].map(f => (
                                    <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                                        <label className="label">{f.label}</label>
                                        <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="form-section" style={{ background: 'white', borderLeft: '4px solid #3B82F6', marginBottom: 16 }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#3B82F6' }}>{t('inv_client')}</h3>
                            {clients.length > 0 && (
                                <div className="form-group">
                                    <label className="label">{t('inv_client_pick')}</label>
                                    <select className="select" onChange={pickClient} defaultValue="">
                                        <option value="">{t('inv_client_ph')}</option>
                                        {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { key: 'clientName', label: t('inv_client_name'), full: true },
                                    { key: 'clientAddress', label: t('inv_address'), full: true },
                                    { key: 'clientPhone', label: t('inv_phone') },
                                    { key: 'clientEmail', label: t('inv_email'), type: 'email' },
                                ].map(f => (
                                    <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                                        <label className="label">{f.label}</label>
                                        <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="form-section" style={{ background: 'white', borderLeft: '4px solid #10B981', marginBottom: 16 }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#10B981' }}>{t('inv_detail')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="label">{t('inv_number')}</label>
                                        <input className="input" value={form.number} onChange={e => setField('number', e.target.value)} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="label">{t('inv_status')}</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                            {STATUS_OPTIONS.map(s => (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    onClick={() => setField('status', s.value)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: 8,
                                                        border: '2px solid',
                                                        borderColor: form.status === s.value ? s.color : (dark ? '#334155' : '#E2E8F0'),
                                                        background: form.status === s.value ? s.bg : 'transparent',
                                                        color: form.status === s.value ? s.color : (dark ? '#94A3B8' : '#64748B'),
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        transition: 'all 200ms',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4
                                                    }}
                                                >
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: form.status === s.value ? 'white' : s.color }} />
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">{t('inv_date')}</label>
                                    <input type="date" className="input" value={form.date} onChange={e => setField('date', e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">{t('inv_due_date')}</label>
                                    <input type="date" className="input" value={form.dueDate} onChange={e => setField('dueDate', e.target.value)} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="label">{t('inv_currency')}</label>
                                    <select className="select" value={form.currency} onChange={e => setField('currency', e.target.value)}>
                                        {['IDR', 'USD', 'EUR', 'SGD'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="form-section" style={{ background: 'white', borderLeft: '4px solid #10B981', marginBottom: 16 }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{t('inv_items_title')}</h3>
                            <div className="relative group">
                                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="overflow-x-auto pb-2 scrollbar-thin">
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 650, tableLayout: 'fixed' }}>
                                        <thead>
                                            <tr>
                                                {[
                                                    { h: t('inv_pdf_desc'), w: 'auto' },
                                                    { h: t('inv_pdf_qty'), w: '70px' },
                                                    { h: t('inv_qty'), w: '90px' },
                                                    { h: t('inv_price'), w: '140px' },
                                                    { h: t('inv_pdf_total'), w: '140px' },
                                                    { h: '', w: '40px' }
                                                ].map(col => (
                                                    <th key={col.h} style={{ padding: '6px 8px', textAlign: col.h === t('inv_pdf_total') || col.h === t('inv_price') ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#64748B', borderBottom: '1.5px solid #E2E8F0', textTransform: 'uppercase', width: col.w }}>{col.h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.items.map(item => (
                                                <tr key={item.id}>
                                                    <td style={{ padding: '4px 4px' }}>
                                                        <input className="input truncate max-w-[200px]" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} placeholder={t('inv_item_name')} style={{ padding: '7px 10px', fontSize: 13 }} title={item.desc} />
                                                    </td>
                                                    <td style={{ padding: '4px 4px', width: 64 }}>
                                                        <input className="input" type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ padding: '7px 8px', fontSize: 13, textAlign: 'center' }} placeholder="1" />
                                                    </td>
                                                    <td style={{ padding: '4px 4px', width: 80 }}>
                                                        <input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ padding: '7px 8px', fontSize: 13 }} />
                                                    </td>
                                                    <td style={{ padding: '4px 4px', width: 140 }}>
                                                        <input className="input whitespace-nowrap text-right" type="number" min="0" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ padding: '7px 10px', fontSize: 13, textAlign: 'right' }} placeholder="0" />
                                                    </td>
                                                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                                                        {formatIDR(item.total)}
                                                    </td>
                                                    <td style={{ padding: '4px 4px', width: 36 }}>
                                                        <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <button onClick={addItem} className="btn btn-sm btn-outline" style={{ marginTop: 10 }}>
                                <Plus size={14} /> {t('doc_add_item')}
                            </button>

                            {/* Totals */}
                            <div style={{ marginTop: 16, borderTop: '1.5px solid #E2E8F0', paddingTop: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: 280 }}>
                                        {[
                                            { label: t('inv_pdf_subtotal'), value: formatIDR(subtotal) },
                                        ].map(r => (
                                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontSize: 13, color: '#64748B' }}>{r.label}</span>
                                                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.value}</span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, color: '#64748B' }}>{t('inv_discount')}</span>
                                            <input type="number" min="0" max="100" value={form.discount === 0 || form.discount === '0' ? '' : form.discount} onChange={e => { const val = e.target.value; setField('discount', val === '' ? '' : Number(val)); }} className="input" style={{ width: 80, padding: '4px 8px', fontSize: 13, textAlign: 'right' }} placeholder="0" />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, color: '#64748B' }}>{t('inv_tax')}</span>
                                            <input type="number" min="0" max="100" value={form.tax === 0 || form.tax === '0' ? '' : form.tax} onChange={e => { const val = e.target.value; setField('tax', val === '' ? '' : Number(val)); }} className="input" style={{ width: 80, padding: '4px 8px', fontSize: 13, textAlign: 'right' }} placeholder="11" />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #7C3AED', marginTop: 8 }}>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>{t('inv_pdf_total')}</span>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>{formatIDR(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="form-section" style={{ background: '#F0F9FF', borderLeft: '4px solid #7C3AED', marginBottom: 16 }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>{t('inv_payment')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { key: 'bank', label: t('inv_bank') },
                                    { key: 'accountNumber', label: t('inv_account_no') },
                                    { key: 'accountName', label: t('inv_account_name'), full: true },
                                    { key: 'paymentInstructions', label: t('inv_payment_instructions'), full: true, textarea: true },
                                ].map(f => (
                                    <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                                        <label className="label">{f.label}</label>
                                        {f.textarea ? (
                                            <textarea className="textarea" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                        ) : (
                                            <input className="input" value={form[f.key]} onChange={e => setField(f.key, e.target.value)} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <label className="label">{t('inv_notes')}</label>
                            <textarea className="textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder={t('inv_extra_notes')} />
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div style={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dark ? '#F1F5F9' : '#1E293B' }}>{t('inv_preview')}</h3>
                        </div>
                        <div
                            id="invoice-preview"
                            style={{
                                background: 'white', color: '#000',
                                padding: 40, borderRadius: 8,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 12, lineHeight: '1.5',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                            }}
                        >
                            {/* Invoice Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                                <div>
                                    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#7C3AED', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                                        {t('nav_invoice').toUpperCase()}
                                    </h1>
                                    <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>{form.number}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {logo && (
                                        <img src={logo} alt="Logo" style={{ maxHeight: 64, maxWidth: 160, objectFit: 'contain', marginBottom: 8, display: 'block', marginLeft: 'auto' }} />
                                    )}
                                    {form.companyName && <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 15 }}>{form.companyName}</p>}
                                    {form.companyAddress && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.companyAddress}</p>}
                                    {form.companyCity && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.companyCity}</p>}
                                    {form.companyPhone && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.companyPhone}</p>}
                                    {form.companyEmail && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.companyEmail}</p>}
                                    {form.companyWebsite && <p style={{ margin: 0, fontSize: 11, color: '#7C3AED' }}>{form.companyWebsite}</p>}
                                </div>
                            </div>

                            {/* Status badge */}
                            <div style={{ marginBottom: 20 }}>
                                <span style={{
                                    display: 'inline-block', padding: '4px 12px', borderRadius: 100,
                                    background: statusObj.bg, color: statusObj.color, fontSize: 11, fontWeight: 700,
                                }}>
                                    {statusObj.label}
                                </span>
                            </div>

                            {/* Dates + Client */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div>
                                    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{t('inv_pdf_to')}</p>
                                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 13 }}>{form.clientName || '—'}</p>
                                    {form.clientAddress && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.clientAddress}</p>}
                                    {form.clientEmail && <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.clientEmail}</p>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ marginBottom: 6 }}>
                                        <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{t('inv_pdf_date')}</p>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{formatDateID(form.date)}</p>
                                    </div>
                                    {form.dueDate && (
                                        <div>
                                            <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{t('inv_pdf_due_date')}</p>
                                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#EF4444' }}>{formatDateID(form.dueDate)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, tableLayout: 'fixed' }}>
                                <thead>
                                    <tr style={{ background: '#7C3AED' }}>
                                        {[
                                            { h: t('inv_pdf_desc'), w: 'auto' },
                                            { h: t('inv_pdf_qty'), w: '50px' },
                                            { h: t('inv_pdf_unit'), w: '65px' },
                                            { h: t('inv_pdf_price'), w: '110px' },
                                            { h: t('inv_pdf_total'), w: '110px' }
                                        ].map((col, i) => (
                                            <th key={col.h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'white', textAlign: i >= 3 ? 'right' : (i === 1 ? 'center' : 'left'), textTransform: 'uppercase', width: col.w }}>{col.h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.filter(i => i.desc).map((item, idx) => (
                                        <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}>
                                            <td style={{ padding: '8px 10px', fontSize: 12, wordBreak: 'break-word' }}>{item.desc}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12 }}>{item.qty}</td>
                                            <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.unit}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12 }}>{formatIDR(item.price)}</td>
                                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, fontSize: 12 }}>{formatIDR(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                                <div style={{ width: 220 }}>
                                    {[
                                        { label: t('inv_pdf_subtotal'), val: formatIDR(subtotal) },
                                        form.discount > 0 && { label: `${t('inv_discount')} ${form.discount}%`, val: `- ${formatIDR(discountAmt)}` },
                                        form.tax > 0 && { label: `${t('inv_tax')} ${form.tax}%`, val: `+ ${formatIDR(taxAmt)}` },
                                    ].filter(Boolean).map(row => (
                                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, color: '#64748B' }}>{row.label}</span>
                                            <span style={{ fontSize: 11 }}>{row.val}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#7C3AED', borderRadius: 6, marginTop: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{t('inv_pdf_total')}</span>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            {(form.bank || form.accountNumber || form.accountName || form.paymentInstructions) && (
                                <div style={{ padding: '12px 16px', background: '#EDE9FE', borderRadius: 8, marginBottom: 12 }}>
                                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>{t('pdf_payment_info') || 'Informasi Pembayaran'}</p>
                                    {form.bank && <p style={{ margin: '0 0 2px', fontSize: 11 }}>{t('pdf_bank') || 'Bank'}: <strong>{form.bank}</strong></p>}
                                    {form.accountNumber && <p style={{ margin: '0 0 2px', fontSize: 11 }}>{t('pdf_account_no') || 'No. Rekening'}: <strong>{form.accountNumber}</strong></p>}
                                    {form.accountName && <p style={{ margin: '0 0 2px', fontSize: 11 }}>{t('pdf_account_name') || 'Atas Nama'}: <strong>{form.accountName}</strong></p>}
                                    {form.paymentInstructions && <p style={{ margin: '0 0 2px', fontSize: 11, whiteSpace: 'pre-wrap' }}>{form.paymentInstructions}</p>}
                                </div>
                            )}

                            {form.notes && (
                                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, borderLeft: '3px solid #E2E8F0' }}>
                                    <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{t('pdf_notes') || 'Catatan'}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.notes}</p>
                                </div>
                            )}

                            {/* Watermark for FREE users */}
                            {!isPremium && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 pointer-events-none italic">
                                    Generated by MyInvoice.space
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
            )}

            <UpgradeModal isOpen={!!upgradeFeatureType} onClose={() => setUpgradeFeatureType(null)} featureType={upgradeFeatureType} />
            {showLimitModal && <LimitModal plan="PRO" feature="Invoice" onClose={() => setShowLimitModal(false)} />}
        </div>
    );
}

