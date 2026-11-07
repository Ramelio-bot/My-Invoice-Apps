import { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Download, RotateCcw, Plus, Trash2, CheckCircle, Eye, Pencil, Clock, X, Copy, Search } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../context/ToastContext';
import { usePlan } from '../context/PlanContext';
import { useLang } from '../context/LanguageContext';
import { formatIDR, formatCompactCurrency, parseCurrency } from '../utils/currency';
import { formatDateID, todayStr, normalizeDateYMD } from '../utils/date';
import { peekDocNumber, incrementDocNumber } from '../utils/docNumber';
import { generatePDF } from '../utils/pdf';
import LogoUpload from '../components/LogoUpload';
import { useCompanyLogo } from '../hooks/useCompanyLogo';
import { useLocation } from 'react-router-dom';
import DocumentTemplate from '../components/DocumentTemplate';
import { runNative } from '../utils/platform';
import UpgradeModal from '../components/UpgradeModal';
import LimitModal from '../components/LimitModal';
import { useAuth } from '../context/AuthContext';
import { shareWhatsApp } from '../utils/whatsapp';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { supabase } from '../lib/supabase';
import DeleteReasonModal from '../components/DeleteReasonModal';
import { recordAudit } from '../utils/audit';
import { useOutlet } from '../context/OutletContext';

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
    bank: '', accountNumber: '', accountName: '', paymentInstructions: '', qrisUrl: '',
});



export default function Invoice() {
    const { t, lang } = useLang();
    const isEn = lang === 'EN';
    const { logo } = useCompanyLogo();
    const { showToast } = useToast();
    const {
        isPro, isPremium, checkDownloadLimit, incrementDownload,
        checkInvoiceLimit, incrementInvoice, incrementKwitansi
    } = usePlan();
    const { effectivePlan, isAdmin, user } = useAuth();
    const { profile: company } = useCompanyProfile();
    const { activeOutlet } = useOutlet();
    
    const STATUS_OPTIONS = useMemo(() => [
        { value: 'unpaid', label: t('inv_status_unpaid'), color: '#EF4444', bg: '#FEE2E2' },
        { value: 'paid', label: t('inv_status_paid'), color: '#10B981', bg: '#D1FAE5' },
        { value: 'waiting', label: t('inv_status_waiting'), color: '#F59E0B', bg: '#FEF3C7' },
        { value: 'cancelled', label: t('inv_status_cancelled'), color: '#64748B', bg: '#F1F5F9' },
    ], [t]);

    const [upgradeFeatureType, setUpgradeFeatureType] = useState(null);
    const [invoices, setInvoices] = useState([]); // Removed useLocalStorage
    const [, setKwitansiData] = useState([]);
    const [, setCashbook] = useState([]);
    const [clients, setClients] = useState([]);
    const [form, setForm] = useLocalStorage('draft_invoice', { ...defaultForm(), number: peekDocNumber('invoice') });
    const storeQris = form.qrisUrl || company?.store_qris_url || '';
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState('form');
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [statusMenuOpen, setStatusMenuOpen] = useState(null);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [waModalInvoice, setWaModalInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const location = useLocation();

    const metrics = useMemo(() => {
        const totalCount = invoices.length;
        const totalSum = invoices.reduce((s, i) => s + Number(i.grandTotal ?? i.total ?? 0), 0);
        const paidInvoices = invoices.filter(i => i.status === 'paid' || i.status === 'Lunas');
        const paidSum = paidInvoices.reduce((s, i) => s + Number(i.grandTotal ?? i.total ?? 0), 0);
        const unpaidInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'Lunas');
        const unpaidSum = unpaidInvoices.reduce((s, i) => s + Number(i.grandTotal ?? i.total ?? 0), 0);
        return {
            totalCount, totalSum,
            paidCount: paidInvoices.length, paidSum,
            unpaidCount: unpaidInvoices.length, unpaidSum
        };
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const numStr = (inv.number || '').toLowerCase();
            const clientStr = (inv.clientName || '').toLowerCase();
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || numStr.includes(q) || clientStr.includes(q);

            if (!matchesSearch) return false;

            if (statusFilter === 'all') return true;
            if (statusFilter === 'paid') return inv.status === 'paid' || inv.status === 'Lunas';
            if (statusFilter === 'unpaid') return inv.status === 'unpaid' || inv.status === 'Belum Dibayar';
            if (statusFilter === 'waiting') return inv.status === 'waiting' || inv.status === 'Menunggu';
            return true;
        });
    }, [invoices, searchQuery, statusFilter]);

    const fetchInvoices = async () => {
        if (!user) return;
        let query = supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id)
            .in('type', ['invoice', 'inv'])
            .order('created_at', { ascending: false });

        if (activeOutlet?.id) {
            query = query.or(`outlet_id.eq.${activeOutlet.id},outlet_id.is.null`);
        }

        const { data, error } = await query;

        if (!error && data) {
            const mapped = data.map(d => ({
                ...(d.data || {}),
                id: d.id,
                user_id: d.user_id,
                status: d.status,
                number: d.doc_number || d.number || (d.data || {}).number,
                clientName: d.client_name,
                total: d.total_amount || d.total,
                grandTotal: d.total_amount || (d.data || {}).grandTotal || d.total,
                createdAt: d.created_at,
                date: normalizeDateYMD((d.data || {}).date, d.created_at) || todayStr(),
            }));
            setInvoices(mapped);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchInvoices();
        fetchClients();
        const handleExternal = () => {
            if (user) fetchInvoices();
        };
        window.addEventListener('external-sync', handleExternal);
        window.addEventListener('focus', handleExternal);
        return () => {
            window.removeEventListener('external-sync', handleExternal);
            window.removeEventListener('focus', handleExternal);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, activeOutlet?.id]);

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
        if (invoiceId && invoices.length > 0) {
            const found = invoices.find(inv => inv.id === invoiceId);
            if (found) {
                setForm({ ...found });
                setActiveTab('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.history.replaceState({}, '');
            }
        }
    }, [location.state, invoices]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (!user) { showToast(t('login_required'), 'error'); return false; }

        // Cek limit untuk FREE plan (Invoice)
        const isEditing = invoices.some(inv => inv.number === form.number);
        if (!isPro && !isAdmin && !isEditing && !checkInvoiceLimit()) {
            setShowLimitModal(true);
            return false;
        }

        const num = form.number || incrementDocNumber('invoice');
        const finalStatus = isMarkingPaid ? 'paid' : form.status;
        const existing = invoices.find(inv => inv.number === num);
        const newlyPaid = (isMarkingPaid || (finalStatus === 'paid' && (!existing || existing.status !== 'paid')));

        if (isSaving) return;
        setIsSaving(true);

        // [PEMBANTAIAN DATE.NOW] — Hapus ID palsu dari objek lokal
        const invoiceBase = {
            ...form,
            status: finalStatus,
            number: num,
            subtotal, discountAmt, taxAmt, grandTotal,
        };

        // Persist to Supabase
        const dbInvoice = {
            user_id: user.id,
            type: 'invoice',
            doc_number: num,
            client_name: form.clientName,
            total_amount: grandTotal,
            status: finalStatus,
            outlet_id: activeOutlet?.id || null,
            data: { ...form, lang, subtotal, discountAmt, taxAmt, grandTotal }
        };

        try {
            let finalInv = null;
            
            if (existing && existing.id && existing.id.length > 15) { // UUID sah
                const { data: updated, error } = await supabase.from('documents').update(dbInvoice).eq('id', existing.id).eq('user_id', user.id).select().single();
                if (error) throw error;
                finalInv = { ...invoiceBase, id: updated.id, createdAt: updated.created_at };
            } else {
                // [OPERASI PENGECEKAN GANDA] — Cek ke DB sebelum insert, inklusif terhadap tipe legacy ('inv')
                const { data: dup } = await supabase.from('documents')
                    .select('id, created_at')
                    .eq('user_id', user.id)
                    .eq('doc_number', num)
                    .in('type', ['invoice', 'inv'])
                    .maybeSingle();

                if (dup) {
                    // Update record yang sudah ada di DB
                    const { data: updated, error } = await supabase.from('documents').update(dbInvoice).eq('id', dup.id).eq('user_id', user.id).select().single();
                    if (error) throw error;
                    finalInv = { ...invoiceBase, id: updated.id, createdAt: updated.created_at };
                } else {
                    // Benar-benar insert baru
                    delete dbInvoice.id;
                    const { data: saved, error } = await supabase.from('documents').insert(dbInvoice).select().single();
                    if (error) throw error;
                    if (saved) {
                        finalInv = { ...invoiceBase, id: saved.id, createdAt: saved.created_at };
                        incrementInvoice();
                        if (!existing) incrementDocNumber('invoice');
                    }
                }
            }

            if (!finalInv) throw new Error("Gagal memproses dokumen");

            // [MATIKAN ILUSI UI] — Update state HANYA jika berhasil
            setInvoices(prev => {
                const exists = prev.find(inv => inv.id === finalInv.id || inv.number === num);
                if (exists) return prev.map(inv => (inv.id === finalInv.id || inv.number === num) ? finalInv : inv);
                return [finalInv, ...prev];
            });

            await syncInvoicePayment(finalInv, finalStatus === 'paid', newlyPaid);

            if (isMarkingPaid) {
                setField('status', 'paid');
                showToast(t('inv_toast_paid_kwitansi'), 'success');
            } else {
                showToast(t('toast_update_success'), 'success');
            }
            
            window.dispatchEvent(new Event('invoice-updated'));
            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('data-updated'));
            return true;

        } catch (err) {
            console.error('Invoice sync error:', err);
            showToast(isEn ? "Failed to save! Connection or data error occurred." : "Gagal Simpan! Terjadi kesalahan koneksi atau data.", 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const syncInvoicePayment = async (invObj, isPaid, shouldCreateAutoKwitansi = false) => {
        if (!user || !invObj) return;
        const invNum = invObj.number || invObj.doc_number;
        const invAmount = Number(invObj.grandTotal ?? invObj.total_amount ?? invObj.total ?? 0);
        const invClient = invObj.clientName || invObj.client_name || 'Klien';
        const invCompany = invObj.companyName || company?.name || '';
        const invDate = normalizeDateYMD(invObj.date, invObj.createdAt || invObj.created_at) || todayStr();

        if (isPaid) {
            if (shouldCreateAutoKwitansi && invNum) {
                try {
                    const { data: existingAutoKwt } = await supabase.from('documents')
                        .select('id, doc_number, created_at')
                        .eq('user_id', user.id)
                        .in('type', ['kw', 'kwitansi'])
                        .ilike('data->>description', `%Invoice ${invNum}%`)
                        .maybeSingle();

                    const kwtNum = existingAutoKwt?.doc_number || incrementDocNumber('kwitansi');
                    const kwtPayload = {
                        user_id: user.id,
                        type: 'kw',
                        doc_number: kwtNum,
                        client_name: invClient,
                        total_amount: invAmount,
                        status: 'paid',
                        outlet_id: activeOutlet?.id || null,
                        data: {
                            receivedFrom: invClient,
                            amount: invAmount,
                            description: `${t('doc_pembayaran_invoice')} Invoice ${invNum}`,
                            receiverName: invCompany,
                            date: todayStr(),
                            status: 'paid',
                            autoFromInvoice: invNum
                        }
                    };

                    if (existingAutoKwt) {
                        const { data: savedKwt, error: kwtErr } = await supabase.from('documents').update(kwtPayload).eq('id', existingAutoKwt.id).select().single();
                        if (!kwtErr && savedKwt) {
                            const newKwt = { ...kwtPayload.data, id: savedKwt.id, number: kwtNum, createdAt: savedKwt.created_at };
                            setKwitansiData(prev => {
                                const exists = prev.find(k => k.id === savedKwt.id || k.number === kwtNum);
                                if (exists) return prev.map(k => (k.id === savedKwt.id || k.number === kwtNum) ? newKwt : k);
                                return [newKwt, ...prev];
                            });
                        }
                    } else {
                        const { data: savedKwt, error: kwtErr } = await supabase.from('documents').insert(kwtPayload).select().single();
                        if (!kwtErr && savedKwt) {
                            const newKwt = { ...kwtPayload.data, id: savedKwt.id, number: kwtNum, createdAt: savedKwt.created_at };
                            setKwitansiData(prev => [newKwt, ...prev]);
                            incrementKwitansi();
                        }
                    }
                } catch (kErr) {
                    console.error('Auto-Kwitansi Error:', kErr);
                }
            }

            try {
                const cashPayload = {
                    user_id: user.id,
                    type: 'income',
                    amount: invAmount,
                    category: t('inv_status_paid'),
                    description: `Invoice ${invNum} - ${invClient} - ${t('inv_status_paid')}`,
                    date: invDate,
                    reference_id: invObj.id ? String(invObj.id) : null,
                    document_id: invObj.id ? String(invObj.id) : null,
                    reference_type: 'invoice_paid',
                    is_automated: true,
                    outlet_id: activeOutlet?.id || null,
                };

                let dupCash = null;
                if (invObj.id) {
                    const { data: byRef } = await supabase.from('cashbook')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('reference_id', String(invObj.id))
                        .maybeSingle();
                    dupCash = byRef;
                }
                if (!dupCash && invNum) {
                    const { data: byDesc } = await supabase.from('cashbook')
                        .select('id')
                        .eq('user_id', user.id)
                        .ilike('description', `Invoice ${invNum} -%`)
                        .maybeSingle();
                    dupCash = byDesc;
                }

                if (dupCash) {
                    await supabase.from('cashbook').update(cashPayload).eq('id', dupCash.id);
                } else {
                    const { data: savedCash, error: cashErr } = await supabase.from('cashbook').insert(cashPayload).select().single();
                    if (!cashErr && savedCash) {
                        const cashEntry = {
                            id: savedCash.id,
                            type: savedCash.type,
                            amount: savedCash.amount,
                            category: savedCash.category,
                            note: savedCash.description,
                            date: savedCash.date,
                            createdAt: savedCash.created_at,
                            source: 'auto'
                        };
                        setCashbook(prev => [cashEntry, ...prev]);
                    }
                }
            } catch (cErr) {
                console.error('Auto-Cashbook Error:', cErr);
            }
        } else {
            try {
                if (invObj.id) {
                    await supabase.from('cashbook')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('reference_id', String(invObj.id));
                }
                if (invNum) {
                    await supabase.from('cashbook')
                        .delete()
                        .eq('user_id', user.id)
                        .ilike('description', `Invoice ${invNum} -%`);
                }
            } catch (delErr) {
                console.error('Auto-Cashbook Cleanup Error:', delErr);
            }
        }
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
            
            runNative(() => {
                // Future: Native printing or direct file saving
                
            });

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

    const handleDuplicate = () => {
        setForm(prev => {
            const newForm = { ...prev };
            delete newForm.id;
            delete newForm.created_at;
            newForm.number = peekDocNumber('invoice');
            newForm.status = 'unpaid';
            return newForm;
        });
        showToast(t('toast_duplicate_mode'), 'success');
    };

    // --- Riwayat Tab State ---
    const handleViewHistory = (inv) => setPreviewInvoice(inv);
    const handleEditHistory = (inv) => {
        setForm({ ...inv });
        setActiveTab('form');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const performDeleteHistory = async (id, reason) => {
        const invToDelete = invoices.find(i => i.id === id);
        if (!invToDelete) return;

        setLoading(true);
        try {
            // STEP 1: Catat audit DULU (sebelum delete) — wajib commit ke DB sebelum refresh
            const amount = invToDelete.grandTotal || invToDelete.total || 0;
            const severity = amount > 10000000 ? 'critical' : 'warning';
            await recordAudit(
                'DELETE', 
                'Invoice', 
                `Deleted Invoice #${invToDelete.number} for ${invToDelete.clientName} (Amount: ${formatCompactCurrency(amount)})`, 
                reason, 
                severity
            );

            // STEP 2: Hapus dokumen dari DB
            const { error } = await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id);
            if (error) throw error;
            // STEP 3: Bersihkan cashbook terkait
            if (id) {
                await supabase.from('cashbook')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('reference_id', String(id));
            }
            if (invToDelete.number || invToDelete.doc_number) {
                await supabase.from('cashbook')
                    .delete()
                    .eq('user_id', user.id)
                    .ilike('description', `%${invToDelete.number || invToDelete.doc_number}%`);
            }
            
            // STEP 4: Update UI state
            setInvoices(prev => prev.filter(i => i.id !== id));
            showToast(t('inv_doc_deleted'), 'info');
            
            // STEP 5: Broadcast event — PlanContext refresh dengan debounce 600ms
            window.dispatchEvent(new Event('cashbook-updated'));
            window.dispatchEvent(new Event('invoice-updated'));
            window.dispatchEvent(new Event('data-updated'));
        } catch (err) {
            console.error('Delete sync error:', err);
            showToast(t('toast_error_save'), 'error');
        } finally {
            setLoading(false);
            setDeleteConfirm(null);
        }
    };
    const handleUpdateStatus = async (invoiceId, newStatus) => {
        const oldInvoice = invoices.find(d => d.id === invoiceId);
        const docNumber = oldInvoice?.number || oldInvoice?.doc_number;
        const wasPaid = oldInvoice?.status === 'paid' || oldInvoice?.status === 'Lunas';
        const isNowPaid = newStatus === 'paid' || newStatus === 'Lunas';

        const updatedDataJson = oldInvoice
            ? { ...oldInvoice, status: newStatus }
            : undefined;
        if (updatedDataJson) {
            delete updatedDataJson.id;
            delete updatedDataJson.user_id;
        }

        const updateFields = updatedDataJson
            ? { status: newStatus, data: updatedDataJson }
            : { status: newStatus };

        let updateResult, error;
        ({ data: updateResult, error } = await supabase
            .from('documents')
            .update(updateFields)
            .eq('id', invoiceId)
            .eq('user_id', user.id)
            .select());

        if (!error && (!updateResult || updateResult.length === 0) && docNumber) {
            ({ data: updateResult, error } = await supabase
                .from('documents')
                .update(updateFields)
                .eq('doc_number', docNumber)
                .eq('user_id', user.id)
                .select());
        }

        if (error) {
            showToast((isEn ? 'Failed: ' : 'Gagal: ') + error.message, 'error');
            fetchInvoices();
            return;
        }

        if (!updateResult || updateResult.length === 0) {
            showToast(isEn ? 'Failed to save status' : 'Status gagal tersimpan', 'error');
            fetchInvoices();
            return;
        }

        const dbRow = updateResult[0];
        await syncInvoicePayment(
            {
                ...(oldInvoice || {}),
                ...(dbRow.data || {}),
                id: dbRow.id || invoiceId,
                number: dbRow.doc_number || docNumber,
                clientName: dbRow.client_name || oldInvoice?.clientName,
                grandTotal: dbRow.total_amount ?? oldInvoice?.grandTotal ?? oldInvoice?.total,
                createdAt: dbRow.created_at || oldInvoice?.createdAt,
                date: normalizeDateYMD((dbRow.data || {}).date || oldInvoice?.date, dbRow.created_at),
            },
            isNowPaid,
            isNowPaid && !wasPaid
        );

        setInvoices(prev => prev.map(doc =>
            (doc.id === invoiceId || doc.number === docNumber)
                ? { ...doc, status: newStatus }
                : doc
        ));

        showToast(t('toast_update_success'), 'success');
        window.dispatchEvent(new Event('cashbook-updated'));
        window.dispatchEvent(new Event('invoice-updated'));
        window.dispatchEvent(new Event('data-updated'));
    };

    const shareInvoiceViaWA = (invoice) => {
        setWaModalInvoice(invoice);
    };

    const executeShareInvoiceWA = (invoice, mode = 'standard') => {
        if (!invoice) return;
        const storeNameEffective = invoice.companyName || company?.name || company?.full_name || '';
        shareWhatsApp({
            phone: invoice.clientPhone || invoice.data?.clientPhone || invoice.data?.companyPhone || '',
            clientName: invoice.clientName || invoice.client_name || '-',
            docType: t('nav_invoice'),
            docNumber: invoice.number,
            date: formatDateID(invoice.date, lang),
            dueDate: invoice.dueDate ? formatDateID(invoice.dueDate, lang) : '',
            total: invoice.grandTotal ?? invoice.total ?? grandTotal,
            company: {
                ...company,
                name: storeNameEffective,
                company_name: storeNameEffective
            },
            t,
            isPremium,
            mode
        });
        setWaModalInvoice(null);
    };

    const STATUS_MAP = {
        unpaid: { label: t('inv_unpaid'), color: '#EF4444', bg: '#FEE2E2' },
        paid: { label: t('inv_paid'), color: '#10B981', bg: '#D1FAE5' },
        waiting: { label: t('inv_waiting'), color: '#F59E0B', bg: '#FEF3C7' },
        cancelled: { label: t('inv_cancelled'), color: '#64748B', bg: '#F1F5F9' },
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


    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
            <DocumentTemplate docType="invoice" />

            {/* TOP HEADER & METRICS */}
            <div style={{
                background: 'white',
                borderRadius: 16,
                padding: '20px 24px',
                border: '1px solid #E2E8F0',
                marginBottom: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />
                            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.3px' }}>
                                {t('nav_invoice')}
                            </h1>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                            {isEn ? 'Manage billing invoices, track client receivables, and issue receipts.' : 'Kelola faktur tagihan, pantau piutang klien, dan terbitkan kwitansi resmi.'}
                        </p>
                    </div>

                    {/* METRICS SUMMARY */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 12,
                            padding: '8px 14px',
                            textAlign: 'right'
                        }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', display: 'block' }}>
                                {isEn ? 'Total Billed' : 'Total Tagihan'}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#0F172A' }}>
                                {formatCompactCurrency(metrics.totalSum)}
                            </span>
                        </div>

                        <div style={{
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            borderRadius: 12,
                            padding: '8px 14px',
                            textAlign: 'right'
                        }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#047857', display: 'block' }}>
                                {isEn ? 'Paid' : 'Lunas'} ({metrics.paidCount})
                            </span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#065F46' }}>
                                {formatCompactCurrency(metrics.paidSum)}
                            </span>
                        </div>

                        <div style={{
                            background: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: 12,
                            padding: '8px 14px',
                            textAlign: 'right'
                        }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#B45309', display: 'block' }}>
                                {isEn ? 'Unpaid' : 'Belum Bayar'} ({metrics.unpaidCount})
                            </span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#92400E' }}>
                                {formatCompactCurrency(metrics.unpaidSum)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB CONTROLLER & ACTION TOOLBAR */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 20
            }}>
                <div style={{
                    display: 'inline-flex',
                    background: '#F1F5F9',
                    padding: 4,
                    borderRadius: 12,
                    border: '1px solid #E2E8F0'
                }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 9,
                            fontSize: 13,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 150ms',
                            background: activeTab === 'history' ? 'white' : 'transparent',
                            color: activeTab === 'history' ? '#0F172A' : '#64748B',
                            boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                        }}
                    >
                        <Clock size={15} />
                        <span>{isEn ? 'Invoice Ledger' : 'Daftar Invoice'}</span>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            background: activeTab === 'history' ? '#EDE9FE' : '#E2E8F0',
                            color: activeTab === 'history' ? '#7C3AED' : '#64748B',
                            padding: '1px 6px',
                            borderRadius: 99
                        }}>
                            {invoices.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('form')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 9,
                            fontSize: 13,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 150ms',
                            background: activeTab === 'form' ? 'white' : 'transparent',
                            color: activeTab === 'form' ? '#0F172A' : '#64748B',
                            boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                        }}
                    >
                        <Plus size={15} />
                        <span>{isEn ? 'Create New Invoice' : 'Buat Invoice Baru'}</span>
                    </button>
                </div>

                {/* ACTIONS WHEN IN FORM TAB */}
                {activeTab === 'form' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <button
                            onClick={handleReset}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, borderRadius: 10, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer', transition: 'all 150ms' }}
                            className="hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                        >
                            <RotateCcw size={14} /> {t('inv_reset')}
                        </button>
                        {form.id && (
                            <button
                                onClick={handleDuplicate}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'white', border: '1px solid #E2E8F0', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 150ms' }}
                                className="hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Copy size={14} /> {t('btn_duplicate')}
                            </button>
                        )}
                        {form.status === 'unpaid' && (
                            <button
                                onClick={handleMarkPaid}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 150ms' }}
                                className="hover:bg-emerald-100"
                            >
                                <CheckCircle size={14} /> {t('inv_mark_paid')}
                            </button>
                        )}
                        <button
                            onClick={() => shareInvoiceViaWA({ ...form, grandTotal })}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'white', border: '1px solid #E2E8F0', color: '#0F172A', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 150ms' }}
                            className="hover:bg-slate-50"
                        >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                            WhatsApp
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'white', border: '1px solid #E2E8F0', color: '#0F172A', fontWeight: 600, fontSize: 13, cursor: isDownloading ? 'not-allowed' : 'pointer', transition: 'all 150ms' }}
                            className="hover:bg-slate-50"
                        >
                            <Download size={14} /> {isDownloading ? t('doc_downloading') : t('inv_download')}
                        </button>
                        <button
                            onClick={() => handleSave()}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 10, background: isSaving ? '#94A3B8' : '#0F172A', border: 'none', color: 'white', fontWeight: 800, fontSize: 13, cursor: isSaving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.18)', transition: 'all 150ms' }}
                            className="hover:bg-black"
                        >
                            {isSaving ? '...' : <RotateCcw size={14} />}
                            {isSaving ? t('doc_saving') : t('doc_save')}
                        </button>
                    </div>
                )}
            </div>

            {/* Riwayat / Ledger Tab */}
            {activeTab === 'history' && (
                <div>
                    {statusMenuOpen && <div onClick={() => setStatusMenuOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }}></div>}

                    {/* Filter & Search Bar */}
                    <div style={{
                        background: 'white',
                        borderRadius: 14,
                        border: '1px solid #E2E8F0',
                        padding: '12px 16px',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12
                    }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {[
                                { key: 'all', label: isEn ? 'All' : 'Semua', count: invoices.length },
                                { key: 'unpaid', label: isEn ? 'Unpaid' : 'Belum Dibayar', count: metrics.unpaidCount },
                                { key: 'paid', label: isEn ? 'Paid' : 'Lunas', count: metrics.paidCount }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    onClick={() => setStatusFilter(filter.key)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: statusFilter === filter.key ? '#0F172A' : '#F1F5F9',
                                        color: statusFilter === filter.key ? 'white' : '#64748B',
                                        transition: 'all 150ms'
                                    }}
                                >
                                    {filter.label} ({filter.count})
                                </button>
                            ))}
                        </div>

                        <div style={{ position: 'relative', minWidth: 260 }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={isEn ? 'Search invoice number or client...' : 'Cari nomor invoice atau nama klien...'}
                                style={{
                                    width: '100%',
                                    padding: '7px 12px 7px 32px',
                                    borderRadius: 8,
                                    border: '1px solid #CBD5E1',
                                    fontSize: 12,
                                    outline: 'none',
                                    background: '#FAFAFA'
                                }}
                            />
                        </div>
                    </div>

                    {/* Modern Ledger Table */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                        {/* Table Header */}
                        <div className="hidden sm:grid" style={{
                            gridTemplateColumns: '1.4fr 1fr 1fr 0.9fr 1.5fr',
                            gap: 12,
                            padding: '12px 20px',
                            background: '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: '#64748B'
                        }}>
                            <div>{isEn ? 'Number & Client' : 'Nomor & Klien'}</div>
                            <div>{isEn ? 'Date & Due Date' : 'Tanggal & Jatuh Tempo'}</div>
                            <div style={{ textAlign: 'right' }}>{isEn ? 'Total Amount' : 'Nominal'}</div>
                            <div style={{ textAlign: 'center' }}>{isEn ? 'Status' : 'Status'}</div>
                            <div style={{ textAlign: 'right' }}>{isEn ? 'Quick Actions' : 'Aksi Cepat'}</div>
                        </div>

                        {/* Table Body */}
                        {filteredInvoices.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                                <Clock size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                    {searchQuery ? (isEn ? 'No invoice found matching your search.' : 'Tidak ada invoice yang sesuai dengan pencarian.') : (t('doc_no_docs') || 'Belum ada invoice')}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {filteredInvoices.map((inv, idx) => {
                                    const isPaid = inv.status === 'paid' || inv.status === 'Lunas';
                                    const isWaiting = inv.status === 'waiting' || inv.status === 'Menunggu';
                                    const isCancelled = inv.status === 'cancelled' || inv.status === 'Batal';
                                    const rowAmount = Number(inv.grandTotal ?? inv.total ?? 0);

                                    return (
                                        <div
                                            key={inv.id || inv.number || idx}
                                            style={{
                                                padding: '14px 20px',
                                                borderBottom: idx < filteredInvoices.length - 1 ? '1px solid #F1F5F9' : 'none',
                                                background: 'white',
                                                transition: 'background 120ms'
                                            }}
                                            className="hover:bg-slate-50/80 flex flex-col sm:grid sm:grid-cols-[1.4fr_1fr_1fr_0.9fr_1.5fr] gap-3 sm:gap-4 items-start sm:items-center"
                                        >
                                            {/* Col 1: Number & Client */}
                                            <div>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#0F172A', display: 'block' }}>
                                                    {inv.number}
                                                </span>
                                                <span style={{ fontSize: 12, color: '#64748B', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    {inv.clientName || '—'}
                                                </span>
                                            </div>

                                            {/* Col 2: Date & Due Date */}
                                            <div>
                                                <span style={{ fontSize: 12, color: '#334155', fontWeight: 600, display: 'block' }}>
                                                    {formatDateID(inv.date, lang)}
                                                </span>
                                                {inv.dueDate ? (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: isPaid ? '#10B981' : '#EF4444', display: 'block' }}>
                                                        {isPaid ? (isEn ? 'Paid' : 'Lunas') : `${isEn ? 'Due' : 'Tempo'}: ${formatDateID(inv.dueDate, lang)}`}
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Col 3: Nominal */}
                                            <div className="sm:text-right">
                                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: isPaid ? '#059669' : '#0F172A', display: 'block' }}>
                                                    {formatIDR(rowAmount)}
                                                </span>
                                                <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>
                                                    {inv.items?.length || 1} {isEn ? 'items' : 'item'}
                                                </span>
                                            </div>

                                            {/* Col 4: Status Badge */}
                                            <div className="sm:text-center">
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '3px 10px',
                                                    borderRadius: 99,
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    background: isPaid ? '#ECFDF5' : (isWaiting ? '#FFFBEB' : (isCancelled ? '#F1F5F9' : '#FEF2F2')),
                                                    color: isPaid ? '#047857' : (isWaiting ? '#B45309' : (isCancelled ? '#475569' : '#B91C1C')),
                                                    border: `1px solid ${isPaid ? '#A7F3D0' : (isWaiting ? '#FDE68A' : (isCancelled ? '#CBD5E1' : '#FECACA'))}`
                                                }}>
                                                    <span style={{
                                                        width: 5,
                                                        height: 5,
                                                        borderRadius: '50%',
                                                        background: isPaid ? '#10B981' : (isWaiting ? '#F59E0B' : (isCancelled ? '#64748B' : '#EF4444'))
                                                    }} />
                                                    {isPaid ? (isEn ? 'Paid' : 'Lunas') : (isWaiting ? (isEn ? 'Waiting' : 'Menunggu') : (isCancelled ? (isEn ? 'Cancelled' : 'Batal') : (isEn ? 'Unpaid' : 'Belum Dibayar')))}
                                                </span>
                                            </div>

                                            {/* Col 5: Quick Actions */}
                                            <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end gap-1.5 flex-wrap">
                                                {!isPaid && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(inv.id, 'paid')}
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: 7,
                                                            border: '1px solid #A7F3D0',
                                                            background: '#ECFDF5',
                                                            color: '#047857',
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            cursor: 'pointer'
                                                        }}
                                                        title={isEn ? 'Mark as Paid (Auto-generates Receipt)' : 'Tandai Lunas (Otomatis Buat Kwitansi)'}
                                                    >
                                                        {isEn ? 'Pay' : 'Tandai Lunas'}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => shareInvoiceViaWA(inv)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: 7,
                                                        border: '1px solid #E2E8F0',
                                                        background: '#F8FAFC',
                                                        color: '#10B981',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                    title="WhatsApp"
                                                >
                                                    WA
                                                </button>

                                                <button
                                                    onClick={() => handleViewHistory(inv)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: 7,
                                                        border: '1px solid #E2E8F0',
                                                        background: '#F8FAFC',
                                                        color: '#3B82F6',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                    title={t('doc_see') || 'Lihat'}
                                                >
                                                    <Eye size={13} />
                                                </button>

                                                <button
                                                    onClick={() => handleDownloadPDF(inv)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: 7,
                                                        border: '1px solid #E2E8F0',
                                                        background: '#F8FAFC',
                                                        color: '#64748B',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Download PDF"
                                                >
                                                    <Download size={13} />
                                                </button>

                                                <button
                                                    onClick={() => handleEditHistory(inv)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: 7,
                                                        border: '1px solid #E2E8F0',
                                                        background: '#F8FAFC',
                                                        color: '#F59E0B',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                    title={t('doc_edit') || 'Edit'}
                                                >
                                                    <Pencil size={13} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (isPro) {
                                                            setDeleteConfirm(inv);
                                                        } else {
                                                            if (window.confirm(t('confirm_delete_msg'))) {
                                                                performDeleteHistory(inv.id, 'N/A');
                                                            }
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: 7,
                                                        border: '1px solid #FEE2E2',
                                                        background: '#FEF2F2',
                                                        color: '#EF4444',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                    title={t('doc_delete') || 'Hapus'}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Royal Audit Log Deletion Modal */}
            <DeleteReasonModal 
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={(reason) => performDeleteHistory(deleteConfirm.id, reason)}
                itemName={deleteConfirm ? `${t('nav_invoice')} #${deleteConfirm.number}` : ''}
                loading={loading}
            />

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
                                    No: {previewInvoice.number} &middot; {formatDateID(previewInvoice.date, lang)}
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
                                        <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('total_amount') || (isEn ? 'TOTAL AMOUNT' : 'TOTAL TAGIHAN')}</p>
                                        <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{formatIDR(previewInvoice.grandTotal)}</p>
                                        <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 700, color: '#111827' }}>{formatDateID(previewInvoice.date, lang)}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginBottom: 40 }}>
                                    <div>
                                        <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('doc_bill_to') || (isEn ? 'BILL TO' : 'DITAGIHKAN KEPADA')}</p>
                                        <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>{previewInvoice.clientName || '—'}</p>
                                        <p style={{ margin: 0, color: '#4B5563', fontSize: 13, lineHeight: 1.5 }}>{previewInvoice.address || '—'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('doc_from') || (isEn ? 'FROM' : 'DARI')}</p>
                                        <p style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>{previewInvoice.companyName || company?.name || user?.user_metadata?.store_name || user?.email?.split('@')[0] || 'My Company'}</p>
                                        <p style={{ margin: 0, color: '#4B5563', fontSize: 13 }}>{previewInvoice.companyEmail || company?.email || user?.email}</p>
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
                                            <span style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>{formatIDR(previewInvoice.grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Info in Modal Preview */}
                                {(previewInvoice.bank || previewInvoice.accountNumber || previewInvoice.accountName || previewInvoice.paymentInstructions || previewInvoice.qrisUrl || company?.store_qris_url) && (
                                    <div style={{ padding: '14px 20px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('pdf_payment_info') || 'Informasi Pembayaran'}</p>
                                            {previewInvoice.bank && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#334155' }}>Bank: <strong>{previewInvoice.bank}</strong></p>}
                                            {previewInvoice.accountNumber && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#334155' }}>{t('pdf_account_no') || 'No. Rekening'}: <strong>{previewInvoice.accountNumber}</strong></p>}
                                            {previewInvoice.accountName && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#334155' }}>{t('pdf_account_name') || 'Atas Nama'}: <strong>{previewInvoice.accountName}</strong></p>}
                                            {previewInvoice.paymentInstructions && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#475569', whiteSpace: 'pre-wrap' }}>{previewInvoice.paymentInstructions}</p>}
                                        </div>
                                        {(previewInvoice.qrisUrl || company?.store_qris_url) && (
                                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                                <img src={previewInvoice.qrisUrl || company?.store_qris_url} alt="QRIS" style={{ width: 80, height: 80, objectFit: 'contain', background: 'white', padding: 4, borderRadius: 6, border: '1px solid #CBD5E1' }} />
                                                <p style={{ margin: '4px 0 0', fontSize: 9, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>{t('invoice_scan_qris')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 30, textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{t('inv_thanks_note')}</p>
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
                        <div className="form-section" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{t('inv_company')}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{t('inv_logo_label')}</span>
                                    <LogoUpload size="sm" />
                                </div>
                            </div>
                            <div className="responsive-form-grid" style={{ gap: 10 }}>
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
                        <div className="form-section" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{t('inv_client')}</h3>
                            {clients.length > 0 && (
                                <div className="form-group">
                                    <label className="label">{t('inv_client_pick')}</label>
                                    <select className="select" onChange={pickClient} defaultValue="">
                                        <option value="">{t('inv_client_ph')}</option>
                                        {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="responsive-form-grid" style={{ gap: 10 }}>
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
                        <div className="form-section" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{t('inv_detail')}</h3>
                            <div className="responsive-form-grid" style={{ gap: 10 }}>
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
                                                        borderColor: form.status === s.value ? s.color : '#E2E8F0',
                                                        background: form.status === s.value ? s.bg : 'transparent',
                                                        color: form.status === s.value ? s.color : '#64748B',
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
                        <div className="form-section" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{t('inv_items_title')}</h3>
                            <div className="relative group">
                                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #0F172A', marginTop: 8 }}>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{t('inv_pdf_total')}</span>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{formatIDR(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="form-section" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{t('inv_payment')}</h3>
                            <div className="responsive-form-grid" style={{ gap: 10 }}>
                                {storeQris && (
                                    <div style={{ gridColumn: '1 / -1', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <img src={storeQris} alt="QRIS" style={{ width: 36, height: 36, objectFit: 'contain', background: 'white', padding: 2, borderRadius: 4, border: '1px solid #E2E8F0' }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{t('invoice_qris_active')}</p>
                                                <p style={{ margin: 0, fontSize: 10, color: '#64748B' }}>{t('invoice_qris_desc') || 'QRIS automatically attached to invoice'}</p>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 100 }}>{t('invoice_qris_attached') || 'Active'}</span>
                                    </div>
                                )}
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
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{t('inv_preview')}</h3>
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
                                    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
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
                                    <tr style={{ background: '#0F172A' }}>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#0F172A', borderRadius: 6, marginTop: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{t('inv_pdf_total')}</span>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatIDR(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            {(form.bank || form.accountNumber || form.accountName || form.paymentInstructions || storeQris) && (
                                <div style={{ padding: '12px 16px', background: '#EDE9FE', borderRadius: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>{t('pdf_payment_info') || 'Informasi Pembayaran'}</p>
                                        {form.bank && <p style={{ margin: '0 0 2px', fontSize: 11 }}>{t('pdf_bank') || 'Bank'}: <strong>{form.bank}</strong></p>}
                                        {form.accountNumber && <p style={{ margin: '0 0 2px', fontSize: 11 }}>{t('pdf_account_no') || 'No. Rekening'}: <strong>{form.accountNumber}</strong></p>}
                                        {form.accountName && <p style={{ margin: '0 0 2px', fontSize: 11 }}>{t('pdf_account_name') || 'Atas Nama'}: <strong>{form.accountName}</strong></p>}
                                        {form.paymentInstructions && <p style={{ margin: '0 0 2px', fontSize: 11, whiteSpace: 'pre-wrap' }}>{form.paymentInstructions}</p>}
                                    </div>
                                    {storeQris && (
                                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                            <img src={storeQris} alt="QRIS" style={{ width: 72, height: 72, objectFit: 'contain', background: 'white', padding: 4, borderRadius: 6, border: '1px solid #DDD6FE' }} />
                                            <p style={{ margin: '3px 0 0', fontSize: 9, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>{t('invoice_scan_qris')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {form.notes && (
                                <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, borderLeft: '3px solid #E2E8F0' }}>
                                    <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{t('pdf_notes') || 'Catatan'}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>{form.notes}</p>
                                </div>
                            )}

                            {/* Watermark for FREE users only (PRO, ULTIMATE & Admin are 100% clean) */}
                            {(effectivePlan === 'free' && !isAdmin) && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-zinc-400 pointer-events-none italic whitespace-nowrap">
                                    {t('free_watermark') || 'Powered by MyInvoice.space — Free POS & Invoice App'}
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
            )}

            {/* Smart WhatsApp Follow-Up Modal */}
            {waModalInvoice && ReactDOM.createPortal(
                <div
                    onClick={() => setWaModalInvoice(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15,23,42,0.75)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: 20,
                            width: '100%',
                            maxWidth: 480,
                            padding: 24,
                            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                            border: '1px solid #E2E8F0'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                    {isEn ? 'Smart WhatsApp Billing' : 'Asisten Tagih WhatsApp'}
                                </span>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                                    {isEn ? 'Choose WhatsApp Message Tone' : 'Pilih Gaya Pesan WhatsApp'}
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>
                                    {waModalInvoice.number} &bull; {waModalInvoice.clientName || (isEn ? 'Client' : 'Klien')}
                                </p>
                            </div>
                            <button
                                onClick={() => setWaModalInvoice(null)}
                                style={{ background: '#F1F5F9', border: 'none', borderRadius: 10, padding: 6, cursor: 'pointer', color: '#64748B' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                            {[
                                {
                                    mode: 'standard',
                                    badge: isEn ? 'NEW INVOICE' : 'TAGIHAN BARU',
                                    badgeBg: '#EFF6FF',
                                    badgeColor: '#2563EB',
                                    title: isEn ? 'Send Official Invoice' : 'Kirim Tagihan Baru (Standar)',
                                    desc: isEn
                                        ? 'Formal greeting with document number, issue date, and total amount.'
                                        : 'Pesan formal pengiriman invoice baru lengkap dengan nomor & total tagihan.'
                                },
                                {
                                    mode: 'reminder',
                                    badge: isEn ? 'POLITE REMINDER' : 'ANTI-SUNGKAN',
                                    badgeBg: '#FEF3C7',
                                    badgeColor: '#D97706',
                                    title: isEn ? 'Friendly Payment Reminder' : 'Pengingat Sopan & Ramah',
                                    desc: isEn
                                        ? 'Warm, respectful reminder for clients approaching or on the due date.'
                                        : 'Bahasa halus dan santun untuk mengingatkan klien tanpa terasa mendesak.'
                                },
                                {
                                    mode: 'overdue',
                                    badge: isEn ? 'OVERDUE' : 'JATUH TEMPO',
                                    badgeBg: '#FEE2E2',
                                    badgeColor: '#DC2626',
                                    title: isEn ? 'Overdue Payment Follow-Up' : 'Tindak Lanjut Lewat Jatuh Tempo',
                                    desc: isEn
                                        ? 'Firm yet professional accounting follow-up requesting payment schedule confirmation.'
                                        : 'Bahasa tegas namun tetap profesional untuk menanyakan kepastian jadwal bayar.'
                                },
                                {
                                    mode: 'thank_you',
                                    badge: isEn ? 'PAID IN FULL' : 'KONFIRMASI LUNAS',
                                    badgeBg: '#DCFCE7',
                                    badgeColor: '#16A34A',
                                    title: isEn ? 'Payment Received Thank-You' : 'Konfirmasi Terima Pembayaran (LUNAS)',
                                    desc: isEn
                                        ? 'Send official confirmation and appreciation after client completes payment.'
                                        : 'Kirim bukti konfirmasi bahwa pembayaran telah diterima dan tercatat LUNAS.'
                                }
                            ].map(opt => (
                                <button
                                    key={opt.mode}
                                    onClick={() => executeShareInvoiceWA(waModalInvoice, opt.mode)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '12px 14px',
                                        borderRadius: 12,
                                        border: '1.5px solid #E2E8F0',
                                        background: '#F8FAFC',
                                        cursor: 'pointer',
                                        transition: 'all 150ms'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{opt.title}</span>
                                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: opt.badgeBg, color: opt.badgeColor }}>
                                            {opt.badge}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 11.5, color: '#64748B', lineHeight: 1.45 }}>{opt.desc}</p>
                                </button>
                            ))}
                        </div>

                        {!isPremium && (
                            <div style={{ padding: '10px 12px', borderRadius: 10, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <p style={{ margin: 0, fontSize: 11, color: '#5B21B6', lineHeight: 1.4 }}>
                                    {isEn
                                        ? 'Free plan includes "Generated via myinvoice.space" footer. Upgrade to PRO for 100% White-Label messages.'
                                        : 'Paket Gratis menyertakan footer "Dibuat otomatis via myinvoice.space". Upgrade PRO untuk pesan 100% White-Label.'}
                                </p>
                                <button
                                    onClick={() => {
                                        setWaModalInvoice(null);
                                        setUpgradeFeatureType('invoice');
                                    }}
                                    style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 8, background: '#7C3AED', color: 'white', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {isEn ? 'Go PRO' : 'Buka PRO'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            <UpgradeModal isOpen={!!upgradeFeatureType} onClose={() => setUpgradeFeatureType(null)} featureType={upgradeFeatureType} />
            {showLimitModal && <LimitModal plan="PRO" feature="Invoice" onClose={() => setShowLimitModal(false)} />}
        </div>
    );
}

