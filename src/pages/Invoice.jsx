import { useState, useRef, useEffect } from 'react';
import { Download, RotateCcw, Plus, Trash2, CheckCircle, Eye, Pencil, Clock, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatCurrency } from '../utils/currency';
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

const STATUS_OPTIONS = [
    { value: 'unpaid', label: 'Belum Bayar', color: '#EF4444', bg: '#FEE2E2' },
    { value: 'paid', label: 'Lunas', color: '#10B981', bg: '#D1FAE5' },
    { value: 'waiting', label: 'Menunggu', color: '#F59E0B', bg: '#FEF3C7' },
    { value: 'cancelled', label: 'Dibatalkan', color: '#64748B', bg: '#F1F5F9' },
];

export default function Invoice() {
    const { dark } = useTheme();
    const { t } = useLang();
    const { logo } = useCompanyLogo();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkInvoiceLimit, incrementInvoice, incrementKwitansi, refreshUsage, getInvoiceCount
    } = usePlan();
    const { user, effectivePlan, isAdmin, supabase } = useAuth();

    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);
    const [invoices, setInvoices] = useState([]); // Removed useLocalStorage
    const [kwitansiData, setKwitansiData] = useState([]);
    const [cashbook, setCashbook] = useState([]);
    const [clients, setClients] = useState([]);
    const [form, setForm] = useLocalStorage('draft_invoice', { ...defaultForm(), number: peekDocNumber('invoice') });
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
                id: d.id,
                user_id: d.user_id,
                number: d.number,
                clientName: d.client_name,
                total: d.total,
                grandTotal: d.grand_total,
                status: d.status,
                date: d.date,
                createdAt: d.created_at,
                ...(d.data || {}) // Spread nested data
            }));
            setInvoices(mapped);
        }
    };

    useEffect(() => {
        if (user) {
            fetchInvoices();
            fetchClients();
        }
    }, [user]);

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
                const updated = { ...item, [key]: val };
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
            number: num,
            client_name: form.clientName,
            total: subtotal,
            grand_total: grandTotal,
            status: finalStatus,
            date: form.date,
            data: { ...form, subtotal, discountAmt, taxAmt, grandTotal } // Store full data in JSONB
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
                description: `Pembayaran Invoice ${num}`,
                receiverName: form.companyName,
                createdAt: new Date().toISOString(),
            };
            setKwitansiData(prev => [newKwt, ...prev]);

            // Sync new receipt to Supabase
            await supabase.from('documents').insert({
                user_id: user.id,
                type: 'kwitansi',
                number: kwtNum,
                client_name: form.clientName,
                total: grandTotal,
                grand_total: grandTotal,
                date: todayStr(),
                data: {
                    receivedFrom: form.clientName,
                    amount: grandTotal,
                    description: `Pembayaran Invoice ${num}`,
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
                category: 'Invoice Lunas',
                note: `Invoice ${num} - ${form.clientName || 'Klien'} - Lunas`,
                date: todayStr(),
                source: 'auto',
                sourceLabel: `Auto dari Invoice`,
                reference_type: 'invoice',
                createdAt: new Date().toISOString(),
            };
            setCashbook(prev => [cashEntry, ...prev]);

            // Sync to Supabase cashbook
            try {
                const { error: cbErr } = await supabase.from('cashbook').insert({
                    user_id: user.id,
                    type: 'income',
                    amount: parseInt(grandTotal.toString().replace(/\D/g, ''), 10),
                    category: 'Invoice Lunas',
                    description: `Invoice ${num} - ${form.clientName || 'Klien'} - Lunas`,
                    date: todayStr()
                });
                if (cbErr) throw cbErr;
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



    const handleDownloadPDF = async () => {
        if (!isPro && !checkDownloadLimit()) {
            showToast(t('inv_download_limit'), 'warning');
            return;
        }
        setIsDownloading(true);
        try {
            await generatePDF('invoice-preview', `Invoice-${form.number || 'Draft'}.pdf`, isPremium);
            incrementDownload('invoice', form.number, grandTotal);
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
    const handleUpdateStatus = async (id, newStatus) => {
        const existing = invoices.find(inv => inv.id === id);
        if (!existing) return;
        if (existing.status === newStatus) {
            setStatusMenuOpen(null);
            return;
        }

        const oldStatus = existing.status;

        // 1. Optimistic UI Update
        setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
        setStatusMenuOpen(null);
        showToast(t('inv_status_updated'), 'success');
        window.dispatchEvent(new Event('invoice-updated'));
        window.dispatchEvent(new Event('cashbook-updated'));

        // 2. Background Sync
        try {
            await supabase.from('documents')
                .update({ status: newStatus })
                .eq('id', id);

            if (oldStatus === 'paid' && newStatus !== 'paid') {
                // Remove from cashbook
                await supabase.from('cashbook').delete().eq('user_id', user.id).eq('category', 'Invoice Lunas').ilike('description', `%${existing.number}%`);
                setCashbook(prev => prev.filter(c => !c.note.includes(existing.number)));
            } else if (oldStatus !== 'paid' && newStatus === 'paid') {
                // Add to cashbook
                try {
                    const { error: cbErr } = await supabase.from('cashbook').insert({
                        user_id: user.id,
                        type: 'income',
                        amount: parseInt(existing.grandTotal.toString().replace(/\D/g, ''), 10),
                        category: 'Invoice Lunas',
                        description: `Invoice ${existing.number} - ${existing.clientName || 'Klien'} - Lunas`,
                        date: todayStr()
                    });
                    if (cbErr) throw cbErr;
                } catch (err) {
                    console.error('Invoice Status to Cashbook sync error details:', err);
                }
                const cashEntry = {
                    id: Date.now().toString() + '_inv',
                    user_id: user.id,
                    type: 'income',
                    amount: existing.grandTotal,
                    category: 'Invoice Lunas',
                    note: `Invoice ${existing.number} - ${existing.clientName || 'Klien'} - Lunas`,
                    date: todayStr(),
                    source: 'auto',
                    sourceLabel: `Auto dari Invoice`,
                    reference_type: 'invoice',
                    createdAt: new Date().toISOString(),
                };
                setCashbook(prev => [cashEntry, ...prev]);
            }
        } catch (err) {
            console.error('Status sync error:', err);
            // Optionally could revert state here if critical
        }
    };

    const STATUS_MAP = {
        unpaid: { label: 'Belum Bayar', color: '#EF4444', bg: '#FEE2E2' },
        paid: { label: 'Lunas', color: '#10B981', bg: '#D1FAE5' },
        waiting: { label: 'Menunggu', color: '#F59E0B', bg: '#FEF3C7' },
        cancelled: { label: 'Dibatalkan', color: '#64748B', bg: '#F1F5F9' },
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
                            <button onClick={() => handleSave()} className="btn btn-outline">{t('inv_tab_save')}</button>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {invoices.map(inv => {
                                const st = STATUS_MAP[inv.status] || STATUS_MAP.unpaid;
                                return (
                                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: dark ? '#1E293B' : 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', gap: 12, flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: 150 }}>
                                            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: dark ? '#F1F5F9' : '#1E293B' }}>{inv.number}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{inv.clientName || '—'}</p>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 100 }}>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{inv.date}</p>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 120 }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#7C3AED' }}>{formatIDR(inv.grandTotal || 0)}</p>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <span
                                                onClick={() => setStatusMenuOpen(statusMenuOpen === inv.id ? null : inv.id)}
                                                style={{ padding: '3px 10px', borderRadius: 100, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                            >
                                                {st.label}
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                            </span>
                                            {statusMenuOpen === inv.id && (
                                                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: dark ? '#1E293B' : 'white', border: `1px solid ${dark ? '#334155' : '#E2E8F0'}`, borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', minWidth: 130 }}>
                                                    {STATUS_OPTIONS.map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => handleUpdateStatus(inv.id, opt.value)}
                                                            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: inv.status === opt.value ? (dark ? '#334155' : '#F1F5F9') : 'transparent', border: 'none', fontSize: 12, fontWeight: 600, color: dark ? '#F1F5F9' : '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                                        >
                                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }}></span>
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => handleViewHistory(inv)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #3B82F6', background: 'none', color: '#3B82F6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                <Eye size={13} /> {t('doc_see')}
                                            </button>
                                            <button onClick={() => handleEditHistory(inv)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                <Pencil size={13} /> Edit
                                            </button>
                                            <button onClick={() => setDeleteConfirm(inv.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #EF4444', background: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                <Trash2 size={13} /> {t('doc_delete')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
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
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Batal</button>
                            <button onClick={() => handleDeleteHistory(deleteConfirm)} className="btn btn-danger">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview modal — centered, full detail */}
            {previewInvoice && (() => {
                const st = STATUS_MAP[previewInvoice.status] || STATUS_MAP.unpaid;
                const inv = previewInvoice;
                const iSub = (inv.items || []).reduce((s, i) => s + (i.total || 0), 0);
                return (
                    <div
                        onClick={e => { if (e.target === e.currentTarget) setPreviewInvoice(null); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 99999, overflowY: 'auto' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '20px 16px' }}>
                            <div className="w-full max-w-5xl h-[90vh] overflow-y-auto" style={{ background: 'white', color: '#000', borderRadius: 16, padding: 0, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', position: 'relative', animation: 'scaleIn 180ms cubic-bezier(0.4,0,0.2,1) forwards' }}>
                                {/* Sticky header with actions */}
                                <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, borderRadius: '16px 16px 0 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#7C3AED', letterSpacing: 1 }}>INVOICE</h2>
                                        <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{inv.number}</span>
                                        <span style={{ padding: '3px 10px', borderRadius: 100, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700 }}>{st.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button onClick={() => { setPreviewInvoice(null); handleEditHistory(inv); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #F59E0B', background: 'none', color: '#F59E0B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Pencil size={13} /> Edit</button>
                                        <button onClick={async () => {
                                            if (!isPremium && !checkDownloadLimit()) {
                                                showToast(t('inv_download_limit_modal'), 'warning');
                                                return;
                                            }
                                            try {
                                                await generatePDF('inv-preview-' + inv.id, `Invoice-${inv.number}.pdf`, isPremium);
                                                if (!isPremium) {
                                                    incrementDownload('invoice', inv.number, inv.grandTotal, inv.clientName || '-');
                                                }
                                            } catch { }
                                        }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#7C3AED', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Download size={13} /> PDF</button>
                                        <button onClick={() => setPreviewInvoice(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} color="#64748B" /></button>
                                    </div>
                                </div>

                                {/* Hidden PDF target for this invoice */}
                                <div id={`inv-preview-${inv.id}`} style={{ position: 'fixed', left: '-9999px', top: 0, width: 794, background: 'white', color: '#000', fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 32, zIndex: -1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, borderBottom: '3px solid #7C3AED', paddingBottom: 16 }}>
                                        <div><h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 900, color: '#7C3AED' }}>INVOICE</h1><p style={{ margin: 0, color: '#64748B', fontSize: 12 }}>No: {inv.number}</p></div>
                                        <div style={{ textAlign: 'right' }}><p style={{ margin: '0 0 2px', fontSize: 12 }}>Tanggal: {inv.date}</p>{inv.dueDate && <p style={{ margin: 0, fontSize: 12, color: '#EF4444' }}>Jatuh Tempo: {inv.dueDate}</p>}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                        <div><p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: '#64748B' }}>KEPADA</p><p style={{ margin: '0 0 2px', fontWeight: 700 }}>{inv.clientName}</p><p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{inv.clientAddress}</p></div>
                                        <div style={{ textAlign: 'right' }}><p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, color: '#64748B' }}>DARI</p><p style={{ margin: 0, fontWeight: 700 }}>{inv.companyName}</p></div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                                        <thead><tr style={{ background: '#7C3AED' }}>{['Deskripsi', 'Qty', 'Satuan', 'Harga', 'Total'].map(h => <th key={h} style={{ padding: '6px 8px', color: 'white', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>{h}</th>)}</tr></thead>
                                        <tbody>{(inv.items || []).filter(i => i.desc).map((item, idx) => <tr key={idx} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}><td style={{ padding: '5px 8px', fontSize: 11 }}>{item.desc}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{item.qty}</td><td style={{ padding: '5px 8px', fontSize: 11 }}>{item.unit}</td><td style={{ padding: '5px 8px', fontSize: 11, textAlign: 'right' }}>{formatIDR(item.price)}</td><td style={{ padding: '5px 8px', fontSize: 11, textAlign: 'right', fontWeight: 700 }}>{formatIDR(item.total)}</td></tr>)}</tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ width: 200, padding: '10px 14px', background: '#7C3AED', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'white', fontWeight: 800 }}>TOTAL</span><span style={{ color: 'white', fontWeight: 800 }}>{formatIDR(inv.grandTotal || 0)}</span></div></div>
                                </div>

                                {/* Preview body */}
                                <div style={{ padding: '24px 28px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, borderLeft: '3px solid #3B82F6' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Kepada</p>
                                            <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#1E293B' }}>{inv.clientName || '—'}</p>
                                            {inv.clientAddress && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{inv.clientAddress}</p>}
                                            {inv.clientPhone && <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{inv.clientPhone}</p>}
                                        </div>
                                        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, borderLeft: '3px solid #7C3AED' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Info Invoice</p>
                                            {[['Tanggal', inv.date], ['Jatuh Tempo', inv.dueDate], ['Bank', inv.bank], ['No Rekening', inv.accountNumber]].filter(([, v]) => v).map(([l, v]) => <p key={l} style={{ margin: '0 0 2px', fontSize: 12 }}><strong>{l}:</strong> {v}</p>)}
                                        </div>
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                                        <thead><tr style={{ background: '#1E293B' }}>{['Deskripsi', 'Qty', 'Satuan', 'Harga Satuan', 'Total'].map(h => <th key={h} style={{ padding: '8px 12px', color: 'white', textAlign: 'left', fontSize: 11, fontWeight: 700 }}>{h}</th>)}</tr></thead>
                                        <tbody>
                                            {(inv.items || []).filter(i => i.desc).map((item, idx) => (
                                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white', borderBottom: '1px solid #F1F5F9' }}>
                                                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{item.desc}</td>
                                                    <td style={{ padding: '8px 12px', fontSize: 13 }}>{item.qty}</td>
                                                    <td style={{ padding: '8px 12px', fontSize: 13 }}>{item.unit}</td>
                                                    <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right' }}>{formatIDR(item.price)}</td>
                                                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, textAlign: 'right', color: '#7C3AED' }}>{formatIDR(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                        <div style={{ width: 240 }}>
                                            {[['Subtotal', formatIDR(iSub)], ...(inv.discountAmt > 0 ? [[`Diskon ${inv.discount}%`, `- ${formatIDR(inv.discountAmt)}`]] : []), ...(inv.taxAmt > 0 ? [[`Pajak ${inv.tax}%`, `+ ${formatIDR(inv.taxAmt)}`]] : [])].map(([l, v]) => (<div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13, color: '#64748B' }}>{l}</span><span style={{ fontSize: 13 }}>{v}</span></div>))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '10px 14px', background: '#7C3AED', borderRadius: 8 }}>
                                                <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>TOTAL</span>
                                                <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{formatIDR(inv.grandTotal || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {inv.notes && <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8 }}><p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Catatan</p><p style={{ margin: 0, fontSize: 13 }}>{inv.notes}</p></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

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
                                    <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, marginBottom: 4 }}>Logo Perusahaan</span>
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
                                    <label className="label">Pilih dari database klien</label>
                                    <select className="select" onChange={pickClient} defaultValue="">
                                        <option value="">-- Pilih Klien --</option>
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
                                        <select className="select" value={form.status} onChange={e => setField('status', e.target.value)}>
                                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
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
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                                    <thead>
                                        <tr>
                                            {['Deskripsi', 'Qty', 'Satuan', 'Harga', 'Total', ''].map(h => (
                                                <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Total' || h === 'Harga' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#64748B', borderBottom: '1.5px solid #E2E8F0', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.items.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ padding: '4px 4px' }}>
                                                    <input className="input" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} placeholder={t('inv_item_name')} style={{ padding: '7px 10px', fontSize: 13 }} />
                                                </td>
                                                <td style={{ padding: '4px 4px', width: 64 }}>
                                                    <input className="input" type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} style={{ padding: '7px 8px', fontSize: 13, textAlign: 'center' }} placeholder="1" />
                                                </td>
                                                <td style={{ padding: '4px 4px', width: 80 }}>
                                                    <input className="input" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ padding: '7px 8px', fontSize: 13 }} />
                                                </td>
                                                <td style={{ padding: '4px 4px', width: 120 }}>
                                                    <input className="input" type="number" min="0" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ padding: '7px 10px', fontSize: 13, textAlign: 'right' }} placeholder="0" />
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
                            <button onClick={addItem} className="btn btn-sm btn-outline" style={{ marginTop: 10 }}>
                                <Plus size={14} /> {t('doc_add_item')}
                            </button>

                            {/* Totals */}
                            <div style={{ marginTop: 16, borderTop: '1.5px solid #E2E8F0', paddingTop: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: 280 }}>
                                        {[
                                            { label: 'Subtotal', value: formatIDR(subtotal) },
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
                                            <span style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>Grand Total</span>
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
                                        INVOICE
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
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                                <thead>
                                    <tr style={{ background: '#7C3AED' }}>
                                        {[t('inv_pdf_desc'), t('inv_pdf_qty'), t('inv_pdf_unit'), t('inv_pdf_price'), t('inv_pdf_total')].map((h, i) => (
                                            <th key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'white', textAlign: i >= 3 ? 'right' : 'left', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.filter(i => i.desc).map((item, idx) => (
                                        <tr key={item.id} style={{ background: idx % 2 === 0 ? '#F8FAFC' : 'white' }}>
                                            <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.desc}</td>
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
                                    <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>Informasi Pembayaran</p>
                                    {form.bank && <p style={{ margin: '0 0 2px', fontSize: 11 }}>Bank: <strong>{form.bank}</strong></p>}
                                    {form.accountNumber && <p style={{ margin: '0 0 2px', fontSize: 11 }}>No. Rekening: <strong>{form.accountNumber}</strong></p>}
                                    {form.accountName && <p style={{ margin: '0 0 2px', fontSize: 11 }}>Atas Nama: <strong>{form.accountName}</strong></p>}
                                    {form.paymentInstructions && <p style={{ margin: '0 0 2px', fontSize: 11, whiteSpace: 'pre-wrap' }}>{form.paymentInstructions}</p>}
                                </div>
                            )}

                            {form.notes && (
                                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, borderLeft: '3px solid #E2E8F0' }}>
                                    <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Catatan</p>
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
